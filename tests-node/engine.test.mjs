import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as S from '../src/engine/SWSBase.js';
import * as D from '../src/engine/DiffBase.js';
const fixtures = JSON.parse(await readFile(new URL('./fixtures/legacy-rounds.json', import.meta.url)));
const hand = (engine, cards) => engine.CardSetToHand(new Set(cards));
const live = cards => cards.filter(Boolean);

test('Pascal card/player numbering and fixed hand slots are retained', () => {
  for (let colour = 1; colour <= 4; colour++) for (let rank = 1; rank <= 9; rank++) {
    const card = S.gCardOf[colour][rank];
    assert.equal(S.gColourOf[card], colour); assert.equal(S.gRankOf[card], rank);
  }
  assert.equal(S.gCardOf[0][9], 0);
  assert.deepEqual(S.SortHand([36, 1, 1, 0, 9, 0, 0, 0, 0]), [1, 9, 36, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(D.SetupPrevNext(3), { prev: [0, 3, 1, 2, 0], next: [0, 2, 3, 1, 0] });
});

test('all trump modes total 152 card points plus five for the last trick', () => {
  for (let trump = 1; trump <= 6; trump++) {
    assert.equal(Array.from({ length: 36 }, (_, i) => S.ValueOfCard(trump, i + 1)).reduce((a, b) => a + b), 152);
    if (trump <= 4) for (let card = 0; card <= 36; card++) assert.equal(D.ValueOfCard(trump, card), S.ValueOfCard(trump, card));
  }
  assert.equal(S.ValueOfCard(1, 6), 20); assert.equal(S.ValueOfCard(1, 4), 14);
  assert.equal(S.ValueOfCard(5, 3), 8); assert.equal(S.ValueOfCard(6, 1), 11);
  assert.equal(S.ValueOfCard(6, 9), 0);
});

test('trump strength, lead-suit restriction, Obenabe and Unenufe', () => {
  const weakToStrong = [1, 2, 3, 5, 7, 8, 9, 4, 6];
  for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) {
    assert.equal(S.BetterCard(1, weakToStrong[i], weakToStrong[j]), j > i);
    assert.equal(D.BetterCard(1, weakToStrong[i], weakToStrong[j]), j > i);
  }
  assert.equal(S.BetterCard(1, 18, 1), true);
  assert.equal(S.BetterCard(1, 10, 36), false);
  assert.equal(S.WinnerOfTrick(5, { fLeading: 3, fPlayed: [0, 9, 36, 1, 18] }), 1);
  assert.equal(S.WinnerOfTrick(6, { fLeading: 3, fPlayed: [0, 9, 36, 1, 18] }), 3);
  assert.equal(D.WinnerOfTrick(D.SetupPrevNext(3).next, 1, { fLeading: 3, fPlayed: [0, 4, 6, 9, 0] }), 2);
});

test('trump-jack exception applies only when the jack is the only trump held', () => {
  for (const E of [S, D]) {
    const trick = { fLeading: 1, fPlayed: [0, 1, 0, 0, 0] };
    assert.deepEqual(live(E.LegalHand(1, trick, hand(E, [6, 19]))), [6, 19]);
    assert.deepEqual(live(E.LegalHand(1, trick, hand(E, [6, 9, 19]))), [6, 9]);
  }
});

test('the two Pascal LegalHand routines intentionally differ when void', () => {
  const trick = { fLeading: 1, fPlayed: [0, 10, 9, 0, 0] };
  assert.deepEqual(live(S.LegalHand(1, trick, hand(S, [1, 6, 19]))), [6, 19]);
  assert.deepEqual(live(D.LegalHand(1, trick, hand(D, [1, 6, 19]))), [1, 6, 19]);
  for (const E of [S, D]) {
    assert.deepEqual(live(E.LegalHand(1, trick, hand(E, [1, 6, 11, 19]))), [6, 11]);
  }
  assert.deepEqual(live(S.LegalHand(1, trick, hand(S, [1, 2, 6]))), [1, 2, 6]);
});

test('legacy random output retains its signed 16-bit reduction, not just its LCG', () => {
  const random = new S.RandomStreams(), id = random.gDealRnd;
  const seeds = [16807, 282475249, 1622650073, 984943658, 1144108930];
  const values = [-32767, -24148, 16751, -2710, 2147];
  for (let i = 0; i < seeds.length; i++) { assert.equal(random.Rnd(id, false), values[i]); assert.equal(random.GetRnd(id), seeds[i]); }
  random.SetRnd(id, 1); assert.equal(random.Rnd(id, true), 32767);
  random.SetRnd(id, 0); assert.equal(random.Rnd(id, false), 32767); assert.equal(random.GetRnd(id), 2147483647);
  random.SetRnd(id, -1); assert.equal(random.Rnd(id, false), 32767); assert.equal(random.GetRnd(id), 2147466840);
  assert.equal(random.Rnd(0, true), 0);
  for (let i = 2; i <= 10; i++) assert.equal(random.NewRnd(`stream ${i}`), i);
  assert.equal(random.NewRnd('full'), 0);
  assert.throws(() => random.SetRnd(id, 2 ** 31), RangeError);
});

test('deals preserve seed progression, distribution, sorting and inactive slots', () => {
  const sRandom = new S.RandomStreams(), dRandom = new D.RandomStreams();
  const schieber = S.DealCards(sRandom);
  const differ = D.DealCards(D.DefaultRules(), dRandom);
  for (let p = 1; p <= 4; p++) assert.deepEqual(differ[p], [...schieber[p], 0, 0, 0]);
  assert.equal(sRandom.GetRnd(1), dRandom.GetRnd(1));
  assert.equal(sRandom.GetRnd(1), 704877633); // 36th Park–Miller step from seed 1.
  assert.deepEqual(live(schieber.flat()).sort((a, b) => a - b), Array.from({ length: 36 }, (_, i) => i + 1));
  const three = D.DealCards({ ...D.DefaultRules(), fNuPlayers: 3 }, new D.RandomStreams());
  assert.deepEqual(three[4], Array(12).fill(0));
  assert.equal(new Set(three.slice(1, 4).flat()).size, 36);
});

for (const fixture of fixtures) test(`${fixture.game}: archived plays are legal and every recorded trick winner matches`, () => {
  const E = fixture.game === 'schieber' ? S : D, round = fixture.round;
  const hands = Array.from({ length: 5 }, (_, p) => hand(E, round.fTricks.slice(0, 9).map(t => t.fPlayed[p])));
  assert.equal(new Set(hands.slice(1).flat().filter(Boolean)).size, 36);
  for (let i = 0; i < 9; i++) {
    const recorded = round.fTricks[i], trick = { fLeading: recorded.fLeading, fPlayed: [0, 0, 0, 0, 0] };
    let p = trick.fLeading;
    for (let turn = 0; turn < 4; turn++) {
      const card = recorded.fPlayed[p];
      assert.ok(E.LegalHand(round.fTrump, trick, hands[p]).includes(card), `trick ${i}, player ${p}, card ${card}`);
      trick.fPlayed[p] = card;
      hands[p][hands[p].indexOf(card)] = 0;
      p = S.gNextPlayer[p];
    }
    const winner = E === S ? S.WinnerOfTrick(round.fTrump, trick) : D.WinnerOfTrick(S.gNextPlayer, round.fTrump, trick);
    assert.equal(winner, round.fTricks[i + 1].fLeading, `trick ${i}`);
  }
  assert.equal(hands.slice(1).flat().filter(Boolean).length, 0);
});

test('Differenzler archived made/bonus/difference values agree with the translated scorer', () => {
  const round = structuredClone(fixtures.find(f => f.game === 'differ').round);
  const expectedMade = [...round.fMade], expectedBonus = [...round.fBonus];
  const state = { fRules: D.DefaultRules(), fTricksHigh: 9, fPrevPlayer: S.gPrevPlayer };
  const { deltas, counts } = D.DeltaOfRound(state, round);
  assert.deepEqual(round.fMade.slice(1), expectedMade.slice(1));
  assert.deepEqual(round.fBonus, expectedBonus);
  assert.deepEqual(deltas.slice(1), [12, 15, 7, 9]);
  assert.equal(counts.reduce((a, b) => a + b), 9);
  assert.deepEqual(D.TableOf(4, deltas), [0, 3, 4, 1, 2]);
});

test('Schieber scores declared Weis, last trick and trump factors from the archived round', () => {
  const round = fixtures.find(f => f.game === 'schieber').round;
  const { pts, match } = S.ValueOfRound(S.DefaultRules(), round);
  assert.equal(match, 0);
  assert.equal(pts[1] + pts[2], 157 * 2 + 20 * 2);
  assert.deepEqual(S.ValueOfSuits(S.DefaultRules(), round), [0, 40, 0]);
});

test('Differenzler scoring retains ties, exact-call eligibility, last-caller bonus and Stöck', () => {
  assert.deepEqual(D.TableOf(4, [0, 5, 5, 8, 10]), [0, 1, 1, 3, 4]);
  const state = { fRules: { ...D.DefaultRules(), fDZeroBonus: 10, fSCallBonus: true, fCallMode: D.kShowShow },
    fTricksHigh: 9, fPrevPlayer: S.gPrevPlayer };
  const round = structuredClone(fixtures.find(f => f.game === 'differ').round);
  round.fCall = [D.NoCall, 12, 50, 14, 81];
  D.DeltaOfRound(state, round);
  assert.deepEqual(round.fBonus, [0, 10, 10, 10, 10]);
  const empty = { ...structuredClone(round), fTrick: 0, fBonus: [0, 0, 0, 0, 0], fCall: [D.NoCall, 0, 0, 0, 0] };
  D.DeltaOfRound(state, empty);
  // Zero without a trick earns no exact bonus; only the last caller gets floor(157/5).
  assert.deepEqual(empty.fBonus, [0, 0, 31, 0, 0]);
  for (const [mode, change] of [[D.kStockingsAdd, 20], [D.kStockingsSub, -20]]) {
    const r = structuredClone(fixtures.find(f => f.game === 'differ').round);
    r.fStocksFor = 1; r.fStockings = mode;
    D.DeltaOfRound({ ...state, fRules: D.DefaultRules() }, r);
    assert.equal(r.fMade[1], 12 + change);
  }
});

test('scripted legal play consumes 36 cards for every trump and both player counts', () => {
  // First-legal policy is a test driver only, never a replacement for the original AI.
  for (const E of [S, D]) for (const players of E === S ? [4] : [3, 4]) for (let trump = 1; trump <= E.kTrumpHigh; trump++) {
    const random = new E.RandomStreams(); random.SetRnd(1, 938 + trump);
    const hands = E === S ? E.DealCards(random) : E.DealCards({ ...E.DefaultRules(), fNuPlayers: players }, random);
    const { next } = D.SetupPrevNext(players);
    let leader = players, total = 5;
    for (let i = 0; i < 36 / players; i++) {
      const trick = { fLeading: leader, fPlayed: [0, 0, 0, 0, 0] };
      let p = leader;
      for (let turn = 0; turn < players; turn++) {
        const card = E.LegalHand(trump, trick, hands[p]).find(Boolean);
        assert.ok(card); trick.fPlayed[p] = card; hands[p][hands[p].indexOf(card)] = 0; p = next[p];
      }
      leader = E === S ? E.WinnerOfTrick(trump, trick) : E.WinnerOfTrick(next, trump, trick);
      assert.ok(leader >= 1 && leader <= players);
      total += E.ValueOfTrick(trump, trick);
    }
    assert.equal(total, 157); assert.equal(hands.flat().filter(Boolean).length, 0);
  }
});
