'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Video, MoreHorizontal, Smile, Plus, Mic, X, Image as ImageIcon, Camera, Folder, MapPin, Send, Loader2, Phone, UserRound, AlertTriangle, Languages, Trash2 } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { moderateMessage } from '../../../lib/moderation';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceMessagePlayer from '../../../components/VoiceMessagePlayer';
import VideoCallRoom from '../../../components/VideoCallRoom';

const messageCache: Record<string, any[]> = {};
const friendProfileCache: Record<string, any> = {};
let globalMyUser: any = null;

const callTranslations: Record<string, Record<string, string>> = {
  'Hindi': {
    'Video Call': 'वीडियो कॉल',
    'Tap to join': 'जुड़ने के लिए टैप करें',
    'Incoming video call...': 'इनकमिंग वीडियो कॉल...',
    'Missed video call': 'मिस्ड वीडियो कॉल',
    'Call declined': 'कॉल अस्वीकृत',
    'Call accepted': 'कॉल स्वीकार की गई',
    'Call ended': 'कॉल समाप्त'
  },
  'Bengali': {
    'Video Call': 'ভিডিও কল',
    'Tap to join': 'যোগ দিতে ট্যাপ করুন',
    'Incoming video call...': 'ইনকামিং ভিডিও কল...',
    'Missed video call': 'মিসড ভিডিও কল',
    'Call declined': 'কল প্রত্যাখ্যান করা হয়েছে',
    'Call accepted': 'কল গ্রহণ করা হয়েছে',
    'Call ended': 'কল শেষ'
  }
};

const translateSystemMsg = (content: string, lang: string) => {
  if (!content) return content;
  if (!callTranslations[lang]) return content;
  
  if (content.startsWith('Call ended')) {
    const time = content.split('•')[1] || '';
    return (callTranslations[lang]['Call ended'] || 'Call ended') + (time ? ` •${time}` : '');
  }
  return callTranslations[lang][content] || content;
};

export default function RealChatPage() {
  const router = useRouter();
  const params = useParams();
  const friendId = params.id as string;

  const [myUser, setMyUser] = useState<any>(globalMyUser);
  const [friendProfile, setFriendProfile] = useState<any>(friendProfileCache[friendId] || null);
  const [friendshipDetails, setFriendshipDetails] = useState<any>(null);

  const [messages, setMessages] = useState<any[]>(messageCache[friendId] || []);
  const [isLoadingMessages, setIsLoadingMessages] = useState(!messageCache[friendId]);
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

  // Moderation
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [violationStrikes, setViolationStrikes] = useState(0);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  
  // Translation & Context Menu
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, msgId: string, content: string, senderId: string } | null>(null);
  const [isTranslating, setIsTranslating] = useState<Record<string, boolean>>({});
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    if (myUser) {
      supabase.from('profiles').select('*').eq('id', myUser.id).single().then(({ data }) => {
        if (data) {
          if (typeof window !== 'undefined') {
            const storedTheme = localStorage.getItem('quro_chat_theme');
            if (storedTheme) data.quro_chat_theme = storedTheme;
            
            const storedTransLang = localStorage.getItem('quro_translation_lang');
            if (storedTransLang) data.quro_translation_lang = storedTransLang;
          }
          setMyProfile(data);
          setIsThemeLoaded(true);
        }
      });
    }
  }, [myUser]);

  // Interactive Tools State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');

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
      globalMyUser = user;
      setMyUser(user);

      // 2. Fetch friend profile
      const { data: fProfile } = await supabase.from('profiles').select('*').eq('id', friendId).single();
      if (fProfile) {
        friendProfileCache[friendId] = fProfile;
        setFriendProfile(fProfile);
      }

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
          // Dispatch local event for instant UI update
          window.dispatchEvent(new CustomEvent('messages_seen', { detail: { friendId } }));
        }

        messageCache[friendId] = msgs;
        setMessages(msgs);
        setIsLoadingMessages(false);

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
      
      const handleRealtimePayload = (payload: any) => {
        if (payload.eventType === 'INSERT') {
          const newMsg = payload.new as any;
          if (newMsg.sender_id === friendId || newMsg.receiver_id === friendId) {
            setMessages(prev => {
              if (prev.find(m => m.id === newMsg.id)) return prev;
              const updated = [...prev, newMsg];
              if (newMsg.type === 'system' && newMsg.sender_id === friendId) {
                setTheyBlockedMe(newMsg.content === 'BLOCK_ACTION');
              }
              return updated;
            });
            if (newMsg.sender_id === friendId) {
              supabase.from('messages').update({ status: 'seen' }).eq('id', newMsg.id).then();
              window.dispatchEvent(new CustomEvent('messages_seen', { detail: { friendId } }));
            }
          }
        } else if (payload.eventType === 'UPDATE') {
          setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m));
        } else if (payload.eventType === 'DELETE') {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        }
      };

      channel = supabase.channel(uniqueChannelName)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, handleRealtimePayload)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `sender_id=eq.${user.id}` }, handleRealtimePayload)
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
          // Find if friend is online
          let _friendOnline = false;
          let latestPresence: any = null;

          for (const key in state) {
            const presences = state[key] as any[];
            const friendP = presences.find(p => p.user_id === friendId);
            if (friendP) {
              _friendOnline = true;
              latestPresence = friendP;
            }
          }

          setIsFriendOnline(_friendOnline);
          if (latestPresence) {
            setIsFriendTyping(latestPresence.is_typing || false);
            setIsFriendRecording(latestPresence.is_recording || false);
          } else {
            setIsFriendTyping(false);
            setIsFriendRecording(false);
          }
        })
        .on('broadcast', { event: 'unsend' }, (payload) => {
          if (payload?.payload?.msgId) {
            const msgId = payload.payload.msgId;
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: 'DELETED:::' } : m));
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

  const acceptFriendRequest = async (msg: any) => {
    try {
      await supabase.from('friends').insert({ user_id: myUser.id, friend_id: msg.sender_id, connected_via: 'Search ID' }).catch(() => { });
      await supabase.from('friends').insert({ user_id: msg.sender_id, friend_id: myUser.id, connected_via: 'Search ID' }).catch(() => { });
      await supabase.from('messages').update({ type: 'friend_request_accepted', content: 'Friend request accepted.' }).eq('id', msg.id);
    } catch (e) {
      console.error('Error accepting friend request', e);
    }
  };

  const declineFriendRequest = async (msg: any) => {
    try {
      await supabase.from('messages').update({ type: 'friend_request_declined', content: 'Friend request declined.' }).eq('id', msg.id);
    } catch (e) {
      console.error('Error declining friend request', e);
    }
  };

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

  const isInitialScrollRef = useRef(true);
  const currentFriendIdRef = useRef(friendId);

  // Reset initial scroll when changing chats
  if (currentFriendIdRef.current !== friendId) {
    isInitialScrollRef.current = true;
    currentFriendIdRef.current = friendId;
  }

  // Scroll to bottom
  useEffect(() => {
    // Only scroll smoothly when new messages are added AFTER initial load
    if (messages.length > 0) {
      if (!isInitialScrollRef.current) {
        setTimeout(() => {
          requestAnimationFrame(() => {
            if (endRef.current) {
              endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
            }
          });
        }, 100);
      } else {
        isInitialScrollRef.current = false;
        // Snap to the bottom instantly on first load, use aggressive polling to ensure DOM layout is complete
        const attemptScroll = (attempts = 0) => {
          requestAnimationFrame(() => {
            if (endRef.current) {
              endRef.current.scrollIntoView({ behavior: "instant", block: "end" });
            }
            if (attempts === 0) setIsScrolled(true);
            
            if (attempts < 5) {
              setTimeout(() => attemptScroll(attempts + 1), 100);
            }
          });
        };
        attemptScroll(0);
      }
    } else if (!isLoadingMessages && messages.length === 0) {
      setIsScrolled(true);
      isInitialScrollRef.current = false;
    }
  }, [messages.length, isRecording, isLoadingMessages, friendId]);

  const handleSend = async () => {
    if (!input.trim() || !myUser) return;

    let textToSend = input;
    setInput("");
    setIsTypingLocal(false);
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);

    if (myProfile?.is_banned) {
      setShowBanModal(true);
      return;
    }

    const modResult = moderateMessage(textToSend);
    if (modResult.level > 0) {
       textToSend = modResult.censoredContent;
       
       if (myProfile) {
         const newStrikes = (myProfile.strikes || 0) + modResult.level;
         const isBanned = newStrikes >= 10;
         
         await supabase.from('profiles').update({ strikes: newStrikes, is_banned: isBanned }).eq('id', myUser.id);
         setMyProfile({ ...myProfile, strikes: newStrikes, is_banned: isBanned });
         setViolationStrikes(newStrikes);
         
         if (isBanned) {
            setShowBanModal(true);
            return; // DO NOT send the message at all if it was the strike that banned them
         } else {
            setShowViolationModal(true);
            return; // DO NOT send the message at all
         }
       }
    }

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

  const handleTranslate = async (msgId: string, content: string) => {
    setContextMenu(null);
    setIsTranslating(prev => ({ ...prev, [msgId]: true }));
    
    let targetLang = myProfile?.quro_translation_lang || 'English';
    if (typeof window !== 'undefined') {
      targetLang = localStorage.getItem('quro_translation_lang') || targetLang;
    }

    const langCodes: Record<string, string> = {
      'English': 'en', 'Hindi': 'hi', 'Bengali': 'bn', 'Telugu': 'te', 'Marathi': 'mr', 'Tamil': 'ta', 
      'Urdu': 'ur', 'Gujarati': 'gu', 'Kannada': 'kn', 'Odia': 'or', 'Malayalam': 'ml', 'Punjabi': 'pa', 
      'Assamese': 'as', 'Nepali': 'ne', 'Vietnamese': 'vi', 'Spanish': 'es', 'French': 'fr', 'Chinese': 'zh', 'Japanese': 'ja'
    };

    const targetCode = langCodes[targetLang] || 'en';
    
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(content)}&langpair=autodetect|${targetCode}`);
      const data = await res.json();
      
      let translatedText = data?.responseData?.translatedText;
      if (!translatedText || translatedText.includes('MYMEMORY WARNING')) {
         translatedText = `[Translation failed, fallback to ${targetLang}]: ${content}`;
      }
      
      setTranslatedMessages(prev => ({ ...prev, [msgId]: translatedText }));
    } catch (e) {
      setTranslatedMessages(prev => ({ ...prev, [msgId]: `[Error translating to ${targetLang}]` }));
    }
    
    setIsTranslating(prev => ({ ...prev, [msgId]: false }));
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsRecording(false);
      clearInterval(recordingTimerRef.current as NodeJS.Timeout);
      setRecordingTime(0);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        let mimeType = ''; // Let browser choose the best default, maximizing mobile compatibility
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        }

        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        transcriptRef.current = '';

        try {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.onresult = (event: any) => {
              let finalTranscript = '';
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                  finalTranscript += event.results[i][0].transcript;
                }
              }
              if (finalTranscript) {
                transcriptRef.current += finalTranscript + ' ';
              }
            };
            recognitionRef.current = recognition;
            recognition.start();
          }
        } catch (e) {
          console.error("Speech recognition error:", e);
        }

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
            content: `AUDIO:::${publicUrlData.publicUrl}${transcriptRef.current.trim() ? `|||TRANSCRIPT:::${transcriptRef.current.trim()}` : ''}`,
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

        mediaRecorder.start(200);
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

  if (!isThemeLoaded) {
    return <div className="flex flex-col h-screen w-full bg-[#1A1A1A]"></div>;
  }

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
                <p className="text-gray-500 mb-4">{friendProfile?.email}</p>

                {friendProfile?.bio && (
                  <div className="w-full mb-4 px-2">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Bio</h3>
                    <p className="text-gray-800 text-[15px] italic">"{friendProfile.bio}"</p>
                  </div>
                )}

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



      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`flex flex-col h-screen w-full overflow-hidden font-sans relative ${
          !myProfile?.quro_chat_theme ? 'bg-[#1A1A1A]' :
          myProfile?.quro_chat_theme === 'Ocean (Blue)' ? 'bg-[#E5F1FF] text-black' :
          myProfile?.quro_chat_theme === 'Sunset (Orange)' ? 'bg-[#FFF0E5] text-black' :
          myProfile?.quro_chat_theme === 'Midnight (Dark)' ? 'bg-[#1A1A1A] text-white' :
          myProfile?.quro_chat_theme === 'Anime Night (AI)' ? 'bg-[url("/themes/anime_night.png")] bg-cover bg-center text-white' :
          myProfile?.quro_chat_theme === 'Serene Forest (AI)' ? 'bg-[url("/themes/serene_forest.png")] bg-cover bg-center text-white shadow-inner' :
          'bg-[#EDEDED] text-black'
        }`}
      >
        <header className={`flex items-center justify-between px-2 h-14 shrink-0 z-40 border-b relative ${
          ['Midnight (Dark)', 'Anime Night (AI)', 'Serene Forest (AI)'].includes(myProfile?.quro_chat_theme) ? 'bg-[#1A1A1A]/80 backdrop-blur-md border-gray-800 text-white' : 'bg-[#EDEDED] border-gray-300'
        }`}>
          <div className="flex items-center gap-1 cursor-pointer" onClick={() => router.push('/chat')}>
            <ChevronLeft size={28} className={`${['Midnight (Dark)', 'Anime Night (AI)', 'Serene Forest (AI)'].includes(myProfile?.quro_chat_theme) ? 'text-white' : 'text-black'} -ml-1`} />
            <div className="flex items-center gap-2" onClick={(e) => { e.stopPropagation(); setShowContactProfile(true); }}>
              <div className="w-9 h-9 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center text-white">
                {friendProfile?.avatar_url ? (
                  <img src={friendProfile.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <UserRound size={20} className="text-white/80" />
                )}
              </div>
              <div className="flex flex-col ml-3 flex-1 overflow-hidden">
                {friendProfile ? (
                  <>
                    <span className={`text-[17px] font-bold truncate ${['Midnight (Dark)', 'Anime Night (AI)', 'Serene Forest (AI)'].includes(myProfile?.quro_chat_theme) ? 'text-white' : 'text-black'}`}>
                      {friendProfile.name || friendProfile.display_name || "Friend"}
                    </span>
                    {isFriendRecording ? <span className="text-[13px] text-[#07C160]">recording audio...</span> : isFriendTyping ? <span className="text-[13px] text-[#07C160]">typing...</span> : isFriendOnline ? <span className="text-[13px] text-[#07C160]">Online</span> : <span className="text-[13px] text-gray-500">Offline</span>}
                  </>
                ) : (
                  <>
                    <div className="w-24 h-4 bg-gray-300 rounded animate-pulse mb-1"></div>
                    <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className={`flex justify-end items-center gap-4 pr-2 ${['Midnight (Dark)', 'Anime Night (AI)', 'Serene Forest (AI)'].includes(myProfile?.quro_chat_theme) ? 'text-white' : 'text-black'}`}>
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

        <main className={`flex-1 overflow-y-auto p-4 flex flex-col relative w-full h-full transition-opacity duration-200 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-full flex flex-col gap-1">
            {isLoadingMessages ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="animate-spin text-gray-400" size={24} />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-xs text-gray-400 my-4 uppercase tracking-wider font-semibold">
                This is the start of your secure conversation
              </div>
            ) : null}

            {messages.filter(m => m.type !== 'system').map((msg, index) => {
              const isMe = msg.sender_id === myUser?.id;
              const nextMsg = messages[index + 1];
              const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;
              const showAvatarAndTail = isLastInGroup;
              const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              const isCallSystemMessage = (msg.content && (msg.content.includes('Call accepted') || msg.content.includes('Call ended') || msg.content.includes('Incoming video call') || msg.content.includes('Call declined')));

              return (
                <div key={msg.id} className="flex flex-col">
                  {/* MESSAGE ROW */}
                  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${showAvatarAndTail ? 'mb-4' : 'mb-1'}`}>
                    <div
                      onContextMenu={(e) => {
                        const isCallSys = (msg.content && (msg.content.includes('Call accepted') || msg.content.includes('Call ended') || msg.content.includes('Incoming video call') || msg.content.includes('Call declined') || msg.content.includes('Missed video call')));
                        if (msg.type === 'video_call' || msg.type === 'voice_call' || msg.type === 'system' || msg.content === 'DELETED:::' || isCallSys) return;
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, msgId: msg.id, content: msg.content, senderId: msg.sender_id });
                      }}
                      className={`max-w-[85%] md:max-w-[80%] rounded-lg p-2.5 md:p-3 text-[15px] md:text-[16px] leading-relaxed relative flex flex-col ${isMe ? 'bg-[#95EC69] text-black shadow-sm' : (['Midnight (Dark)', 'Anime Night (AI)', 'Serene Forest (AI)'].includes(myProfile?.quro_chat_theme) ? 'bg-[#2C2C2C]/90 backdrop-blur-sm text-white shadow-sm' : 'bg-white text-black shadow-sm')}`}
                    >
                      {/* Tails */}
                      {showAvatarAndTail && msg.content !== 'DELETED:::' && (
                        <div className={`absolute top-3 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent ${isMe ? 'right-[-6px] border-l-[8px] border-l-[#95EC69]' : (['Midnight (Dark)', 'Anime Night (AI)', 'Serene Forest (AI)'].includes(myProfile?.quro_chat_theme) ? 'left-[-6px] border-r-[8px] border-r-[#2C2C2C]/90' : 'left-[-6px] border-r-[8px] border-r-white')}`}></div>
                      )}

                      {msg.content === 'DELETED:::' ? (
                        <div className={`flex items-center gap-2 italic text-[14px] ${isMe ? 'text-black/60' : 'text-gray-500'}`}>
                          <Trash2 size={16} className="opacity-70" />
                          {isMe ? 'You unsent a message' : 'This message was unsent'}
                        </div>
                      ) : msg.content?.startsWith('AUDIO:::') || msg.type === 'voice' ? (
                        <VoiceMessagePlayer 
                          src={msg.media_url || (msg.content.split('|||TRANSCRIPT:::')[0] || '').replace('AUDIO:::', '')} 
                          isMe={isMe} 
                          transcript={msg.content.includes('|||TRANSCRIPT:::') ? msg.content.split('|||TRANSCRIPT:::')[1] : undefined}
                        />
                      ) : msg.content?.startsWith('IMAGE:::') || msg.type === 'image' ? (
                        <div className="w-[200px] md:w-[300px] h-auto overflow-hidden rounded-md border border-gray-200/20"><img src={msg.media_url || msg.content?.replace('IMAGE:::', '')} alt="Shared image" className="w-full h-full object-cover" /></div>
                      ) : msg.type === 'video_call' ? (
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-100 p-2 rounded-full"><Video size={20} className="text-[#07C160]" /></div>
                          <div className="flex flex-col">
                            <span className="font-medium text-[15px]">{callTranslations[myProfile?.quro_app_lang || 'English']?.['Video Call'] || 'Video Call'}</span>
                            <button onClick={() => setInVideoCall(true)} className="text-[#07C160] font-semibold text-[14px] text-left mt-1">{callTranslations[myProfile?.quro_app_lang || 'English']?.['Tap to join'] || 'Tap to join'}</button>
                          </div>
                        </div>
                      ) : msg.type === 'friend_request' ? (
                        <div className="flex flex-col gap-3 min-w-[200px]">
                          <span className="font-medium text-[15px]">Friend Request</span>
                          {!isMe && (
                            <div className="flex gap-2 mt-1">
                              <button onClick={() => acceptFriendRequest(msg)} className="flex-1 bg-[#07C160] text-white py-1.5 rounded-md text-[14px] font-semibold active:opacity-80 transition-opacity">Accept</button>
                              <button onClick={() => declineFriendRequest(msg)} className="flex-1 bg-gray-100 text-gray-700 py-1.5 rounded-md text-[14px] font-semibold active:bg-gray-200 transition-colors">Decline</button>
                            </div>
                          )}
                          {isMe && <span className="text-[13px] text-gray-500 italic">Request sent... waiting for approval</span>}
                        </div>
                      ) : msg.type === 'friend_request_accepted' ? (
                        <div className="flex items-center gap-2">
                          <div className="bg-[#07C160]/10 p-1.5 rounded-full"><UserRound size={16} className="text-[#07C160]" /></div>
                          <span className="text-[15px] italic text-black/80">{msg.content}</span>
                        </div>
                      ) : msg.type === 'friend_request_declined' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] italic text-black/50">{msg.content}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="break-words">{isCallSystemMessage ? translateSystemMsg(msg.content, myProfile?.quro_app_lang || 'English') : msg.content}</span>
                          {isTranslating[msg.id] && (
                            <div className="mt-2 text-sm text-gray-500 flex items-center gap-2 border-t border-black/10 pt-2">
                              <Loader2 size={14} className="animate-spin" /> Translating...
                            </div>
                          )}
                          {translatedMessages[msg.id] && (
                            <div className="mt-2 text-sm text-gray-800 border-t border-black/10 pt-2 break-words font-medium">
                              {translatedMessages[msg.id]}
                            </div>
                          )}
                        </div>
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
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
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
              <div className={`p-2 flex items-center gap-2 ${['Midnight (Dark)', 'Anime Night (AI)', 'Serene Forest (AI)'].includes(myProfile?.quro_chat_theme) ? 'bg-[#1A1A1A]/90 backdrop-blur-md' : 'bg-[#F7F7F7]'}`}>
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
                      className={`flex-1 border border-gray-300 rounded p-2 text-[16px] focus:outline-none focus:border-[#07C160] ${['Midnight (Dark)', 'Anime Night (AI)', 'Serene Forest (AI)'].includes(myProfile?.quro_chat_theme) ? 'bg-[#2C2C2C]/80 backdrop-blur-sm text-white border-gray-700 placeholder-gray-400' : 'bg-white text-black'}`}
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

        {/* Translation Context Menu */}
        <AnimatePresence>
          {contextMenu && (
            <>
              {/* Invisible overlay to catch clicks and close the menu */}
              <div 
                className="fixed inset-0 z-[110]" 
                onClick={() => setContextMenu(null)}
                onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                style={{ top: contextMenu.y, left: contextMenu.x }}
                className="fixed z-[120] bg-white rounded-xl shadow-xl border border-gray-200 py-1 w-48 overflow-hidden"
              >
                <button 
                  onClick={() => handleTranslate(contextMenu.msgId, contextMenu.content)}
                  className="w-full text-left px-4 py-3 text-[15px] font-medium text-black hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <Languages size={18} className="text-[#07C160]" />
                  Translate Message
                </button>
                {contextMenu.senderId === myUser.id && (
                  <button 
                    onClick={async () => {
                      const msgId = contextMenu.msgId;
                      setContextMenu(null);
                      await supabase.from('messages').update({ content: 'DELETED:::' }).eq('id', msgId);
                      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: 'DELETED:::' } : m));
                      
                      // Broadcast unsend event to bypass RLS limitations on UPDATE payloads
                      if (presenceChannelRef.current) {
                        presenceChannelRef.current.send({
                          type: 'broadcast',
                          event: 'unsend',
                          payload: { msgId }
                        });
                      }
                    }}
                    className="w-full text-left px-4 py-3 text-[15px] font-medium text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={18} className="text-red-500" />
                    Unsend Message
                  </button>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
        {/* Premium UI/UX Violation Modal */}
        <AnimatePresence>
          {showViolationModal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white/95 backdrop-blur-xl border border-white/50 rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_20px_60px_-15px_rgba(249,115,22,0.3)] relative"
              >
                {/* Decorative glowing orb */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-400/30 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-red-400/20 rounded-full blur-3xl"></div>
                <div className="p-8 flex flex-col items-center text-center relative z-10">
                  <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
                    className="w-32 h-32 rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.15)] mb-6 border-4 border-white"
                  >
                    <img src="/3d_warning_icon.png" alt="3D Warning Icon" className="w-full h-full object-cover" />
                  </motion.div>
                  
                  <h2 className="text-2xl font-extrabold mb-3 bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent tracking-tight">
                    Friendly Reminder
                  </h2>
                  
                  <p className="text-[#6A7282] text-sm leading-relaxed mb-8">
                    Please abide by the Quro safe community guidelines. The message contains vulgar content.
                  </p>
                  
                  <button 
                    onClick={() => setShowViolationModal(false)}
                    className="w-full py-3.5 bg-black text-white rounded-2xl font-bold text-sm tracking-wide transition-all active:scale-95 shadow-lg shadow-black/20"
                  >
                    I Understand
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Premium UI/UX Ban Modal (Light Mode) */}
        <AnimatePresence>
          {showBanModal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white/95 backdrop-blur-xl border border-white/50 rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_20px_60px_-15px_rgba(239,68,68,0.3)] relative"
              >
                {/* Decorative glowing orb */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-400/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl"></div>

                <div className="p-8 flex flex-col items-center text-center relative z-10">
                  <motion.div 
                    animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                    className="w-24 h-24 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mb-6 relative shadow-inner"
                  >
                    <div className="absolute inset-0 border-2 border-red-400/20 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
                    <AlertTriangle size={48} className="text-red-500 drop-shadow-[0_2px_10px_rgba(239,68,68,0.3)]" />
                  </motion.div>
                  
                  <h2 className="text-2xl font-extrabold text-black mb-3 tracking-tight">
                    Account Restricted
                  </h2>
                  
                  <p className="text-gray-600 font-medium mb-8 leading-relaxed text-[15px]">
                    Due to severe or repeated violations of our Community Guidelines, your account has been permanently restricted from sending messages.
                  </p>
                  
                  <button 
                    onClick={() => router.push('/chat')}
                    className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-2xl transition-all shadow-[0_10px_20px_rgba(239,68,68,0.2)] active:scale-[0.98] flex items-center justify-center gap-2 mb-2"
                  >
                    Return Home
                  </button>
                  <button 
                    onClick={() => { setShowBanModal(false); router.push('/chat?tab=me'); }}
                    className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-2xl transition-colors text-sm border border-gray-200"
                  >
                    Go to Profile to Appeal
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
      <div style={{ display: 'none' }}></div>
    </>
  );
}
