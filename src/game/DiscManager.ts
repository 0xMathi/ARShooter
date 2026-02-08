import * as THREE from 'three';
import type { SceneManager } from '../engine/SceneManager';

interface Disc {
  id: number;
  mesh: THREE.Group;
  velocity: THREE.Vector2;
  alive: boolean;
  screenX: number;
  screenY: number;
  radius: number; // screen-space hit radius
}

const DISC_COLORS = [0x00f0ff, 0xff00e0, 0xffaa00, 0x00ff88, 0xff4444];
const TARGET_COUNT = 4;
const DISC_SPEED_MIN = 60; // pixels per second
const DISC_SPEED_MAX = 120;
const DISC_RADIUS_3D = 40;
const HIT_RADIUS = 90; // screen pixels for collision - generous for gesture aiming
const SPEED_RAMP_INTERVAL = 30; // seconds between speed increases
const SPEED_RAMP_AMOUNT = 15; // pixels/sec added per interval
const SPEED_RAMP_MAX = 80; // max total bonus speed

/**
 * Manages flying disc enemies.
 * Spawns at edges, flies toward center.
 * Maintains TARGET_COUNT discs on screen at all times.
 * Difficulty ramps up gradually over time.
 */
export class DiscManager {
  private scene: SceneManager;
  private discs: Disc[] = [];
  private nextId = 0;
  private fragments: { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number }[] = [];
  private elapsedTime = 0;

  constructor(scene: SceneManager) {
    this.scene = scene;
  }

  /** Current speed bonus from difficulty ramp */
  private getSpeedBonus(): number {
    const intervals = Math.floor(this.elapsedTime / SPEED_RAMP_INTERVAL);
    return Math.min(intervals * SPEED_RAMP_AMOUNT, SPEED_RAMP_MAX);
  }

  /** Spawn initial discs */
  start(): void {
    for (let i = 0; i < TARGET_COUNT; i++) {
      this.spawnDisc();
    }
  }

  /** Update all disc positions and fragments */
  update(dt: number): void {
    this.elapsedTime += dt;
    const { width, height } = this.scene.getSize();

    for (const disc of this.discs) {
      if (!disc.alive) continue;

      // Move toward center
      disc.screenX += disc.velocity.x * dt;
      disc.screenY += disc.velocity.y * dt;

      // Update 3D position
      const worldPos = this.scene.screenToWorld(disc.screenX, disc.screenY);
      disc.mesh.position.set(worldPos.x, worldPos.y, 0);

      // Spin the disc
      disc.mesh.rotation.x += dt * 2;
      disc.mesh.rotation.z += dt * 0.5;

      // Kill if past center area (off screen on other side)
      const margin = 100;
      if (
        disc.screenX < -margin ||
        disc.screenX > width + margin ||
        disc.screenY < -margin ||
        disc.screenY > height + margin
      ) {
        this.removeDisc(disc);
      }
    }

    // Update shatter fragments
    for (let i = this.fragments.length - 1; i >= 0; i--) {
      const frag = this.fragments[i];
      frag.mesh.position.add(frag.velocity.clone().multiplyScalar(dt));
      frag.velocity.y -= 400 * dt; // gravity
      frag.life -= dt;

      const mat = frag.mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = Math.max(0, frag.life / 0.8);

      if (frag.life <= 0) {
        this.scene.scene.remove(frag.mesh);
        mat.dispose();
        (frag.mesh.geometry as THREE.BufferGeometry).dispose();
        this.fragments.splice(i, 1);
      }
    }

    // Maintain target count
    this.discs = this.discs.filter((d) => d.alive);
    while (this.discs.length < TARGET_COUNT) {
      this.spawnDisc();
    }
  }

  /** Check if a screen position hits any disc. Returns disc screen pos or null. */
  checkHit(screenX: number, screenY: number): { x: number; y: number } | null {
    let closest: Disc | null = null;
    let closestDist = Infinity;

    for (const disc of this.discs) {
      if (!disc.alive) continue;
      const dx = screenX - disc.screenX;
      const dy = screenY - disc.screenY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < HIT_RADIUS && dist < closestDist) {
        closest = disc;
        closestDist = dist;
      }
    }

    if (closest) {
      const pos = { x: closest.screenX, y: closest.screenY };
      this.shatterDisc(closest);
      return pos;
    }

    return null;
  }

  /** Get all alive disc positions for aim assist */
  getDiscPositions(): { x: number; y: number }[] {
    return this.discs
      .filter((d) => d.alive)
      .map((d) => ({ x: d.screenX, y: d.screenY }));
  }

  private spawnDisc(): void {
    const { width, height } = this.scene.getSize();
    const edge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
    let startX: number, startY: number;

    const margin = 60;
    switch (edge) {
      case 0: // top
        startX = Math.random() * width;
        startY = -margin;
        break;
      case 1: // right
        startX = width + margin;
        startY = Math.random() * height;
        break;
      case 2: // bottom
        startX = Math.random() * width;
        startY = height + margin;
        break;
      default: // left
        startX = -margin;
        startY = Math.random() * height;
        break;
    }

    // Target: random point near center
    const targetX = width / 2 + (Math.random() - 0.5) * width * 0.4;
    const targetY = height / 2 + (Math.random() - 0.5) * height * 0.4;

    const dx = targetX - startX;
    const dy = targetY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const bonus = this.getSpeedBonus();
    const speed = DISC_SPEED_MIN + bonus + Math.random() * (DISC_SPEED_MAX - DISC_SPEED_MIN);
    const velocity = new THREE.Vector2(
      (dx / dist) * speed,
      (dy / dist) * speed
    );

    // Create 3D disc mesh
    const color = DISC_COLORS[Math.floor(Math.random() * DISC_COLORS.length)];
    const group = new THREE.Group();

    // Main disc body
    const geometry = new THREE.CylinderGeometry(DISC_RADIUS_3D, DISC_RADIUS_3D, 6, 16);
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.5,
      metalness: 0.7,
      roughness: 0.3,
    });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    // Glowing ring
    const ringGeo = new THREE.TorusGeometry(DISC_RADIUS_3D + 3, 2, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.6,
    });
    group.add(new THREE.Mesh(ringGeo, ringMat));

    const worldPos = this.scene.screenToWorld(startX, startY);
    group.position.set(worldPos.x, worldPos.y, 0);

    this.scene.scene.add(group);

    this.discs.push({
      id: this.nextId++,
      mesh: group,
      velocity,
      alive: true,
      screenX: startX,
      screenY: startY,
      radius: HIT_RADIUS,
    });
  }

  private shatterDisc(disc: Disc): void {
    disc.alive = false;

    // Read color BEFORE disposing
    const color = (
      (disc.mesh.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial
    ).color.getHex();
    const pos = this.scene.screenToWorld(disc.screenX, disc.screenY);

    // Remove and dispose disc meshes
    this.scene.scene.remove(disc.mesh);
    disc.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    });

    for (let i = 0; i < 8; i++) {
      const fragGeo = new THREE.TetrahedronGeometry(8 + Math.random() * 8);
      const fragMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 1,
      });
      const fragMesh = new THREE.Mesh(fragGeo, fragMat);
      fragMesh.position.copy(pos);

      const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.5;
      const speed = 200 + Math.random() * 300;
      const fragVelocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed + 100,
        (Math.random() - 0.5) * 200
      );

      this.scene.scene.add(fragMesh);
      this.fragments.push({ mesh: fragMesh, velocity: fragVelocity, life: 0.8 });
    }
  }

  private removeDisc(disc: Disc): void {
    disc.alive = false;
    this.scene.scene.remove(disc.mesh);
    disc.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    });
  }

  dispose(): void {
    for (const disc of this.discs) {
      this.removeDisc(disc);
    }
    for (const frag of this.fragments) {
      this.scene.scene.remove(frag.mesh);
      (frag.mesh.material as THREE.Material).dispose();
      frag.mesh.geometry.dispose();
    }
    this.discs = [];
    this.fragments = [];
  }
}
