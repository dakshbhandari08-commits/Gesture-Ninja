# 🗡️ Gesture Ninja

> **"Your hand is the blade."**  
> A cutting-edge, browser-based cyber blade game where players use real-time webcam hand tracking to slice flying targets, chain combos, and dodge hazardous cyber mines within a high-stakes 90-second arcade match.

Built as an interactive portfolio project for college recruitment demonstrations.

---

## 🌟 Key Features

- **Portfolio Landing Page**: Complete interactive showcase before entering the arena with feature cards, 3-step onboarding, and technical architecture badges.
- **Real-Time Hand Tracking**: Powered by Google MediaPipe Hands with WebAssembly and GPU acceleration.
- **90-Second Match Countdown**: Exact 1 minute 30 second session timer with smooth progressive difficulty scaling.
- **Progressive Difficulty Curve (0 to 90s)**:
  - `EASY` (0–20s): Slow targets, gentle launches, perfect for hand tracking calibration.
  - `MEDIUM` (20–40s): Increasing velocity and multi-target tosses.
  - `HARD` (40–60s): Fast-paced waves, tighter combo windows, and cyber mines.
  - `VERY FAST` (60–75s): Rapid multi-spawns and dense target patterns.
  - `INSANE` (75–90s): Maximum speed final challenge for peak score attacks.
- **Natural Blade Physics**: Index finger and palm motion are mirrored and smoothed, turning your hand into a glowing cyber katana.
- **Velocity-Driven Slash Mechanics**: Detects rapid direction changes (left, right, up, down, diagonal) with dynamic stroke interpolation.
- **Diverse Target Classes**:
  - **Cyber Fruits / Orbs**: Normal targets worth 100 points, bisecting into two tumbling halves when sliced.
  - **Golden Matrix Cores**: Rare radiant targets yielding 300 points and sparking high-energy frenzy.
  - **Spiked Cyber Mines (Bombs)**: Pulsating hazard mines with ticking fuses that detonate upon impact and deplete shields.
- **Combo & Multiplier System**: Multi-slice chains within rapid windows unlock visual titles (**NICE!**, **GREAT!**, **SUPERB!**, **PERFECT!**, **GODLIKE!**) with scaling score multipliers.
- **Procedural Sound Engine**: Synthesizes all audio effects (blade whooshes, impacts, golden chimes, explosions, fanfares) in real-time with zero external audio files using the Web Audio API.
- **Detailed Results Screen**: Displays **YOUR SCORE**, **BEST SCORE**, 🏆 **NEW HIGH SCORE!**, **MAX COMBO**, **TARGETS SLICED**, and **TIME PLAYED**.
- **Hybrid Input Support**: Includes a one-click **Mouse / Touch Mode** toggle for quick evaluation on laptops without webcam access.

---

## 🚀 How to Run Locally

### Option 1: Using npx / Node.js (Recommended)

Run a local development server in the project folder:

```bash
# Start local server on port 3000
npx serve . -l 3000
```

Open your browser and navigate to:
```
http://localhost:3000
```

### Option 2: Using Python 3

```bash
python -m http.server 3000
```

Then visit `http://localhost:3000` in your web browser.

### Option 3: VS Code Live Server Extension
Open the folder in VS Code, right-click `index.html`, and select **"Open with Live Server"**.

---

## 🎮 Game Flow

1. **Portfolio Landing Page** → Explore features, tech stack, and personal best score.
2. Click **PLAY NOW** → Camera access & hand calibration.
3. Click **START 90s MATCH** → Enter the arena.
4. **Slice Targets & Dodge Mines** → Survive 90 seconds while difficulty ramps up from `EASY` to `INSANE`.
5. **Results Screen** → View score breakdown, high score celebrations, and choose **PLAY AGAIN** or **BACK TO HOME**.

---

## 🛠️ Architecture & Tech Stack

```
Gesture Ninja/
├── index.html              # Landing page, Canvas arena, HUD, Modals
├── package.json            # Dev server configuration
├── styles/
│   ├── main.css            # Landing page design system, typography, neon buttons
│   └── hud.css             # 90s HUD timer, difficulty badge, results screen
└── js/
    ├── config.js           # 90s round config, progressive difficulty curves
    ├── audio.js            # Web Audio API procedural sound synthesizer
    ├── particles.js        # Spark bursts, slice juice, shockwaves, floating text
    ├── target.js           # Target classes (Normal, Golden, Bomb) with 2-half slice geometry
    ├── handTracker.js      # MediaPipe Hands integration, coordinate mirroring & smoothing
    ├── gestureDetector.js  # Velocity detection, directional slashes, trail buffers
    ├── renderer.js         # Canvas 2D engine, high-DPI scaling, neon blade splines
    ├── gameEngine.js       # 90s loop, difficulty ramping, continuous collision, combos
    ├── uiController.js     # Landing page controller, screen transitions, HUD updates
    └── app.js              # Application entrypoint and subsystem bootstrap
```

---

## 📜 License
MIT License. Created for portfolio and educational demonstrations.
