/**
 * audioEffects.ts — Web Audio API synthesized sound effects
 * 
 * No external audio files needed — all sounds generated programmatically.
 * Mimics WeChat/Douyin/Weibo success sounds.
 */

let weixinAudio: HTMLAudioElement | null = null;
let weiboAudio: HTMLAudioElement | null = null;

function playFileSound(
  cache: HTMLAudioElement | null,
  src: string,
  volume: number
) {
  if (typeof window === 'undefined') return cache;
  try {
    const audio = cache ?? new Audio(src);
    audio.preload = 'auto';
    audio.volume = volume;
    audio.pause();
    audio.currentTime = 0;
    void audio.play().catch(() => {});
    return audio;
  } catch (e) {
    console.warn('Audio not supported', e);
    return cache;
  }
}

/** WeChat QR scan success ding */
export function playWeChatDing() {
  weixinAudio = playFileSound(weixinAudio, '/sounds/weixin.mp3', 0.8);
}

export function playWeiboCue() {
  weiboAudio = playFileSound(weiboAudio, '/sounds/weibo.mp3', 0.5);
}

/** Weibo-style face verification success chime */
export function playVerificationSuccess() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Three ascending tones for a triumphant feel
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + i * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.35);
    });
  } catch (e) {
    console.warn('Audio not supported', e);
  }
}

/** Face scan cycling beep — subtle tick during scanning */
export function playFaceScanTick() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch (e) {
    /* silent */
  }
}

/** Face verification failed buzzer */
export function playFailBuzz() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    /* silent */
  }
}
