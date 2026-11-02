import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Exercise the actual engine function without a browser or a drawing context.
const source = readFileSync(new URL('../js/creature-engine.js', import.meta.url), 'utf8');
const wander = source.slice(source.indexOf('  function wander(dt)'), source.indexOf('  function pigment(color)'));

function advance(mobile, angle = 0, id = 'filament') {
  const swimmer = {
    x: 0.4, y: 0.4, angle, bodyAngle: angle, turnRate: 0,
    targetX: 0.9, targetY: 0.4, targetAge: 0, nextTarget: 20,
    speed: 40, phase: -0.31 * (mobile ? 0.2 : 1), shapePhase: 0,
    definition: { id, timeStep: 1 / 60, phaseRateScale: 1 },
  };
  vm.runInNewContext(`${wander}\nwander(1);`, {
    mobileLayout: { matches: mobile }, elapsed: 1, width: 390, height: 844,
    swimmers: [swimmer], Math,
  });
  return swimmer;
}

test('mobile travel is 80% slower, independently of internal body phase', () => {
  const mobile = advance(true), desktop = advance(false);
  assert(Math.abs((mobile.x - 0.4) * 390 - 8) < 1e-8);
  assert(Math.abs((desktop.x - 0.4) * 390 - 40) < 1e-8);
  assert.equal(mobile.shapePhase, desktop.shapePhase);
  assert.equal(mobile.shapePhase, 1.6);
});

test('mobile heading changes are reduced without changing the body clock', () => {
  const mobile = advance(true, Math.PI / 2), desktop = advance(false, Math.PI / 2);
  const mobileTurn = Math.PI / 2 - mobile.angle;
  const desktopTurn = Math.PI / 2 - desktop.angle;
  assert(Math.abs(mobileTurn / desktopTurn - 0.2) < 1e-8);
  assert.equal(mobile.shapePhase, desktop.shapePhase);
});

test('desktop green creature faces its travel direction through left and right turns', () => {
  for (const angle of [-Math.PI + 0.01, -Math.PI / 2, Math.PI / 2, Math.PI - 0.01]) {
    const swimmer = advance(false, angle, 'arc');
    assert.equal(swimmer.bodyAngle, swimmer.angle);
    assert.equal(swimmer.shapePhase, 1.6);
  }
});

test('mobile does not simulate the green creature', () => {
  const swimmer = advance(true, 0.7, 'arc');
  assert.equal(swimmer.x, 0.4);
  assert.equal(swimmer.y, 0.4);
  assert.equal(swimmer.angle, 0.7);
  assert.equal(swimmer.shapePhase, 0);
  assert.equal(swimmer.targetAge, 0);
});

test('green creature starts aligned to its first target without realigning on resize', () => {
  const resize = source.slice(source.indexOf('  function resize('), source.indexOf('  function wander(dt)'));
  const swimmer = { definition: { id: 'arc' }, x: 0.78, y: 0.72,
    targetX: 0.2, targetY: 0.3, angle: 2.5, bodyAngle: null, palette: [] };
  const context = vm.createContext({ swimmers: [swimmer], settings: { width: 390, height: 844, mobile: true },
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
