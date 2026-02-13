import { LeaderboardScreen } from './LeaderboardScreen';

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

const RANK_TAGLINES: Record<string, string> = {
  'Jury President': 'Money well spent.',
  'Chief Creative Officer': 'The trophy shelf is full.',
  'Executive Creative Director': 'Ros\u00e9 all day.',
  'Creative Director': 'Living the dream.',
  'Senior Creative': 'Still waiting for that promotion.',
  'Junior Creative': 'Coffee runs build character.',
  'Intern': 'I peaked.',
};

function getRank(score: number): typeof RANKS[0] {
  for (const rank of RANKS) {
    if (score >= rank.minScore) return rank;
  }
  return RANKS[RANKS.length - 1];
}

/**
 * Game Over overlay with Cannes award ceremony envelope animation.
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
      background: 'rgba(0, 0, 0, 0.88)',
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
      @keyframes envelope-slide-in {
        from { opacity: 0; transform: translateY(80px) scale(0.9); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes flap-open {
        from { transform: rotateX(0deg); }
        to { transform: rotateX(-180deg); }
      }
      @keyframes card-slide-up {
        from { opacity: 0; transform: translateY(40px); }
        to { opacity: 1; transform: translateY(-60px); }
      }
      @keyframes envelope-glow {
        0%, 100% { box-shadow: 0 0 15px #FFD70060, 0 0 30px #FFD70030; }
        50% { box-shadow: 0 0 25px #FFD700, 0 0 50px #FFD70060; }
      }
      @keyframes rank-glow {
        0%, 100% { filter: drop-shadow(0 0 8px var(--rank-color)); }
        50% { filter: drop-shadow(0 0 20px var(--rank-color)); }
      }
      @keyframes confetti-celebrate {
        0% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 1; }
        100% { transform: translate(var(--cx), var(--cy)) scale(0.2) rotate(var(--cr)); opacity: 0; }
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

  private createEnvelopeSequence(rank: typeof RANKS[0]): HTMLElement {
    const container = document.createElement('div');
    Object.assign(container.style, {
      position: 'relative',
      width: '300px',
      height: '220px',
      marginBottom: '1.5rem',
    });

    // Envelope body
    const envelope = document.createElement('div');
    Object.assign(envelope.style, {
      position: 'absolute',
      bottom: '0',
      left: '0',
      width: '100%',
      height: '180px',
      background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
      borderRadius: '10px',
      border: '2px solid #B8860B',
      opacity: '0',
      animation: 'envelope-slide-in 0.6s ease-out 0.3s forwards, envelope-glow 2s ease-in-out 1.2s infinite',
    });

    // Flap (triangle on top of envelope)
    const flap = document.createElement('div');
    Object.assign(flap.style, {
      position: 'absolute',
      top: '-1px',
      left: '-2px',
      width: '0',
      height: '0',
      borderLeft: '152px solid transparent',
      borderRight: '152px solid transparent',
      borderTop: '80px solid #DAA520',
      transformOrigin: 'top center',
      perspective: '800px',
      animation: 'flap-open 0.7s ease-in-out 1.0s forwards',
      zIndex: '2',
    });
    envelope.appendChild(flap);

    // Seal (decorative circle on envelope)
    const seal = document.createElement('div');
    Object.assign(seal.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, #B8860B 0%, #8B6914 100%)',
      border: '2px solid #FFD700',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.4rem',
      zIndex: '1',
    });
    seal.textContent = '\u{1F3AC}'; // clapper board emoji
    envelope.appendChild(seal);

    // Card (slides up from envelope)
    const card = document.createElement('div');
    Object.assign(card.style, {
      position: 'absolute',
      bottom: '20px',
      left: '20px',
      width: 'calc(100% - 40px)',
      background: 'linear-gradient(180deg, #FFFEF0 0%, #F8F4E6 100%)',
      border: '2px solid #D4AF37',
      borderRadius: '8px',
      padding: '1.5rem 1rem',
      textAlign: 'center',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      opacity: '0',
      animation: 'card-slide-up 0.7s ease-out 1.8s forwards',
      zIndex: '3',
    });

    const cardEmoji = document.createElement('div');
    cardEmoji.textContent = rank.emoji;
    Object.assign(cardEmoji.style, {
      fontSize: '3.5rem',
      marginBottom: '0.4rem',
      filter: `drop-shadow(0 0 10px ${rank.color})`,
      '--rank-color': rank.color,
      animation: 'rank-glow 2s ease-in-out 2.6s infinite',
    } as Record<string, string>);

    const cardTitle = document.createElement('div');
    cardTitle.textContent = rank.title;
    Object.assign(cardTitle.style, {
      fontSize: '1.3rem',
      fontWeight: '700',
      color: rank.color,
      textShadow: `0 0 8px ${rank.color}80`,
      letterSpacing: '0.05rem',
      marginBottom: '0.2rem',
    });

    const cardLabel = document.createElement('div');
    cardLabel.textContent = 'YOUR CANNES RANK';
    Object.assign(cardLabel.style, {
      fontSize: '0.55rem',
      color: '#999',
      letterSpacing: '0.15rem',
    });

    card.appendChild(cardEmoji);
    card.appendChild(cardTitle);
    card.appendChild(cardLabel);

    container.appendChild(envelope);
    container.appendChild(card);

    return container;
  }

  private spawnCelebrationConfetti(): void {
    const emojis = ['\u{1F3C6}', '\u2B50', '\u{1F4B0}', '\u{1F389}', '\u2728', '\u{1F451}'];
    const container = document.createElement('div');
    Object.assign(container.style, {
      position: 'fixed',
      top: '45%',
      left: '50%',
      pointerEvents: 'none',
      zIndex: '70',
    });

    for (let i = 0; i < 24; i++) {
      const p = document.createElement('div');
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      const angle = (Math.PI * 2 * i) / 24;
      const dist = 120 + Math.random() * 80;
      const cx = Math.cos(angle) * dist;
      const cy = Math.sin(angle) * dist;
      const rot = Math.random() * 720 - 360;

      p.style.cssText = `
        position: absolute;
        font-size: ${1.2 + Math.random() * 1}rem;
        --cx: ${cx}px;
        --cy: ${cy}px;
        --cr: ${rot}deg;
        animation: confetti-celebrate 1.3s ease-out forwards;
      `;
      container.appendChild(p);
    }

    document.body.appendChild(container);
    setTimeout(() => container.remove(), 1400);
  }

  private async generateShareImage(
    score: number,
    maxCombo: number,
    rank: typeof RANKS[0]
  ): Promise<Blob> {
    const size = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Wait for font
    try {
      await document.fonts.load('80px "Press Start 2P"');
    } catch {
      // Font may not be available, fallback handled below
    }

    const fontFamily = '"Press Start 2P", monospace';

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, size);
    bg.addColorStop(0, '#1a1a1a');
    bg.addColorStop(0.5, '#2a1a1a');
    bg.addColorStop(1, '#1a1510');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);

    // Gold border
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 6;
    ctx.strokeRect(24, 24, size - 48, size - 48);
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, size - 72, size - 72);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 64px ${fontFamily}`;
    ctx.fillText('THE BIG LIE.', size / 2, 160);

    // Subtitle
    ctx.fillStyle = '#E8899A';
    ctx.font = `24px ${fontFamily}`;
    ctx.fillText('Cannes Lions Edition', size / 2, 230);

    // Rank emoji
    ctx.font = '200px Arial, sans-serif';
    ctx.fillText(rank.emoji, size / 2, 430);

    // Rank title
    ctx.fillStyle = rank.color;
    ctx.font = `bold 36px ${fontFamily}`;
    this.wrapText(ctx, rank.title, size / 2, 600, size - 120, 44);

    // Score
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 48px ${fontFamily}`;
    ctx.fillText(`${score.toLocaleString()}`, size / 2, 710);
    ctx.fillStyle = '#888';
    ctx.font = `20px ${fontFamily}`;
    ctx.fillText('FINAL SCORE', size / 2, 755);

    // Combo
    ctx.fillStyle = '#00DDFF';
    ctx.font = `28px ${fontFamily}`;
    ctx.fillText(`${maxCombo}x MAX COMBO`, size / 2, 820);

    // Tagline
    const tagline = RANK_TAGLINES[rank.title] ?? 'Well played.';
    ctx.fillStyle = '#aaaaaa';
    ctx.font = 'italic 26px Georgia, serif';
    ctx.fillText(`"${tagline}"`, size / 2, 920);

    // Branding
    ctx.fillStyle = '#444444';
    ctx.font = `16px ${fontFamily}`;
    ctx.fillText('THE BIG LIE. \u{1F3AC}', size / 2, 1020);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to generate image'));
      }, 'image/png');
    });
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
    const metrics = ctx.measureText(text);
    if (metrics.width <= maxWidth) {
      ctx.fillText(text, x, y);
      return;
    }
    const words = text.split(' ');
    let line = '';
    let cy = y;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, cy);
        line = word;
        cy += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, cy);
  }

  private async handleShare(score: number, maxCombo: number, rank: typeof RANKS[0]): Promise<void> {
    try {
      const blob = await this.generateShareImage(score, maxCombo, rank);
      const file = new File([blob], 'the-big-lie-score.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'The Big Lie. - AR Shooter',
          text: `I scored ${score.toLocaleString()} as ${rank.title}! ${rank.emoji}`,
          files: [file],
        });
      } else {
        // Desktop fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'the-big-lie-score.png';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
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
      fontSize: '2.2rem',
      fontWeight: '700',
      letterSpacing: '0.3rem',
      marginBottom: '1rem',
      color: '#ff0055',
      textShadow: '0 0 20px #ff0055',
    });
    elements.push(title);

    // --- Envelope sequence (replaces old rank badge) ---
    const envelopeEl = this.createEnvelopeSequence(rank);
    elements.push(envelopeEl);

    // --- Score ---
    const scoreEl = document.createElement('div');
    scoreEl.textContent = score.toLocaleString();
    Object.assign(scoreEl.style, {
      fontSize: '3rem',
      fontWeight: '700',
      background: `linear-gradient(90deg, ${rank.color}, #fff, ${rank.color})`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '0.2rem',
    });
    elements.push(scoreEl);

    const scoreLabel = document.createElement('div');
    scoreLabel.textContent = 'FINAL SCORE';
    Object.assign(scoreLabel.style, {
      fontSize: '0.65rem',
      color: '#888',
      letterSpacing: '0.15rem',
      marginBottom: '0.4rem',
    });
    elements.push(scoreLabel);

    // --- New best / personal best ---
    if (isNewBest) {
      const newBestEl = document.createElement('div');
      newBestEl.textContent = 'NEW BEST!';
      Object.assign(newBestEl.style, {
        fontSize: '1rem',
        fontWeight: '700',
        color: '#ffaa00',
        textShadow: '0 0 15px #ffaa00',
        marginBottom: '0.6rem',
        animation: 'pulse 1s ease-in-out infinite',
      });
      elements.push(newBestEl);
      // Celebration confetti after card reveal
      setTimeout(() => this.spawnCelebrationConfetti(), 2500);
    } else {
      const bestEl = document.createElement('div');
      bestEl.textContent = `Best: ${bestScore.toLocaleString()}`;
      Object.assign(bestEl.style, {
        fontSize: '0.8rem',
        color: '#666',
        marginBottom: '0.6rem',
      });
      elements.push(bestEl);
    }

    // --- Combo ---
    const comboEl = document.createElement('div');
    comboEl.textContent = `Best Combo: ${maxCombo}x`;
    Object.assign(comboEl.style, {
      fontSize: '0.9rem',
      color: '#00f0ff',
      marginBottom: '1.2rem',
    });
    elements.push(comboEl);

    // --- Share button ---
    const shareBtn = document.createElement('button');
    shareBtn.textContent = 'SHARE YOUR RANK';
    Object.assign(shareBtn.style, {
      fontSize: '0.8rem',
      fontWeight: '700',
      color: '#000',
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      border: '2px solid #FFD700',
      borderRadius: '8px',
      padding: '12px 24px',
      marginBottom: '1rem',
      cursor: 'pointer',
      letterSpacing: '0.1rem',
      boxShadow: '0 4px 16px rgba(255, 215, 0, 0.3)',
      transition: 'transform 0.1s ease',
      pointerEvents: 'auto',
    });
    // Stop propagation on all events to prevent game restart
    shareBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      shareBtn.style.transform = 'scale(0.95)';
    });
    shareBtn.addEventListener('pointerup', (e) => {
      e.stopPropagation();
      shareBtn.style.transform = 'scale(1)';
      this.handleShare(score, maxCombo, rank);
    });
    shareBtn.addEventListener('click', (e) => e.stopPropagation());
    elements.push(shareBtn);

    // --- Leaderboard button ---
    const lbBtn = document.createElement('button');
    lbBtn.textContent = 'HIGH SCORES';
    Object.assign(lbBtn.style, {
      fontSize: '0.8rem',
      fontWeight: '700',
      color: '#00f0ff',
      background: 'transparent',
      border: '2px solid #00f0ff',
      borderRadius: '8px',
      padding: '12px 24px',
      marginBottom: '1rem',
      cursor: 'pointer',
      letterSpacing: '0.1rem',
      boxShadow: '0 4px 16px rgba(0, 240, 255, 0.15)',
      transition: 'transform 0.1s ease',
      pointerEvents: 'auto',
    });
    lbBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      lbBtn.style.transform = 'scale(0.95)';
    });
    lbBtn.addEventListener('pointerup', (e) => {
      e.stopPropagation();
      lbBtn.style.transform = 'scale(1)';
      const lb = new LeaderboardScreen();
      lb.show(score, maxCombo, rank.title);
    });
    lbBtn.addEventListener('click', (e) => e.stopPropagation());
    elements.push(lbBtn);

    // --- Restart prompt ---
    const restart = document.createElement('div');
    restart.textContent = 'TAP TO PLAY AGAIN';
    Object.assign(restart.style, {
      fontSize: '0.9rem',
      color: '#ccc',
      letterSpacing: '0.1rem',
    });
    elements.push(restart);

    // --- Apply staggered entrance ---
    // Envelope has its own internal animation timings
    // Other elements start appearing after card is revealed (~2.6s)
    const ENVELOPE_DONE_DELAY = 2.6;
    let statIdx = 0;

    for (const el of elements) {
      if (el === envelopeEl) {
        // Envelope: slide in via internal CSS, just append
        this.overlay.appendChild(el);
      } else if (el === title) {
        // Title enters immediately
        el.style.opacity = '0';
        el.style.animation = 'go-entrance 0.5s ease-out 0.1s forwards';
        this.overlay.appendChild(el);
      } else {
        // Stats, share, restart: stagger after envelope opens
        const delay = ENVELOPE_DONE_DELAY + statIdx * 0.12;
        el.style.opacity = '0';
        el.style.animation = `go-entrance 0.5s ease-out ${delay}s forwards`;
        if (el === restart) {
          el.style.animation += `, pulse 1.5s ease-in-out ${delay + 0.5}s infinite`;
        }
        this.overlay.appendChild(el);
        statIdx++;
      }
    }

    document.body.appendChild(this.overlay);
    requestAnimationFrame(() => {
      this.overlay.style.opacity = '1';
    });

    // Auto-open leaderboard name input after envelope animation
    setTimeout(() => {
      const lb = new LeaderboardScreen();
      lb.show(score, maxCombo, rank.title);
    }, 3200);
  }

  hide(): void {
    this.overlay.style.opacity = '0';
    setTimeout(() => this.overlay.remove(), 500);
  }

  isVisible(): boolean {
    return this.overlay.parentElement !== null;
  }
}
