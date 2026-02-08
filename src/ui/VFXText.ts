/**
 * Floating text VFX for HIT/MISS feedback.
 * Uses HTML elements in the HUD layer for crisp rendering.
 */
export class VFXText {
  private container: HTMLElement;

  constructor() {
    const hud = document.getElementById('hud');
    if (!hud) throw new Error('HUD element not found');
    this.container = hud;
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
}
