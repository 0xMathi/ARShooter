/**
 * Combo-based scoring system.
 * Rapid consecutive hits increase multiplier.
 * Missing or timeout resets the combo.
 */
export class ScoreManager {
  private score = 0;
  private combo = 0;
  private maxCombo = 0;
  private lastHitTime = 0;
  private readonly comboTimeout = 2000; // ms before combo resets
  private readonly basePoints = 100;
  private onChange: (() => void) | null = null;

  onScoreChange(callback: () => void): void {
    this.onChange = callback;
  }

  hit(tierMultiplier = 1): { points: number; combo: number; multiplier: number } {
    const now = performance.now();

    // Reset combo if too much time passed
    if (now - this.lastHitTime > this.comboTimeout && this.combo > 0) {
      this.combo = 0;
    }

    this.combo++;
    this.lastHitTime = now;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

    const multiplier = this.getMultiplier();
    const points = Math.round(this.basePoints * multiplier * tierMultiplier);
    this.score += points;

    this.onChange?.();

    return { points, combo: this.combo, multiplier };
  }

  miss(): void {
    this.combo = 0;
    this.onChange?.();
  }

  getMultiplier(): number {
    if (this.combo >= 20) return 5;
    if (this.combo >= 10) return 3;
    if (this.combo >= 5) return 2;
    if (this.combo >= 3) return 1.5;
    return 1;
  }

  getScore(): number {
    return this.score;
  }

  getCombo(): number {
    return this.combo;
  }

  getMaxCombo(): number {
    return this.maxCombo;
  }

  /** Check if combo is still active (not timed out) */
  isComboActive(): boolean {
    return (
      this.combo > 0 &&
      performance.now() - this.lastHitTime < this.comboTimeout
    );
  }

  reset(): void {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.lastHitTime = 0;
    this.onChange?.();
  }
}
