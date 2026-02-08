import type { SoundManager } from './SoundManager';

/**
 * Chiptune step sequencer - synthwave bass + melody loop.
 * Uses Web Audio API oscillators, no samples needed.
 * Tempo: 130 BPM, 16 steps per bar, loops 2 bars.
 */

const BPM = 130;
const STEPS = 32; // 2 bars of 16th notes
const STEP_TIME = 60 / BPM / 4; // 16th note duration

// Notes in Hz (0 = rest)
const NOTE = {
  C3: 131, D3: 147, Eb3: 156, E3: 165, F3: 175, G3: 196, Ab3: 208, Bb3: 233,
  C4: 262, D4: 294, Eb4: 311, E4: 330, F4: 349, G4: 392, Ab4: 415, Bb4: 466,
  C5: 523, D5: 587, Eb5: 622, E5: 659, F5: 698, G5: 784,
  REST: 0,
};

// Driving 8th-note synthwave bass (Cm key)
// Pattern: root-octave pump with chromatic runs
const BASS: number[] = [
  NOTE.C3, NOTE.REST, NOTE.C4, NOTE.REST, NOTE.C3, NOTE.REST, NOTE.C4, NOTE.REST,
  NOTE.Eb3, NOTE.REST, NOTE.Eb4, NOTE.REST, NOTE.G3, NOTE.REST, NOTE.G3, NOTE.REST,
  NOTE.Ab3, NOTE.REST, NOTE.Ab4, NOTE.REST, NOTE.Ab3, NOTE.REST, NOTE.Ab4, NOTE.REST,
  NOTE.Bb3, NOTE.REST, NOTE.G3, NOTE.REST, NOTE.F3, NOTE.REST, NOTE.G3, NOTE.REST,
];

// Catchy chiptune melody (Cm pentatonic-ish)
const MELODY: number[] = [
  NOTE.C5, NOTE.REST, NOTE.REST, NOTE.Eb5, NOTE.REST, NOTE.G5, NOTE.REST, NOTE.Eb5,
  NOTE.D5, NOTE.REST, NOTE.REST, NOTE.C5, NOTE.REST, NOTE.REST, NOTE.REST, NOTE.REST,
  NOTE.Ab4, NOTE.REST, NOTE.REST, NOTE.Bb4, NOTE.REST, NOTE.C5, NOTE.REST, NOTE.Eb5,
  NOTE.D5, NOTE.REST, NOTE.C5, NOTE.REST, NOTE.Bb4, NOTE.REST, NOTE.REST, NOTE.REST,
];

// Hi-hat pattern (velocity: 0=off, 1=closed, 2=open)
const HIHAT: number[] = [
  1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 2, 0,
  1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 2, 0, 1, 0,
];

// Kick pattern (1=hit)
const KICK: number[] = [
  1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0,
  1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0,
];

export class MusicSequencer {
  private ctx: AudioContext | null = null;
  private playing = false;
  private nextStepTime = 0;
  private currentStep = 0;
  private timerId: number | null = null;
  private masterGain: GainNode | null = null;

  constructor(private soundManager: SoundManager) {}

  start(): void {
    if (this.playing) return;

    this.ctx = this.soundManager.getContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.35; // music quieter than SFX
    this.masterGain.connect(this.ctx.destination);

    this.playing = true;
    this.currentStep = 0;
    this.nextStepTime = this.ctx.currentTime + 0.05; // tiny lead-in
    this.schedule();
  }

  stop(): void {
    this.playing = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    // Fade out
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(
        this.masterGain.gain.value,
        this.ctx.currentTime
      );
      this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
    }
  }

  private schedule(): void {
    if (!this.playing || !this.ctx) return;

    // Schedule ahead by 100ms for glitch-free playback
    while (this.nextStepTime < this.ctx.currentTime + 0.1) {
      this.playStep(this.currentStep, this.nextStepTime);
      this.nextStepTime += STEP_TIME;
      this.currentStep = (this.currentStep + 1) % STEPS;
    }

    this.timerId = window.setTimeout(() => this.schedule(), 25);
  }

  private playStep(step: number, time: number): void {
    if (!this.ctx || !this.masterGain) return;

    // === Bass ===
    const bassNote = BASS[step];
    if (bassNote > 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(bassNote, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, time);
      filter.frequency.exponentialRampToValueAtTime(200, time + STEP_TIME * 0.9);
      filter.Q.value = 5;

      gain.gain.setValueAtTime(0.3, time);
      gain.gain.setValueAtTime(0.3, time + STEP_TIME * 0.6);
      gain.gain.linearRampToValueAtTime(0, time + STEP_TIME * 0.95);

      osc.connect(filter).connect(gain).connect(this.masterGain);
      osc.start(time);
      osc.stop(time + STEP_TIME);
    }

    // === Melody ===
    const melNote = MELODY[step];
    if (melNote > 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(melNote, time);

      // Duty cycle shimmer via detune modulation
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = 6;
      lfoGain.gain.value = 15; // subtle vibrato
      lfo.connect(lfoGain).connect(osc.detune);
      lfo.start(time);
      lfo.stop(time + STEP_TIME * 2);

      const noteDur = STEP_TIME * 1.8; // legato
      gain.gain.setValueAtTime(0.15, time);
      gain.gain.setValueAtTime(0.15, time + noteDur * 0.7);
      gain.gain.linearRampToValueAtTime(0, time + noteDur);

      osc.connect(gain).connect(this.masterGain);
      osc.start(time);
      osc.stop(time + noteDur);
    }

    // === Hi-hat ===
    const hat = HIHAT[step];
    if (hat > 0) {
      const bufLen = this.ctx.sampleRate * (hat === 2 ? 0.08 : 0.03);
      const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;

      const filt = this.ctx.createBiquadFilter();
      filt.type = 'highpass';
      filt.frequency.value = hat === 2 ? 7000 : 9000;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(hat === 2 ? 0.08 : 0.05, time);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        time + (hat === 2 ? 0.08 : 0.03)
      );

      src.connect(filt).connect(gain).connect(this.masterGain);
      src.start(time);
      src.stop(time + (hat === 2 ? 0.08 : 0.03));
    }

    // === Kick ===
    if (KICK[step]) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(30, time + 0.1);
      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      osc.connect(gain).connect(this.masterGain);
      osc.start(time);
      osc.stop(time + 0.1);
    }
  }
}
