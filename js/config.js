/**
 * Gesture Ninja - Game Configuration & Constants
 */

export const CONFIG = {
  // Canvas rendering configuration
  CANVAS: {
    DEFAULT_WIDTH: 1280,
    DEFAULT_HEIGHT: 720,
    FPS_TARGET: 60,
  },

  // Gesture & Hand Tracking Settings
  TRACKING: {
    // MediaPipe model config
    MODEL_COMPLEXITY: 1, // 0: Lite, 1: Full
    MIN_DETECTION_CONFIDENCE: 0.65,
    MIN_TRACKING_CONFIDENCE: 0.65,
    
    // Smoothing & interpolation (0 = raw, 1 = no movement)
    SMOOTHING_FACTOR: 0.35,
    
    // Slash velocity detection thresholds (pixels per millisecond)
    SLASH_MIN_VELOCITY: 0.75,       // Minimum speed to trigger a blade slice
    SLASH_MAX_SAMPLE_AGE: 200,      // Keep last 200ms of points for trail
    TRAIL_MAX_POINTS: 20,           // Maximum points retained in the trail
    TRAIL_FADE_SPEED: 0.08,         // Alpha decay per frame
    
    // Blade visual properties
    BLADE_WIDTH_START: 16,          // Blade thickness at recent hand position
    BLADE_WIDTH_END: 2,             // Blade thickness at trail tail
    BLADE_COLOR_CORE: '#FFFFFF',
    BLADE_COLOR_GLOW: '#00F0FF',    // Neon Cyan
    BLADE_COLOR_FRENZY: '#FFD700',  // Golden when frenzy/combo is high
  },

  // Gameplay Settings
  GAME: {
    INITIAL_LIVES: 3,
    MAX_LIVES: 3,
    ROUND_DURATION_SEC: 90,         // Exact 90 seconds per match
    
    // Projectile Physics Base
    GRAVITY: 980,                   // px/s^2
    MIN_SPEED_Y: -920,              // Initial upward impulse (px/s)
    MAX_SPEED_Y: -1160,
    MIN_SPEED_X: -260,              // Horizontal toss spread
    MAX_SPEED_X: 260,
    
    // Progressive Difficulty Tiers across 90 seconds
    DIFFICULTY_TIERS: [
      {
        name: 'EASY',
        color: '#00FF9D',
        minSec: 0,
        maxSec: 20,
        spawnIntervalMin: 1400,
        spawnIntervalMax: 2000,
        speedMult: 0.9,
        multiSpawnChance: 0.08,
        bombChance: 0.08,
      },
      {
        name: 'MEDIUM',
        color: '#00F0FF',
        minSec: 20,
        maxSec: 40,
        spawnIntervalMin: 1100,
        spawnIntervalMax: 1600,
        speedMult: 1.05,
        multiSpawnChance: 0.28,
        bombChance: 0.16,
      },
      {
        name: 'HARD',
        color: '#FFE600',
        minSec: 40,
        maxSec: 60,
        spawnIntervalMin: 850,
        spawnIntervalMax: 1300,
        speedMult: 1.2,
        multiSpawnChance: 0.48,
        bombChance: 0.22,
      },
      {
        name: 'VERY FAST',
        color: '#FF7700',
        minSec: 60,
        maxSec: 75,
        spawnIntervalMin: 650,
        spawnIntervalMax: 1000,
        speedMult: 1.34,
        multiSpawnChance: 0.65,
        bombChance: 0.27,
      },
      {
        name: 'INSANE',
        color: '#FF2A6D',
        minSec: 75,
        maxSec: 90,
        spawnIntervalMin: 500,
        spawnIntervalMax: 800,
        speedMult: 1.48,
        multiSpawnChance: 0.80,
        bombChance: 0.32,
      }
    ],

    // Target Spawn probabilities
    TARGET_PROBABILITIES: {
      NORMAL: 0.72,
      GOLDEN: 0.10,
      BOMB: 0.18,
    },
    
    // Scoring & Combos
    SCORES: {
      NORMAL_TARGET: 100,
      GOLDEN_TARGET: 300,
      COMBO_MULTIPLIER_BASE: 1.0,
      COMBO_WINDOW_MS: 380,         // Window in ms to chain slices for combos
    },
    
    // Combo milestones
    COMBOS: [
      { count: 2, label: 'NICE!', multiplier: 1.2, color: '#38ef7d' },
      { count: 3, label: 'GREAT!', multiplier: 1.5, color: '#00f0ff' },
      { count: 4, label: 'SUPERB!', multiplier: 2.0, color: '#ff007f' },
      { count: 5, label: 'PERFECT!', multiplier: 2.5, color: '#ffe600' },
      { count: 6, label: 'GODLIKE!', multiplier: 3.5, color: '#ff3366' },
    ],
  },

  // Visual Effects Settings
  VFX: {
    MAX_PARTICLES: 350,
    SCREEN_SHAKE_SLICE: 4,
    SCREEN_SHAKE_BOMB: 24,
    SCREEN_SHAKE_DECAY: 0.88,
  },

  // Storage Keys
  STORAGE_KEYS: {
    HIGH_SCORE: 'gesture_ninja_high_score',
    SETTINGS: 'gesture_ninja_settings',
  }
};
