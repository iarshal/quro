'use client';

import { useState, useEffect } from 'react';
import { Search, PlusCircle, MessageCircle, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { motion } from 'framer-motion';

export function ChatsTab({ profile }: { profile: any }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
            
          // Combine friendship data with profile data
          const enrichedFriends = profilesData?.map(p => {
            const friendship = friendships.find(f => f.user_id === p.id || f.friend_id === p.id);
            return {
              ...p,
              friendship_date: friendship?.created_at,
              connected_via: friendship?.connected_via
            };
          }) || [];
          
          setFriends(enrichedFriends);
        }
      } catch (err) {
        console.error("Error fetching friends:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
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
        {loading ? (
          <div className="flex justify-center p-8 text-gray-400 text-sm animate-pulse">Loading chats...</div>
        ) : friends.length === 0 ? (
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
              onClick={() => router.push(`/chat/${friend.id}`)}
              className="flex items-center px-4 py-3 bg-white active:bg-gray-100 cursor-pointer border-b border-gray-100"
            >
              <div className="w-12 h-12 rounded-[10px] bg-gray-200 shrink-0 overflow-hidden relative">
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
                    {new Date(friend.friendship_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-[14px] text-gray-500 line-clamp-1 leading-tight">
                  {friend.bio || `Connected via ${friend.connected_via}`}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
