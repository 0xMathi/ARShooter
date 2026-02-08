/**
 * AR Shooter - Entry Point
 */

import { SceneManager } from './engine/SceneManager';
import { HandTracker } from './tracking/HandTracker';
import { GestureDetector } from './tracking/GestureDetector';
import { DiscManager } from './game/DiscManager';
import { loadTrophyAssets } from './game/TrophyBuilder';
import { ShootingSystem } from './game/ShootingSystem';
import { ScoreManager } from './game/ScoreManager';
import { GameManager } from './game/GameManager';
import { LoadingOverlay } from './ui/LoadingOverlay';
import { HUD } from './ui/HUD';
import { VFXText } from './ui/VFXText';
import { StartScreen } from './ui/StartScreen';
import { GameOverScreen } from './ui/GameOverScreen';
import { SoundManager } from './audio/SoundManager';
import { MusicSequencer } from './audio/MusicSequencer';

const DETECTION_INTERVAL = 2; // ~30fps detection for snappier tracking

async function init(): Promise<void> {
  const loading = new LoadingOverlay();

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
      if (msg.includes('library')) loading.setProgress(50);
      if (msg.includes('Initializing')) loading.setProgress(60);
      if (msg.includes('Downloading')) loading.setProgress(70);
      if (msg.includes('ready')) loading.setProgress(95);
    });
    loading.setProgress(100);

    loading.setStatus('Loading trophy assets...');
    const trophyAssets = await loadTrophyAssets(sceneManager.renderer);

    const gestureDetector = new GestureDetector();
    const discManager = new DiscManager(sceneManager, trophyAssets);
    const shootingSystem = new ShootingSystem(sceneManager);
    const scoreManager = new ScoreManager();
    const soundManager = new SoundManager();
    const music = new MusicSequencer(soundManager);
    const hud = new HUD();
    const vfxText = new VFXText();
    const gameManager = new GameManager(scoreManager, discManager);
    const gameOverScreen = new GameOverScreen();

    loading.hide();
    let startScreen: StartScreen | null = new StartScreen();

    // --- Game Over handler ---
    gameManager.setOnGameOver(() => {
      music.stop();
      soundManager.playGameOver();
      gameOverScreen.show(scoreManager.getScore(), scoreManager.getMaxCombo());
    });

    // --- Input ---
    let tapPosition: { x: number; y: number } | null = null;

    window.addEventListener('pointerdown', (e) => {
      const state = gameManager.getState();

      if (state === 'IDLE') {
        // Tap to start
        gameManager.startGame();
        music.start();
        if (startScreen) {
          startScreen.hide();
          startScreen = null;
        }
      } else if (state === 'GAME_OVER') {
        // Tap to restart
        gameOverScreen.hide();
        gameManager.restart();
        discManager.dispose();
        gestureDetector.reset();
        // Show start screen again
        startScreen = new StartScreen();
      } else {
        // Playing - tap to shoot
        tapPosition = { x: e.clientX, y: e.clientY };
      }
    });

    let lastAim: { x: number; y: number } | null = null;
    let lastTime = performance.now();
    let frameCount = 0;
    let pistolHeldFrames = 0;
    let hitStopUntil = 0; // timestamp when hit stop ends

    const HIT_STOP_DURATION = 60; // ms

    // Trophy tier scoring: Gold=5x, Silver=2x, Bronze=1x
    const TIER_SCORE: Record<string, number> = { gold: 5, silver: 2, bronze: 1 };
    const TIER_VFX_COLOR: Record<string, string> = {
      gold: '#FFD700',
      silver: '#D8D8D8',
      bronze: '#CD7F32',
    };

    /** Central shoot function */
    function shoot(x: number, y: number): void {
      soundManager.playShoot();

      const hit = discManager.checkHit(x, y);
      if (hit) {
        const tierMult = TIER_SCORE[hit.tier];
        const result = scoreManager.hit(tierMult);
        soundManager.playHit();
        vfxText.hit(hit.x, hit.y, result.points, result.combo, TIER_VFX_COLOR[hit.tier]);
        sceneManager.shake(6 + Math.min(result.combo, 10));
        hitStopUntil = performance.now() + HIT_STOP_DURATION;
        hud.popScore();
        if (result.combo > 1) hud.popCombo();
        if (result.combo > 0 && result.combo % 5 === 0) {
          soundManager.playCombo();
          hud.popMulti();
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

      const state = gameManager.getState();

      // --- IDLE: waiting for start ---
      if (state === 'IDLE') {
        // Pistol gesture can also start the game
        if (gesture.isPistol) pistolHeldFrames++;
        else pistolHeldFrames = Math.max(0, pistolHeldFrames - 1);

        if (pistolHeldFrames >= 8) {
          pistolHeldFrames = 0;
          gameManager.startGame();
          music.start();
          if (startScreen) {
            startScreen.hide();
            startScreen = null;
          }
        }

        // Show crosshair even on start screen for feedback
        if (gesture.aimPosition && gesture.handBase) {
          shootingSystem.update(gesture.aimPosition, gesture.handBase, []);
        } else {
          shootingSystem.hide();
        }

        sceneManager.render();
        requestAnimationFrame(gameLoop);
        return;
      }

      // --- GAME_OVER: frozen ---
      if (state === 'GAME_OVER') {
        shootingSystem.hide();
        sceneManager.render();
        requestAnimationFrame(gameLoop);
        return;
      }

      // === PLAYING ===
      const frozen = performance.now() < hitStopUntil;

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

      // During hit stop: skip game updates but still render
      if (!frozen) {
        gameManager.update(dt);
        discManager.update(dt);
      }

      hud.update(scoreManager, gameManager.getTimeRemaining());
      sceneManager.render();
      requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    loading.showError(msg);
    console.error('AR Shooter init failed:', err);
  }
}

init();
