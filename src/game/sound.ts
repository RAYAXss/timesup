import { AppSettings } from '../types/game';
import { DEFAULT_APP_SETTINGS } from './storage';

// ─── Web Audio Sound Engine ───────────────────────────────────────────────────

function createSoundEngine() {
  let ctx: AudioContext | null = null;

  let master: GainNode | null = null;
  let settings: AppSettings = DEFAULT_APP_SETTINGS;

  const getCtx = () => {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    return ctx;
  };

  // All sounds go through one master gain driven by the user's settings.
  const getOut = () => {
    const ac = getCtx();
    if (!master) {
      master = ac.createGain();
      master.connect(ac.destination);
    }
    master.gain.value = settings.soundOn ? settings.volume : 0;
    return master;
  };

  const setSettings = (s: AppSettings) => {
    settings = s;
    if (master) master.gain.value = s.soundOn ? s.volume : 0;
  };

  const playSuccess = () => {
    if (settings.vibration) navigator.vibrate?.(60);
    if (!settings.soundOn) return;
    try {
      const ac = getCtx();
      // Joyful ascending arpeggio: C5 – E5 – G5
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(getOut());
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ac.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0, ac.currentTime + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.25, ac.currentTime + i * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.1 + 0.25);
        osc.start(ac.currentTime + i * 0.1);
        osc.stop(ac.currentTime + i * 0.1 + 0.3);
      });
    } catch (_) {}
  };

  const playSkip = () => {
    if (!settings.soundOn) return;
    try {
      const ac = getCtx();
      // Short descending "woosh"
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(getOut());
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ac.currentTime + 0.18);
      gain.gain.setValueAtTime(0.15, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2);
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + 0.22);
    } catch (_) {}
  };

  const playTick = () => {
    if (!settings.soundOn) return;
    try {
      const ac = getCtx();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(getOut());
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ac.currentTime);
      gain.gain.setValueAtTime(0.08, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.06);
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + 0.07);
    } catch (_) {}
  };

  const playTimeUp = () => {
    if (!settings.soundOn) return;
    try {
      const ac = getCtx();
      [440, 330].forEach((freq, i) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(getOut());
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, ac.currentTime + i * 0.18);
        gain.gain.setValueAtTime(0.18, ac.currentTime + i * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.18 + 0.16);
        osc.start(ac.currentTime + i * 0.18);
        osc.stop(ac.currentTime + i * 0.18 + 0.18);
      });
    } catch (_) {}
  };

  return { playSuccess, playSkip, playTick, playTimeUp, setSettings };
}

export const soundEngine = createSoundEngine();

