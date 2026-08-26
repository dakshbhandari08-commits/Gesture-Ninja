/**
 * Gesture Ninja - UI & Screen Controller
 * Manages Portfolio Landing Page, How To Play Modal, Camera Calibration, In-Game HUD,
 * 90-Second Match Timer, Progressive Difficulty Badges, and Final Results Screen.
 */

import { sound } from './audio.js';

export class UIController {
  constructor() {
    // Top-level views
    this.landingPage = document.getElementById('landing-page');
    this.gameContainer = document.getElementById('game-container');
    
    // In-game overlays
    this.startScreen = document.getElementById('start-screen');
    this.howToPlayModal = document.getElementById('how-to-play-modal');
    this.calibrationModal = document.getElementById('calibration-modal');
    this.gameOverScreen = document.getElementById('game-over-screen');
    this.hud = document.getElementById('in-game-hud');

    // Status badges & indicators
    this.statusBadges = document.querySelectorAll('.tracking-status-badge');
    this.pipContainer = document.getElementById('pip-camera-container');

    // HUD elements
    this.timerElement = document.getElementById('hud-timer-val');
    this.difficultyElement = document.getElementById('hud-difficulty-val');
    this.scoreElement = document.getElementById('hud-score-val');
    this.highScoreElement = document.getElementById('hud-highscore-val');
    this.livesContainer = document.getElementById('hud-lives-container');
    this.comboBanner = document.getElementById('combo-banner');
    this.comboCountText = document.getElementById('combo-count-text');
    this.comboLabelText = document.getElementById('combo-label-text');
    this.comboMultiplierText = document.getElementById('combo-multiplier-text');

    // Game Over stats
    this.gameOverTitle = document.getElementById('game-over-title');
    this.newHighScoreBanner = document.getElementById('new-highscore-banner');
    this.finalScoreElement = document.getElementById('final-score-val');
    this.finalHighScoreElement = document.getElementById('final-highscore-val');
    this.finalMaxComboElement = document.getElementById('final-max-combo-val');
    this.finalTargetsSlicedElement = document.getElementById('final-targets-sliced-val');
    this.finalSurvivalElement = document.getElementById('final-survival-val');

    // Controls & Toggles
    this.soundToggleBtn = document.getElementById('sound-toggle-btn');
    this.mouseModeBtn = document.getElementById('mouse-mode-btn');

    // State & Callbacks
    this.mouseMode = false;
    this.onPlayNow = null;
    this.onStartGame = null;
    this.onRestartGame = null;
    this.onBackToHome = null;
    this.onCalibrateRequest = null;
    this.onToggleMouseMode = null;
    this.onScreenChange = null;

    this.bindEvents();
  }

  formatNumber(num) {
    return Number(num || 0).toLocaleString();
  }

  bindEvents() {
    // Navigation / Action Buttons from Landing Page
    const playNowBtns = document.querySelectorAll('.play-now-trigger');
    playNowBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        sound.playClick();
        if (this.onPlayNow) this.onPlayNow();
        this.showStartScreen();
      });
    });

    // How It Works / How to Play triggers
    const howItWorksBtns = document.querySelectorAll('.how-it-works-trigger');
    howItWorksBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        sound.playClick();
        this.showHowToPlay(true);
      });
    });

    // Start Game from Start / Calibration Screen
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        sound.playClick();
        if (this.onStartGame) this.onStartGame();
      });
    }

    // Close how to play modal ("GOT IT" button)
    const closeHowToPlayBtn = document.getElementById('close-how-to-play-btn');
    if (closeHowToPlayBtn) {
      closeHowToPlayBtn.addEventListener('click', () => {
        sound.playClick();
        this.showHowToPlay(false);
      });
    }

    // Calibrate camera button
    const calibrateBtn = document.getElementById('calibrate-camera-btn');
    if (calibrateBtn) {
      calibrateBtn.addEventListener('click', () => {
        sound.playClick();
        this.showCalibration(true);
        if (this.onCalibrateRequest) this.onCalibrateRequest();
      });
    }

    // Close calibration modal
    const closeCalibrateBtn = document.getElementById('close-calibrate-btn');
    if (closeCalibrateBtn) {
      closeCalibrateBtn.addEventListener('click', () => {
        sound.playClick();
        this.showCalibration(false);
      });
    }

    // Restart game button from Results
    const restartBtn = document.getElementById('restart-game-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        sound.playClick();
        if (this.onRestartGame) this.onRestartGame();
      });
    }

    // Back to Home button from Results
    const backToHomeBtn = document.getElementById('gameover-home-btn');
    if (backToHomeBtn) {
      backToHomeBtn.addEventListener('click', () => {
        sound.playClick();
        if (this.onBackToHome) this.onBackToHome();
        this.showLandingPage();
      });
    }

    // Exit to Home button from In-Game HUD / Start Screen
    const exitToHomeBtns = document.querySelectorAll('.exit-to-home-btn');
    exitToHomeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        if (this.onBackToHome) this.onBackToHome();
        this.showLandingPage();
      });
    });

    // Sound toggle
    if (this.soundToggleBtn) {
      this.soundToggleBtn.addEventListener('click', () => {
        const isMuted = sound.toggleMute();
        this.soundToggleBtn.innerHTML = isMuted 
          ? '<span class="icon">🔇</span> MUTED' 
          : '<span class="icon">🔊</span> AUDIO ON';
        this.soundToggleBtn.classList.toggle('muted', isMuted);
      });
    }

    // Mouse fallback toggle button
    if (this.mouseModeBtn) {
      this.mouseModeBtn.addEventListener('click', () => {
        sound.playClick();
        this.mouseMode = !this.mouseMode;
        this.mouseModeBtn.classList.toggle('active', this.mouseMode);
        this.mouseModeBtn.innerHTML = this.mouseMode
          ? '<span>🖱️</span> MOUSE MODE: ON'
          : '<span>✋</span> WEBCAM MODE';
        if (this.onToggleMouseMode) this.onToggleMouseMode(this.mouseMode);
      });
    }
  }

  showLandingPage() {
    this.landingPage.classList.remove('hidden');
    this.gameContainer.classList.add('hidden');
    this.startScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.hud.classList.add('hidden');
    this.howToPlayModal.classList.add('hidden');
    this.calibrationModal.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (this.onScreenChange) this.onScreenChange('LANDING');
  }

  showStartScreen() {
    this.landingPage.classList.add('hidden');
    this.gameContainer.classList.remove('hidden');
    this.startScreen.classList.remove('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.howToPlayModal.classList.add('hidden');
    this.calibrationModal.classList.add('hidden');
    this.hud.classList.add('hidden');
    if (this.onScreenChange) this.onScreenChange('START');
  }

  showInGameHUD() {
    this.landingPage.classList.add('hidden');
    this.gameContainer.classList.remove('hidden');
    this.startScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.howToPlayModal.classList.add('hidden');
    this.calibrationModal.classList.add('hidden');
    this.hud.classList.remove('hidden');
    if (this.onScreenChange) this.onScreenChange('PLAYING');
  }

  showGameOver(stats) {
    this.gameOverScreen.classList.remove('hidden');
    this.hud.classList.add('hidden');

    // Title based on finish reason
    if (this.gameOverTitle) {
      this.gameOverTitle.textContent = stats.reason === 'TIMEOUT' ? "TIME'S UP!" : 'GAME OVER';
      this.gameOverTitle.style.color = stats.reason === 'TIMEOUT' ? '#FFE600' : '#FF2A6D';
    }

    // High score banner
    if (this.newHighScoreBanner) {
      if (stats.isNewHighScore) {
        this.newHighScoreBanner.classList.remove('hidden');
      } else {
        this.newHighScoreBanner.classList.add('hidden');
      }
    }

    // Stats display
    if (this.finalScoreElement) this.finalScoreElement.textContent = this.formatNumber(stats.score);
    if (this.finalHighScoreElement) this.finalHighScoreElement.textContent = this.formatNumber(stats.highScore);
    if (this.finalMaxComboElement) this.finalMaxComboElement.textContent = `${stats.maxCombo}x`;
    if (this.finalTargetsSlicedElement) this.finalTargetsSlicedElement.textContent = stats.targetsSliced;
    if (this.finalSurvivalElement) this.finalSurvivalElement.textContent = `${stats.survivedTime}s`;

    if (this.onScreenChange) this.onScreenChange('GAMEOVER');
  }

  showHowToPlay(show) {
    if (show) {
      this.howToPlayModal.classList.remove('hidden');
    } else {
      this.howToPlayModal.classList.add('hidden');
    }
  }

  showCalibration(show) {
    if (show) {
      this.calibrationModal.classList.remove('hidden');
    } else {
      this.calibrationModal.classList.add('hidden');
    }
  }

  updateTimer(formattedTime, secondsRemaining, ratio) {
    if (!this.timerElement) return;
    this.timerElement.textContent = formattedTime;
    
    // Warning pulse when under 15 seconds
    if (secondsRemaining <= 15) {
      this.timerElement.classList.add('timer-warning');
    } else {
      this.timerElement.classList.remove('timer-warning');
    }
  }

  updateDifficulty(tierName, tierColor, progress) {
    if (!this.difficultyElement) return;
    this.difficultyElement.textContent = tierName;
    this.difficultyElement.style.color = tierColor || '#00F0FF';
  }

  updateScore(score, highScore, isNewHigh) {
    if (this.scoreElement) this.scoreElement.textContent = this.formatNumber(score);
    if (this.highScoreElement) this.highScoreElement.textContent = this.formatNumber(highScore);
  }

  updateLives(lives) {
    if (!this.livesContainer) return;
    this.livesContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const heart = document.createElement('div');
      heart.className = `cyber-heart ${i < lives ? 'active' : 'lost'}`;
      heart.innerHTML = '♥';
      this.livesContainer.appendChild(heart);
    }
  }

  updateCombo(count, label, multiplier, color) {
    if (!this.comboBanner) return;

    if (count >= 2) {
      this.comboBanner.classList.add('visible');
      if (this.comboCountText) this.comboCountText.textContent = `${count}x`;
      if (this.comboLabelText) {
        this.comboLabelText.textContent = label;
        this.comboLabelText.style.color = color || '#00F0FF';
      }
      if (this.comboMultiplierText) this.comboMultiplierText.textContent = `${multiplier}x MULTIPLIER`;
    } else {
      this.comboBanner.classList.remove('visible');
    }
  }

  updateTrackingStatus({ status, message }) {
    this.statusBadges.forEach(badge => {
      badge.className = 'tracking-status-badge';
      if (status === 'TRACKING') {
        badge.classList.add('status-tracking');
        badge.innerHTML = '<span class="pulse-dot"></span> 🟢 HAND DETECTED';
      } else if (status === 'NO_HAND') {
        badge.classList.add('status-no-hand');
        badge.innerHTML = '<span class="pulse-dot"></span> 🔴 NO HAND DETECTED';
      } else if (status === 'ERROR') {
        badge.classList.add('status-error');
        badge.innerHTML = `<span class="pulse-dot"></span> ⚠️ ${message || 'CAMERA ERROR'}`;
      } else if (status === 'STARTING') {
        badge.classList.add('status-starting');
        badge.innerHTML = '<span class="pulse-dot"></span> ⏳ STARTING CAMERA...';
      } else {
        badge.classList.add('status-stopped');
        badge.innerHTML = '<span class="pulse-dot"></span> ⚪ CAMERA STANDBY';
      }
    });
  }
}
