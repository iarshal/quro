'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { Video, Phone, Check, CheckCheck, X } from 'lucide-react';
import { ZegoCloudWrapper } from './ZegoCloudWrapper';

interface MessagePaneProps {
  conversationId: string;
  otherUser: { id: string; display_name: string; avatar_url: string | null };
  currentProfile: { id: string; display_name?: string };
}

export function MessagePane({ conversationId, otherUser, currentProfile }: MessagePaneProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  const [showZegoCloud, setShowZegoCloud] = useState(false);
  const [callType, setCallType] = useState<'video' | 'audio'>('video');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
        
      if (data && !error) {
        setMessages(data);
      }
    };
    fetchMessages();
  }, [conversationId]);

  // Subscribe to real-time changes
  useEffect(() => {
    const channel = supabase
      .channel(`public:messages:conversation_id=eq.${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT and UPDATE (for delivery status)
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages((prev) => {
              // Prevent duplicates if we already added it optimistically
              if (prev.find((m) => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          } else if (payload.eventType === 'UPDATE') {
             setMessages((prev) =>
               prev.map((m) => (m.id === payload.new.id ? payload.new : m))
             );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  async function sendMessage() {
    const text = inputValue.trim();
    if (!text || sending) return;
    setSending(true);
    setInputValue('');

    const optimisticId = `temp-${Date.now()}`;
    const newMsg = {
      id: optimisticId,
      sender_id: currentProfile.id,
      conversation_id: conversationId,
      plaintext: text,
      created_at: new Date().toISOString(),
      status: 'sending', // optimistic state
    };

    setMessages((prev) => [...prev, newMsg]);

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: currentProfile.id,
        conversation_id: conversationId,
        plaintext: text,
        status: 'sent', // Will be written to DB as sent
      })
      .select()
      .single();

    if (data && !error) {
      setMessages((prev) => prev.map((m) => m.id === optimisticId ? data : m));
    }
    
    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const handleCall = (type: 'video' | 'audio') => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      setShowMobileSheet(true);
    } else {
      setCallType(type);
      setShowZegoCloud(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111111] text-gray-100 font-sans relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-white/10 bg-[#1A1A1A] shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-lg">
             {otherUser.display_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{otherUser.display_name}</p>
            <p className="text-xs text-blue-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Real-time Active
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <button onClick={() => handleCall('audio')} className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5">
             <Phone className="w-5 h-5" />
           </button>
           <button onClick={() => handleCall('video')} className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5">
             <Video className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative scroll-smooth z-0">
        <AnimatePresence initial={false}>
          {messages.map(msg => {
            const isOwn = msg.sender_id === currentProfile.id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isOwn ? 'flex-end' : 'flex-start',
                }}
              >
                <div 
                  className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm ${
                    isOwn 
                      ? 'bg-blue-600 text-white rounded-tr-sm' 
                      : 'bg-[#2A2A2A] text-gray-200 rounded-tl-sm border border-white/5'
                  }`}
                  style={{ wordBreak: 'break-word' }}
                >
                  {msg.plaintext}
                </div>
                <div className="flex items-center gap-1 mt-1 px-1">
                  <span className="text-[10px] text-gray-500">
                    {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </span>
                  {isOwn && (
                    <span className="text-gray-500">
                      {msg.status === 'delivered' ? <CheckCheck className="w-3 h-3 text-blue-400" /> : <Check className="w-3 h-3" />}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Input */}
      <div className="p-3 bg-[#1A1A1A] border-t border-white/10 shrink-0 z-10">
        <div className="flex items-center gap-2 bg-[#2A2A2A] rounded-full px-4 py-2 border border-white/5 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none py-1"
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || sending}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              inputValue.trim() ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-white/5 text-gray-600 cursor-not-allowed'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M17 10L3 3l3.5 7L3 17l14-7z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Sheet Overlay */}
      <AnimatePresence>
        {showMobileSheet && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setShowMobileSheet(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-[#1A1A1A] border-t border-white/10 rounded-t-3xl p-6 z-50 flex flex-col items-center text-center"
            >
              <div className="w-12 h-1.5 bg-white/20 rounded-full mb-6" />
              <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-4">
                <Video className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">App Required</h3>
              <p className="text-gray-400 text-sm mb-6 max-w-xs">
                Background audio and video calling require the Quro Native App. Download now for the best experience.
              </p>
              <a 
                href="/download" 
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-colors"
              >
                Download App (APK)
              </a>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ZegoCloud Modal (Desktop) */}
      <AnimatePresence>
        {showZegoCloud && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-50 bg-[#111111] flex flex-col"
          >
            <div className="flex items-center justify-between p-4 bg-[#1A1A1A] border-b border-white/10">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-sm font-semibold text-white">Secure Connection</span>
               </div>
               <button onClick={() => setShowZegoCloud(false)} className="text-gray-400 hover:text-white p-2">
                 <X className="w-5 h-5" />
               </button>
            </div>
            <div className="flex-1 w-full h-full bg-black">
               <ZegoCloudWrapper 
                 roomID={conversationId} 
                 userID={currentProfile.id} 
                 userName={currentProfile.display_name || 'User'} 
                 callType={callType}
               />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
