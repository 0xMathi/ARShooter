import * as THREE from 'three';
import type { SceneManager } from '../engine/SceneManager';
import { createTrophy, getTierColor, type TrophyTier, type TrophyAssets } from './TrophyBuilder';

interface Trophy {
  id: number;
  mesh: THREE.Group;
  velocity: THREE.Vector2;
  alive: boolean;
  screenX: number;
  screenY: number;
  radius: number;
  tier: TrophyTier;
}

// Spawn weights: [tier, cumulative probability]
const TIER_WEIGHTS: [TrophyTier, number][] = [
  ['bronze', 0.55],
  ['silver', 0.85],
  ['gold', 1.0],
];

// Tier-specific settings
const TIER_SPEED_MULT: Record<TrophyTier, number> = { bronze: 1, silver: 1.2, gold: 1.5 };
const TIER_SCALE: Record<TrophyTier, number> = { bronze: 1, silver: 0.85, gold: 0.7 };
const TIER_HIT_RADIUS: Record<TrophyTier, number> = { bronze: 90, silver: 80, gold: 65 };

const TARGET_COUNT = 4;
const BASE_SPEED_MIN = 60;
const BASE_SPEED_MAX = 120;
const SPEED_RAMP_INTERVAL = 30;
const SPEED_RAMP_AMOUNT = 15;
const SPEED_RAMP_MAX = 80;

/**
 * Manages Cannes Lions trophy targets.
 * Three tiers: Bronze (common), Silver (medium), Gold (rare + fast + small).
 */
export class DiscManager {
  private scene: SceneManager;
  private assets: TrophyAssets;
  private trophies: Trophy[] = [];
  private nextId = 0;
  private fragments: { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number }[] = [];
  private elapsedTime = 0;

  constructor(scene: SceneManager, assets: TrophyAssets) {
    this.scene = scene;
    this.assets = assets;
  }

  private getSpeedBonus(): number {
    const intervals = Math.floor(this.elapsedTime / SPEED_RAMP_INTERVAL);
    return Math.min(intervals * SPEED_RAMP_AMOUNT, SPEED_RAMP_MAX);
  }

  private pickTier(): TrophyTier {
    const r = Math.random();
    for (const [tier, threshold] of TIER_WEIGHTS) {
      if (r < threshold) return tier;
    }
    return 'bronze';
  }

  start(): void {
    for (let i = 0; i < TARGET_COUNT; i++) {
      this.spawnTrophy();
    }
  }

  update(dt: number): void {
    this.elapsedTime += dt;
    const { width, height } = this.scene.getSize();

    for (const trophy of this.trophies) {
      if (!trophy.alive) continue;

      trophy.screenX += trophy.velocity.x * dt;
      trophy.screenY += trophy.velocity.y * dt;

      const worldPos = this.scene.screenToWorld(trophy.screenX, trophy.screenY);
      trophy.mesh.position.set(worldPos.x, worldPos.y, 0);

      // Gentle face-on spin with slight wobble (plane faces camera)
      const t = this.elapsedTime;
      trophy.mesh.rotation.z += dt * 1.2;
      trophy.mesh.rotation.x = Math.sin(t * 2 + trophy.id * 2) * 0.15;
      trophy.mesh.rotation.y = Math.cos(t * 3 + trophy.id * 3) * 0.15;

      const margin = 100;
      if (
        trophy.screenX < -margin ||
        trophy.screenX > width + margin ||
        trophy.screenY < -margin ||
        trophy.screenY > height + margin
      ) {
        this.removeTrophy(trophy);
      }
    }

    // Update shatter fragments
    for (let i = this.fragments.length - 1; i >= 0; i--) {
      const frag = this.fragments[i];
      frag.mesh.position.add(frag.velocity.clone().multiplyScalar(dt));
      frag.velocity.y -= 400 * dt;
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

    this.trophies = this.trophies.filter((t) => t.alive);
    while (this.trophies.length < TARGET_COUNT) {
      this.spawnTrophy();
    }
  }

  /** Check hit. Returns position + tier or null. */
  checkHit(screenX: number, screenY: number): { x: number; y: number; tier: TrophyTier } | null {
    let closest: Trophy | null = null;
    let closestDist = Infinity;

    for (const trophy of this.trophies) {
      if (!trophy.alive) continue;
      const dx = screenX - trophy.screenX;
      const dy = screenY - trophy.screenY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < trophy.radius && dist < closestDist) {
        closest = trophy;
        closestDist = dist;
      }
    }

    if (closest) {
      const result = { x: closest.screenX, y: closest.screenY, tier: closest.tier };
      this.shatterTrophy(closest);
      return result;
    }

    return null;
  }

  getDiscPositions(): { x: number; y: number }[] {
    return this.trophies
      .filter((t) => t.alive)
      .map((t) => ({ x: t.screenX, y: t.screenY }));
  }

  private spawnTrophy(): void {
    const { width, height } = this.scene.getSize();
    const tier = this.pickTier();

    const edge = Math.floor(Math.random() * 4);
    let startX: number, startY: number;
    const margin = 60;

    switch (edge) {
      case 0:
        startX = Math.random() * width;
        startY = -margin;
        break;
      case 1:
        startX = width + margin;
        startY = Math.random() * height;
        break;
      case 2:
        startX = Math.random() * width;
        startY = height + margin;
        break;
      default:
        startX = -margin;
        startY = Math.random() * height;
        break;
    }

    const targetX = width / 2 + (Math.random() - 0.5) * width * 0.4;
    const targetY = height / 2 + (Math.random() - 0.5) * height * 0.4;

    const dx = targetX - startX;
    const dy = targetY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const bonus = this.getSpeedBonus();
    const baseSpeed = BASE_SPEED_MIN + bonus + Math.random() * (BASE_SPEED_MAX - BASE_SPEED_MIN);
    const speed = baseSpeed * TIER_SPEED_MULT[tier];
    const velocity = new THREE.Vector2(
      (dx / dist) * speed,
      (dy / dist) * speed
    );

    // Build trophy mesh
    const group = createTrophy(tier, this.assets);
    const scale = TIER_SCALE[tier];
    group.scale.set(scale, scale, scale);

    const worldPos = this.scene.screenToWorld(startX, startY);
    group.position.set(worldPos.x, worldPos.y, 0);

    this.scene.scene.add(group);

    this.trophies.push({
      id: this.nextId++,
      mesh: group,
      velocity,
      alive: true,
      screenX: startX,
      screenY: startY,
      radius: TIER_HIT_RADIUS[tier],
      tier,
    });
  }

  private disposeMesh(mesh: THREE.Mesh): void {
    mesh.geometry.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) mat.dispose();
  }

  private shatterTrophy(trophy: Trophy): void {
    trophy.alive = false;

    const color = getTierColor(trophy.tier);
    const pos = this.scene.screenToWorld(trophy.screenX, trophy.screenY);

    this.scene.scene.remove(trophy.mesh);
    trophy.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) this.disposeMesh(child);
    });

    // More fragments for higher tiers
    const fragCount = trophy.tier === 'gold' ? 12 : trophy.tier === 'silver' ? 10 : 8;

    for (let i = 0; i < fragCount; i++) {
      const fragGeo = new THREE.TetrahedronGeometry(6 + Math.random() * 8);
      const fragMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.8,
        metalness: 0.9,
        roughness: 0.2,
        transparent: true,
        opacity: 1,
      });
      const fragMesh = new THREE.Mesh(fragGeo, fragMat);
      fragMesh.position.copy(pos);

      const angle = (Math.PI * 2 * i) / fragCount + Math.random() * 0.5;
      const spd = 200 + Math.random() * 300;
      const fragVelocity = new THREE.Vector3(
        Math.cos(angle) * spd,
        Math.sin(angle) * spd + 100,
        (Math.random() - 0.5) * 200
      );

      this.scene.scene.add(fragMesh);
      this.fragments.push({ mesh: fragMesh, velocity: fragVelocity, life: 0.8 });
    }
  }

  private removeTrophy(trophy: Trophy): void {
    trophy.alive = false;
    this.scene.scene.remove(trophy.mesh);
    trophy.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) this.disposeMesh(child);
    });
  }

  dispose(): void {
    for (const trophy of this.trophies) {
      this.removeTrophy(trophy);
    }
    for (const frag of this.fragments) {
      this.scene.scene.remove(frag.mesh);
      (frag.mesh.material as THREE.Material).dispose();
      frag.mesh.geometry.dispose();
    }
    this.trophies = [];
    this.fragments = [];
  }
}
