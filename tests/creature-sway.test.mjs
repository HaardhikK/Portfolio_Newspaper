import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/creature-engine.js', import.meta.url), 'utf8');
const bodyWave = source.slice(source.indexOf('  function bodyWave('), source.indexOf('  function paintHeader('));
const anatomy = { wave: 0.11, rampStart: 0.44, wavelength: 1.1, waveRate: 0.18 };
const smoothstep = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

for (const [id, scale] of [['arc', 0], ['filament', 0.85]]) {
  test(`${id} reduces sway amplitude without changing wave timing`, () => {
    for (const elapsed of [0, 0.5, 2, 7, 15]) {
      for (const u of [0, 0.3, 0.6, 0.8, 1]) {
        const actual = vm.runInNewContext(`${bodyWave}\nbodyWave(swimmer, u, radius);`, {
          swimmer: { definition: { id }, field: { anatomy } },
          u, radius: 120, elapsed, smoothstep, Math,
        });
        const previous = anatomy.wave * 120 * smoothstep(anatomy.rampStart, 1, u)
          * Math.sin(Math.PI * 2 * (u / anatomy.wavelength - elapsed * anatomy.waveRate * 1.6));
        assert(Math.abs(actual - previous * scale) < 1e-10);
      }
    }
  });
}
