/* ============================================
   CANDY POP - Sparkle Particle System v2

   Fixes from v1:
   - Canvas z-index raised above workbench DOM
   - Typing detected via MutationObserver on cursor
     position (VS Code swallows keydown events)
   - Works in both editor and terminal
   - DPR-aware canvas for crisp rendering
   - Performance: frame budget, particle caps,
     visibility-aware, no shadowBlur on bursts
   ============================================ */

(function () {
  'use strict';

  if (window.__candyPopParticlesInitialized) return;
  window.__candyPopParticlesInitialized = true;

  // --- Configuration ---
  const CONFIG = {
    maxFloatingSparkles: 30,       // Background starfield count
    maxBurstParticles: 80,         // Hard cap on typing burst particles alive at once
    burstPerKeystroke: 4,          // Particles spawned per detected keystroke
    burstThrottleMs: 30,           // Min ms between burst spawns (perf guard)
    targetFps: 60,                 // Target frame rate
    canvasOpacity: 0.7,            // Overall canvas opacity
    pauseWhenHidden: true,         // Stop animation when tab is not visible
  };

  const COLORS_DARK = [
    '#ec4899', '#f472b6', '#22d3ee', '#34d399',
    '#facc15', '#a78bfa', '#f9a8d4', '#67e8f9'
  ];

  const COLORS_LIGHT = [
    '#db2777', '#be185d', '#0891b2', '#059669',
    '#d97706', '#7c3aed', '#f472b6', '#0e7490'
  ];

  // --- Utility ---
  function getColors() {
    const bg = getComputedStyle(document.body).backgroundColor;
    const m = bg.match(/\d+/g);
    if (m) {
      const lum = (0.299 * +m[0] + 0.587 * +m[1] + 0.114 * +m[2]) / 255;
      return lum > 0.5 ? COLORS_LIGHT : COLORS_DARK;
    }
    return COLORS_DARK;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // --- Canvas Setup ---
  // z-index must be above VS Code's workbench layers but still non-interactive
  function createCanvas() {
    const c = document.createElement('canvas');
    c.id = 'candy-pop-sparkles';
    c.style.cssText =
      'position:fixed;top:0;left:0;width:100vw;height:100vh;' +
      'pointer-events:none;z-index:2147483646;' +
      'opacity:' + CONFIG.canvasOpacity + ';';
    document.body.appendChild(c);
    return c;
  }

  // --- Floating Sparkle (background starfield) ---
  function createSparkle(w, h, colors, randomY) {
    const size = Math.random() * 2 + 0.5;
    return {
      x: Math.random() * w,
      y: randomY ? Math.random() * h : -10,
      size: size,
      dy: Math.random() * 0.25 + 0.05,
      dx: (Math.random() - 0.5) * 0.15,
      alpha: Math.random() * 0.4 + 0.15,
      twinkle: Math.random() * 0.015 + 0.004,
      phase: Math.random() * Math.PI * 2,
      color: pick(colors),
      w: w, h: h,
    };
  }

  function updateSparkle(s) {
    s.y += s.dy;
    s.x += s.dx;
    s.phase += s.twinkle;
    s.curAlpha = s.alpha * (0.4 + 0.6 * Math.sin(s.phase));
    if (s.y > s.h + 10 || s.x < -10 || s.x > s.w + 10) {
      s.x = Math.random() * s.w;
      s.y = -10;
    }
  }

  // Draw a simple 4-pointed star (no shadowBlur for perf)
  function drawSparkle(ctx, s) {
    const sz = s.size;
    ctx.globalAlpha = s.curAlpha;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y - sz * 2);
    ctx.lineTo(s.x + sz * 0.4, s.y - sz * 0.4);
    ctx.lineTo(s.x + sz * 2, s.y);
    ctx.lineTo(s.x + sz * 0.4, s.y + sz * 0.4);
    ctx.lineTo(s.x, s.y + sz * 2);
    ctx.lineTo(s.x - sz * 0.4, s.y + sz * 0.4);
    ctx.lineTo(s.x - sz * 2, s.y);
    ctx.lineTo(s.x - sz * 0.4, s.y - sz * 0.4);
    ctx.closePath();
    ctx.fill();
  }

  // --- Burst Particle (typing sparkle) ---
  function createBurst(x, y, color) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2.5 + 0.8;
    return {
      x: x, y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.8,
      size: Math.random() * 2.5 + 0.8,
      life: 1,
      decay: Math.random() * 0.025 + 0.018,
      color: color,
    };
  }

  function updateBurst(p) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.04;       // gravity
    p.vx *= 0.97;       // drag
    p.life -= p.decay;
    p.size *= 0.995;
  }

  // Simple filled circle — no shadowBlur (saves ~40% GPU)
  function drawBurst(ctx, p) {
    if (p.life <= 0) return;
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, 6.2832);
    ctx.fill();
  }

  // --- Cursor Tracking via MutationObserver ---
  // VS Code editor uses a hidden <textarea> for keyboard input and
  // moves .cursor elements via inline styles. We detect typing by
  // watching cursor style attribute mutations.
  // Terminal (xterm) uses a similar pattern with its cursor element.

  let lastBurstTime = 0;
  let burstQueue = [];

  function setupCursorObserver(colors) {
    // Observe the entire document for cursor style changes
    const observer = new MutationObserver(function (mutations) {
      const now = performance.now();
      if (now - lastBurstTime < CONFIG.burstThrottleMs) return;

      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];
        if (m.type !== 'attributes' || m.attributeName !== 'style') continue;

        const el = m.target;
        if (!el || !el.classList) continue;

        // Match editor cursors and xterm terminal cursors
        const isEditorCursor = el.classList.contains('cursor') &&
          el.closest('.cursors-layer');
        const isTermCursor = el.classList.contains('xterm-cursor');

        if (isEditorCursor || isTermCursor) {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) continue;

          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;

          // Spawn burst particles
          spawnBurst(cx, cy, colors);
          lastBurstTime = now;
          return; // One burst per mutation batch
        }
      }
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style'],
      subtree: true,
    });

    return observer;
  }

  // Fallback: also listen for keydown in capture phase
  // This catches terminal typing and any other input VS Code doesn't block
  function setupKeydownFallback(colors) {
    function onKey(e) {
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Escape'].includes(e.key)) return;

      const now = performance.now();
      if (now - lastBurstTime < CONFIG.burstThrottleMs) return;

      // Try editor cursor first
      let cursor = document.querySelector('.monaco-editor .cursors-layer .cursor');
      // Try terminal cursor
      if (!cursor) cursor = document.querySelector('.xterm-cursor');
      if (!cursor) return;

      const rect = cursor.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      spawnBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, colors);
      lastBurstTime = now;
    }

    // Capture phase so we get the event before VS Code stops propagation
    document.addEventListener('keydown', onKey, true);
    return onKey;
  }

  function spawnBurst(x, y, colors) {
    // Enforce hard cap
    if (burstParticles.length >= CONFIG.maxBurstParticles) return;

    const count = CONFIG.burstPerKeystroke;
    for (let i = 0; i < count; i++) {
      burstParticles.push(createBurst(x, y, pick(colors)));
    }
  }

  // --- Main Loop ---
  let canvas, ctx, dpr;
  let sparkles = [];
  let burstParticles = [];
  let animId = null;
  let cursorObserver = null;
  let keydownHandler = null;

  function init() {
    canvas = createCanvas();
    ctx = canvas.getContext('2d');
    dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for perf
    resize();

    const colors = getColors();

    // Create floating starfield
    for (let i = 0; i < CONFIG.maxFloatingSparkles; i++) {
      sparkles.push(createSparkle(canvas.width / dpr, canvas.height / dpr, colors, true));
    }

    // Setup typing detection (both methods for reliability)
    cursorObserver = setupCursorObserver(colors);
    keydownHandler = setupKeydownFallback(colors);

    // Visibility-aware animation
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', resize);

    animate();
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    // CSS size stays at viewport, canvas resolution scales with DPR
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = window.innerWidth;
    const h = window.innerHeight;
    sparkles.forEach(function (s) { s.w = w; s.h = h; });
  }

  function onVisibility() {
    if (CONFIG.pauseWhenHidden) {
      if (document.hidden) {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
      } else {
        if (!animId) animate();
      }
    }
  }

  function animate() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);

    // Floating sparkles
    for (let i = 0; i < sparkles.length; i++) {
      updateSparkle(sparkles[i]);
      drawSparkle(ctx, sparkles[i]);
    }
    ctx.globalAlpha = 1; // Reset after sparkles

    // Burst particles — iterate backwards for efficient splice
    for (let i = burstParticles.length - 1; i >= 0; i--) {
      const p = burstParticles[i];
      updateBurst(p);
      if (p.life <= 0) {
        burstParticles.splice(i, 1);
      } else {
        drawBurst(ctx, p);
      }
    }
    ctx.globalAlpha = 1;

    animId = requestAnimationFrame(animate);
  }

  function destroy() {
    if (animId) cancelAnimationFrame(animId);
    if (cursorObserver) cursorObserver.disconnect();
    if (keydownHandler) document.removeEventListener('keydown', keydownHandler, true);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('resize', resize);
    const el = document.getElementById('candy-pop-sparkles');
    if (el) el.remove();
    sparkles = [];
    burstParticles = [];
    window.__candyPopParticlesInitialized = false;
  }

  window.__candyPopParticlesDestroy = destroy;

  // Wait for the workbench DOM to be ready before initializing
  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }
})();
