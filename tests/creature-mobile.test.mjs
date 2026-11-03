import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/creature-engine.js', import.meta.url), 'utf8');
const tick = source.slice(source.indexOf('  function tick('), source.indexOf('  function syncPlayback('));

function step(mobile, wallTime, reduced = false) {
  let result;
  const context = { hidden: false, clock: { step: () => wallTime }, mobileLayout: { matches: mobile },
    reducedMotion: { matches: reduced }, metrics: { simulationSeconds: 0, bodySeconds: 0 }, elapsed: 0,
    wander: (travel, body) => { result = { travel, body }; }, draw() {}, schedule() {}, Math };
  vm.runInNewContext(`${tick}\ntick(1000);`, context);
  return result;
}

test('mobile body clock is 50% faster than the previous gentle setting', () => {
  const { travel, body } = step(true, 1 / 60);
  assert.equal(body, travel * 0.25 * 1.5);
  assert.equal(step(false, 1 / 60).body, 1 / 60 * 0.15);
});

test('desktop travel and internal animation share the same slow pace across motion preferences', () => {
  for (const reduced of [false, true]) {
    const result = step(false, 1 / 30, reduced);
    assert.equal(result.travel, 1 / 30 * 0.15);
    assert.equal(result.body, result.travel);
  }
});

test('late mobile frames cannot cause a large body animation jump', () => {
  assert.equal(step(true, 0.1).body, 1 / 80);
  assert(step(true, 1 / 60, true).body < step(true, 1 / 60).body);
});

test('both mobile creatures stay gray while desktop gradients and mint remain unchanged', () => {
  const palette = source.slice(source.indexOf('  function bodyPalette('), source.indexOf('  const swimmers'));
  function colors(mobile, definition) {
    return Array.from(vm.runInNewContext(`${palette}\nbodyPalette(definition);`, {
      mobileLayout: { matches: mobile }, definition, Math, parseInt,
    }));
  }
  const pika = { id: 'filament', gradient: ['#FF4D86', '#FF7A4D', '#FFC132'] };
  assert.deepEqual(colors(true, pika), ['rgba(55,55,55,0.62)']);
  assert.deepEqual(colors(true, { id: 'arc' }), ['rgba(55,55,55,0.62)']);
  assert.equal(colors(false, pika).length, 32);
  assert.equal(colors(false, pika)[0], 'rgb(255,77,134)');
  assert.equal(colors(false, pika).at(-1), 'rgb(255,193,50)');
  assert.deepEqual(colors(false, { id: 'arc' }), ['rgb(164,216,189)']);
});

test('changing the silhouette cannot move the mobile travel center or escape the screen', () => {
  const placement = source.slice(source.indexOf('      let offsetX = 0, offsetY = 0, fit = 1;'),
    source.indexOf('      const paths = swimmer.palette.map'));
  for (const [width, height] of [[390, 844], [844, 390], [320, 568]]) {
    let previous;
    for (const extent of [40, 90, 220, 400]) {
      const swimmer = { x: 0.05, y: 0.95 };
      const result = vm.runInNewContext(`${placement}\n({x, y});`, {
        x: 0, y: 0, sumX: 0, sumY: 0, count: 1,
        minX: -extent, maxX: extent, minY: -extent, maxY: extent,
        mobileLayout: { matches: true }, swimmer, width, height, Math,
      });
      if (previous) {
        assert.equal(result.x, previous.x);
        assert.equal(result.y, previous.y);
      }
      assert(swimmer.bounds.left >= 12 - 1e-8);
      assert(swimmer.bounds.right <= width - 12 + 1e-8);
      assert(swimmer.bounds.top >= 12 - 1e-8);
      assert(swimmer.bounds.bottom <= height - 12 + 1e-8);
      previous = result;
    }
  }
});
