import type { ScoreManager } from '../game/ScoreManager';

const COMBO_TIERS = [3, 5, 10, 20];

// Neo Geo arcade palette
const COLORS = {
  score: '#FFD700',     // gold
  timer: '#00FF88',     // green
  timerWarn: '#FF2244',
  combo: '#00DDFF',     // cyan
  multi: '#FF44FF',     // magenta
  label: '#AABBCC',
  panel: 'rgba(0, 0, 0, 0.6)',
  border: 'rgba(255, 255, 255, 0.15)',
  progressFrom: '#00DDFF',
  progressTo: '#FF44FF',
};

/**
 * Neo Geo arcade-style HUD.
 */
export class HUD {
  private scoreEl: HTMLDivElement;
  private timerEl: HTMLDivElement;
  private comboEl: HTMLDivElement;
  private multiplierEl: HTMLDivElement;
  private comboProgressBar: HTMLDivElement;
  private comboProgressTrack: HTMLDivElement;
  private container: HTMLDivElement;

  constructor() {
    const hud = document.getElementById('hud');
    if (!hud) throw new Error('HUD element not found');

    // Inject arcade font + keyframes
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
      @keyframes hud-pop {
        0% { transform: scale(1); }
        50% { transform: scale(1.25); }
        100% { transform: scale(1); }
      }
      @keyframes hud-urgent {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
    `;
    document.head.appendChild(style);

    this.container = document.createElement('div');
    Object.assign(this.container.style, {
      position: 'absolute',
      top: '12px',
      left: '0',
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      gap: '8px',
      padding: '0 12px',
      pointerEvents: 'none',
    });

    this.scoreEl = this.createPanel('SCORE', '0', COLORS.score);
    this.timerEl = this.createPanel('TIME', '60', COLORS.timer);
    this.comboEl = this.createPanel('COMBO', '0', COLORS.combo);
    this.multiplierEl = this.createPanel('MULTI', 'x1', COLORS.multi);

    // Combo progress track + bar
    this.comboProgressTrack = document.createElement('div');
    Object.assign(this.comboProgressTrack.style, {
      position: 'absolute',
      bottom: '6px',
      left: '8px',
      right: '8px',
      height: '4px',
      background: 'rgba(255,255,255,0.1)',
      borderRadius: '2px',
      overflow: 'hidden',
    });
    this.comboProgressBar = document.createElement('div');
    Object.assign(this.comboProgressBar.style, {
      width: '0%',
      height: '100%',
      background: `linear-gradient(90deg, ${COLORS.progressFrom}, ${COLORS.progressTo})`,
      borderRadius: '2px',
      transition: 'width 0.15s ease',
      boxShadow: `0 0 6px ${COLORS.progressFrom}`,
    });
    this.comboProgressTrack.appendChild(this.comboProgressBar);
    this.comboEl.appendChild(this.comboProgressTrack);

    this.container.appendChild(this.scoreEl);
    this.container.appendChild(this.timerEl);
    this.container.appendChild(this.comboEl);
    this.container.appendChild(this.multiplierEl);
    hud.appendChild(this.container);
  }

  update(scoreManager: ScoreManager, timeRemaining: number): void {
    const score = scoreManager.getScore();
    const combo = scoreManager.getCombo();
    const multi = scoreManager.getMultiplier();
    const active = scoreManager.isComboActive();

    this.setValue(this.scoreEl, score.toLocaleString());
    this.setValue(this.timerEl, Math.ceil(timeRemaining).toString());
    this.setValue(this.comboEl, active ? combo.toString() : '0');
    this.setValue(this.multiplierEl, `x${multi}`);

    // Combo progress toward next multiplier tier
    const nextTier = COMBO_TIERS.find((t) => t > combo) ?? COMBO_TIERS[COMBO_TIERS.length - 1];
    const prevTier = COMBO_TIERS[COMBO_TIERS.indexOf(nextTier) - 1] ?? 0;
    const progress = active && combo < nextTier
      ? ((combo - prevTier) / (nextTier - prevTier)) * 100
      : combo >= COMBO_TIERS[COMBO_TIERS.length - 1] && active ? 100 : 0;
    this.comboProgressBar.style.width = `${progress}%`;

    // Combo glow when active
    const comboValue = this.comboEl.querySelector('.hud-value') as HTMLElement;
    if (comboValue) {
      comboValue.style.textShadow = active
        ? `0 0 8px ${COLORS.combo}, 0 0 20px ${COLORS.combo}`
        : 'none';
    }

    // Multiplier pop effect
    const multiValue = this.multiplierEl.querySelector('.hud-value') as HTMLElement;
    if (multiValue) {
      multiValue.style.textShadow = multi > 1
        ? `0 0 8px ${COLORS.multi}, 0 0 20px ${COLORS.multi}`
        : 'none';
    }

    // Timer: urgent blink under 10s
    const timerValue = this.timerEl.querySelector('.hud-value') as HTMLElement;
    if (timerValue) {
      if (timeRemaining <= 10) {
        timerValue.style.color = COLORS.timerWarn;
        timerValue.style.textShadow = `0 0 8px ${COLORS.timerWarn}, 0 0 20px ${COLORS.timerWarn}`;
        timerValue.style.animation = 'hud-urgent 0.5s ease-in-out infinite';
      } else {
        timerValue.style.color = COLORS.timer;
        timerValue.style.textShadow = 'none';
        timerValue.style.animation = 'none';
      }
    }
  }

  /** Pop-scale animation on a panel value */
  pop(el: HTMLDivElement): void {
    const value = el.querySelector('.hud-value') as HTMLElement;
    if (!value) return;
    value.style.animation = 'none';
    // Force reflow
    void value.offsetWidth;
    value.style.animation = 'hud-pop 0.2s ease-out';
  }

  popScore(): void { this.pop(this.scoreEl); }
  popCombo(): void { this.pop(this.comboEl); }
  popMulti(): void { this.pop(this.multiplierEl); }

  private createPanel(label: string, value: string, color: string): HTMLDivElement {
    const panel = document.createElement('div');
    Object.assign(panel.style, {
      position: 'relative',
      background: COLORS.panel,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
      padding: '6px 14px 14px',
      minWidth: '70px',
      textAlign: 'center',
      backdropFilter: 'blur(4px)',
    });

    const labelEl = document.createElement('div');
    labelEl.textContent = label;
    Object.assign(labelEl.style, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '0.45rem',
      color: COLORS.label,
      letterSpacing: '0.1rem',
      marginBottom: '4px',
    });

    const valueEl = document.createElement('div');
    valueEl.textContent = value;
    valueEl.className = 'hud-value';
    Object.assign(valueEl.style, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '1.1rem',
      fontWeight: '400',
      color,
      textShadow: `0 0 6px ${color}40`,
    });

    panel.appendChild(labelEl);
    panel.appendChild(valueEl);
    return panel;
  }

  private setValue(panel: HTMLDivElement, value: string): void {
    const valueEl = panel.querySelector('.hud-value') as HTMLDivElement;
    if (valueEl) valueEl.textContent = value;
  }
}
