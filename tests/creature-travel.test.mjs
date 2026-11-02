import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Exercise the actual engine function without a browser or a drawing context.
const source = readFileSync(new URL('../js/creature-engine.js', import.meta.url), 'utf8');
const wander = source.slice(source.indexOf('  function wander(dt)'), source.indexOf('  function pigment(color)'));

function advance(mobile, angle = 0) {
  const swimmer = {
    x: 0.4, y: 0.4, angle, bodyAngle: angle, turnRate: 0,
    targetX: 0.9, targetY: 0.4, targetAge: 0, nextTarget: 20,
    speed: 40, phase: -0.31 * (mobile ? 0.2 : 1), shapePhase: 0,
    definition: { timeStep: 1 / 60, phaseRateScale: 1 },
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
