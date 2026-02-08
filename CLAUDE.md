# AR Shooter - Project Context & Rules

## Project Overview
AR Shooter is a browser-based Augmented Reality shooting game using the device camera with face/body tracking.
Built for Chrome with Three.js and MediaPipe.

## Architecture
- **Engine:** Three.js for 3D rendering (enemies, effects, projectiles)
- **Tracking:** MediaPipe Vision Tasks for face and pose detection
- **Audio:** Howler.js for sound effects
- **Build:** Vite + TypeScript
- **Target:** Chrome desktop & mobile

## Directory Structure
- `src/` - All source code
  - `engine/` - Three.js scene, renderer, camera
  - `tracking/` - MediaPipe face/pose detection
  - `game/` - Game logic, enemies, spawning, scoring
  - `ui/` - HUD, menus, overlays
  - `audio/` - Sound management
  - `utils/` - Shared helpers

## Coding Conventions
- TypeScript strict mode
- English variable names and code comments
- Modular ES imports, no barrel files
- Game loop via requestAnimationFrame
- All MediaPipe runs in async with proper cleanup

## Key Design Decisions
- Camera feed rendered as background (video element behind canvas)
- Three.js canvas overlays the video with transparency
- MediaPipe landmarks mapped to Three.js world coordinates
- Enemy spawning system with wave-based difficulty scaling

## Bash & Shell Guidelines
- DO NOT pipe output through `head`, `tail`, `less`, or `more`
- Use `git log --oneline -N` for git history
