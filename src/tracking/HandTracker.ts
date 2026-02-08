import type { MediaPipeHands, HandResults } from '../types';

const MEDIAPIPE_VERSION = '0.4.1646424915';
const CDN_BASE = `https://unpkg.com/@mediapipe/hands@${MEDIAPIPE_VERSION}`;

/**
 * Loads MediaPipe Hands from unpkg CDN with pinned version
 * to prevent WASM version mismatch crashes.
 */
export class HandTracker {
  private hands: MediaPipeHands | null = null;
  private latestResults: HandResults | null = null;
  private processing = false;

  /** Load the CDN script and initialize the model */
  async initialize(onProgress?: (msg: string) => void): Promise<void> {
    onProgress?.('Loading MediaPipe Hands library...');
    await this.loadScript(`${CDN_BASE}/hands.js`);

    if (!window.Hands) {
      throw new Error('MediaPipe Hands failed to load from CDN');
    }

    onProgress?.('Initializing hand detection model...');
    this.hands = new window.Hands({
      locateFile: (file: string) => `${CDN_BASE}/${file}`,
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
    });

    this.hands.onResults((results: HandResults) => {
      this.latestResults = results;
      this.processing = false;
    });

    // Force model download by sending a blank frame
    onProgress?.('Downloading hand detection model...');
    await this.hands.initialize();

    onProgress?.('Hand tracking ready!');
  }

  /**
   * Send a video frame for processing.
   * Wrapped in try-catch for crash safety.
   * Returns immediately if already processing (throttle).
   */
  async detect(video: HTMLVideoElement): Promise<void> {
    if (!this.hands || this.processing) return;

    this.processing = true;
    try {
      await this.hands.send({ image: video });
    } catch (err) {
      console.warn('Hand detection frame error (non-fatal):', err);
      this.processing = false;
    }
  }

  getResults(): HandResults | null {
    return this.latestResults;
  }

  hasHand(): boolean {
    return (
      this.latestResults !== null &&
      this.latestResults.multiHandLandmarks.length > 0
    );
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error(`Failed to load MediaPipe script: ${src}`));
      document.head.appendChild(script);
    });
  }
}
