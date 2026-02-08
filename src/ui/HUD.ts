import type { ScoreManager } from '../game/ScoreManager';

/**
 * Heads-up display showing score, combo, and multiplier.
 */
export class HUD {
  private scoreEl: HTMLDivElement;
  private comboEl: HTMLDivElement;
  private multiplierEl: HTMLDivElement;
  private container: HTMLDivElement;

  constructor() {
    const hud = document.getElementById('hud');
    if (!hud) throw new Error('HUD element not found');

    this.container = document.createElement('div');
    Object.assign(this.container.style, {
      position: 'absolute',
      top: '20px',
      left: '0',
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      gap: '30px',
      fontFamily: "'Inter', system-ui, sans-serif",
      pointerEvents: 'none',
    });

    this.scoreEl = this.createDisplay('SCORE', '0');
    this.comboEl = this.createDisplay('COMBO', '0');
    this.multiplierEl = this.createDisplay('MULTI', 'x1');

    this.container.appendChild(this.scoreEl);
    this.container.appendChild(this.comboEl);
    this.container.appendChild(this.multiplierEl);
    hud.appendChild(this.container);
  }

  update(scoreManager: ScoreManager): void {
    const score = scoreManager.getScore();
    const combo = scoreManager.getCombo();
    const multi = scoreManager.getMultiplier();
    const active = scoreManager.isComboActive();

    this.setDisplay(this.scoreEl, score.toLocaleString());
    this.setDisplay(this.comboEl, active ? combo.toString() : '0');
    this.setDisplay(this.multiplierEl, `x${multi}`);

    // Glow effect for active combo
    this.comboEl.style.textShadow = active
      ? '0 0 15px #00f0ff'
      : 'none';
    this.multiplierEl.style.textShadow =
      multi > 1 ? '0 0 15px #ff00e0' : 'none';
  }

  private createDisplay(label: string, value: string): HTMLDivElement {
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, {
      textAlign: 'center',
    });

    const labelEl = document.createElement('div');
    labelEl.textContent = label;
    Object.assign(labelEl.style, {
      fontSize: '0.65rem',
      color: '#888',
      letterSpacing: '0.15rem',
      marginBottom: '2px',
    });

    const valueEl = document.createElement('div');
    valueEl.textContent = value;
    valueEl.className = 'hud-value';
    Object.assign(valueEl.style, {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#fff',
    });

    wrapper.appendChild(labelEl);
    wrapper.appendChild(valueEl);
    return wrapper;
  }

  private setDisplay(wrapper: HTMLDivElement, value: string): void {
    const valueEl = wrapper.querySelector('.hud-value') as HTMLDivElement;
    if (valueEl) valueEl.textContent = value;
  }
}
