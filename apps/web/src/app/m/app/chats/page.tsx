'use client';

/**
 * Mobile Chats List Page
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Search } from 'lucide-react';
import { QuroLogo } from '@/components/QuroLogo';
import { MobileButton } from '@/components/MobileButton';
import styles from './chats.module.css';

interface ChatPreview {
  id: string;
  name: string;
  avatar: string | null;
  lastMessage: string;
  time: string;
  unread: number;
}

export default function MobileChatsPage() {
  const router = useRouter();
  
  // Mock data for initial view
  const [chats] = useState<ChatPreview[]>([]);

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Chats</h1>
        <button className={styles.actionBtn} onClick={() => router.push('/m/app/scan')}>
          <span className={styles.actionIcon}><Camera size={20} /></span>
        </button>
      </header>

      <div className={styles.searchBar}>
        <span className={styles.searchIcon}><Search size={18} /></span>
        <input 
          type="text" 
          placeholder="Search conversations..." 
          className={styles.searchInput}
        />
      </div>

      <main className={styles.listContainer}>
        <AnimatePresence>
          {chats.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={styles.emptyState}
            >
              <div className={styles.emptyIconWrap}>
                <QuroLogo size={48} />
              </div>
              <h2 className={styles.emptyTitle}>No chats yet</h2>
              <p className={styles.emptySub}>
                Scan a friend's Quro QR code or share your own to start chatting.
              </p>
              <MobileButton 
                variant="primary" 
                onPress={() => router.push('/m/app/scan')}
                style={{ marginTop: '16px' }}
              >
                Scan QR Code
              </MobileButton>
            </motion.div>
          ) : (
            chats.map((chat) => (
              <motion.button
                key={chat.id}
                className={styles.chatItem}
                whileTap={{ backgroundColor: 'var(--color-surface-hover)' }}
                onClick={() => router.push(`/m/app/chat/${chat.id}`)}
              >
                <div className={styles.avatar}>
                  {chat.avatar ? (
                    <img src={chat.avatar} alt={chat.name} />
                  ) : (
                    <span>{chat.name.charAt(0)}</span>
                  )}
                </div>
                <div className={styles.chatInfo}>
                  <div className={styles.chatHeader}>
                    <span className={styles.chatName}>{chat.name}</span>
                    <span className={styles.chatTime}>{chat.time}</span>
                  </div>
                  <div className={styles.chatMsg}>
                    <span className={styles.chatSnippet}>{chat.lastMessage}</span>
                    {chat.unread > 0 && (
                      <span className={styles.unreadBadge}>{chat.unread}</span>
                    )}
                  </div>
                </div>
              </motion.button>
            ))
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
