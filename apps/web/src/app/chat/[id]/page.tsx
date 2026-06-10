'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Video, MoreHorizontal, Smile, Plus, Mic, X, Image as ImageIcon, Camera, Folder, MapPin, Send, Loader2, Phone, UserRound } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceMessagePlayer from '../../../components/VoiceMessagePlayer';
import VideoCallRoom from '../../../components/VideoCallRoom';

export default function RealChatPage() {
  const router = useRouter();
  const params = useParams();
  const friendId = params.id as string;
  
  const [myUser, setMyUser] = useState<any>(null);
  const [friendProfile, setFriendProfile] = useState<any>(null);
  const [friendshipDetails, setFriendshipDetails] = useState<any>(null);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  
  const [isFriendOnline, setIsFriendOnline] = useState(false);
  const [isFriendTyping, setIsFriendTyping] = useState(false);
  const [isFriendRecording, setIsFriendRecording] = useState(false);
  
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  const typingDebounceRef = useRef<any>(null);
  
  const presenceChannelRef = useRef<any>(null);
  
  const [inVideoCall, setInVideoCall] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showContactProfile, setShowContactProfile] = useState(false);
  const [iBlockedThem, setIBlockedThem] = useState(false);
  const [theyBlockedMe, setTheyBlockedMe] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Interactive Tools State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize Real-Time Sync
  useEffect(() => {
    let isCancelled = false;
    setMounted(true);
    let channel: any;
    let presenceChannel: any;

    const initData = async () => {
      // 1. Fetch current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || isCancelled) return;
      setMyUser(user);
      
      // 2. Fetch friend profile
      const { data: fProfile } = await supabase.from('profiles').select('*').eq('id', friendId).single();
      if (fProfile) setFriendProfile(fProfile);

      // 3. Fetch friendship details
      const { data: fship } = await supabase
        .from('friends')
        .select('*')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
        .single();
      if (fship) setFriendshipDetails(fship);

      // 4. Fetch messages
      const { data: msgs, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (msgs) {
        // Bulk mark unread messages as seen
        const unreadIds = msgs.filter(m => m.receiver_id === user.id && m.status !== 'seen').map(m => m.id);
        if (unreadIds.length > 0) {
          await supabase.from('messages').update({ status: 'seen' }).in('id', unreadIds);
          msgs.forEach(m => {
            if (unreadIds.includes(m.id)) m.status = 'seen';
          });
        }

        setMessages(msgs);

        // Compute block state
        let _iBlockedThem = false;
        let _theyBlocked = false;

        msgs.filter(m => m.type === 'system').forEach(m => {
          if (m.sender_id === user.id) {
            _iBlockedThem = m.content === 'BLOCK_ACTION';
          }
          if (m.sender_id === friendId) {
            _theyBlocked = m.content === 'BLOCK_ACTION';
          }
        });

        setIBlockedThem(_iBlockedThem);
        setTheyBlockedMe(_theyBlocked);
      }

      // 5. Subscribe to Realtime Messages
      const uniqueChannelName = `chat_${user.id}_${friendId}_${Date.now()}`;
      channel = supabase.channel(uniqueChannelName)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        }, (payload) => {
          const newMsg = payload.new as any;
          if (newMsg.sender_id === friendId) {
            setMessages(prev => {
              if (prev.find(m => m.id === newMsg.id)) return prev;
              const updated = [...prev, newMsg];

              if (newMsg.type === 'system') {
                setTheyBlockedMe(newMsg.content === 'BLOCK_ACTION');
              }

              return updated;
            });
            // Mark as read in DB if chat is open
            supabase.from('messages').update({ status: 'seen' }).eq('id', newMsg.id).then();
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        }, payload => {
          setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
        })
        .subscribe();

      if (isCancelled) return;

      // 6. Setup Presence Tracking
      const presenceChannelName = `presence:chat_${[user.id, friendId].sort().join('_')}`;
      
      const existing = supabase.getChannels().find(c => c.topic === `realtime:${presenceChannelName}`);
      if (existing) await supabase.removeChannel(existing);

      presenceChannel = supabase.channel(presenceChannelName);
      presenceChannelRef.current = presenceChannel;

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          let latestPresence: any = null;

          Object.values(state).forEach((presences: any) => {
            presences.forEach((presence: any) => {
              if (presence.user_id === friendId) {
                if (!latestPresence || new Date(presence.online_at).getTime() > new Date(latestPresence.online_at).getTime()) {
                  latestPresence = presence;
                }
              }
            });
          });

          if (latestPresence) {
            setIsFriendOnline(true);
            setIsFriendTyping(latestPresence.is_typing || false);
            setIsFriendRecording(latestPresence.is_recording || false);
          } else {
            setIsFriendOnline(false);
            setIsFriendTyping(false);
            setIsFriendRecording(false);
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
              is_typing: false,
              is_recording: false
            });
          }
        });
    };

    initData();

    return () => {
      isCancelled = true;
      if (channel) supabase.removeChannel(channel);
      if (presenceChannel) supabase.removeChannel(presenceChannel);
      if (presenceChannelRef.current) supabase.removeChannel(presenceChannelRef.current);
    };
  }, [friendId]);

  // Presence state updates
  useEffect(() => {
    if (presenceChannelRef.current && mounted && myUser) {
      presenceChannelRef.current.track({
        user_id: myUser.id,
        online_at: new Date().toISOString(),
        is_typing: isTypingLocal,
        is_recording: isRecording
      });
    }
  }, [isTypingLocal, isRecording, myUser, mounted]);

  // Scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isRecording]);

  const handleSend = async () => {
    if (!input.trim() || !myUser) return;
    
    const textToSend = input;
    setInput("");
    setIsTypingLocal(false);
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    
    const newMsg = {
      sender_id: myUser.id,
      receiver_id: friendId,
      content: textToSend,
      type: 'text',
      status: 'sent'
    };
    
    const { data } = await supabase.from('messages').insert(newMsg).select().single();
    if (data) {
      setMessages(prev => {
        if (prev.find(m => m.id === data.id)) return prev;
        return [...prev, data];
      });
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      clearInterval(recordingTimerRef.current as NodeJS.Timeout);
      setRecordingTime(0);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const mimeType = mediaRecorder.mimeType || 'audio/mp4';
          const fileExt = mimeType.includes('webm') ? 'webm' : 'mp4';
          const rawAudioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const fileName = `${myUser.id}-voice-${Date.now()}.${fileExt}`;
          
          setIsUploading(true);
          
          if (rawAudioBlob.size === 0) {
             setIsUploading(false);
             alert("Voice message is empty. Please check your microphone permissions or try again.");
             return;
          }

          const { error: uploadError } = await supabase.storage.from('chat-media').upload(fileName, rawAudioBlob, {
            contentType: mimeType
          });
          setIsUploading(false);

          if (uploadError) {
             console.error("Storage upload error:", uploadError);
             alert("Failed to upload voice message: " + uploadError.message);
             return;
          }

          const { data: publicUrlData } = supabase.storage.from('chat-media').getPublicUrl(fileName);

          const audioMsg = {
            sender_id: myUser.id,
            receiver_id: friendId,
            content: `AUDIO:::${publicUrlData.publicUrl}`,
            type: 'text',
            status: 'sent'
          };
          
          const { data: insertedData, error: dbError } = await supabase.from('messages').insert(audioMsg).select().single();
          
          if (dbError) {
            console.error("DB Insert Error:", dbError);
            alert("Database error: " + dbError.message);
          }
          if (insertedData) setMessages(prev => [...prev, insertedData]);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } catch (err) {
        console.error("Mic access denied:", err);
        alert("Microphone access is required to send voice notes.");
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !myUser) return;

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${myUser.id}-${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage.from('chat-media').upload(fileName, file);
    setIsUploading(false);

    if (error) {
      alert("Failed to upload image.");
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('chat-media').getPublicUrl(fileName);

    const imgMsg = {
      sender_id: myUser.id,
      receiver_id: friendId,
      content: `IMAGE:::${publicUrlData.publicUrl}`,
      type: 'text',
      status: 'sent'
    };
    
    const { data: insertedData, error: dbError } = await supabase.from('messages').insert(imgMsg).select().single();
    if (dbError) {
      console.error("DB Insert Error for Image:", dbError);
      alert("Database error: " + dbError.message);
    }
    if (insertedData) {
      setMessages(prev => {
        if (prev.find(m => m.id === insertedData.id)) return prev;
        return [...prev, insertedData];
      });
    }
  };

  return (
    <>
      <AnimatePresence>
        {showContactProfile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center sm:items-center"
            onClick={() => setShowContactProfile(false)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full sm:w-[400px] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden mb-4 border-4 border-white shadow-md flex items-center justify-center text-gray-500 font-bold text-3xl">
                  {friendProfile?.avatar_url ? <img src={friendProfile.avatar_url} className="w-full h-full object-cover" /> : <UserRound size={48} />}
                </div>
                <h2 className="text-2xl font-bold text-black">{friendProfile?.name || friendProfile?.display_name || 'User'}</h2>
                <p className="text-gray-500 mb-6">{friendProfile?.email}</p>
                
                <div className="w-full bg-[#F7F7F7] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Connection Details</h3>
                  {friendshipDetails ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Connected on</span>
                        <span className="font-medium text-black">
                          {new Date(friendshipDetails.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Method</span>
                        <span className="font-medium text-[#07C160]">
                          {friendshipDetails.connected_via === 'qr' ? 'Scanned QR Code' : 'Direct Link'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic text-center py-2">Connection details unavailable.</p>
                  )}
                </div>
                
                <button 
                  onClick={() => setShowContactProfile(false)}
                  className="mt-6 w-full py-3 bg-gray-100 hover:bg-gray-200 text-black font-semibold rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col h-screen w-full bg-[#EDEDED] font-sans">
        <header className="flex items-center justify-between px-2 h-14 bg-[#EDEDED] shrink-0 z-40 border-b border-gray-300 relative">
          <div className="flex items-center gap-1 cursor-pointer" onClick={() => router.push('/chat')}>
            <ChevronLeft size={28} className="text-black -ml-1" />
            <div className="flex items-center gap-2" onClick={(e) => { e.stopPropagation(); setShowContactProfile(true); }}>
              <div className="w-9 h-9 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center text-white">
                {friendProfile?.avatar_url ? (
                  <img src={friendProfile.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <UserRound size={20} className="text-white/80" />
                )}
              </div>
              <div className="flex flex-col ml-3 flex-1 overflow-hidden">
                <span className="text-[17px] font-bold text-black truncate">
                  {friendProfile?.name || friendProfile?.display_name || "Friend"}
                </span>
                {isFriendRecording ? <span className="text-[13px] text-[#07C160]">recording audio...</span> : isFriendTyping ? <span className="text-[13px] text-[#07C160]">typing...</span> : isFriendOnline ? <span className="text-[13px] text-[#07C160]">Online</span> : <span className="text-[13px] text-gray-500">Offline</span>}
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center gap-4 text-black pr-2">
            <Video size={24} className="cursor-pointer" onClick={() => {
              window.dispatchEvent(new CustomEvent('START_VIDEO_CALL', { 
                detail: { friendId, friendProfile } 
              }));
            }} />
            <MoreHorizontal size={24} className="cursor-pointer" onClick={() => setShowMenu(!showMenu)} />
          </div>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-12 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
              >
                <button
                  className="w-full text-left px-4 py-3 text-[16px] text-red-500 font-medium active:bg-gray-100 border-b border-gray-100 flex items-center"
                  onClick={async () => {
                    const action = iBlockedThem ? 'UNBLOCK_ACTION' : 'BLOCK_ACTION';
                    const newMsg = { sender_id: myUser.id, receiver_id: friendId, content: action, type: 'system', status: 'sent' };
                    setIBlockedThem(!iBlockedThem);
                    setShowMenu(false);
                    const { data } = await supabase.from('messages').insert(newMsg).select().single();
                    if (data) setMessages(prev => [...prev, data]);
                  }}
                >
                  {iBlockedThem ? 'Unblock Contact' : 'Block User'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-1 relative">
          <div className="text-center text-xs text-gray-400 mb-6">
            Today {mounted ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </div>

          {messages.filter(m => m.type !== 'system').map((msg, index) => {
            const isMe = msg.sender_id === myUser?.id;
            const nextMsg = messages[index + 1];
            const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;
            const showAvatarAndTail = isLastInGroup;
            const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${showAvatarAndTail ? 'mb-4' : 'mb-1'}`}>
                {!isMe && (
                  <div className="w-10 shrink-0 mr-3 flex items-end">
                    {showAvatarAndTail ? (
                      <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        {friendProfile?.avatar_url ? <img src={friendProfile.avatar_url} className="w-full h-full object-cover" /> : <UserRound size={20} />}
                      </div>
                    ) : <div className="w-10" />}
                  </div>
                )}

                <div className={`max-w-[70%] rounded-lg p-3 text-[16px] leading-relaxed relative flex flex-col ${isMe ? 'bg-[#95EC69] text-black shadow-sm' : 'bg-white text-black shadow-sm'}`}>
                  {showAvatarAndTail && (
                    <div className={`absolute top-3 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent ${isMe ? 'right-[-6px] border-l-[8px] border-l-[#95EC69]' : 'left-[-6px] border-r-[8px] border-r-white'}`}></div>
                  )}
                  {msg.content?.startsWith('AUDIO:::') || msg.type === 'voice' ? (
                    <VoiceMessagePlayer src={msg.media_url || msg.content.replace('AUDIO:::', '')} isMe={isMe} />
                  ) : msg.content?.startsWith('IMAGE:::') || msg.type === 'image' ? (
                    <div className="w-[200px] h-auto overflow-hidden rounded-md border border-gray-200/20"><img src={msg.media_url || msg.content?.replace('IMAGE:::', '')} alt="Shared image" className="w-full h-full object-cover" /></div>
                  ) : msg.type === 'video_call' ? (
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 p-2 rounded-full"><Video size={20} className="text-[#07C160]" /></div>
                      <div className="flex flex-col">
                        <span className="font-medium text-[15px]">Video Call</span>
                        <button onClick={() => setInVideoCall(true)} className="text-[#07C160] font-semibold text-[14px] text-left mt-1">Tap to join</button>
                      </div>
                    </div>
                  ) : (
                    <span className="break-words">{msg.content}</span>
                  )}
                  
                  <div className="flex items-center justify-end gap-1 mt-1 opacity-70 text-[11px]">
                    <span>{timeStr}</span>
                    {isMe && (
                      <span className="ml-1 tracking-tighter flex">
                        {msg.status === 'seen' ? (
                          <span className="text-blue-500 font-bold tracking-[-2px]">✓✓</span>
                        ) : msg.status === 'delivered' ? (
                          <span className="text-gray-500 font-bold tracking-[-2px]">✓✓</span>
                        ) : (
                          <span className="text-gray-500 font-bold">✓</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                
                {isMe && (
                  <div className="w-10 shrink-0 ml-3 flex items-end">
                    {showAvatarAndTail ? (
                      <div className="w-10 h-10 rounded-full bg-[#07C160] overflow-hidden flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        {myUser?.user_metadata?.display_name?.charAt(0) || <UserRound size={20} />}
                      </div>
                    ) : <div className="w-10" />}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={endRef} />
        </main>

        <div className="bg-[#F7F7F7] border-t border-gray-300 pb-safe shrink-0 flex flex-col">
          {iBlockedThem ? (
            <div className="p-4 flex flex-col items-center justify-center">
              <p className="text-gray-500 font-medium text-[15px] mb-2">You blocked this contact</p>
              <button
                className="text-[#07C160] font-semibold text-[16px] active:opacity-70"
                onClick={async () => {
                  const newMsg = { sender_id: myUser.id, receiver_id: friendId, content: 'UNBLOCK_ACTION', type: 'system', status: 'sent' };
                  setIBlockedThem(false);
                  const { data } = await supabase.from('messages').insert(newMsg).select().single();
                  if (data) setMessages(prev => [...prev, data]);
                }}
              >
                Tap to Unblock
              </button>
            </div>
          ) : theyBlockedMe ? (
            <div className="p-4 flex flex-col items-center justify-center">
              <p className="text-gray-500 font-medium text-[15px]">You have been blocked by this user.</p>
            </div>
          ) : (
            <>
              <div className="p-2 flex items-center gap-2">
                {isRecording ? (
                  <div className="flex-1 bg-[#E5E5E5] border border-gray-300 rounded p-2 text-black text-center font-medium animate-pulse cursor-pointer" onClick={toggleRecording}>
                    Recording... 0:0{recordingTime} (Tap to send)
                  </div>
                ) : (
                  <>
                    <Mic size={28} className="text-gray-600 shrink-0 p-1 cursor-pointer hover:bg-gray-200 rounded-full" onClick={toggleRecording} />
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        setIsTypingLocal(true);
                        if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
                        typingDebounceRef.current = setTimeout(() => setIsTypingLocal(false), 1000);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSend();
                      }}
                      className="flex-1 bg-white border border-gray-300 rounded p-2 text-[16px] focus:outline-none focus:border-[#07C160] text-black"
                    />
                    {input.trim() ? (
                      <div className="bg-[#07C160] w-9 h-9 rounded flex items-center justify-center cursor-pointer shrink-0" onClick={handleSend}>
                        <Send size={18} className="text-white ml-1" />
                      </div>
                    ) : (
                      <div className="relative overflow-hidden shrink-0">
                        <ImageIcon size={28} className="text-gray-600 p-1 cursor-pointer hover:bg-gray-200 rounded-full" />
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isUploading} />
                        {isUploading && <Loader2 className="absolute inset-0 m-auto animate-spin text-black" size={16} />}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <div style={{ display: 'none' }}></div>
    </>
  );
}
