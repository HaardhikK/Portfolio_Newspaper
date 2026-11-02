import { createCreatureEngine } from './creature-engine.js?v=mobile-pika-only';

let engine;
self.onmessage = ({ data }) => {
  if (data.type === 'init') {
    engine = createCreatureEngine(data.canvas, data.settings);
    self.postMessage({ type: 'ready' });
  } else if (data.type === 'resize') engine?.resize(data.settings);
  else if (data.type === 'visibility') engine?.setHidden(data.hidden);
  else if (data.type === 'metrics') self.postMessage({ type: 'metrics', metrics: engine?.metrics });
};
