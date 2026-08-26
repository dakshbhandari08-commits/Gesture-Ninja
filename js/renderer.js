/**
 * Gesture Ninja - Canvas 2D Rendering Engine
 * Handles high-DPI scaling, cyberpunk cyber-grid background, glowing neon blade trails,
 * target rendering, screen shake, and visual punch effects.
 */

import { CONFIG } from './config.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
    this.width = CONFIG.CANVAS.DEFAULT_WIDTH;
    this.height = CONFIG.CANVAS.DEFAULT_HEIGHT;

    // Screen shake state
    this.shakeIntensity = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;

    // Flash screen state (e.g. red for bomb blast)
    this.flashColor = null;
    this.flashAlpha = 0;

    // Background animation clock
    this.bgTime = 0;

    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width || window.innerWidth || CONFIG.CANVAS.DEFAULT_WIDTH;
    const h = rect.height || window.innerHeight || CONFIG.CANVAS.DEFAULT_HEIGHT;
    this.width = w;
    this.height = h;
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
  }

  addScreenShake(amount) {
    this.shakeIntensity = Math.min(this.shakeIntensity + amount, 35);
  }

  flashScreen(color = '#FF2A6D', alpha = 0.5) {
    this.flashColor = color;
    this.flashAlpha = alpha;
  }

  update(dt) {
    this.bgTime += dt;

    // Screen shake physics
    if (this.shakeIntensity > 0.1) {
      this.shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeIntensity *= CONFIG.VFX.SCREEN_SHAKE_DECAY;
    } else {
      this.shakeIntensity = 0;
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }

    // Flash screen decay
    if (this.flashAlpha > 0.01) {
      this.flashAlpha -= dt * 2.2;
    } else {
      this.flashAlpha = 0;
      this.flashColor = null;
    }
  }

  /**
   * Clear and draw background
   */
  clear() {
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);

    // Apply screen shake
    ctx.translate(this.shakeOffsetX, this.shakeOffsetY);

    // Cyberpunk Dark Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, '#060810');
    bgGrad.addColorStop(0.5, '#0B0F19');
    bgGrad.addColorStop(1, '#05070D');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Cyber grid lines at bottom
    this.renderCyberGrid(ctx);

    ctx.restore();
  }

  renderCyberGrid(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
    ctx.lineWidth = 1;

    const horizonY = this.height * 0.72;
    const gridStep = 45;

    // Horizontal perspective lines
    for (let y = horizonY; y < this.height; y += (y - horizonY) * 0.35 + 12) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Vanishing perspective vertical lines
    const vanishX = this.width / 2;
    const vanishY = horizonY - 40;
    for (let x = -this.width * 0.4; x <= this.width * 1.4; x += gridStep * 1.8) {
      ctx.beginPath();
      ctx.moveTo(vanishX, vanishY);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }

    // Ambient top corner neon vignettes
    const glowL = ctx.createRadialGradient(0, 0, 10, 0, 0, this.width * 0.5);
    glowL.addColorStop(0, 'rgba(0, 240, 255, 0.08)');
    glowL.addColorStop(1, 'transparent');
    ctx.fillStyle = glowL;
    ctx.fillRect(0, 0, this.width, this.height);

    const glowR = ctx.createRadialGradient(this.width, 0, 10, this.width, 0, this.width * 0.5);
    glowR.addColorStop(0, 'rgba(255, 0, 127, 0.06)');
    glowR.addColorStop(1, 'transparent');
    ctx.fillStyle = glowR;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.restore();
  }

  /**
   * Render all targets
   */
  renderTargets(targets) {
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.translate(this.shakeOffsetX, this.shakeOffsetY);

    for (const target of targets) {
      target.render(ctx);
    }

    ctx.restore();
  }

  /**
   * Render glowing Katana blade trail
   */
  renderBlade(trailPoints, currentPos, isSlashing, frenzyMode = false) {
    if (!trailPoints || trailPoints.length < 2) return;

    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.translate(this.shakeOffsetX, this.shakeOffsetY);

    const glowColor = frenzyMode 
      ? CONFIG.TRACKING.BLADE_COLOR_FRENZY 
      : (isSlashing ? '#00F0FF' : 'rgba(0, 240, 255, 0.4)');

    const coreColor = '#FFFFFF';

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < trailPoints.length - 1; i++) {
      const p1 = trailPoints[i];
      const p2 = trailPoints[i + 1];
      const progress = i / (trailPoints.length - 1);
      const alpha = p2.alpha * (0.2 + progress * 0.8);
      const width = CONFIG.TRACKING.BLADE_WIDTH_END + 
        (CONFIG.TRACKING.BLADE_WIDTH_START - CONFIG.TRACKING.BLADE_WIDTH_END) * progress;

      // Glow pass
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = width * (isSlashing ? 2.4 : 1.3);
      ctx.globalAlpha = alpha * (isSlashing ? 0.85 : 0.4);
      ctx.shadowBlur = isSlashing ? 24 : 10;
      ctx.shadowColor = glowColor;
      ctx.stroke();

      // White hot core pass
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = coreColor;
      ctx.lineWidth = Math.max(2, width * 0.45);
      ctx.globalAlpha = alpha * (isSlashing ? 1.0 : 0.7);
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#FFFFFF';
      ctx.stroke();
    }

    // Blade Tip crosshair/spark
    if (currentPos && currentPos.x !== undefined) {
      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = coreColor;
      ctx.shadowBlur = 18;
      ctx.shadowColor = glowColor;

      ctx.beginPath();
      ctx.arc(currentPos.x, currentPos.y, isSlashing ? 8 : 5, 0, Math.PI * 2);
      ctx.fill();

      // Pulsing outer ring around hand point
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(currentPos.x, currentPos.y, isSlashing ? 15 : 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Render particles & shockwaves
   */
  renderParticles(particleSystem) {
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.translate(this.shakeOffsetX, this.shakeOffsetY);
    particleSystem.render(ctx);
    ctx.restore();
  }

  /**
   * Render screen flash (e.g. red for bomb explosion)
   */
  renderFlash() {
    if (!this.flashColor || this.flashAlpha <= 0) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = this.flashColor;
    ctx.globalAlpha = this.flashAlpha;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  }
}
