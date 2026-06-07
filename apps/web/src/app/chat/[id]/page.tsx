'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Video, MoreHorizontal, Smile, Plus, Mic, X, Image as ImageIcon, Camera, Folder, MapPin, Send, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

export default function RealChatPage() {
  const router = useRouter();
  const params = useParams();
  const friendId = params.id as string;
  
  const [friendProfile, setFriendProfile] = useState<any>(null);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hey! I just scanned your Quro Code.", sender: "friend", time: "10:00 AM" },
    { id: 2, text: "Let's share some good memories!", sender: "friend", time: "10:01 AM" }
  ]);
  const [input, setInput] = useState("");
  const [inVideoCall, setInVideoCall] = useState(false);
  
  // Interactive Tools State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const zegoContainerRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Friend Data
  useEffect(() => {
    const fetchFriend = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', friendId).single();
      if (data) setFriendProfile(data);
    };
    fetchFriend();
  }, [friendId]);

  // Scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showEmojis, showAttachments]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const newMsg = {
      id: Date.now(),
      text: input,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, newMsg]);
    setInput("");
    setShowEmojis(false);
    setShowAttachments(false);

    // Auto reply
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: "That's awesome! Video call me?",
        sender: "friend",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1000);
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      clearInterval(recordingTimerRef.current as NodeJS.Timeout);
      setRecordingTime(0);
      
      // Simulate sending voice note
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: "🎤 Voice Message (0:0" + recordingTime + ")",
        sender: "me",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } else {
      // Start recording
      setIsRecording(true);
      setShowEmojis(false);
      setShowAttachments(false);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    // Simulate upload delay
    setTimeout(() => {
      setIsUploading(false);
      setShowAttachments(false);
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: "🖼️ Image sent: " + file.name,
        sender: "me",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1500);
  };

  const startZegoCall = async (element: HTMLDivElement) => {
    if (!element) return;
    
    // Dynamically import ZegoCloud to avoid SSR 'document is not defined' errors
    const { ZegoUIKitPrebuilt } = await import('@zegocloud/zego-uikit-prebuilt');

    const appID = Number(process.env.NEXT_PUBLIC_ZEGOCLOUD_APP_ID);
    const serverSecret = process.env.NEXT_PUBLIC_ZEGOCLOUD_SERVER_SECRET || "";
    
    if (!appID || !serverSecret) {
      alert("ZegoCloud keys missing in .env.local!");
      setInVideoCall(false);
      return;
    }

    const roomID = `room_${friendId.substring(0, 8)}`; 
    const userID = Math.floor(Math.random() * 10000).toString();
    const userName = `User_${userID}`;

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(appID, serverSecret, roomID, userID, userName);
    const zp = ZegoUIKitPrebuilt.create(kitToken);

    zp.joinRoom({
      container: element,
      scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
      showPreJoinView: false,
      turnOnCameraWhenJoining: true,
      turnOnMicrophoneWhenJoining: true,
      onLeaveRoom: () => { setInVideoCall(false); }
    });
  };

  useEffect(() => {
    if (inVideoCall && zegoContainerRef.current) startZegoCall(zegoContainerRef.current);
  }, [inVideoCall]);

  if (inVideoCall) {
    return (
      <div className="flex flex-col h-screen w-full bg-black relative">
        <button onClick={() => setInVideoCall(false)} className="absolute top-10 left-6 z-50 p-2 bg-white/20 rounded-full text-white backdrop-blur-md">
          <X size={24} />
        </button>
        <div ref={zegoContainerRef} className="w-full h-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#EDEDED] font-sans">
      <header className="flex items-center justify-between px-4 h-14 bg-[#EDEDED] shrink-0 z-50 border-b border-gray-300">
        <div className="flex-1 flex items-center gap-1 cursor-pointer" onClick={() => router.push('/chat')}>
          <ChevronLeft size={28} className="text-black" />
        </div>
        <h1 className="text-[17px] font-bold tracking-wide flex-1 text-center text-black truncate">
          {friendProfile?.name || `Friend (${friendId.substring(0,6)}...)`}
        </h1>
        <div className="flex-1 flex justify-end gap-4 text-black">
          <Video size={24} className="cursor-pointer" onClick={() => setInVideoCall(true)} />
          <MoreHorizontal size={24} className="cursor-pointer" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 relative">
        <div className="text-center text-xs text-gray-400 mb-4">
          Today {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'friend' && (
              <div className="w-10 h-10 rounded-lg bg-gray-300 shrink-0 mr-3 overflow-hidden flex items-center justify-center text-white font-bold text-lg">
                {friendProfile?.avatar_url ? <img src={friendProfile.avatar_url} className="w-full h-full object-cover"/> : (friendProfile?.name?.charAt(0) || 'F')}
              </div>
            )}
            
            <div className={`max-w-[70%] rounded-lg p-3 text-[16px] leading-relaxed shadow-sm relative ${
              msg.sender === 'me' ? 'bg-[#95EC69] text-black' : 'bg-white text-black'
            }`}>
              <div className={`absolute top-3 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent ${
                msg.sender === 'me' ? 'right-[-6px] border-l-[8px] border-l-[#95EC69]' : 'left-[-6px] border-r-[8px] border-r-white'
              }`}></div>
              {msg.text}
            </div>
            
            {msg.sender === 'me' && (
              <div className="w-10 h-10 rounded-lg bg-[#07C160] shrink-0 ml-3 overflow-hidden flex items-center justify-center text-white font-bold text-lg">
                Me
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </main>

      <div className="bg-[#F7F7F7] border-t border-gray-300 pb-safe shrink-0 flex flex-col">
        {/* Input Bar */}
        <div className="p-2 flex items-center gap-2">
          {isRecording ? (
            <div className="flex-1 bg-[#E5E5E5] border border-gray-300 rounded p-2 text-black text-center font-medium animate-pulse cursor-pointer" onClick={toggleRecording}>
              Recording... 0:0{recordingTime} (Tap to send)
            </div>
          ) : (
            <>
              <Mic size={28} className="text-gray-600 shrink-0 p-1 cursor-pointer" onClick={toggleRecording} />
              <input 
                type="text" 
                value={input}
                onFocus={() => {setShowEmojis(false); setShowAttachments(false);}}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-white border border-gray-300 rounded p-2 text-[16px] focus:outline-none focus:border-[#07C160] text-black"
              />
            </>
          )}

          <Smile 
            size={28} 
            className={`shrink-0 p-1 cursor-pointer transition-colors ${showEmojis ? 'text-[#07C160]' : 'text-gray-600'}`} 
            onClick={() => {setShowEmojis(!showEmojis); setShowAttachments(false); setIsRecording(false);}} 
          />
          
          {input.trim() ? (
            <button onClick={handleSend} className="bg-[#07C160] text-white px-3 py-1.5 rounded font-medium text-sm">Send</button>
          ) : (
            <Plus 
              size={28} 
              className={`shrink-0 p-1 cursor-pointer transition-colors ${showAttachments ? 'text-[#07C160]' : 'text-gray-600'}`} 
              onClick={() => {setShowAttachments(!showAttachments); setShowEmojis(false); setIsRecording(false);}} 
            />
          )}
        </div>

        {/* Emojis Popover */}
        <AnimatePresence>
          {showEmojis && (
            <motion.div initial={{ height: 0 }} animate={{ height: 200 }} exit={{ height: 0 }} className="w-full bg-[#EDEDED] overflow-hidden border-t border-gray-300">
              <div className="p-4 grid grid-cols-8 gap-4 text-3xl">
                {['😀','😂','🥰','😎','🤔','😭','😡','👍','🙏','🎉','🔥','💯','❤️','✨','👀','👋'].map(emoji => (
                  <button key={emoji} onClick={() => setInput(input + emoji)} className="hover:scale-110 active:scale-95 transition-transform">{emoji}</button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attachments Popover */}
        <AnimatePresence>
          {showAttachments && (
            <motion.div initial={{ height: 0 }} animate={{ height: 200 }} exit={{ height: 0 }} className="w-full bg-[#EDEDED] overflow-hidden border-t border-gray-300">
              <div className="p-6 grid grid-cols-4 gap-6">
                <div className="flex flex-col items-center gap-2 relative">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-gray-200">
                    {isUploading ? <Loader2 size={24} className="text-gray-400 animate-spin" /> : <ImageIcon size={28} className="text-gray-600" />}
                  </div>
                  <span className="text-xs text-gray-500 font-medium">Photos</span>
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
                </div>
                
                <div className="flex flex-col items-center gap-2 cursor-pointer">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-gray-200"><Camera size={28} className="text-gray-600" /></div>
                  <span className="text-xs text-gray-500 font-medium">Camera</span>
                </div>

                <div className="flex flex-col items-center gap-2 cursor-pointer">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-gray-200"><Folder size={28} className="text-gray-600" /></div>
                  <span className="text-xs text-gray-500 font-medium">File</span>
                </div>

                <div className="flex flex-col items-center gap-2 cursor-pointer">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-gray-200"><MapPin size={28} className="text-gray-600" /></div>
                  <span className="text-xs text-gray-500 font-medium">Location</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
