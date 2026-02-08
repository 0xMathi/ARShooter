/**
 * Start screen overlay.
 * Shows instructions and waits for pistol gesture to begin.
 */
export class StartScreen {
  private overlay: HTMLDivElement;
  private handIcon: HTMLDivElement;

  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'start-screen';
    Object.assign(this.overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '50',
      fontFamily: "'Inter', system-ui, sans-serif",
      color: '#fff',
      textAlign: 'center',
      padding: '2rem',
    });

    const title = document.createElement('h1');
    title.textContent = 'AR SHOOTER';
    Object.assign(title.style, {
      fontSize: '3rem',
      fontWeight: '700',
      letterSpacing: '0.3rem',
      marginBottom: '1rem',
      background: 'linear-gradient(90deg, #00f0ff, #ff00e0)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    });

    // Hand pistol icon (emoji-based)
    this.handIcon = document.createElement('div');
    this.handIcon.textContent = '\u{1F449}';
    Object.assign(this.handIcon.style, {
      fontSize: '5rem',
      margin: '1.5rem 0',
      animation: 'pulse 1.5s ease-in-out infinite',
    });

    const instruction = document.createElement('p');
    instruction.textContent = 'Form a pistol gesture to start';
    Object.assign(instruction.style, {
      fontSize: '1.2rem',
      color: '#ccc',
      marginBottom: '0.5rem',
    });

    const hint = document.createElement('p');
    hint.textContent = 'Point with your index finger, curl the rest';
    Object.assign(hint.style, {
      fontSize: '0.85rem',
      color: '#888',
    });

    // Inject pulse animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.15); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    this.overlay.appendChild(title);
    this.overlay.appendChild(this.handIcon);
    this.overlay.appendChild(instruction);
    this.overlay.appendChild(hint);

    document.body.appendChild(this.overlay);
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
