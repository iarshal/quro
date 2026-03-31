'use client';

/**
 * Mobile Web QR Scanner for PWA
 *
 * Uses the custom WeChat Canvas replica component.
 */

import { useRouter } from 'next/navigation';
import { ScannerView } from '@/components/ScannerView';

export default function MobileScanPage() {
  const router = useRouter();

  async function handlePatternDetected(data: string) {
    if (data.startsWith('quro://session/')) {
      const token = data.replace('quro://session/', '');
      
      try {
        const { createBrowserClient } = await import('@quro/db');
        const supabase = createBrowserClient();
        
        const payload = {
          profile: {
            id: 'mock-user-id',
            quro_id: sessionStorage.getItem('__QURO_ID__') || 'QRWEB',
            display_name: 'PWA User',
            avatar_url: null,
            public_key: '',
            gender: 'prefer_not',
            created_at: '',
            updated_at: '',
          },
          authToken: 'mock-auth-token-web',
        };

        const channelName = `quro:desktop-session:${token}`;
        
        supabase.channel(channelName).send({
          type: 'broadcast',
          event: 'SCANNING',
          payload: { userAgent: navigator.userAgent },
        });

        setTimeout(() => {
          supabase.channel(channelName).send({
            type: 'broadcast',
            event: 'DESKTOP_AUTH',
            payload,
          });
          
          router.replace('/m/app/chats');
        }, 300); // Shorter wait since the snap animation took time
      } catch (err) {
        console.error(err);
      }
    } else {
      // Ignore or throw error if it's a random QR
    }
  }

  return <ScannerView onPatternDetected={handlePatternDetected} />;
}
