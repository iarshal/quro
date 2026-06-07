export type RingtoneHandle = {
  stop: () => void;
};

export function startPremiumRingtone(pattern: 'incoming' | 'outgoing' = 'incoming'): RingtoneHandle {
  if (typeof window === 'undefined') return { stop: () => {} };

  let stopped = false;
  let timer: ReturnType<typeof setInterval> | null = null;
  let ctx: AudioContext | null = null;

  const playTone = () => {
    if (stopped) return;

    try {
      const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtor) return;
      ctx = ctx || new AudioCtor();

      const now = ctx.currentTime;
      const notes = pattern === 'incoming'
        ? [659.25, 830.61, 987.77, 830.61]
        : [493.88, 659.25, 739.99];

      notes.forEach((frequency, index) => {
        const oscillator = ctx!.createOscillator();
        const gain = ctx!.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, now + index * 0.15);
        gain.gain.setValueAtTime(0.0001, now + index * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.055, now + index * 0.15 + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.15 + 0.13);
        oscillator.connect(gain);
        gain.connect(ctx!.destination);
        oscillator.start(now + index * 0.15);
        oscillator.stop(now + index * 0.15 + 0.14);
      });
    } catch {
      // Browsers may block audio until the user interacts with the page.
    }
  };

  playTone();
  timer = setInterval(playTone, pattern === 'incoming' ? 1800 : 2200);
  window.navigator.vibrate?.(pattern === 'incoming' ? [450, 180, 450] : [220, 180, 220]);

  return {
    stop: () => {
      stopped = true;
      if (timer) clearInterval(timer);
      window.navigator.vibrate?.(0);
      try {
        ctx?.close();
      } catch {}
    },
  };
}
