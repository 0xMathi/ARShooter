/**
 * Start screen overlay.
 * Full NES/arcade title screen aesthetic — Rad Gravity / Final Fight / Mega Man style.
 * Pixel stars, 3D block title, scanlines, trophy sprite, blinking "PRESS START".
 */

const FONT = "'Press Start 2P', monospace";

const CONFETTI_EMOJIS = [
  '\u{1F3C6}', // trophy
  '\u{1F377}', // wine
  '\u{1F334}', // palm
  '\u{2B50}',  // star
  '\u{1F981}', // lion
];

export class StartScreen {
  private overlay: HTMLDivElement;

  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'start-screen';
    Object.assign(this.overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      background: '#0a0a18',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '50',
      fontFamily: FONT,
      color: '#fff',
      textAlign: 'center',
      padding: '1.5rem',
      overflow: 'hidden',
    });

    // --- Inject animations ---
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.15); opacity: 1; }
      }
      @keyframes confetti-fall {
        0% { transform: translateY(-5vh) rotate(0deg); opacity: 0; }
        10% { opacity: 0.6; }
        90% { opacity: 0.4; }
        100% { transform: translateY(105vh) rotate(360deg); opacity: 0; }
      }
      @keyframes entrance-up {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes star-twinkle-start {
        0%, 100% { opacity: 0.15; }
        50% { opacity: 1; }
      }
      @keyframes blink-press-start {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
      @keyframes title-glow {
        0%, 100% { filter: brightness(1) drop-shadow(0 0 10px rgba(255,68,102,0.3)); }
        50% { filter: brightness(1.2) drop-shadow(0 0 25px rgba(255,68,102,0.6)); }
      }
      @keyframes trophy-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
      @keyframes sprite-entrance {
        from { opacity: 0; transform: translateX(60px) rotate(-10deg); }
        to { opacity: 1; transform: translateX(0) rotate(0deg); }
      }
    `;
    document.head.appendChild(style);

    // --- Pixel star field ---
    this.spawnStars();

    // --- Scanline overlay ---
    const scanlines = document.createElement('div');
    Object.assign(scanlines.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)',
      pointerEvents: 'none',
      zIndex: '2',
    });
    this.overlay.appendChild(scanlines);

    // --- Confetti rain layer (subtle, behind content) ---
    this.spawnConfetti();

    // --- Content container ---
    const content = document.createElement('div');
    Object.assign(content.style, {
      position: 'relative',
      zIndex: '3',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    });

    const elements: HTMLElement[] = [];

    // ─── Top decorative line ───
    const topLine = document.createElement('div');
    topLine.textContent = '\u2500\u2500\u2500  \u2605  \u2500\u2500\u2500';
    Object.assign(topLine.style, {
      fontSize: '0.6rem',
      color: '#FFD700',
      letterSpacing: '0.2rem',
      marginBottom: '1rem',
      textShadow: '0 0 6px rgba(255,215,0,0.5)',
    });
    elements.push(topLine);

    // ─── Main title: THE BIG LIE. ───
    // Two-line layout like classic arcade titles
    const titleWrap = document.createElement('div');
    Object.assign(titleWrap.style, {
      marginBottom: '0.4rem',
      animation: 'title-glow 4s ease-in-out infinite',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    });

    const titleSmall = document.createElement('div');
    titleSmall.textContent = 'THE';
    Object.assign(titleSmall.style, {
      fontSize: 'clamp(0.8rem, 3vw, 1.2rem)',
      color: '#ffccdd',
      letterSpacing: '0.5rem',
      marginBottom: '0.2rem',
      textShadow: '1px 1px 0 #aa3355, 2px 2px 0 #662233',
      textAlign: 'center',
    });

    const titleBig = document.createElement('div');
    titleBig.textContent = 'BIG LIE';
    Object.assign(titleBig.style, {
      fontSize: 'clamp(2.2rem, 10vw, 4.5rem)',
      color: '#ff4466',
      lineHeight: '1',
      letterSpacing: '0.1rem',
      textAlign: 'center',
      textShadow: `
        3px 3px 0 #cc1133,
        6px 6px 0 #991122,
        9px 9px 0 #661111,
        12px 12px 0 #330808,
        0 0 30px rgba(255,68,102,0.5)
      `,
    });

    titleWrap.appendChild(titleSmall);
    titleWrap.appendChild(titleBig);
    elements.push(titleWrap);

    // ─── Subtitle ───
    const subtitle = document.createElement('div');
    subtitle.textContent = 'CANNES LIONS EDITION';
    Object.assign(subtitle.style, {
      fontSize: 'clamp(0.35rem, 1.5vw, 0.5rem)',
      color: '#FFD700',
      letterSpacing: '0.3rem',
      textShadow: '0 0 10px rgba(255,215,0,0.5)',
      marginBottom: '1.5rem',
    });
    elements.push(subtitle);

    // ─── Pistol hand icon (main "character sprite") ───
    const pistol = document.createElement('div');
    pistol.textContent = '\u{1F449}';
    Object.assign(pistol.style, {
      fontSize: 'clamp(4rem, 14vw, 6rem)',
      filter: 'drop-shadow(0 6px 12px rgba(0,240,255,0.3))',
      marginBottom: '1rem',
    });
    elements.push(pistol);

    // ─── Target sprites row ───
    const spriteRow = document.createElement('div');
    Object.assign(spriteRow.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.2rem',
      marginBottom: '1.2rem',
    });

    const trophyL = document.createElement('div');
    trophyL.textContent = '\u{1F3C6}';
    Object.assign(trophyL.style, {
      fontSize: 'clamp(2rem, 6vw, 3rem)',
      animation: 'trophy-float 2.5s ease-in-out infinite',
      filter: 'drop-shadow(0 4px 8px rgba(255,215,0,0.4))',
    });

    const roseR = document.createElement('div');
    roseR.textContent = '\u{1F377}';
    Object.assign(roseR.style, {
      fontSize: 'clamp(2rem, 6vw, 3rem)',
      animation: 'trophy-float 2.5s ease-in-out 0.5s infinite',
      filter: 'drop-shadow(0 4px 8px rgba(232,137,154,0.4))',
    });

    spriteRow.appendChild(trophyL);
    spriteRow.appendChild(roseR);
    elements.push(spriteRow);

    // ─── "SHOOT THE AWARDS" tagline ───
    const tagline = document.createElement('div');
    tagline.textContent = '\u00AB SHOOT THE AWARDS \u00BB';
    Object.assign(tagline.style, {
      fontSize: 'clamp(0.4rem, 1.8vw, 0.6rem)',
      color: '#00f0ff',
      letterSpacing: '0.2rem',
      textShadow: '0 0 8px rgba(0,240,255,0.5)',
      marginBottom: '1.5rem',
    });
    elements.push(tagline);

    // ─── Tutorial box ───
    const tutorial = document.createElement('div');
    Object.assign(tutorial.style, {
      border: '2px solid #333355',
      borderRadius: '0',
      padding: '0.8rem 1.2rem',
      marginBottom: '1.5rem',
      maxWidth: '320px',
      width: '85vw',
      background: 'rgba(10, 10, 30, 0.6)',
    });

    const tutTitle = document.createElement('div');
    tutTitle.textContent = 'HOW TO PLAY';
    Object.assign(tutTitle.style, {
      fontSize: 'clamp(0.4rem, 1.5vw, 0.55rem)',
      color: '#FFD700',
      letterSpacing: '0.15rem',
      marginBottom: '0.6rem',
      textShadow: '0 0 6px rgba(255,215,0,0.3)',
    });

    const steps = [
      ['1.', 'FORM A PISTOL WITH YOUR HAND'],
      ['2.', 'AIM AT THE TROPHIES'],
      ['3.', 'PULL THUMB TO SHOOT'],
    ];

    steps.forEach(([num, text]) => {
      const row = document.createElement('div');
      Object.assign(row.style, {
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '0.3rem',
        fontSize: 'clamp(0.3rem, 1.2vw, 0.4rem)',
        color: '#8888aa',
        letterSpacing: '0.05rem',
      });

      const numEl = document.createElement('span');
      numEl.textContent = num;
      numEl.style.color = '#00f0ff';

      const textEl = document.createElement('span');
      textEl.textContent = text;

      row.appendChild(numEl);
      row.appendChild(textEl);
      tutorial.appendChild(row);
    });

    tutorial.insertBefore(tutTitle, tutorial.firstChild);
    elements.push(tutorial);

    // ─── Blinking "PRESS START" ───
    const pressStart = document.createElement('div');
    pressStart.textContent = '\u25B6  START  \u25C0';
    Object.assign(pressStart.style, {
      fontSize: 'clamp(0.5rem, 2.2vw, 0.7rem)',
      color: '#ffffff',
      letterSpacing: '0.2rem',
      textShadow: '0 0 8px rgba(255,255,255,0.5)',
    });
    elements.push(pressStart);

    // ─── Bottom decorative line ───
    const botLine = document.createElement('div');
    botLine.textContent = '\u00A9 2025  THE BIG LIE  ALL RIGHTS FABRICATED';
    Object.assign(botLine.style, {
      fontSize: '0.3rem',
      color: '#333355',
      letterSpacing: '0.1rem',
      position: 'absolute',
      bottom: '-3rem',
    });
    elements.push(botLine);

    // Apply entrance animation with staggered delays
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      el.style.opacity = '0';
      el.style.animation = `entrance-up 0.5s ease-out ${i * 0.1}s forwards` +
        (el.style.animation ? `, ${el.style.animation}` : '');
      content.appendChild(el);
    }

    // After entrance: blink "PRESS START"
    const pulseDelay = elements.length * 0.1 + 0.6;
    setTimeout(() => {
      pressStart.style.animation = 'blink-press-start 1s step-end infinite';
    }, pulseDelay * 1000);

    // After entrance: float sprite
    setTimeout(() => {
      pistol.style.animation = 'sprite-entrance 0.6s ease-out forwards';
      setTimeout(() => {
        pistol.style.animation = 'pulse 2s ease-in-out infinite';
      }, 600);
    }, 300);

    this.overlay.appendChild(content);
    document.body.appendChild(this.overlay);
  }

  private spawnStars(): void {
    const container = document.createElement('div');
    Object.assign(container.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      zIndex: '1',
      pointerEvents: 'none',
    });

    for (let i = 0; i < 80; i++) {
      const star = document.createElement('div');
      const size = Math.random() < 0.25 ? 3 : Math.random() < 0.55 ? 2 : 1;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const duration = 1.5 + Math.random() * 3;
      const delay = Math.random() * duration;
      const brightness = Math.random() < 0.15 ? '#00f0ff' : Math.random() < 0.3 ? '#FFD700' : '#ffffff';

      Object.assign(star.style, {
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: `${size}px`,
        height: `${size}px`,
        background: brightness,
        borderRadius: size > 2 ? '0' : '50%',
        animation: `star-twinkle-start ${duration}s ease-in-out ${delay}s infinite`,
        boxShadow: size > 2 ? `0 0 4px ${brightness}` : 'none',
      });
      container.appendChild(star);
    }

    this.overlay.appendChild(container);
  }

  private spawnConfetti(): void {
    const container = document.createElement('div');
    Object.assign(container.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '1',
    });

    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      particle.textContent = CONFETTI_EMOJIS[Math.floor(Math.random() * CONFETTI_EMOJIS.length)];
      const size = 0.7 + Math.random() * 0.8;
      const left = Math.random() * 100;
      const duration = 6 + Math.random() * 8;
      const delay = Math.random() * duration;

      Object.assign(particle.style, {
        position: 'absolute',
        left: `${left}%`,
        top: '-5vh',
        fontSize: `${size}rem`,
        opacity: '0',
        animation: `confetti-fall ${duration}s linear ${delay}s infinite`,
        pointerEvents: 'none',
      });
      container.appendChild(particle);
    }

    this.overlay.appendChild(container);
  }

  hide(): void {
    this.overlay.style.transition = 'opacity 0.4s ease';
    this.overlay.style.opacity = '0';
    setTimeout(() => this.overlay.remove(), 400);
  }

  isVisible(): boolean {
    return this.overlay.parentElement !== null;
  }
}
