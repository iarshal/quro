// @ts-nocheck
'use client';

/**
 * ChatLayout — Full authenticated desktop chat experience
 *
 * Layout:
 *   ┌─────────────┬─────────────────────────────────┐
 *   │  Sidebar    │        Message Pane              │
 *   │  (340px)    │                                  │
 *   │  - Profile  │   [Select a conversation]        │
 *   │  - Search   │                                  │
 *   │  - Chat     │                                  │
 *   │    list     │                                  │
 *   └─────────────┴─────────────────────────────────┘
 *
 * The entire layout animates in from the morph — sidebar slides from left,
 * message pane fades from right, creating a spatial expansion feel.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Profile, ConversationPreview } from '@quro/db';
import { QuroLogo } from './QuroLogo';
import { MessagePane } from './MessagePane';
import styles from './ChatLayout.module.css';

interface ChatLayoutProps {
  profile: Profile;
  authToken: string;
}

export function ChatLayout({ profile, authToken }: ChatLayoutProps) {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    try {
      const { createBrowserClient } = await import('@quro/db');
      const supabase = createBrowserClient();

      // Hydrate session from the mobile-provided auth token
      await supabase.auth.setSession({ access_token: authToken, refresh_token: '' });

      const { data: memberships } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', profile.id);

      if (!memberships) return;

      // For each conversation, fetch the other member's profile
      const previews: ConversationPreview[] = [];
      for (const m of memberships) {
        const { data: members } = await supabase
          .from('conversation_members')
          .select('user_id')
          .eq('conversation_id', m.conversation_id)
          .neq('user_id', profile.id);

        if (!members?.length) continue;

        const { data: otherUser } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', members[0].user_id)
          .single();

        if (!otherUser) continue;

        previews.push({
          conversation: { id: m.conversation_id, created_at: '' },
          otherUser,
          lastMessageAt: null,
          unreadCount: 0,
        });
      }

      setConversations(previews);
    } catch (err) {
      console.error('[Quro/chat] Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  }

  const selectedConv = conversations.find((c) => c.conversation.id === selectedId);

  return (
    <div className={styles.layout} id="chat-layout">
      {/* Sidebar — animates in from left */}
      <motion.aside
        className={styles.sidebar}
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 180, delay: 0.1 }}
      >
        {/* Sidebar Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarProfile}>
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className={`avatar avatar-md ${styles.myAvatar}`}
              />
            ) : (
              <div className={`avatar avatar-md ${styles.avatarPlaceholder}`}>
                {profile.display_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className={styles.myName}>{profile.display_name}</p>
              <p className={styles.myQuroId}>Quro: {profile.quro_id}</p>
            </div>
          </div>

          <button
            id="btn-new-chat"
            className={styles.newChatBtn}
            title="New Conversation"
          >
            <PenIcon />
          </button>
        </div>

        {/* Search */}
        <div className={styles.searchBar}>
          <SearchIcon />
          <input
            id="input-search-chats"
            type="text"
            placeholder="Search conversations…"
            className={styles.searchInput}
          />
        </div>

        {/* Chat list */}
        <div className={styles.chatList}>
          {loading ? (
            <div className={styles.chatListLoading}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className={styles.chatSkeleton} style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className={styles.emptyState}>
              <QuroLogo size={48} />
              <p>No conversations yet</p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-disabled)' }}>
                Scan a friend&apos;s Quro code to start chatting
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.conversation.id}
                id={`chat-item-${conv.conversation.id}`}
                className={`${styles.chatItem} ${selectedId === conv.conversation.id ? styles.chatItemActive : ''}`}
                onClick={() => setSelectedId(conv.conversation.id)}
              >
                {conv.otherUser.avatar_url ? (
                  <img
                    src={conv.otherUser.avatar_url}
                    alt={conv.otherUser.display_name}
                    className="avatar avatar-md"
                  />
                ) : (
                  <div className={`avatar avatar-md ${styles.avatarPlaceholder}`}>
                    {conv.otherUser.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className={styles.chatItemInfo}>
                  <p className={styles.chatItemName}>{conv.otherUser.display_name}</p>
                  <p className={styles.chatItemPreview}>End-to-End Encrypted</p>
                </div>
                <div className={styles.chatItemMeta}>
                  <span className={styles.chatItemTime}>
                    {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ''}
                  </span>
                  {conv.unreadCount > 0 && (
                    <span className={styles.unreadBadge}>{conv.unreadCount}</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </motion.aside>

      {/* Message Pane — fades in */}
      <motion.main
        className={styles.main}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {selectedConv ? (
          <MessagePane
            conversationId={selectedConv.conversation.id}
            otherUser={selectedConv.otherUser}
            currentProfile={profile}
          />
        ) : (
          <div className={styles.emptyPane} id="empty-pane">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}
              className={styles.emptyPaneContent}
            >
              <QuroLogo size={64} />
              <h2 className={styles.emptyPaneTitle}>Select a conversation</h2>
              <p className={styles.emptyPaneDesc}>
                Choose a conversation from the sidebar, or scan a friend&apos;s
                <br />
                Quro code on your phone to start a new E2EE chat.
              </p>
            </motion.div>
          </div>
        )}
      </motion.main>
    </div>
  );
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="#8E8E93" strokeWidth="1.5" />
      <line x1="11" y1="11" x2="14" y2="14" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M13 2.5l2.5 2.5L5 15.5H2.5V13L13 2.5z"
        stroke="#FFA488"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
