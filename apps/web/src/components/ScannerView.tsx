'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { playWeChatDing } from '../lib/audioEffects';

type ScanState = 'idle' | 'scanning' | 'detected';

interface ScannerViewProps {
  onPatternDetected?: (payload: string) => void;
}

type JsQRModule = typeof import('jsqr');

export function ScannerView({ onPatternDetected }: ScannerViewProps) {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [snapCoord, setSnapCoord] = useState<{ x: number; y: number } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoadingScanner, setIsLoadingScanner] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const jsQRRef = useRef<JsQRModule['default'] | null>(null);
  const hasDetectedRef = useRef(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = 0;
    }
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const ensureScannerLib = useCallback(async () => {
    if (jsQRRef.current) return jsQRRef.current;
    const module = await import('jsqr');
    jsQRRef.current = module.default;
    return jsQRRef.current;
  }, []);

  const tick = useCallback(async () => {
    if (scanState !== 'scanning') return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const jsQR = jsQRRef.current;

    if (!video || !canvas || !jsQR) {
      requestRef.current = requestAnimationFrame(() => {
        void tick();
      });
      return;
    }

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code?.data) {
          if (hasDetectedRef.current) {
            return;
          }
          hasDetectedRef.current = true;
          setScanState('detected');
          stopCamera();

          const { topLeftCorner: tl, topRightCorner: tr, bottomLeftCorner: bl, bottomRightCorner: br } = code.location;
          const cX = (tl.x + tr.x + bl.x + br.x) / 4;
          const cY = (tl.y + tr.y + bl.y + br.y) / 4;
          const rect = video.getBoundingClientRect();
          const renderRatio = Math.max(rect.width / canvas.width, rect.height / canvas.height);

          setSnapCoord({
            x: rect.left + cX * renderRatio,
            y: rect.top + cY * renderRatio,
          });

          playWeChatDing();

          window.setTimeout(() => {
            onPatternDetected?.(code.data);
          }, 800);

          return;
        }
      }
    }

    requestRef.current = requestAnimationFrame(() => {
      void tick();
    });
  }, [onPatternDetected, scanState, stopCamera]);

  useEffect(() => {
    if (scanState !== 'scanning') return;

    requestRef.current = requestAnimationFrame(() => {
      void tick();
    });

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = 0;
      }
    };
  }, [scanState, tick]);

  async function startScanner() {
    if (isLoadingScanner) return;

    try {
      hasDetectedRef.current = false;
      setIsLoadingScanner(true);
      setCameraError(null);

      await ensureScannerLib();

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera is not supported on this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      setScanState('scanning');
    } catch (error) {
      console.error('Scanner startup failed:', error);
      setCameraError('Camera access denied or unavailable.');
      stopCamera();
    } finally {
      setIsLoadingScanner(false);
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh', backgroundColor: '#000', overflow: 'hidden' }}>
      <style>{`
        @keyframes scan-line {
          0% { transform: translateY(-8px); opacity: 0; }
          12% { opacity: 1; }
          88% { opacity: 1; }
          100% { transform: translateY(268px); opacity: 0; }
        }
      `}</style>

      <video
        ref={videoRef}
        muted
        playsInline
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: scanState === 'idle' ? 0 : 1,
          transition: 'opacity 0.25s ease',
        }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {scanState === 'idle' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000',
            padding: 24,
            textAlign: 'center',
          }}
        >
          <div style={{ width: 72, height: 72, borderRadius: 24, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7V4h3" />
              <path d="M17 4h3v3" />
              <path d="M20 17v3h-3" />
              <path d="M7 20H4v-3" />
              <path d="M9 9h6v6H9z" />
            </svg>
          </div>
          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>QR Scanner</h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, margin: '10px 0 24px' }}>
            Scan Quro QR codes and desktop login codes
          </p>
          {cameraError && (
            <p style={{ color: '#FF6B6B', fontSize: 13, marginBottom: 16 }}>
              {cameraError}
            </p>
          )}
          <button
            onClick={startScanner}
            style={{
              backgroundColor: '#07C160',
              color: '#fff',
              padding: '14px 32px',
              borderRadius: 12,
              border: 'none',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              minWidth: 220,
              boxShadow: '0 10px 24px rgba(7,193,96,0.25)',
            }}
          >
            {isLoadingScanner ? 'Starting Camera...' : 'Tap to Start Scanner'}
          </button>
        </div>
      )}

      {(scanState === 'scanning' || scanState === 'detected') && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 260,
                height: 260,
                position: 'relative',
                overflow: 'hidden',
                marginBottom: 80,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, width: 24, height: 24, borderTop: '3px solid #07C160', borderLeft: '3px solid #07C160' }} />
              <div style={{ position: 'absolute', top: 0, right: 0, width: 24, height: 24, borderTop: '3px solid #07C160', borderRight: '3px solid #07C160' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: 24, height: 24, borderBottom: '3px solid #07C160', borderLeft: '3px solid #07C160' }} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderBottom: '3px solid #07C160', borderRight: '3px solid #07C160' }} />

              {scanState === 'scanning' && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    width: '100%',
                    height: 2,
                    background: 'linear-gradient(to right, transparent, #07C160, transparent)',
                    boxShadow: '0 0 8px 1px #07C160',
                    animation: 'scan-line 2.5s linear infinite',
                  }}
                />
              )}
            </div>

            <p
              style={{
                marginTop: -60,
                fontSize: 13,
                color: 'rgba(255,255,255,0.72)',
                letterSpacing: '1px',
              }}
            >
              Point the QR code inside the frame
            </p>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 40,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                padding: '12px 18px',
                borderRadius: 999,
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              Scanning...
            </div>
          </div>
        </>
      )}

      {snapCoord && scanState === 'detected' && (
        <div
          style={{
            position: 'absolute',
            left: snapCoord.x - 20,
            top: snapCoord.y - 20,
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: '#07C160',
            border: '3px solid #fff',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            zIndex: 100,
          }}
        />
      )}
    </div>
  );
}
