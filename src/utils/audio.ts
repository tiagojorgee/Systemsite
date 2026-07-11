let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  
  // Sound is disabled by default to respect: "Nunca reproduzir sons automaticamente sem configuração do usuário."
  const soundEnabled = localStorage.getItem('gamezone_sound_enabled') === 'true';
  if (!soundEnabled) return null;
  
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch((err) => console.warn('Failed to resume AudioContext:', err));
  }
  
  return audioCtx;
}

function getVolumeFactor(): number {
  if (typeof window === 'undefined') return 0.5;
  const volStr = localStorage.getItem('gamezone_sound_volume');
  if (volStr === null) return 0.5;
  const vol = parseInt(volStr, 10);
  return isNaN(vol) ? 0.5 : vol / 100;
}

function connectToDestination(ctx: AudioContext, node: AudioNode) {
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(getVolumeFactor(), ctx.currentTime);
  node.connect(masterGain);
  masterGain.connect(ctx.destination);
}

export const playSound = {
  click: () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.08);

    osc.connect(gain);
    connectToDestination(ctx, gain);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  },

  jump: () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.12);

    osc.connect(gain);
    connectToDestination(ctx, gain);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  },

  collect: () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const playNote = (freq: number, startOffset: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);

      gain.gain.setValueAtTime(0.0, ctx.currentTime + startOffset);
      gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + startOffset + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + startOffset + duration);

      osc.connect(gain);
      connectToDestination(ctx, gain);

      osc.start(ctx.currentTime + startOffset);
      osc.stop(ctx.currentTime + startOffset + duration);
    };

    playNote(523.25, 0, 0.1); // C5
    playNote(659.25, 0.05, 0.12); // E5
  },

  victory: () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.07);

      gain.gain.setValueAtTime(0.0, ctx.currentTime + index * 0.07);
      gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + index * 0.07 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + index * 0.07 + 0.2);

      osc.connect(gain);
      connectToDestination(ctx, gain);

      osc.start(ctx.currentTime + index * 0.07);
      osc.stop(ctx.currentTime + index * 0.07 + 0.2);
    });
  },

  gameover: () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.55);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.005, ctx.currentTime + 0.55);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, ctx.currentTime);

    osc.connect(filter);
    filter.connect(gain);
    connectToDestination(ctx, gain);

    osc.start();
    osc.stop(ctx.currentTime + 0.55);
  },

  purchase: () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880.00, ctx.currentTime); // A5
    osc1.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.12); // E6

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.50, ctx.currentTime); // C6
    osc2.frequency.exponentialRampToValueAtTime(1567.98, ctx.currentTime + 0.12); // G6

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.18);

    osc1.connect(gain);
    osc2.connect(gain);
    connectToDestination(ctx, gain);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.18);
    osc2.stop(ctx.currentTime + 0.18);
  },

  spin: () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(380, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, ctx.currentTime);

    osc.connect(filter);
    filter.connect(gain);
    connectToDestination(ctx, gain);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  },

  tick: () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

    osc.connect(gain);
    connectToDestination(ctx, gain);

    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  },

  jackpot: () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const playTone = (freq: number, start: number, duration: number, type: OscillatorType = 'triangle') => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

      gain.gain.setValueAtTime(0.0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);

      osc.connect(gain);
      connectToDestination(ctx, gain);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    // Arpeggio C major -> E major -> G major -> C6
    const delay = 0.08;
    playTone(523.25, 0, 0.2); // C5
    playTone(659.25, delay, 0.2); // E5
    playTone(783.99, delay * 2, 0.2); // G5
    playTone(1046.50, delay * 3, 0.35); // C6
    playTone(1318.51, delay * 4, 0.35); // E6
    playTone(1567.98, delay * 5, 0.5); // G6
  }
};
