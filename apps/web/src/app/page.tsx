'use client';

/**
 * Quro Desktop Portal
 * 
 * Implements the dramatic Desktop Morph UI transitioning
 * from a central QR code to a full dual-pane app layout upon scanning.
 */

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserClient, getDesktopSessionChannel } from '@quro/db'; // Ensure your DB is correctly wired

import QRCode from 'qrcode';

type AppState = 'unauthenticated' | 'scanning' | 'authenticated';

export default function DesktopPortalPage() {
  const [appState, setAppState] = useState<AppState>('unauthenticated');
  const [sessionToken, setSessionToken] = useState<string>('');
  const [qrSrc, setQrSrc] = useState<string>('');
  
  // Scanned user profile payload
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    let channel: any = null;
    const supabase = createBrowserClient();

    async function initDesktopSession() {
      try {
        // 1. Generate local session key
        const token = crypto.randomUUID();
        
        if (!mounted) return;
        setSessionToken(token);

        // 2. Generate visual QR
        const qrDataUrl = await QRCode.toDataURL(`quro://session/${token}`, {
          errorCorrectionLevel: 'H',
          margin: 1,
          width: 300,
          color: { dark: '#111111', light: '#FFFFFF' },
        });
        
        if (!mounted) return;
        setQrSrc(qrDataUrl);

        // 3. Register Desktop Session in DB
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 5);
        
        // This fails silently if not running `pnpm db:types` or real DB yet, but that's expected
        await (supabase as any).from('desktop_sessions').insert({
          session_token: token,
          expires_at: expiresAt.toISOString(),
          is_active: false,
        }).catch(() => console.log('DB mock error or RLS'));

        // 4. Subscribe to Realtime Handshake
        const channelName = getDesktopSessionChannel(token);
        channel = supabase.channel(channelName);
        
        channel.on('broadcast', { event: 'SCANNING' }, (payload: any) => {
          if (!mounted) return;
          console.log('[Desktop] Mobile device is scanning...');
          setAppState('scanning');
        });

        channel.on('broadcast', { event: 'DESKTOP_AUTH' }, async (payload: any) => {
          if (!mounted) return;
          console.log('[Desktop] Auth Payload Received!', payload);
          
          setProfile(payload.payload?.profile);
          setAppState('authenticated');

          // Securely set real token from mobile (simulated login on desktop)
          const { authToken } = payload.payload;
          if (authToken) {
            await supabase.auth.setSession({ access_token: authToken, refresh_token: '' });
          }
        });

        channel.subscribe();
      } catch (err) {
        console.error('Handshake Init Error:', err);
      }
    }

    initDesktopSession();

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return (
    <motion.main
      className="min-h-screen w-full overflow-hidden flex"
      animate={{ backgroundColor: appState === 'authenticated' ? '#F5F5F5' : '#FFFFFF' }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      <AnimatePresence mode="wait">
        
        {/* ========================================================= */}
        {/* STATE 1: UN-AUTHENTICATED (QR CODE PORTAL)               */}
        {/* ========================================================= */}
        {appState !== 'authenticated' && (
          <motion.div
            key="portal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex flex-col items-center justify-center p-8 relative"
          >
            {/* Soft Ambient Background Decor (Optional) */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#fde9df] opacity-60 blur-3xl -z-10 pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-50 opacity-60 blur-3xl -z-10 pointer-events-none" />

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-4 whitespace-nowrap z-10">
              Quro <span className="text-[#DBAA88]">Web</span>
            </h1>
            <p className="text-gray-500 mb-12 text-lg text-center max-w-sm z-10">
              Open the Quro app on your mobile device to scan the QR code and log in.
            </p>

            {/* QR Card */}
            <motion.div
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xl z-10 relative overflow-hidden"
              animate={appState === 'scanning' ? { scale: 1.05, boxShadow: '0 25px 50px -12px rgba(219,170,136,0.3)' } : {}}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {appState === 'scanning' && (
                <motion.div 
                   className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                >
                  <motion.div 
                    className="w-16 h-16 border-4 border-[#07C160] border-t-transparent rounded-full animate-spin mb-4"
                  />
                  <p className="text-gray-800 font-bold tracking-widest text-sm animate-pulse uppercase">Detected</p>
                </motion.div>
              )}

              {qrSrc ? (
                <Image
                  src={qrSrc}
                  alt="Login QR Code"
                  width={250}
                  height={250}
                  className="rounded-xl selection-none"
                  draggable={false}
                  priority
                />
              ) : (
                <div className="w-[250px] h-[250px] bg-gray-50 rounded-xl flex items-center justify-center animate-pulse">
                  <span className="text-gray-300 font-medium text-sm">Generating keys...</span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* STATE 2: AUTHENTICATED (DUAL-PANE LAYOUT)                */}
        {/* ========================================================= */}
        {appState === 'authenticated' && (
          <motion.div
            key="app-ui"
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex max-w-[1400px] mx-auto p-4 md:p-8 gap-6 h-screen overflow-hidden"
          >
            {/* LEFT PANE: Chat List */}
            <motion.div 
              className="w-1/3 bg-white rounded-2xl shadow-sm border border-black/[0.04] overflow-hidden flex flex-col flex-shrink-0"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              {/* Header inside Left Pane */}
              <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between bg-white flex-shrink-0">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="w-8 h-8 rounded-full bg-[#111] text-white flex items-center justify-center font-bold text-sm shadow-md"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ delay: 0.6 }}
                  >
                    {profile?.display_name?.charAt(0).toUpperCase() || 'Q'}
                  </motion.div>
                  <h2 className="text-lg font-bold text-gray-900 tracking-tight">Messages</h2>
                </div>
                <button className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
              </div>

              {/* Chat List Body (Mocked for now) */}
              <div className="flex-1 overflow-y-auto p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors group">
                    <div className="w-12 h-12 rounded-full bg-gray-200" />
                    <div className="flex-1 border-b border-gray-50 pb-2 group-last:border-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-semibold text-gray-800">Friend #{i}</h3>
                        <span className="text-xs text-gray-400">12:30 PM</span>
                      </div>
                      <p className="text-sm text-gray-500 truncate max-w-[200px]">Latest message preview goes here...</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* RIGHT PANE: Active Chat */}
            <motion.div 
              className="w-2/3 bg-white rounded-2xl shadow-sm border border-black/[0.04] overflow-hidden flex flex-col items-center justify-center relative"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.55 }}
            >
              <div className="w-24 h-24 mb-6 text-gray-200">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              </div>
              <h3 className="text-xl font-medium text-gray-400 tracking-tight">Quro Web</h3>
              <p className="text-sm text-gray-300 mt-2">Device-Local Messaging Mode</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
