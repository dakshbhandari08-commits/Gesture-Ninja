/**
 * Gesture Ninja - MediaPipe Hands Webcam Tracker
 * Tracks hand landmarks in real-time, mirrors coordinates, applies smoothing,
 * and renders the skeleton in the PIP calibration preview.
 */

import { CONFIG } from './config.js';

export class HandTracker {
  constructor(videoElement, previewCanvas) {
    this.video = videoElement;
    this.previewCanvas = previewCanvas;
    this.previewCtx = previewCanvas ? previewCanvas.getContext('2d') : null;

    this.hands = null;
    this.camera = null;
    this.isRunning = false;
    this.hasHand = false;
    this.status = 'STOPPED'; // 'STOPPED', 'STARTING', 'READY', 'NO_HAND', 'TRACKING', 'ERROR'
    this.onStatusChange = null;
    this.onHandMove = null;

    // Smoothed position
    this.smoothedX = 0;
    this.smoothedY = 0;
    this.lastRawX = 0;
    this.lastRawY = 0;
    this.isCalibrated = false;

    // Video stream handle
    this.stream = null;
  }

  /**
   * Initialize MediaPipe Hands
   */
  async init() {
    if (!window.Hands) {
      console.error('MediaPipe Hands library not loaded!');
      this.updateStatus('ERROR', 'MediaPipe library not loaded from CDN.');
      return false;
    }

    try {
      this.hands = new window.Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: CONFIG.TRACKING.MODEL_COMPLEXITY,
        minDetectionConfidence: CONFIG.TRACKING.MIN_DETECTION_CONFIDENCE,
        minTrackingConfidence: CONFIG.TRACKING.MIN_TRACKING_CONFIDENCE,
      });

      this.hands.onResults(this.onResults.bind(this));
      return true;
    } catch (err) {
      console.error('Error initializing MediaPipe Hands:', err);
      this.updateStatus('ERROR', err.message);
      return false;
    }
  }

  /**
   * Request webcam access and start tracking loop
   */
  async start() {
    if (this.isRunning) return true;
    this.updateStatus('STARTING', 'Requesting camera access...');

    if (!this.hands) {
      const initialized = await this.init();
      if (!initialized) return false;
    }

    try {
      if (window.Camera) {
        // Use MediaPipe's Camera helper if available
        this.camera = new window.Camera(this.video, {
          onFrame: async () => {
            if (this.isRunning && this.hands) {
              await this.hands.send({ image: this.video });
            }
          },
          width: 640,
          height: 480,
        });
        await this.camera.start();
      } else {
        // Fallback standard getUserMedia
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: false,
        });
        this.stream = stream;
        this.video.srcObject = stream;
        await this.video.play();
        this.startManualLoop();
      }

      this.isRunning = true;
      this.updateStatus('READY', 'Webcam active. Position hand...');
      return true;
    } catch (err) {
      console.error('Camera access failed:', err);
      this.updateStatus('ERROR', 'Camera permission denied or camera unavailable.');
      return false;
    }
  }

  startManualLoop() {
    const processFrame = async () => {
      if (!this.isRunning) return;
      if (this.video.readyState >= 2 && this.hands) {
        try {
          await this.hands.send({ image: this.video });
        } catch (e) {
          // Frame dropped, ignore
        }
      }
      if (this.isRunning) {
        requestAnimationFrame(processFrame);
      }
    };
    requestAnimationFrame(processFrame);
  }

  /**
   * Stop camera tracking
   */
  stop() {
    this.isRunning = false;
    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
    this.hasHand = false;
    this.updateStatus('STOPPED', 'Camera stopped.');
  }

  /**
   * Handle hand detection results from MediaPipe
   */
  onResults(results) {
    if (!this.isRunning) return;

    // Draw preview in mini PIP canvas
    this.renderPreview(results);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      this.hasHand = true;
      this.updateStatus('TRACKING', '🟢 HAND DETECTED');

      // Primary tracking point: Index Finger Tip (Landmark 8)
      const indexTip = landmarks[8];
      
      // Palm base/centroid for stability
      const wrist = landmarks[0];
      const middleBase = landmarks[9];
      const palmX = (wrist.x + middleBase.x) * 0.5;
      const palmY = (wrist.y + middleBase.y) * 0.5;

      // Blend index tip (75%) with palm (25%) for both swiftness and stability
      const rawNormalizedX = indexTip.x * 0.75 + palmX * 0.25;
      const rawNormalizedY = indexTip.y * 0.75 + palmY * 0.25;

      // MIRROR X coordinate so movement left->left and right->right
      const mirroredX = 1.0 - rawNormalizedX;
      const mirroredY = rawNormalizedY;

      // Apply Exponential Smoothing filter
      const factor = CONFIG.TRACKING.SMOOTHING_FACTOR;
      if (this.smoothedX === 0 && this.smoothedY === 0) {
        this.smoothedX = mirroredX;
        this.smoothedY = mirroredY;
      } else {
        this.smoothedX = this.smoothedX * factor + mirroredX * (1.0 - factor);
        this.smoothedY = this.smoothedY * factor + mirroredY * (1.0 - factor);
      }

      if (this.onHandMove) {
        this.onHandMove({
          normalizedX: this.smoothedX,
          normalizedY: this.smoothedY,
          rawX: mirroredX,
          rawY: mirroredY,
          landmarks,
        });
      }
    } else {
      if (this.hasHand) {
        this.hasHand = false;
        this.updateStatus('NO_HAND', '🔴 NO HAND DETECTED');
      }
    }
  }

  /**
   * Render PIP preview video + neon hand skeleton
   */
  renderPreview(results) {
    const canvases = [this.previewCanvas, document.getElementById('calibration-preview-canvas')].filter(Boolean);
    
    canvases.forEach(canvas => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;

      ctx.save();
      // Clear
      ctx.clearRect(0, 0, w, h);

      // Mirror preview video feed horizontally
      ctx.translate(w, 0);
      ctx.scale(-1, 1);

      if (results.image) {
        ctx.drawImage(results.image, 0, 0, w, h);
      } else if (this.video && this.video.readyState >= 2) {
        ctx.drawImage(this.video, 0, 0, w, h);
      }

      // Restore to normal coordinate space for overlay lines
      ctx.restore();

      // Dark cyberpunk scanline overlay
      ctx.fillStyle = 'rgba(10, 15, 25, 0.35)';
      ctx.fillRect(0, 0, w, h);

      // Draw hand skeleton if detected
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        // Connections between hand joints
        const CONNECTIONS = [
          [0,1],[1,2],[2,3],[3,4],        // Thumb
          [0,5],[5,6],[6,7],[7,8],        // Index
          [0,9],[9,10],[10,11],[11,12],   // Middle
          [0,13],[13,14],[14,15],[15,16], // Ring
          [0,17],[17,18],[18,19],[19,20], // Pinky
          [5,9],[9,13],[13,17]            // Palm base
        ];

        ctx.save();
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#00F0FF';

        // Draw skeleton lines (mirrored X)
        for (const [startIdx, endIdx] of CONNECTIONS) {
          const p1 = landmarks[startIdx];
          const p2 = landmarks[endIdx];
          ctx.beginPath();
          ctx.moveTo((1.0 - p1.x) * w, p1.y * h);
          ctx.lineTo((1.0 - p2.x) * w, p2.y * h);
          ctx.stroke();
        }

        // Draw joint dots
        for (let i = 0; i < landmarks.length; i++) {
          const pt = landmarks[i];
          const px = (1.0 - pt.x) * w;
          const py = pt.y * h;

          ctx.beginPath();
          if (i === 8) {
            // Blade tip (Index fingertip)
            ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#FFE600';
            ctx.shadowColor = '#FFE600';
            ctx.shadowBlur = 10;
          } else {
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#00FF9D';
            ctx.shadowColor = '#00FF9D';
            ctx.shadowBlur = 4;
          }
          ctx.fill();
        }
        ctx.restore();
      }
    });
  }

  updateStatus(status, message = '') {
    this.status = status;
    if (this.onStatusChange) {
      this.onStatusChange({ status, message });
    }
  }
}
