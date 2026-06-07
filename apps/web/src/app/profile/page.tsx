'use client';

import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { motion } from 'framer-motion';
import { ShieldCheck, Link as LinkIcon, Copy, Check } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function ProfilePage() {
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: any } | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      } else {
        // Fallback for demo purposes if not strictly authenticated
        setUser({
          id: 'demo-user-123',
          email: 'creator@example.com',
          user_metadata: { full_name: 'Alex Creator' }
        });
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#111111] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  if (!user) {
    return <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center">Please sign in to view your profile.</div>;
  }

  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/${user.id}` : `https://quro.chat/${user.id}`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-gray-100 font-sans p-6 md:p-12 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-blue-900/10 blur-[100px]" />
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-12">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            ← Back to Home
          </Link>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm">
             <ShieldCheck className="w-4 h-4 text-emerald-400" />
             <span className="text-gray-300">Account Verified</span>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111111] border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl"
        >
          <div className="flex flex-col md:flex-row items-center gap-10">
            {/* Left: Avatar & Info */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
               <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white mb-6 shadow-xl relative">
                  {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                  <div className="absolute -bottom-2 -right-2 bg-[#111111] rounded-full p-1 border border-white/10">
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                  </div>
               </div>
               
               <h1 className="text-3xl font-bold text-white flex items-center gap-2 mb-2">
                 {user.user_metadata?.full_name || 'Anonymous User'}
               </h1>
               <p className="text-gray-400 mb-8">{user.email}</p>

               <div className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl p-4">
                  <p className="text-sm text-gray-500 mb-2 font-medium">Your Unique Link</p>
                  <div className="flex items-center justify-between bg-[#000000] border border-white/10 rounded-xl px-4 py-3">
                     <span className="text-gray-300 text-sm truncate mr-4">{profileUrl}</span>
                     <button 
                       onClick={handleCopy}
                       className="text-blue-400 hover:text-blue-300 transition-colors p-2 hover:bg-white/5 rounded-lg shrink-0"
                       title="Copy to clipboard"
                     >
                       {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                     </button>
                  </div>
               </div>
            </div>

            {/* Right: QR Code */}
            <div className="flex flex-col items-center bg-white p-6 rounded-3xl shadow-xl border-4 border-white/10">
               <div className="bg-white p-2 rounded-xl mb-4">
                  <QRCode 
                    value={profileUrl} 
                    size={180} 
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="H"
                  />
               </div>
               <div className="flex items-center gap-2 text-black font-semibold text-sm">
                 <LinkIcon className="w-4 h-4" />
                 Scan to Connect
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
