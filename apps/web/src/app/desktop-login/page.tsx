'use client';

/**
 * Desktop Split-View Login
 * Left side: WebSocket dynamic QR code.
 * Right side: Log in with Face button.
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';

export default function SplitViewLogin() {
  const [qrSrc, setQrSrc] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [qrStatus, setQrStatus] = useState<'loading' | 'waiting' | 'authenticated' | 'expired'>('loading');
  const [authData, setAuthData] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    openQrLogin();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  async function openQrLogin() {
    setQrStatus('loading');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/auth/qr/create`, { method: 'POST' });
      const data = await res.json();
      const token = data.qr_session_token;
      setQrToken(token);

      // Generate QR
      const qrDataUrl = await QRCode.toDataURL(`quro://login/${token}`, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 280,
        color: { dark: '#111111', light: '#FFFFFF' },
      });
      setQrSrc(qrDataUrl);
      setQrStatus('waiting');

      const wsUrl = apiUrl.replace('http', 'ws');
      const ws = new WebSocket(`${wsUrl}/ws/qr/${token}`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'authenticated') {
          setQrStatus('authenticated');
          setAuthData(msg);
          localStorage.setItem('quro_session', JSON.stringify({
            token: msg.session_token,
            quroId: msg.quro_id,
            displayName: msg.display_name,
            loggedInAt: new Date().toISOString(),
          }));
          setTimeout(() => {
             window.location.href = '/m/app/chats';
          }, 1500);
          ws.close();
        } else if (msg.type === 'expired') {
          setQrStatus('expired');
          ws.close();
        }
      };

      ws.onerror = () => { setQrStatus('expired'); };

      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping');
      }, 30000);

      ws.onclose = () => clearInterval(pingInterval);
    } catch {
      setQrStatus('expired');
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', backgroundColor: '#fff', fontFamily: "'Inter', sans-serif" }}>
      {/* ──── LEFT SIDE: QR CODE ──── */}
      <div style={{
        flex: 1, backgroundColor: '#F7F7F7', display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', position: 'relative',
        borderRight: '1px solid #E5E7EB'
      }}>
        <div style={{ 
          position: 'absolute', top: 32, left: 32, 
          display: 'flex', alignItems: 'center', gap: 10 
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#07C160', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
             </svg>
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Quro Shield</span>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111', marginBottom: 12 }}>Scan to Log In</h2>
          <p style={{ fontSize: 16, color: '#666', marginBottom: 40, fontWeight: 500 }}>
            Use the Quro Shield mobile app to scan this code.
          </p>

          <div style={{
             width: 320, height: 320, backgroundColor: '#fff', borderRadius: 24,
             boxShadow: '0 20px 40px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {qrStatus === 'loading' && (
              <div className="douyin-loader" />
            )}
            
            {qrStatus === 'waiting' && qrSrc && (
              <img src={qrSrc} alt="QR Code" style={{ width: 280, height: 280, display: 'block' }} />
            )}

            {qrStatus === 'authenticated' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(7,193,96,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800 }}>Welcome back!</h3>
                <p style={{ fontSize: 16, color: '#07C160', fontWeight: 700 }}>{authData?.display_name}</p>
              </div>
            )}

            {qrStatus === 'expired' && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#EF4444', fontWeight: 600, marginBottom: 16 }}>Session Expired</p>
                <button onClick={openQrLogin} style={{
                   padding: '10px 24px', backgroundColor: '#111', color: '#fff', borderRadius: 100, border: 'none', fontWeight: 600, cursor: 'pointer'
                }}>
                  Refresh Code
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ──── RIGHT SIDE: FACE LOGIN ──── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', padding: 40
      }}>
         <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} style={{ maxWidth: 440, width: '100%' }}>
            
            <h1 style={{ fontSize: 48, fontWeight: 900, color: '#111', lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 20 }}>
              Zero-Friction<br/>Identity.
            </h1>
            <p style={{ fontSize: 18, color: '#666', lineHeight: 1.6, marginBottom: 48, fontWeight: 500 }}>
              No passwords. No SMS codes. Access your encrypted communication universe instantly using secure spatial biometrics.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <a href="/m/agreement?mode=login" style={{
                 padding: '24px 32px', backgroundColor: '#07C160', color: '#fff', borderRadius: 20,
                 textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                 boxShadow: '0 16px 32px rgba(7, 193, 96, 0.25)', transition: 'transform 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div>
                   <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Log In with Face</h3>
                   <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Use your webcam to authenticate</p>
                </div>
                <div style={{ width: 48, height: 48, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                     <path d="M5 12h14m-7-7 7 7-7 7" />
                   </svg>
                </div>
              </a>

              <div style={{ position: 'relative', margin: '24px 0', textAlign: 'center' }}>
                 <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: '#E5E7EB', zIndex: 1 }} />
                 <span style={{ position: 'relative', zIndex: 2, backgroundColor: '#fff', padding: '0 16px', color: '#999', fontSize: 14, fontWeight: 600 }}>OR</span>
              </div>

              <a href="/m/login-fallback" style={{
                 padding: '20px 32px', backgroundColor: '#F3F4F6', color: '#111', borderRadius: 20,
                 textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                 border: '1px solid #E5E7EB', transition: 'border-color 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = '#111'}
              onMouseOut={e => e.currentTarget.style.borderColor = '#E5E7EB'}>
                <div>
                   <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Use Phone Password</h3>
                   <p style={{ fontSize: 14, color: '#666', fontWeight: 500 }}>Log in with phone number and password</p>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                   <path d="M5 12h14m-7-7 7 7-7 7" />
                </svg>
              </a>
            </div>

         </motion.div>
      </div>

    </div>
  );
}
