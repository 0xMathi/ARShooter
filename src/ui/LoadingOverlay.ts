/**
 * Full-screen loading overlay.
 * Blocks game until MediaPipe model is fully downloaded.
 */
export class LoadingOverlay {
  private overlay: HTMLDivElement;
  private statusText: HTMLParagraphElement;
  private progressBar: HTMLDivElement;

  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'loading-overlay';
    Object.assign(this.overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.92)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '100',
      fontFamily: "'Inter', system-ui, sans-serif",
      color: '#fff',
    });

    const title = document.createElement('h1');
    title.textContent = 'THE BIG LIE.';
    Object.assign(title.style, {
      fontSize: '2.5rem',
      fontWeight: '700',
      letterSpacing: '0.3rem',
      marginBottom: '2rem',
      background: 'linear-gradient(90deg, #00f0ff, #ff00e0)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    });

    this.statusText = document.createElement('p');
    this.statusText.textContent = 'Initializing...';
    Object.assign(this.statusText.style, {
      fontSize: '1rem',
      color: '#aaa',
      marginBottom: '1.5rem',
    });

    const progressTrack = document.createElement('div');
    Object.assign(progressTrack.style, {
      width: '240px',
      height: '4px',
      background: '#333',
      borderRadius: '2px',
      overflow: 'hidden',
    });

    this.progressBar = document.createElement('div');
    Object.assign(this.progressBar.style, {
      width: '0%',
      height: '100%',
      background: 'linear-gradient(90deg, #00f0ff, #ff00e0)',
      borderRadius: '2px',
      transition: 'width 0.3s ease',
    });

    progressTrack.appendChild(this.progressBar);
    this.overlay.appendChild(title);
    this.overlay.appendChild(this.statusText);
    this.overlay.appendChild(progressTrack);

    document.body.appendChild(this.overlay);
  }

  setStatus(text: string): void {
    this.statusText.textContent = text;
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
    this.statusText.textContent = message;
    this.statusText.style.color = '#f44';
    this.progressBar.style.background = '#f44';
  }
}
