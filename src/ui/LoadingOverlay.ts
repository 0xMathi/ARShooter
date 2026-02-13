/**
 * Full-screen loading overlay.
 * NES/arcade title screen aesthetic — pixel stars, chunky 3D title, scanlines.
 */

const FONT = "'Press Start 2P', monospace";

export class LoadingOverlay {
  private overlay: HTMLDivElement;
  private statusText: HTMLParagraphElement;
  private progressBar: HTMLDivElement;

  constructor() {
    // --- Inject animations ---
    const style = document.createElement('style');
    style.textContent = `
      @keyframes star-twinkle {
        0%, 100% { opacity: 0.2; }
        50% { opacity: 1; }
      }
      @keyframes bar-glow {
        0%, 100% { box-shadow: 0 0 6px #00f0ff40; }
        50% { box-shadow: 0 0 14px #00f0ff80; }
      }
      @keyframes title-pulse-load {
        0%, 100% { filter: brightness(1); }
        50% { filter: brightness(1.3); }
      }
    `;
    document.head.appendChild(style);

    this.overlay = document.createElement('div');
    this.overlay.id = 'loading-overlay';
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
      zIndex: '100',
      fontFamily: FONT,
      color: '#fff',
      overflow: 'hidden',
    });

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
      background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
      pointerEvents: 'none',
      zIndex: '2',
    });
    this.overlay.appendChild(scanlines);

    // --- Content container (above scanlines) ---
    const content = document.createElement('div');
    Object.assign(content.style, {
      position: 'relative',
      zIndex: '3',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
    });

    // Small "LOADING" label above title
    const loadLabel = document.createElement('div');
    loadLabel.textContent = '- LOADING -';
    Object.assign(loadLabel.style, {
      fontSize: '0.55rem',
      color: '#FFD700',
      letterSpacing: '0.3rem',
      marginBottom: '1.5rem',
    });

    // Main title: THE BIG LIE. with 3D block shadow
    const title = document.createElement('h1');
    title.textContent = 'THE BIG LIE';
    Object.assign(title.style, {
      fontSize: 'clamp(2rem, 8vw, 3.5rem)',
      fontWeight: '400',
      fontFamily: FONT,
      letterSpacing: '0.15rem',
      lineHeight: '1.2',
      color: '#ff4466',
      textShadow: `
        2px 2px 0 #cc1133,
        4px 4px 0 #991122,
        6px 6px 0 #661111,
        8px 8px 0 #330808,
        0 0 20px rgba(255,68,102,0.4)
      `,
      marginBottom: '0.8rem',
      animation: 'title-pulse-load 3s ease-in-out infinite',
    });

    // Subtitle
    const subtitle = document.createElement('div');
    subtitle.textContent = 'CANNES LIONS EDITION';
    Object.assign(subtitle.style, {
      fontSize: '0.5rem',
      color: '#FFD700',
      letterSpacing: '0.25rem',
      textShadow: '0 0 8px rgba(255,215,0,0.5)',
      marginBottom: '3rem',
    });

    // Status text
    this.statusText = document.createElement('p');
    this.statusText.textContent = 'INITIALIZING...';
    Object.assign(this.statusText.style, {
      fontSize: '0.5rem',
      color: '#8888aa',
      marginBottom: '1rem',
      letterSpacing: '0.1rem',
    });

    // Retro progress bar (chunky, segmented)
    const progressTrack = document.createElement('div');
    Object.assign(progressTrack.style, {
      width: '280px',
      maxWidth: '70vw',
      height: '16px',
      background: '#1a1a2e',
      border: '2px solid #444466',
      borderRadius: '0',
      overflow: 'hidden',
      position: 'relative',
      animation: 'bar-glow 2s ease-in-out infinite',
    });

    // Inner segmented bar
    this.progressBar = document.createElement('div');
    Object.assign(this.progressBar.style, {
      width: '0%',
      height: '100%',
      background: 'linear-gradient(90deg, #00f0ff, #00ff88)',
      transition: 'width 0.3s ease',
      position: 'relative',
    });

    // Segment lines overlay
    const segments = document.createElement('div');
    Object.assign(segments.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      background: 'repeating-linear-gradient(90deg, transparent, transparent 8px, #1a1a2e 8px, #1a1a2e 10px)',
      pointerEvents: 'none',
    });

    progressTrack.appendChild(this.progressBar);
    progressTrack.appendChild(segments);

    content.appendChild(loadLabel);
    content.appendChild(title);
    content.appendChild(subtitle);
    content.appendChild(this.statusText);
    content.appendChild(progressTrack);

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

    for (let i = 0; i < 60; i++) {
      const star = document.createElement('div');
      const size = Math.random() < 0.3 ? 3 : Math.random() < 0.6 ? 2 : 1;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const duration = 1.5 + Math.random() * 3;
      const delay = Math.random() * duration;
      const brightness = Math.random() < 0.2 ? '#00f0ff' : Math.random() < 0.4 ? '#FFD700' : '#ffffff';

      Object.assign(star.style, {
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: `${size}px`,
        height: `${size}px`,
        background: brightness,
        borderRadius: size > 2 ? '0' : '50%',
        animation: `star-twinkle ${duration}s ease-in-out ${delay}s infinite`,
        boxShadow: size > 2 ? `0 0 4px ${brightness}` : 'none',
      });
      container.appendChild(star);
    }

    this.overlay.appendChild(container);
  }

  setStatus(text: string): void {
    this.statusText.textContent = text.toUpperCase();
  }

  setProgress(percent: number): void {
    this.progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  }

  hide(): void {
    this.overlay.style.transition = 'opacity 0.5s ease';
    this.overlay.style.opacity = '0';
    setTimeout(() => {
      this.overlay.remove();
    }, 500);
  }

  showError(message: string): void {
    this.statusText.textContent = message.toUpperCase();
    this.statusText.style.color = '#ff4444';
    this.progressBar.style.background = '#ff4444';
  }
}
