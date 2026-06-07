'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, MessageSquare, Video, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { MessagePane } from '../../components/MessagePane';

export default function PublicProfilePage({ params }: { params: { user_id: string } }) {
  const [profile, setProfile] = useState<{ id: string; display_name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; display_name?: string } | null>(null);

  useEffect(() => {
    // 1. Fetch current user from session
    // 2. Fetch public profile of the user_id
    const fetchProfile = async () => {
      // In a real app, you would query your users/profiles table here
      // For this implementation, we will simulate fetching the profile
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser({ id: session.user.id, display_name: session.user.user_metadata?.full_name || session.user.email });
      } else {
        // Fallback for anonymous guests
        setCurrentUser({ id: `guest-${Math.random().toString(36).substring(7)}`, display_name: 'Guest' });
      }

      // Simulate network request for the shared link owner
      setTimeout(() => {
        setProfile({
          id: params.user_id,
          display_name: 'Alex Creator', // Replace with actual DB query
        });
        setLoading(false);
      }, 800);
    };

    fetchProfile();
  }, [params.user_id]);

  if (loading) {
    return <div className="min-h-screen bg-[#111111] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  if (!profile) {
    return <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center">Profile not found.</div>;
  }

  if (showChat && currentUser) {
    // Determine conversation ID. In a real app, this should be consistent or unique between the two users.
    // E.g., const convId = [currentUser.id, profile.id].sort().join('_');
    const conversationId = `conv_${params.user_id}_${currentUser.id}`;
    
    return (
      <div className="h-screen w-full bg-[#111111] overflow-hidden">
        <MessagePane 
          conversationId={conversationId}
          otherUser={{ id: profile.id, display_name: profile.display_name, avatar_url: null }}
          currentProfile={currentUser}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-gray-100 font-sans p-6 md:p-12 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-blue-900/10 blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#111111] border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 flex flex-col items-center text-center"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white mb-6 shadow-xl relative">
          {profile.display_name.charAt(0).toUpperCase()}
          <div className="absolute -bottom-2 -right-2 bg-[#111111] rounded-full p-1 border border-white/10">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">{profile.display_name}</h1>
        <p className="text-gray-400 text-sm mb-8 px-4">
          Verified Quro User. Secure end-to-end communication gateway.
        </p>

        <div className="w-full space-y-3">
           <button 
             onClick={() => setShowChat(true)}
             className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-colors"
           >
             <MessageSquare className="w-5 h-5" />
             Start Secure Chat
           </button>
           <button 
             onClick={() => setShowChat(true)} // They will use the buttons inside the chat pane for calls
             className="w-full flex items-center justify-center gap-3 bg-[#1A1A1A] border border-white/10 hover:bg-white/5 text-white font-semibold py-3.5 rounded-xl transition-colors"
           >
             <Video className="w-5 h-5" />
             Request Video Call
           </button>
        </div>
      </motion.div>
      
      <p className="text-xs text-gray-600 mt-8 relative z-10 flex items-center gap-1">
        <ShieldCheck className="w-3 h-3" /> Protected by Quro Realtime E2E Platform
      </p>
    </div>
  );
}
