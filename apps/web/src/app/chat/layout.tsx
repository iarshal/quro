'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { ChatLayout } from '../../components/ChatLayout';
import { Loader2 } from 'lucide-react';
export default function AppChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-screen bg-black">
      {children}
    </div>
  );
}
