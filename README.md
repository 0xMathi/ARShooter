# THE BIG LIE

### An AR shooter for people who are tired of bought awards.

> *"Congratulations on your Gold Lion! That'll be €28,000."*

**The Big Lie** is a browser-based augmented reality arcade game where you shoot Cannes Lions trophies out of the sky with your bare hand. No controller. No app download. Just your webcam, a pistol gesture, and deep-seated resentment toward the advertising awards industry.

## [Play Now](https://thebiglie.vercel.app)

---

## How It Works

1. Open the link on Chrome (desktop or mobile)
2. Allow camera access (we promise we're not judging your home office)
3. Form a pistol with your hand (index finger out, curl the rest)
4. Aim at the flying trophies
5. Pull your thumb to shoot
6. Question every award you've ever won

## What You're Shooting

| Target | Points | Spawn |
|--------|--------|-------|
| Bronze Lion | 100 | Common (like participation trophies) |
| Silver Lion | 250 | Uncommon |
| Gold Lion | 500 | Rare (like actual good work at Cannes) |
| Rose Bottle | 1000 | Every 15s (the real Cannes currency) |

## Rank System

Your final score determines your sarcastic Cannes rank:

| Score | Rank | Reality |
|-------|------|---------|
| 0 | Intern | You carried the portfolio |
| 500+ | Junior Creative | You made the deck |
| 2000+ | Mid-Level Creative | You had the idea but your CD took credit |
| 5000+ | Senior Creative | You've bought drinks at the Gutter Bar |
| 10000+ | Creative Director | You presented someone else's work on stage |
| 20000+ | Chief Creative Officer | You haven't opened Figma since 2019 |
| 40000+ | Jury President | You ARE the system |

## Tech Stack

- **Hand Tracking**: MediaPipe Vision Tasks
- **3D Rendering**: Three.js (orthographic overlay on camera feed)
- **Audio**: FM synthesis (no audio files, everything procedurally generated)
- **Music**: 130 BPM chiptune step sequencer
- **Leaderboard**: Supabase (PostgreSQL)
- **Build**: Vite + TypeScript
- **Vibes**: NES title screen aesthetic, Neo Geo HUD, envelope ceremony game over

## Features Nobody Asked For

- Hit stop on every kill (60ms freeze, because game feel matters)
- Screen shake with exponential decay
- Muzzle flash from your actual hand position
- Emoji confetti explosions on Gold kills
- A game over screen that looks like an awards envelope being opened
- Shareable meme card generation
- A chiptune soundtrack that slaps harder than your last brief

## Running Locally

```bash
npm install
npm run dev
```

Open `localhost:5173` in Chrome. You need a webcam.

## Disclaimer

No actual Cannes Lions were harmed in the making of this game. The festival does that to itself.

---

*Built with mass-resignation energy at 2 AM.*
