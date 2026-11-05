# Original dialog restoration

The reference executable form resources provide the layout and image bindings. `scripts/prepare-dialogs.mjs` packages **64 reference forms and 218 unique recovered bitmap images**, including source-only variants and loose artwork, with provenance in `public/assets/dialogs/manifest.json`. The separate Panel program remains excluded. `assets:setup` now exports all 106 original icon rectangles. Thirty original log-trump symbols and transparent button-glyph variants are also packaged.

Run `npm run reference:extract`, `npm run assets:setup`, and `npm run assets:dialogs` to regenerate from the ignored archive. The deployed app needs none of the original executables or source files. All recovered loose and embedded images can be inspected through **Hilfe > Originalbilder**.

## Layout and behavior

`src/dialogs/LegacyDialog.jsx` renders original Delphi component coordinates and inherited parent offsets, with native bitmap buttons and tabs. All dialogs use the global display scale, capped to fit the viewport. Bitmap extraction is lossless: these are original pixels displayed larger, **not newly AI-enhanced portraits or artwork**. Fonts, form borders, browser inputs and some dynamic paintboxes are browser equivalents rather than pixel-exact Windows controls.

Both games now use the illustrated setup. Human decisions open the original graphical trump/prediction, Weis and Stoeck dialogs, with cancel returning to the inline controls. Rules are editable before play and locked during a match. Profiles, sound choices, card order and card set persist. Opening supporting dialogs pauses play; closing restores the previous pause state.

Trump, prediction and hint windows fit into the space above the actual hand bounds, with a transparent backdrop so the cards remain readable. On narrow screens they use space below the hand when that allows larger controls. Their size follows the displayed table rather than blindly using the requested magnification. The active trump is drawn at all four carpet corners using the original 22-pixel symbols from the selected card sheet, following `Table.pas` and `JassBmps.ShowTrump`.

Archive export writes a UTF-8 JSON envelope containing the original text record structure. It preserves remaining hands, finalized Differenzler bonuses and the empty next-trick record carrying the last winner. Reopen the download through **Datei > Spiel oeffnen**; **Archivfenster** opens the recovered playback control layout. Existing native archives remain supported. The archive table is reconstructed rather than a complete translation of REPWIN's painter.

## Fidelity boundaries

- Network multiplayer remains a separate feature, as recorded in project.md. Its Winsock setup/progress/seat forms are preserved in the catalog but do not pretend to connect to a server.
- Windows CD-path/file dialogs are replaced by browser asset loading and upload/download. Resource-holder forms and the developer shell are not player dialogs.
- Results use the recovered background with a readable HTML table. High scores rank browser-local matches, not the old normalized high-score database. Statistics use stored local round records; unavailable historical/advanced metrics show a dash. Old profile/high-score files are not imported.
- Character chatter, AVI movies, intro music, card-back selection, animation timings and automatic information-popup preferences are not ported here; corresponding preference controls are disabled. Settings are saved immediately on confirmation, so the old save-on-exit checkbox is disabled.
- Fast-play display choices currently select speed; no/minimal display uses the original progress dialog. Conversation entries are local messages. The latest Differenzler high-score name can be edited through Jass > Ranglistenname.
- About/exit screens retain their available static sequence frames, portrait hotspots and masked scrolling credits. Missing AVI frames are not fabricated.

## Form-by-form coverage

Validation (2026-11-04): production build succeeds; all 20 Playwright tests pass, including complete matches, graphical setup/decisions, profile/rules, archive export/import/playback, fast-play cancellation, puzzle and credits. The engine suites pass (57 checks including the added archive round trips), along with 3 audio and 2 dialog-asset checks. Screenshots under `artifacts/browser/dialog-*.png` were inspected for rules, prediction and puzzle layouts. The native rules capture in `docs/m1/screenshots/schieber-rules-0-TPrefDlg.png` remains the comparison reference. This is representative validation, not an exhaustive pixel comparison of every form and state.

| Game | Reference form | Browser handling |
| --- | --- | --- |
| schieber | `TABOUTDLG` | Credits / exit; original covers, portrait hotspots and scrolling bitmap credits. AVI playback remains separate. |
| schieber | `TBMPSFORM` | Nonvisual resource container; images packaged, no standalone dialog. |
| schieber | `TCANCELDLG` | Transport-specific: retained in catalog; not exposed as a working network dialog. Winsock multiplayer remains a separate feature. |
| schieber | `TCLIENTDLG` | Transport-specific: retained in catalog; not exposed as a working network dialog. Winsock multiplayer remains a separate feature. |
| schieber | `TDIRTYDLG` | Forfeit confirmation; save is available separately in Datei. |
| schieber | `TDLGAUTOASK` | Automatic match series and display-speed choice. |
| schieber | `TDLGNEWJASS` | Illustrated player selection; both Differenzler player counts. |
| schieber | `TFASTDLG` | Fast-play progress and cancellation. |
| schieber | `THIGHDLG` | Browser-local high scores on original artwork; no legacy high-score import. |
| schieber | `THINTDLG` | Hint artwork, card/call and arm overlay; apply or cancel. |
| schieber | `THPDLG` | Original publisher image. |
| schieber | `TICONFORM` | Nonvisual resource container; images packaged, no standalone dialog. |
| schieber | `TINFODLG` | Original round/win backgrounds with browser result table. |
| schieber | `TINTRODLG` | Original splash image. |
| schieber | `TMAINFORM` | Browser application shell and menus. |
| schieber | `TMEDIAFORM` | Nonvisual resource container; images packaged, no standalone dialog. |
| schieber | `TNETDLG` | Transport-specific: retained in catalog; not exposed as a working network dialog. Winsock multiplayer remains a separate feature. |
| schieber | `TPCFILESDLG` | CD/file-path locator: replaced by packaged browser assets and file upload/download. |
| schieber | `TPLACEDLG` | Transport-specific: retained in catalog; not exposed as a working network dialog. Winsock multiplayer remains a separate feature. |
| schieber | `TPREFDLG` | Rules and supported preferences; unported media/animation controls disabled. |
| schieber | `TPROFILEDLG` | Name, gender and original avatar selection, stored locally. |
| schieber | `TREPFORM` | Original playback buttons, round selection and seat rotation; reconstructed card table. |
| schieber | `TREVDLG` | Rematch confirmation. |
| schieber | `TRNDDLG` | Numeric deterministic deal seed or random deals. |
| schieber | `TSAYDLG` | Local conversation entry with mood image; no generated AI replies. |
| schieber | `TSHELL` | Developer command shell, not a player dialog; not exposed. |
| schieber | `TSNAPDLG` | Current match/current or previous round export; previous-match scope disabled. |
| schieber | `TSTATISTICSDLG` | Original tabs and trump symbols with local history data/charts; unavailable metrics shown as dash. |
| schieber | `TSUITDLG` | Weis cards and accept/decline; grows for multiple declarations. |
| schieber | `TTCPDLG` | Transport-specific: retained in catalog; not exposed as a working network dialog. Winsock multiplayer remains a separate feature. |
| schieber | `TTEAMDLG` | Original team image. |
| schieber | `TTRUMPDLG` | Original atlases, pressed/disabled pieces and partner portrait; all card suits. |
| differ | `TABOUTDLG` | Credits / exit; original covers, portrait hotspots and scrolling bitmap credits. AVI playback remains separate. |
| differ | `TBMPSFORM` | Nonvisual resource container; images packaged, no standalone dialog. |
| differ | `TCALLDLG` | Prediction; original background, Gloon, masked lever and nonlinear scale. |
| differ | `TCANCELDLG` | Transport-specific: retained in catalog; not exposed as a working network dialog. Winsock multiplayer remains a separate feature. |
| differ | `TDLGAUTOASK` | Automatic match series and display-speed choice. |
| differ | `TDLGNEWJASS` | Illustrated player selection; both Differenzler player counts. |
| differ | `TFASTDLG` | Fast-play progress and cancellation. |
| differ | `THIGHDLG` | Browser-local high scores on original artwork; no legacy high-score import. |
| differ | `THIGHNAMEDLG` | Name for the latest browser-local Differenzler result. |
| differ | `THINTDLG` | Hint artwork, card/call and arm overlay; apply or cancel. |
| differ | `THPDLG` | Original publisher image. |
| differ | `TICONFORM` | Nonvisual resource container; images packaged, no standalone dialog. |
| differ | `TINTRODLG` | Original splash image. |
| differ | `TMAINFORM` | Browser application shell and menus. |
| differ | `TMEDIAFORM` | Nonvisual resource container; images packaged, no standalone dialog. |
| differ | `TNETDLG` | Transport-specific: retained in catalog; not exposed as a working network dialog. Winsock multiplayer remains a separate feature. |
| differ | `TPCFILESDLG` | CD/file-path locator: replaced by packaged browser assets and file upload/download. |
| differ | `TPLACEDLG` | Transport-specific: retained in catalog; not exposed as a working network dialog. Winsock multiplayer remains a separate feature. |
| differ | `TPREFDLG` | Rules and supported preferences; unported media/animation controls disabled. |
| differ | `TPROFILEDLG` | Name, gender and original avatar selection, stored locally. |
| differ | `TPUZZLEDLG` | Sliding puzzle using original splash; row/column shifting and solvable shuffling. |
| differ | `TREPFORM` | Original playback buttons, round selection and seat rotation; reconstructed card table. |
| differ | `TREVDLG` | Rematch confirmation. |
| differ | `TRNDDLG` | Numeric deterministic deal seed or random deals. |
| differ | `TROUNDDLG` | Original result background with browser result table. |
| differ | `TSAYDLG` | Local conversation entry with mood image; no generated AI replies. |
| differ | `TSHELL` | Developer command shell, not a player dialog; not exposed. |
| differ | `TSNAPDLG` | Current match/current or previous round export; previous-match scope disabled. |
| differ | `TSTATISTICSDLG` | Original tabs and trump symbols with local history data/charts; unavailable metrics shown as dash. |
| differ | `TSTOCKINGSDLG` | Original Stoeck choice with relevant cards. |
| differ | `TTCPDLG` | Transport-specific: retained in catalog; not exposed as a working network dialog. Winsock multiplayer remains a separate feature. |
| differ | `TTEAMDLG` | Original team image. |

## Player bubbles and illustrated feed

`GameFeed.jsx` now renders the shared announcement content used by the original `Log.ShowBubble`: trump symbols, visible predictions, declared Weis/Stoeck cards and local conversation portraits. Bubbles use Table.pas's white double border and offset shadow, appear beside the relevant seat, expire independently and can be dismissed by clicking. The Darstellung bubble-duration slider controls 0–20 seconds (0 disables bubbles); the scrollable feed keeps the latest 50 engine entries. Graphics and hit areas follow the global table scale and selected card set.

The engine publishes presentation records rather than exposing private hands. Hidden Differenzler predictions are withheld until the configured reveal point, and Weis card images appear only when the engine publicly announces the cards. Records rebuild during saved-game replay; undo rewinds the feed. New rounds clear old bubbles.

## Original player commentary

`commentaryTriggers.js` ports `TProtoJasser.NotifyCommand` from both original `JASSERS.PAS` files: greetings, card reactions, round results, Bergpreis/winner comments and replies. `commentary.js` retains character-specific resource IDs, selection probabilities, per-player nonrepetition, metadata exclusions, target gender, cardset and time/date restrictions. It uses an independent seeded random stream so commentary cannot change deals or AI decisions. The original conditional Differenzler average counters and disabled call-comment block are retained.

In Allgemein, **Kommentare von Spielern** controls recorded speech (`sndVoice`). The four before/during/after/victory options control generation independently, so muted comments remain visible in the feed and bubbles. The exact chosen line selects its matching original MP3 and mood portrait. Speech is serialized and computer moves wait for playback; disabling speech cancels its queue. Restore and undo rebuild text without replaying recordings. Missing original recordings remain text-only rather than playing an unrelated substitute.

`npm run assets:commentary` extracts 3,182 lines and their directives from each game's `ResUtils.pas` (the catalogs are identical); generated source metadata includes SHA-256 hashes. `npm run commentary:test` checks the original triggers, selection filters and unchanged game outcomes. Browser coverage is in `tests/commentary.spec.js` and `tests/audio.spec.js`. This ports automatic game commentary; native application-close chatter and portrait-click greetings are not part of this change.
