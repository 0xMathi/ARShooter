import * as THREE from 'three';

/**
 * Manages the Three.js scene with orthographic camera
 * overlaying the video feed transparently.
 */
export class SceneManager {
  readonly scene: THREE.Scene;
  readonly camera: THREE.OrthographicCamera;
  readonly renderer: THREE.WebGLRenderer;

  private width: number;
  private height: number;

  // Screen shake state
  private shakeIntensity = 0;
  private shakeDecay = 0;
  private baseCameraY = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Orthographic camera in screen-space coordinates
    // (0,0) is center, +Y is up, +X is right
    this.camera = new THREE.OrthographicCamera(
      -this.width / 2,
      this.width / 2,
      this.height / 2,
      -this.height / 2,
      0.1,
      2000
    );
    this.camera.position.z = 1000;

    this.scene = new THREE.Scene();

    // Ambient light for disc materials
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(0, 0, 1000);
    this.scene.add(dirLight);

    // Transparent renderer overlay
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    window.addEventListener('resize', this.onResize);
  }

  /** Convert screen coordinates (0,0 = top-left) to Three.js world */
  screenToWorld(screenX: number, screenY: number): THREE.Vector3 {
    return new THREE.Vector3(
      screenX - this.width / 2,
      this.height / 2 - screenY,
      0
    );
  }

  /** Convert MediaPipe landmark (0-1 normalized, mirrored) to screen coords */
  landmarkToScreen(x: number, y: number): { x: number; y: number } {
    return {
      x: (1 - x) * this.width,
      y: y * this.height,
    };
  }

  getSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /** Trigger vertical screen shake */
  shake(intensity = 8): void {
    this.shakeIntensity = intensity;
    this.shakeDecay = intensity;
  }

  render(): void {
    // Apply screen shake (vertical only for positive feel)
    if (this.shakeDecay > 0.1) {
      const offset = (Math.random() * 2 - 1) * this.shakeDecay;
      this.camera.position.y = this.baseCameraY + offset;
      this.shakeDecay *= 0.85; // exponential decay
    } else if (this.shakeDecay > 0) {
      this.camera.position.y = this.baseCameraY;
      this.shakeDecay = 0;
    }

    this.renderer.render(this.scene, this.camera);
  }

  private onResize = (): void => {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera.left = -this.width / 2;
    this.camera.right = this.width / 2;
    this.camera.top = this.height / 2;
    this.camera.bottom = -this.height / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
  };

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
