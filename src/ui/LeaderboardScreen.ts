import { isLeaderboardEnabled } from '../api/supabase';
import { submitScore, getTopScores, type LeaderboardEntry } from '../api/leaderboard';

const FONT = "'Press Start 2P', monospace";
const TOP_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']; // gold, silver, bronze

/**
 * Arcade-style leaderboard overlay.
 * Two phases: name input → high scores list.
 */
export class LeaderboardScreen {
  private overlay: HTMLDivElement;
  private onClose: (() => void) | null = null;

  constructor() {
    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '65',
      fontFamily: FONT,
      color: '#fff',
      textAlign: 'center',
      padding: '1.5rem',
      opacity: '0',
      transition: 'opacity 0.3s ease',
    });

    // Block all events from reaching game layer
    this.overlay.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.overlay.addEventListener('pointerup', (e) => e.stopPropagation());
    this.overlay.addEventListener('click', (e) => e.stopPropagation());

    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes cursor-blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
      @keyframes lb-entrance {
        from { opacity: 0; transform: translateY(15px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes highlight-pulse {
        0%, 100% { color: #00f0ff; }
        50% { color: #ffffff; }
      }
      .lb-input:focus {
        outline: none;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Show the leaderboard with name input.
   */
  show(score: number, maxCombo: number, rankTitle: string, onClose?: () => void): void {
    this.onClose = onClose ?? null;

    if (!isLeaderboardEnabled()) {
      this.showDisabledMessage();
      return;
    }

    this.showNameInput(score, maxCombo, rankTitle);
  }

  hide(): void {
    this.overlay.style.opacity = '0';
    setTimeout(() => this.overlay.remove(), 300);
    this.onClose?.();
  }

  private showDisabledMessage(): void {
    this.overlay.innerHTML = '';

    const msg = document.createElement('div');
    msg.textContent = 'LEADERBOARD OFFLINE';
    Object.assign(msg.style, {
      fontSize: '1.2rem',
      color: '#ff4444',
      marginBottom: '1rem',
    });

    const sub = document.createElement('div');
    sub.textContent = 'Supabase not configured';
    Object.assign(sub.style, {
      fontSize: '0.6rem',
      color: '#666',
      marginBottom: '2rem',
    });

    const closeBtn = this.createButton('CLOSE', '#666', () => this.hide());
    closeBtn.style.border = '2px solid #666';

    this.overlay.appendChild(msg);
    this.overlay.appendChild(sub);
    this.overlay.appendChild(closeBtn);

    document.body.appendChild(this.overlay);
    requestAnimationFrame(() => { this.overlay.style.opacity = '1'; });
  }

  private showNameInput(score: number, maxCombo: number, rankTitle: string): void {
    this.overlay.innerHTML = '';

    // Title
    const title = document.createElement('div');
    title.textContent = 'ENTER YOUR NAME';
    Object.assign(title.style, {
      fontSize: '1.1rem',
      color: '#00f0ff',
      textShadow: '0 0 15px #00f0ff',
      marginBottom: '1.5rem',
      animation: 'lb-entrance 0.4s ease-out',
    });

    // Input wrapper (arcade look)
    const inputWrap = document.createElement('div');
    Object.assign(inputWrap.style, {
      position: 'relative',
      marginBottom: '1.5rem',
      animation: 'lb-entrance 0.4s ease-out 0.1s both',
    });

    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 10;
    input.placeholder = 'MAX';
    input.autocomplete = 'off';
    input.className = 'lb-input';

    // Allow only first name - strip spaces on input
    input.addEventListener('input', () => {
      const cursor = input.selectionStart ?? input.value.length;
      const filtered = input.value.replace(/\s/g, '');
      if (filtered !== input.value) {
        input.value = filtered;
        input.setSelectionRange(Math.max(0, cursor - 1), Math.max(0, cursor - 1));
      }
    });
    Object.assign(input.style, {
      fontFamily: FONT,
      fontSize: '1.4rem',
      color: '#00ff88',
      background: 'rgba(0, 255, 136, 0.08)',
      border: '2px solid #00ff88',
      borderRadius: '6px',
      padding: '12px 20px',
      textAlign: 'center',
      width: '260px',
      textTransform: 'uppercase',
      caretColor: '#00ff88',
      letterSpacing: '0.15rem',
    });

    // Score preview
    const preview = document.createElement('div');
    Object.assign(preview.style, {
      fontSize: '0.6rem',
      color: '#888',
      marginBottom: '0.4rem',
      animation: 'lb-entrance 0.4s ease-out 0.2s both',
    });
    preview.innerHTML = `SCORE: <span style="color:#fff">${score.toLocaleString()}</span> &middot; RANK: <span style="color:#FFD700">${rankTitle}</span>`;

    // Error message (hidden)
    const errorEl = document.createElement('div');
    Object.assign(errorEl.style, {
      fontSize: '0.55rem',
      color: '#ff4444',
      height: '1.2rem',
      marginBottom: '0.5rem',
    });

    // Submit button
    const submitBtn = this.createButton('SUBMIT', '#FFD700', async () => {
      const name = input.value.trim().split(/\s/)[0];
      if (!name) {
        errorEl.textContent = 'ENTER A NAME FIRST';
        return;
      }
      errorEl.textContent = '';
      submitBtn.textContent = 'SUBMITTING...';
      (submitBtn as HTMLButtonElement).disabled = true;

      const ok = await submitScore(name, score, maxCombo, rankTitle);
      if (ok) {
        this.showHighScores(score);
      } else {
        errorEl.textContent = 'SUBMIT FAILED - TRY AGAIN';
        submitBtn.textContent = 'SUBMIT';
        (submitBtn as HTMLButtonElement).disabled = false;
      }
    });
    submitBtn.style.animation = 'lb-entrance 0.4s ease-out 0.3s both';

    // Skip button
    const skipBtn = document.createElement('div');
    skipBtn.textContent = 'SKIP';
    Object.assign(skipBtn.style, {
      fontSize: '0.6rem',
      color: '#555',
      marginTop: '1rem',
      cursor: 'pointer',
      animation: 'lb-entrance 0.4s ease-out 0.4s both',
    });
    skipBtn.addEventListener('pointerup', () => this.hide());

    inputWrap.appendChild(input);
    this.overlay.appendChild(title);
    this.overlay.appendChild(inputWrap);
    this.overlay.appendChild(preview);
    this.overlay.appendChild(errorEl);
    this.overlay.appendChild(submitBtn);
    this.overlay.appendChild(skipBtn);

    document.body.appendChild(this.overlay);
    requestAnimationFrame(() => {
      this.overlay.style.opacity = '1';
      input.focus();
    });
  }

  private async showHighScores(playerScore: number): Promise<void> {
    this.overlay.innerHTML = '';

    // Loading
    const loading = document.createElement('div');
    loading.textContent = 'LOADING...';
    Object.assign(loading.style, {
      fontSize: '0.8rem',
      color: '#00f0ff',
      animation: 'cursor-blink 0.8s ease-in-out infinite',
    });
    this.overlay.appendChild(loading);

    const entries = await getTopScores(20);
    this.overlay.innerHTML = '';

    // Title
    const title = document.createElement('div');
    title.textContent = 'HIGH SCORES';
    Object.assign(title.style, {
      fontSize: '1.2rem',
      color: '#FFD700',
      textShadow: '0 0 15px #FFD700',
      marginBottom: '1.2rem',
      animation: 'lb-entrance 0.4s ease-out',
    });
    this.overlay.appendChild(title);

    if (entries.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'NO SCORES YET';
      Object.assign(empty.style, {
        fontSize: '0.7rem',
        color: '#555',
        marginBottom: '2rem',
      });
      this.overlay.appendChild(empty);
    } else {
      // Scrollable list
      const list = document.createElement('div');
      Object.assign(list.style, {
        width: '100%',
        maxWidth: '420px',
        maxHeight: '55vh',
        overflowY: 'auto',
        marginBottom: '1.2rem',
      });

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const row = this.createRow(i + 1, entry, entry.score === playerScore);
        row.style.animation = `lb-entrance 0.3s ease-out ${i * 0.05}s both`;
        list.appendChild(row);
      }

      this.overlay.appendChild(list);
    }

    // Close button
    const closeBtn = this.createButton('CLOSE', '#00f0ff', () => this.hide());
    closeBtn.style.border = '2px solid #00f0ff';
    closeBtn.style.color = '#00f0ff';
    closeBtn.style.background = 'transparent';
    closeBtn.style.animation = `lb-entrance 0.4s ease-out ${entries.length * 0.05 + 0.2}s both`;
    this.overlay.appendChild(closeBtn);
  }

  private createRow(rank: number, entry: LeaderboardEntry, isPlayer: boolean): HTMLDivElement {
    const row = document.createElement('div');
    Object.assign(row.style, {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 12px',
      borderBottom: '1px solid #222',
      fontSize: '0.6rem',
      color: isPlayer ? '#00f0ff' : (rank <= 3 ? TOP_COLORS[rank - 1] : '#ccc'),
      animation: isPlayer ? 'highlight-pulse 1.5s ease-in-out infinite' : 'none',
    });

    // Rank + Name
    const left = document.createElement('span');
    const rankStr = `#${rank}`.padEnd(4);
    const nameStr = entry.name.padEnd(12, '\u00B7');
    left.textContent = `${rankStr}${nameStr}`;
    Object.assign(left.style, {
      fontFamily: FONT,
      letterSpacing: '0.05rem',
    });

    // Score
    const right = document.createElement('span');
    right.textContent = entry.score.toLocaleString();
    Object.assign(right.style, {
      fontFamily: FONT,
      letterSpacing: '0.05rem',
      textAlign: 'right',
      minWidth: '80px',
    });

    row.appendChild(left);
    row.appendChild(right);

    return row;
  }

  private createButton(text: string, color: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = text;
    Object.assign(btn.style, {
      fontFamily: FONT,
      fontSize: '0.75rem',
      fontWeight: '700',
      color: '#000',
      background: `linear-gradient(135deg, ${color}, ${color}dd)`,
      border: `2px solid ${color}`,
      borderRadius: '8px',
      padding: '12px 28px',
      cursor: 'pointer',
      letterSpacing: '0.1rem',
      boxShadow: `0 4px 12px ${color}40`,
      transition: 'transform 0.1s ease',
      pointerEvents: 'auto',
    });
    btn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      btn.style.transform = 'scale(0.95)';
    });
    btn.addEventListener('pointerup', (e) => {
      e.stopPropagation();
      btn.style.transform = 'scale(1)';
      onClick();
    });
    btn.addEventListener('click', (e) => e.stopPropagation());
    return btn;
  }
}
