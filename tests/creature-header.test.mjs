import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/creature-engine.js', import.meta.url), 'utf8');
const paint = source.slice(source.indexOf('  function paintHeader('), source.indexOf('  function draw()'));

test('header uses original creature colors and reuses the exact body paths', () => {
  const calls = [];
  const paths = [{ id: 'head' }, { id: 'tail' }];
  const palette = ['rgb(255,77,134)', 'rgb(255,193,50)'];
  const headerCtx = { fillStyle: null, fill(path) { calls.push([path, this.fillStyle]); } };
  vm.runInNewContext(`${paint}\npaintHeader(paths, palette);`, { paths, palette, headerCtx });
  assert.deepEqual(calls, [[paths[0], palette[0]], [paths[1], palette[1]]]);
});

test('rendering remains valid without an optional header layer', () => {
  vm.runInNewContext(`${paint}\npaintHeader([], []);`, { headerCtx: null });
});
