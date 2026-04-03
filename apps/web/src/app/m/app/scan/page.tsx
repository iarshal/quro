'use client';

/**
 * WeChat-Style QR Scanner (English)
 * - Scans Quro friend codes and adds them to contacts
 * - Scans desktop login codes
 * - Generates and displays personal QR
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ScannerView } from '../../../../components/ScannerView';
import { parseQRData, type ParsedQR, generatePersonalQR } from '../../../../lib/qrUtils';
import { getFaceData } from '../../../../lib/faceStore';
import { addContact } from '../../../../lib/contactsStore';

export default function MobileScanPage() {
  const router = useRouter();
  const [scanResult, setScanResult] = useState<ParsedQR | null>(null);
  const [showMyQR, setShowMyQR] = useState(false);
  const [myQRSrc, setMyQRSrc] = useState('');
  const [profile, setProfile] = useState<any>(null);

  async function handlePatternDetected(data: string) {
    const parsed = parseQRData(data);
    setScanResult(parsed);

    if (parsed.type === 'quro_session') {
      // Desktop login handshake via BroadcastChannel
      const bc = new BroadcastChannel('quro_desktop_sync');
      bc.postMessage({ type: 'LOGIN_SUCCESS' });
      bc.close();
      
      setTimeout(() => {
        router.push('/m/app/chats');
      }, 1500);
    }
  }

  async function handleAddFriend() {
    if (!scanResult || scanResult.type !== 'quro_friend' || !scanResult.quroId) return;
    
    await addContact({
      quroCode: scanResult.quroId,
      displayName: `User ${scanResult.quroId}`, 
      addedAt: new Date().toISOString(),
    });
    
    router.push(`/m/app/chats/${scanResult.quroId}`);
  }

  async function handleShowMyQR() {
    const data = await getFaceData();
    if (data) {
      setProfile(data);
      const qr = await generatePersonalQR(data.quroId);
      setMyQRSrc(qr);
      setShowMyQR(true);
    }
  }

  if (scanResult && scanResult.type !== 'quro_session') {
    return (
      <div style={{
        height: '100dvh',
        backgroundColor: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: 32,
            maxWidth: 320,
            width: '100%',
            textAlign: 'center',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>
            {scanResult.type === 'external_url' ? '🌐' : scanResult.type === 'quro_friend' ? '👤' : '📄'}
          </span>
          
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 8 }}>
            {scanResult.type === 'external_url' ? 'Website Link Detected' : 
             scanResult.type === 'quro_friend' ? 'Quro User Found' : 'QR Code Read'}
          </h3>
          
          <p style={{
            fontSize: 15, color: '#666', wordBreak: 'break-all', marginBottom: 32,
            background: '#F7F7F7', padding: 16, borderRadius: 12
          }}>
            {scanResult.type === 'quro_friend' ? `User ID: ${scanResult.quroId}` : scanResult.data}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <button
              onClick={() => setScanResult(null)}
              style={{
                flex: 1, minWidth: '100px', padding: '14px', backgroundColor: '#F0F0F0',
                borderRadius: 12, fontSize: 16, fontWeight: 600, color: '#333',
                border: 'none', cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            
            {scanResult.type === 'external_url' && (
              <button
                onClick={() => window.open(scanResult.url, '_blank')}
                style={{
                  flex: 1, minWidth: '100px', padding: '14px', backgroundColor: '#3B82F6',
                  borderRadius: 12, fontSize: 16, fontWeight: 600, color: '#fff',
                  border: 'none', cursor: 'pointer'
                }}
              >
                Open Link
              </button>
            )}

            {scanResult.type === 'quro_friend' && (
              <button
                onClick={handleAddFriend}
                style={{
                  flex: 1, minWidth: '100px', padding: '14px', backgroundColor: '#07C160',
                  borderRadius: 12, fontSize: 16, fontWeight: 600, color: '#fff',
                  border: 'none', cursor: 'pointer'
                }}
              >
                Add Friend
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100dvh', fontFamily: "'Inter', sans-serif" }}>
      <ScannerView onPatternDetected={handlePatternDetected} />
      
      <div style={{ position: 'absolute', bottom: 120, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 100 }}>
        <button onClick={handleShowMyQR} style={{
          padding: '12px 24px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
          borderRadius: 30, border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
          fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><rect x="7" y="7" width="3" height="3"/><rect x="14" y="7" width="3" height="3"/><rect x="7" y="14" width="3" height="3"/><rect x="14" y="14" width="3" height="3"/>
          </svg>
          My QR Code
        </button>
      </div>
      
      <AnimatePresence>
        {showMyQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMyQR(false)}
            style={{
              position: 'fixed', inset: 0,
              backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{
                backgroundColor: '#fff', borderRadius: 24, padding: '32px 24px', textAlign: 'center',
                width: '100%', maxWidth: 340, boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              }}
            >
              {profile && (
                <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {profile.avatarDataUrl ? (
                    <img src={profile.avatarDataUrl} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', marginBottom: 12 }} />
                  ) : (
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#3B82F6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
                      {profile.displayName.charAt(0)}
                    </div>
                  )}
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: 0 }}>{profile.displayName}</h3>
                  <p style={{ fontSize: 13, color: '#999', margin: '4px 0 0 0', fontFamily: 'monospace' }}>ID: {profile.quroId}</p>
                </div>
              )}
              
              <div style={{ background: '#F7F7F7', padding: 16, borderRadius: 16, display: 'inline-block' }}>
                {myQRSrc && (
                  <img src={myQRSrc} alt="My QR" style={{ width: 220, height: 220, mixBlendMode: 'multiply' }} />
                )}
              </div>
              
              <p style={{ fontSize: 13, color: '#999', marginTop: 20, fontWeight: 500 }}>
                Scan to add me to your contacts
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
