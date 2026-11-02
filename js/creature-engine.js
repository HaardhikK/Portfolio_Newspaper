import { definitionFor } from '../assets/vendor/alvalta/model.js?v=device-sampling';
import { BodyField, DEFORM_BANDS, smoothstep } from '../assets/vendor/alvalta/body-field.js';
import envelopes from '../assets/vendor/alvalta/envelopes.js';
import { createFrameClock } from './creature-clock.js';

export function createCreatureEngine(canvas, settings) {
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  const reducedMotion = { matches: settings.reducedMotion };
  const mobileLayout = { matches: settings.mobile };
  let hidden = false;
  const schedule = callback => typeof requestAnimationFrame === 'function'
    ? requestAnimationFrame(callback) : setTimeout(() => callback(performance.now()), 1000 / 60);
  const cancel = handle => typeof cancelAnimationFrame === 'function'
    ? cancelAnimationFrame(handle) : clearTimeout(handle);
  const metrics = { frames: 0, totalDrawMs: 0, maxDrawMs: 0, simulationSeconds: 0, shapeUpdates: 0 };
  let clock = createFrameClock(settings.mobile && !settings.lightweight ? 60 : 30);

  function definitionForDevice(id) {
    const original = definitionFor(id);
    return { ...original, generate: (phase, target) => original.generate(phase, target,
      mobileLayout.matches ? settings.lightweight ? 12 : 8 : 3) };
  }

  function bodyPalette(definition) {
    const stops = definition.gradient ?? [definition.id === 'arc' ? '#a4d8bd' : definition.color];
    const rgb = stops.map(color => [1, 3, 5].map(offset => parseInt(color.slice(offset, offset + 2), 16)));
    const count = stops.length === 1 ? 1 : mobileLayout.matches ? 16 : 32;
    return Array.from({ length: count }, (_, index) => {
      const position = index / Math.max(1, count - 1) * (rgb.length - 1);
      const first = Math.floor(position), last = Math.min(rgb.length - 1, first + 1);
      const mix = position - first;
      return `rgb(${rgb[first].map((value, channel) => Math.round(value + (rgb[last][channel] - value) * mix)).join(',')})`;
    });
  }

  const swimmers = ['filament', 'arc'].map((id, index) => ({
    definition: definitionForDevice(id),
    palette: bodyPalette(definitionFor(id)),
    brushes: [],
    field: new BodyField(definitionForDevice(id), envelopes[id], index ? 3.51 : 1.17),
    shapePhase: index ? 3.51 : 1.17,
    deformX: new Float32Array(DEFORM_BANDS),
    deformY: new Float32Array(DEFORM_BANDS),
    x: index === 0 ? 0.22 : 0.78,
    y: index === 0 ? 0.35 : 0.72,
    angle: Math.random() * Math.PI * 2,
    bodyAngle: null,
    turnRate: 0,
    targetX: Math.random(),
    targetY: Math.random(),
    targetAge: 0,
    nextTarget: 12 + Math.random() * 18,
    speed: 38 + Math.random() * 10,
    phase: Math.random() * Math.PI * 2,
    projected: new Float32Array(definitionFor(id).attemptedSamples * 2),
  }));
  let elapsed = 0;
  let width = 0;
  let height = 0;
  let paperLeft = 0;
  let paperRight = 0;
  let frame = 0;
  const point = new Float64Array(2);

  function resize(next = settings) {
    settings = next;
    mobileLayout.matches = next.mobile;
    reducedMotion.matches = next.reducedMotion;
    clock = createFrameClock(next.mobile && !next.lightweight ? 60 : 30);
    width = next.width;
    height = next.height;
    const ratio = Math.min(next.pixelRatio || 1, next.mobile ? 1 : 1.5);
    const pixelWidth = Math.round(width * ratio), pixelHeight = Math.round(height * ratio);
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    paperLeft = next.paperLeft;
    paperRight = next.paperRight;
    for (const swimmer of swimmers) {
      if (swimmer.definition.id === 'arc' && swimmer.bodyAngle === null) {
        swimmer.angle = Math.atan2((swimmer.targetY - swimmer.y) * height,
          (swimmer.targetX - swimmer.x) * width);
        swimmer.bodyAngle = swimmer.angle;
      }
      swimmer.palette = bodyPalette(swimmer.definition);
      swimmer.brushes = swimmer.palette.map(pigment);
    }
    draw();
  }

  function wander(dt) {
    // Keep body animation on its existing clock; only slow mobile roaming.
    const travelRate = mobileLayout.matches ? 0.2 : 1;
    const travelDt = dt * travelRate;
    for (const swimmer of swimmers) {
      if (mobileLayout.matches && swimmer.definition.id === 'arc') continue;
      swimmer.targetAge += travelDt;
      let dx = (swimmer.targetX - swimmer.x) * width;
      let dy = (swimmer.targetY - swimmer.y) * height;
      if (swimmer.targetAge > swimmer.nextTarget || Math.hypot(dx, dy) < 65) {
        swimmer.targetX = 0.06 + Math.random() * 0.88;
        swimmer.targetY = 0.12 + Math.random() * 0.76;
        swimmer.targetAge = 0;
        swimmer.nextTarget = 8 + Math.random() * 12;
      }
      const marginX = Math.min(0.25, 100 / width);
      const marginY = Math.min(0.25, 100 / height);
      if (swimmer.x < marginX || swimmer.x > 1 - marginX || swimmer.y < marginY || swimmer.y > 1 - marginY) {
        swimmer.targetX = 0.5;
        swimmer.targetY = 0.5;
      }
      dx = (swimmer.targetX - swimmer.x) * width;
      dy = (swimmer.targetY - swimmer.y) * height;
      const aim = Math.atan2(dy, dx) + Math.sin(elapsed * 0.31 * travelRate + swimmer.phase) * 0.22;
      const turn = Math.atan2(Math.sin(aim - swimmer.angle), Math.cos(aim - swimmer.angle));
      const wantedTurn = Math.max(-0.65, Math.min(0.65, turn * 1.8));
      swimmer.turnRate += (wantedTurn - swimmer.turnRate) * (1 - Math.exp(-dt / 0.35));
      swimmer.angle += swimmer.turnRate * travelDt;
      if (swimmer.bodyAngle === null) swimmer.bodyAngle = swimmer.angle;
      const bodyTurn = Math.atan2(Math.sin(swimmer.angle - swimmer.bodyAngle), Math.cos(swimmer.angle - swimmer.bodyAngle));
      swimmer.bodyAngle = swimmer.definition.id === 'arc'
        ? swimmer.angle : swimmer.bodyAngle + bodyTurn * (1 - Math.exp(-dt / 0.65));
      swimmer.x += Math.cos(swimmer.angle) * swimmer.speed * travelDt / width;
      swimmer.y += Math.sin(swimmer.angle) * swimmer.speed * travelDt / height;
      swimmer.shapePhase += swimmer.definition.timeStep * 60 * swimmer.definition.phaseRateScale * dt * 1.6;
    }
  }

  function pigment(color) {
    const ink = 'rgba(55, 55, 51, 0.62)';
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    const edge = Math.min(70, (paperRight - paperLeft) / 6);
    const left = Math.max(0, paperLeft - edge);
    const right = Math.min(width, paperRight + edge);
    gradient.addColorStop(0, paperLeft > 0 ? color : ink);
    gradient.addColorStop(left / width, paperLeft > 0 ? color : ink);
    gradient.addColorStop(Math.min(width, paperLeft + edge) / width, ink);
    gradient.addColorStop(Math.max(paperLeft + edge, paperRight - edge) / width, ink);
    gradient.addColorStop(right / width, paperRight < width ? color : ink);
    gradient.addColorStop(1, paperRight < width ? color : ink);
    return gradient;
  }

  function bodyWave(swimmer, u, radius) {
    // Inbyo already undulates in its equation; a second wave fights its turns.
    if (swimmer.definition.id === 'arc') return 0;
    const anatomy = swimmer.field.anatomy;
    const swayScale = 0.85;
    return anatomy.wave * swayScale * radius * smoothstep(anatomy.rampStart, 1, u)
      * Math.sin(Math.PI * 2 * (u / anatomy.wavelength - elapsed * anatomy.waveRate * 1.6));
  }

  function draw() {
    const started = performance.now();
    ctx.clearRect(0, 0, width, height);
    const scale = Math.min(width, height) * (width < 720 ? 0.8 : 0.88);
    const stride = 1;
    for (const swimmer of swimmers) {
      if (mobileLayout.matches && swimmer.definition.id === 'arc') continue;
      const { field, definition } = swimmer;
      field.advance(swimmer.shapePhase);
      metrics.shapeUpdates++;
      let x = swimmer.x * width;
      let y = swimmer.y * height;
      const radius = definition.visualRadius * scale;
      const heading = swimmer.bodyAngle ?? swimmer.angle;
      field.setPose(0, 0, heading, radius);
      for (let band = 0; band < DEFORM_BANDS; band++) {
        const u = band / (DEFORM_BANDS - 1);
        const wave = bodyWave(swimmer, u, radius);
        swimmer.deformX[band] = -Math.sin(heading) * wave;
        swimmer.deformY[band] = Math.cos(heading) * wave;
      }
      field.setDeformation(swimmer.deformX, swimmer.deformY);
      let count = 0, sumX = 0, sumY = 0;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let i = 0; i < field.count; i += stride) {
        field.projectInto(i, radius, point);
        swimmer.projected[count * 2] = point[0];
        swimmer.projected[count * 2 + 1] = point[1];
        minX = Math.min(minX, point[0]); maxX = Math.max(maxX, point[0]);
        minY = Math.min(minY, point[1]); maxY = Math.max(maxY, point[1]);
        sumX += point[0]; sumY += point[1]; count++;
      }
      let offsetX = 0, offsetY = 0, fit = 1;
      if (mobileLayout.matches) {
        // Fit the visible body, not just its head. A smooth mapping has no edge
        // clamps, teleports or direction flips; the original wandering is unchanged.
        offsetX = sumX / count;
        offsetY = sumY / count;
        const halfX = Math.max(offsetX - minX, maxX - offsetX);
        const halfY = Math.max(offsetY - minY, maxY - offsetY);
        fit = Math.min(1, (width - 24) / (2 * halfX), (height - 24) / (2 * halfY));
        const rangeX = Math.max(0, width / 2 - halfX * fit - 12);
        const rangeY = Math.max(0, height / 2 - halfY * fit - 12);
        x = width / 2 + rangeX * Math.tanh((swimmer.x - 0.5) * 3);
        y = height / 2 + rangeY * Math.tanh((swimmer.y - 0.5) * 3);
      }
      swimmer.bounds = { left: x + (minX - offsetX) * fit, right: x + (maxX - offsetX) * fit,
        top: y + (minY - offsetY) * fit, bottom: y + (maxY - offsetY) * fit };
      const paths = swimmer.palette.map(() => new Path2D());
      for (let sample = 0, i = 0; sample < count; sample++, i += stride) {
        const band = Math.max(0, Math.min(paths.length - 1, Math.floor(field.longitudinal[i] * (paths.length - 1))));
        paths[band].rect(x + (swimmer.projected[sample * 2] - offsetX) * fit,
          y + (swimmer.projected[sample * 2 + 1] - offsetY) * fit, mobileLayout.matches ? 1 : 0.8, mobileLayout.matches ? 1 : 0.8);
      }
      for (let band = 0; band < paths.length; band++) {
        ctx.fillStyle = mobileLayout.matches ? swimmer.palette[band] : swimmer.brushes[band];
        ctx.fill(paths[band]);
      }
    }
    const duration = performance.now() - started;
    metrics.frames++;
    metrics.totalDrawMs += duration;
    metrics.maxDrawMs = Math.max(metrics.maxDrawMs, duration);
  }

  function tick(now) {
    frame = 0;
    if (hidden) return;
    const wallTime = clock.step(now);
    if (wallTime !== null) {
      const dt = wallTime * (mobileLayout.matches ? 0.55 : 1) * (reducedMotion.matches ? 0.15 : 1);
      metrics.simulationSeconds += dt;
      elapsed += dt;
      wander(dt);
      draw();
    }
    frame = schedule(tick);
  }

  function syncPlayback() {
    cancel(frame);
    clock.reset();
    draw();
    if (!hidden) frame = schedule(tick);
  }

  resize();
  syncPlayback();
  return {
    resize,
    metrics,
    setHidden(value) {
      if (hidden === value) return;
      hidden = value;
      syncPlayback();
    },
    destroy() { hidden = true; cancel(frame); },
  };
}
