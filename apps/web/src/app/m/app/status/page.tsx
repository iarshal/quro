// @ts-nocheck
'use client';

/**
 * WeChat-style Discover / Moments / Status page
 * Displays user updates over the last 24h
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getSession } from '../../../../lib/localSession';
import { getFaceData } from '../../../../lib/faceStore';
import { getStatuses, addStatus, type QuroStatus } from '../../../../lib/statusStore';
import { getContact } from '../../../../lib/contactsStore';

export default function MobileStatusPage() {
  const router = useRouter();
  const [statuses, setStatuses] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [statusText, setStatusText] = useState('');
  
  // Ref for camera
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) { router.replace('/m/welcome'); return; }
    loadData();
  }, [router]);

  async function loadData() {
    setLoading(true);
    const p = await getFaceData();
    if (p) setProfile(p);

    const sts = await getStatuses();
    // Enrich with author name/avatar
    const enriched = await Promise.all(sts.map(async s => {
      if (s.quroCode === p?.quroId) {
        return { ...s, displayName: p.displayName, avatarDataUrl: p.avatarDataUrl, isMe: true };
      }
      const c = await getContact(s.quroCode);
      return { ...s, displayName: c?.displayName || s.quroCode, avatarDataUrl: c?.avatarDataUrl, isMe: false };
    }));
    setStatuses(enriched);
    setLoading(false);
  }

  // Camera logic for status
  async function startCamera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch {
      // Fallback to front camera or ignore
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  }

  async function handleOpenCompose() {
    setShowCompose(true);
    setPhotoData(null);
    setStatusText('');
    await startCamera();
  }

  function handleCloseCompose() {
    stopCamera();
    setShowCompose(false);
  }

  function takePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.drawImage(v, 0, 0, c.width, c.height);
      setPhotoData(c.toDataURL('image/jpeg', 0.8));
    }
    stopCamera();
  }

  async function handlePost() {
    if (!statusText.trim() && !photoData) return;
    if (!profile) return;
    await addStatus(profile.quroId, statusText, photoData || undefined);
    handleCloseCompose();
    loadData();
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} mins ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return '1 day ago';
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#F7F7F7', paddingBottom: 60, height: '100dvh' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#F7F7F7', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', letterSpacing: '-0.3px' }}>Discover</h1>
        <button onClick={handleOpenCompose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
          </svg>
        </button>
      </header>

      {/* Cover/Header image area (like WeChat moments) */}
      <div style={{ position: 'relative', height: 200, backgroundColor: '#3B82F6', backgroundImage: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', marginBottom: 40 }}>
        {profile && (
          <div style={{ position: 'absolute', right: 20, bottom: -20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: '#fff', fontSize: 18, fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
              {profile.displayName}
            </span>
            <div style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: '#fff', padding: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
              {profile.avatarDataUrl ? (
                <img src={profile.avatarDataUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: 10, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', borderRadius: 10, backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 24, fontWeight: 700, color: '#9CA3AF' }}>{profile.displayName.charAt(0)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Feed */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Loading...</div>
        ) : statuses.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#999', fontSize: 15 }}>
            No status updates in the last 24 hours.
          </div>
        ) : (
          statuses.map((s) => (
            <div key={s.id} style={{ display: 'flex', gap: 12, padding: '16px 20px', borderBottom: '0.5px solid #E5E7EB', backgroundColor: '#fff' }}>
              <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: '#E5E7EB', flexShrink: 0, overflow: 'hidden' }}>
                {s.avatarDataUrl ? (
                  <img src={s.avatarDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontWeight: 'bold' }}>
                    {s.displayName.charAt(0)}
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#576B95', marginBottom: 4 }}>
                  {s.displayName}
                </div>
                {s.text && (
                  <div style={{ fontSize: 15, color: '#111', lineHeight: 1.5, marginBottom: 8, wordBreak: 'break-word' }}>
                    {s.text.split('\n').map((l, i) => <span key={i}>{l}<br/></span>)}
                  </div>
                )}
                {s.imageUrl && (
                  <img src={s.imageUrl} alt="" style={{ maxWidth: '80%', maxHeight: 200, borderRadius: 4, objectFit: 'cover', marginBottom: 8 }} />
                )}
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  {formatTime(s.timestamp)}
                  {s.isMe && (
                    <span style={{ marginLeft: 16, color: '#576B95', cursor: 'pointer' }}>Delete</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Compose Modal */}
      <AnimatePresence>
        {showCompose && (
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ position: 'fixed', inset: 0, zIndex: 999, backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}
          >
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#F7F7F7' }}>
              <button onClick={handleCloseCompose} style={{ fontSize: 16, color: '#111', background: 'none', border: 'none', padding: 8 }}>Cancel</button>
              <button 
                onClick={handlePost} 
                disabled={!statusText.trim() && !photoData}
                style={{ fontSize: 16, fontWeight: 600, color: '#fff', backgroundColor: (!statusText.trim() && !photoData) ? '#A0DCBF' : '#07C160', border: 'none', padding: '6px 16px', borderRadius: 4, transition: '0.2s' }}
              >
                Post
              </button>
            </header>

            <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <textarea
                placeholder="Share your moment..."
                value={statusText}
                onChange={e => setStatusText(e.target.value)}
                style={{ width: '100%', minHeight: 100, border: 'none', outline: 'none', fontSize: 16, resize: 'none', marginBottom: 16 }}
              />

              {photoData ? (
                <div style={{ position: 'relative', width: 120, height: 120 }}>
                  <img src={photoData} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                  <button onClick={() => { setPhotoData(null); startCamera(); }} style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: 12, backgroundColor: '#EF4444', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ✕
                  </button>
                </div>
              ) : (
                <div style={{ flex: 1, backgroundColor: '#000', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
                    <button onClick={takePhoto} style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.3)', border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff' }} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
