'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { getContact } from '../lib/contactsStore';
import { getSession } from '../lib/localSession';
import { startPremiumRingtone, type RingtoneHandle } from '../lib/ringtone';
import { quroWS } from '../lib/websocket';

type IncomingCall = {
  from: string;
  type: 'audio' | 'video';
  displayName: string;
};

export function GlobalRealtimeHub() {
  const router = useRouter();
  const pathname = usePathname();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const incomingCallRef = useRef<IncomingCall | null>(null);
  const ringtoneRef = useRef<RingtoneHandle | null>(null);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  useEffect(() => {
    const session = getSession();
    if (!session?.quroId) return;

    quroWS.connect(session.quroId, '');

    const stopRingtone = () => {
      ringtoneRef.current?.stop();
      ringtoneRef.current = null;
    };

    const startRingtone = () => {
      stopRingtone();
      ringtoneRef.current = startPremiumRingtone('incoming');
    };

    const unsubOffer = quroWS.on('call_offer', async (data: any) => {
      if (!data.from || pathname?.includes('/m/app/call')) return;

      const contact = await getContact(data.from);
      setIncomingCall({
        from: data.from,
        type: data.call_type === 'video' ? 'video' : 'audio',
        displayName: contact?.displayName || `User ${String(data.from).slice(0, 6)}`,
      });
      startRingtone();
    });

    const clearIncoming = (data: any) => {
      const currentCall = incomingCallRef.current;
      if (!currentCall || data.from === currentCall.from) {
        stopRingtone();
        setIncomingCall(null);
      }
    };

    const unsubEnd = quroWS.on('call_end', clearIncoming);
    const unsubReject = quroWS.on('call_reject', clearIncoming);
    const unsubAnsweredElsewhere = quroWS.on('call_answered_elsewhere', clearIncoming);

    return () => {
      stopRingtone();
      unsubOffer();
      unsubEnd();
      unsubReject();
      unsubAnsweredElsewhere();
    };
  }, [pathname]);

  function acceptCall() {
    if (!incomingCall) return;
    const call = incomingCall;
    setIncomingCall(null);
    ringtoneRef.current?.stop();
    ringtoneRef.current = null;
    router.push(`/m/app/call?contact=${call.from}&type=${call.type}&incoming=true`);
  }

  function rejectCall() {
    if (!incomingCall) return;
    quroWS.sendCallReject(incomingCall.from);
    setIncomingCall(null);
    ringtoneRef.current?.stop();
    ringtoneRef.current = null;
  }

  return (
    <AnimatePresence>
      {incomingCall && (
        <motion.div
          initial={{ y: -96, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -96, opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10000,
            padding: 'calc(12px + env(safe-area-inset-top, 0px)) 16px 14px',
            background: 'linear-gradient(135deg, #07121F, #0F766E)',
            boxShadow: '0 12px 36px rgba(15, 118, 110, 0.32)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontFamily: "'Inter', -apple-system, sans-serif",
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: 'rgba(255,255,255,0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {incomingCall.type === 'video' ? (
              <Video size={23} color="#fff" strokeWidth={2.4} />
            ) : (
              <Phone size={22} color="#fff" strokeWidth={2.4} />
            )}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, color: '#fff', fontSize: 15, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {incomingCall.displayName}
            </p>
            <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: 600 }}>
              Incoming {incomingCall.type} call
            </p>
          </div>

          <button
            onClick={rejectCall}
            style={{ width: 42, height: 42, borderRadius: 21, border: 'none', backgroundColor: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            aria-label="Reject call"
          >
            <PhoneOff size={19} color="#fff" strokeWidth={2.6} />
          </button>

          <button
            onClick={acceptCall}
            style={{ width: 42, height: 42, borderRadius: 21, border: 'none', backgroundColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            aria-label="Answer call"
          >
            <Phone size={19} color="#fff" strokeWidth={2.6} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
