import * as THREE from 'three';
import type { SceneManager } from '../engine/SceneManager';
import type { ScreenPosition } from '../types';

const AIM_ASSIST_RADIUS = 150; // screen pixels - magnetic snap range
const AIM_ASSIST_STRENGTH = 0.45; // 0-1, how strongly crosshair pulls toward disc
const CROSSHAIR_SIZE = 20;
const LASER_COLOR = 0xff2200;
const CROSSHAIR_COLOR_DEFAULT = 0x00f0ff;
const CROSSHAIR_COLOR_LOCKED = 0x00ff88;

/**
 * Handles the aiming system: crosshair, laser line, and magnetic aim assist.
 */
export class ShootingSystem {
  private scene: SceneManager;

  // Crosshair mesh
  private crosshairGroup: THREE.Group;
  private crosshairRing: THREE.Mesh;
  private crosshairDot: THREE.Mesh;

  // Laser line
  private laserLine: THREE.Line;
  private laserMaterial: THREE.LineBasicMaterial;

  // Current aim state
  private currentAim: ScreenPosition = { x: 0, y: 0 };
  private isLocked = false;

  constructor(scene: SceneManager) {
    this.scene = scene;

    // Build crosshair
    this.crosshairGroup = new THREE.Group();

    const ringGeo = new THREE.RingGeometry(
      CROSSHAIR_SIZE - 3,
      CROSSHAIR_SIZE,
      24
    );
    const ringMat = new THREE.MeshBasicMaterial({
      color: CROSSHAIR_COLOR_DEFAULT,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    this.crosshairRing = new THREE.Mesh(ringGeo, ringMat);
    this.crosshairGroup.add(this.crosshairRing);

    const dotGeo = new THREE.CircleGeometry(3, 12);
    const dotMat = new THREE.MeshBasicMaterial({
      color: CROSSHAIR_COLOR_DEFAULT,
      transparent: true,
      opacity: 0.9,
    });
    this.crosshairDot = new THREE.Mesh(dotGeo, dotMat);
    this.crosshairGroup.add(this.crosshairDot);

    // Cross lines
    const linePoints = [
      // Horizontal
      new THREE.Vector3(-CROSSHAIR_SIZE - 8, 0, 0),
      new THREE.Vector3(-CROSSHAIR_SIZE + 3, 0, 0),
      // Gap for ring
    ];
    const crossMat = new THREE.LineBasicMaterial({
      color: CROSSHAIR_COLOR_DEFAULT,
      transparent: true,
      opacity: 0.6,
    });

    // Four line segments forming a cross around the ring
    const segments = [
      [[-CROSSHAIR_SIZE - 10, 0], [-CROSSHAIR_SIZE, 0]],
      [[CROSSHAIR_SIZE, 0], [CROSSHAIR_SIZE + 10, 0]],
      [[0, -CROSSHAIR_SIZE - 10], [0, -CROSSHAIR_SIZE]],
      [[0, CROSSHAIR_SIZE], [0, CROSSHAIR_SIZE + 10]],
    ];

    for (const [[x1, y1], [x2, y2]] of segments) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x1, y1, 0),
        new THREE.Vector3(x2, y2, 0),
      ]);
      this.crosshairGroup.add(new THREE.Line(geo, crossMat.clone()));
    }

    this.crosshairGroup.visible = false;
    this.crosshairGroup.position.z = 100; // in front of discs
    scene.scene.add(this.crosshairGroup);

    // Build laser line
    this.laserMaterial = new THREE.LineBasicMaterial({
      color: LASER_COLOR,
      transparent: true,
      opacity: 0.6,
      linewidth: 2,
    });
    const laserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    this.laserLine = new THREE.Line(laserGeo, this.laserMaterial);
    this.laserLine.visible = false;
    this.laserLine.position.z = 50;
    scene.scene.add(this.laserLine);
  }

  /**
   * Update crosshair position with magnetic aim assist.
   * Returns the final (possibly snapped) aim position.
   */
  update(
    rawAim: ScreenPosition | null,
    handBase: ScreenPosition | null,
    discPositions: { x: number; y: number }[]
  ): ScreenPosition | null {
    if (!rawAim || !handBase) {
      this.crosshairGroup.visible = false;
      this.laserLine.visible = false;
      return null;
    }

    // Apply magnetic aim assist
    let aimX = rawAim.x;
    let aimY = rawAim.y;
    this.isLocked = false;

    let closestDist = Infinity;
    for (const disc of discPositions) {
      const dx = rawAim.x - disc.x;
      const dy = rawAim.y - disc.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < AIM_ASSIST_RADIUS && dist < closestDist) {
        closestDist = dist;
        // Pull toward disc based on proximity
        const pullStrength =
          AIM_ASSIST_STRENGTH * (1 - dist / AIM_ASSIST_RADIUS);
        aimX = rawAim.x + (disc.x - rawAim.x) * pullStrength;
        aimY = rawAim.y + (disc.y - rawAim.y) * pullStrength;
        this.isLocked = dist < AIM_ASSIST_RADIUS * 0.5;
      }
    }

    this.currentAim = { x: aimX, y: aimY };

    // Update crosshair position
    const worldAim = this.scene.screenToWorld(aimX, aimY);
    this.crosshairGroup.position.x = worldAim.x;
    this.crosshairGroup.position.y = worldAim.y;
    this.crosshairGroup.visible = true;

    // Crosshair color based on lock state
    const color = this.isLocked ? CROSSHAIR_COLOR_LOCKED : CROSSHAIR_COLOR_DEFAULT;
    (this.crosshairRing.material as THREE.MeshBasicMaterial).color.setHex(color);
    (this.crosshairDot.material as THREE.MeshBasicMaterial).color.setHex(color);

    // Pulse effect when locked
    if (this.isLocked) {
      const pulse = 1 + Math.sin(performance.now() * 0.01) * 0.15;
      this.crosshairGroup.scale.set(pulse, pulse, 1);
    } else {
      this.crosshairGroup.scale.set(1, 1, 1);
    }

    // Update laser line
    const worldBase = this.scene.screenToWorld(handBase.x, handBase.y);
    const positions = this.laserLine.geometry.attributes.position;
    if (positions) {
      const arr = positions.array as Float32Array;
      arr[0] = worldBase.x;
      arr[1] = worldBase.y;
      arr[2] = 50;
      arr[3] = worldAim.x;
      arr[4] = worldAim.y;
      arr[5] = 50;
      positions.needsUpdate = true;
    }
    this.laserLine.visible = true;

    // Laser opacity pulses when locked
    this.laserMaterial.opacity = this.isLocked ? 0.9 : 0.5;

    return this.currentAim;
  }

  getAimPosition(): ScreenPosition {
    return this.currentAim;
  }

  isTargetLocked(): boolean {
    return this.isLocked;
  }

  hide(): void {
    this.crosshairGroup.visible = false;
    this.laserLine.visible = false;
  }

  dispose(): void {
    this.scene.scene.remove(this.crosshairGroup);
    this.scene.scene.remove(this.laserLine);
  }
}
