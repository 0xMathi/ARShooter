/**
 * AR Shooter - Entry Point
 */

import { SceneManager } from './engine/SceneManager';
import { HandTracker } from './tracking/HandTracker';
import { GestureDetector } from './tracking/GestureDetector';
import { DiscManager } from './game/DiscManager';
import { ShootingSystem } from './game/ShootingSystem';
import { ScoreManager } from './game/ScoreManager';
import { LoadingOverlay } from './ui/LoadingOverlay';
import { HUD } from './ui/HUD';
import { VFXText } from './ui/VFXText';
import { StartScreen } from './ui/StartScreen';
import { SoundManager } from './audio/SoundManager';

const DETECTION_INTERVAL = 2; // ~30fps detection for snappier tracking

function createDebugHUD(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = `
    position:fixed; top:60px; right:10px;
    background:rgba(0,0,0,0.85); color:#0f0;
    font:12px/1.5 monospace; padding:8px 12px;
    border-radius:6px; z-index:9999;
    white-space:pre; pointer-events:none;
  `;
  document.body.appendChild(el);
  return el;
}

async function init(): Promise<void> {
  const loading = new LoadingOverlay();
  const debugHUD = createDebugHUD();
  debugHUD.textContent = 'initializing...';

  try {
    const video = document.getElementById('camera-feed') as HTMLVideoElement;
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!video || !canvas) throw new Error('Required DOM elements not found');

    loading.setStatus('Requesting camera access...');
    loading.setProgress(10);
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 1280, height: 720 },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();
    loading.setProgress(30);

    loading.setStatus('Setting up renderer...');
    loading.setProgress(40);
    const sceneManager = new SceneManager(canvas);

    const handTracker = new HandTracker();
    await handTracker.initialize((msg) => {
      loading.setStatus(msg);
      debugHUD.textContent = msg;
      if (msg.includes('library')) loading.setProgress(50);
      if (msg.includes('Initializing')) loading.setProgress(60);
      if (msg.includes('Downloading')) loading.setProgress(70);
      if (msg.includes('ready')) loading.setProgress(95);
    });
    loading.setProgress(100);

    const gestureDetector = new GestureDetector();
    const discManager = new DiscManager(sceneManager);
    const shootingSystem = new ShootingSystem(sceneManager);
    const scoreManager = new ScoreManager();
    const soundManager = new SoundManager();
    const hud = new HUD();
    const vfxText = new VFXText();

    loading.hide();
    const startScreen = new StartScreen();

    // --- Input ---
    let tapPosition: { x: number; y: number } | null = null;
    let tapToStart = false;
    let gameStarted = false;

    window.addEventListener('pointerdown', (e) => {
      if (!gameStarted) {
        tapToStart = true;
      } else {
        tapPosition = { x: e.clientX, y: e.clientY };
      }
    });

    let lastAim: { x: number; y: number } | null = null;
    let lastTime = performance.now();
    let frameCount = 0;
    let pistolHeldFrames = 0;
    let shotsFired = 0;

    /** Central shoot function */
    function shoot(x: number, y: number): void {
      shotsFired++;
      soundManager.playShoot();

      const hit = discManager.checkHit(x, y);
      if (hit) {
        const result = scoreManager.hit();
        soundManager.playHit();
        vfxText.hit(hit.x, hit.y, result.points, result.combo);
        if (result.combo > 0 && result.combo % 5 === 0) {
          soundManager.playCombo();
        }
      } else {
        scoreManager.miss();
        soundManager.playMiss();
        vfxText.miss(x, y);
      }
    }

    function gameLoop(): void {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      frameCount++;

      // Throttled hand detection
      if (frameCount % DETECTION_INTERVAL === 0) {
        handTracker.detect(video);
      }

      const results = handTracker.getResults();
      const { width, height } = sceneManager.getSize();

      const gesture = gestureDetector.detect(
        results?.multiHandLandmarks?.[0] ?? null,
        width,
        height
      );

      // Track aim
      if (gesture.aimPosition) {
        lastAim = { ...gesture.aimPosition };
      }

      // Debug panel
      const dbg = gestureDetector.debugInfo();
      debugHUD.textContent =
        `hand: ${dbg.hasHand ? 'YES' : 'NO'}\n` +
        `PISTOL: ${dbg.isPistol ? 'YES' : 'no'} (idx:${dbg.indexExtended ? 'Y' : 'n'} curl:${dbg.curledCount}/3)\n` +
        `thumb angle: ${dbg.thumbAngle.toFixed(0)}° ${dbg.thumbAngle < 155 ? 'FIRE!' : '(bend to fire)'}\n` +
        `trigger: ${dbg.triggered ? '>>> BANG <<<' : '-'}\n` +
        `shots: ${shotsFired}  score: ${scoreManager.getScore()}`;

      // Start screen
      if (!gameStarted) {
        if (gesture.isPistol) pistolHeldFrames++;
        else pistolHeldFrames = Math.max(0, pistolHeldFrames - 1);

        if (pistolHeldFrames >= 8 || tapToStart) {
          gameStarted = true;
          tapToStart = false;
          startScreen.hide();
          discManager.start();
        }

        if (gesture.aimPosition && gesture.handBase) {
          shootingSystem.update(gesture.aimPosition, gesture.handBase, []);
        } else {
          shootingSystem.hide();
        }

        sceneManager.render();
        requestAnimationFrame(gameLoop);
        return;
      }

      // === Active gameplay ===

      const discPositions = discManager.getDiscPositions();
      const finalAim = shootingSystem.update(
        gesture.aimPosition,
        gesture.handBase,
        discPositions
      );

      // 1. Gesture trigger (thumb pull) - uses lastAim if pistol briefly breaks
      if (gesture.triggered) {
        const aim = finalAim ?? lastAim;
        if (aim) shoot(aim.x, aim.y);
      }

      // 2. Tap-to-shoot: fire at tap position directly
      if (tapPosition) {
        shoot(tapPosition.x, tapPosition.y);
        tapPosition = null;
      }

      discManager.update(dt);
      hud.update(scoreManager);
      sceneManager.render();
      requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    loading.showError(msg);
    debugHUD.textContent = 'ERROR: ' + msg;
    console.error('AR Shooter init failed:', err);
  }
}

init();
