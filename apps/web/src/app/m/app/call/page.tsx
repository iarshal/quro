'use client';

/**
 * Call Page — Real WebRTC Video & Audio calls
 * URL: /m/app/call?contact=QURO_ID&type=video|audio
 * 
 * Uses WebSocket signaling for:
 * - SDP offer/answer exchange
 * - ICE candidate relay
 * - Call end/reject notifications
 * 
 * WebRTC peer connection for direct media streaming.
 * HD 720p video, Opus audio codec.
 */

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, ChevronLeft, Mic, MicOff, Phone, PhoneOff, ShieldCheck, Volume2, VolumeX } from 'lucide-react';
import { getContact, type QuroContact } from '../../../../lib/contactsStore';
import { quroWS } from '../../../../lib/websocket';
import { getSession } from '../../../../lib/localSession';
import { startPremiumRingtone, type RingtoneHandle } from '../../../../lib/ringtone';

type CallState = 'ringing' | 'connected' | 'ended';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

function CallContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contactId = searchParams.get('contact') || '';
  const callType = (searchParams.get('type') || 'audio') as 'video' | 'audio';
  const isIncoming = searchParams.get('incoming') === 'true';

  const [contact, setContact] = useState<QuroContact | null>(null);
  const [callState, setCallState] = useState<CallState>(isIncoming ? 'ringing' : 'ringing');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(callType === 'audio');
  const [isVideoCall] = useState(callType === 'video');
  const [callNotice, setCallNotice] = useState('');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const ringTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outgoingRingtoneRef = useRef<RingtoneHandle | null>(null);
  const cleanupDoneRef = useRef(false);
  const callStateRef = useRef<CallState>(callState);
  const pendingOfferRef = useRef<any>(null);

  useEffect(() => {
    callStateRef.current = callState;
    if (callState !== 'ringing') {
      outgoingRingtoneRef.current?.stop();
      outgoingRingtoneRef.current = null;
    }
  }, [callState]);

  // Load contact
  useEffect(() => {
    (async () => {
      if (contactId) {
        const c = await getContact(contactId);
        setContact(c || { quroCode: contactId, displayName: `User ${contactId.slice(0, 6)}`, addedAt: '' });
      }
    })();
  }, [contactId]);

  // Setup WebRTC + signaling
  useEffect(() => {
    let cancelled = false;

    async function setupCall() {
      const session = getSession();
      if (!session) {
        router.replace('/');
        return;
      }

      // Allow calling self for testing purposes


      if (!quroWS.connected) {
        quroWS.connect(session.quroId, '');
      }

      if (isIncoming) {
        pendingOfferRef.current = quroWS.getPendingCallOffer(contactId);
      }

      // 1. Get local media
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: isVideoCall ? { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (err) {
        console.error('[Call] Media access failed:', err);
        setCallNotice('Camera or microphone permission is required for calls.');
        setCallState('ended');
        setTimeout(() => router.back(), 2400);
        return;
      }

      // 2. Create peer connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      // Add local tracks to peer connection
      localStreamRef.current?.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        if (!cancelled) setCallState('connected');
      };

      // Send ICE candidates to remote peer via WebSocket
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          quroWS.sendIceCandidate(contactId, event.candidate.toJSON());
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected' && !cancelled) {
          setCallState('connected');
        }
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          if (!cancelled) endCall(false);
        }
      };

      // 3. If outgoing call, create offer and send it
      if (!isIncoming) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        quroWS.sendCallOffer(contactId, JSON.stringify(offer), callType);
        outgoingRingtoneRef.current = startPremiumRingtone('outgoing');

        // Simulate ring timeout (30s)
        ringTimeoutRef.current = setTimeout(() => {
          if (!cancelled && callStateRef.current === 'ringing') {
            endCall(false);
          }
        }, 30000);
      }
    }

    setupCall();

    // Listen for signaling messages
    const unsubs = [
      quroWS.on('call_answer', async (data: any) => {
        if (data.from !== contactId) return;
        const answer = JSON.parse(data.sdp);
        await pcRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
        if (!cancelled) setCallState('connected');
      }),

      quroWS.on('ice_candidate', async (data: any) => {
        if (data.from !== contactId) return;
        try {
          await pcRef.current?.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error('[Call] ICE candidate error:', e);
        }
      }),

      quroWS.on('call_offer', async (data: any) => {
        if (data.from !== contactId || !isIncoming) return;
        pendingOfferRef.current = data;
      }),

      quroWS.on('call_end', (data: any) => {
        if (data.from === contactId && !cancelled) endCall(false);
      }),

      quroWS.on('call_reject', (data: any) => {
        if (data.from === contactId && !cancelled) endCall(false);
      }),

      quroWS.on('call_unavailable', () => {
        if (!cancelled) {
          setCallNotice('No other active device is online for this contact.');
          endCall(false, 2400);
        }
      }),
    ];

    return () => {
      cancelled = true;
      unsubs.forEach(fn => fn());
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId, isVideoCall, isIncoming, router]);

  // Call timer
  useEffect(() => {
    if (callState !== 'connected') return;
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  const formatDuration = useCallback((s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }, []);

  function toggleMute() {
    setIsMuted(prev => {
      const next = !prev;
      localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !next; });
      return next;
    });
  }

  function toggleCamera() {
    setIsCameraOff(prev => {
      const next = !prev;
      localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !next; });
      return next;
    });
  }

  function endCall(notifyRemote = true, delayMs = 1500) {
    if (cleanupDoneRef.current) return;
    cleanupDoneRef.current = true;
    setCallState('ended');
    if (notifyRemote) quroWS.sendCallEnd(contactId);
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    outgoingRingtoneRef.current?.stop();
    outgoingRingtoneRef.current = null;
    setTimeout(() => router.back(), delayMs);
  }

  async function answerCall() {
    if (!isIncoming || !pcRef.current) return;

    const pendingOffer = pendingOfferRef.current || quroWS.consumePendingCallOffer(contactId);
    if (!pendingOffer?.sdp) {
      endCall(false);
      return;
    }

    try {
      const offer = JSON.parse(pendingOffer.sdp);
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      quroWS.sendCallAnswer(contactId, JSON.stringify(answer));
      quroWS.consumePendingCallOffer(contactId);
      setCallState('connected');
    } catch (err) {
      console.error('[Call] Failed to answer call:', err);
      endCall(false);
    }
  }

  function rejectCall() {
    quroWS.sendCallReject(contactId);
    endCall(false);
  }

  const displayName = contact?.displayName || 'Unknown';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: '#0B0B0F',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Inter', -apple-system, sans-serif",
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(1.6); opacity: 0; } }
      `}</style>

      {/* Remote video (full screen background for video calls) */}
      {isVideoCall && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 1, backgroundColor: '#0B0B0F',
          }}
        />
      )}

      {/* Dark overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2,
        background: isVideoCall && callState === 'connected'
          ? 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 30%, transparent 60%, rgba(0,0,0,0.7) 100%)'
          : 'radial-gradient(ellipse at 50% 30%, #1a1a2e 0%, #0B0B0F 70%)',
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => endCall()} style={{ width: 42, height: 42, borderRadius: 21, background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(14px)' }}>
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
          {callState === 'connected' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'rgba(16,185,129,0.15)', borderRadius: 20 }}>
              <ShieldCheck size={15} color="#10B981" strokeWidth={2.4} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#10B981' }}>End-to-End Encrypted</span>
            </div>
          )}
          <div style={{ width: 40 }} />
        </div>

        {/* Center — Contact info */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
          <div style={{ position: 'relative', marginBottom: 8 }}>
            {callState === 'ringing' && (
              <>
                <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', border: '2px solid rgba(59,130,246,0.3)', animation: 'pulse-ring 2s ease-out infinite' }} />
                <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', border: '2px solid rgba(59,130,246,0.2)', animation: 'pulse-ring 2s ease-out 0.5s infinite' }} />
              </>
            )}
            <motion.div
              animate={callState === 'ringing' ? { scale: [1, 1.03, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{
                width: 120, height: 120, borderRadius: '50%',
                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(59,130,246,0.25)',
              }}
            >
              {contact?.avatarDataUrl ? (
                <img src={contact.avatarDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                <span style={{ color: '#fff', fontSize: 48, fontWeight: 800 }}>{initial}</span>
              )}
            </motion.div>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0 }}>{displayName}</h1>

          <AnimatePresence mode="wait">
            <motion.p key={callState} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', margin: 0, fontWeight: 500 }}>
              {callState === 'ringing' && (isIncoming ? 'Incoming call...' : (isVideoCall ? 'Video calling...' : 'Calling...'))}
              {callState === 'connected' && formatDuration(duration)}
              {callState === 'ended' && (callNotice || 'Call ended')}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Self-view PiP for video calls */}
        {isVideoCall && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            drag
            dragMomentum={false}
            dragElastic={0.08}
            dragConstraints={{ left: -260, right: 12, top: -42, bottom: 420 }}
            style={{
              position: 'absolute', top: 80, right: 16,
              width: 124, height: 176, borderRadius: 18,
              overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.22)', zIndex: 10,
              cursor: 'grab',
              touchAction: 'none',
            }}>
            <video ref={localVideoRef} autoPlay playsInline muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', backgroundColor: '#1a1a2e' }} />
            {isCameraOff && (
              <div style={{ position: 'absolute', inset: 0, backgroundColor: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CameraOff size={34} color="#737373" strokeWidth={2.2} />
              </div>
            )}
          </motion.div>
        )}

        {/* Call controls */}
        <div style={{ padding: '24px 32px 48px', display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
          {/* For incoming ringing calls: Answer + Reject */}
          {isIncoming && callState === 'ringing' ? (
            <>
              <motion.button whileTap={{ scale: 0.9 }} onClick={rejectCall}
                style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#EF4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(239,68,68,0.4)' }}>
                <PhoneOff size={29} color="#fff" strokeWidth={2.5} />
              </motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={answerCall}
                style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#10B981', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(16,185,129,0.4)' }}>
                <Phone size={29} color="#fff" strokeWidth={2.5} />
              </motion.button>
            </>
          ) : (
            <>
              {/* Mute */}
              <button onClick={toggleMute} style={{
                width: 56, height: 56, borderRadius: 28,
                backgroundColor: isMuted ? '#fff' : 'rgba(255,255,255,0.12)',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
              }}>
                {isMuted ? <MicOff size={24} color="#111" strokeWidth={2.2} /> : <Mic size={24} color="#fff" strokeWidth={2.2} />}
              </button>

              {/* Speaker */}
              <button onClick={() => setIsSpeaker(s => !s)} style={{
                width: 56, height: 56, borderRadius: 28,
                backgroundColor: isSpeaker ? '#fff' : 'rgba(255,255,255,0.12)',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
              }}>
                {isSpeaker ? <VolumeX size={24} color="#111" strokeWidth={2.2} /> : <Volume2 size={24} color="#fff" strokeWidth={2.2} />}
              </button>

              {/* Camera toggle (video only) */}
              {isVideoCall && (
                <button onClick={toggleCamera} style={{
                  width: 56, height: 56, borderRadius: 28,
                  backgroundColor: isCameraOff ? '#fff' : 'rgba(255,255,255,0.12)',
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                }}>
                  {isCameraOff ? <CameraOff size={24} color="#111" strokeWidth={2.2} /> : <Camera size={24} color="#fff" strokeWidth={2.2} />}
                </button>
              )}

              {/* End call */}
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => endCall()}
                style={{
                  width: 64, height: 56, borderRadius: 28, backgroundColor: '#EF4444',
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(239,68,68,0.4)',
                }}>
                <PhoneOff size={29} color="#fff" strokeWidth={2.5} />
              </motion.button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CallPage() {
  const SafeSuspense = Suspense as any;
  return (
    <SafeSuspense fallback={<div style={{ position: 'fixed', inset: 0, backgroundColor: '#0B0B0F' }} />}>
      <CallContent />
    </SafeSuspense>
  );
}
