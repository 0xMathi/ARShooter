import * as THREE from 'three';

export type TrophyTier = 'gold' | 'silver' | 'bronze';

/** Ring uses user-specified metalness/roughness; face uses lower values so texture is visible */
const TIER_CONFIG: Record<
  TrophyTier,
  { color: number; metalness: number; roughness: number; emissiveIntensity: number }
> = {
  gold:   { color: 0xFFD700, metalness: 1.0, roughness: 0.3, emissiveIntensity: 0.5 },
  silver: { color: 0xC0C0C0, metalness: 1.0, roughness: 0.4, emissiveIntensity: 0.3 },
  bronze: { color: 0xCD7F32, metalness: 0.8, roughness: 0.6, emissiveIntensity: 0.35 },
};

const TROPHY_HEIGHT = 70;

export interface TrophyAssets {
  texture: THREE.Texture;
  envMap: THREE.Texture;
}

/** Preload trophy texture and generate environment map for metallic reflections */
export async function loadTrophyAssets(renderer: THREE.WebGLRenderer): Promise<TrophyAssets> {
  const loader = new THREE.TextureLoader();
  const texture = await loader.loadAsync('/assets/trophy.png');
  texture.colorSpace = THREE.SRGBColorSpace;

  // Generate envMap from a gradient environment (studio lighting)
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileCubemapShader();

  const envScene = new THREE.Scene();
  const topColor = new THREE.Color(0xffffee);
  const bottomColor = new THREE.Color(0x222244);
  const envGeo = new THREE.SphereGeometry(100, 16, 16);

  const posAttr = envGeo.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);
  for (let i = 0; i < posAttr.count; i++) {
    const y = posAttr.getY(i);
    const t = (y / 100 + 1) / 2;
    const col = bottomColor.clone().lerp(topColor, t);
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }
  envGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const envMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide });
  envScene.add(new THREE.Mesh(envGeo, envMat));

  const envMap = pmrem.fromScene(envScene).texture;
  pmrem.dispose();
  envGeo.dispose();
  envMat.dispose();

  return { texture, envMap };
}

/**
 * Creates a texture-based Cannes Lions trophy.
 * PlaneGeometry faces the camera; tier color tints the texture
 * (white background → tier color, trophy detail → darker tier = embossed coin look).
 * Metallic ring frames the trophy.
 */
export function createTrophy(tier: TrophyTier, assets: TrophyAssets): THREE.Group {
  const group = new THREE.Group();
  const cfg = TIER_CONFIG[tier];

  // Compute plane size from texture aspect ratio
  const img = assets.texture.image as HTMLImageElement;
  const aspect = img.width / img.height;
  const planeHeight = TROPHY_HEIGHT;
  const planeWidth = planeHeight * aspect;

  // Trophy image plane: tier color tints texture (white bg → tier color, detail → darker)
  const planeGeo = new THREE.PlaneGeometry(planeWidth, planeHeight);
  const planeMat = new THREE.MeshStandardMaterial({
    map: assets.texture,
    color: cfg.color,
    metalness: 0.35,
    roughness: 0.5,
    envMap: assets.envMap,
    envMapIntensity: 0.6,
    emissive: cfg.color,
    emissiveIntensity: cfg.emissiveIntensity,
    side: THREE.DoubleSide,
  });
  group.add(new THREE.Mesh(planeGeo, planeMat));

  // Metallic ring (uses full metalness/roughness per tier spec)
  const ringRadius = Math.max(planeWidth, planeHeight) / 2 + 4;
  const ringGeo = new THREE.TorusGeometry(ringRadius, 2.5, 8, 32);
  const ringMat = new THREE.MeshStandardMaterial({
    color: cfg.color,
    metalness: cfg.metalness,
    roughness: cfg.roughness * 0.5,
    envMap: assets.envMap,
    envMapIntensity: 1.5,
    emissive: cfg.color,
    emissiveIntensity: cfg.emissiveIntensity * 1.5,
  });
  group.add(new THREE.Mesh(ringGeo, ringMat));

  // Gold tier: extra glow ring
  if (tier === 'gold') {
    const glowGeo = new THREE.TorusGeometry(ringRadius + 4, 1.5, 8, 32);
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      emissive: 0xFFD700,
      emissiveIntensity: 2.0,
      transparent: true,
      opacity: 0.4,
    });
    group.add(new THREE.Mesh(glowGeo, glowMat));
  }

  return group;
}

/** Procedural Cannes Rosé bottle (special rare target) */
export function createRoséBottle(envMap: THREE.Texture): THREE.Group {
  const group = new THREE.Group();
  const rosé = 0xE8899A;

  const glassMat = new THREE.MeshStandardMaterial({
    color: rosé,
    metalness: 0.1,
    roughness: 0.3,
    envMap,
    envMapIntensity: 0.8,
    emissive: rosé,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.85,
  });

  // Body
  const bodyGeo = new THREE.CylinderGeometry(10, 10, 35, 12);
  const body = new THREE.Mesh(bodyGeo, glassMat);
  group.add(body);

  // Shoulder (tapered)
  const shoulderGeo = new THREE.CylinderGeometry(4, 10, 10, 12);
  const shoulder = new THREE.Mesh(shoulderGeo, glassMat);
  shoulder.position.y = 22.5;
  group.add(shoulder);

  // Neck
  const neckGeo = new THREE.CylinderGeometry(4, 4, 15, 8);
  const neck = new THREE.Mesh(neckGeo, glassMat);
  neck.position.y = 35;
  group.add(neck);

  // Gold foil cap
  const capMat = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    metalness: 0.9,
    roughness: 0.2,
    envMap,
    envMapIntensity: 1.5,
    emissive: 0xFFD700,
    emissiveIntensity: 0.4,
  });
  const capGeo = new THREE.CylinderGeometry(5, 5, 4, 8);
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = 44;
  group.add(cap);

  // Cream label on front
  const labelGeo = new THREE.PlaneGeometry(14, 10);
  const labelMat = new THREE.MeshStandardMaterial({
    color: 0xFFF8F0,
    metalness: 0,
    roughness: 0.9,
    side: THREE.DoubleSide,
  });
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.set(0, 0, 10.5);
  group.add(label);

  // Pink glow ring
  const glowGeo = new THREE.TorusGeometry(32, 1.5, 8, 32);
  const glowMat = new THREE.MeshStandardMaterial({
    color: rosé,
    emissive: rosé,
    emissiveIntensity: 1.8,
    transparent: true,
    opacity: 0.35,
  });
  group.add(new THREE.Mesh(glowGeo, glowMat));

  return group;
}

/** Get the hex color for a tier (for fragments, VFX) */
export function getTierColor(tier: TrophyTier): number {
  return TIER_CONFIG[tier].color;
}

export const ROSÉ_COLOR = 0xE8899A;
