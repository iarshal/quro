// @ts-nocheck
'use client';

/**
 * FaceScanner v8 — Unified English Version
 * 
 * - Plays weibo.mp3 on light emission start
 * - Covert registration (1 capture under the hood)
 * - English Translation
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  playVerificationSuccess,
  playFailBuzz,
  playWeiboCue,
} from '../../lib/audioEffects';

type ScanPhase = 'loading' | 'detecting' | 'face_found' | 'liveness' | 'light_emission' | 'processing' | 'verified' | 'failed' | 'no_camera';

interface FaceScannerProps {
  onVerified: (descriptor: number[], snapshot: string, allDescriptors?: number[][]) => Promise<boolean | void> | boolean | void;
  onFailed?: (reason: string) => void;
  onCancel?: () => void;
}

const RING_COLOR = '#3B82F6';
const LIGHT_SEQUENCE = [
  { color: '#22C55E', duration: 400 },  // Green
  { color: '#3B82F6', duration: 400 },  // Blue
  { color: '#EF4444', duration: 400 },  // Red
  { color: '#F59E0B', duration: 400 },  // Yellow
  { color: '#EC4899', duration: 400 },  // Pink
  { color: '#FFFFFF', duration: 300 },  // White
];
const CAPTURE_SAMPLE_COUNT = 3;
const CAPTURE_SAMPLE_DELAY_MS = 180;
const MIN_FACE_RATIO = 0.22;

export function FaceScanner({ onVerified, onFailed, onCancel }: FaceScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceApiRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const phaseRef = useRef<ScanPhase>('loading');
  const holdTimerRef = useRef<any>(null);
  const faceCount = useRef(0);
  const mouthCount = useRef(0);
  const mountedRef = useRef(true);

  const [phase, _setPhase] = useState<ScanPhase>('loading');
  const [statusText, setStatusText] = useState('');
  const [subText, setSubText] = useState('');
  const [progress, setProgress] = useState(0);
  const [bgColor, setBgColor] = useState<string | null>(null);

  const setPhase = useCallback((p: ScanPhase) => { phaseRef.current = p; if (mountedRef.current) _setPhase(p); }, []);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; cleanup(); }; }, []);

  // Load models
  useEffect(() => {
    let c = false;
    (async () => {
      try {
        setStatusText('Loading Secure Environment Engine...');
        setSubText('Initializing Local AI modules');
        const fa = await import('face-api.js');
        faceApiRef.current = fa;
        const modelBaseUrl =
          typeof window === 'undefined'
            ? '/models'
            : `${window.location.origin}/models`;
        const loadModels = Promise.all([
          fa.nets.tinyFaceDetector.loadFromUri(modelBaseUrl),
          fa.nets.faceLandmark68TinyNet.loadFromUri(modelBaseUrl),
          fa.nets.faceRecognitionNet.loadFromUri(modelBaseUrl),
        ]);
        await Promise.race([
          loadModels,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Model load timeout')), 12000)),
        ]);
        if (c) return;
        await startCamera();
      } catch (e: any) {
        console.error('[FaceScanner] Initialization failed:', e);
        if (!c) {
          setPhase('no_camera');
          setStatusText('Initialization Failed');
          setSubText(
            e?.message?.includes('Failed to fetch')
              ? 'Could not load face models'
              : 'Face scan is not supported on this browser yet'
          );
        }
      }
    })();
    return () => { c = true; };
  }, []);

  async function startCamera() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('getUserMedia is not available');
      }
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } });
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.muted = true;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        startScanSequence();
      }
    } catch (e) {
      console.error('[FaceScanner] Camera start failed:', e);
      setPhase('no_camera');
      setStatusText('Camera Access Denied');
      setSubText('Please allow camera permissions');
    }
  }

  function startScanSequence() {
    setPhase('detecting');
    setStatusText('Position Your Face');
    setSubText('Keep your face inside the circle');
    faceCount.current = 0;
    mouthCount.current = 0;
    startLoop();
  }

  function cleanup() {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  }

  function startLoop() {
    async function tick() {
      if (!mountedRef.current) return;
      const cp = phaseRef.current;
      if (['light_emission', 'processing', 'verified', 'failed', 'no_camera'].includes(cp)) return;
      
      const fa = faceApiRef.current, v = videoRef.current;
      if (!fa || !v || v.readyState < 2) { timerRef.current = setTimeout(tick, 200); return; }
      
      try {
        const det = await fa.detectSingleFace(v, new fa.TinyFaceDetectorOptions({ inputSize: 256, scoreThreshold: 0.5 })).withFaceLandmarks(true);
        if (!mountedRef.current) return;
        const now = phaseRef.current;
        
        if (det) {
          const box = det.detection.box;
          const faceRatio = Math.max(box.width / v.videoWidth, box.height / v.videoHeight);

          if (faceRatio < MIN_FACE_RATIO) {
            faceCount.current = Math.max(0, faceCount.current - 1);
            setPhase('detecting');
            setStatusText('Move Closer To Camera');
            setSubText('Bring your face inside the circle until it fills the frame');
            mouthCount.current = 0;
            timerRef.current = setTimeout(tick, 130);
            return;
          }

          if (now === 'detecting') {
            faceCount.current++;
            if (faceCount.current >= 6) {
              setPhase('face_found');
              setStatusText('Face Detected');
              setSubText('Hold still momentarily');
              holdTimerRef.current = setTimeout(() => {
                if (phaseRef.current === 'face_found') {
                  setPhase('liveness');
                  setStatusText('Open Mouth Slightly');
                  setSubText('Verifying liveness');
                  mouthCount.current = 0;
                }
              }, 1200);
            }
          }
          if (now === 'liveness') {
            const m = det.landmarks.getMouth();
            const h = Math.abs(m[18].y - m[14].y), w = Math.abs(m[6].x - m[0].x);
            if (h / w > 0.28) {
              mouthCount.current++;
              if (mouthCount.current >= 2) { startLightEmission(); return; }
            } else { mouthCount.current = Math.max(0, mouthCount.current - 1); }
          }
        } else {
          faceCount.current = Math.max(0, faceCount.current - 2);
          if ((now === 'face_found' || now === 'liveness') && faceCount.current < 2) {
            if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
            setPhase('detecting'); setStatusText('Face Lost'); setSubText('Please reposition');
            mouthCount.current = 0;
          } else if (now === 'detecting') {
            setStatusText('Position Your Face');
            setSubText('Move closer if your face is not being detected');
          }
        }
      } catch {}
      timerRef.current = setTimeout(tick, 130);
    }
    tick();
  }

  // Play audio and start flash sequence
  function startLightEmission() {
    setPhase('light_emission');
    setStatusText('Keep Perfectly Still');
    setSubText('Scanning biometrics...');
    
    try {
      const verifySound = new Audio('/sounds/weibo.mp3');
      verifySound.volume = 1.0;
      verifySound.play().catch(e => console.warn(e));
    } catch {}

    let i = 0;
    function next() {
      if (!mountedRef.current || i >= LIGHT_SEQUENCE.length) {
        setBgColor(null);
        doCaptureAndVerify();
        return;
      }
      const step = LIGHT_SEQUENCE[i];
      setBgColor(step.color);
      setTimeout(() => {
        if (!mountedRef.current) return;
        setBgColor(null);
        setTimeout(() => { i++; next(); }, 60);
      }, step.duration);
    }
    next();
  }

  async function getDescriptor(): Promise<number[] | null> {
    const fa = faceApiRef.current, v = videoRef.current;
    if (!fa || !v) return null;
    try {
      const d = await fa.detectSingleFace(v, new fa.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.45 })).withFaceLandmarks(true).withFaceDescriptor();
      return d ? Array.from(d.descriptor) : null;
    } catch { return null; }
  }

  async function collectDescriptors(): Promise<number[][]> {
    const descriptors: number[][] = [];

    for (let attempt = 0; attempt < CAPTURE_SAMPLE_COUNT * 3 && descriptors.length < CAPTURE_SAMPLE_COUNT; attempt++) {
      const descriptor = await getDescriptor();
      if (descriptor) {
        descriptors.push(descriptor);
      }

      if (descriptors.length < CAPTURE_SAMPLE_COUNT) {
        await new Promise((resolve) => setTimeout(resolve, CAPTURE_SAMPLE_DELAY_MS));
      }
    }

    return descriptors;
  }

  async function doCaptureAndVerify() {
    setPhase('processing'); setStatusText('Verifying Identity...'); setSubText('Please wait a moment');
    
    let p = 0;
    const pi = setInterval(() => { p += 5; if (mountedRef.current) setProgress(Math.min(p, 88)); if (p >= 88) clearInterval(pi); }, 40);
    
    try {
      const descriptors = await collectDescriptors();
      clearInterval(pi);

      if (descriptors.length === 0) {
        setProgress(0); setPhase('failed'); setStatusText('Capture Failed'); playFailBuzz(); onFailed?.('no desc'); return; 
      }

      const d =
        descriptors.length === 1
          ? descriptors[0]
          : descriptors[0].map((_, index) => {
              let sum = 0;
              for (const descriptor of descriptors) sum += descriptor[index];
              return sum / descriptors.length;
            });
      const snap = takeSnapshot();
      if (mountedRef.current) setProgress(100);
      
      setTimeout(() => {
        if (!mountedRef.current) return;
        setPhase('verified'); setStatusText('Scan Successful'); setSubText('Face acquired');
        playVerificationSuccess(); cleanup();
        setTimeout(async () => {
          if (!mountedRef.current) return;
          try {
            setStatusText('Finalizing Login');
            setSubText('Checking secure match on this device');
            const result = await onVerified(d, snap, descriptors);
            if (result === false && mountedRef.current) {
              setPhase('failed');
              setStatusText('Face Match Failed');
              setSubText('Please retry with the registered face');
            }
          } catch (error) {
            console.error('[FaceScanner] Verification handoff failed:', error);
            if (mountedRef.current) {
              setPhase('failed');
              setStatusText('Authentication Failed');
              setSubText('Please retry');
              playFailBuzz();
              onFailed?.('handoff_failed');
            }
          }
        }, 1200);
      }, 300);
    } catch { 
      clearInterval(pi); setPhase('failed'); setStatusText('Verification Error'); playFailBuzz(); onFailed?.('err'); 
    }
  }

  function takeSnapshot(): string {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return '';
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext('2d');
    if (ctx) { ctx.save(); ctx.scale(-1, 1); ctx.drawImage(v, -c.width, 0, c.width, c.height); ctx.restore(); }
    return c.toDataURL('image/jpeg', 0.8);
  }

  function handleRetry() {
    startScanSequence();
    setProgress(0); setBgColor(null);
  }

  return (
    <>
      {/* FULL BACKGROUND FLASHES */}
      <AnimatePresence>
        {bgColor && (
          <motion.div
            key={bgColor}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
            style={{ position: 'fixed', inset: 0, zIndex: 998, backgroundColor: bgColor, pointerEvents: 'none' }}
          />
        )}
      </AnimatePresence>

      <div style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: bgColor ? 'transparent' : '#0B0B0F',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        fontFamily: "'Inter', sans-serif", transition: 'background 0.15s',
      }}>
        <style>{`
          @keyframes pulse-ring { 0%,100% { transform: scale(1); opacity: 0.15; } 50% { transform: scale(1.04); opacity: 0.35; } }
          @keyframes sweep { to { transform: rotate(360deg); } }
          @keyframes douyin-l { 0%,100% { transform: translateX(-12px); } 50% { transform: translateX(12px); } }
          @keyframes douyin-r { 0%,100% { transform: translateX(12px); } 50% { transform: translateX(-12px); } }
        `}</style>
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Cancel Button */}
        {onCancel && (
          <button onClick={() => { cleanup(); onCancel(); }} style={{
            position: 'absolute', top: 16, left: 16, zIndex: 100, width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}

        {/* Title */}
        <div style={{ marginTop: 48, textAlign: 'center', zIndex: 10 }}>
          {phase === 'light_emission' ? (
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#000', letterSpacing: '1px', textShadow: '0 0 20px rgba(0,0,0,0.3)' }}>
              Acquiring Biometrics
            </h2>
          ) : (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '2px' }}>Authentication</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                Real Name Face Verify
              </p>
            </>
          )}
        </div>

        {/* Center Scanner */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, zIndex: 10 }}>
          <div style={{ position: 'relative', width: 260, height: 260 }}>
            <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: `2.5px solid ${RING_COLOR}`, boxShadow: `0 0 30px ${RING_COLOR}25`, transition: 'opacity 0.3s', opacity: bgColor ? 0.3 : 1 }} />
            <div style={{ position: 'absolute', inset: -16, borderRadius: '50%', border: `1.5px solid ${RING_COLOR}25`, animation: 'pulse-ring 2.5s ease-in-out infinite', opacity: bgColor ? 0 : 1 }} />
            
            {['detecting', 'face_found', 'liveness'].includes(phase) && !bgColor && (
              <div style={{
                position: 'absolute', inset: -12, borderRadius: '50%',
                background: `conic-gradient(from 0deg, transparent 0%, ${RING_COLOR}50 10%, transparent 25%)`,
                mask: 'radial-gradient(circle, transparent 53%, black 55%, black 58%, transparent 60%)',
                WebkitMask: 'radial-gradient(circle, transparent 53%, black 55%, black 58%, transparent 60%)',
                animation: 'sweep 2s linear infinite',
              }} />
            )}

            <div style={{ width: 260, height: 260, borderRadius: '50%', overflow: 'hidden', background: '#111', position: 'relative', boxShadow: bgColor ? '0 0 40px rgba(0,0,0,0.5)' : 'none' }}>
              <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: phase === 'loading' || phase === 'no_camera' ? 'none' : 'block' }} />
              
              {phase === 'loading' && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <div style={{ position: 'relative', width: 40, height: 16 }}>
                    <div style={{ position: 'absolute', top: 0, left: 6, width: 14, height: 14, borderRadius: '50%', background: '#25F4EE', opacity: 0.8, animation: 'douyin-l 0.8s ease-in-out infinite' }} />
                    <div style={{ position: 'absolute', top: 0, right: 6, width: 14, height: 14, borderRadius: '50%', background: '#FE2C55', opacity: 0.8, animation: 'douyin-r 0.8s ease-in-out infinite' }} />
                  </div>
                  <span style={{ color: '#666', fontSize: 11 }}>Initialization...</span>
                </div>
              )}
              
              <AnimatePresence>
                {phase === 'verified' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'absolute', inset: 0, background: 'rgba(34,197,94,0.9)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="60" height="60" viewBox="0 0 72 72">
                      <motion.circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="4" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }} />
                      <motion.path d="M22 38L32 48L50 26" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="60" strokeDashoffset="60" animate={{ strokeDashoffset: 0 }} transition={{ delay: 0.2, duration: 0.4 }} />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <AnimatePresence>
                {phase === 'failed' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'absolute', inset: 0, background: 'rgba(239,68,68,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div style={{ textAlign: 'center', height: 60 }}>
            {phase === 'processing' && (
              <div style={{ position: 'relative', width: 40, height: 16, margin: '0 auto 10px' }}>
                <div style={{ position: 'absolute', top: 0, left: 6, width: 14, height: 14, borderRadius: '50%', background: '#25F4EE', opacity: 0.85, animation: 'douyin-l 0.8s ease-in-out infinite' }} />
                <div style={{ position: 'absolute', top: 0, right: 6, width: 14, height: 14, borderRadius: '50%', background: '#FE2C55', opacity: 0.85, animation: 'douyin-r 0.8s ease-in-out infinite' }} />
              </div>
            )}
            <p style={{
              fontSize: 16, fontWeight: 600,
              color: phase === 'verified' ? '#22C55E' : phase === 'failed' ? '#EF4444' : phase === 'liveness' ? RING_COLOR
                : phase === 'light_emission' ? (bgColor ? '#000' : '#F59E0B') : bgColor ? '#000' : '#E5E7EB',
              textShadow: bgColor ? '0 0 10px rgba(0,0,0,0.1)' : 'none',
              transition: 'color 0.2s',
            }}>
              {statusText}
            </p>
            <p style={{
              fontSize: 12, marginTop: 4,
              color: phase === 'liveness' ? 'rgba(59,130,246,0.6)' : bgColor ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.3)',
            }}>
              {subText}
            </p>
          </div>

          {phase === 'failed' && (
            <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} onClick={handleRetry}
              style={{ padding: '12px 32px', background: RING_COLOR, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Retry Scan
            </motion.button>
          )}
        </div>

        {/* Footer */}
        <div style={{ paddingBottom: 24, display: 'flex', alignItems: 'center', gap: 6, opacity: bgColor ? 0 : 0.3, transition: 'opacity 0.3s', zIndex: 10 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span style={{ color: '#fff', fontSize: 10 }}>Local Device Processing Only</span>
        </div>
      </div>
    </>
  );
}
