/**
 * Gesture Ninja - Web Audio API Procedural Sound Engine
 * Generates all SFX procedurally with zero external audio assets or latency.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  resume() {
    if (!this.initialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Fast energetic swoosh of a Katana blade moving through air
   */
  playWhoosh(velocity = 1.0) {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const duration = 0.16;

    // Filtered white noise for wind/air friction
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const startFreq = 400 + Math.min(velocity, 3) * 300;
    const endFreq = 1600 + Math.min(velocity, 3) * 600;
    filter.frequency.setValueAtTime(startFreq, now);
    filter.frequency.exponentialRampToValueAtTime(endFreq, now + duration * 0.5);
    filter.frequency.exponentialRampToValueAtTime(300, now + duration);
    filter.Q.setValueAtTime(3, now);

    // Tonal swoosh oscillator
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + duration * 0.4);
    osc.frequency.exponentialRampToValueAtTime(120, now + duration);

    const gain = this.ctx.createGain();
    const vol = Math.min(0.25 + velocity * 0.1, 0.5);
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(vol, now + duration * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    osc.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    osc.start(now);
    noise.stop(now + duration);
    osc.stop(now + duration);
  }

  /**
   * Crisp energetic slice sound effect
   */
  playSlice(type = 'NORMAL') {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;

    if (type === 'GOLDEN') {
      this.playGoldenSlice();
      return;
    }

    // Sharp metallic impact + crisp pop
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';

    // High pitch initial strike snapping down
    const baseFreq = 880 + Math.random() * 200;
    osc1.frequency.setValueAtTime(baseFreq * 2, now);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, now + 0.12);

    osc2.frequency.setValueAtTime(baseFreq * 1.5, now);
    osc2.frequency.exponentialRampToValueAtTime(140, now + 0.14);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    // High-pass filtered click for sharpness
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const click = this.ctx.createBufferSource();
    click.buffer = buffer;
    const clickFilter = this.ctx.createBiquadFilter();
    clickFilter.type = 'highpass';
    clickFilter.frequency.setValueAtTime(3000, now);

    const clickGain = this.ctx.createGain();
    clickGain.gain.setValueAtTime(0.4, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    click.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(this.masterGain);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    click.start(now);
    osc1.stop(now + 0.18);
    osc2.stop(now + 0.18);
    click.stop(now + 0.04);
  }

  /**
   * Radiant melodic chime for slicing golden targets
   */
  playGoldenSlice() {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const notes = [1046.5, 1318.5, 1567.98, 2093.0]; // C6, E6, G6, C7 arpeggio

    notes.forEach((freq, idx) => {
      const time = now + idx * 0.045;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.35, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + 0.45);
    });
  }

  /**
   * Massive bomb detonation sound
   */
  playBombExplosion() {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const duration = 1.1;

    // Sub-bass thump
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.6);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    // Filtered explosion noise
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(60, now + duration);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    osc.start(now);
    noise.start(now);
    osc.stop(now + 0.7);
    noise.stop(now + duration);
  }

  /**
   * High-combo celebration fanfare
   */
  playComboSound(comboCount) {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const baseFreq = 440 * Math.pow(1.12, Math.min(comboCount, 8));

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.2);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  /**
   * UI Click feedback
   */
  playClick() {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Dramatic game over chord
   */
  playGameOver() {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const freqs = [220, 174.61, 146.83, 110]; // A3, F3, D3, A2 minor descent

    freqs.forEach((freq, idx) => {
      const time = now + idx * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.9);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, time);
      filter.frequency.exponentialRampToValueAtTime(200, time + 0.9);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + 0.9);
    });
  }
}

export const sound = new SoundEngine();
