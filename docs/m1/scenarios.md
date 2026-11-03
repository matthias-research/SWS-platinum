# Native reference scenarios

These scenarios target the exact top-level executable hashes in [reference.json](reference.json). Observations are from actual Windows runs of copied executables, not inferred execution from Pascal source. The screenshots retain the original low-resolution art.

## Capture method

`scripts/reference-native.py` uses Python 3, Pillow and Windows APIs. It copies the selected executable, `Bmp`, `Karten`, `Daten` and saved-file examples into `artifacts/m1/native/<game>/work/`, creates local asset-path/sound preferences, and launches that copy. It inspects only windows owned by its child process. Commands are sent only to an enabled main window and an enabled menu item; profile/setup actions target observed controls in owned dialogs. The test profile is `M1 Reference` and is not intended to persist.

The launcher requests `SW_HIDE`, but Delphi can show its own windows; running a scenario can briefly display the native program. The capture uses bounded `PrintWindow` calls, and the helper terminates its owned process without normal shutdown to avoid the original exit-time writes of profiles/high scores/preferences. This is a working-copy arrangement, **not** a virtual machine or filesystem/registry isolation boundary. Do not invoke the legacy Save Options or normal exit paths as part of this protocol. No original file is modified by the helper.

Audio files are not copied, sound is configured off, and no network-game commands are used. This protocol cannot verify audio or networking. UI initialization, opponent selection, timers and OS rendering can vary: saved round files are stronger repeatability anchors than a fresh random deal. Record window size/DPI and the exact saved fixture when comparing later browser output.

To reproduce a capture, run the corresponding command below, then `npm run reference:report`. Inspect the images and JSON; a successful process launch or capture API return alone is not a claim that the intended screen appeared. A raw result under `artifacts/` is replaceable working evidence; selected screens/hashes are retained in `docs/m1/`.

## Observed cases

| ID | Command after `python scripts/reference-native.py` | Observed result |
| --- | --- | --- |
| S01 | `schieber --profile --label setup` | Initial human-profile prompt accepted with neutral data; illustrated four-seat Schieber setup appears. Main title is “Stöck Wyys Stich Gold”, 800 × 600 window. |
| D01 | `differ --profile --label setup` | Illustrated Differenzler setup appears. Main title is “SWS Platin Differenzler”, 760 × 540 window. |
| S02 | `schieber --profile --setup rules --label rules` | Rules page opens from the setup dialog; source options can be compared with the recorded controls and screenshot. |
| D02 | `differ --profile --setup rules --label rules` | Rules page exposes three/four players, prediction visibility, difference/rank totals, round count, bonuses and Stöck choices. Four players and 16 rounds are shown in this run. |
| S03 | `schieber --profile --setup cancel --command 29 --label four-player` | Captures the empty single-player table, then the four-player table after the enabled view-menu command. |
| D03 | `differ --profile --setup cancel --command 28 --label four-player` | Captures the same view transition for Differenzler. Its command ID differs from Schieber's. |
| S04 | `schieber --profile --file GRUMPY.JAR --label saved-archive` | The archive window opens with the recorded “Bauer” round, trump/shift annotations, hands, score panel and replay controls. This verifies opening/display, not all replay steps or final scoring. |
| D04 | `differ --profile --file TEST.JAR --label saved-archive` | The “Gloon” archive opens. The displayed prediction bubbles include 0, 65, 21 and 72, matching the first recorded round. This verifies opening/display only. |
| S05 | `schieber --profile --file TEST.JSS --label saved-game` | A saved game opens with cards, scores, dialogue and round-six log text. AI/timer activity continues, so an arbitrary delayed screenshot is not a deterministic move-by-move oracle. |
| D05 | `differ --profile --file TEST.JSS --label saved-game` | **Compatibility failure:** the selected executable exited with code 3221225725 (`0xC00000FD`) and no window was captured at observation time. Do not use this file as a passing import fixture. The cause has not been debugged. |
| D06 | `differ --profile --file diff.jss --label saved-game-current` | This supplied saved game opens into the game table. It is the working Differenzler saved-game reference instead of the older `TEST.JSS`. |

Recorded menu IDs apply to these exact binary versions and are checked against their live menu inventory by the helper. Do not reuse them for an alternate executable without inspecting its menu.

## Saved fixtures

All nine `.JSS` files and six `.JAR` files have source hashes, sizes and header inventories in `reference.json` and `artifacts/m1/fixtures.json`. They are custom Jass text formats. Original bytes remain untouched; working copies retain the same hashes. The fixture inventory does not claim that every file loads in every executable.

For stable future replay comparisons, use:

- Schieber `GRUMPY.JAR`, first round: suit trump 1, nine recorded tricks, Weis declarations and explicit card IDs. It contains two recorded rounds.
- Differenzler `TEST.JAR`, first round: drawn card 27, trump 3; calls `[0, 65, 21, 72]`, recorded made points `[12, 50, 14, 81]`, and zero bonuses. Those made points sum to 157. The file contains three recorded rounds. These numerical values are **file evidence**, not a claim that M1 replayed and recomputed the round to completion.

Run the archive to its beginning and advance one step at a time when building engine regression tests. Compare identities and scores, not just screenshots. Preserve the encoded rules from the fixture, since defaults and historical format variants differ.

## Scenarios defined for later implementation

These are acceptance scenarios to execute once the corresponding browser feature exists; they were **not** verified end-to-end in M1.

| Scenario | Controlled setup and assertion | Evidence to retain |
| --- | --- | --- |
| Legal plays | Recreate a hand with a required suit, trump jack exemption and undertrumping opportunity; attempt each candidate card in both versions. | Hand/trick/trump IDs and accepted/rejected move set; `SWSBase.LegalHand` / `diffbase.LegalHand` as source cross-check. |
| Schieber trump and shift | Use a fixed archived or seeded deal; compare each suit, Obenabe, Unenufe, shifting and partner's response. | Deal identity, legal choice set and resulting phase/trump. |
| Schieber declarations/scoring | Replay `GRUMPY.JAR` through counting, then add controlled Weis, Stöck and match cases. | Per-trick points, declarations, multipliers, team totals and game-end decision. |
| Differenzler visibility | Repeat the same deal in all three prediction-visibility modes. | Which calls are visible before/during/after the call phase, including the last caller. |
| Differenzler scoring | Replay `TEST.JAR`; compare absolute differences and optional bonuses/rank scoring separately. | Calls, made points, bonuses, per-round differences/ranks and cumulative totals. |
| Three-player Differenzler | Select three players; deal a fixed game and complete a round. | Twelve cards per player, turn order, legal moves and scoring. |
| Seeded dealing | Enter the same numeric seed twice in the original deal dialog, then in the browser once implemented. | Seed encoding and complete ordered hands; do not assume different random-number generators share seeds. |
| Save/reload and replay controls | Save a working game, reopen it, and exercise rewind/step/rotate controls in both versions. | State snapshot, remaining cards, scores, phase and expected replay cursor. |
| AI decisions | Replay identical information states with the same character/difficulty and table data. | Legal choices, selected move/prediction, random seed if known and timing configuration. |
| Audio and dialogue | Enable the complete copied sound library and repeat named game events. | Resource/voice IDs, clip order, overlap, timing and mute behavior. |

## Known gaps

No complete match was played to its end for M1. Rule edge cases, exact AI equivalence, all prediction variants, native audio timing and exhaustive legacy-save compatibility remain unverified. The native runs establish that the reference builds work here and provide concrete screens/fixtures; they do not certify the browser implementation's behavior.
