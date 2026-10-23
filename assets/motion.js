/* Ambient colour field. No dependencies, network requests, or stored user data. */
(() => {
  'use strict';

  let active = null;
  const FRAME_INTERVAL = 1000 / 30;

  function mount(canvas) {
    if (active) active.destroy();
    if (!canvas || typeof canvas.getContext !== 'function') return null;

    let context;
    try { context = canvas.getContext('2d', { alpha: true }); } catch { return null; }
    if (!context) return null;

    const root = document.documentElement;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = { x: 0.5, y: 0.45 };
    const target = { x: 0.5, y: 0.45 };
    let width = 1, height = 1, ratio = 1;
    let frames = 0, elapsed = 0, previous = 0;
    let animation = 0, resizeFrame = 0;
    let running = false, destroyed = false;

    function blocked() {
      return reduced.matches || document.hidden || root.dataset.backgroundPaused === 'true' || root.dataset.backgroundSuspended === 'true';
    }

    function glow(x, y, radius, inner, outer) {
      const fill = context.createRadialGradient(x, y, 0, x, y, radius);
      fill.addColorStop(0, inner);
      fill.addColorStop(0.5, outer);
      fill.addColorStop(1, 'rgba(255,255,255,0)');
      context.fillStyle = fill;
      context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    function ribbon(index, time, colour) {
      const phase = time * 0.12 + index * 1.71;
      const drift = Math.sin(phase) * height * 0.09;
      const shiftX = (pointer.x - 0.5) * width * 0.055;
      const shiftY = (pointer.y - 0.5) * height * 0.075;
      const centre = height * (0.19 + index * 0.19) + drift + shiftY;
      const depth = height * (0.13 + index * 0.018);
      const amplitude = height * (0.2 + Math.cos(phase * 0.73) * 0.08);
      const lean = Math.sin(phase * 0.61) * height * 0.13;
      const start = -width * 0.2;
      const end = width * 1.2;

      const fill = context.createLinearGradient(0, centre - depth, width, centre + depth);
      fill.addColorStop(0, `rgba(${colour},0)`);
      fill.addColorStop(0.25, `rgba(${colour},0.10)`);
      fill.addColorStop(0.55, `rgba(${colour},0.22)`);
      fill.addColorStop(0.8, `rgba(${colour},0.08)`);
      fill.addColorStop(1, `rgba(${colour},0)`);

      context.beginPath();
      context.moveTo(start, centre - depth * 0.5);
      context.bezierCurveTo(width * 0.18 + shiftX, centre - amplitude, width * 0.56 + shiftX, centre + amplitude, end, centre + lean);
      context.bezierCurveTo(width * 0.7 + shiftX, centre + amplitude + depth, width * 0.22 + shiftX, centre - amplitude + depth, start, centre + depth);
      context.closePath();
      context.fillStyle = fill;
      context.fill();

      // A few translucent contours give the wide forms a folded, fabric-like edge.
      for (let line = 0; line < 3; line++) {
        const offset = depth * (line * 0.12 - 0.1);
        context.beginPath();
        context.moveTo(start, centre - depth * 0.5 + offset);
        context.bezierCurveTo(width * 0.18 + shiftX, centre - amplitude + offset, width * 0.56 + shiftX, centre + amplitude + offset, end, centre + lean + offset);
        const stroke = context.createLinearGradient(0, 0, width, 0);
        stroke.addColorStop(0, `rgba(${colour},0)`);
        stroke.addColorStop(0.3, `rgba(${colour},0.10)`);
        stroke.addColorStop(0.7, `rgba(${colour},0.16)`);
        stroke.addColorStop(1, `rgba(${colour},0)`);
        context.strokeStyle = stroke;
        context.lineWidth = line === 0 ? 1 : 0.65;
        context.stroke();
      }
    }

    function draw(time) {
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);

      const px = (pointer.x - 0.5) * width * 0.12;
      const py = (pointer.y - 0.5) * height * 0.12;
      const span = Math.max(width, height);
      glow(width * (0.18 + Math.sin(time * 0.075) * 0.12) + px, height * (0.2 + Math.cos(time * 0.06) * 0.09) + py, span * 0.55, 'rgba(222,77,144,0.46)', 'rgba(246,137,185,0.22)');
      glow(width * (0.78 + Math.cos(time * 0.065) * 0.1) - px, height * (0.5 + Math.sin(time * 0.08) * 0.13) - py, span * 0.58, 'rgba(126,91,205,0.40)', 'rgba(172,139,231,0.19)');
      glow(width * (0.43 + Math.sin(time * 0.055 + 2) * 0.12), height * (0.9 + Math.cos(time * 0.07) * 0.08), span * 0.5, 'rgba(255,151,99,0.40)', 'rgba(255,187,139,0.20)');

      ribbon(0, time, '218,132,168');
      ribbon(1, time + 5, '170,146,217');
      ribbon(2, time + 11, '244,176,142');
      ribbon(3, time + 7, '214,147,192');
      frames++;
    }

    function tick(now) {
      animation = 0;
      if (!running || destroyed || blocked()) {
        sync();
        return;
      }
      if (!previous) previous = now - FRAME_INTERVAL;
      const delta = now - previous;
      if (delta >= FRAME_INTERVAL - 0.5) {
        // Keep continuity when returning to a tab without simulating hidden time.
        elapsed += Math.min(delta, 70) / 1000;
        previous = now;
        pointer.x += (target.x - pointer.x) * 0.045;
        pointer.y += (target.y - pointer.y) * 0.045;
        draw(elapsed);
      }
      animation = window.requestAnimationFrame(tick);
    }

    function sync() {
      if (destroyed) return;
      const next = !blocked();
      if (next === running && (next ? animation : true)) return;
      running = next;
      previous = 0;
      if (animation) window.cancelAnimationFrame(animation);
      animation = 0;
      if (running) animation = window.requestAnimationFrame(tick);
      else draw(elapsed);
    }

    function resize() {
      resizeFrame = 0;
      if (destroyed) return;
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(bounds.width || window.innerWidth));
      height = Math.max(1, Math.round(bounds.height || window.innerHeight));
      ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      const nextWidth = Math.round(width * ratio), nextHeight = Math.round(height * ratio);
      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
      }
      draw(elapsed);
    }

    function requestResize() {
      if (!resizeFrame) resizeFrame = window.requestAnimationFrame(resize);
    }
    function move(event) {
      if (!running || event.pointerType === 'touch') return;
      target.x = Math.min(1, Math.max(0, event.clientX / width));
      target.y = Math.min(1, Math.max(0, event.clientY / height));
    }
    function leave() {
      target.x = 0.5;
      target.y = 0.45;
    }

    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['data-background-paused', 'data-background-suspended'] });
    const sizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(requestResize) : null;
    if (sizeObserver) sizeObserver.observe(canvas);
    else window.addEventListener('resize', requestResize, { passive: true });
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave, { passive: true });
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);

    const controller = {
      getState() {
        return { running, frames, pointer: { x: pointer.x, y: pointer.y }, reducedMotion: reduced.matches };
      },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        running = false;
        if (animation) window.cancelAnimationFrame(animation);
        if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
        observer.disconnect();
        if (sizeObserver) sizeObserver.disconnect();
        else window.removeEventListener('resize', requestResize);
        window.removeEventListener('pointermove', move);
        document.documentElement.removeEventListener('pointerleave', leave);
        document.removeEventListener('visibilitychange', sync);
        reduced.removeEventListener('change', sync);
        if (active === controller) active = null;
      },
    };

    resize();
    active = controller;
    sync();
    return controller;
  }

  window.MamasMotion = {
    mount,
    getState() { return active ? active.getState() : { running: false, frames: 0, pointer: { x: 0.5, y: 0.45 }, reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches }; },
    destroy() { if (active) active.destroy(); },
  };
})();
