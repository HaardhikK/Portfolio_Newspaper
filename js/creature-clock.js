// Preserve deadlines rather than resetting to each display callback. This keeps
// 60 FPS even on 90/120 Hz displays and avoids floating-point frame skipping.
export function createFrameClock(fps) {
  const interval = 1000 / fps;
  let last = null;
  let next = null;
  return {
    reset() { last = null; next = null; },
    step(now) {
      if (last === null) { last = now; next = now + interval; return null; }
      if (now + 0.25 < next) return null;
      const elapsed = Math.max(0, (now - last) / 1000);
      last = now;
      next += Math.max(1, Math.floor((now - next + 0.25) / interval) + 1) * interval;
      return Math.min(elapsed, 0.1);
    },
  };
}
