const STORAGE_KEY = 'ar-shooter-best-score';

/** Sarcastic Cannes rank tiers based on score */
const RANKS: { minScore: number; title: string; emoji: string; color: string }[] = [
  { minScore: 20000, title: 'Jury President',            emoji: '\u{1F451}', color: '#FFD700' },
  { minScore: 12000, title: 'Chief Creative Officer',    emoji: '\u{1F3C6}', color: '#E8899A' },
  { minScore: 7000,  title: 'Executive Creative Director', emoji: '\u{1F377}', color: '#D8A0FF' },
  { minScore: 3500,  title: 'Creative Director',         emoji: '\u{1F334}', color: '#00f0ff' },
  { minScore: 1500,  title: 'Senior Creative',           emoji: '\u{270F}\u{FE0F}', color: '#C0C0C0' },
  { minScore: 500,   title: 'Junior Creative',           emoji: '\u{1F4CB}', color: '#CD7F32' },
  { minScore: 0,     title: 'Intern',                    emoji: '\u{2615}', color: '#888888' },
];

function getRank(score: number): typeof RANKS[0] {
  for (const rank of RANKS) {
    if (score >= rank.minScore) return rank;
  }
  return RANKS[RANKS.length - 1];
}

/**
 * Game Over overlay with Cannes satire rank system.
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
      overflow: 'hidden',
    });

    // Inject animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes go-entrance {
        from { opacity: 0; transform: translateY(25px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes rank-reveal {
        0% { opacity: 0; transform: scale(0.5); }
        60% { transform: scale(1.15); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes rank-glow {
        0%, 100% { filter: drop-shadow(0 0 8px var(--rank-color)); }
        50% { filter: drop-shadow(0 0 20px var(--rank-color)); }
      }
    `;
    document.head.appendChild(style);
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
    const elements: HTMLElement[] = [];

    const bestScore = this.getBestScore();
    const isNewBest = score > bestScore;
    if (isNewBest) this.saveBestScore(score);

    const rank = getRank(score);

    // --- Title ---
    const title = document.createElement('h1');
    title.textContent = 'GAME OVER';
    Object.assign(title.style, {
      fontSize: '2.5rem',
      fontWeight: '700',
      letterSpacing: '0.3rem',
      marginBottom: '1.5rem',
      color: '#ff0055',
      textShadow: '0 0 20px #ff0055',
    });
    elements.push(title);

    // --- Rank badge ---
    const rankBadge = document.createElement('div');
    Object.assign(rankBadge.style, {
      marginBottom: '1.5rem',
    });

    const rankEmoji = document.createElement('div');
    rankEmoji.textContent = rank.emoji;
    Object.assign(rankEmoji.style, {
      fontSize: '3.5rem',
      marginBottom: '0.4rem',
      animation: `rank-reveal 0.8s ease-out 0.6s both, rank-glow 2s ease-in-out 1.4s infinite`,
      '--rank-color': rank.color,
    } as Record<string, string>);

    const rankTitle = document.createElement('div');
    rankTitle.textContent = rank.title;
    Object.assign(rankTitle.style, {
      fontSize: '1.6rem',
      fontWeight: '700',
      color: rank.color,
      textShadow: `0 0 15px ${rank.color}`,
      letterSpacing: '0.1rem',
      animation: 'rank-reveal 0.8s ease-out 0.8s both',
    });

    const rankLabel = document.createElement('div');
    rankLabel.textContent = 'YOUR CANNES RANK';
    Object.assign(rankLabel.style, {
      fontSize: '0.65rem',
      color: '#666',
      letterSpacing: '0.2rem',
      marginTop: '0.3rem',
      animation: 'rank-reveal 0.8s ease-out 1.0s both',
    });

    rankBadge.appendChild(rankEmoji);
    rankBadge.appendChild(rankTitle);
    rankBadge.appendChild(rankLabel);
    elements.push(rankBadge);

    // --- Score ---
    const scoreEl = document.createElement('div');
    scoreEl.textContent = score.toLocaleString();
    Object.assign(scoreEl.style, {
      fontSize: '3.5rem',
      fontWeight: '700',
      background: `linear-gradient(90deg, ${rank.color}, #fff, ${rank.color})`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '0.3rem',
    });
    elements.push(scoreEl);

    const scoreLabel = document.createElement('div');
    scoreLabel.textContent = 'FINAL SCORE';
    Object.assign(scoreLabel.style, {
      fontSize: '0.7rem',
      color: '#888',
      letterSpacing: '0.15rem',
      marginBottom: '0.5rem',
    });
    elements.push(scoreLabel);

    // --- New best / personal best ---
    if (isNewBest) {
      const newBestEl = document.createElement('div');
      newBestEl.textContent = 'NEW BEST!';
      Object.assign(newBestEl.style, {
        fontSize: '1.1rem',
        fontWeight: '700',
        color: '#ffaa00',
        textShadow: '0 0 15px #ffaa00',
        marginBottom: '0.8rem',
        animation: 'pulse 1s ease-in-out infinite',
      });
      elements.push(newBestEl);
    } else {
      const bestEl = document.createElement('div');
      bestEl.textContent = `Best: ${bestScore.toLocaleString()}`;
      Object.assign(bestEl.style, {
        fontSize: '0.85rem',
        color: '#666',
        marginBottom: '0.8rem',
      });
      elements.push(bestEl);
    }

    // --- Combo ---
    const comboEl = document.createElement('div');
    comboEl.textContent = `Best Combo: ${maxCombo}x`;
    Object.assign(comboEl.style, {
      fontSize: '1rem',
      color: '#00f0ff',
      marginBottom: '2rem',
    });
    elements.push(comboEl);

    // --- Restart prompt ---
    const restart = document.createElement('div');
    restart.textContent = 'TAP TO PLAY AGAIN';
    Object.assign(restart.style, {
      fontSize: '1rem',
      color: '#ccc',
      letterSpacing: '0.1rem',
      animation: 'pulse 1.5s ease-in-out infinite',
    });
    elements.push(restart);

    // --- Apply staggered entrance ---
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      // Don't override rank badge's own animations
      if (el !== rankBadge) {
        el.style.opacity = '0';
        el.style.animation = `go-entrance 0.5s ease-out ${i * 0.1}s forwards` +
          (el === restart ? `, pulse 1.5s ease-in-out ${i * 0.1 + 0.5}s infinite` : '');
      }
      this.overlay.appendChild(el);
    }

    document.body.appendChild(this.overlay);
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
