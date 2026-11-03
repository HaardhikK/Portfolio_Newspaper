import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Exercise the actual engine function without a browser or a drawing context.
const source = readFileSync(new URL('../js/creature-engine.js', import.meta.url), 'utf8');
const wander = source.slice(source.indexOf('  function wander('), source.indexOf('  function pigment(color)'));

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

test('mobile travel is 50% faster than the previous gentle setting', () => {
  const mobile = advance(true), desktop = advance(false);
  assert(Math.abs((mobile.x - 0.4) * 390 - 6) < 1e-8);
  assert(Math.abs((desktop.x - 0.4) * 390 - 40) < 1e-8);
  assert.equal(mobile.shapePhase, desktop.shapePhase);
  assert.equal(mobile.shapePhase, 1.6);
});

test('mobile heading changes are reduced without changing the body clock', () => {
  const mobile = advance(true, Math.PI / 2), desktop = advance(false, Math.PI / 2);
  const mobileTurn = Math.PI / 2 - mobile.angle;
  const desktopTurn = Math.PI / 2 - desktop.angle;
  assert(Math.abs(mobileTurn / desktopTurn - 0.15) < 1e-8);
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
  assert(swimmer.x > 0.4);
  assert.equal(swimmer.bodyAngle, swimmer.angle);
  assert.equal(swimmer.shapePhase, 1.6);
  assert.equal(swimmer.targetAge, 1);
});

test('green creature starts aligned to its first target without realigning on resize', () => {
  const resize = source.slice(source.indexOf('  function resize('), source.indexOf('  function wander('));
  const swimmer = { definition: { id: 'arc' }, x: 0.78, y: 0.72,
    targetX: 0.2, targetY: 0.3, angle: 2.5, bodyAngle: null, palette: [] };
  const context = vm.createContext({ swimmers: [swimmer], settings: { width: 390, height: 844, mobile: false },
    mobileLayout: {}, reducedMotion: {}, canvas: {}, headerCanvas: null, ctx: { setTransform() {} },
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

test('mobile edge recovery sends creatures to distinct return areas, not the center', () => {
  const swimmers = ['filament', 'arc'].map(id => ({
    definition: { id, timeStep: 1 / 60, phaseRateScale: 1 },
    x: 0.1, y: 0.5, angle: 0, bodyAngle: 0, turnRate: 0,
    targetX: 0.5, targetY: 0.5, targetAge: 0, nextTarget: 20,
    speed: 40, phase: 0, shapePhase: 0,
  }));
  vm.runInNewContext(`${wander}\nwander(1 / 60);`, {
    swimmers, width: 390, height: 844, elapsed: 0, mobileLayout: { matches: true }, Math,
  });
  assert.equal(swimmers[0].targetX, 0.85);
  assert.equal(swimmers[1].targetX, 0.85);
  assert.equal(swimmers[0].targetY, 0.24);
  assert.equal(swimmers[1].targetY, 0.76);
});

test('mobile retargets in body-independent seconds and stays in separate destination bands', () => {
  const swimmers = ['filament', 'arc'].map(id => ({
    definition: { id, timeStep: 1 / 60, phaseRateScale: 1 },
    x: 0.4, y: 0.4, angle: 0, bodyAngle: 0, turnRate: 0,
    targetX: 0.9, targetY: 0.9, targetAge: 7.99, nextTarget: 8,
    speed: 40, phase: 0, shapePhase: 0,
  }));
  vm.runInNewContext(`${wander}\nwander(0.02, 0.001);`, {
    swimmers, width: 390, height: 844, elapsed: 0, mobileLayout: { matches: true }, Math,
  });
  assert.equal(swimmers[0].targetAge, 0);
  assert.equal(swimmers[1].targetAge, 0);
  assert(swimmers[0].targetY >= 0.16 && swimmers[0].targetY <= 0.42);
  assert(swimmers[1].targetY >= 0.58 && swimmers[1].targetY <= 0.84);
});
