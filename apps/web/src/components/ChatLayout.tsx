'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { QuroLogo } from './QuroLogo';
import { Search, UserRound, BadgeCheck, LogOut, MessageSquare, QrCode, ScanLine, Copy } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface ChatLayoutProps {
  profile: any;
  children?: React.ReactNode;
}

export function ChatLayout({ profile, children }: ChatLayoutProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface text-on-surface">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 180, delay: 0.1 }}
        className="w-[340px] flex-shrink-0 border-r border-outline-variant flex flex-col bg-surface-container-lowest"
      >
        {/* Header - "Me" Section */}
        <div className="h-[72px] px-5 border-b border-outline-variant flex items-center justify-between bg-surface-container-low/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center relative shadow-sm border border-primary/20">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <UserRound size={20} />
              )}
              {profile?.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-surface-container-lowest rounded-full">
                  <BadgeCheck size={16} className="text-secondary fill-secondary/20" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-on-surface leading-tight">{profile?.name || 'User'}</h2>
              <p className="text-xs text-on-surface-variant font-medium">Online</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-variant/50 text-on-surface-variant transition-colors"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-variant/30 rounded-lg border border-transparent focus-within:border-primary/30 transition-colors">
            <Search size={16} className="text-on-surface-variant" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/60"
            />
          </div>
        </div>

        {/* Empty Chat List */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
          <div className="w-16 h-16 rounded-2xl bg-surface-variant/20 flex items-center justify-center">
            <MessageSquare size={24} className="text-on-surface-variant/50" />
          </div>
          <p className="text-sm font-medium">No conversations yet</p>
          <p className="text-xs text-on-surface-variant/70 text-center px-8">
            Share your link with a friend to start an encrypted chat.
          </p>
        </div>
      </motion.aside>

      {/* Main Pane */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex-1 flex flex-col items-center justify-center bg-surface relative"
      >
        <div className="absolute inset-0 ethereal-gradient pointer-events-none opacity-50"></div>
        
        {children}
      </motion.main>
    </div>
  );
}
