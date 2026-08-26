/**
 * Gesture Ninja - Target Entity Classes
 * Manages Flying Targets (Normal Cyber Fruits, Golden Cores, Spiked Bombs) and Sliced Halves.
 */

import { CONFIG } from './config.js';

// Visual themes for normal targets
const TARGET_THEMES = [
  { name: 'Cyber Melon', mainColor: '#00FF9D', glowColor: '#00F0FF', innerColor: '#006644', radius: 44, points: 100 },
  { name: 'Plasma Berry', mainColor: '#FF007F', glowColor: '#FF5EAA', innerColor: '#880033', radius: 36, points: 100 },
  { name: 'Electro Lime', mainColor: '#ADFF2F', glowColor: '#CCFF00', innerColor: '#447700', radius: 38, points: 100 },
  { name: 'Hyper Orange', mainColor: '#FF6B00', glowColor: '#FFAE00', innerColor: '#993300', radius: 42, points: 100 },
  { name: 'Void Plum', mainColor: '#A855F7', glowColor: '#C084FC', innerColor: '#581C87', radius: 40, points: 100 },
];

export class Target {
  constructor(x, y, vx, vy, type = 'NORMAL') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.type = type; // 'NORMAL', 'GOLDEN', 'BOMB'
    this.isSliced = false;
    this.isDead = false;
    this.halves = [];

    this.angle = Math.random() * Math.PI * 2;
    this.angularVelocity = (Math.random() - 0.5) * 4.5;
    this.age = 0;

    // Theme and properties
    if (this.type === 'NORMAL') {
      const theme = TARGET_THEMES[Math.floor(Math.random() * TARGET_THEMES.length)];
      this.name = theme.name;
      this.radius = theme.radius;
      this.mainColor = theme.mainColor;
      this.glowColor = theme.glowColor;
      this.innerColor = theme.innerColor;
      this.points = theme.points;
    } else if (this.type === 'GOLDEN') {
      this.name = 'Golden Core';
      this.radius = 42;
      this.mainColor = '#FFE600';
      this.glowColor = '#FFB703';
      this.innerColor = '#FFF5A5';
      this.points = CONFIG.GAME.SCORES.GOLDEN_TARGET;
    } else if (this.type === 'BOMB') {
      this.name = 'Cyber Mine';
      this.radius = 40;
      this.mainColor = '#1A1D24';
      this.glowColor = '#FF2A6D';
      this.innerColor = '#0F1117';
      this.points = 0;
      this.fuseTimer = 0;
    }
  }

  /**
   * Update physics position
   */
  update(dt, canvasHeight) {
    this.age += dt;

    if (this.isSliced) {
      // Update sliced halves
      for (let i = this.halves.length - 1; i >= 0; i--) {
        const half = this.halves[i];
        half.x += half.vx * dt;
        half.y += half.vy * dt;
        half.vy += CONFIG.GAME.GRAVITY * 1.1 * dt;
        half.angle += half.angularVelocity * dt;
        half.alpha -= dt * 0.45;

        if (half.y > canvasHeight + 100 || half.alpha <= 0) {
          this.halves.splice(i, 1);
        }
      }
      if (this.halves.length === 0) {
        this.isDead = true;
      }
      return;
    }

    // Normal trajectory
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += CONFIG.GAME.GRAVITY * dt;
    this.angle += this.angularVelocity * dt;

    if (this.type === 'BOMB') {
      this.fuseTimer += dt;
    }

    // Falls beneath screen
    if (this.y > canvasHeight + 100 && this.vy > 0) {
      this.isDead = true;
    }
  }

  /**
   * Slice this target into two halves along the slash angle
   */
  slice(slashAngle) {
    if (this.isSliced || this.isDead) return false;
    this.isSliced = true;

    if (this.type === 'BOMB') {
      this.isDead = true;
      return true;
    }

    // Calculate separation impulse perpendicular to cut
    const normalAngle = slashAngle + Math.PI / 2;
    const splitSpeed = 160 + Math.random() * 80;

    // Half 1
    this.halves.push({
      x: this.x - Math.cos(normalAngle) * 8,
      y: this.y - Math.sin(normalAngle) * 8,
      vx: this.vx - Math.cos(normalAngle) * splitSpeed,
      vy: this.vy * 0.4 - Math.sin(normalAngle) * splitSpeed - 40,
      angle: this.angle,
      angularVelocity: this.angularVelocity - 4,
      sliceAngle: slashAngle,
      side: 1,
      alpha: 1.0,
      radius: this.radius,
      mainColor: this.mainColor,
      glowColor: this.glowColor,
      innerColor: this.innerColor,
      type: this.type,
    });

    // Half 2
    this.halves.push({
      x: this.x + Math.cos(normalAngle) * 8,
      y: this.y + Math.sin(normalAngle) * 8,
      vx: this.vx + Math.cos(normalAngle) * splitSpeed,
      vy: this.vy * 0.4 + Math.sin(normalAngle) * splitSpeed - 40,
      angle: this.angle,
      angularVelocity: this.angularVelocity + 4,
      sliceAngle: slashAngle,
      side: -1,
      alpha: 1.0,
      radius: this.radius,
      mainColor: this.mainColor,
      glowColor: this.glowColor,
      innerColor: this.innerColor,
      type: this.type,
    });

    return true;
  }

  /**
   * Render target onto canvas
   */
  render(ctx) {
    if (this.isSliced) {
      this.renderHalves(ctx);
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    if (this.type === 'NORMAL') {
      this.renderNormal(ctx);
    } else if (this.type === 'GOLDEN') {
      this.renderGolden(ctx);
    } else if (this.type === 'BOMB') {
      this.renderBomb(ctx);
    }

    ctx.restore();
  }

  renderNormal(ctx) {
    const r = this.radius;

    // Outer glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = this.glowColor;

    // Body gradient
    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.3, this.glowColor);
    grad.addColorStop(0.85, this.mainColor);
    grad.addColorStop(1, this.innerColor);

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Cyber geometric pattern lines
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(0, 0, r * 0.65, 0, Math.PI * 1.3);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-r * 0.5, 0);
    ctx.lineTo(r * 0.5, 0);
    ctx.stroke();

    // Pulsing core light
    const pulse = 0.7 + 0.3 * Math.sin(this.age * 8);
    ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  renderGolden(ctx) {
    const r = this.radius;
    const pulse = 0.8 + 0.2 * Math.sin(this.age * 12);

    // Radiant outer aura
    ctx.shadowBlur = 28 * pulse;
    ctx.shadowColor = '#FFD700';

    // Outer spinning golden ring
    ctx.strokeStyle = '#FFE600';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.15, 0, Math.PI * 1.5);
    ctx.stroke();

    // Body
    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.3, '#FFF380');
    grad.addColorStop(0.7, '#FFD700');
    grad.addColorStop(1, '#B8860B');

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Star cross sparkles
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, 0); ctx.lineTo(r * 0.7, 0);
    ctx.moveTo(0, -r * 0.7); ctx.lineTo(0, r * 0.7);
    ctx.stroke();

    // Core diamond
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(10, 0);
    ctx.lineTo(0, 10);
    ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fill();
  }

  renderBomb(ctx) {
    const r = this.radius;

    // Spikes around bomb
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#FF2A6D';
    ctx.fillStyle = '#0F1117';
    ctx.strokeStyle = '#FF2A6D';
    ctx.lineWidth = 2;

    const numSpikes = 8;
    for (let i = 0; i < numSpikes; i++) {
      const a = (i / numSpikes) * Math.PI * 2;
      const spikeX = Math.cos(a) * (r + 9);
      const spikeY = Math.sin(a) * (r + 9);
      ctx.beginPath();
      ctx.arc(spikeX, spikeY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#FF2A6D';
      ctx.fill();
    }

    // Main dark bomb sphere
    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    grad.addColorStop(0, '#3A3F4D');
    grad.addColorStop(0.7, '#15171E');
    grad.addColorStop(1, '#050608');

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.stroke();

    // Pulsing warning skull / hazard light in center
    const pulse = 0.5 + 0.5 * Math.sin(this.fuseTimer * 16);
    ctx.fillStyle = `rgba(255, 42, 109, ${0.4 + pulse * 0.6})`;
    ctx.shadowBlur = 20 * pulse;
    ctx.shadowColor = '#FF2A6D';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Hazard symbol text
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 18px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✕', 0, 0);

    // Animated Fuse on top
    const fuseX = 0;
    const fuseY = -r - 12;
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(8, -r - 6, fuseX, fuseY);
    ctx.stroke();

    // Spark on fuse
    const sparkColor = (Math.random() > 0.5) ? '#FFAA00' : '#FF2A6D';
    ctx.fillStyle = sparkColor;
    ctx.shadowBlur = 15;
    ctx.shadowColor = sparkColor;
    ctx.beginPath();
    ctx.arc(fuseX + (Math.random() - 0.5) * 4, fuseY + (Math.random() - 0.5) * 4, 4 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  renderHalves(ctx) {
    for (const half of this.halves) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, half.alpha);
      ctx.translate(half.x, half.y);
      ctx.rotate(half.angle);

      const r = half.radius;

      ctx.shadowBlur = 15;
      ctx.shadowColor = half.glowColor;

      // Draw semi-circle half
      ctx.beginPath();
      if (half.side === 1) {
        ctx.arc(0, 0, r, 0, Math.PI);
      } else {
        ctx.arc(0, 0, r, Math.PI, Math.PI * 2);
      }
      ctx.closePath();

      const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, r);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.4, half.glowColor);
      grad.addColorStop(1, half.mainColor);
      ctx.fillStyle = grad;
      ctx.fill();

      // Glowing sliced interior edge
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#FFFFFF';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-r, 0);
      ctx.lineTo(r, 0);
      ctx.stroke();

      ctx.restore();
    }
  }
}
