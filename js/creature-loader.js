let scheduled = false;

function scheduleCreatures() {
  if (scheduled) return;
  scheduled = true;
  // Yield two frames so the portfolio paints before the optional artwork starts.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const start = () => import('./creatures.js?v=gentle-mobile-drift').catch(error => {
      console.info('Creature artwork unavailable; portfolio remains usable.', error);
    });
    if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 500 });
    else setTimeout(start, 0);
  }));
}

document.addEventListener('portfolio:ready', scheduleCreatures, { once: true });
if (document.querySelector('.view.is-visible')) scheduleCreatures();
