/**
 * Retro arcade sound effects using Web Audio API + FM synthesis.
 * No external audio files needed.
 */
export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.6;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private get out(): AudioNode {
    return this.masterGain ?? this.getContext().destination;
  }

  /** Random detune ±200 cents (~1 semitone) */
  private rngDetune(): number {
    return (Math.random() * 2 - 1) * 200;
  }

  /**
   * "Pew Pew" retro laser - FM synthesis.
   * Carrier: square wave sweep 1200→200Hz
   * Modulator: sine at 3x carrier freq for metallic timbre
   */
  playShoot(): void {
    const ctx = this.getContext();
    const t = ctx.currentTime;
    const dur = 0.12;

    // FM modulator
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    mod.type = 'sine';
    mod.frequency.setValueAtTime(3600, t);
    mod.frequency.exponentialRampToValueAtTime(600, t + dur);
    modGain.gain.setValueAtTime(400, t);
    modGain.gain.exponentialRampToValueAtTime(1, t + dur);
    mod.connect(modGain);

    // Carrier
    const car = ctx.createOscillator();
    const carGain = ctx.createGain();
    car.type = 'square';
    car.detune.value = this.rngDetune();
    car.frequency.setValueAtTime(1200, t);
    car.frequency.exponentialRampToValueAtTime(200, t + dur);
    modGain.connect(car.frequency); // FM connection

    carGain.gain.setValueAtTime(0.25, t);
    carGain.gain.setValueAtTime(0.25, t + dur * 0.3);
    carGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    car.connect(carGain).connect(this.out);

    mod.start(t);
    car.start(t);
    mod.stop(t + dur);
    car.stop(t + dur);
  }

  /**
   * Explosion/hit - layered noise burst + low kick + mid crunch.
   */
  playHit(): void {
    const ctx = this.getContext();
    const t = ctx.currentTime;

    // === Noise burst (filtered) ===
    const bufLen = ctx.sampleRate * 0.15;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const noiseFilt = ctx.createBiquadFilter();
    noiseFilt.type = 'bandpass';
    noiseFilt.frequency.setValueAtTime(2000, t);
    noiseFilt.frequency.exponentialRampToValueAtTime(300, t + 0.12);
    noiseFilt.Q.value = 1.5;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    noise.connect(noiseFilt).connect(noiseGain).connect(this.out);

    // === Low kick ===
    const kick = ctx.createOscillator();
    const kickGain = ctx.createGain();
    kick.type = 'sine';
    kick.detune.value = this.rngDetune() * 0.5;
    kick.frequency.setValueAtTime(180, t);
    kick.frequency.exponentialRampToValueAtTime(30, t + 0.15);
    kickGain.gain.setValueAtTime(0.6, t);
    kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    kick.connect(kickGain).connect(this.out);

    // === Mid crunch (distorted square) ===
    const crunch = ctx.createOscillator();
    const crunchGain = ctx.createGain();
    crunch.type = 'square';
    crunch.frequency.setValueAtTime(120, t);
    crunch.frequency.exponentialRampToValueAtTime(50, t + 0.08);
    crunchGain.gain.setValueAtTime(0.15, t);
    crunchGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    crunch.connect(crunchGain).connect(this.out);

    noise.start(t);
    kick.start(t);
    crunch.start(t);
    noise.stop(t + 0.15);
    kick.stop(t + 0.15);
    crunch.stop(t + 0.08);
  }

  /** Miss/whoosh - filtered noise sweep down */
  playMiss(): void {
    const ctx = this.getContext();
    const t = ctx.currentTime;
    const dur = 0.18;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.detune.value = this.rngDetune();
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + dur);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(gain).connect(this.out);
    osc.start(t);
    osc.stop(t + dur);
  }

  /**
   * Power-up / combo milestone - rapid ascending arpeggio.
   * 5-note chiptune burst using square waves.
   */
  playCombo(): void {
    const ctx = this.getContext();
    const t = ctx.currentTime;
    // C5 → E5 → G5 → C6 → E6 (major arpeggio)
    const notes = [523, 659, 784, 1047, 1319];
    const step = 0.055;
    const noteDur = 0.1;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = t + i * step;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, start);
      // Slight pitch bend up for sparkle
      osc.frequency.linearRampToValueAtTime(freq * 1.02, start + noteDur * 0.5);

      gain.gain.setValueAtTime(0.18, start);
      gain.gain.setValueAtTime(0.18, start + noteDur * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, start + noteDur);

      osc.connect(gain).connect(this.out);
      osc.start(start);
      osc.stop(start + noteDur);
    });
  }

  /** Game over stinger - descending minor arpeggio */
  playGameOver(): void {
    const ctx = this.getContext();
    const t = ctx.currentTime;
    // Cm descending: C5 → Ab4 → G4 → Eb4 → C4
    const notes = [523, 415, 392, 311, 262];
    const step = 0.12;
    const noteDur = 0.3;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = t + i * step;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + noteDur);

      osc.connect(gain).connect(this.out);
      osc.start(start);
      osc.stop(start + noteDur);
    });
  }
}
