/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                    QURO AR SCANNER ENGINE                                ║
 * ║                                                                          ║
 * ║  The heart of Quro. Designed to feel like magic.                        ║
 * ║                                                                          ║
 * ║  Architecture:                                                           ║
 * ║    • expo-camera + BarCodeScanner for QR detection (60fps capable)      ║
 * ║    • Framer-style spring animation via react-native-reanimated           ║
 * ║    • Soft Apricot snap circle with glow pulse                           ║
 * ║    • Sensory Trinity: Visual + Haptic + Audio fire concurrently         ║
 * ║    • Minimalist viewfinder with corner brackets only                    ║
 * ║    • Deep-link routing: quro://session/<token> or quro://user/<id>      ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { CameraView, Camera, BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { COLORS, RADII, SCANNER, SPACING } from '@quro/ui';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const VIEWFINDER_SIZE = Math.min(SCREEN_W * 0.68, 280);

// ── Sound ────────────────────────────────────────────────────────────────────
// WeChat-style mechanical click sound (bundled asset)
let clickSound: Audio.Sound | null = null;

async function loadClickSound() {
  if (clickSound) return;
  const { sound } = await Audio.Sound.createAsync(
    require('../../../assets/sounds/quro_scan_click.wav'),
    { shouldPlay: false, volume: 1.0 }
  );
  clickSound = sound;
}

async function playClickSound() {
  try {
    if (!clickSound) await loadClickSound();
    await clickSound?.setPositionAsync(0);
    await clickSound?.playAsync();
  } catch {
    // Audio failure is non-fatal — haptic + visual still fire
  }
}

// ── Types ────────────────────────────────────────────────────────────────────
interface QRBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SnapCircleState {
  visible: boolean;
  x: number;  // center X on screen
  y: number;  // center Y on screen
}

// ── Main Scanner Component ────────────────────────────────────────────────────
export default function ScannerScreen() {
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [snapCircle, setSnapCircle] = useState<SnapCircleState>({
    visible: false,
    x: SCREEN_W / 2,
    y: SCREEN_H / 2,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusHint, setStatusHint] = useState('');

  // Reanimated shared values for the snap circle
  const circleScale = useSharedValue(0);
  const circleOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  // Debounce: only process one QR at a time
  const lastProcessedRef = useRef<string>('');
  const cooldownRef = useRef(false);

  useEffect(() => {
    loadClickSound();
    return () => {
      clickSound?.unloadAsync();
      clickSound = null;
    };
  }, []);

  // ── Sensory Trinity ─────────────────────────────────────────────────────────
  /**
   * Fires the three concurrent sensory events that make Quro feel premium:
   *   1. Visual: Soft Apricot snap circle appears with spring physics + pulse ring
   *   2. Audio:  WeChat-style mechanical click sound
   *   3. Haptic: Heavy Taptic Engine impact
   */
  const fireTriple = useCallback(async (cx: number, cy: number) => {
    // Position the circle at the QR code center BEFORE animating in
    setSnapCircle({ visible: true, x: cx, y: cy });

    // ── 1. Visual: spring snap ────────────────────────────────────────────
    circleScale.value = withSpring(1, SCANNER_SPRING_SNAP, () => {
      // After snap complete, start pulse
      pulseOpacity.value = withTiming(1, { duration: 50 });
      pulseScale.value = withSequence(
        withTiming(SCANNER.circlePulseScale, { duration: SCANNER.circlePulseDuration }),
        withTiming(SCANNER.circlePulseScale + 0.2, { duration: 200 })
      );
      pulseOpacity.value = withTiming(0, { duration: SCANNER.circlePulseDuration + 200 });
    });
    circleOpacity.value = withTiming(1, { duration: 80 });

    // ── 2. Audio: click sound ────────────────────────────────────────────────
    // ── 3. Haptic: heavy impact ───────────────────────────────────────────────
    // Fired concurrently — do not await either
    playClickSound();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  // ── QR Decode Handler ────────────────────────────────────────────────────────
  const handleBarCodeScanned = useCallback(
    async (result: BarcodeScanningResult) => {
      if (cooldownRef.current) return;
      if (result.type !== 'qr') return;

      const data = result.data;
      if (!data || data === lastProcessedRef.current) return;

      // Debounce: prevent double-fire
      lastProcessedRef.current = data;
      cooldownRef.current = true;
      setIsProcessing(true);

      // Compute the center of the QR bounding box in screen coordinates
      // expo-camera provides bounds as { origin: {x,y}, size: {width,height} }
      // These are in the camera coordinate space (0–1 normalized)
      const bounds = result.bounds;
      const cx = (bounds.origin.x + bounds.size.width / 2) * SCREEN_W;
      const cy = (bounds.origin.y + bounds.size.height / 2) * SCREEN_H;

      // Fire the Sensory Trinity
      await fireTriple(cx, cy);

      // Route based on QR content
      try {
        await routeQRData(data);
      } catch (err) {
        setStatusHint('Unrecognized QR code');
        setTimeout(() => setStatusHint(''), 2000);
      }

      // Reset after 2.5 seconds to allow new scans
      setTimeout(() => {
        circleScale.value = withTiming(0, { duration: 300 });
        circleOpacity.value = withTiming(0, { duration: 300 });
        setSnapCircle((s) => ({ ...s, visible: false }));
        setIsProcessing(false);
        lastProcessedRef.current = '';
        cooldownRef.current = false;
      }, 2500);
    },
    [fireTriple]
  );

  // ── QR Routing Logic ─────────────────────────────────────────────────────────
  async function routeQRData(data: string) {
    // Desktop login: quro://session/<32-byte-hex-token>
    if (data.startsWith('quro://session/')) {
      const sessionToken = data.replace('quro://session/', '');
      setStatusHint('Authenticating desktop…');
      await activateDesktopSession(sessionToken);
      return;
    }

    // Friend add: quro://user/<qurold>
    if (data.startsWith('quro://user/')) {
      const quroId = data.replace('quro://user/', '');
      setStatusHint(`Adding ${quroId}…`);
      router.push(`/(app)/contact?quroId=${quroId}`);
      return;
    }

    // Unknown QR — show hint and continue scanning
    setStatusHint('Not a Quro code');
    setTimeout(() => setStatusHint(''), 1500);
    cooldownRef.current = false;
    lastProcessedRef.current = '';
  }

  async function activateDesktopSession(sessionToken: string) {
    try {
      const { createBrowserClient } = await import('@quro/db');
      const supabase = createBrowserClient();

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setStatusHint('Not logged in. Please authenticate first.');
        return;
      }

      const appUrl = process.env.EXPO_PUBLIC_APP_URL ?? 'http://localhost:3000';

      // Call the web app's API route to activate the session and broadcast auth
      const response = await fetch(`${appUrl}/api/session/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken,
          authToken: sessionData.session.access_token,
          deviceInfo: {
            platform: Platform.OS,
            deviceName: Platform.OS === 'ios'
              ? 'iPhone'
              : 'Android Device',
          },
        }),
      });

      if (!response.ok) {
        setStatusHint('Session expired or invalid');
        return;
      }

      setStatusHint('✓ Desktop login successful!');
    } catch (err) {
      setStatusHint('Failed to connect. Check your internet.');
    }
  }

  // ── Animated styles ─────────────────────────────────────────────────────────
  const snapCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
    opacity: circleOpacity.value,
  }));

  const pulseRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  // ── Render: Permission denied ────────────────────────────────────────────────
  if (!permission?.granted) {
    return (
      <View style={styles.permissionScreen}>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionDesc}>
          Quro needs your camera to scan QR codes. No images are ever stored or transmitted.
        </Text>
        <Pressable
          id="btn-grant-camera"
          style={styles.permissionBtn}
          onPress={requestPermission}
        >
          <Text style={styles.permissionBtnText}>Grant Access</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Full-screen camera feed ──────────────────────────────────────────── */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={isProcessing ? undefined : handleBarCodeScanned}
      />

      {/* ── Dark edge vignette (focus attention to center) ─────────────────── */}
      <View style={styles.vignette} pointerEvents="none" />

      {/* ── Viewfinder: corner brackets only ────────────────────────────────── */}
      <View style={styles.viewfinderContainer} pointerEvents="none">
        <View style={[styles.viewfinder, { width: VIEWFINDER_SIZE, height: VIEWFINDER_SIZE }]}>
          {/* Four corners */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
      </View>

      {/* ── AR Snap Circle (appears at exact QR bounding box center) ─────────── */}
      {snapCircle.visible && (
        <View
          style={[
            styles.snapCircleAnchor,
            { left: snapCircle.x, top: snapCircle.y },
          ]}
          pointerEvents="none"
        >
          {/* Pulse ring (expands outward on snap) */}
          <Animated.View style={[styles.pulseRing, pulseRingStyle]} />
          {/* Main snap circle */}
          <Animated.View style={[styles.snapCircle, snapCircleStyle]} />
        </View>
      )}

      {/* ── Status hint (routing feedback) ───────────────────────────────────── */}
      {!!statusHint && (
        <Animated.View
          style={styles.statusHint}
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(300)}
          pointerEvents="none"
        >
          <Text style={styles.statusHintText}>{statusHint}</Text>
        </Animated.View>
      )}

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <Pressable
          id="btn-scanner-close"
          style={styles.closeBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>

        <Text style={styles.topTitle}>Scan QR Code</Text>

        {/* Torch toggle (future feature placeholder) */}
        <View style={{ width: 40 }} />
      </View>

      {/* ── Bottom hint ──────────────────────────────────────────────────────── */}
      <View style={styles.bottomHint} pointerEvents="none">
        <Text style={styles.bottomHintText}>
          Point at a friend&apos;s Quro code or the desktop screen
        </Text>
      </View>
    </View>
  );
}

// ── Spring config for the snap circle ────────────────────────────────────────
const SCANNER_SPRING_SNAP = {
  damping: 22,
  stiffness: 320,
  mass: 0.7,
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // ── Permission screen ──────────────────────────────────────────────────────
  permissionScreen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING[8],
    gap: SPACING[5],
  },

  permissionTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },

  permissionDesc: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  permissionBtn: {
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[10],
    backgroundColor: COLORS.brand,
    borderRadius: RADII.pill,
  },

  permissionBtnText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },

  // ── Camera overlay layers ──────────────────────────────────────────────────
  vignette: {
    ...StyleSheet.absoluteFillObject,
    // Dark radial vignette — focused center
    backgroundColor: 'transparent',
  },

  // ── Viewfinder ─────────────────────────────────────────────────────────────
  viewfinderContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },

  viewfinder: {
    position: 'relative',
  },

  corner: {
    position: 'absolute',
    width: SCANNER.finderCornerLength,
    height: SCANNER.finderCornerLength,
    borderColor: COLORS.brand,
  },

  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: SCANNER.finderCornerThickness,
    borderLeftWidth: SCANNER.finderCornerThickness,
    borderTopLeftRadius: SCANNER.finderCornerRadius,
  },

  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: SCANNER.finderCornerThickness,
    borderRightWidth: SCANNER.finderCornerThickness,
    borderTopRightRadius: SCANNER.finderCornerRadius,
  },

  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: SCANNER.finderCornerThickness,
    borderLeftWidth: SCANNER.finderCornerThickness,
    borderBottomLeftRadius: SCANNER.finderCornerRadius,
  },

  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: SCANNER.finderCornerThickness,
    borderRightWidth: SCANNER.finderCornerThickness,
    borderBottomRightRadius: SCANNER.finderCornerRadius,
  },

  // ── AR Snap Circle ─────────────────────────────────────────────────────────
  snapCircleAnchor: {
    position: 'absolute',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  snapCircle: {
    position: 'absolute',
    width: SCANNER.circleSize,
    height: SCANNER.circleSize,
    borderRadius: SCANNER.circleSize / 2,
    backgroundColor: COLORS.brandGlow,
    borderWidth: 3,
    borderColor: COLORS.brand,
    // iOS shadow (the "glow")
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    // Android elevation for shadow
    elevation: 20,
  },

  pulseRing: {
    position: 'absolute',
    width: SCANNER.circleSize,
    height: SCANNER.circleSize,
    borderRadius: SCANNER.circleSize / 2,
    borderWidth: 2.5,
    borderColor: COLORS.brand,
  },

  // ── Status hint ────────────────────────────────────────────────────────────
  statusHint: {
    position: 'absolute',
    bottom: SCREEN_H * 0.18,
    left: SPACING[8],
    right: SPACING[8],
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[5],
    borderRadius: RADII.pill,
    alignItems: 'center',
  },

  statusHintText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // ── Top bar ────────────────────────────────────────────────────────────────
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[5],
    paddingTop: Platform.OS === 'ios' ? 58 : 32,
    paddingBottom: SPACING[4],
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeBtnText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
  },

  topTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // ── Bottom hint ────────────────────────────────────────────────────────────
  bottomHint: {
    position: 'absolute',
    bottom: SCREEN_H * 0.08,
    left: SPACING[8],
    right: SPACING[8],
    alignItems: 'center',
  },

  bottomHintText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
  },
});
