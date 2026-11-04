# Original Schieber setup dialog

The browser's Schieber setup now uses the original `TDlgNewJass` background and
portrait images instead of a generic setup form. The supplied screenshot is the
visual reference. `DLGNEW.dfm` supplies the 464 × 417 client layout and control
coordinates; `ICONS.PAS` supplies the portrait rectangles. A 22-pixel browser
title strip reproduces the screenshot's window caption.

The image payloads come from the selected `original/SchiebPl.exe` reference
build. `public/assets/setup/manifest.json` records their source hashes, crop
rectangles and form controls. `npm run assets:setup` rebuilds them after
`npm run reference:extract`. Originals remain untouched.

The north/west/east portraits have the original strong/medium/weak positions,
with strengths 99/50/0 from `CharacterLevelToPlayLevel`. The original scrollbar
orders strong first, so the left arrow increases strength. Clicking a portrait
opens a character picker; this extends the original simple dialog, where the
random button selected characters. Randomization picks three distinct figures.
The human remains south, with an editable name and the 20 original avatar
images. Selection and per-player strengths persist and are saved with the game;
the engine passes those strengths to the original AI. All four character images
use the existing Schieber AI; complete character-specific banter is still pending.

Rules are available through **Regeln…**, with changes applied only when confirmed.
Cancel leaves the current game unchanged. The existing global display scale
controls the dialog, capped to fit the viewport. Assets retain their original
pixels; this step matches the original graphics and does not invent portrait
detail through AI enhancement. Differenzler's setup is unchanged for now.

Browser checks cover portrait/avatar selection, individual strength propagation,
rules, cancellation, narrow-screen fitting and starting complete matches.
The 1× comparison capture is generated at
`artifacts/browser/new-jass-original-layout.png`.
