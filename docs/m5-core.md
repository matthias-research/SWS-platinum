# M5 — Direct Pascal core translation

The port follows the supplied Pascal implementations rather than recreating rules
from a general description of Jass. The core remains usable without a UI and is
now connected to both playable browser games through `src/engine/game.js`.

## Translation map

| JavaScript | Original source | Translated routines |
| --- | --- | --- |
| `src/engine/base.js` | Common equivalent portions of `Schieber/SWSBase.pas` and `Differ/diffbase.pas` | Constants; card/player lookup arrays; `TrumpRank`; `HandToCardSet`, `CardSetToHand`, `SortHand`; `NrInTrick`; `NewRnd`, `SetRnd`, `GetRnd`, `Rnd`; shared dealing loop |
| `src/engine/SWSBase.js` | `Schieber/SWSBase.pas:368–820`, defaults at 1714 | `FactorOfTrump`; `ValueOfCard`, `ValueOfSuit`, `ValueOfTrick`, `ValueOfSuits`, `ValueOfRound`; `Stockings`; `BetterCard`, `WinnerOfTrick`, `LegalHand`, `DealCards`; default rules |
| `src/engine/DiffBase.js` | `Differ/diffbase.pas:341–594`, 780–808, 835–881, defaults at 1253 | `ValueOfCard`, `ValueOfTrick`, `DeltaOf`, `TableOf`; `BetterCard`, `WinnerOfTrick`, `LegalHand`, `DealCards`, `SetupPrevNext`, `DeltaOfRound`; default rules |

| `src/engine/SWSBase.js` (lifecycle extension) | `Schieber/SWSBase.pas:828–1492` | `GreaterSuit`, `BetterSuit`, `InsertSuit`, `GetAllSuits`, `GetBestSuit`; state initialization/setup/reset and current-state getters; `CheckLimit`, `EvalSuits`, `PrepareRound`, `FinishRound`, `RoundFinished`, `MatchFinished`, `CallSuit`, `PlayCard` |
| `src/engine/DiffBase.js` (lifecycle extension) | `Differ/diffbase.pas:600–778`, 884–1067 | State initialization/setup/reset and current-state getters; `GetActivePlayers`, `PrepareRound`, `FinishRound`, `NeedStockings`, `PlayStockings`, `RoundFinished`, `MatchFinished`, `PlayCard` |

Line intervals identify source locations, not complete translated ranges. Methods
not listed here have not been ported. Original files remain unchanged.

## Conventions

- Preserve Pascal names and numeric IDs. Cards are 1–36; zero is `NoCard`.
  Players remain North=1, West=2, South=3, East=4; arrays include sentinel index 0.
  Internal English suit names are preserved without assuming that their words
  match every card set's displayed suit labels.
- Preserve fixed hand slots: nine for Schieber and twelve for Differenzler,
  including trailing zeros in a four-player Differenzler hand.
- JavaScript arrays/objects model Pascal arrays/records; `Set` models card sets.
  Explicit copies preserve Pascal value-copy semantics where appropriate.
- Pure routines return Pascal `VAR` outputs. Multiple outputs are named fields:
  e.g. `ValueOfRound` returns `{ pts, match }` and `SetupPrevNext` returns
  `{ prev, next }`. `DeltaOfRound` retains its original mutation of the round's
  `fMade` and `fBonus`, and returns `{ deltas, counts }`.
- A `RandomStreams` instance owns the original random-stream table instead of
  module-global state. Each game can have an independent instance. It retains
  the original Schrage/Park–Miller calculation **and** the signed 16-bit result
  reduction, absolute-value option, zero/negative-seed behavior and stream limit.
  Dealing chooses the nth remaining card in the original slot/player loop order.
- `Math.trunc` implements Pascal `DIV`. `BetterCard`'s Pascal parameter `this`
  becomes `card`, since `this` is a JavaScript keyword. Equivalent calculations
  currently use function calls instead of the initialized Pascal lookup tables.
- Preserve differences: Schieber's `LegalHand` has its own undertrumping and
  only-trumps branches. Differenzler restores the entire hand when void in the
  led suit. These are separate translations, not a unified rules approximation.
- Invalid enum inputs that formerly only logged to the Delphi shell return safe
  sentinel values where specified by the original. Public game commands still
  need boundary validation; these low-level routines expect typed, valid records.
  Additional JavaScript checks reject non-LongInt seeds and player counts other
  than three/four in Differenzler dealing.

An original quirk is intentionally retained: `DeltaOfRound` adds to `fBonus` on
each invocation. Callers must follow the original lifecycle; repeatedly calling
it as a UI render-time selector would add bonuses repeatedly. This is documented,
not silently corrected during translation.

## Verification

```sh
npm run engine:test
```

The tests use committed compact fixtures, so the original archive is not needed
to run them. To regenerate those fixtures with the archive present:

```sh
npm run engine:fixtures
```

`tests-node/fixtures/legacy-rounds.json` preserves the first completed round from
`Schieber/GRUMPY.JAR` and `Differ/TEST.JAR`, including source hashes, line numbers
and exact excerpts. These are the archives opened in the M1 native scenarios.
Their trick rows store cards in play-circle order starting at the listed leader,
as defined by `SWSFile`/`DIFFFILE`, rather than fixed player-column order.
The preparation script is deliberately a fixture extractor, not a general saved
game importer.

The 27 tests cover:

- All 72 archived plays are legal with the reconstructed original hands; all
  18 computed winners match the next leaders recorded in the archives.
- Differenzler's recorded made values `[12, 50, 14, 81]` and bonuses reproduce
  differences `[12, 15, 7, 9]`. Schieber's supplied Weis value, trump factors and
  round-point total are checked separately.
- Full card-point totals, trump ordering, Obenabe/Unenufe, trump-jack exemption,
  undertrumping differences, fixed slots and three-player turn circles.
- Known random sequence values, seed progression, complete sorted deals, inactive
  player slots, zero/negative seeds and stream exhaustion.
- Tied ranks, exact-prediction bonus eligibility, last-caller bonus and Stöck
  adjustments in Differenzler scoring.
- Scripted legal play consumes all 36 cards and totals 157 points for all six
  Schieber trumps and all four Differenzler trumps with three/four players.
  The first-legal test driver is not an AI implementation.

These checks establish source/fixture agreement for the translated subset.
There was no new native execution in this increment, and seeded deals have not
yet been compared with an executable run. M1's archive displays do not prove that
every reference-build routine matches the supplied source. No full game/match
or AI parity is claimed.

## Lifecycle verification and compatibility notes

The additional lifecycle tests replay both archived rounds through `PlayCard` and
`FinishRound`, checking turn progression, hand consumption, recorded winners,
scoring and next-round leadership. Scripted three-round matches finish for
Schieber and for three-/four-player Differenzler. Separate cases distinguish
rank-sum scoring from cumulative differences, check tied rankings, match/last-trick
bonuses, reset, and the original round-history rollover threshold.

Weis tests cover four equals, sequences, configurable increments, crossing versus
non-crossing selection, trump/Unenufe priority, duplicate suppression and losing
partnership exclusion. Point-limit tests preserve the distinction between
Weis-first and trick-first scoring. Stöck tests cover a second-card declaration,
inclusion within a declared sequence, the early point-limit path in Schieber,
and Differenzler's player detection across a trick boundary.

State factories return newly allocated records, and mutating lifecycle procedures
retain Pascal field names. Inputs assigned by value in Pascal are explicitly
cloned. Unit-global rules are supplied as arguments. In Differenzler,
`PrepareRound` takes the random-stream context as a final argument when it needs
to draw a trump card. `NeedStockings` returns `{ needed, fromPlayer }`.

Deliberate browser initialization adaptations: new/reset history records clear
all unused fields rather than retaining uninitialized or stale Pascal memory;
Schieber's completed `GetCurrentTrick` returns a fully empty record. An
out-of-history `GetCurrentTrump` returns zero instead of leaving a caller's old
VAR output unchanged. Normal active-round behavior is preserved.

The source's Weis tie-comparison argument order is retained. Differenzler's
rank-sum loop retains its inclusive upper bound, which normally includes the
next empty round and adds one equally to all active players. Its existing bonus
accumulation behavior is unchanged. These details should be checked against the
reference executables before making compatibility fixes.

`PlayCard` is the original low-level mutating routine: its Pascal caller validates
turns and legality first. It must not be exposed directly as an unvalidated UI or
network command. The tests validate legal moves before calling it in complete
round replays; isolated scoring fixtures intentionally exercise internal states.

## Command integration

`src/engine/game.js` adapts the `SWSPlay`/`DiffPlay` manager flow: trump selection,
shifting, Weis offers and reveal timing, prediction visibility, turn validation,
computer requests, trick pauses and round transitions. Both `ForfaitRound`
routines are translated (Schieber source around line 1491; Differenzler 1069).
Command journals support deterministic save/restore, including AI private state.
Invalid commands are rejected before the low-level card mutation.

Complete games and browser interaction are tested; exhaustive executable parity,
including all rule variants and native seeded decisions, remains unverified.
See [AI translation](ai-port.md) and [playable-game validation](playable-games.md).
