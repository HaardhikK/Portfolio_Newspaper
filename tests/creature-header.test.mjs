import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/creature-engine.js', import.meta.url), 'utf8');
const copy = source.slice(source.indexOf('    if (headerCtx) {'),
  source.indexOf('    const duration = performance.now() - started;'));

test('header artwork copies only the exact header crop, clearing old frames first', () => {
  for (const ratio of [1, 1.5]) {
    const calls = [];
    const canvas = { width: 1440 * ratio };
    const headerCanvas = { width: 744 * ratio, height: 90 * ratio };
    vm.runInNewContext(copy, { canvas, headerCanvas, width: 1440,
      settings: { headerLeft: 348 }, Math,
      headerCtx: { clearRect: (...args) => calls.push(['clear', ...args]),
        drawImage: (...args) => calls.push(['copy', ...args]) } });
    assert.deepEqual(calls, [
      ['clear', 0, 0, headerCanvas.width, headerCanvas.height],
      ['copy', canvas, 348 * ratio, 0, headerCanvas.width, headerCanvas.height,
        0, 0, headerCanvas.width, headerCanvas.height],
    ]);
  }
});
