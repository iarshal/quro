'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsQR from 'jsqr';
import { QrCode, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ScanState = 'idle' | 'scanning' | 'detected';

interface ScannerViewProps {
  onPatternDetected?: (payload: string) => void;
}

// Re-using the Web Audio API synthesizer for the organic WeChat Beep
function playWeChatDing() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1); 
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.warn('Audio not supported', e);
  }
}

export function ScannerView({ onPatternDetected }: ScannerViewProps) {
  const router = useRouter();
  
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [snapCoord, setSnapCoord] = useState<{ x: number; y: number } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
  }, []);

  useEffect(() => {
    // Cleanup on unmount
    return () => stopCamera();
  }, [stopCamera]);

  // Main QR Detection Loop
  const tick = useCallback(() => {
    if (scanState !== 'scanning') return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      // Set canvas size equal to the viewable screen feed
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Scan with jsQR
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });
        
        if (code && code.data) {
          // Detected! Stop loop.
          setScanState('detected');
          stopCamera();
          
          // Math - calculate exact center of the mapped QR
          // `location` coordinates are based on the video rendering dimensions.
          // Because the video has object-fit: cover, this maps roughly unless there's heavy crop.
          const { topLeftCorner: tl, topRightCorner: tr, bottomLeftCorner: bl, bottomRightCorner: br } = code.location;
          
          // Get the centroid of the quadrilateral
          const cX = (tl.x + tr.x + bl.x + br.x) / 4;
          const cY = (tl.y + tr.y + bl.y + br.y) / 4;
          
          // We need physical CSS pixels. Let's find rendering ratio
          const videoElementRect = video.getBoundingClientRect();
          // video element covers full screen. Let's assume proportional scaling
          const renderRatio = Math.max(
            videoElementRect.width / canvas.width,
            videoElementRect.height / canvas.height
          );
          
          // Approximate the mapped screen coordinate
          const screenX = videoElementRect.left + (cX * renderRatio);
          const screenY = videoElementRect.top + (cY * renderRatio);
          
          setSnapCoord({ x: screenX, y: screenY });
          
          playWeChatDing();

          // Report outward 0.5s after animation finishes
          setTimeout(() => {
            if (onPatternDetected) onPatternDetected(code.data);
          }, 800);
          
          return; // Stop requesting frames
        }
      }
    }
    requestRef.current = requestAnimationFrame(tick);
  }, [scanState, stopCamera, onPatternDetected]);

  useEffect(() => {
    if (scanState === 'scanning') {
      requestRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [scanState, tick]);

  const startScanner = async () => {
    try {
      // Prompt user for Camera AND initialize AudioContext
      playWeChatDing(); // Playing a silent hit unlocks audio ctx
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // required to tell iOS safari we don't want fullscreen
        videoRef.current.play();
      }
      setScanState('scanning');
      setCameraError(null);
    } catch (err) {
      console.error('Camera access denied:', err);
      setCameraError('Camera access denied or unavailable.');
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh', backgroundColor: '#000', overflow: 'hidden' }}>
      
      {/* 1. Underlying Camera Feed */}
      <video
        ref={videoRef}
        muted
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: scanState !== 'idle' ? 1 : 0,
          transition: 'opacity 0.3s'
        }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* 2. State 1: Interstitial (Idle) */}
      <AnimatePresence>
        {scanState === 'idle' && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#000',
            }}
          >
            <QrCode size={64} color="#666" style={{ marginBottom: 24 }} />
            <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: 8 }}>QR Scanner</h2>
            <p style={{ color: '#aaa', fontSize: '0.875rem', marginBottom: 32 }}>Camera access required</p>
            {cameraError && <p style={{ color: '#ff4d4f', marginBottom: 16 }}>{cameraError}</p>}
            
            <button 
              onClick={startScanner}
              style={{
                backgroundColor: '#07C160',
                color: '#fff',
                padding: '14px 32px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Tap to Start Scanner
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. The WeChat Overlay (Active when scanning or detected) */}
      {(scanState === 'scanning' || scanState === 'detected') && (
        <React.Fragment>
          {/* Viewfinder Mask Area */}
          <div style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center' // Actually WeChat usually anchors it a bit higher, but flex-start with margin works too. Let's do exact center but offset slightly.
          }}>
            <div style={{
              width: 260,
              height: 260,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
              position: 'relative', // for the scan line
              overflow: 'hidden',
              marginBottom: 80 // offset slightly upwards
            }}>
              {/* Corner Embellishments (WeChat white brackets) */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: 20, height: 20, borderTop: '3px solid #07C160', borderLeft: '3px solid #07C160' }} />
              <div style={{ position: 'absolute', top: 0, right: 0, width: 20, height: 20, borderTop: '3px solid #07C160', borderRight: '3px solid #07C160' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: 20, height: 20, borderBottom: '3px solid #07C160', borderLeft: '3px solid #07C160' }} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderBottom: '3px solid #07C160', borderRight: '3px solid #07C160' }} />
              
              {/* Sweeping Green Line */}
              <AnimatePresence>
                {scanState === 'scanning' && (
                  <motion.div
                    initial={{ top: '-10%' }}
                    animate={{ top: '110%' }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                    style={{
                      position: 'absolute',
                      left: 0,
                      width: '100%',
                      height: 2,
                      background: 'linear-gradient(to right, transparent, #07C160, transparent)',
                      boxShadow: '0 0 8px 1px #07C160'
                    }}
                  />
                )}
              </AnimatePresence>
            </div>
            
            {/* The Typography directly below clear square */}
            <p style={{
              marginTop: -60, // pull up into the offset margin gap
              fontSize: '13px',
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: '1px'
            }}>
              识别二维码 / 花草 / 动物 / 商品等
            </p>
          </div>
          
          {/* Bottom Action Bar */}
          <div style={{
            position: 'absolute',
            bottom: 40,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-evenly',
            padding: '0 40px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <QrCode color="#fff" size={20} />
              </div>
              <span style={{ color: '#fff', fontSize: '11px' }}>我的二维码</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageIcon color="#fff" size={20} />
              </div>
              <span style={{ color: '#fff', fontSize: '11px' }}>相册</span>
            </div>
          </div>
        </React.Fragment>
      )}

      {/* 4. The Soft Apricot Center Snap Orb */}
      {snapCoord && scanState === 'detected' && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.2, 1], opacity: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{
            position: 'absolute',
            left: snapCoord.x - 20,
            top: snapCoord.y - 20,
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: '#07C160',  // WeChat green
            border: '3px solid #fff',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            zIndex: 100
          }}
        />
      )}

    </div>
  );
}
