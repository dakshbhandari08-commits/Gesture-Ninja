/**
 * Gesture Ninja - Gesture & Velocity Slash Detector
 * Detects rapid hand motions, directional slashes, maintains blade trail points,
 * and generates smooth interpolated blade curves.
 */

import { CONFIG } from './config.js';
import { sound } from './audio.js';

export class GestureDetector {
  constructor() {
    // History buffer of recent points: { x, y, time, velocity }
    this.trailPoints = [];
    this.currentPosition = { x: 0, y: 0 };
    this.isSlashing = false;
    this.currentVelocity = 0;
    this.slashDirection = null; // 'LEFT', 'RIGHT', 'UP', 'DOWN', 'DIAGONAL'
    this.lastWhooshTime = 0;
    this.activeSliceSegment = null; // Line segment { x1, y1, x2, y2, angle, speed }
  }

  reset() {
    this.trailPoints.length = 0;
    this.isSlashing = false;
    this.currentVelocity = 0;
    this.slashDirection = null;
    this.activeSliceSegment = null;
  }

  /**
   * Add a new coordinate point from HandTracker or Mouse
   */
  addPoint(x, y, time = performance.now()) {
    this.currentPosition = { x, y };

    let velocity = 0;
    let dx = 0;
    let dy = 0;
    let dt = 16;

    if (this.trailPoints.length > 0) {
      const last = this.trailPoints[this.trailPoints.length - 1];
      dt = Math.max(1, time - last.time);
      dx = x - last.x;
      dy = y - last.y;
      const distance = Math.hypot(dx, dy);
      velocity = distance / dt; // pixels per millisecond
    }

    this.currentVelocity = velocity;

    // Check if motion exceeds slash threshold
    const isFastEnough = velocity >= CONFIG.TRACKING.SLASH_MIN_VELOCITY;
    this.isSlashing = isFastEnough;

    if (isFastEnough && this.trailPoints.length > 0) {
      const last = this.trailPoints[this.trailPoints.length - 1];
      const slashAngle = Math.atan2(dy, dx);
      
      // Determine dominant direction
      if (Math.abs(dx) > Math.abs(dy) * 1.4) {
        this.slashDirection = dx > 0 ? 'RIGHT' : 'LEFT';
      } else if (Math.abs(dy) > Math.abs(dx) * 1.4) {
        this.slashDirection = dy > 0 ? 'DOWN' : 'UP';
      } else {
        this.slashDirection = 'DIAGONAL';
      }

      this.activeSliceSegment = {
        x1: last.x,
        y1: last.y,
        x2: x,
        y2: y,
        angle: slashAngle,
        speed: velocity,
        time,
      };

      // Play blade whoosh sound if cooldown elapsed
      if (time - this.lastWhooshTime > 180 && velocity > 1.2) {
        sound.playWhoosh(velocity);
        this.lastWhooshTime = time;
      }
    } else {
      this.activeSliceSegment = null;
      this.slashDirection = null;
    }

    this.trailPoints.push({
      x,
      y,
      time,
      velocity,
      alpha: 1.0,
    });

    // Enforce max points limit
    if (this.trailPoints.length > CONFIG.TRACKING.TRAIL_MAX_POINTS) {
      this.trailPoints.shift();
    }
  }

  /**
   * Update point lifetimes and trail decay
   */
  update(dt, now = performance.now()) {
    // Prune stale trail points older than SLASH_MAX_SAMPLE_AGE
    const maxAge = CONFIG.TRACKING.SLASH_MAX_SAMPLE_AGE;
    
    for (let i = this.trailPoints.length - 1; i >= 0; i--) {
      const pt = this.trailPoints[i];
      const age = now - pt.time;
      pt.alpha = Math.max(0, 1.0 - (age / maxAge));
      if (age > maxAge || pt.alpha <= 0) {
        this.trailPoints.splice(i, 1);
      }
    }

    // Decay active slice segment after 40ms
    if (this.activeSliceSegment && (now - this.activeSliceSegment.time > 45)) {
      this.activeSliceSegment = null;
    }
  }

  /**
   * Get active slice line segment for continuous collision checks with targets
   */
  getActiveSegment() {
    return this.activeSliceSegment;
  }

  /**
   * Check if a circle collides with a line segment
   */
  static checkCircleSegmentIntersection(cx, cy, radius, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;

    if (lenSq === 0) {
      return Math.hypot(cx - x1, cy - y1) <= radius;
    }

    // Projection parameter t of circle center onto segment
    const t = Math.max(0, Math.min(1, ((cx - x1) * dx + (cy - y1) * dy) / lenSq));

    // Nearest point on segment
    const nearestX = x1 + t * dx;
    const nearestY = y1 + t * dy;

    const dist = Math.hypot(cx - nearestX, cy - nearestY);
    return dist <= radius;
  }
}
