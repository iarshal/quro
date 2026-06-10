'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface VideoCallRoomProps {
  roomID: string;
  userID: string;
  contactID: string;
  isCaller: boolean;
  userName: string;
  onLeave: () => void;
}

export default function VideoCallRoom({
  roomID,
  userID,
  contactID,
  isCaller,
  userName,
  onLeave
}: VideoCallRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const fullVideoRef = useRef<HTMLVideoElement>(null);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isLocalPIP, setIsLocalPIP] = useState(true); // True if local video is in PIP
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const channelRef = useRef<any>(null);

  // Set up WebRTC connection
  useEffect(() => {
    let isMounted = true;

    const initWebRTC = async () => {
      try {
        // 1. Get local media with optimized constraints for smooth P2P video
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: { 
            width: { ideal: 640 }, 
            height: { ideal: 480 }, 
            frameRate: { ideal: 24 } 
          } 
        });
        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        localStreamRef.current = stream;
        updateVideoAttachments();

        // 2. Create Peer Connection with robust STUN and TURN servers for long-distance/cellular NAT traversal
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            {
              urls: 'turn:openrelay.metered.ca:80',
              username: 'openrelayproject',
              credential: 'openrelayproject'
            },
            {
              urls: 'turn:openrelay.metered.ca:443',
              username: 'openrelayproject',
              credential: 'openrelayproject'
            },
            {
              urls: 'turn:openrelay.metered.ca:443?transport=tcp',
              username: 'openrelayproject',
              credential: 'openrelayproject'
            }
          ]
        });
        peerConnectionRef.current = pc;

        // Add local tracks to PC
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });

        // Handle incoming remote track
        pc.ontrack = (event) => {
          if (!remoteStreamRef.current) {
            remoteStreamRef.current = new MediaStream();
          }
          remoteStreamRef.current.addTrack(event.track);
          setHasRemoteVideo(true);
          updateVideoAttachments();
        };

        // 3. Set up Supabase signaling channel
        const channel = supabase.channel(`webrtc_${roomID}`, {
          config: {
            broadcast: { ack: false, self: false },
          },
        });
        channelRef.current = channel;

        let handshakeInterval: any;
        const iceQueue: RTCIceCandidateInit[] = [];

        // Listen for ICE candidates and SDP Offers/Answers
        channel.on('broadcast', { event: 'webrtc_signal' }, async ({ payload }) => {
          if (payload.from === userID) return; // Ignore our own signals

          try {
            if (payload.type === 'peer_ready' && isCaller && pc.signalingState === 'stable') {
              // The receiver is ready! Let's send the offer!
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              channel.send({
                type: 'broadcast',
                event: 'webrtc_signal',
                payload: { type: 'offer', sdp: pc.localDescription, from: userID }
              });
            } else if (payload.type === 'offer') {
              if (handshakeInterval) clearInterval(handshakeInterval);
              // We received an offer, so we need to set Remote and create Answer
              await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              channel.send({
                type: 'broadcast',
                event: 'webrtc_signal',
                payload: { type: 'answer', sdp: pc.localDescription, from: userID }
              });
              
              // Process queued ICE candidates
              iceQueue.forEach(c => pc.addIceCandidate(new RTCIceCandidate(c)));
              iceQueue.length = 0;
            } else if (payload.type === 'answer') {
              // We received an answer
              await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
              // Process queued ICE candidates
              iceQueue.forEach(c => pc.addIceCandidate(new RTCIceCandidate(c)));
              iceQueue.length = 0;
            } else if (payload.type === 'ice-candidate') {
              // We received an ICE candidate
              if (payload.candidate) {
                if (pc.remoteDescription) {
                  await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
                } else {
                  iceQueue.push(payload.candidate);
                }
              }
            }
          } catch (e) {
            console.error("WebRTC Signaling Error:", e);
          }
        });

        // Send our ICE candidates as they are generated
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            channel.send({
              type: 'broadcast',
              event: 'webrtc_signal',
              payload: { type: 'ice-candidate', candidate: event.candidate, from: userID }
            });
          }
        };

        // 4. Connect and Start Signaling
        channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            if (!isCaller) {
              // We are the receiver. Tell the caller we are ready!
              handshakeInterval = setInterval(() => {
                 if (pc.signalingState === 'stable') {
                   channel.send({
                     type: 'broadcast', event: 'webrtc_signal', payload: { type: 'peer_ready', from: userID }
                   });
                 } else {
                   clearInterval(handshakeInterval);
                 }
              }, 1000);
            }
          }
        });

        // Also listen for connection state changes to handle disconnects
        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            onLeave(); // Auto hangup if peer disconnects
          }
        };

      } catch (err: any) {
        console.error("Failed to access camera/mic:", err);
        alert("Could not access camera/microphone. Please make sure you granted permissions.");
        onLeave();
      }
    };

    initWebRTC();

    return () => {
      isMounted = false;
      // Cleanup WebRTC and Media
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomID, userID, isCaller, onLeave]);

  const updateVideoAttachments = () => {
    // We must ensure srcObject is updated and play is called
    if (fullVideoRef.current && pipVideoRef.current) {
      if (isLocalPIP) {
        pipVideoRef.current.srcObject = localStreamRef.current;
        fullVideoRef.current.srcObject = remoteStreamRef.current || null;
      } else {
        fullVideoRef.current.srcObject = localStreamRef.current;
        pipVideoRef.current.srcObject = remoteStreamRef.current || null;
      }

      // Safari requires explicit play() after attaching srcObject sometimes
      pipVideoRef.current.play().catch(e => console.warn(e));
      if (hasRemoteVideo) {
        fullVideoRef.current.play().catch(e => console.warn(e));
      }
    }
  };

  useEffect(() => {
    updateVideoAttachments();
  }, [isLocalPIP, hasRemoteVideo]);

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
        setIsMicOn(!isMicOn);
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCameraOn;
        setIsCameraOn(!isCameraOn);
      }
    }
  };

  const handleSwap = () => {
    if (!hasRemoteVideo) return; // Only swap if there is a remote video
    setIsLocalPIP(!isLocalPIP);
  };

  return (
    <div ref={containerRef} className="fixed inset-0 z-[99999] bg-[#1a1b1e] overflow-hidden">
      
      {/* Full Screen Video (Background) */}
      <video
        ref={fullVideoRef}
        autoPlay
        playsInline
        muted={!isLocalPIP} // Mute full video if it's the local stream
        className="w-full h-full object-cover bg-black"
      />

      {!hasRemoteVideo && (
        <div className="absolute inset-0 flex items-center justify-center flex-col z-10 pointer-events-none">
          <p className="text-white text-xl font-medium animate-pulse">Connecting P2P Video...</p>
        </div>
      )}

      {/* Draggable PIP Video */}
      <motion.div
        drag
        dragConstraints={containerRef}
        dragElastic={0.1}
        dragMomentum={false}
        onClick={handleSwap}
        className="absolute top-12 right-4 w-[120px] h-[180px] bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 z-20 cursor-pointer touch-none"
        whileTap={{ scale: 0.95 }}
      >
        <video
          ref={pipVideoRef}
          autoPlay
          playsInline
          muted={isLocalPIP} // Mute PIP if it's the local stream
          className={`w-full h-full object-cover ${!isCameraOn && isLocalPIP ? 'opacity-0' : 'opacity-100'}`}
        />
        {!isCameraOn && isLocalPIP && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <VideoOff size={32} className="text-gray-400" />
          </div>
        )}
      </motion.div>

      {/* Bottom Controls Bar */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-6 px-6 z-30 pb-6">
        <button 
          onClick={toggleMic}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isMicOn ? 'bg-white/20 text-white backdrop-blur-md' : 'bg-white text-black'}`}
        >
          {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
        </button>

        <button 
          onClick={onLeave}
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-transform active:scale-95"
        >
          <PhoneOff size={32} />
        </button>

        <button 
          onClick={toggleCamera}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isCameraOn ? 'bg-white/20 text-white backdrop-blur-md' : 'bg-white text-black'}`}
        >
          {isCameraOn ? <VideoIcon size={24} /> : <VideoOff size={24} />}
        </button>
      </div>

    </div>
  );
}
