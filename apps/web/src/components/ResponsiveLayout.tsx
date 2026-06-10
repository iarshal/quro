'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Users, UserRound, Plus, Search } from 'lucide-react';
import { ChatsTab } from './tabs/ChatsTab';
import { ContactsTab } from './tabs/ContactsTab';
import { MeTab } from './tabs/MeTab';

type Tab = 'chats' | 'contacts' | 'me';

export function ResponsiveLayout({ profile }: { profile: any }) {
  const [activeTab, setActiveTab] = useState<Tab>('chats');

  // WeChat Tab Configuration
  const tabs = [
    { id: 'chats', label: 'Chats', icon: MessageSquare },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'me', label: 'Me', icon: UserRound },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'chats': return <ChatsTab profile={profile} />;
      case 'contacts': return <ContactsTab profile={profile} />;
      case 'me': return <MeTab profile={profile} />;
      default: return <ChatsTab profile={profile} />;
    }
  };

  const getHeaderTitle = () => {
    if (activeTab === 'chats') return 'Quro';
    if (activeTab === 'me') return ''; // Empty title for Me tab
    return tabs.find(t => t.id === activeTab)?.label;
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#EDEDED] overflow-hidden text-black font-sans">
      
      {/* WECHAT TOP APP BAR */}
      <header className={`flex items-center justify-between px-4 h-14 shrink-0 z-50 ${activeTab === 'me' ? 'bg-white' : 'bg-[#EDEDED]'}`}>
        <div className="flex-1"></div>
        <h1 className="text-[17px] font-bold tracking-wide flex-1 text-center">
          {getHeaderTitle()}
        </h1>
        <div className="flex-1 flex justify-end gap-4 text-black">
          {activeTab === 'chats' && (
            <>
              <Search size={22} className="cursor-pointer" />
              <Plus size={24} className="cursor-pointer" />
            </>
          )}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 relative overflow-y-auto w-full bg-[#EDEDED]">
        {renderContent()}
      </main>

      {/* WECHAT BOTTOM NAVIGATION */}
      <nav className="flex items-center justify-around h-[56px] bg-[#F7F7F7] border-t border-gray-300 pb-safe shrink-0 z-50 w-full">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
            >
              <tab.icon 
                size={26} 
                className={`mb-1 transition-colors ${isActive ? 'text-[#07C160]' : 'text-gray-800'}`} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-[#07C160]' : 'text-gray-500'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
      
    </div>
  );
}
