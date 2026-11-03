import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as S from '../src/engine/SWSBase.js';
import * as D from '../src/engine/DiffBase.js';
const fixtures = JSON.parse(await readFile(new URL('./fixtures/legacy-rounds.json', import.meta.url)));
const suit = (value, cards) => ({ fValue: value, fCards: new Set(cards) });
const hand = cards => S.CardSetToHand(new Set(cards));

// Replays use actual translated PlayCard/FinishRound state transitions.
for (const fixture of fixtures) test(`${fixture.game}: replay archive through translated lifecycle`, () => {
  const E = fixture.game === 'schieber' ? S : D, source = fixture.round;
  const rules = { ...E.DefaultRules(), fRoundLimit: 1 };
  const state = E.SetupJassState(rules, source.fTricks[0].fLeading);
  const hands = Array.from({ length: 5 }, (_, p) => E.CardSetToHand(new Set(source.fTricks.slice(0, 9).map(t => t.fPlayed[p]))));
  if (E === S) {
    state.fHands = structuredClone(hands); S.PrepareRound(state, source.fTrump, source.fTrumpedBy);
    for (let p = 1; p <= 4; p++) S.CallSuit(state, p, { fCount: source.fSuits[p].fCount,
      fCalls: source.fSuits[p].fCalls.map(s => suit(s.fValue, s.fCards)) });
  } else {
    D.PrepareRound(state, hands, source.fDrawn);
    for (let i = 0; i < 4; i++) {
      const p = D.GetCurrentPlayer(state); state.fRounds[0].fCall[p] = source.fCall[p];
    }
  }
  for (let i = 0; i < 9; i++) {
    for (let turn = 0; turn < 4; turn++) {
      const p = E.GetCurrentPlayer(state), card = source.fTricks[i].fPlayed[p];
      assert.ok(E.LegalHand(source.fTrump, E.GetCurrentTrick(state), state.fHands[p]).includes(card));
      E.PlayCard(state, card);
    }
    assert.equal(state.fRounds[0].fTricks[i + 1].fLeading, source.fTricks[i + 1].fLeading);
  }
  assert.ok(E.RoundFinished(state)); assert.equal(state.fHands.flat().filter(Boolean).length, 0);
  const result = E.FinishRound(state);
  assert.equal(state.fRoundTotal, 1); assert.equal(state.fRound, 1);
  if (E === D) {
    assert.deepEqual(result.made.slice(1), source.fMade.slice(1));
    assert.deepEqual(state.fTotal.slice(1), [12, 15, 7, 9]); assert.ok(result.signalWinner);
    assert.deepEqual(state.fFinal, [0, 3, 4, 1, 2]);
  } else {
    assert.equal(result.pts[1] + result.pts[2], 354);
    assert.deepEqual(state.fPoints, result.pts);
  }
  assert.equal(state.fLeading, S.gNextPlayer[source.fTricks[0].fLeading]);
});

test('Weis finds sequences, four equals, variable increments and crossing policy', () => {
  const rules = S.DefaultRules(), cards = hand([4, 5, 6, 7, 15, 24, 33]);
  const all = S.GetAllSuits(rules, 1, cards);
  assert.equal(all.fCount, 2); assert.deepEqual(all.fCalls.slice(0, 2).map(s => s.fValue), [204, 54]);
  assert.equal(S.ValueOfSuit(1, false, S.GetBestSuit(rules, 1, cards)), 250);
  assert.equal(S.ValueOfSuit(1, false, S.GetBestSuit({ ...rules, fSuitCrossingOn: false }, 1, cards)), 200);
  assert.equal(S.GetBestSuit(rules, 1, hand([1, 2, 3, 4, 5, 6, 7, 8, 9])).fCalls[0].fValue, 309);
  assert.equal(S.GetBestSuit({ ...rules, fSuitsIncrement: 20 }, 1, hand([1, 2, 3, 4, 5, 6])).fCalls[0].fValue, 126);
  const sixes = hand([1, 10, 19, 28]), restricted = { ...rules, fSuitAllFourEqs: false };
  assert.equal(S.GetAllSuits(restricted, S.TopDown, sixes).fCount, 0);
  assert.equal(S.GetAllSuits(restricted, S.BottomUp, sixes).fCalls[0].fValue, 104);
});

test('Weis priority changes with Unenufe and trump, and inserts value copies once', () => {
  const low = suit(23, [1, 2, 3]), high = suit(23, [7, 8, 9]);
  assert.equal(S.GreaterSuit(S.TopDown, high, low), true);
  assert.equal(S.GreaterSuit(S.BottomUp, high, low), false);
  assert.equal(S.GreaterSuit(2, suit(23, [10, 11, 12]), low), true);
  const calls = { fCount: 0, fCalls: [] };
  S.InsertSuit(1, low, calls); S.InsertSuit(1, low, calls);
  assert.equal(calls.fCount, 1); low.fCards.clear(); assert.equal(calls.fCalls[0].fCards.size, 3);
});

test('Schieber first-trick Weis priority excludes the losing partnership', () => {
  const state = S.SetupJassState(S.DefaultRules(), 1); S.PrepareRound(state, 1, 1);
  S.CallSuit(state, 1, { fCount: 1, fCalls: [suit(23, [1, 2, 3])] });
  S.CallSuit(state, 2, { fCount: 1, fCalls: [suit(54, [10, 11, 12, 13])] });
  S.CallSuit(state, 4, { fCount: 1, fCalls: [suit(23, [19, 20, 21])] });
  const round = state.fRounds[0]; round.fTrick = 1;
  assert.ok(S.EvalSuits(state, round)); assert.equal(round.fSuits[1].fCount, 0);
  assert.deepEqual(state.fTmpPts, [0, 0, 140]);
});

test('Weis-first versus trick-first preserves the first team to cross the point limit', () => {
  for (const first of [true, false]) {
    const rules = { ...S.DefaultRules(), fLimit: 15, fCut: 1000, fSuitsComeFirst: first, fTrumpFactor: [0, 1, 1, 1, 1, 1, 1] };
    const state = S.SetupJassState(rules, 1); S.PrepareRound(state, 5, 1);
    S.CallSuit(state, 1, { fCount: 1, fCalls: [suit(23, [19, 20, 21])] });
    const cards = [1, 9, 2, 3]; state.fHands = [hand([]), ...cards.map(c => hand([c]))];
    let signals;
    for (const card of cards) signals = S.PlayCard(state, card);
    assert.equal(state.fWinner, first ? 1 : 2); assert.ok(signals.signalWinner);
    assert.deepEqual(state.fTmpPts, [0, 20, 19]);
  }
});

test('Schieber Stöck is declared on the second card, and included Weis adds it only once', () => {
  const state = S.SetupJassState(S.DefaultRules(), 1); S.PrepareRound(state, 1, 1);
  state.fHands[1] = hand([7, 8]);
  let round = state.fRounds[0];
  round.fTrick = 1; round.fTricks[0] = { fLeading: 1, fPlayed: [0, 7, 0, 0, 0] };
  round.fTricks[1].fLeading = 1;
  const signals = S.PlayCard(state, 8);
  assert.ok(signals.signalStockings); assert.equal(round.fSuits[1].fCalls[0].fValue, 20);
  const other = S.SetupJassState(S.DefaultRules(), 1); S.PrepareRound(other, 1, 1);
  const declared = { fCount: 1, fCalls: [suit(23, [7, 8, 9])] };
  S.CallSuit(other, 1, declared); round = other.fRounds[0];
  assert.equal(round.fSuits[1].fCount, 2); assert.equal(declared.fCount, 1);
  assert.equal(S.ValueOfSuit(1, false, round.fSuits[1]), 40);
});

test('Differenzler predictions progress in seating order before card play and do not mutate dealt hands', () => {
  for (const players of [3, 4]) {
    const rules = { ...D.DefaultRules(), fNuPlayers: players }, random = new D.RandomStreams();
    const hands = D.DealCards(rules, random), state = D.SetupJassState(rules, 2);
    const before = structuredClone(hands); D.PrepareRound(state, hands, 0, random);
    const round = state.fRounds[0]; assert.ok(hands[1].includes(round.fDrawn));
    let p = 2;
    for (let i = 0; i < players; i++) { assert.equal(D.GetCurrentPlayer(state), p); round.fCall[p] = 0; p = state.fNextPlayer[p]; }
    assert.equal(D.GetCurrentPlayer(state), 2);
    const card = state.fHands[2].find(Boolean); D.PlayCard(state, card);
    assert.equal(D.GetCurrentPlayer(state), 3); assert.deepEqual(hands, before);
    const trick = D.GetCurrentTrick(state); trick.fPlayed[2] = 0; assert.equal(round.fTricks[0].fPlayed[2], card);
  }
});

test('Differenzler recognizes the player who completed Stöck across a trick boundary', () => {
  const state = D.SetupJassState(D.DefaultRules(), 1);
  D.PrepareRound(state, Array.from({ length: 5 }, () => Array(12).fill(0)), 1);
  const r = state.fRounds[0]; r.fTrick = 2;
  r.fTricks[0] = { fLeading: 1, fPlayed: [0, 0, 0, 0, 7] };
  r.fTricks[1] = { fLeading: 1, fPlayed: [0, 0, 0, 0, 8] };
  r.fTricks[2].fLeading = 2;
  assert.deepEqual(D.NeedStockings(state), { needed: true, fromPlayer: 4 });
  D.PlayStockings(state, 4, D.kStockingsSub);
  assert.deepEqual(D.NeedStockings(state), { needed: false, fromPlayer: 0 });
});

test('complete scripted matches exercise round transitions, cumulative totals and rank mode', () => {
  for (const E of [S, D]) for (const players of E === S ? [4] : [3, 4]) for (const ranks of [false, true]) {
    const rules = { ...E.DefaultRules(), fPointPlay: false, fRoundLimit: 3, fNuPlayers: players,
      fSumUpRanks: ranks, fSuitsEnabled: false, fStockings: 0, fMatchBonus: 0, fTrumpFactor: [0, 1, 1, 1, 1, 1, 1] };
    const state = E.SetupJassState(rules, 1), random = new E.RandomStreams();
    while (!E.MatchFinished(state)) {
      const hands = E === S ? S.DealCards(random) : D.DealCards(rules, random);
      if (E === S) { state.fHands = hands; S.PrepareRound(state, 1, state.fLeading); }
      else { D.PrepareRound(state, hands, 1); for (let p = 1; p <= players; p++) state.fRounds[state.fRound].fCall[p] = 0; }
      let plays = 0;
      while (!E.RoundFinished(state)) {
        const p = E.GetCurrentPlayer(state), card = E.LegalHand(E.GetCurrentTrump(state), E.GetCurrentTrick(state), state.fHands[p]).find(Boolean);
        assert.ok(card); E.PlayCard(state, card); assert.ok(++plays <= 36);
      }
      assert.equal(plays, 36); E.FinishRound(state);
    }
    assert.equal(state.fRoundTotal, 3);
    assert.equal((E === S ? state.fPoints : state.fTotal).reduce((a, b) => a + b), 471);
    if (E === D) assert.ok(state.fFinal.slice(1, players + 1).includes(1));
  }
});

test('history rollover retains accumulated totals while reset preserves settings and hands', () => {
  for (const E of [S, D]) {
    const state = E.SetupJassState(E.DefaultRules(), 3);
    state.fRound = 47; state.fRoundTotal = 47;
    const points = E === S ? state.fPoints : state.fTotal; points[1] = 100;
    if (E === S) S.PrepareRound(state, 1, 3);
    else D.PrepareRound(state, state.fHands, 1);
    assert.equal(state.fRound, 0); assert.equal(state.fRoundTotal, 47); assert.equal(points[1], 100);
    const rules = structuredClone(state.fRules); state.fHands[1][0] = 36;
    E.ResetJassState(state); assert.equal(state.fRoundTotal, 0); assert.equal(state.fLeading, 1);
    assert.deepEqual(state.fRules, rules); assert.equal(state.fHands[1][0], 36);
    assert.equal((E === S ? state.fPoints : state.fTotal)[1], 0);
  }
});

test('Differenzler rank-sum mode differs from cumulative point differences', () => {
  const source = fixtures.find(f => f.game === 'differ').round;
  for (const rankMode of [false, true]) {
    const state = D.SetupJassState({ ...D.DefaultRules(), fRoundLimit: 2, fSumUpRanks: rankMode }, 3);
    for (const differences of [[0, 1, 2, 3], [100, 1, 2, 3]]) {
      const r = structuredClone(source);
      r.fCall = [D.NoCall, ...r.fMade.slice(1).map((value, i) => value + differences[i])];
      state.fRounds[state.fRound] = r; D.FinishRound(state);
    }
    assert.deepEqual(state.fTotal.slice(1), [100, 2, 4, 6]);
    assert.deepEqual(state.fFinal.slice(1), rankMode ? [2, 1, 2, 4] : [4, 1, 2, 3]);
  }
});

test('Schieber last-trick/match bonuses can trigger finish-time cut and win signals', () => {
  const state = S.SetupJassState({ ...S.DefaultRules(), fCut: 400, fLimit: 500 }, 1);
  S.PrepareRound(state, 1, 1);
  const r = state.fRounds[0]; r.fTrick = 9;
  for (let i = 0; i < 9; i++) r.fTricks[i] = { fLeading: 1, fPlayed: [0, 4 * i + 1, 4 * i + 2, 4 * i + 3, 4 * i + 4] };
  r.fTricks[9].fLeading = 1;
  const result = S.FinishRound(state);
  assert.deepEqual(result, { pts: [0, 514, 0], matchBy: 1, signalBPrice: true, signalWinner: true });
  assert.ok(S.MatchFinished(state)); assert.equal(state.fWinner, 1); assert.equal(state.fBPrice, 1);
  assert.equal(S.CheckLimit(500, 500, 500), 0);
});

test('Schieber source early-Stöck path can cross a limit after the second trick', () => {
  const rules = { ...S.DefaultRules(), fLimit: 20, fCut: 1000, fTrumpFactor: [0, 1, 1, 1, 1, 1, 1] };
  const state = S.SetupJassState(rules, 1); S.PrepareRound(state, 1, 1);
  const r = state.fRounds[0]; r.fTrick = 1;
  r.fTricks[0] = { fLeading: 1, fPlayed: [0, 7, 10, 19, 28] };
  r.fTricks[1] = { fLeading: 1, fPlayed: [0, 1, 11, 20, 0] };
  state.fHands[1] = hand([8]); state.fHands[4] = hand([29]);
  const result = S.PlayCard(state, 29);
  assert.ok(result.signalStockings); assert.ok(result.signalWinner); assert.equal(state.fWinner, 1);
  assert.deepEqual([...r.fSuits[1].fCalls[0].fCards], [7, 8]);
});
