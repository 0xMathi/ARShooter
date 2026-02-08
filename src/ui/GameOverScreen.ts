const STORAGE_KEY = 'ar-shooter-best-score';

/**
 * Game Over overlay showing final stats and restart option.
 */
export class GameOverScreen {
  private overlay: HTMLDivElement;

  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'game-over-screen';
    Object.assign(this.overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '60',
      fontFamily: "'Inter', system-ui, sans-serif",
      color: '#fff',
      textAlign: 'center',
      padding: '2rem',
      opacity: '0',
      transition: 'opacity 0.5s ease',
    });
  }

  private getBestScore(): number {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : 0;
  }

  private saveBestScore(score: number): void {
    localStorage.setItem(STORAGE_KEY, score.toString());
  }

  show(score: number, maxCombo: number): void {
    this.overlay.innerHTML = '';

    const bestScore = this.getBestScore();
    const isNewBest = score > bestScore;
    if (isNewBest) this.saveBestScore(score);

    const title = document.createElement('h1');
    title.textContent = 'GAME OVER';
    Object.assign(title.style, {
      fontSize: '3rem',
      fontWeight: '700',
      letterSpacing: '0.3rem',
      marginBottom: '2rem',
      color: '#ff0055',
      textShadow: '0 0 20px #ff0055',
    });

    const scoreEl = document.createElement('div');
    scoreEl.textContent = score.toLocaleString();
    Object.assign(scoreEl.style, {
      fontSize: '4rem',
      fontWeight: '700',
      background: 'linear-gradient(90deg, #00f0ff, #ff00e0)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '0.5rem',
    });

    const scoreLabel = document.createElement('div');
    scoreLabel.textContent = 'FINAL SCORE';
    Object.assign(scoreLabel.style, {
      fontSize: '0.8rem',
      color: '#888',
      letterSpacing: '0.15rem',
      marginBottom: '0.5rem',
    });

    // New best indicator
    if (isNewBest) {
      const newBestEl = document.createElement('div');
      newBestEl.textContent = 'NEW BEST!';
      Object.assign(newBestEl.style, {
        fontSize: '1.1rem',
        fontWeight: '700',
        color: '#ffaa00',
        textShadow: '0 0 15px #ffaa00',
        marginBottom: '1rem',
        animation: 'pulse 1s ease-in-out infinite',
      });
      this.overlay.appendChild(title);
      this.overlay.appendChild(scoreEl);
      this.overlay.appendChild(scoreLabel);
      this.overlay.appendChild(newBestEl);
    } else {
      const bestEl = document.createElement('div');
      bestEl.textContent = `Best: ${(isNewBest ? score : bestScore).toLocaleString()}`;
      Object.assign(bestEl.style, {
        fontSize: '0.9rem',
        color: '#666',
        marginBottom: '1rem',
      });
      this.overlay.appendChild(title);
      this.overlay.appendChild(scoreEl);
      this.overlay.appendChild(scoreLabel);
      this.overlay.appendChild(bestEl);
    }

    const comboEl = document.createElement('div');
    comboEl.textContent = `Best Combo: ${maxCombo}x`;
    Object.assign(comboEl.style, {
      fontSize: '1.2rem',
      color: '#00f0ff',
      marginBottom: '2.5rem',
    });

    const restart = document.createElement('div');
    restart.textContent = 'TAP TO PLAY AGAIN';
    Object.assign(restart.style, {
      fontSize: '1rem',
      color: '#ccc',
      letterSpacing: '0.1rem',
      animation: 'pulse 1.5s ease-in-out infinite',
    });

    this.overlay.appendChild(comboEl);
    this.overlay.appendChild(restart);

    document.body.appendChild(this.overlay);
    // Trigger fade-in
    requestAnimationFrame(() => {
      this.overlay.style.opacity = '1';
    });
  }

  hide(): void {
    this.overlay.style.opacity = '0';
    setTimeout(() => this.overlay.remove(), 500);
  }

  isVisible(): boolean {
    return this.overlay.parentElement !== null;
  }
}
