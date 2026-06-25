'use client';

import { useState, useEffect } from 'react';
import { Search, PlusCircle, MessageCircle, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { motion } from 'framer-motion';

let globalCachedFriends: any[] = [];
let globalHasFetched = false;

if (typeof window !== 'undefined') {
  window.addEventListener('messages_seen', (e: any) => {
    const { friendId } = e.detail;
    globalCachedFriends = globalCachedFriends.map(f => f.id === friendId ? { ...f, unreadCount: 0 } : f);
  });
}

export function ChatsTab({ profile }: { profile: any }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [friends, setFriends] = useState<any[]>(globalCachedFriends);
  const [loading, setLoading] = useState(!globalHasFetched);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        // Fetch friendships where user is either user_id or friend_id
        const { data: friendships, error } = await supabase
          .from('friends')
          .select('*')
          .or(`user_id.eq.${profile.id},friend_id.eq.${profile.id}`);

        if (error) throw error;

        // We need to fetch the profiles of the OTHER person in the friendship
        const friendIds = friendships.map(f => f.user_id === profile.id ? f.friend_id : f.user_id);
        
        if (friendIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('*')
            .in('id', friendIds);
            
          // Fetch all messages related to this user
          const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
            .order('created_at', { ascending: false });

          // Combine friendship data with profile data and message data
          const enrichedFriends = profilesData?.map(p => {
            const friendship = friendships.find(f => f.user_id === p.id || f.friend_id === p.id);
            const friendMessages = messages?.filter(m => m.sender_id === p.id || m.receiver_id === p.id) || [];
            const lastMessage = friendMessages.length > 0 ? friendMessages[0] : null;
            const unreadCount = friendMessages.filter(m => m.sender_id === p.id && m.receiver_id === profile.id && m.status !== 'seen').length;
            
            return {
              ...p,
              friendship_date: friendship?.created_at,
              connected_via: friendship?.connected_via,
              lastMessage,
              unreadCount
            };
          }) || [];
          
          // Sort friends by most recent message, then by friendship date
          enrichedFriends.sort((a, b) => {
            const dateA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : new Date(a.friendship_date).getTime();
            const dateB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : new Date(b.friendship_date).getTime();
            return dateB - dateA;
          });
          
          globalCachedFriends = enrichedFriends;
          globalHasFetched = true;
          setFriends(enrichedFriends);
        }
      } catch (err) {
        console.error("Error fetching friends:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();

    let timeoutId: NodeJS.Timeout;
    const debouncedFetchFriends = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fetchFriends();
      }, 500);
    };

    const channel = supabase.channel('chats_tab_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${profile.id}` }, debouncedFetchFriends)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `sender_id=eq.${profile.id}` }, debouncedFetchFriends)
      .subscribe();

    const handleMessagesSeen = (e: any) => {
      const { friendId } = e.detail;
      globalCachedFriends = globalCachedFriends.map(f => f.id === friendId ? { ...f, unreadCount: 0 } : f);
      setFriends(globalCachedFriends);
    };
    window.addEventListener('messages_seen', handleMessagesSeen);

    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
      window.removeEventListener('messages_seen', handleMessagesSeen);
    };
  }, [profile.id]);

  const filteredFriends = friends.filter(f => 
    f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full w-full bg-white text-black font-sans">
      
      {/* Top App Bar */}
      <div className="bg-[#EDEDED] px-4 pt-6 pb-3 sticky top-0 z-10 flex flex-col gap-3">
        {/* Search Bar */}
        <div className="bg-white rounded-lg flex items-center px-3 py-2 shadow-sm">
          <Search size={18} className="text-gray-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search friends..." 
            className="bg-transparent border-none focus:outline-none text-[15px] w-full text-black placeholder:text-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? null : friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400">
            <UserRound size={48} className="mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-600 mb-2">No friends yet</p>
            <p className="text-sm">Scan a QR Code in the 'Me' tab to connect with someone!</p>
          </div>
        ) : (
          filteredFriends.map((friend) => (
            <motion.div 
              key={friend.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => {
                globalCachedFriends = globalCachedFriends.map(f => f.id === friend.id ? { ...f, unreadCount: 0 } : f);
                setFriends(globalCachedFriends);
                router.push(`/chat/${friend.id}`);
              }}
              className="flex items-center px-4 py-3 bg-white active:bg-gray-100 cursor-pointer border-b border-gray-100"
            >
              <div className="w-[50px] h-[50px] rounded-full bg-gray-200 overflow-hidden shrink-0 border border-black/5 flex items-center justify-center">
                {friend.avatar_url ? (
                  <img src={friend.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300 text-white font-bold text-lg">
                    {friend.name?.charAt(0) || 'F'}
                  </div>
                )}
              </div>
              <div className="ml-3 flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-end mb-0.5">
                  <h3 className="text-[17px] font-semibold text-black leading-tight">
                    {friend.name || 'Unknown User'}
                  </h3>
                  <span className="text-xs text-gray-400">
                    {friend.lastMessage ? new Date(friend.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(friend.friendship_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[14px] text-gray-500 line-clamp-1 leading-tight pr-4">
                    {friend.lastMessage 
                      ? (friend.lastMessage.type === 'voice' || friend.lastMessage.content?.startsWith('AUDIO:::') ? '🎤 Voice Message' 
                        : friend.lastMessage.type === 'image' || friend.lastMessage.content?.startsWith('IMAGE:::') ? '📷 Image' 
                        : friend.lastMessage.type === 'video_call' ? '📹 Video Call'
                        : friend.lastMessage.type === 'system' ? 'System Message'
                        : friend.lastMessage.content)
                      : friend.bio || `Connected via ${friend.connected_via}`}
                  </p>
                  {friend.unreadCount > 0 && (
                    <div className="min-w-[20px] h-[20px] rounded-full bg-red-500 flex items-center justify-center text-white text-[12px] font-bold px-1.5 shrink-0">
                      {friend.unreadCount}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
