# M3 — Rendering and scaling prototype

The browser foundation is complete within the prototype scope. Open the normal
title screen at `/`, or `/?review=cards` for the separate card review surface.
This review surface selects cards; it does not start a game, validate moves or
simulate an opponent.

## Implemented

- One logical 768 × 528 table, independent display scale, asset scale and device
  pixel ratio. The default display scale remains 2, with optional window fitting.
- Original and enhanced table backgrounds, and the original Pieces atlas.
- Exact RGB `(destination AND mask) OR foreground` operations for masked sprites.
  The destination is the already-rendered table at backing-store resolution.
  Mask texels use nearest sampling, preserving their bits at fractional scales.
  Composited patches respect the caller's canvas clip.
- Unmasked atlas pieces are isolated before scaling to prevent neighbouring
  artwork bleeding into border tiles. Source atlases remain untouched.
- All five original card sets, both sizes and both orientations: 20 lossless PNG
  sheets, loaded only when the review surface requests them. The runtime manifest
  retains source identities, pixel hashes, card IDs and original source rectangles.
- Card drawing follows `Schieber/JassBmps.pas:652` (`ShowCard`), including the
  source rectangles' intentional -1 offsets and 15-unit rounding diameter.
  Vertical hand placement follows `Table.pas:393` and `Table.pas:520` with
  `TABLEOFFS=5` and nine slots. Horizontal cards use those review slots to inspect
  their separate sheets; this is not the original four-seat layout.
- Pointer coordinates are converted back to logical coordinates. Hit testing
  resolves overlapping cards in reverse drawing order. Transparent DOM buttons
  supply keyboard selection and focus indicators over the visible card regions.

## Regenerate and verify

```sh
npm run reference:extract
npm run assets:cards
npm run build
npm test
```

Card packaging requires the ignored original archive and M1 mappings. It checks
source hashes and decoded pixel hashes before writing the PNGs. Running the app
or browser tests uses the packaged assets and does not require the archive.

Browser tests cover all 20 sheet variants, preserved IDs through card 36, keyboard
selection, pointer selection at display scales 1/2/3 and device pixel ratios 1/2,
horizontal overlap, mobile fit, and original/enhanced background switching.
Synthetic pixel checks independently verify non-binary AND/OR masks, asset scales
1/2, fractional rendering, clipping and untouched destination pixels.

Desktop and mobile screenshots are saved under ignored `test-results/`.
The preview was visually inspected alongside the M1 native Schieber saved-game
capture. Original artwork and logical hand spacing are retained; the preview is
not the same game state, so this is not a pixel-difference or gameplay-parity test.

## Remaining fidelity work

The card artwork is still the original resolution, not enhanced. M2 sample review
is still required before production enhancement. Browser font and rounded-outline
rasterization can differ from Windows GDI; exact native edge coverage has not been
established. The raster operation itself is tested, not full-screen pixel parity.
The opaque table is the supported destination for legacy mask compositing.
Four-seat rendering, selected/animated gameplay cards, complete dialogs, rules and
AI remain later work. The current mobile preview demonstrates scaling, not final
touch usability for a playable game.
