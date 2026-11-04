# Playable Schieber and Differenzler

Both games now complete matches in the browser. Start either game from the
opening controls or the **Jass** menu. The human sits south; in Schieber north
is the partner. Differenzler supports three or four players and Grumpy Junior,
Hacker or Trashy opponents. Difficulty, rule variants and match length are
configurable before starting.

## Playing and saving

Choose trump or shift, declare Weis, enter a prediction, and click a legal card.
Illegal cards are disabled. Keyboard users can Tab to a legal card and press
Enter. After each trick, click anywhere on the table or choose **Stich abräumen**; after a round choose
**Nächste Runde**. **Computer weiterspielen lassen** lets the original AI play
the human seat as well. Tempo controls the wait between computer decisions.

**Tipp**, **Zurücknehmen**, **Pause**, **Runde aufgeben** and **Resultate** are
available below the table. Undo returns to before the last human decision and
rebuilds the computer state. Results include completed rounds. **Jass → Gespielte
Jass** lists the last 100 completed matches in this browser, marking matches in
which the computer played human turns. This is browser history, not an import
of the old profile/high-score files.

Every successful action is saved in local storage. **Spiel fortsetzen** restores
the latest match. **Datei → Spiel speichern…** exports an independent `.sws.json`
file; **Spiel öffnen…** restores it. Clearing browser data removes local saves
and history, so use file export for long-term storage.

The same Open command accepts legacy `.JSS` and `.JAR` files as **archive
replays**, with game/round selection and stepping through cards. They do not
resume the old native AI state. Fourteen of the fifteen supplied examples are
readable. The older Differenzler `TEST.JSS` uses an incompatible rules layout
and is rejected; the reference executable also fails to open that example.

## Graphics and sound

Both games use their own original table background and embedded interface atlas.
Enhanced table backgrounds are available with an original-artwork comparison
under **Ansicht**. All five card sets and both original card sizes are supported.
**Karten gross selects the original large-card sheet; it is not AI upsampling.**
Cards and interface sprites remain original resolution. Default display scale
is 2 in `src/config.js`; fitting and device pixel ratio are independent.

All 5,305 original WAVs have MP3 copies: 345,892,080 source bytes become
60,572,932 MP3 bytes. `npm run assets:audio` regenerates them with Python and
FFmpeg (libmp3lame VBR quality 5), retaining original sample rates/channels.
`public/assets/audio/manifest.json` records source hashes and sizes. The originals
are untouched. Enable **Ton** to hear mapped shuffle, card, trick, victory and
trump/shift sounds, loaded on demand. Predictions and card/trump/prediction hints
now use the original PCMEDIA resource mappings. Hidden computer predictions are
never spoken. Multi-part phrases play sequentially; a newer game action replaces
stale speech. Select one of the four original character voices (3–6); mute,
volume and voice preferences persist in this browser. Mute cancels pending audio as well as
playing clips. Undo and new games also cancel speech. Full character banter and every original speech event are not
connected yet; conversion does not imply a listening review of every recording.

The new Differenzler background was created with builtin image generation,
using the original `BackD1.bmp` as the edit reference, then normalized to
2048 × 1536. Saved output: `public/assets/differ-table-enhanced-2x.png`.
The full prompt and source dimensions are in `public/assets/provenance.json`.
Generated detail is an interpretation, and the original remains selectable.

## Verification and remaining fidelity work

Run `npm run engine:test`, `npm run reference:test`, `npm test`, and
`npm run build`. Browser tests use installed Microsoft Edge; the channel can be
changed in `playwright.config.js`. Automated checks cover rules, complete
multi-round AI games, save/future-decision replay, forfeits, browser human turns,
hints, undo, completed matches, legacy playback, MP3 decoding, scaling and masks.

For the same game checks against the production build in PowerShell:

```powershell
npm run build
$env:TEST_PRODUCTION = '1'
npx playwright test tests/games.spec.js
Remove-Item Env:TEST_PRODUCTION
```

The worker receives an absolute AI-asset base URL from the page, so static
deployment does not depend on the generated worker's directory.

`npm run audio:test` checks original speech IDs, hidden-prediction protection and
recording availability for every mapped prediction, trump and card hint. The
browser audio test checks phrase order, cancellation and preference persistence
using a controlled audio player; the separate MP3 test checks actual decoding.

Native working copies of both top-level executables were run again using
`scripts/reference-native.py` with the original archives. For Schieber's first
`GRUMPY.JAR` game, native scores are 138 trick points plus 40 Weis against 176;
the browser derives 178 against 176. Differenzler's first `TEST.JAR` round shows
the same predictions (0, 65, 21, 72) as the retained fixture. Captures are under
`docs/game-reference/`. The helper launches and stops only its own working
copies; it does not modify `original/`.

This is a complete playable single-player implementation, not a claim that every
original feature or pixel has been restored. Remaining differences include
enhancement of cards/portraits/interface art, complete personality/voice mapping,
old profile/high-score import, live continuation of native saves, original VCL
dialog presentation, and exhaustive move-by-move executable parity (including
Trashy's floating-point behavior). Network play and the sliding puzzle remain
outside the current game scope. No site has been published.
