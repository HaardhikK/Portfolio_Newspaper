let canvas = document.querySelector('#creature-overlay');
let headerCanvas = document.querySelector('#creature-header-overlay');
const masthead = document.querySelector('.masthead');
const mobile = matchMedia('(max-width: 720px), (hover: none) and (pointer: coarse)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let worker;
let fallback;
let transferred = false;
let resizeTimer;

function settings() {
  const rect = canvas.getBoundingClientRect();
  const paper = document.querySelector('.paper').getBoundingClientRect();
  const header = masthead.getBoundingClientRect();
  headerCanvas.style.left = `${header.left}px`;
  headerCanvas.style.width = `${header.width}px`;
  headerCanvas.style.height = `${header.height}px`;
  return {
    width: rect.width, height: rect.height, pixelRatio: devicePixelRatio || 1,
    paperLeft: paper.left, paperRight: paper.right,
    headerLeft: header.left, headerWidth: header.width, headerHeight: header.height,
    mobile: mobile.matches, reducedMotion: reduced.matches,
    lightweight: !worker,
  };
}

function visibility() {
  if (worker) worker.postMessage({ type: 'visibility', hidden: document.hidden });
  else fallback?.setHidden(document.hidden);
}

async function start() {
  if (typeof Worker !== 'undefined' && typeof canvas.transferControlToOffscreen === 'function') {
    try {
      worker = new Worker(new URL('./creature-worker.js?v=calm-desktop-travel', import.meta.url), { type: 'module' });
      const options = settings();
      const offscreen = canvas.transferControlToOffscreen();
      transferred = true;
      const headerOffscreen = headerCanvas.transferControlToOffscreen();
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Creature worker did not start')), 8000);
        worker.onmessage = ({ data }) => {
          if (data.type === 'ready') { clearTimeout(timeout); resolve(); }
        };
        worker.onerror = event => { event.preventDefault(); clearTimeout(timeout); reject(new Error(event.message || 'Creature worker failed')); };
        worker.postMessage({ type: 'init', canvas: offscreen, headerCanvas: headerOffscreen, settings: options },
          [offscreen, headerOffscreen]);
      });
    } catch (error) {
      worker?.terminate();
      worker = null;
      // A transferred canvas cannot be reused by the main-thread fallback.
      if (transferred) {
        const replacement = canvas.cloneNode();
        canvas.replaceWith(replacement);
        canvas = replacement;
        const headerReplacement = headerCanvas.cloneNode();
        headerCanvas.replaceWith(headerReplacement);
        headerCanvas = headerReplacement;
      }
      console.info('Using lightweight creature rendering fallback.', error);
    }
  }
  if (!worker) {
    const { createCreatureEngine } = await import('./creature-engine.js?v=calm-desktop-travel');
    fallback = createCreatureEngine(canvas, settings(), headerCanvas);
  }
  performance.mark('creatures:ready');
  visibility();
}

await start();

function resize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const options = settings();
    if (worker) worker.postMessage({ type: 'resize', settings: options });
    else fallback?.resize(options);
  }, 100);
}

addEventListener('resize', resize);
new ResizeObserver(resize).observe(masthead);
mobile.addEventListener('change', resize);
reduced.addEventListener('change', resize);
document.addEventListener('visibilitychange', visibility);
addEventListener('pagehide', () => {
  if (worker) worker.postMessage({ type: 'visibility', hidden: true });
  else fallback?.setHidden(true);
});
addEventListener('pageshow', visibility);
