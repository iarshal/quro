'use client';

import { ChevronLeft, LogOut, Info, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
      }
    }
    load();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'I PERMANENTLY DELETE MY ACCOUNT') return;
    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Delete profile from DB. This effectively orphans the account and makes it unusable.
        await supabase.from('profiles').delete().eq('id', user.id);
      }
      await supabase.auth.signOut();
      router.push('/auth');
    } catch (e) {
      console.error(e);
      alert("Failed to delete account");
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#EDEDED] font-sans">
      <header className="flex items-center justify-between px-4 h-14 bg-[#EDEDED] shrink-0 border-b border-gray-300">
        <div className="flex items-center gap-1 cursor-pointer w-20" onClick={() => router.back()}>
          <ChevronLeft size={28} className="text-black -ml-2" />
        </div>
        <h1 className="text-[17px] font-bold tracking-wide flex-1 text-center text-black">
          Settings
        </h1>
        <div className="w-20" /> {/* Spacer */}
      </header>

      <main className="flex-1 overflow-y-auto pt-4">
        <div className="bg-white border-y border-gray-200">
          <div className="flex items-center px-4 py-4">
            <Info size={24} className="text-[#07C160] shrink-0" />
            <div className="ml-3 flex-1">
              <p className="text-black text-[17px]">Account Created</p>
              <p className="text-gray-500 text-[14px]">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Loading...'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white border-y border-gray-200">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-4 active:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <LogOut size={20} className="text-black mr-2" />
            <span className="text-black text-[17px] font-semibold">Log Out</span>
          </button>
          
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center justify-center px-4 py-4 active:bg-gray-50 transition-colors"
          >
            <Trash2 size={20} className="text-red-500 mr-2" />
            <span className="text-red-500 text-[17px] font-semibold">Delete Account</span>
          </button>
        </div>
      </main>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm flex flex-col items-center"
            >
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={24} />
              </div>
              <h2 className="text-xl font-bold text-black mb-2">Delete Account?</h2>
              <p className="text-gray-500 text-center mb-4 text-[15px] leading-relaxed">
                This action is irreversible. All your messages, connections, and profile data will be permanently removed.
              </p>
              
              <div className="w-full mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Type <span className="text-red-500 font-bold">I PERMANENTLY DELETE MY ACCOUNT</span> below to confirm:
                </p>
                <input 
                  type="text" 
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="Type here..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-3 text-black focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => { setShowDeleteModal(false); setDeleteInput(''); }}
                  className="flex-1 py-3 bg-gray-100 text-black font-semibold rounded-xl active:bg-gray-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== 'I PERMANENTLY DELETE MY ACCOUNT' || isDeleting}
                  className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl active:bg-red-600 disabled:opacity-50 disabled:active:bg-red-500 transition-opacity"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
