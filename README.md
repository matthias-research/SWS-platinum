# SWS-platinum

A JavaScript browser revival of the original Delphi Schieber and Differenzler games, aiming to preserve their behavior and appearance with enhanced 2× artwork.

See [project.md](project.md) for the original software investigation, fidelity requirements, asset strategy and implementation milestones.

The legacy source, executables and assets are kept locally in `original/`, which is excluded from version control. The original Panel artwork is integrated as the browser welcome screen. Its Schieber and Differenzler buttons open game setup; **Datei → Spiel schliessen** returns here, with the saved game available through **Spiel fortsetzen**.

## Deploy to Cloudflare

The deployment target is **https://sws-platinum.matthi3010.workers.dev**, separate
from the existing SWS site. Configuration is in `wrangler.jsonc`.

For a fresh checkout:

```sh
git lfs pull
npm ci
npx wrangler login
npm run deploy
```

The deploy command builds the app and publishes only `dist/`, including its
runtime artwork, AI data and audio. Neither `original/` nor development files
are deployed. `npm run deploy:preview` runs Cloudflare's local preview.
Deployment is manual: pushing to GitHub alone does not publish updates.

Rules and preferences are saved automatically in browser storage for this
site. They survive reopening the browser but do not transfer from localhost,
from the other SWS site, or between browsers/devices.

## Run locally

Use Node.js 22.12 or newer.

Install Git LFS before cloning. Enhanced images in `public/assets/enhanced/` are stored in LFS; after cloning (including in deployment/CI), run:

```sh
git lfs install
git lfs pull
```

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. `npm run build` creates the static site in `dist/`; `npm run preview` serves that build.

Choose **Neuer Schieber…** or **Neuer Differenzler…** to play complete matches against the original Pascal computer players. Differenzler supports three or four players and Grumpy Junior, Hacker or Trashy. Setup includes difficulty and rule variants. Hints, undo, pause, round results, automatic saves, file export/import and legacy archive replay are available. See [playing and compatibility notes](docs/playable-games.md).

Under **Ansicht**, **Verbesserte Grafik** switches tables, cards, portraits, dialogs and sprites to the enhanced 2× assets; **Originalgrafik** restores the originals. Choose 1×/2×/3×, select card sets/sizes, or fit the table to the window. **Einstellungen…** opens preferences directly from the top menu. Enable **Ton** below the table for sounds loaded on demand. Restart a stopped development server with `npm run dev` from this directory.

Browser menu settings reset on each app load: Adaptive resolution, Auto view, enhanced graphics, and Lowlevel menu off. Changes last only until reload; the selected card set still persists.

## Mobile fullscreen

Choosing a game opens setup without requesting fullscreen. On phones, fullscreen prompts also require landscape orientation, even when Mobile horizontal was selected manually; rotating back to portrait exits fullscreen. Opening the page in **Mobile horizontal**, or entering it from another view (through rotation in Auto view or the Browser menu), offers fullscreen when the browser supports it and fullscreen is off. **Vollbild einschalten** enables it; **Nicht jetzt** or Escape continues in the page. Leaving Mobile horizontal dismisses the prompt and exits fullscreen. Dismissing the prompt or manually exiting fullscreen does not prompt again until a new transition into Mobile horizontal.

## Scaling and assets

`src/config.js` is the central configuration: `DISPLAY.scale` defaults to `2`. Drawing remains in a 768 × 528 logical coordinate system. Window fitting, asset resolution and device pixel ratio are independent; disable fitting to see the literal selected scale. `toLogicalPoint` converts pointer coordinates back to logical coordinates for card selection.

The required runtime assets are in `public/assets/`; running the browser app does not require the ignored `original/` folder. Original artwork is retained for comparison. The enhanced background is a first sample requiring visual acceptance, not a claim of pixel-exact fidelity. See `public/assets/provenance.json` for its generation prompt, dimensions and sources. The surrounding sprite artwork has not yet been enhanced.

With the local archive present, `npm run assets:extract` losslessly recovers the background, embedded Pieces bitmap and its 121 source rectangles. It never modifies the archive. To package another generated 4:3 background at 2× resolution, use `node scripts/prepare-enhanced.mjs <image.png>`.

## Card rendering preview

Open [the card preview](http://127.0.0.1:5173/?review=cards) to inspect all five original card sets, both sizes and both orientations. Select a card with the mouse or keyboard; use **Ansicht** to check scaling and compare table backgrounds. This is a rendering preview, not a playable game. The normal title screen remains at `/`.

The 20 card sheets are packaged losslessly at their original resolution. After `npm run reference:extract`, run `npm run assets:cards` to regenerate them from the archive with source and decoded-pixel hash checks. The preview loads only the selected sheet. See [M3 rendering notes](docs/m3-rendering.md) for the scaling, mask and interaction implementation and its limits.

## Verification

`npm test` runs Playwright against installed Microsoft Edge (configure the browser channel in `playwright.config.js` for another environment). Checks cover asset loading, original/enhanced comparison, menus, fit-to-window, scales 1–3, high-DPI backing dimensions, card-sheet variants, card selection, and exact legacy RGB mask operations. Screenshots are written under ignored `test-results/` for visual review.

`npm run engine:test` checks the translated rules, multi-round AI games, forfeits, save restoration and legacy replay. Browser tests also exercise full matches, human card selection, hints, undo and MP3 decoding. Native archive comparisons agree on the checked predictions and scores; exhaustive browser/executable equivalence remains pending. See [validation and remaining differences](docs/playable-games.md#verification-and-remaining-fidelity-work).

## M1 reference collection

With the ignored `original/` archive present, run:

```sh
npm run reference:extract
npm run reference:test
```

Open [the asset gallery](http://127.0.0.1:5173/artifacts/m1/gallery.html) or [the sprite/mask gallery](http://127.0.0.1:5173/artifacts/m1/mappings-gallery.html) while the development server is running. Bulk outputs remain in ignored `artifacts/` and are not part of the production bundle.

See [M1 results](docs/m1/README.md) for coverage, [reference scenarios](docs/m1/scenarios.md) for the Windows capture commands and observed compatibility gaps, and [mapping notes](docs/m1/mappings-notes.md) for exact original coordinates and masks. Native capture requires Python/Pillow on Windows; ordinary browser development and asset extraction use Node.js.

## Pascal core translation

`src/engine/SWSBase.js` and `src/engine/DiffBase.js` directly port the corresponding Pascal routines, retaining function names, record fields and numeric IDs. The translation covers card/trick rules, the original random/dealing algorithm, Weis, Stöck, forfeits, round lifecycle and match scoring. `src/engine/game.js` integrates the command flow with browser controls. The original AI compiles to JavaScript with pas2js and runs in a worker; see [AI build and compatibility notes](docs/ai-port.md).

Run `npm run engine:test` for the headless tests, including legal-play and winner comparisons against two archived original rounds. See [the translation map](docs/m5-core.md) for exact scope, conventions and verification limits.

## Original dialogs

Both games include the recovered graphical setup and decision dialogs. Use Datei for profile/preferences/archive export, Jass for results/statistics/fast play, and Hilfe for credits, the picture puzzle and the bitmap collection. Dialogs follow the selected global display scale.

`npm run assets:dialogs` regenerates the packaged form layouts and images from the M1 extraction. `node tests-node/dialog-assets.test.mjs` validates their dimensions and image bindings. See [dialog coverage](docs/dialogs.md) for all 64 reference forms and the remaining native/browser differences.
