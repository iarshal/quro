// @ts-nocheck
'use client';

/**
 * Chat route layout — wraps the ChatLayout shell around child pages.
 * In production, this would check for an active desktop session and
 * redirect unauthenticated users to the QR portal.
 */

import { ChatLayout } from '@/components/ChatLayout';

// Mock profile for development — replaced by session data in production
const MOCK_PROFILE = {
  id: 'mock-user-id',
  quro_id: 'QR7KM',
  display_name: 'You',
  avatar_url: null,
  public_key: '',
  gender: 'prefer_not' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default function AppChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatLayout profile={MOCK_PROFILE} authToken="mock-auth-token" />
  );
}
