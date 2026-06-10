'use client';

import { useState, useEffect } from 'react';
import { Search, UserRound, Copy, CheckCircle2, Info, Calendar, Link as LinkIcon, X, UserPlus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { motion } from 'framer-motion';

export function ContactsTab({ profile }: { profile: any }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [infoContact, setInfoContact] = useState<any>(null);
  
  const [globalSearchResults, setGlobalSearchResults] = useState<any[]>([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [sendingRequestTo, setSendingRequestTo] = useState<string | null>(null);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const { data: friendships, error } = await supabase
          .from('friends')
          .select('*')
          .or(`user_id.eq.${profile.id},friend_id.eq.${profile.id}`);

        if (error) throw error;

        const friendIds = friendships.map(f => f.user_id === profile.id ? f.friend_id : f.user_id);
        
        if (friendIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('*')
            .in('id', friendIds);
            
          const enrichedFriends = profilesData?.map(p => {
            const friendship = friendships.find(f => f.user_id === p.id || f.friend_id === p.id);
            return {
              ...p,
              friendship_date: friendship?.created_at,
              connected_via: friendship?.connected_via,
            };
          }) || [];
          
          enrichedFriends.sort((a, b) => {
            return new Date(b.friendship_date).getTime() - new Date(a.friendship_date).getTime();
          });
          
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

  useEffect(() => {
    if (searchQuery.length >= 8) {
      const searchGlobal = async () => {
        setIsSearchingGlobal(true);
        try {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .ilike('id', `${searchQuery}%`)
            .neq('id', profile.id)
            .limit(5);
            
          if (data) {
            const friendIds = friends.map(f => f.id);
            setGlobalSearchResults(data.filter(p => !friendIds.includes(p.id)));
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearchingGlobal(false);
        }
      };
      const timeoutId = setTimeout(searchGlobal, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setGlobalSearchResults([]);
    }
  }, [searchQuery, friends, profile.id]);

  const filteredFriends = friends.filter(f => 
    f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendFriendRequest = async (e: React.MouseEvent, targetProfile: any) => {
    e.stopPropagation();
    setSendingRequestTo(targetProfile.id);
    try {
      // Find or create conversation
      let conversationId = [profile.id, targetProfile.id].sort().join('_');
      
      // Send a friend request message
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: profile.id,
        receiver_id: targetProfile.id,
        content: `Friend Request from ${profile.name || 'someone'}`,
        type: 'friend_request',
        status: 'sent'
      });
      
      alert('Friend request sent!');
      setGlobalSearchResults(prev => prev.filter(p => p.id !== targetProfile.id));
    } catch (err) {
      console.error('Error sending request:', err);
      alert('Failed to send request.');
    } finally {
      setSendingRequestTo(null);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white text-black font-sans">
      
      {/* Top App Bar */}
      <div className="bg-[#EDEDED] px-4 pt-6 pb-3 sticky top-0 z-10 flex flex-col gap-3">
        <div className="bg-white rounded-lg flex items-center px-3 py-2 shadow-sm">
          <Search size={18} className="text-gray-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search contacts..." 
            className="bg-transparent border-none focus:outline-none text-[15px] w-full text-black placeholder:text-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center p-8 text-gray-400 text-sm animate-pulse">Loading contacts...</div>
        ) : friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400">
            <UserRound size={48} className="mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-600 mb-2">No contacts yet</p>
            <p className="text-sm">Scan a QR Code in the 'Me' tab to add a contact!</p>
          </div>
        ) : (
          <div className="flex flex-col mt-2">
            <div className="px-4 py-1.5 bg-[#EDEDED] text-[13px] font-semibold text-gray-500">
              All Contacts ({friends.length})
            </div>
            {filteredFriends.map((friend) => (
              <motion.div 
                key={friend.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => router.push(`/chat/${friend.id}`)}
                className="flex items-center px-4 py-3 bg-white active:bg-gray-100 cursor-pointer border-b border-gray-100"
              >
                <div className="w-[44px] h-[44px] rounded-md bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center border border-black/5">
                  {friend.avatar_url ? (
                    <img src={friend.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300 text-white font-bold text-lg">
                      {friend.name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <div className="ml-3 flex-1 flex flex-col justify-center">
                  <h3 className="text-[16px] font-medium text-black leading-tight">
                    {friend.name || 'Unknown User'}
                  </h3>
                  <p className="text-[13px] text-gray-500 mt-1 truncate max-w-[200px]">
                    ID: {friend.id.substring(0, 8)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setInfoContact(friend); }}
                    className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 text-gray-400 hover:text-blue-500 transition-colors"
                    title="Contact Info"
                  >
                    <Info size={18} />
                  </button>
                  <button 
                    onClick={(e) => copyId(e, friend.id)}
                    className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 text-gray-500 transition-colors"
                    title="Copy Contact ID"
                  >
                    {copiedId === friend.id ? <CheckCircle2 size={20} className="text-[#07C160]" /> : <Copy size={18} />}
                  </button>
                </div>
              </motion.div>
            ))}

            {isSearchingGlobal && (
              <div className="flex justify-center p-4">
                <Loader2 className="animate-spin text-gray-400" size={20} />
              </div>
            )}

            {globalSearchResults.length > 0 && (
              <div className="mt-4 border-t border-gray-100">
                <div className="px-4 py-2 bg-blue-50 text-[13px] font-semibold text-blue-600 flex items-center justify-between">
                  <span>Global Search Results</span>
                </div>
                {globalSearchResults.map((result) => (
                  <motion.div 
                    key={result.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center px-4 py-3 bg-white border-b border-gray-100"
                  >
                    <div className="w-[44px] h-[44px] rounded-md bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center border border-black/5">
                      {result.avatar_url ? (
                        <img src={result.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300 text-white font-bold text-lg">
                          {result.name?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="ml-3 flex-1 flex flex-col justify-center">
                      <h3 className="text-[16px] font-medium text-black leading-tight">
                        {result.name || 'Unknown User'}
                      </h3>
                      <p className="text-[13px] text-gray-500 mt-1 truncate max-w-[200px]">
                        ID: {result.id.substring(0, 8)}
                      </p>
                    </div>
                    <button 
                      onClick={(e) => sendFriendRequest(e, result)}
                      disabled={sendingRequestTo === result.id}
                      className="ml-2 px-3 py-1.5 bg-[#07C160] text-white text-sm font-medium rounded-full hover:bg-[#06ae56] active:bg-[#059b4c] transition-colors flex items-center disabled:opacity-50"
                    >
                      {sendingRequestTo === result.id ? <Loader2 size={16} className="animate-spin" /> : <><UserPlus size={16} className="mr-1" /> Add</>}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Modal */}
      {infoContact && (
        <div className="absolute inset-0 bg-black/40 z-50 flex flex-col justify-end">
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="bg-white rounded-t-2xl p-6 pb-safe relative"
          >
            <button 
              onClick={() => setInfoContact(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-md mb-3 flex items-center justify-center">
                {infoContact.avatar_url ? (
                  <img src={infoContact.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-white bg-gray-400 w-full h-full flex items-center justify-center">
                    {infoContact.name?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-black">{infoContact.name}</h2>
              <p className="text-sm text-gray-500 font-medium">ID: {infoContact.id.substring(0, 8)}</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-full"><Calendar size={20} /></div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Added On</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {new Date(infoContact.friendship_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {new Date(infoContact.friendship_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="p-2 bg-green-100 text-green-600 rounded-full"><LinkIcon size={20} /></div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Connected Via</p>
                  <p className="text-sm font-semibold text-gray-800">{infoContact.connected_via || 'Unknown'}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
