# SWS Platin: original software and browser revival

Inspected: 2026-11-03.

## Purpose and scope

Rebuild the two Delphi games in JavaScript so they run in a browser:

- **Schieber**, represented by `original/SchiebPl.exe` and the `original/Schieber/` source project.
- **Differenzler**, represented by `original/DiffPl.exe` and the `original/Differ/` source project.
- **Exclude the separate launcher/panel** from the browser implementation, as requested. Its source and artwork remain useful historical references.

This document records the initial investigation and subsequent milestone progress. Findings come from Pascal source, decoded Delphi forms, executable resource/import tables, supplied media/data files, and the M1 native reference runs. The initial investigation was static; M1 subsequently ran working copies of both selected game executables and captured setup, rules, table and saved-file screens. No Delphi rebuild was attempted, and full behavioral/source-to-executable equivalence remains unverified. Nothing under `original/` was changed.

## Fidelity requirement and executable verification

**Match the original games as closely as possible.** Preserve their rules, computer-player behavior, game flow, controls, layouts, animations, character expressions, dialogue, sound timing and saved-game behavior. The intended visual change is higher-detail artwork at an initial 2× scale; enhancement should preserve the original style, composition and meaning. Other departures should be documented and agreed with the user.

The supplied executables are the behavioral reference:

- `original/SchiebPl.exe` for Schieber.
- `original/DiffPl.exe` for Differenzler.

The user explicitly authorizes running and testing these executables throughout development to verify the browser implementation. Use them whenever behavior is uncertain and for milestone acceptance, rather than relying solely on source interpretation. Keep the supplied files intact; use working copies and separate test data when running the originals would create or change settings, profiles or saved games.

Compare equivalent situations using the same settings, hands, saved rounds or deal seeds where possible. Record reproducible steps, expected and actual results, and screenshots or other observations where useful. Check both behavior and appearance, comparing layout in the original logical coordinates so the intended 2× scale does not conceal alignment errors. Investigate differences in AI decisions with attention to randomness and timing.

Resolve source/executable disagreements against the selected reference build, recording the discrepancy. The differing executables inside the source directories remain secondary references until their version differences are understood. If compatibility issues prevent an original from running, record that validation gap explicitly; do not claim executable parity from static inspection alone. Executable comparison is an ongoing part of implementation, not only a final release check.

## Main findings

The archive contains substantial source for both games, including rules, game state, computer players, persistence, drawing code, dialogs and networking. This can be a source-guided rewrite; reconstructing everything from machine code should not be necessary.

Artwork is spread across **three important sources**: loose files in `Bmp/`, card sheets in `Karten/`, and images embedded in Delphi forms. The forms contain major interface assets, including character portraits, table interface pieces and illustrated dialogs. Copying `Bmp/` alone would miss much of the original appearance.

The original AI also relies on supplied binary lookup tables. These are part of the behavior to preserve, alongside the Pascal algorithms. The character voices are a substantial separate asset collection.

There are different executable builds in the archive. The top-level executables are not byte-identical to the copies inside the source directories. M1 selects the user-named top-level games as the reference builds and records their exact identities and resource differences in `docs/m1/reference.json`.

## Archive inventory

Counts include uppercase and lowercase extensions, but exclude backup extensions when counting source/forms. Sizes below are approximate directory totals, including compiled files and backups.

| Location | Contents | Size |
| --- | --- | ---: |
| `original/Schieber/` | 59 `.pas` files, 37 `.dfm` forms, `SchiebPl.dpr`, executable, compiled units, settings, help and saved-game examples | 11.32 MiB |
| `original/Differ/` | 76 `.pas` files, 36 `.dfm` forms, `DiffPl.dpr`, executable, compiled units, settings, help and saved-game examples | 17.80 MiB |
| `original/Panel/` | 4 `.pas` files, 4 `.dfm` forms, `Panel.dpr` and `Panel.exe` | 2.33 MiB |
| `original/Bmp/` | 82 `.bmp` files, 4 valid BMP images named `.BM`, and thumbnail caches | 37.62 MiB |
| `original/Karten/` | 20 card-sheet BMP files and thumbnail caches | 8.42 MiB |
| `original/Daten/` | 5 AI `.dat` files and 2 sound `.map` files | 0.95 MiB |
| `original/SOUND/` | 5,305 WAV files and one log | 329.87 MiB |

There are 6,046 files overall. Numerous `.~pas`, `.~dfm` and similar backup files are present; they should be preserved as history, rather than treated as additional active modules. `.dcu` files are compiled Delphi units. The `.cfg` files reference **Borland Delphi 5** paths. Every explicit Pascal file reference in the two game `.dpr` files resolves locally; this is not proof of a successful rebuild or of complete external dependency availability.

### Executable versions

All three top-level applications are native 32-bit x86 PE executables.

| Executable | Bytes | SHA-256 prefix |
| --- | ---: | --- |
| `original/SchiebPl.exe` | 3,436,544 | `e459420bece30466a` |
| `original/Schieber/SchiebPl.exe` | 3,434,496 | `85ad062480161e2e` |
| `original/DiffPl.exe` | 4,239,872 | `73efe1af9e869eda` |
| `original/Differ/DiffPl.exe` | 4,231,168 | `5b9941e3f2ee1210` |
| `original/PanelPl.exe` | 924,672 | `3aee937c6d9518fc` |
| `original/Panel/Panel.exe` | 924,672 | `f1dd4f6b6ecdc55a` |

The top-level games each contain 32 Delphi form streams in `RT_RCDATA`, plus two other RCDATA entries (`DVCLAL` and `PACKAGEINFO`). The top-level panel contains three form streams. This is fewer than the source form files: some source forms are not included in those builds. Each game also has 50 separate `RT_BITMAP` resources, with names such as `BBOK` and `CL_MPPLAY` indicating VCL button/media artwork. Embedded form pictures must be inspected separately from these bitmap resources.

## Source architecture

The two games use closely related designs, with duplicated infrastructure and game-specific engines. Shared names do not guarantee identical implementations.

| Responsibility | Schieber | Differenzler |
| --- | --- | --- |
| Program entry point | `SchiebPl.dpr` | `DiffPl.dpr` |
| Initialization | `SWSMain.pas` | `DIFFMAIN.PAS` |
| Rules, cards, hands and scoring | `SWSBase.pas` | `diffbase.pas` |
| Game lifecycle and player handlers | `SWSPlay.pas` | `DIFFPLAY.PAS` |
| Commands and requests | `SWSCmds.pas` | `Diffcmds.pas` |
| Saved setups, games and rounds | `SWSFile.pas` | `DIFFFILE.PAS` |
| Statistics, profiles and ratings | `SWSStat.pas` | `DIFFSTAT.PAS` |
| Player/AI integration and reactions | `JASSERS.PAS` | `JASSERS.PAS` |
| Main window and menus | `MAINWIN.PAS` | `MAINWIN.PAS` |
| Table painting and animation | `Table.pas` | `Table.pas` |
| Graphics and asset lookup | `JassBmps.pas`, `ICONS.PAS`, `PCFILES.PAS` | `JassBmps.pas`, `Icons.pas`, `PCFILES.PAS` |
| Preferences, audio and replay | `PREFER.PAS`, `PCMEDIA.PAS`, `REPWIN.PAS` | Same unit names |
| Networking | `SWSNet.pas`, `WINNET.PAS`, `Wsockets.pas` | `DIFFNET.PAS`, `WINNET.PAS`, `Wsockets.pas` |

`TJassManager` and player handlers already separate much of the game lifecycle from individual human/computer/network actions. This is useful structure to retain. The separation is incomplete: some engine code still logs through UI units or displays dialogs on errors.

The table is largely **custom bitmap/canvas drawing**, not just a collection of standard Delphi controls. `Table.pas` defines `TTable` as a `TBitmap` subclass and handles table layout, hands, scores, speech and animations. Recreating only the `.dfm` controls would not recreate the playing interface.

### Schieber behavior established by source

`SWSBase.pas` defines 36 cards, ranks six through ace, four players, two partnerships and nine-card hands. Trump choices are the four suits plus Obenabe and Unenufe. The game lifecycle includes dealing, trump selection, shifting, card play and counting (`SWSPlay.pas:21`).

The rules include follow-suit obligations, the trump-jack exception and undertrumping restrictions (`SWSBase.pas:680`, `LegalHand`), Weis combinations and priority, Stöck, match bonus, trump multipliers, and point/round limits. Source defaults include a 2,500-point target, 12 rounds, enabled Weis, a 100-point match bonus and multipliers `2/2/1/1/3/3` (`SWSBase.pas:1713`). These are defaults in this snapshot, not necessarily settings used by a particular installation.

The UI supports simple/expert game setup, profiles, hints, autoplay, undo, pause, statistics, high scores, replay, revealing hands, seat rotation, and one-/four-player views. Networking and remote-client code also exist (`MAINWIN.PAS`, `REPWIN.PAS`, `SWSNet.pas`).

The active AI initialization calls `InitSWSRalphJasser(4)` (`JASSERS.PAS:1117`). `RalphJss.pas` registers four handlers using the same engine, internally called Grumpy, and loads `RUGD7000.DAT`. It includes hand inference, trump/shift evaluation and expected-trick calculations. `MattJass.pas` is an older alternative whose initialization is commented out; the presence of an AI source file does not establish that it is active.

### Differenzler behavior established by source

`diffbase.pas` defines the same 36-card deck, with **three- or four-player games**: twelve or nine cards per player. A drawn card determines the trump suit. This core defines four suit trumps; the Schieber no-trump variants are not part of its trump type.

The lifecycle includes a prediction/call phase before card play (`DIFFPLAY.PAS:21`). Three prediction visibility modes exist: hidden throughout, hidden while calling then revealed, and open throughout. Base round difference is `abs(predicted - won) - bonus`, with lower differences ranking better (`diffbase.pas:386`). The ordinary round total is 157 card points, including five for the last trick.

Options include round limits, cumulative differences versus cumulative round ranks, an exact-prediction bonus requiring at least one trick, an open-prediction last-caller bonus, and a Stöck adjustment. Defaults are four players, 16 rounds, cumulative differences, hidden predictions, no exact/last-caller bonuses, and the subtracting Stöck option (`diffbase.pas:1254`).

The UI includes profiles, hints, undo, pause, replay, statistics, high scores, seeded deals, hand visibility and networking. `DlgPuzzle.pas` also implements a sliding puzzle using the splash picture; this is an optional extra, separate from the core card game.

Three AI families are initialized in `JASSERS.PAS:1090`:

- **Hacker:** `hackrjss.pas` and `Hjasser.pas`, using `Hcall.dat` and `HPLAY.DAT`.
- **Trashy:** `FdcJass.pas`, `FdcBase.pas`, `FdcCll.pas`, `fdcGuess.pas`, `FdcSrch.pas` and `FdcPlay.pas`, using `TRASHY.DAT`.
- **Grumpy Junior:** `rgJasser.pas`, `rgLearn.pas` and related `rg*` units, using `RGDIFF.DAT`.

Both games create public character profiles for Birgit Steinegger, Beat Schlatter, Stéphanie Berger and Walter Andreas Müller, with weak/medium/strong levels. Public character identities, internal AI engines and voice directories are separate concepts; their mappings need to be preserved.

### Panel

`Panel/main.pas` locates and launches `schiebpl.exe`, `diffpl.exe` and optional `setup.exe` using `CreateProcess`. Its separate launcher behavior is outside the requested port. `Bitmaps.dfm` contains the launcher artwork; `DlgIntro.dfm` contains splash artwork. `Info.pas`/`Info.dfm` exist but are not in the panel project's `uses` list.

## Graphics inventory and recovery

### Loose BMP files

`original/Bmp/` contains table backgrounds (`BackS1`, `BackS4`, `BackD1`, `BackD4`), card backs (`CARDB...`), trump-selection artwork (`TRUMPD`, `TRUMPF2`, `TRUMPF4`), score/result artwork (`Ratings`, `Round`, `Match`, `Win`, `Conter`), about-screen artwork and photographs (`A01`–`A12`). There are also `DIFFEREN` and `GLASTIS*` background directories.

- The four main `BackS*`/`BackD*` backgrounds are 1024 × 768.
- Many result illustrations are 640 × 480.
- Background variants include 1024 × 768 and 1280 × 960 images.
- `Bmp/GLASTIS3/1.BM` through `4.BM` are valid BMP images despite the shortened extension.
- Card backs provide three designs, three size indices and both orientations: 18 files.

All 106 loose `.bmp`/`.BM` files across `Bmp/` and `Karten/` opened successfully during inspection and are palette-based images. Which background variants are active should be determined from actual lookup paths, not filenames alone.

### Card sheets in `Karten/`

There are five card sets: one German-suited set in `Deutsch/` and four French-suited variants in `Franz/`. Two French variants are marked four-colour in `PCFILES.PAS:65`.

Each set has medium/large sheets in horizontal and vertical orientations, giving 20 BMP files. For example:

| File pattern | Dimensions |
| --- | --- |
| `CARDS11V.BMP` | 666 × 516 |
| `CARDS11H.BMP` | 468 × 666 |
| `CARDS12V.BMP` | 864 × 648 |
| `CARDS12H.BMP` | 600 × 864 |

`PCFILES.PAS:154` constructs the filenames, and `JassBmps.pas:1421` in Schieber loads them. `ShowCard` at line 652 contains the actual crop/rotation/clipping logic. The sheets also include extra symbols: do not simply divide the entire image into 36 equal rectangles. Drawing dimensions include borders and differ from the underlying sprite pitch.

### Embedded Delphi pictures: confirmed and decoded

Of the **77 source `.dfm` files**, 74 contain binary Delphi object streams with a resource prefix and `TPF0` signature. Three are text forms: `Differ/DlgPuzzle.dfm`, `Differ/DlgRound.dfm` and `Panel/DlgIntro.dfm`.

Binary forms were parsed by component and property, including `Picture.Data` and `Glyph.Data`; the bitmap payloads were opened as images. Text forms were inspected for their hex-encoded properties. Representative sprite sheets and backgrounds were also visually inspected.

| Source project | Forms | Forms containing BMPs | Embedded BMP instances | Distinct BMP byte payloads within project |
| --- | ---: | ---: | ---: | ---: |
| Schieber | 37 | 20 | 41 | 35 |
| Differenzler | 36 | 18 | 38 | 37 |
| Panel | 4 | 3 | 16 | 15 |
| **Total** | **77** | **41** | **95** | **75 across all projects** |

These are counts of complete embedded BMP payloads, not the number of sprites inside their atlases. They exclude icon-format payloads and backup forms. Distinctness is by SHA-256 of BMP bytes, not visual similarity. Only one of the 95 embedded instances is byte-identical to a loose image: `Schieber/DlgHigh.dfm` → `HighDlg.BackgImg` matches `Bmp/Ratings.bmp`. Other images may still be visually related despite differing bytes.

Important embedded assets:

| Form and component | Dimensions | Role/evidence |
| --- | --- | --- |
| `Schieber/JassBmps.dfm`: `BmpsForm.Pieces` | 491 × 603 | Main interface sprite sheet: borders, name plates, score elements, digits, arrows, pen, shuffle graphics and masks |
| `Differ/JassBmps.dfm`: `BmpsForm.Pieces` | 510 × 603 | Related sprite sheet with additional Differenzler controls |
| Both `JassBmps.dfm`: `Blend1`, `Blend2` | 288 × 32 each | Blend-pattern images used by the drawing routines |
| `Schieber/ICONS.dfm`, `Differ/Icons.dfm`: `iconForm.Icons` | 938 × 465 | Character portraits, expressions and other player/game icons |
| `Schieber/DLGNEW.dfm`: `DlgNewJass.BackImage` | 465 × 419 | Illustrated Schieber setup background |
| `Differ/Dlgnew.dfm`: `BackImage`, `Back3Image` | 465 × 419 each | Two Differenzler setup backgrounds |
| Both `DlgHigh.dfm`: `HighDlg.BackgImg` | 640 × 480 | High-score background |
| `Differ/DlgRound.dfm`: `BackImg` | 640 × 480 | Round-score background |
| `Differ/DlgHighN.dfm`: `HighNameDlg.Image1` | 425 × 288 | High-score name dialog artwork |
| Both `DLGCALL` forms: `Gloon0`–`Gloon3` | 120 × 190 each | Character imagery; Differ also has a 199 × 272 `BackGround` |
| Both `DLGHINT` forms: `BackG`, `Arm`, `ArmM`, `CallBox` | 182 × 90; 80 × 16; 80 × 16; 96 × 60 | Hint panel graphics and mask |
| Game `DLGINTRO` forms; panel `DlgIntro` | 347 × 260 | Splash images |
| `Schieber/DLGABOUT.dfm`: `floatText`, `floatMask` | 120 × 865 each | Scrolling credits artwork and mask |
| `Differ/Dlgabout.dfm`: `floatText`, `floatMask` | 120 × 908 each | Scrolling credits artwork and mask |
| `Schieber/dlgMarti.dfm`: `BackImg`, `BackImg2` | 640 × 480; 282 × 336 | Additional dialog artwork in the source archive |
| Both `DLGTEAM` forms: `Image1` | 140 × 240 | Team dialog artwork |
| Both `DLGHP` forms: `Image1` | 100 × 143 | Dialog illustration |
| Both `REPWIN` forms | Seven 20 × 20 glyphs each | Replay controls |
| Both `DlgStock` forms | Two 32 × 32 glyphs each | Add/subtract controls |

Other button BMPs appear in cancel, dirty/save confirmation, random-deal and trump dialogs, plus Schieber's client, info, hint and speech dialogs. Many are 36 × 18 multi-state strips; extraction should retain `NumGlyphs` and related properties instead of treating every strip as one icon.

The panel's `Bitmaps.dfm` has 14 BMP instances: normal/hover/pressed game buttons, pen/setup controls, exit controls and two 430 × 432 backgrounds. Its `Info.dfm` adds a 200 × 263 picture; its splash adds one image. These need not become dependencies of the browser games.

### Sprite coordinates and transparency

The Pascal code provides the atlas maps:

- `Schieber/JassBmps.pas:185`: **121** piece rectangles in `kPieceRect`.
- `Differ/JassBmps.pas:194`: **128** piece rectangles, including additional controls.
- `Schieber/ICONS.PAS:67`: **106** icon entries in `kIconData`, mapping rectangles to semantic resource numbers.
- `ShowCard`, `ShowSmallAce`, `ShowTrump` and related routines define card and symbol crops.

Preserve these mappings when exporting PNG files or an atlas manifest. The original combines palettes, separate masks, blending and GDI raster operations. A blanket rule such as making all white pixels transparent would damage artwork. Card clipping, borders, mask composition and button states should be translated explicitly.

The top-level executables were checked independently: their compiled form streams contain 33 BMP instances in Schieber, 35 in Differenzler and 15 in the panel. These counts differ from the full source archive because the included forms differ. Some corresponding button payloads also differ byte-for-byte between source and executable, notably `TRndDlg` in both games and a `TDirtyDlg` button in Schieber. This establishes version differences, not necessarily visible pixel differences.

## AI tables, audio and saved data

### AI data files

| File in `original/Daten/` | Bytes | Source consumer |
| --- | ---: | --- |
| `RUGD7000.DAT` | 48,016 | Schieber `RalphJss.pas` |
| `Hcall.dat` | 338,332 | Differenzler `Hjasser.pas`, prediction tables |
| `HPLAY.DAT` | 20,484 | Differenzler `Hjasser.pas`, play tables |
| `TRASHY.DAT` | 184,320 | Differenzler `FdcBase.pas` |
| `RGDIFF.DAT` | 366,824 | Differenzler `rgLearn.pas` |

These files are present, and the source contains their loaders. Some loaders decode individual numbers; others read directly into Delphi records or packed arrays. A JavaScript decoder/exporter must account for byte order, signedness, numeric formats and record layout. File availability and size do not prove semantic equivalence of a future conversion.

### Speech and effects

There are **5,305 WAV files**, about 140 minutes in aggregate. All opened with a WAV parser and report uncompressed mono PCM. Most are 22,050 Hz: 4,619 files use 16-bit samples and 664 use 8-bit samples. The remaining 22 files have other sample rates, including slightly unusual legacy rates.

The collection has general character voices in `STIMME1`–`STIMME6`, card-set-specific speech under `DEUTSCH` and `FRANZ`, and effects under `ANDERE`. `SOUNDD.MAP` (19,284 bytes) and `SOUNDF.MAP` (19,292 bytes) map sound resources. `PCMEDIA.PAS`, `JASSERS.PAS` and text/resource units connect game events, dialogue and numeric filenames.

For the port, convert the WAV files to MP3 to reduce storage and download sizes, retaining the original WAV files as source assets. Preserve the event-to-voice mapping and load audio on demand. An initial page should not require the entire roughly 330 MiB collection. Check representative clips for sound quality and dialogue timing after conversion.

### Existing persistence

The nine `.JSS` examples and six `.JAR` examples are **custom Jass text formats**, not Java files or Java archives. They begin with markers such as `### Jass-Setup:` and `### Title:`. `SWSFile.pas` and `DIFFFILE.PAS` document and implement ASCII serialization. These are useful fixtures for replay, import/export and regression checks.

Preferences use `SCHIEBPL.INI` / `DIFFPL.INI`. Profiles and high scores include `swspl.prf`, `schiebpl.hsc` and `diffpl.hsc`, written through `PCFILES.PAS` to Windows-specific locations. Browser storage and explicit file import/export will need to replace these paths.

## Migration implications and unresolved points

1. **Choose a reference build.** The archive holds different executable versions, and source/resource differences are observable. Use the user-named top-level executables as provisional behavioral references, while retaining all variants until their differences are understood.
2. **Fix asset-path assumptions in any native reference rebuild.** Both `PREFER.PAS` files unconditionally override the configured path with `C:\My Documents\Source\Delphi\SWSPlatin\` (Schieber line 110, Differ line 105). This is active source code, not a comment.
3. **Replace the Windows integration.** VCL forms, GDI/TBitmap drawing, palettes, message/idle handling, WinHelp, INI/filesystem access and `MMSystem.PlaySound` have browser-specific replacements. Import-table inspection confirms dependencies including `user32.dll`, `gdi32.dll`, `wsock32.dll` and `winmm.dll`.
4. **Treat network multiplayer as a separate feature decision.** Source uses Winsock TCP, with ports 20410 for Schieber and 17410 for Differenzler. Browsers need a browser-compatible transport and server design. The old `host.jass.ch` default was not contacted or verified.
5. **Handle text encodings carefully.** Source and saved files contain legacy German/Swiss text and mixed line endings, including CR-only files. Preserve original bytes and verify accented characters before UTF-8 conversion; blindly decoding everything as UTF-8 will lose text.
6. **Review ancillary assets.** Code refers to AVI media, but no `.avi` files were found. Schieber's intro movie call is commented out. Differ's help handler asks for `DIFFPL.HLP`, while the supplied file is named `Differ.hlp`. Help contents and actual native playback were not examined.
7. **Separate historical source from active functionality.** Unused forms, alternative AI units and backups are valuable references, but should not automatically become browser requirements. In particular, the separate panel is excluded and the sliding puzzle is optional.

## Milestones

This is the implementation roadmap, without assigned dates. The initial investigation is complete. At the user's request, implementation has started with a React/Vite foundation and the Schieber opening screen, including an enhanced table sample. The separate launcher remains excluded. Network multiplayer remains optional follow-up work. The sliding puzzle is now restored with the dialog collection.

Current implementation: both games are playable through complete matches, using source-translated rules and the original Pascal AI compiled to JavaScript in a worker. Includes three-/four-player Differenzler, all three Differenzler AI families, setup, human turns, scoring, hints, undo, pause, round forfeits, save/resume/export, archive replay, match history and on-demand sound. Both tables have enhanced background samples; card and interface sheets remain original resolution. All 5,305 WAVs have MP3 copies (346 MB to 61 MB). See [playable-game notes](docs/playable-games.md) and [AI port details](docs/ai-port.md) for validation and explicit fidelity gaps. Full artwork enhancement, personality restoration and exhaustive native parity remain outstanding.

### M0 — Original software inventory

**Status: Complete (static investigation).**

Deliverable: this document, identifying both projects, their rules and AI, external and embedded assets, data formats and migration constraints. Completion covers static discovery only; it does not imply a successful native build or runtime validation.

### M1 — Reference behavior and reusable asset extraction

**Status: Complete within the reference/extraction scope. Depends on M0.** See [M1 results](docs/m1/README.md), [reference scenarios](docs/m1/scenarios.md) and [coordinate/mask notes](docs/m1/mappings-notes.md).

Implemented a reproducible extraction pipeline (`npm run reference:extract`) covering all 77 source forms, all six executable resource trees, 586 image instances/233 distinct payloads, 249 interface pieces, 212 icons, masks, all five card sets and 15 saved fixtures. Full manifests and searchable preview galleries are generated in ignored `artifacts/m1/`; compact identities, findings and selected native screenshots are retained in `docs/m1/`. Nine extraction/mapping tests check recovery, hashes, geometry and mask behavior.

Ran working copies of both top-level game executables. Recorded 11 reference scenarios spanning setup/rules, table-view changes, archive loading and saved-game loading. Ten scenarios captured windows; the older Differenzler `TEST.JSS` exited with `0xC00000FD`, while `diff.jss` and `TEST.JAR` opened. The failure and untested rule/AI/audio cases are explicitly recorded. Full matches and complete browser/native parity are not claimed by M1.

Resolved resource discrepancies: random-deal glyph byte differences are pixel-identical; Schieber's `DirtyDlg.NoBtn` has a visible source/reference difference, so the compiled reference payload is authoritative. Exact RGB AND/OR mask mappings are now preserved; M3 subsequently replaced the prototype's alpha approximation with these operations.

Select the reference builds, starting with the user-named top-level executables, and record representative game screens and behavior where the originals can run. Resolve relevant differences between those builds and the source. Preserve `original/` unchanged.

Extract the required loose and embedded artwork into a separate working asset collection. Create a manifest recording source file/form/component, property, original dimensions, hashes, sprite rectangles, masks and button states. Preserve original card/resource numbering and case-correct paths. Identify representative saved rounds and rule scenarios for later comparisons.

**Done when:** every asset required by the selected game screens has a traceable manifest entry, recovered images and masks can be previewed, and reference scenarios are documented. Any unavailable native behavior is explicitly recorded as a validation gap.

### M2 — Enhanced 2× artwork samples

**Status: In progress. Depends on M1.** Both table-background samples are integrated for original/enhanced comparison; user visual acceptance and the other sample categories remain pending.

The goal is additional perceived detail, not simply larger pixels. Prepare a small comparison set containing a table background, character portrait, card and interface element. Compare the originals with AI-enhanced versions at exactly twice the width and height, preserving the original style and composition. AI-generated detail is a reconstruction, not recovery of the original high-resolution artwork.

Extract sprite elements before enhancement. Check faces and expressions, card ranks and suit symbols, lettering, outlines and mask alignment. Use precise reconstruction where generative enhancement changes meaningful details. Keep original images available as references and fallbacks.

**Done when:** the user has reviewed the samples and selected the visual treatment for each asset category. Process the remaining collection only after this sample review.

### M3 — Browser foundation and central scaling

**Status: Complete within the rendering-prototype scope.** React/Vite, central scaling, exact legacy RGB mask composition and an interactive card review surface are implemented. All five original card sets are packaged with traceable mappings. Automated checks cover display scales 1/2/3, asset scales 1/2 for masks, high DPI, overlapping hit targets and keyboard selection. See [M3 rendering notes](docs/m3-rendering.md) for evidence and remaining native rasterization limits. M2 artwork review remains pending; full gameplay interaction belongs to M7.

Create the JavaScript browser project and a representative table-rendering prototype. Keep the legacy coordinate system as the logical reference, with all transformations handled centrally rather than multiplying coordinates throughout the code.

- Set a central `displayScale` initially to `2` for layout and drawing size.
- Record `assetScale`, initially `2` for enhanced assets, separately from display scale; original fallback assets retain scale `1`.
- Transform atlas source rectangles using the asset's scale and destination geometry using display scale, avoiding double scaling.
- Convert pointer coordinates back to logical coordinates for hit testing.
- Handle browser device pixel ratio separately from both settings.

Canvas is a natural fit for the table renderer; DOM controls can provide menus, settings and accessible interaction. The prototype uses React with Vite, Canvas rendering and DOM controls. Increasing display scale later must not require rewriting the atlas coordinates; improving image detail further may require another asset-generation pass.

**Done when:** the same prototype renders correctly at display scales 1, 2 and 3, using original or enhanced assets, with aligned cards, masks, text and click targets across representative screen densities.

### M4 — Production artwork collection

**Status: Planned. Depends on M2 and the asset/scaling contract from M3.**

Apply the reviewed enhancement process to the artwork required by both games. Export lossless browser assets, reconstruct transparency from the appropriate masks, and assemble atlases with explicit coordinate mappings. Preserve individual sprite bounds, button states, card symbols and character identities. Record exceptions and assets requiring manual correction.

**Done when:** required artwork is available at exact 2× dimensions, its manifest is validated, and representative complete screens pass visual review without seams, clipping, incorrect symbols or mask misalignment. Unused historical and panel artwork need not be enhanced.

### M5 — Rule engines and game state

**Status: Complete for playable game rules and state.** Direct Pascal translation retains names and IDs, dealing, legality, winners, Weis/Stöck, scoring, lifecycle and round forfeits. The command layer implements shifting, prediction visibility, validated turns and deterministic replay. Tests include 72 archived plays, 18 winners and multi-round matches. Exhaustive executable parity remains M9 work. See [M5 translation map and verification](docs/m5-core.md).

Translate the Pascal source directly, preserving its structure, identifiers and behavior wherever practical; adapt Delphi-specific infrastructure to browser equivalents. Port shared card definitions and utilities, with separate Schieber and Differenzler rules and state transitions. Preserve card numbering, dealing, trump ordering, legal moves, scoring and seeded-deal semantics. Cover Schieber's partnerships, shifting, Weis and Stöck, and Differenzler's predictions, visibility modes and three-/four-player options.

**Done when:** both engines can complete scripted games without a UI, with meaningful checks for legal-move edge cases, scoring, game termination and deterministic replay. Compare against source-derived examples and the available reference scenarios.

### M6 — Computer players and AI tables

**Status: Implemented; full native decision parity remains unverified.** Schieber and all three Differenzler families compile from original Pascal with reproducible compatibility adaptations. All five tables are packaged with hashes and explicit decoders where needed. Worker execution, legal full-match play, difficulty levels and future-decision save replay are tested. Trashy float32 arithmetic and character/personality mappings remain fidelity gaps. See [AI port](docs/ai-port.md).

Implement explicit decoders or conversions for the five AI data files. Port the active Schieber engine and the three initialized Differenzler AI families, retaining character and difficulty mappings. Move expensive computation into a Web Worker, separating decision-making from UI and audio effects.

**Done when:** data conversion checks pass, computer players complete games using legal moves, and prediction/trump/play decisions are compared with reference scenarios. Account for randomness and timing when interpreting differences; record unresolved discrepancies.

### M7 — Playable browser versions of both games

Schieber's new-game screen now reproduces the original graphical player dialog:
embedded background, four character portraits, 20 human avatars, individual
strength controls, random selection and a separate rules dialog. Coordinates
and assets are traceable to the original form and executable. See
[setup-dialog notes](docs/new-jass-dialog.md).

**Status: Complete for end-to-end single-player games.** Both games support setup, human decisions, original AI, scores, round transitions and new matches; Differenzler supports three and four players. Browser tests exercise full matches and human card/hint/undo controls. Final artwork acceptance remains separate under M4/M9.

Integrate rendering, interaction, rules and AI. Deliver Schieber first as an end-to-end game, then Differenzler using the shared infrastructure. Include game setup, human decisions, computer turns, scores, round transitions and restarting. Keep both games directly accessible without rebuilding the old launcher application.

**Done when:** a human can finish a complete Schieber match and a complete Differenzler game against computer players in the browser, including both supported Differenzler player counts, with correct scoring and usable scaled controls.

### M8 — Persistence, voices and supporting features

**Status: Core features implemented; full legacy presentation/support parity remains open.** Browser save/resume and file export/import, legacy archive replay, display preferences, player name, match history, hints, undo and pause work. All WAVs are converted; core effects, trump/shift, visible predictions and card/trump/prediction hints load on demand using the original PCMEDIA mappings. Speech phrases are sequenced and cancellable; voice/volume/mute preferences persist. Hidden predictions remain silent. Fourteen supplied legacy files replay; older Differenzler TEST.JSS is incompatible. Native-state continuation, old profile/high-score import and complete character dialogue are not implemented.

Add browser settings and saved-game storage, explicit import/export, and compatibility checks using the supplied `.JSS`/`.JAR` examples. Restore profiles, high scores, hints, undo, pause, replay and statistics. Preserve sound-event and character mappings, loading speech/effects on demand rather than downloading the entire collection at startup. Support browser audio activation and mute/volume controls.

**Done when:** saved games resume correctly, representative legacy files import and replay, supporting features behave consistently with the game state, and speech/effects trigger correctly without blocking play or requiring the full sound library upfront.

### M9 — Fidelity review and browser release

**Status: In progress.** A reproducible static build and automated engine/browser checks are available. Both reference executables were run for archive comparisons; checked scores/predictions agree. Complete native move-by-move comparisons, full artwork review and wider browser/device validation remain open. See [current validation and limits](docs/playable-games.md).

Run the reference executables and compare complete games and key visual states against the browser versions, building on the comparisons recorded throughout development. Review rules, predictions, AI decisions, transitions, persistence and enhanced artwork. Check mouse/touch input, resizing, screen density, loading performance and long-running AI responsiveness in the chosen desktop and mobile browser targets. Document how to run/build the project and how to change display scale or regenerate assets.

**Done when:** both games pass the agreed reference scenarios, material discrepancies are resolved or explicitly accepted, the enhanced visuals pass review, and a reproducible browser build is ready for use. Publication or hosting is a separate action once a destination is selected.

## Inspection evidence

Source references above use paths under `original/` and line numbers from the inspected snapshot. The asset inventory covered all 77 non-backup source forms, all 106 loose BMP images (including `.BM`), and all 5,305 WAV headers. The 74 binary source form streams and 67 top-level executable form streams parsed through their final terminators without trailing bytes. Representative recovered images were visually checked; this was not a visual review of every sprite or a listening review of every recording.

REA supplied complete static PE resource/import inventories. Retained evidence identifiers:

- Schieber resources: `ev_b13b2962d6658be74f2ef7d57c8bc4c4546e257c4b23445f8151cbad9a9dae3b`.
- Differenzler resources: `ev_2241981d4b3093811a4420f36b5a8d5810c70aeb6767564749fa6dabb709c077`.
- Panel resources: `ev_99499a63162275bc2e21e8bcc82542e6ec59be1e03125c180daaa9d7b6104b1c`.
- Schieber imports: `ev_de079d3576f5304f601d5b8ef4e9e686d6442d766f4601ffbc37239661db6971`.
- Differenzler imports: `ev_e9e6fb242251b52b9233920a464c13fb07afe7b25fe9f046d3f263d6f07e09e3`.

These establish static file contents only. The source snapshot was inspected selectively for architecture and key behavior; it has not received a line-by-line correctness audit, a successful build, or gameplay validation.

## Dialog restoration update

Both games now use their original illustrated dialogs and embedded bitmap collection. Rules/preferences, profiles, trump/prediction, Weis/Stoeck, hints, results, high scores, statistics, archive export/playback, rematch/forfeit, automatic-play progress, credits and the picture puzzle are available. The catalog includes all 64 game executable forms and 218 unique recovered bitmap images, excluding the launcher. Original coordinate layouts share the global display scale; bitmap detail enhancement remains M4 work.

See [form-by-form coverage and remaining fidelity limits](docs/dialogs.md). Network/CD-specific dialogs and developer/resource forms are distinguished from player dialogs. Results/statistics/archive paintboxes use browser rendering and still need further native visual comparison; this does not mark M9 complete.

Player announcements now appear in timed, dismissible speech bubbles and an illustrated scrolling feed, following `Log.pas` and `Table.pas`. Original trump symbols, declaration cards and conversation portraits are reused. Bubble duration is configurable, and hidden predictions remain protected in both the engine view and the UI.
