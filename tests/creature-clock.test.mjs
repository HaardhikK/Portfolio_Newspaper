import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFrameClock } from '../js/creature-clock.js';

for (const refresh of [60, 90, 120, 144]) {
  for (const fps of [30, 60]) {
    test(`${fps} FPS on a ${refresh} Hz display preserves cadence and travel time`, () => {
      const clock = createFrameClock(fps);
      let frames = 0;
      let elapsed = 0;
      for (let i = 0; i <= refresh * 10; i++) {
        const dt = clock.step(i * 1000 / refresh);
        if (dt !== null) { frames++; elapsed += dt; }
      }
      assert.equal(frames, fps * 10);
      assert(Math.abs(elapsed - 10) < 1e-8);
    });
  }
}

test('display callback jitter does not accumulate into dropped frames', () => {
  const clock = createFrameClock(60);
  let frames = 0;
  for (let i = 0; i <= 1200; i++) {
    const jitter = i === 0 || i === 1200 ? 0 : Math.sin(i * 1.7) * 0.12;
    if (clock.step(i * 1000 / 120 + jitter) !== null) frames++;
  }
  assert.equal(frames, 600);
});

test('resuming a hidden tab does not advance by its hidden duration', () => {
  const clock = createFrameClock(60);
  clock.step(0);
  clock.step(1000 / 60);
  clock.reset();
  assert.equal(clock.step(60_000), null);
  assert(Math.abs(clock.step(60_000 + 1000 / 60) - 1 / 60) < 1e-8);
});

test('long stalls are bounded without permanently slowing the animation', () => {
  const clock = createFrameClock(60);
  clock.step(0);
  assert.equal(clock.step(1000), 0.1);
  assert(Math.abs(clock.step(1000 + 1000 / 60) - 1 / 60) < 1e-8);
});
