/**
 * Global type declarations for MediaPipe Hands (CDN loaded)
 * and shared game types.
 */

// MediaPipe Hands types (loaded from unpkg CDN as global)
export interface HandLandmark {
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
  z: number; // depth relative to wrist
}

export interface HandResults {
  multiHandLandmarks: HandLandmark[][];
  multiHandedness: { label: string; score: number }[];
  image: HTMLVideoElement;
}

export interface MediaPipeHandsOptions {
  locateFile: (file: string) => string;
}

export interface MediaPipeHands {
  setOptions(options: {
    maxNumHands: number;
    modelComplexity: number;
    minDetectionConfidence: number;
    minTrackingConfidence: number;
  }): void;
  onResults(callback: (results: HandResults) => void): void;
  send(input: { image: HTMLVideoElement }): Promise<void>;
  initialize(): Promise<void>;
}

export interface MediaPipeHandsConstructor {
  new (options: MediaPipeHandsOptions): MediaPipeHands;
}

declare global {
  interface Window {
    Hands: MediaPipeHandsConstructor;
  }
}

// Game types
export interface ScreenPosition {
  x: number; // screen pixels
  y: number; // screen pixels
}

export interface GestureState {
  isPistol: boolean;
  aimPosition: ScreenPosition | null;
  handBase: ScreenPosition | null;
  triggered: boolean; // true on frame thumb goes down
}

export interface DiscData {
  id: number;
  velocity: { x: number; y: number };
  alive: boolean;
}
