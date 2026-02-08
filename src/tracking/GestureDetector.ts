import type { HandLandmark, GestureState, ScreenPosition } from '../types';

/**
 * Pistol gesture detector.
 * - Index finger extended + 1 other finger curled = aiming
 * - Thumb BENT (angle at IP joint) = shoot
 *
 * Uses joint angles for trigger detection - much more reliable than
 * distance-based approaches since the angle changes dramatically
 * between straight (~170°) and bent (~90-130°) thumb.
 */

const SHOOT_COOLDOWN = 500;
const THUMB_BENT_ANGLE = 155; // degrees - below this = thumb is bent = fire

export class GestureDetector {
  private lastShotTime = 0;

  private _debugInfo = {
    hasHand: false,
    indexExtended: false,
    curledCount: 0,
    thumbAngle: 180,
    isPistol: false,
    triggered: false,
  };

  detect(
    landmarks: HandLandmark[] | null,
    screenWidth: number,
    screenHeight: number
  ): GestureState {
    const noGesture: GestureState = {
      isPistol: false,
      aimPosition: null,
      handBase: null,
      triggered: false,
    };

    if (!landmarks || landmarks.length < 21) {
      this._debugInfo.hasHand = false;
      return noGesture;
    }

    const wrist = landmarks[0];

    // Finger extension via wrist-distance
    const idxTipW = this.dist3D(landmarks[8], wrist);
    const idxPipW = this.dist3D(landmarks[6], wrist);
    const midTipW = this.dist3D(landmarks[12], wrist);
    const midPipW = this.dist3D(landmarks[10], wrist);
    const ringTipW = this.dist3D(landmarks[16], wrist);
    const ringPipW = this.dist3D(landmarks[14], wrist);
    const pinkyTipW = this.dist3D(landmarks[20], wrist);
    const pinkyPipW = this.dist3D(landmarks[18], wrist);

    const indexExtended = idxTipW > idxPipW;
    const curledCount =
      (midTipW < midPipW * 1.15 ? 1 : 0) +
      (ringTipW < ringPipW * 1.15 ? 1 : 0) +
      (pinkyTipW < pinkyPipW * 1.15 ? 1 : 0);

    const isPistol = indexExtended && curledCount >= 1;

    // Aim from index fingertip
    const aimPosition: ScreenPosition = {
      x: (1 - landmarks[8].x) * screenWidth,
      y: landmarks[8].y * screenHeight,
    };
    const handBase: ScreenPosition = {
      x: (1 - landmarks[0].x) * screenWidth,
      y: landmarks[0].y * screenHeight,
    };

    // Thumb trigger: angle at IP joint (landmark 3)
    // Straight thumb ≈ 160-180°, bent thumb ≈ 90-140°
    // Landmarks: 2=MCP, 3=IP, 4=TIP → angle at 3
    const thumbAngle = this.angleAtJoint(landmarks[2], landmarks[3], landmarks[4]);

    const now = performance.now();
    const triggered = thumbAngle < THUMB_BENT_ANGLE && (now - this.lastShotTime > SHOOT_COOLDOWN);

    if (triggered) {
      this.lastShotTime = now;
    }

    this._debugInfo = {
      hasHand: true,
      indexExtended,
      curledCount,
      thumbAngle,
      isPistol,
      triggered,
    };

    return { isPistol, aimPosition, handBase, triggered };
  }

  /** Angle (degrees) at joint B, formed by points A-B-C */
  private angleAtJoint(a: HandLandmark, b: HandLandmark, c: HandLandmark): number {
    const v1 = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
    const v2 = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };

    const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    const mag1 = Math.sqrt(v1.x ** 2 + v1.y ** 2 + v1.z ** 2);
    const mag2 = Math.sqrt(v2.x ** 2 + v2.y ** 2 + v2.z ** 2);

    if (mag1 < 0.0001 || mag2 < 0.0001) return 180;

    const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
    return Math.acos(cosAngle) * (180 / Math.PI);
  }

  private dist3D(a: HandLandmark, b: HandLandmark): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  debugThumbWasOpen(): boolean {
    return true;
  }

  debugInfo(): typeof this._debugInfo {
    return this._debugInfo;
  }

  reset(): void {
    this.lastShotTime = 0;
  }
}
