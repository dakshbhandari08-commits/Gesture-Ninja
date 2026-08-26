/**
 * Gesture Ninja - Core Game Engine
 * Manages 90-second game timer, progressive difficulty ramping, target spawner,
 * continuous collision detection, combo multipliers, and game lifecycle.
 */

import { CONFIG } from './config.js';
import { Target } from './target.js';
import { GestureDetector } from './gestureDetector.js';
import { ParticleSystem } from './particles.js';
import { sound } from './audio.js';

export class GameEngine {
  constructor(renderer) {
    this.renderer = renderer;
    this.gestureDetector = new GestureDetector();
    this.particleSystem = new ParticleSystem();

    this.state = 'MENU'; // 'MENU', 'PLAYING', 'GAMEOVER', 'PAUSED'
    this.score = 0;
    this.highScore = this.loadHighScore();
    this.previousHighScore = this.highScore;
    this.isNewHighScore = false;
    this.lives = CONFIG.GAME.INITIAL_LIVES;

    // 90-second match timer
    this.timeRemaining = CONFIG.GAME.ROUND_DURATION_SEC;
    this.gameTime = 0; // Elapsed time (0 to 90s)
    this.targets = [];

    // Session statistics
    this.targetsSliced = 0;
    this.maxCombo = 0;

    // Spawner timers
    this.spawnTimer = 0;
    this.nextSpawnInterval = 1600;

    // Combo system
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboMultiplier = 1.0;
    this.currentComboTier = null;

    // Current difficulty tier
    this.currentTier = CONFIG.GAME.DIFFICULTY_TIERS[0];

    // Callbacks for UI updates
    this.onScoreUpdate = null;
    this.onLivesUpdate = null;
    this.onComboUpdate = null;
    this.onTimerUpdate = null;
    this.onDifficultyUpdate = null;
    this.onGameOver = null;

    // Animation frame handle
    this.lastFrameTime = 0;
    this.animationFrameId = null;
  }

  loadHighScore() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.HIGH_SCORE);
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch (e) {
      return 0;
    }
  }

  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.isNewHighScore = true;
      try {
        localStorage.setItem(CONFIG.STORAGE_KEYS.HIGH_SCORE, this.highScore.toString());
      } catch (e) {}
    }
  }

  formatTime(seconds) {
    const s = Math.max(0, Math.ceil(seconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  startGame() {
    this.state = 'PLAYING';
    this.score = 0;
    this.previousHighScore = this.loadHighScore();
    this.highScore = this.previousHighScore;
    this.isNewHighScore = false;
    this.lives = CONFIG.GAME.INITIAL_LIVES;
    
    // Reset 90-second timer and session metrics
    this.timeRemaining = CONFIG.GAME.ROUND_DURATION_SEC;
    this.gameTime = 0;
    this.targetsSliced = 0;
    this.maxCombo = 0;

    this.targets.length = 0;
    this.spawnTimer = 0;
    this.nextSpawnInterval = 1500;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboMultiplier = 1.0;
    this.currentComboTier = null;
    this.currentTier = CONFIG.GAME.DIFFICULTY_TIERS[0];

    this.particleSystem.reset();
    this.gestureDetector.reset();

    if (this.onScoreUpdate) this.onScoreUpdate(this.score, this.highScore, this.isNewHighScore);
    if (this.onLivesUpdate) this.onLivesUpdate(this.lives);
    if (this.onComboUpdate) this.onComboUpdate(0, '', 1.0, null);
    if (this.onTimerUpdate) this.onTimerUpdate(this.formatTime(this.timeRemaining), this.timeRemaining, 1.0);
    if (this.onDifficultyUpdate) this.onDifficultyUpdate(this.currentTier.name, this.currentTier.color, 0);

    sound.playClick();
  }

  endGame(reason = 'TIMEOUT') {
    if (this.state === 'GAMEOVER') return;
    this.state = 'GAMEOVER';
    this.timeRemaining = Math.max(0, this.timeRemaining);
    this.saveHighScore();
    sound.playGameOver();

    if (this.onGameOver) {
      this.onGameOver({
        score: this.score,
        highScore: this.highScore,
        isNewHighScore: this.isNewHighScore || (this.score > this.previousHighScore && this.score > 0),
        maxCombo: this.maxCombo,
        targetsSliced: this.targetsSliced,
        survivedTime: Math.min(CONFIG.GAME.ROUND_DURATION_SEC, Math.floor(this.gameTime)),
        reason, // 'TIMEOUT' or 'LIVES_DEPLETED'
      });
    }
  }

  /**
   * Process hand tracking coordinates
   */
  processHandPosition(normalizedX, normalizedY) {
    const canvasX = normalizedX * this.renderer.width;
    const canvasY = normalizedY * this.renderer.height;
    this.gestureDetector.addPoint(canvasX, canvasY);
  }

  /**
   * Calculate current difficulty tier and progressive factors
   */
  getCurrentDifficultyParams() {
    const elapsed = Math.min(CONFIG.GAME.ROUND_DURATION_SEC, this.gameTime);
    const progress = elapsed / CONFIG.GAME.ROUND_DURATION_SEC; // 0.0 to 1.0

    // Find active tier
    let activeTier = CONFIG.GAME.DIFFICULTY_TIERS[0];
    for (const tier of CONFIG.GAME.DIFFICULTY_TIERS) {
      if (elapsed >= tier.minSec && elapsed < tier.maxSec) {
        activeTier = tier;
        break;
      }
      if (elapsed >= tier.maxSec) {
        activeTier = tier;
      }
    }

    if (activeTier.name !== this.currentTier.name) {
      this.currentTier = activeTier;
      if (this.onDifficultyUpdate) {
        this.onDifficultyUpdate(activeTier.name, activeTier.color, progress);
      }
    }

    // Continuous smooth interpolation between tiers
    const tierDuration = Math.max(1, activeTier.maxSec - activeTier.minSec);
    const tierProgress = Math.min(1.0, Math.max(0, (elapsed - activeTier.minSec) / tierDuration));

    return {
      tier: activeTier,
      progress,
      tierProgress,
      speedMult: activeTier.speedMult + tierProgress * 0.08,
      multiSpawnChance: activeTier.multiSpawnChance + tierProgress * 0.1,
      bombChance: activeTier.bombChance,
      spawnIntervalMin: activeTier.spawnIntervalMin,
      spawnIntervalMax: activeTier.spawnIntervalMax,
    };
  }

  /**
   * Main game physics and logic update
   */
  update(dt, now) {
    if (this.state !== 'PLAYING') {
      // Update ambient particles & renderer during menu or gameover
      this.particleSystem.update(dt);
      this.renderer.update(dt);
      this.gestureDetector.update(dt, now);
      return;
    }

    // 90-Second Match Countdown
    this.gameTime += dt;
    this.timeRemaining -= dt;

    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      if (this.onTimerUpdate) {
        this.onTimerUpdate('00:00', 0, 0);
      }
      this.endGame('TIMEOUT');
      return;
    }

    // Update Timer UI
    if (this.onTimerUpdate) {
      const formatted = this.formatTime(this.timeRemaining);
      const ratio = this.timeRemaining / CONFIG.GAME.ROUND_DURATION_SEC;
      this.onTimerUpdate(formatted, this.timeRemaining, ratio);
    }

    this.renderer.update(dt);
    this.particleSystem.update(dt);
    this.gestureDetector.update(dt, now);

    // Update combo timer decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt * 1000;
      if (this.comboTimer <= 0) {
        this.resetCombo();
      }
    }

    // Spawn flying targets based on progressive difficulty
    this.updateSpawner(dt);

    // Update target physics
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const target = this.targets[i];
      target.update(dt, this.renderer.height);
      if (target.isDead) {
        this.targets.splice(i, 1);
      }
    }

    // Check collisions with active Katana blade segment
    this.checkCollisions();
  }

  /**
   * Spawn waves of targets with progressive difficulty
   */
  updateSpawner(dt) {
    this.spawnTimer += dt * 1000;

    if (this.spawnTimer >= this.nextSpawnInterval) {
      this.spawnTimer = 0;

      const diff = this.getCurrentDifficultyParams();

      // Multi-spawn count
      let waveCount = 1;
      if (Math.random() < diff.multiSpawnChance) {
        if (diff.progress > 0.65) {
          waveCount = Math.random() < 0.4 ? 2 : (Math.random() < 0.7 ? 3 : 4);
        } else if (diff.progress > 0.3) {
          waveCount = Math.random() < 0.6 ? 2 : 3;
        } else {
          waveCount = 2;
        }
      }

      for (let i = 0; i < waveCount; i++) {
        this.spawnSingleTarget(diff, i, waveCount);
      }

      // Next spawn interval calculation
      const intervalRange = diff.spawnIntervalMax - diff.spawnIntervalMin;
      this.nextSpawnInterval = diff.spawnIntervalMin + Math.random() * intervalRange;
    }
  }

  spawnSingleTarget(diff, index, totalInWave) {
    const w = this.renderer.width;
    const h = this.renderer.height;

    // Distribute X position across bottom of canvas
    const margin = 80;
    const usableWidth = w - margin * 2;
    const slotWidth = usableWidth / Math.max(1, totalInWave);
    const spawnX = margin + slotWidth * index + (Math.random() * 0.7 + 0.15) * slotWidth;
    const spawnY = h + 40;

    // Upward launch speed scaled by progressive speed multiplier
    const speedMult = diff.speedMult;
    const impulseY = (CONFIG.GAME.MIN_SPEED_Y + Math.random() * (CONFIG.GAME.MAX_SPEED_Y - CONFIG.GAME.MIN_SPEED_Y)) * speedMult;

    // Aim horizontal velocity toward center screen
    const centerOffset = (w * 0.5) - spawnX;
    const impulseX = (centerOffset * 0.5) + (Math.random() - 0.5) * 180;

    // Determine type: Normal, Golden, Bomb
    const rand = Math.random();
    let type = 'NORMAL';

    if (rand < diff.bombChance && this.gameTime > 6) {
      type = 'BOMB';
    } else if (rand < (diff.bombChance + CONFIG.GAME.TARGET_PROBABILITIES.GOLDEN)) {
      type = 'GOLDEN';
    }

    const target = new Target(spawnX, spawnY, impulseX, impulseY, type);
    this.targets.push(target);
  }

  /**
   * Collision detection between active blade stroke and targets
   */
  checkCollisions() {
    if (this.state !== 'PLAYING') return;

    const segment = this.gestureDetector.getActiveSegment();
    if (!segment) return;

    for (const target of this.targets) {
      if (target.isSliced || target.isDead) continue;

      const hit = GestureDetector.checkCircleSegmentIntersection(
        target.x, target.y, target.radius,
        segment.x1, segment.y1, segment.x2, segment.y2
      );

      if (hit) {
        this.handleTargetSliced(target, segment);
      }
    }
  }

  handleTargetSliced(target, segment) {
    const sliceAngle = segment.angle;
    const sliced = target.slice(sliceAngle);
    if (!sliced) return;

    if (target.type === 'BOMB') {
      // Slashing Bomb Penalty!
      this.lives -= 1;
      this.resetCombo();
      sound.playBombExplosion();
      this.renderer.flashScreen('#FF2A6D', 0.65);
      this.renderer.addScreenShake(CONFIG.VFX.SCREEN_SHAKE_BOMB);
      this.particleSystem.emitBombExplosion(target.x, target.y);

      if (this.onLivesUpdate) this.onLivesUpdate(this.lives);

      if (this.lives <= 0) {
        this.endGame('LIVES_DEPLETED');
      }
      return;
    }

    // Normal or Golden Target Sliced!
    this.targetsSliced += 1;
    this.advanceCombo();

    const pointsEarned = Math.round(target.points * this.comboMultiplier);
    this.score += pointsEarned;
    this.saveHighScore();

    if (this.onScoreUpdate) this.onScoreUpdate(this.score, this.highScore, this.isNewHighScore);

    // Audio
    sound.playSlice(target.type);

    // Particles & Visual Feedback
    this.renderer.addScreenShake(CONFIG.VFX.SCREEN_SHAKE_SLICE);
    this.particleSystem.emitSliceParticles(target.x, target.y, target.glowColor, 28, sliceAngle);

    // Score Popup
    const isComboText = this.comboCount >= 2;
    const scoreText = isComboText 
      ? `+${pointsEarned} ${this.currentComboTier ? this.currentComboTier.label : ''}`
      : `+${pointsEarned}`;
    
    this.particleSystem.addScoreText(
      target.x,
      target.y - 20,
      scoreText,
      target.type === 'GOLDEN' ? '#FFE600' : target.glowColor,
      isComboText
    );
  }

  advanceCombo() {
    this.comboCount += 1;
    if (this.comboCount > this.maxCombo) {
      this.maxCombo = this.comboCount;
    }

    this.comboTimer = CONFIG.GAME.SCORES.COMBO_WINDOW_MS;

    // Find highest matching combo tier
    let matchingTier = null;
    for (let i = CONFIG.GAME.COMBOS.length - 1; i >= 0; i--) {
      if (this.comboCount >= CONFIG.GAME.COMBOS[i].count) {
        matchingTier = CONFIG.GAME.COMBOS[i];
        break;
      }
    }

    this.currentComboTier = matchingTier;
    this.comboMultiplier = matchingTier ? matchingTier.multiplier : 1.0;

    if (matchingTier) {
      sound.playComboSound(this.comboCount);
    }

    if (this.onComboUpdate) {
      this.onComboUpdate(
        this.comboCount,
        matchingTier ? matchingTier.label : '',
        this.comboMultiplier,
        matchingTier ? matchingTier.color : null
      );
    }
  }

  resetCombo() {
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboMultiplier = 1.0;
    this.currentComboTier = null;

    if (this.onComboUpdate) {
      this.onComboUpdate(0, '', 1.0, null);
    }
  }

  /**
   * Render frame
   */
  render() {
    this.renderer.clear();
    this.renderer.renderTargets(this.targets);
    this.renderer.renderParticles(this.particleSystem);

    const isFrenzy = this.comboCount >= 4;
    this.renderer.renderBlade(
      this.gestureDetector.trailPoints,
      this.gestureDetector.currentPosition,
      this.gestureDetector.isSlashing,
      isFrenzy
    );

    this.renderer.renderFlash();
  }

  /**
   * Start requestAnimationFrame loop
   */
  startLoop() {
    if (this.animationFrameId) return;

    this.lastFrameTime = performance.now();

    const loop = (timestamp) => {
      const dt = Math.min((timestamp - this.lastFrameTime) / 1000, 0.1);
      this.lastFrameTime = timestamp;

      this.update(dt, timestamp);
      this.render();

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  stopLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
