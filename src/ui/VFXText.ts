/**
 * Floating text VFX for HIT/MISS feedback.
 * Uses HTML elements in the HUD layer for crisp rendering.
 */
export class VFXText {
  private container: HTMLElement;
  private flashEl: HTMLElement;
  private flashTimer = 0;

  constructor() {
    const hud = document.getElementById('hud');
    if (!hud) throw new Error('HUD element not found');
    this.container = hud;

    const flash = document.getElementById('screen-flash');
    if (!flash) throw new Error('Screen flash element not found');
    this.flashEl = flash;

    // Inject emoji burst keyframe
    const style = document.createElement('style');
    style.textContent = `
      @keyframes emoji-burst {
        0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
        100% { transform: translate(calc(-50% + var(--vx) * 1px), calc(-50% + var(--vy) * 1px)) scale(0.3) rotate(var(--rot)); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  /** Full-screen flash overlay on hit */
  screenFlash(color: string, intensity: number): void {
    clearTimeout(this.flashTimer);
    this.flashEl.style.transition = 'none';
    this.flashEl.style.background = color;
    this.flashEl.style.opacity = String(intensity);

    // Force reflow so transition applies on next frame
    this.flashEl.offsetHeight;

    this.flashEl.style.transition = 'opacity 120ms ease-out';
    this.flashEl.style.opacity = '0';
  }

  /** Spawn a floating text at screen position */
  spawn(
    text: string,
    x: number,
    y: number,
    color: string,
    scale = 1
  ): void {
    const el = document.createElement('div');
    el.textContent = text;
    Object.assign(el.style, {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
      transform: `translate(-50%, -50%) scale(${scale})`,
      color,
      fontSize: '1.8rem',
      fontWeight: '900',
      fontFamily: "'Inter', system-ui, sans-serif",
      textShadow: `0 0 10px ${color}, 0 0 20px ${color}`,
      pointerEvents: 'none',
      zIndex: '10',
      opacity: '1',
      transition: 'none',
      whiteSpace: 'nowrap',
    });

    this.container.appendChild(el);

    // Animate: float up and fade out
    let frame = 0;
    const totalFrames = 60; // ~1 second at 60fps

    const animate = () => {
      frame++;
      const progress = frame / totalFrames;

      el.style.transform = `translate(-50%, -50%) scale(${scale}) translateY(${-60 * progress}px)`;
      el.style.opacity = `${1 - progress}`;

      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      } else {
        el.remove();
      }
    };

    requestAnimationFrame(animate);
  }

  /** HIT feedback - color based on trophy tier */
  hit(x: number, y: number, points: number, combo: number, tierColor?: string): void {
    const color = tierColor ?? '#00ff88';
    this.spawn(`+${points}`, x, y, color, 1.2);

    if (combo >= 3) {
      setTimeout(() => {
        const comboColor =
          combo >= 10 ? '#ff00e0' : combo >= 5 ? '#ffaa00' : '#00f0ff';
        this.spawn(`${combo}x COMBO`, x, y + 40, comboColor, 0.9);
      }, 100);
    }
  }

  /** MISS feedback */
  miss(x: number, y: number): void {
    this.spawn('MISS', x, y, '#ff4444', 0.9);
  }

  /** Radial emoji particle burst at screen position */
  emojiExplosion(x: number, y: number, emojis: string[], count: number): void {
    for (let i = 0; i < count; i++) {
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 100 + Math.random() * 80;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const rot = Math.random() * 720 - 360;

      const el = document.createElement('div');
      el.textContent = emoji;
      el.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        font-size: 1.6rem;
        pointer-events: none;
        z-index: 15;
        --vx: ${vx};
        --vy: ${vy};
        --rot: ${rot}deg;
        animation: emoji-burst 0.9s ease-out forwards;
      `;

      this.container.appendChild(el);
      setTimeout(() => el.remove(), 950);
    }
  }
}
