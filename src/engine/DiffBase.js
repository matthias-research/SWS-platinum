// Direct translation of original/Differ/diffbase.pas; see docs/m5-core.md.
import * as B from './base.js';
export * from './base.js';
export const kHandHigh = 11, kTricksMax = 12, kTrumpHigh = 4;
export const NoCall = -10000, kHideHide = 0, kHideShow = 1, kShowShow = 2;
export const NoStockings = 0, kStockingsAdd = 1, kStockingsSub = 2;
const { gColourOf, gRankOf, gCardOf, TrumpRank } = B;

export function ValueOfCard(trump, card) {
  switch (gRankOf[card]) {
    case B.Nine: return gColourOf[card] === trump ? 14 : 0;
    case B.Ten: return 10;
    case B.Knave: return gColourOf[card] === trump ? 20 : 2;
    case B.Queen: return 3;
    case B.King: return 4;
    case B.Ace: return 11;
    default: return 0;
  }
}
export function ValueOfTrick(trump, trick) {
  return trick.fPlayed.slice(1, 5).reduce((sum, card) => sum + ValueOfCard(trump, card), 0);
}
export function DeltaOf(call, made, bonus) { return Math.abs(call - made) - bonus; }
export function TableOf(nuPlayers, value) {
  const table = [0, 0, 0, 0, 0];
  for (let p = 1; p <= nuPlayers; p++) {
    table[p] = 1;
    for (let q = 1; q <= nuPlayers; q++) if (q !== p && value[q] < value[p]) table[p]++;
  }
  return table;
}
export function BetterCard(trump, prev, card) {
  if (card === B.NoCard) return false;
  if (prev === B.NoCard) return true;
  if (gColourOf[card] === trump) return gColourOf[prev] !== trump || TrumpRank(gRankOf[card]) > TrumpRank(gRankOf[prev]);
  return gColourOf[card] === gColourOf[prev] && gRankOf[card] > gRankOf[prev];
}
// Keep separate from Schieber: this routine restores the entire hand when void.
export function LegalHand(trump, trick, hand) {
  let legal = [...hand];
  const card = trick.fPlayed[trick.fLeading];
  if (card === B.NoCard) return legal;
  let none = true;
  if (trump === gColourOf[card]) {
    for (let i = 0; i <= kHandHigh; i++) {
      if (gColourOf[legal[i]] === trump) none = none && gCardOf[trump][B.Knave] === legal[i];
      else legal[i] = B.NoCard;
    }
    if (none) legal = [...hand];
  } else {
    let best = card;
    for (let p = 1; p <= 4; p++) if (BetterCard(trump, best, trick.fPlayed[p])) best = trick.fPlayed[p];
    const rank = gColourOf[best] === trump ? TrumpRank(gRankOf[best]) : B.NoRank;
    for (let i = 0; i <= kHandHigh; i++) {
      const colour = gColourOf[legal[i]];
      if (colour === gColourOf[card]) none = false;
      else if (colour !== trump || TrumpRank(gRankOf[legal[i]]) < rank) legal[i] = B.NoCard;
    }
    if (none) legal = [...hand];
  }
  return legal;
}
export function DealCards(rules, random) {
  if (![3, 4].includes(rules.fNuPlayers)) throw new RangeError('Differenzler requires 3 or 4 players');
  return B.DealCards(random, rules.fNuPlayers, kHandHigh);
}
export function CardSetToHand(cards) { return B.CardSetToHand(cards, kHandHigh); }
export function SortHand(hand) { return B.SortHand(hand, kHandHigh); }
export function SetupPrevNext(nuPlayers) {
  const prev = [0, 0, 0, 0, 0], next = [0, 0, 0, 0, 0];
  for (let p = 1; p <= nuPlayers; p++) { prev[p] = p === 1 ? nuPlayers : p - 1; next[p] = p === nuPlayers ? 1 : p + 1; }
  return { prev, next };
}
export function WinnerOfTrick(next, trump, trick) {
  if (trump <= 0 || trump > 4 || trick.fLeading < 1 || trick.fLeading > 4) return 0;
  const played = trick.fPlayed.map(c => c < 0 || c > 36 ? 0 : c);
  let best = trick.fLeading, curr = next[best];
  do {
    if (BetterCard(trump, played[best], played[curr])) best = curr;
    curr = next[curr];
  } while (curr !== trick.fLeading && curr !== B.NoPlayer);
  return best;
}

// DeltaOfRound (835): round is a Pascal VAR parameter and is mutated here too.
// In particular bonuses accumulate on repeated calls, as in the source.
export function DeltaOfRound(state, round) {
  const deltas = [0, 0, 0, 0, 0], counts = [0, 0, 0, 0, 0];
  for (let i = 0; i < round.fTrick; i++) {
    const p = round.fTricks[i + 1].fLeading;
    if (p !== B.NoPlayer) { deltas[p] += ValueOfTrick(round.fTrump, round.fTricks[i]); counts[p]++; }
  }
  if (round.fTrick >= state.fTricksHigh) deltas[round.fTricks[state.fTricksHigh].fLeading] += 5;
  if (round.fStocksFor !== B.NoPlayer) {
    if (round.fStockings === kStockingsAdd) deltas[round.fStocksFor] += 20;
    else if (round.fStockings === kStockingsSub) deltas[round.fStocksFor] -= 20;
  }
  round.fMade = [...deltas]; // Pascal array assignment copies values.
  const total = round.fCall.slice(1, 5).reduce((sum, call) => sum + (call >= 0 ? call : 0), 0);
  for (let p = 1; p <= 4; p++) if (round.fCall[p] >= 0) {
    if (Math.abs(deltas[p] - round.fCall[p]) === 0 && counts[p] > 0 && state.fRules.fDZeroBonus > 0) {
      round.fBonus[p] += state.fRules.fDZeroBonus;
    }
    if (state.fRules.fSCallBonus && state.fRules.fCallMode === kShowShow && p === state.fPrevPlayer[round.fTricks[0].fLeading]) {
      round.fBonus[p] += Math.trunc(Math.abs(total - B.kPointsPerRound) / 5);
    }
    deltas[p] = DeltaOf(round.fCall[p], round.fMade[p], round.fBonus[p]);
  }
  return { deltas, counts };
}
export function DefaultRules() {
  return { fNuPlayers: 4, fRoundLimit: 16, fSumUpRanks: false, fCallMode: kHideHide,
    fSCallBonus: false, fDZeroBonus: 0, fStockings: kStockingsSub };
}
// DiffBase.pas:600–778, 884–1067 — state and round lifecycle.
export const kRoundsHigh = 47;
const emptyTrick = () => ({ fLeading: 0, fPlayed: [0, 0, 0, 0, 0] });
const emptyRound = () => ({ fDrawn: 0, fTrump: 0, fStocksFor: 0, fStockings: 0, fTrick: 0,
  fCall: Array(5).fill(NoCall), fMade: Array(5).fill(NoCall), fBonus: Array(5).fill(0),
  fTricks: Array.from({ length: 13 }, emptyTrick) });
export function InitJassState(rules = DefaultRules()) {
  const { prev, next } = SetupPrevNext(rules.fNuPlayers);
  return { fRules: structuredClone(rules), fTricksHigh: 0, fTotal: Array(5).fill(0), fFinal: Array(5).fill(0),
    fRoundTotal: 0, fRound: 0, fLeading: 0, fRounds: Array.from({ length: 48 }, emptyRound),
    fHands: Array.from({ length: 5 }, () => Array(12).fill(0)), fPrevPlayer: prev, fNextPlayer: next };
}
export function SetupJassState(rules, leads) {
  const state = InitJassState(rules);
  state.fTricksHigh = 36 / rules.fNuPlayers; state.fLeading = leads;
  state.fRounds[0].fTricks[0].fLeading = leads;
  return state;
}
export function ResetJassState(state) {
  state.fTotal.fill(0); state.fFinal.fill(0); state.fRoundTotal = 0; state.fRound = 0; state.fLeading = B.North;
  state.fRounds = Array.from({ length: 48 }, emptyRound);
}
export function GetLeadingPlayer(state) {
  if (state.fRound > kRoundsHigh) return 0;
  const r = state.fRounds[state.fRound];
  return r.fTrick <= state.fTricksHigh ? r.fTricks[r.fTrick].fLeading || state.fLeading : 0;
}
export function GetCurrentPlayer(state) {
  if (state.fRound > kRoundsHigh) return 0;
  const r = state.fRounds[state.fRound];
  if (r.fTrick >= state.fTricksHigh) return r.fTricks[state.fTricksHigh].fLeading;
  let p = GetLeadingPlayer(state); const q = p;
  if (r.fTrick === 0 && r.fTricks[0].fPlayed[p] === 0) {
    do { if (r.fCall[p] !== NoCall) p = state.fNextPlayer[p]; } while (p !== q && r.fCall[p] !== NoCall);
  } else {
    do { if (r.fTricks[r.fTrick].fPlayed[p] !== 0) p = state.fNextPlayer[p]; } while (p !== q && r.fTricks[r.fTrick].fPlayed[p] !== 0);
  }
  return p;
}
export function GetActivePlayers(state) { return new Set([1, 2, 3, 4].filter(p => state.fNextPlayer[p] !== 0)); }
export function GetCurrentTrick(state) {
  if (state.fRound > kRoundsHigh) return emptyTrick();
  const r = state.fRounds[state.fRound];
  return r.fTrick <= state.fTricksHigh ? structuredClone(r.fTricks[r.fTrick]) : emptyTrick();
}
export function GetCurrentTrump(state) {
  if (state.fRound > kRoundsHigh) return 0;
  const r = state.fRounds[state.fRound]; return r.fTrick < state.fTricksHigh ? r.fTrump : 0;
}
export function PrepareRound(state, hands, drawnCard, random) {
  if (state.fRound >= kRoundsHigh) { state.fRounds = Array.from({ length: 48 }, emptyRound); state.fRound = 0; }
  state.fHands = structuredClone(hands);
  const r = state.fRounds[state.fRound];
  r.fCall.fill(NoCall); r.fMade.fill(NoCall); r.fBonus.fill(0); r.fTrick = 0;
  r.fTricks = Array.from({ length: 13 }, emptyTrick); r.fTricks[0].fLeading = state.fLeading;
  r.fDrawn = drawnCard === 0 ? hands[state.fPrevPlayer[state.fLeading]][random.Rnd(random.gDealRnd, true) % state.fTricksHigh] : drawnCard;
  r.fTrump = gColourOf[r.fDrawn];
}
export function FinishRound(state) {
  const r = state.fRounds[state.fRound];
  const { deltas, counts } = DeltaOfRound(state, r);
  const result = { call: [...r.fCall], made: [...r.fMade], bonus: [...r.fBonus], counts, signalWinner: false };
  for (let p = 1; p <= 4; p++) if (state.fNextPlayer[p] !== 0) state.fTotal[p] += deltas[p];
  state.fRoundTotal++; state.fRound++; state.fLeading = state.fNextPlayer[state.fLeading];
  if (state.fRoundTotal >= state.fRules.fRoundLimit) {
    if (state.fRules.fSumUpRanks) {
      const rtotal = Array(5).fill(0);
      // Inclusive upper bound is in the Pascal original; the fresh empty round
      // normally adds a tied rank of one to all active players.
      for (let i = 0; i <= state.fRound; i++) {
        const round = state.fRounds[i], values = Array(5).fill(0);
        for (let p = 1; p <= state.fRules.fNuPlayers; p++) values[p] = DeltaOf(round.fCall[p], round.fMade[p], round.fBonus[p]);
        const table = TableOf(state.fRules.fNuPlayers, values);
        for (let p = 1; p <= state.fRules.fNuPlayers; p++) rtotal[p] += table[p];
      }
      state.fFinal = TableOf(state.fRules.fNuPlayers, rtotal);
    } else state.fFinal = TableOf(state.fRules.fNuPlayers, state.fTotal);
    result.signalWinner = true;
  }
  return result;
}
export function NeedStockings(state) {
  const r = state.fRounds[state.fRound]; let fromPlayer = 0;
  if (r.fTrick > 0 && state.fRules.fStockings !== NoStockings && r.fStocksFor === 0) {
    fromPlayer = GetCurrentPlayer(state);
    fromPlayer = fromPlayer === r.fTricks[r.fTrick].fLeading
      ? state.fPrevPlayer[r.fTricks[r.fTrick - 1].fLeading] : state.fPrevPlayer[fromPlayer];
    let count = 0;
    for (let i = 0; i <= r.fTrick; i++) if ([gCardOf[r.fTrump][B.Queen], gCardOf[r.fTrump][B.King]].includes(r.fTricks[i].fPlayed[fromPlayer])) count++;
    if (count !== 2) fromPlayer = 0;
  }
  return { needed: fromPlayer !== 0, fromPlayer };
}
export function PlayStockings(state, player, stockings) {
  const r = state.fRounds[state.fRound]; r.fStocksFor = player; r.fStockings = stockings;
}
export function RoundFinished(state) { return state.fRound >= kRoundsHigh || state.fRounds[state.fRound].fTrick >= state.fTricksHigh; }
export function MatchFinished(state) { return state.fRoundTotal >= state.fRules.fRoundLimit; }
// DiffBase.pas:1069. Keep the original forfeit calculation, including resetting calls.
export function ForfaitRound(state, player) {
  const r=state.fRounds[state.fRound], indexes=Array(5).fill(0);
  if(r.fTrick===0&&!r.fTricks[0].fLeading) r.fTricks[0].fLeading=player;
  r.fCall.fill(0);
  while(r.fTrick<state.fTricksHigh) {
    const trick=r.fTricks[r.fTrick];
    for(let p=1;p<=state.fRules.fNuPlayers;p++) if(!trick.fPlayed[p]) {
      while(indexes[p]<=11&&!state.fHands[p][indexes[p]]) indexes[p]++;
      if(indexes[p]<=11) {trick.fPlayed[p]=state.fHands[p][indexes[p]];state.fHands[p][indexes[p]]=0;}
    }
    const winner=WinnerOfTrick(state.fNextPlayer,r.fTrump,trick);
    r.fCall[winner]+=ValueOfTrick(r.fTrump,trick);r.fTrick++;
    if(r.fTrick>=state.fTricksHigh) r.fCall[winner]+=5;
    r.fTricks[r.fTrick].fLeading=winner;
  }
  r.fCall[player]+=Math.trunc(157/state.fRules.fNuPlayers);
}
export function PlayCard(state, card) {
  const r = state.fRounds[state.fRound], trick = r.fTricks[r.fTrick];
  let p = trick.fLeading;
  while (trick.fPlayed[p] !== 0 && state.fNextPlayer[p] !== trick.fLeading) p = state.fNextPlayer[p];
  if (trick.fPlayed[p] === 0) trick.fPlayed[p] = card;
  const index = state.fHands[p].indexOf(card); if (index >= 0) state.fHands[p][index] = 0;
  if (state.fNextPlayer[p] === trick.fLeading) {
    const winner = WinnerOfTrick(state.fNextPlayer, r.fTrump, trick);
    r.fTrick++; r.fTricks[r.fTrick].fLeading = winner;
  }
}
