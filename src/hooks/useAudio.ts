import { useCallback, useEffect, useRef } from 'react';

interface SoundConfig {
  src: string;
  fallbackUrl: string;
  volume: number;
  haptic?: number[];
}

const SOUNDS: Record<string, SoundConfig> = {
  click: { src: '/sounds/click.mp3', fallbackUrl: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', volume: 0.2, haptic: [8] },
  complete: { src: '/sounds/complete.mp3', fallbackUrl: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', volume: 0.3, haptic: [20, 30, 20] },
  'focus-start': { src: '/sounds/focus-start.mp3', fallbackUrl: 'https://assets.mixkit.co/active_storage/sfx/600/600-preview.mp3', volume: 0.24, haptic: [10, 20, 8] },
  start: { src: '/sounds/focus-start.mp3', fallbackUrl: 'https://assets.mixkit.co/active_storage/sfx/600/600-preview.mp3', volume: 0.3, haptic: [12, 20, 8] },
  delete: { src: '/sounds/delete.mp3', fallbackUrl: 'https://assets.mixkit.co/active_storage/sfx/256/256-preview.mp3', volume: 0.22, haptic: [10] },
  ai: { src: '/sounds/complete.mp3', fallbackUrl: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', volume: 0.28 }
};

const resolveSource = (sound: SoundConfig): string => sound?.src || sound?.fallbackUrl || '';

export function useAudio(): { playSound: (soundKey: string) => void } {
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const preloadAttemptedRef = useRef(false);
  const hasUserGestureRef = useRef(false);

  useEffect(() => {
    if (preloadAttemptedRef.current) return;
    preloadAttemptedRef.current = true;
    Object.entries(SOUNDS).forEach(([soundKey, sound]) => {
      const audio = new Audio(resolveSource(sound));
      audio.preload = 'auto';
      audio.addEventListener('error', () => {
        if (sound.fallbackUrl && audio.src !== sound.fallbackUrl) { audio.src = sound.fallbackUrl; audio.load(); }
      });
      audioRefs.current[soundKey] = audio;
    });
  }, []);

  useEffect(() => {
    const markUserGesture = () => {
      hasUserGestureRef.current = true;
    };
    window.addEventListener('pointerdown', markUserGesture, { once: true });
    return () => window.removeEventListener('pointerdown', markUserGesture);
  }, []);

  const playSound = useCallback((soundKey: string) => {
    const sound = SOUNDS[soundKey];
    if (!sound) return;
    if (!audioRefs.current[soundKey]) {
      const audio = new Audio(resolveSource(sound));
      audio.preload = 'auto';
      audio.addEventListener('error', () => {
        if (sound.fallbackUrl && audio.src !== sound.fallbackUrl) { audio.src = sound.fallbackUrl; audio.load(); }
      });
      audioRefs.current[soundKey] = audio;
    }
    const baseAudio = audioRefs.current[soundKey];
    const audio = baseAudio.paused ? baseAudio : (baseAudio.cloneNode(true) as HTMLAudioElement);
    if (audio.currentTime !== 0) Object.assign(audio, { currentTime: 0 });
    Object.assign(audio, { volume: sound.volume ?? 0.3 });
    audio.play().catch(() => undefined);
    if (
      hasUserGestureRef.current &&
      typeof navigator !== 'undefined' &&
      typeof navigator.vibrate === 'function' &&
      sound.haptic
    ) {
      try {
        navigator.vibrate(sound.haptic);
      } catch {
        // Ignore blocked/unsupported haptic calls.
      }
    }
  }, []);

  return { playSound };
}
