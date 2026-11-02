# Alvalta engine

Source: https://github.com/HaardhikK/Alvalta
Revision: `2fe20f48fde608e13683c8ecce61b22e9f485643`

`model.js` and `body-field.js` are mechanically transpiled from
`src/reference-gallery/model.ts` and `body-field.ts`, with the relative import
given its browser `.js` extension. Equations and body/motion logic are unchanged.
Portfolio adaptations in `model.js`: only Pika and Inbyo are instantiated, and
the envelope cache is seeded from `envelopes.js`. This avoids re-running the
96-phase bound measurement on every page load. The saved bounds were generated
using the original `measureReferenceEnvelope(definitionFor(id))` for each body.
Pika and Inbyo accept a sampling-step argument: every third original sample on
desktop, every eighth on mobile in the worker, or every twelfth in the
main-thread fallback. Their equations and full parameter range remain the same.
Mobile workers target 60 Hz and refresh shape and pose together on every rendered
frame. The lightweight fallback targets 30 Hz, also without cached shape jumps.
The flat-color creature needs only one path. A deadline-based frame clock avoids
the repeated frame skips caused by resetting a timer on high-refresh displays.
The upstream project credits @yuruyurau as base inspiration, with original designs.

`js/creatures.js` controls worker startup, resize and visibility. The shared
renderer is `js/creature-engine.js`, normally run in `js/creature-worker.js`,
with a main-thread fallback for browsers without this support. It uses `BodyField`
directly with the saved envelopes and original equations/anatomical waves.
Viewport wandering and body heading now share one trajectory; the separate
reference-world navigation is not run behind the overlay. Photos and archive
figures use CSS stacking, not canvas masks. Desktop photos sit above the artwork;
mobile photos are smaller, right-aligned and below the creatures. Pika uses
the upstream pink/orange/gold ramp along its head-to-tail coordinate. Mobile
keeps the colored body everywhere, with no special treatment over text. Mobile
fits the full projected body into the viewport using a smooth position mapping,
without changing the original wandering or adding edge bounces. Desktop keeps gray ink over the paper and
colored bodies in the margins. The second creature uses pastel mint; Pika keeps
its original palette. Mobile advances the body-animation clock at 55% of desktop
speed. Its travel/turning clock runs at a further 20% of that rate so it drifts
gently without suppressing the internal animation.
Its canvas uses a 1x pixel ratio and a stable small-viewport height so changing
phone browser toolbars does not repeatedly resize the artwork.
No build step or network
dependency is needed at runtime.
