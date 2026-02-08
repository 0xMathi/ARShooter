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

/** Get the hex color for a tier (for fragments, VFX) */
export function getTierColor(tier: TrophyTier): number {
  return TIER_CONFIG[tier].color;
}
