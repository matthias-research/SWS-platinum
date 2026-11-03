# Pascal computer players in the browser

The decision algorithms are compiled from the supplied Pascal, not replaced by a
new approximation. Schieber uses `RalphJss`; Differenzler offers Grumpy Junior
(`rgJasser`, `rgLearn`, `rgPlay`, `rgTrick`, `rgEnd`), Hacker (`HackrJss`, `Hjasser`,
`HEND`), and Trashy (`FdcJass`, `FdcBase`, `FdcCll`, `FdcGuess`, `FdcSrch`, `FdcPlay`).
Original source credits include Ralph Gasser, Ambros Marzetta and Christoph Wirth.
The application is based on Matthias Mueller's Delphi software.

## Rebuilding

Ordinary `npm ci`, development and production builds use the checked-in generated
JavaScript and packaged data. They do not require Pascal, Python, or `original/`.
To regenerate the AI, keep the local original archive and install Python and
[pas2js 3.2.0](https://getpas2js.freepascal.org/). In PowerShell:

```powershell
$env:PAS2JS = 'C:\path\to\pas2js.exe'
npm run ai:build
npm run engine:test
```

The default compiler location is the ignored local `artifacts/toolchain/pas2js/`
installation. Preparation writes adapted Pascal only to `artifacts/pascal-ai/`.
Original files are read-only inputs. `-Mdelphi -O- -Jc -Jirtl.js` are intentional:
disabling optimization retains methods invoked through the JavaScript adapters.
`src/ai/generated/` contains isolated runtime factories. Each new match gets its
own Pascal globals; computations run in a Web Worker.

`public/assets/ai/manifest.json` records packaged table and generated-module
hashes. The five original DAT files are copied unchanged. Grumpy loaders retain
their Pascal decoding algorithms, supplied with byte arrays. Hacker and Trashy
tables are decoded explicitly in `src/ai/tables.js`, accounting for little-endian
integers, packed records and IEEE single-precision fields. Lengths, version
markers and complete consumption are checked.

## Compatibility adaptations

- Fixed strings become strings; Windows file/UI interfaces become small shims.
  UI command records preserve the original fields and command IDs.
- Global pointers to arrays become arrays; pointer-to-record structures retain
  record identity. Trashy's mutable play-table pointers use record wrappers, and
  recursive hand pointers use indices into the original shared array.
- Anonymous array record/set types receive names to avoid duplicate RTTI names.
- Indexed `INC`/`DEC` expressions are rewritten as indexed assignments. The
  compiler otherwise mishandles certain VAR array accesses.
- Direct file-record reads become explicit byte decoders. Learning writes and
  the native statistics registry are excluded; shipped learned tables remain.
- Computer notifications contain only that player's hand. Hidden predictions
  follow the original manager's notification rules.
- Saves record commands, options and seed. Restoration replays computer
  requests as well as recorded responses to rebuild private AI random state.
  Hints use a separate restored instance and do not change the live AI.

Pas2js represents Pascal `Single` arithmetic with JavaScript numbers. Table
values decode exactly, but Trashy's intermediate arithmetic may differ from
Delphi float32 rounding. Full native decision-by-decision equivalence is not
established. Original personality dialogue and character-specific presentation
are separate from the decision algorithms and are not fully restored.

## Runtime license

Pas2js runtime licensing and unmodified corresponding runtime sources are in
`public/licenses/pas2js/`. See its `LICENSE` and `COPYING.txt` for LGPL terms and
the linking exception. Source version:
[release_3_2_0](https://gitlab.com/freepascal.org/fpc/pas2js/-/tree/release_3_2_0).
The compiler is not redistributed. This notice does not assign a new license to
the original game source, artwork, recordings or AI data.

## Validation

The command tests complete multi-round games at weak/strong levels, all three
Differenzler families, both player counts and all prediction visibility modes.
Every AI response passes the game engine's legality checks. Save restoration is
compared through subsequent decisions, not just the restored screen. The core
tests also compare 72 recorded card plays and 18 winners from original archives.
These checks establish playable and repeatable behavior, not exhaustive parity
with the executables. See [playable-game notes](playable-games.md).
