/**
 * Start screen overlay.
 * "The Big Lie." - Cannes Lions satirical branding.
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
      background: 'rgba(0, 0, 0, 0.78)',
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

    // Decorative top row: palms + rosé
    const deco = document.createElement('div');
    deco.textContent = '\u{1F334}\u{1F377}\u{1F334}';
    Object.assign(deco.style, {
      fontSize: '2.5rem',
      marginBottom: '0.8rem',
      letterSpacing: '0.5rem',
      filter: 'drop-shadow(0 0 12px rgba(232,137,154,0.6))',
    });

    // Main title: THE BIG LIE.
    const title = document.createElement('h1');
    title.textContent = 'THE BIG LIE.';
    Object.assign(title.style, {
      fontSize: '3.2rem',
      fontWeight: '800',
      letterSpacing: '0.25rem',
      marginBottom: '0.4rem',
      background: 'linear-gradient(90deg, #FFD700, #E8899A, #FFD700)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textShadow: 'none',
      lineHeight: '1.1',
    });

    // Subtitle with Cannes reference
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Cannes Lions Edition';
    Object.assign(subtitle.style, {
      fontSize: '0.85rem',
      fontWeight: '400',
      letterSpacing: '0.35rem',
      textTransform: 'uppercase',
      color: '#FFD700',
      opacity: '0.7',
      marginBottom: '0.6rem',
    });

    // Decorative bottom row
    const deco2 = document.createElement('div');
    deco2.textContent = '\u{1F377}\u{1F3C6}\u{1F377}';
    Object.assign(deco2.style, {
      fontSize: '1.8rem',
      marginBottom: '1.5rem',
      letterSpacing: '0.4rem',
      filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.5))',
    });

    // Hand pistol icon
    this.handIcon = document.createElement('div');
    this.handIcon.textContent = '\u{1F449}';
    Object.assign(this.handIcon.style, {
      fontSize: '5rem',
      margin: '1rem 0',
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

    this.overlay.appendChild(deco);
    this.overlay.appendChild(title);
    this.overlay.appendChild(subtitle);
    this.overlay.appendChild(deco2);
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
