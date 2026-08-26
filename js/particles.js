/**
 * Gesture Ninja - High Performance Visual Particle System
 * Manages spark emitters, slice juice splatters, shockwaves, and floating score texts.
 */

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.texts = [];
    this.shockwaves = [];
  }

  reset() {
    this.particles.length = 0;
    this.texts.length = 0;
    this.shockwaves.length = 0;
  }

  /**
   * Spawn burst of sparks and juice when a target is sliced
   */
  emitSliceParticles(x, y, color = '#00F0FF', count = 28, sliceAngle = 0) {
    for (let i = 0; i < count; i++) {
      // Particles spray preferentially perpendicular and aligned with slice angle
      const spread = (Math.random() - 0.5) * Math.PI * 0.8;
      const angle = (Math.random() > 0.5 ? sliceAngle + Math.PI / 2 : sliceAngle - Math.PI / 2) + spread;
      const speed = 180 + Math.random() * 450;
      const size = 3 + Math.random() * 6;
      const life = 0.4 + Math.random() * 0.5;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        gravity: 500,
        size,
        initialSize: size,
        color,
        alpha: 1.0,
        life,
        maxLife: life,
        shape: Math.random() > 0.4 ? 'circle' : 'spark',
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 12,
      });
    }

    // Add a light flash ring
    this.shockwaves.push({
      x,
      y,
      radius: 12,
      maxRadius: 85,
      color,
      alpha: 0.9,
      width: 4,
      life: 0.28,
      maxLife: 0.28,
    });
  }

  /**
   * Spawn huge fiery explosion when bomb detonates
   */
  emitBombExplosion(x, y) {
    // Shockwaves
    this.shockwaves.push({
      x,
      y,
      radius: 20,
      maxRadius: 260,
      color: '#FF2A6D',
      alpha: 1.0,
      width: 8,
      life: 0.5,
      maxLife: 0.5,
    });

    this.shockwaves.push({
      x,
      y,
      radius: 10,
      maxRadius: 180,
      color: '#FFAA00',
      alpha: 0.8,
      width: 5,
      life: 0.4,
      maxLife: 0.4,
    });

    // Fiery sparks and shrapnel
    for (let i = 0; i < 70; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 680;
      const size = 4 + Math.random() * 8;
      const life = 0.5 + Math.random() * 0.7;
      const colors = ['#FF2A6D', '#FF5E00', '#FFB703', '#FFFFFF', '#330011'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 120,
        gravity: 600,
        size,
        initialSize: size,
        color,
        alpha: 1.0,
        life,
        maxLife: life,
        shape: Math.random() > 0.5 ? 'circle' : 'spark',
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 20,
      });
    }
  }

  /**
   * Blade tip spark trails
   */
  emitBladeSparks(x, y, color = '#00F0FF') {
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 120;
      const size = 2 + Math.random() * 3.5;
      const life = 0.15 + Math.random() * 0.2;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 100,
        size,
        initialSize: size,
        color,
        alpha: 0.85,
        life,
        maxLife: life,
        shape: 'spark',
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 10,
      });
    }
  }

  /**
   * Floating popup score text
   */
  addScoreText(x, y, text, color = '#FFFFFF', isCombo = false) {
    this.texts.push({
      x,
      y,
      text,
      color,
      isCombo,
      alpha: 1.0,
      scale: isCombo ? 1.4 : 1.0,
      vy: isCombo ? -75 : -55,
      life: isCombo ? 1.0 : 0.75,
      maxLife: isCombo ? 1.0 : 0.75,
    });
  }

  /**
   * Update particle physics and lifespans
   */
  update(dt) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.angle += p.rotSpeed * dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      p.size = p.initialSize * (0.3 + 0.7 * (p.life / p.maxLife));
    }

    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.life -= dt;
      if (s.life <= 0) {
        this.shockwaves.splice(i, 1);
        continue;
      }
      const progress = 1 - (s.life / s.maxLife);
      s.radius += (s.maxRadius - s.radius) * 14 * dt;
      s.alpha = Math.max(0, (s.life / s.maxLife) * 0.9);
    }

    // Update floating texts
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.texts.splice(i, 1);
        continue;
      }
      t.y += t.vy * dt;
      t.alpha = Math.min(1.0, (t.life / t.maxLife) * 1.5);
    }
  }

  /**
   * Draw all particles onto canvas
   */
  render(ctx) {
    ctx.save();

    // Render shockwaves
    for (const s of this.shockwaves) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, Math.max(1, s.radius), 0, Math.PI * 2);
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width * (s.alpha);
      ctx.globalAlpha = s.alpha;
      ctx.shadowBlur = 15;
      ctx.shadowColor = s.color;
      ctx.stroke();
    }

    // Render particles
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;

      if (p.shape === 'spark') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillRect(-p.size, -p.size * 0.3, p.size * 2, p.size * 0.6);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Render floating score / combo texts
    for (const t of this.texts) {
      ctx.globalAlpha = t.alpha;
      ctx.font = t.isCombo 
        ? '900 28px "Orbitron", sans-serif' 
        : '700 20px "Rajdhani", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.shadowBlur = t.isCombo ? 18 : 8;
      ctx.shadowColor = t.color;
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);

      // White core overlay
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(t.text, t.x, t.y);
    }

    ctx.restore();
  }
}
