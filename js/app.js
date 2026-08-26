/**
 * Gesture Ninja - Main Application Entry Point
 * Initializes all game subsystems and connects hand tracking, landing page, and canvas gameplay.
 */

import { Renderer } from './renderer.js';
import { GameEngine } from './gameEngine.js';
import { HandTracker } from './handTracker.js';
import { UIController } from './uiController.js';
import { sound } from './audio.js';

class App {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.video = document.getElementById('webcam-video');
    this.pipCanvas = document.getElementById('pip-preview-canvas');

    this.renderer = null;
    this.engine = null;
    this.handTracker = null;
    this.ui = null;

    this.isMouseMode = false;
    this.isMouseDown = false;
  }

  async init() {
    // 1. Initialize Renderer
    this.renderer = new Renderer(this.canvas);

    // 2. Initialize Game Engine
    this.engine = new GameEngine(this.renderer);

    // 3. Initialize UI Controller
    this.ui = new UIController();

    // 4. Initialize Hand Tracker
    this.handTracker = new HandTracker(this.video, this.pipCanvas);

    // Setup Event Listeners and Callbacks
    this.bindEngineCallbacks();
    this.bindUICallbacks();
    this.bindHandTrackerCallbacks();
    this.bindInputListeners();

    // Handle window resize
    window.addEventListener('resize', () => {
      this.renderer.resize();
    });

    // Start background render loop
    this.engine.startLoop();

    // Initialize display values & Landing Page
    this.ui.updateScore(0, this.engine.highScore, false);
    this.ui.showLandingPage();

    // Setup hero canvas animation on landing page
    this.initHeroCanvasAnimation();
  }

  async startCameraTracking() {
    try {
      await this.handTracker.start();
    } catch (err) {
      console.warn('Camera could not start automatically:', err);
    }
  }

  bindEngineCallbacks() {
    this.engine.onScoreUpdate = (score, highScore, isNewHigh) => {
      this.ui.updateScore(score, highScore, isNewHigh);
    };

    this.engine.onLivesUpdate = (lives) => {
      this.ui.updateLives(lives);
    };

    this.engine.onTimerUpdate = (formattedTime, secondsRemaining, ratio) => {
      this.ui.updateTimer(formattedTime, secondsRemaining, ratio);
    };

    this.engine.onDifficultyUpdate = (tierName, tierColor, progress) => {
      this.ui.updateDifficulty(tierName, tierColor, progress);
    };

    this.engine.onComboUpdate = (count, label, multiplier, color) => {
      this.ui.updateCombo(count, label, multiplier, color);
    };

    this.engine.onGameOver = (stats) => {
      this.ui.showGameOver(stats);
    };
  }

  bindUICallbacks() {
    this.ui.onScreenChange = (screen) => {
      if (screen !== 'LANDING') {
        // Ensure canvas dimensions are accurately measured upon showing container
        requestAnimationFrame(() => {
          this.renderer.resize();
        });
      }
    };

    this.ui.onPlayNow = () => {
      sound.resume();
      this.startCameraTracking();
      requestAnimationFrame(() => {
        this.renderer.resize();
      });
    };

    this.ui.onStartGame = () => {
      sound.resume();
      this.renderer.resize();
      this.ui.showInGameHUD();
      this.engine.startGame();
      if (!this.handTracker.isRunning) {
        this.handTracker.start();
      }
    };

    this.ui.onRestartGame = () => {
      sound.resume();
      this.renderer.resize();
      this.ui.showInGameHUD();
      this.engine.startGame();
    };

    this.ui.onBackToHome = () => {
      sound.resume();
      this.engine.state = 'MENU';
      this.ui.showLandingPage();
    };

    this.ui.onCalibrateRequest = () => {
      if (!this.handTracker.isRunning) {
        this.handTracker.start();
      }
    };

    this.ui.onToggleMouseMode = (enabled) => {
      this.isMouseMode = enabled;
    };
  }

  bindHandTrackerCallbacks() {
    this.handTracker.onStatusChange = (statusObj) => {
      this.ui.updateTrackingStatus(statusObj);
    };

    this.handTracker.onHandMove = ({ normalizedX, normalizedY }) => {
      if (!this.isMouseMode) {
        this.engine.processHandPosition(normalizedX, normalizedY);
      }
    };
  }

  bindInputListeners() {
    // Mouse fallback tracking on Canvas
    const handlePointerMove = (e) => {
      if (!this.isMouseMode && !this.isMouseDown) return;
      const rect = this.canvas.getBoundingClientRect();
      const normX = (e.clientX - rect.left) / Math.max(1, rect.width);
      const normY = (e.clientY - rect.top) / Math.max(1, rect.height);
      this.engine.processHandPosition(normX, normY);
    };

    this.canvas.addEventListener('mousemove', (e) => {
      handlePointerMove(e);
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      sound.resume();
      handlePointerMove(e);
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    // Touch events for mobile/tablets
    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const normX = (touch.clientX - rect.left) / Math.max(1, rect.width);
        const normY = (touch.clientY - rect.top) / Math.max(1, rect.height);
        this.engine.processHandPosition(normX, normY);
      }
    }, { passive: true });

    this.canvas.addEventListener('touchstart', (e) => {
      sound.resume();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const normX = (touch.clientX - rect.left) / Math.max(1, rect.width);
        const normY = (touch.clientY - rect.top) / Math.max(1, rect.height);
        this.engine.processHandPosition(normX, normY);
      }
    }, { passive: true });

    // Global click unlocks AudioContext on first user interaction
    window.addEventListener('click', () => {
      sound.resume();
    }, { once: true });
  }

  /**
   * Subtle ambient hero animated canvas
   */
  initHeroCanvasAnimation() {
    const heroCanvas = document.getElementById('hero-ambient-canvas');
    if (!heroCanvas) return;
    const ctx = heroCanvas.getContext('2d');
    let t = 0;

    const resizeHero = () => {
      if (heroCanvas.parentElement) {
        heroCanvas.width = heroCanvas.parentElement.clientWidth;
        heroCanvas.height = heroCanvas.parentElement.clientHeight;
      }
    };
    resizeHero();
    window.addEventListener('resize', resizeHero);

    const animateHero = () => {
      const landing = document.getElementById('landing-page');
      if (landing && landing.classList.contains('hidden')) {
        requestAnimationFrame(animateHero);
        return;
      }

      t += 0.02;
      const w = heroCanvas.width || 380;
      const h = heroCanvas.height || 380;
      ctx.clearRect(0, 0, w, h);

      // Draw subtle glowing animated slash arc
      const cx = w * 0.5 + Math.sin(t * 1.5) * (w * 0.25);
      const cy = h * 0.5 + Math.cos(t * 2) * (h * 0.2);

      const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 140);
      grad.addColorStop(0, 'rgba(0, 240, 255, 0.2)');
      grad.addColorStop(0.5, 'rgba(255, 0, 127, 0.08)');
      grad.addColorStop(1, 'transparent');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Arc blade slash trail
      ctx.beginPath();
      ctx.moveTo(cx - 80, cy - 60);
      ctx.quadraticCurveTo(cx, cy + 50, cx + 80, cy - 20);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 4;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00F0FF';
      ctx.stroke();

      requestAnimationFrame(animateHero);
    };

    requestAnimationFrame(animateHero);
  }
}

// Bootstrap once DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
