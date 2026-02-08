import type { ScoreManager } from './ScoreManager';
import type { DiscManager } from './DiscManager';

export type GameState = 'IDLE' | 'PLAYING' | 'GAME_OVER';

const ROUND_DURATION = 60; // seconds

/**
 * Manages the game state machine and round timer.
 * States: IDLE → PLAYING → GAME_OVER → IDLE (restart)
 */
export class GameManager {
  private state: GameState = 'IDLE';
  private timeRemaining = ROUND_DURATION;
  private scoreManager: ScoreManager;
  private discManager: DiscManager;
  private onGameOver: (() => void) | null = null;

  constructor(scoreManager: ScoreManager, discManager: DiscManager) {
    this.scoreManager = scoreManager;
    this.discManager = discManager;
  }

  setOnGameOver(callback: () => void): void {
    this.onGameOver = callback;
  }

  startGame(): void {
    if (this.state === 'PLAYING') return;

    this.state = 'PLAYING';
    this.timeRemaining = ROUND_DURATION;
    this.scoreManager.reset();
    this.discManager.start();
  }

  update(dt: number): void {
    if (this.state !== 'PLAYING') return;

    this.timeRemaining -= dt;

    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.endGame();
    }
  }

  endGame(): void {
    if (this.state !== 'PLAYING') return;

    this.state = 'GAME_OVER';
    this.onGameOver?.();
  }

  restart(): void {
    this.state = 'IDLE';
  }

  getState(): GameState {
    return this.state;
  }

  getTimeRemaining(): number {
    return this.timeRemaining;
  }
}
