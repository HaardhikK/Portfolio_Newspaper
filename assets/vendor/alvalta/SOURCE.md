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
Pika and Inbyo evaluate every third original sample rather than generating points
that the overlay would discard. Their equations and full parameter range remain
the same; the overlay draws all these samples on desktop and half on mobile.
The upstream project credits @yuruyurau as base inspiration, with original designs.

The portfolio-specific overlay is in `js/creatures.js`. It uses `BodyField`
directly with the saved envelopes and original equations/anatomical waves.
Viewport wandering and body heading now share one trajectory; the separate
reference-world navigation is not run behind the overlay. Photos and archive
figures use CSS stacking, not canvas masks. Desktop photos sit above the artwork;
mobile photos are smaller, right-aligned and below the creatures. Pika uses
the upstream pink/orange/gold ramp along its head-to-tail coordinate. Mobile
keeps the colored body everywhere, with no special treatment over text. Mobile
fits the full projected body into the viewport using a smooth position mapping,
without changing the original wandering or adding edge bounces. Desktop keeps gray ink over the paper and
colored bodies in the margins. The earlier slower wandering/turning is retained.
No build step or network
dependency is needed at runtime.
