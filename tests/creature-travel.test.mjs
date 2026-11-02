import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Exercise the actual engine function without a browser or a drawing context.
const source = readFileSync(new URL('../js/creature-engine.js', import.meta.url), 'utf8');
const wander = source.slice(source.indexOf('  function moveMobile('), source.indexOf('  function pigment(color)'));

function advance(mobile, angle = 0, id = 'filament') {
  const swimmer = {
    x: 0.4, y: 0.4, angle, bodyAngle: angle, turnRate: 0,
    targetX: 0.9, targetY: 0.4, targetAge: 0, nextTarget: 20,
    speed: 40, phase: -0.31 * (mobile ? 0.15 : 1), shapePhase: 0,
    definition: { id, timeStep: 1 / 60, phaseRateScale: 1 },
  };
  vm.runInNewContext(`${wander}\nwander(1);`, {
    mobileLayout: { matches: mobile }, elapsed: 1, width: 390, height: 844,
    swimmers: [swimmer], Math,
  });
  return swimmer;
}

test('desktop travel and internal body rate remain unchanged', () => {
  const desktop = advance(false);
  assert(Math.abs((desktop.x - 0.4) * 390 - 40) < 1e-8);
  assert.equal(desktop.shapePhase, 1.6);
});

test('mobile route changes do not change the internal body clock', () => {
  const mobile = advance(true, Math.PI / 2), desktop = advance(false, Math.PI / 2);
  assert.equal(mobile.bodyAngle, mobile.angle);
  assert.equal(mobile.shapePhase, desktop.shapePhase);
});

test('desktop green creature faces its travel direction through left and right turns', () => {
  for (const angle of [-Math.PI + 0.01, -Math.PI / 2, Math.PI / 2, Math.PI - 0.01]) {
    const swimmer = advance(false, angle, 'arc');
    assert.equal(swimmer.bodyAngle, swimmer.angle);
    assert.equal(swimmer.shapePhase, 1.6);
  }
});

test('mobile restores the green creature with gentle travel', () => {
  const swimmer = advance(true, 0.7, 'arc');
  assert(swimmer.x > 0 && swimmer.x < 1);
  assert.equal(swimmer.bodyAngle, swimmer.angle);
  assert.equal(swimmer.shapePhase, 1.6);
  assert.equal(swimmer.targetAge, 0);
});

test('green creature starts aligned to its first target without realigning on resize', () => {
  const resize = source.slice(source.indexOf('  function resize('), source.indexOf('  function wander('));
  const swimmer = { definition: { id: 'arc' }, x: 0.78, y: 0.72,
    targetX: 0.2, targetY: 0.3, angle: 2.5, bodyAngle: null, palette: [] };
  const context = vm.createContext({ swimmers: [swimmer], settings: { width: 390, height: 844, mobile: false },
    mobileLayout: {}, reducedMotion: {}, canvas: {}, ctx: { setTransform() {} },
    createFrameClock() {}, bodyPalette: () => [], pigment() {}, draw() {}, Math });
  vm.runInContext(`${resize}\nresize();`, context);
  const expected = Math.atan2((0.3 - 0.72) * 844, (0.2 - 0.78) * 390);
  assert.equal(swimmer.angle, expected);
  assert.equal(swimmer.bodyAngle, expected);
  swimmer.angle = 0.4;
  swimmer.bodyAngle = 0.4;
  vm.runInContext('resize();', context);
  assert.equal(swimmer.angle, 0.4);
  assert.equal(swimmer.bodyAngle, 0.4);
});

test('mobile routes remain separated and keep moving for ten minutes', () => {
  const swimmers = ['filament', 'arc'].map(id => ({
    definition: { id, timeStep: 1 / 60, phaseRateScale: 1 },
    x: 0.1, y: 0.5, angle: 0, bodyAngle: 0, turnRate: 0,
    targetX: 0.5, targetY: 0.5, targetAge: 0, nextTarget: 20,
    speed: 40, phase: 0, shapePhase: 0,
  }));
  for (const [width, height] of [[390, 844], [844, 390], [320, 568]]) {
    const context = vm.createContext({ swimmers: structuredClone(swimmers), width, height,
      elapsed: 0, mobileLayout: { matches: true }, Math, assert });
    vm.runInContext(`${wander}
      const safe = Math.min(width, height) * 0.4 - 12;
      const screen = s => [(s.x - 0.5) * (width - 2 * safe - 24),
        (s.y - 0.5) * (height - 2 * safe - 24)];
      swimmers.forEach(s => moveMobile(s, 0));
      for (let frame = 0; frame < 36000; frame++) {
        const before = swimmers.map(screen);
        wander(0.55 / 60, 0.55 / 60 * 0.375);
        swimmers.forEach((s, index) => {
          const after = screen(s);
          const pixelsPerSecond = Math.hypot(after[0] - before[index][0], after[1] - before[index][1]) * 60;
          assert(pixelsPerSecond > 12 && pixelsPerSecond < 15);
          assert.equal(s.angle, s.bodyAngle);
          assert(s.x > 0 && s.x < 1 && s.y > 0 && s.y < 1);
        });
        const a = screen(swimmers[0]), b = screen(swimmers[1]);
        assert(Math.hypot(a[0] - b[0], a[1] - b[1]) > 30);
      }
    `, context);
  }
});
