'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ZegoCloudWrapper } from './ZegoCloudWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneOff, Video, Phone } from 'lucide-react';

export default function GlobalCallListener() {
  const [myUser, setMyUser] = useState<any>(null);
  
  // Call State
  const [callState, setCallState] = useState<'idle' | 'calling' | 'ringing' | 'connected'>('idle');
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [friendId, setFriendId] = useState<string | null>(null);
  const [friendProfile, setFriendProfile] = useState<any>(null);
  const [roomID, setRoomID] = useState<string>('');
  const [isCaller, setIsCaller] = useState<boolean>(false);
  
  const callStateRef = useRef(callState);
  useEffect(() => { callStateRef.current = callState; }, [callState]);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;
      setMyUser(user);

      // Listen for incoming call signals via messages table
      const channel = supabase.channel('global_calls')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        }, async (payload) => {
          const msg = payload.new as any;
          
          if (msg.type === 'video_call_offer' && callStateRef.current === 'idle') {
            // Incoming Call!
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', msg.sender_id).single();
            setFriendId(msg.sender_id);
            setFriendProfile(profile);
            setActiveCallId(msg.id);
            setRoomID(`room_${[user.id, msg.sender_id].sort().join('_').substring(0, 32)}`);
            setIsCaller(false); // We are receiving the call
            setCallState('ringing');
          } else if (msg.type === 'video_call_accept' && callStateRef.current === 'calling') {
            // They accepted our call!
            setCallState('connected');
          } else if (msg.type === 'video_call_reject' && callStateRef.current === 'calling') {
            // They rejected our call
            setCallState('idle');
            alert('Call declined');
          } else if (msg.type === 'video_call_end' && callStateRef.current !== 'idle') {
            // They hung up
            setCallState('idle');
          }

          // Mark standard messages as delivered since the app is actively running
          if (msg.status === 'sent' && !msg.type.startsWith('video_call') && msg.type !== 'system') {
            supabase.from('messages').update({ status: 'delivered' }).eq('id', msg.id).then();
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };
    init();

    return () => { isMounted = false; };
  }, []);

  // Listen for outgoing call triggers from any page
  useEffect(() => {
    const handleStartCall = async (e: any) => {
      if (!myUser || callState !== 'idle') return;
      const { friendId: targetId, friendProfile: targetProfile } = e.detail;
      
      setFriendId(targetId);
      setFriendProfile(targetProfile);
      setRoomID(`room_${[myUser.id, targetId].sort().join('_').substring(0, 32)}`);
      setIsCaller(true); // We are initiating the call
      setCallState('calling');

      // Send offer
      const newMsg = { 
        sender_id: myUser.id, 
        receiver_id: targetId, 
        content: 'Incoming video call...', 
        type: 'video_call_offer', 
        status: 'sent' 
      };
      await supabase.from('messages').insert(newMsg);
    };

    window.addEventListener('START_VIDEO_CALL', handleStartCall);
    return () => window.removeEventListener('START_VIDEO_CALL', handleStartCall);
  }, [myUser, callState]);

  const acceptCall = async () => {
    if (!myUser || !friendId) return;
    setCallState('connected');
    const newMsg = { sender_id: myUser.id, receiver_id: friendId, content: 'Call accepted', type: 'video_call_accept', status: 'sent' };
    await supabase.from('messages').insert(newMsg);
  };

  const rejectCall = async () => {
    if (!myUser || !friendId) return;
    setCallState('idle');
    const newMsg = { sender_id: myUser.id, receiver_id: friendId, content: 'Call rejected', type: 'video_call_reject', status: 'sent' };
    await supabase.from('messages').insert(newMsg);
  };

  const hangUp = async () => {
    if (myUser && friendId) {
      const newMsg = { sender_id: myUser.id, receiver_id: friendId, content: 'Call ended', type: 'video_call_end', status: 'sent' };
      await supabase.from('messages').insert(newMsg);
    }
    setCallState('idle');
  };

  if (callState === 'idle') return null;

  return (
    <>
      {/* Full Screen Incoming/Outgoing Call UI */}
      <AnimatePresence>
        {(callState === 'calling' || callState === 'ringing') && (
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[99999] bg-[#1a1b1e] flex flex-col items-center pt-24 pb-16"
          >
            <div className="flex flex-col items-center space-y-6 flex-1">
              <div className="w-28 h-28 rounded-full bg-gray-700 overflow-hidden shadow-2xl border-4 border-white/10">
                {friendProfile?.avatar_url ? (
                  <img src={friendProfile.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-600 text-white text-4xl font-bold">
                    {friendProfile?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <h2 className="text-3xl font-bold text-white tracking-wide">
                {friendProfile?.name || 'Unknown'}
              </h2>
              <p className="text-gray-400 text-lg">
                {callState === 'calling' ? 'Calling...' : 'Quro Video Call'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-16 w-full px-12 pb-8">
              {callState === 'ringing' ? (
                <>
                  <button onClick={rejectCall} className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/40 hover:scale-105 transition-transform active:scale-95">
                    <PhoneOff size={28} className="text-white" />
                  </button>
                  <button onClick={acceptCall} className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/40 hover:scale-105 transition-transform active:scale-95 animate-pulse">
                    <Video size={28} className="text-white" />
                  </button>
                </>
              ) : (
                <button onClick={hangUp} className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/40 hover:scale-105 transition-transform active:scale-95">
                  <PhoneOff size={28} className="text-white" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connected Video Call Room */}
      {callState === 'connected' && myUser && (
        <div className="fixed inset-0 z-[99999] bg-[#1a1b1e] flex flex-col">
          <div className="absolute top-12 left-6 z-50">
            <button onClick={hangUp} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-full shadow-lg font-bold transition-transform active:scale-95">
              <PhoneOff size={20} />
              End Call
            </button>
          </div>
          <ZegoCloudWrapper
            roomID={roomID}
            userID={myUser.id}
            userName={myUser.user_metadata?.display_name || "User"}
            callType="video"
          />
        </div>
      )}
    </>
  );
}
