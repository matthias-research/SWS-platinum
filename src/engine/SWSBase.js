// Direct translation of original/Schieber/SWSBase.pas; see docs/m5-core.md.
import * as B from './base.js';
export * from './base.js';
export const kHandHigh = 8, kTricksHigh = 9, kTrumpHigh = 6;
const { gColourOf, gRankOf, gCardOf, gTeamOf, gNextPlayer, TrumpRank } = B;

// ValueOfCard (380).
export function ValueOfCard(trump, card) {
  switch (gRankOf[card]) {
    case B.Six: return trump === B.BottomUp ? 11 : 0;
    case B.Seven: return 0;
    case B.Eight: return trump === B.TopDown || trump === B.BottomUp ? 8 : 0;
    case B.Nine: return trump === gColourOf[card] ? 14 : 0;
    case B.Ten: return 10;
    case B.Knave: return trump === gColourOf[card] ? 20 : 2;
    case B.Queen: return 3;
    case B.King: return 4;
    case B.Ace: return trump === B.BottomUp ? 0 : 11;
    default: return 0;
  }
}
export function ValueOfSuit(trump, firstOnly, suit) {
  let value = 0;
  const count = firstOnly ? Math.min(1, suit.fCount) : suit.fCount;
  for (let i = 0; i < count; i++) value += Math.trunc(suit.fCalls[i].fValue / 10) * 10;
  return value;
}
export function ValueOfTrick(trump, trick) {
  if (trump <= 0 || trump > B.BottomUp) return 0;
  return trick.fPlayed.slice(1, 5).reduce((sum, card) => sum + ValueOfCard(trump, card), 0);
}
export function FactorOfTrump(rules, trump) { return trump > 0 && trump <= B.BottomUp ? rules.fTrumpFactor[trump] : 0; }
export function ValueOfSuits(rules, round) {
  const pts = [0, 0, 0];
  if (round.fTrick > 0) for (let p = 1; p <= 4; p++) {
    pts[gTeamOf[p]] += ValueOfSuit(round.fTrump, false, round.fSuits[p]);
  }
  return pts.map(value => value * FactorOfTrump(rules, round.fTrump));
}
// VAR outputs are returned together, leaving the input record unchanged.
export function ValueOfRound(rules, round) {
  const suits = ValueOfSuits(rules, round), pts = [0, 0, 0], won = [0, 0, 0];
  let match = B.NoTeam;
  for (let i = 0; i < round.fTrick; i++) {
    const team = gTeamOf[round.fTricks[i + 1].fLeading];
    pts[team] += ValueOfTrick(round.fTrump, round.fTricks[i]); won[team]++;
  }
  if (round.fTrick >= kTricksHigh) {
    pts[gTeamOf[round.fTricks[kTricksHigh].fLeading]] += 5;
    if (won[B.TeamNS] === 0) match = B.TeamWE;
    else if (won[B.TeamWE] === 0) match = B.TeamNS;
    if (match) pts[match] += rules.fMatchBonus;
  }
  for (const team of [B.TeamNS, B.TeamWE]) pts[team] = suits[team] + pts[team] * FactorOfTrump(rules, round.fTrump);
  return { pts, match };
}
export function Stockings(rules, trump) {
  return rules.fSuitsEnabled && trump >= 1 && trump <= 4
    ? new Set([gCardOf[trump][B.Queen], gCardOf[trump][B.King]]) : new Set();
}
// Pascal parameter `this` is named `card` because `this` is reserved in JS.
export function BetterCard(trump, prev, card) {
  if (card === B.NoCard) return false;
  if (prev === B.NoCard) return true;
  if (trump >= 1 && trump <= 4) {
    if (gColourOf[card] === trump) return gColourOf[prev] !== trump || TrumpRank(gRankOf[card]) > TrumpRank(gRankOf[prev]);
    return gColourOf[card] === gColourOf[prev] && gRankOf[card] > gRankOf[prev];
  }
  if (trump === B.TopDown) return gColourOf[card] === gColourOf[prev] && gRankOf[card] > gRankOf[prev];
  if (trump === B.BottomUp) return gColourOf[card] === gColourOf[prev] && gRankOf[card] < gRankOf[prev];
  return false;
}
export function WinnerOfTrick(trump, trick) {
  if (trump <= 0 || trump > B.BottomUp || trick.fLeading < 1 || trick.fLeading > 4) return 0;
  const played = trick.fPlayed.map(c => c < 0 || c > 36 ? 0 : c);
  let best = trick.fLeading, curr = gNextPlayer[best];
  do {
    if (BetterCard(trump, played[best], played[curr])) best = curr;
    curr = gNextPlayer[curr];
  } while (curr !== trick.fLeading);
  return best;
}

// LegalHand (680–766). Preserve slots/NoCard and Schieber's onlyTrumps branch.
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
    let noTrumps = true, onlyTrumps = true;
    for (let i = 0; i <= kHandHigh; i++) {
      const colour = gColourOf[legal[i]];
      onlyTrumps = onlyTrumps && (colour === B.NoColour || colour === trump);
      if (colour === gColourOf[card]) none = false;
      else if (colour !== trump || TrumpRank(gRankOf[legal[i]]) < rank) legal[i] = B.NoCard;
      else if (legal[i] !== gCardOf[trump][B.Knave]) noTrumps = false;
    }
    if (onlyTrumps) legal = [...hand];
    else if (none) {
      for (let i = 0; i <= kHandHigh; i++) if (hand[i] !== B.NoCard && gColourOf[hand[i]] !== trump) {
        legal[i] = hand[i]; none = false;
      }
      if (none && noTrumps) legal = [...hand];
    }
  }
  return legal;
}
export function DealCards(random) { return B.DealCards(random, 4, kHandHigh); }
export function CardSetToHand(cards) { return B.CardSetToHand(cards, kHandHigh); }
export function SortHand(hand) { return B.SortHand(hand, kHandHigh); }
export function DefaultRules() {
  return { fPointPlay: true, fLimit: 2500, fCut: 1250, fRoundLimit: 12, fLooserBegins: true,
    fSuitsEnabled: true, fSuitAllFourEqs: true, fSuitCrossingOn: true, fSuitsComeFirst: true,
    fSuitsIncrement: 50, fMatchBonus: 100, fTrumpFactor: [0, 2, 2, 1, 1, 3, 3] };
}
// SWSBase.pas:828–1050 — Weis detection and priority. Card sets are JS Sets.
const sameCards = (a, b) => a.size === b.size && [...a].every(c => b.has(c));
const containsCards = (a, b) => [...b].every(c => a.has(c));
const emptySuits = () => ({ fCount: 0, fCalls: [] });
export function GreaterSuit(trump, suit1, suit2) {
  const bestRank = suit => {
    const cards = [...suit.fCards].sort((a, b) => a - b);
    return gRankOf[(trump === B.BottomUp ? cards[0] : cards.at(-1)) ?? 0];
  };
  const suitColour = suit => suit.fCards.size && [...suit.fCards].every(c => gColourOf[c] === trump) ? trump : 0;
  const v1 = Math.trunc(suit1.fValue / 10) * 10 + suit1.fCards.size;
  const v2 = Math.trunc(suit2.fValue / 10) * 10 + suit2.fCards.size;
  if (v1 !== v2) return v1 > v2;
  if (trump === B.TopDown) return bestRank(suit1) > bestRank(suit2);
  if (trump === B.BottomUp) return bestRank(suit1) < bestRank(suit2);
  if (bestRank(suit1) !== bestRank(suit2)) return bestRank(suit1) > bestRank(suit2);
  return suitColour(suit1) === trump;
}
export function BetterSuit(trump, suit1, suit2) {
  return suit1.fCount > 0 && suit2.fCount > 0
    ? GreaterSuit(trump, suit1.fCalls[0], suit2.fCalls[0]) : suit1.fCount > suit2.fCount;
}
export function InsertSuit(trump, value, suit) {
  if (suit.fCalls.slice(0, suit.fCount).some(s => sameCards(s.fCards, value.fCards))) return;
  let i = 0;
  while (i <= 4 && i < suit.fCount && !GreaterSuit(trump, value, suit.fCalls[i])) i++;
  if (i <= 4) {
    for (let j = 4; j > i; j--) suit.fCalls[j] = structuredClone(suit.fCalls[j - 1]);
    suit.fCalls[i] = structuredClone(value); suit.fCount++;
  }
}
export function GetAllSuits(rules, trump, hand) {
  const suits = emptySuits(), cards = B.HandToCardSet(hand);
  for (let rank = B.Six; rank <= B.Ace; rank++) {
    if (rules.fSuitAllFourEqs || (rank >= B.Nine && rank <= B.King) || (trump === B.BottomUp && rank === B.Six) || (trump !== B.BottomUp && rank === B.Ace)) {
      const test = new Set([1, 2, 3, 4].map(c => gCardOf[c][rank]));
      if (containsCards(cards, test)) InsertSuit(trump, { fCards: test, fValue: (rank === B.Knave ? 200 : rank === B.Nine ? 150 : 100) + 4 }, suits);
    }
  }
  for (let colour = 1; colour <= 4; colour++) {
    let rank = B.Six;
    while (rank <= B.Ace) {
      while (rank <= B.Ace && !cards.has(gCardOf[colour][rank])) rank++;
      let stop = rank; const test = new Set();
      while (stop <= B.Ace && cards.has(gCardOf[colour][stop])) test.add(gCardOf[colour][stop++]);
      const length = stop - rank;
      if (rank <= B.Ace && length >= 3) {
        const value = length === 3 ? 20 : length === 4 ? 50 : 100 + (length - 5) * rules.fSuitsIncrement;
        InsertSuit(trump, { fCards: test, fValue: value + length }, suits);
      }
      rank = stop + 1;
    }
  }
  return suits;
}
export function GetBestSuit(rules, trump, hand) {
  const cards = B.HandToCardSet(hand), suits = GetAllSuits(rules, trump, hand), best = emptySuits();
  let bestv = 0;
  if (rules.fSuitCrossingOn) {
    cards.clear();
    while (suits.fCount > 0) {
      bestv = -2147483647; let suit = emptySuits(), besti = -1;
      for (let curr = 0; curr < suits.fCount; curr++) {
        const candidate = suits.fCalls[curr];
        if ([...candidate.fCards].some(c => !cards.has(c))) {
          const stemp = { fCount: 1, fCalls: [candidate] }, currv = candidate.fValue;
          // Preserve the source's tie-comparison argument order.
          if (currv > bestv || (currv === bestv && BetterSuit(trump, suit, stemp))) { suit = stemp; besti = curr; bestv = currv; }
        }
      }
      if (besti < 0) suits.fCount = 0;
      else {
        for (const c of suit.fCalls[0].fCards) cards.add(c);
        InsertSuit(trump, suit.fCalls[0], best);
        suits.fCalls.splice(besti, 1); suits.fCount--;
      }
    }
  } else {
    for (let curr = 0; curr < suits.fCount; curr++) {
      const selected = suits.fCalls[curr];
      const remainder = new Set([...cards].filter(c => !selected.fCards.has(c)));
      const suit = GetBestSuit(rules, trump, CardSetToHand(remainder));
      const currv = selected.fValue + ValueOfSuit(trump, false, suit);
      if (currv > bestv || (currv === bestv && BetterSuit(trump, best, suit))) {
        best.fCount = 1; best.fCalls = [structuredClone(selected)];
        for (let i = 0; i < suit.fCount; i++) InsertSuit(trump, suit.fCalls[i], best);
        bestv = currv;
      }
    }
  }
  return best;
}
// SWSBase.pas:1054–1492 — state, round lifecycle, Weis and Stöck timing.
export const kRoundsHigh = 47;
const emptyTrick = () => ({ fLeading: 0, fPlayed: [0, 0, 0, 0, 0] });
const emptyRound = () => ({ fTrump: 0, fTrumpedBy: 0, fTrick: 0,
  fSuits: Array.from({ length: 5 }, emptySuits), fTricks: Array.from({ length: 10 }, emptyTrick) });
export function InitJassState() {
  return { fPoints: [0, 0, 0], fTmpPts: [0, 0, 0], fWinner: 0, fBPrice: 0,
    fRoundTotal: 0, fRound: 0, fLeading: 0, fRounds: Array.from({ length: 48 }, emptyRound),
    fHands: Array.from({ length: 5 }, () => Array(9).fill(0)) };
}
export function SetupJassState(rules, leads) {
  const state = InitJassState(); state.fRules = structuredClone(rules); state.fLeading = leads;
  state.fRounds[0].fTricks[0].fLeading = leads; return state;
}
export function ResetJassState(state) {
  state.fRounds = Array.from({ length: 48 }, emptyRound);
  state.fPoints.fill(0); state.fTmpPts.fill(0); state.fWinner = 0; state.fBPrice = 0;
  state.fRoundTotal = 0; state.fRound = 0; state.fLeading = B.North;
}
export function GetLeadingPlayer(state) {
  if (state.fRound > kRoundsHigh) return 0;
  const r = state.fRounds[state.fRound]; return r.fTrick < 9 ? r.fTricks[r.fTrick].fLeading || state.fLeading : 0;
}
export function GetCurrentPlayer(state) {
  if (state.fRound > kRoundsHigh) return 0;
  const r = state.fRounds[state.fRound];
  if (r.fTrick >= 9) return r.fTricks[9].fLeading;
  const trick = r.fTricks[r.fTrick]; let p = trick.fLeading;
  if (!p) return state.fLeading;
  for (let i = 0; i < 4; i++) { if (trick.fPlayed[p] === 0) return p; p = gNextPlayer[p]; }
  return 0;
}
export function GetCurrentTrick(state) {
  if (state.fRound > kRoundsHigh) return emptyTrick();
  const r = state.fRounds[state.fRound];
  // The Pascal VAR output leaves old card slots undefined after completion;
  // return an empty record instead of exposing uninitialized browser data.
  return r.fTrick < 9 ? structuredClone(r.fTricks[r.fTrick]) : emptyTrick();
}
export function GetCurrentTrump(state) {
  if (state.fRound > kRoundsHigh) return 0;
  const r = state.fRounds[state.fRound]; return r.fTrick < 9 ? r.fTrump : 0;
}
export function CheckLimit(ptsNS, ptsWE, limit) {
  if (ptsNS > ptsWE && ptsNS >= limit) return B.TeamNS;
  if (ptsWE > ptsNS && ptsWE >= limit) return B.TeamWE;
  return 0;
}
export function EvalSuits(state, round) {
  if (!round.fTrump) return false;
  let best = 0, p = round.fTricks[0].fLeading;
  do {
    if (round.fSuits[p].fCount > 0 && BetterSuit(round.fTrump, round.fSuits[p], round.fSuits[best])) best = p;
    p = gNextPlayer[p];
  } while (p !== round.fTricks[0].fLeading);
  if (best) {
    for (p = 1; p <= 4; p++) if (gTeamOf[p] !== gTeamOf[best]) round.fSuits[p].fCount = 0;
    const pts = ValueOfSuits(state.fRules, round);
    state.fTmpPts[1] += pts[1]; state.fTmpPts[2] += pts[2];
  }
  return best !== 0;
}
export function PrepareRound(state, trump, trumpedBy) {
  state.fTmpPts = [...state.fPoints];
  if (state.fRound >= kRoundsHigh) { state.fRounds = Array.from({ length: 48 }, emptyRound); state.fRound = 0; }
  const r = state.fRounds[state.fRound]; r.fTrump = trump; r.fTrumpedBy = trumpedBy; r.fTrick = 0;
  for (const suit of r.fSuits) suit.fCount = 0;
  r.fTricks = Array.from({ length: 10 }, emptyTrick); r.fTricks[0].fLeading = state.fLeading;
}
export function FinishRound(state) {
  const rules = state.fRules;
  const lookForBPrice = rules.fPointPlay && state.fBPrice === 0 && Math.max(...state.fPoints.slice(1)) < rules.fCut;
  const lookForWinner = rules.fPointPlay && state.fWinner === 0 && Math.max(...state.fPoints.slice(1)) < rules.fLimit;
  const { pts, match } = ValueOfRound(rules, state.fRounds[state.fRound]);
  const result = { pts, matchBy: match, signalBPrice: false, signalWinner: false };
  state.fPoints[1] += pts[1]; state.fPoints[2] += pts[2];
  state.fRoundTotal++; state.fRound++; state.fLeading = gNextPlayer[state.fLeading];
  if (rules.fPointPlay) {
    if (lookForBPrice && CheckLimit(state.fPoints[1], state.fPoints[2], rules.fCut)) {
      state.fBPrice = CheckLimit(state.fPoints[1], state.fPoints[2], rules.fCut); result.signalBPrice = state.fBPrice !== 0;
    }
    if (lookForWinner && CheckLimit(state.fPoints[1], state.fPoints[2], rules.fLimit)) {
      state.fWinner = CheckLimit(state.fPoints[1], state.fPoints[2], rules.fLimit); result.signalWinner = state.fWinner !== 0;
    }
  } else if (!state.fWinner && state.fRoundTotal >= rules.fRoundLimit) {
    if (state.fPoints[1] > state.fPoints[2]) state.fWinner = B.TeamNS;
    else if (state.fPoints[2] > state.fPoints[1]) state.fWinner = B.TeamWE;
    result.signalWinner = state.fWinner !== 0;
  }
  return result;
}
export function RoundFinished(state) { return state.fRound >= kRoundsHigh || state.fRounds[state.fRound].fTrick >= 9; }
export function MatchFinished(state) {
  return state.fRules.fPointPlay ? state.fPoints[1] >= state.fRules.fLimit || state.fPoints[2] >= state.fRules.fLimit
    : state.fRoundTotal >= state.fRules.fRoundLimit;
}
// SWSBase.pas:1491. Remaining tricks belong to the opposing team on a forfeit.
export function ForfaitRound(state, player) {
  const r=state.fRounds[state.fRound], next=gNextPlayer[player], team=gTeamOf[next], indexes=Array(5).fill(0);
  if(!r.fTrump) r.fTrump=B.TopDown;
  if(r.fTrick===0) for(const p of [next,gNextPlayer[gNextPlayer[next]]]) if(!r.fSuits[p].fCount) r.fSuits[p]=GetBestSuit(state.fRules,r.fTrump,state.fHands[p]);
  let trick=r.fTrick;
  while(trick<9) {
    for(let p=1;p<=4;p++) if(!r.fTricks[trick].fPlayed[p]) {
      while(indexes[p]<=8&&!state.fHands[p][indexes[p]]) indexes[p]++;
      if(indexes[p]<=8) {r.fTricks[trick].fPlayed[p]=state.fHands[p][indexes[p]];state.fHands[p][indexes[p]]=0;}
    }
    trick++;r.fTricks[trick].fLeading=next;
    state.fTmpPts[team]+=ValueOfTrick(r.fTrump,r.fTricks[trick-1])*FactorOfTrump(state.fRules,r.fTrump);
  }
  r.fTrick=9;
}
export function CallSuit(state, forPlayer, suit) {
  const r = state.fRounds[state.fRound]; r.fSuits[forPlayer] = structuredClone(suit);
  const stck = Stockings(state.fRules, r.fTrump);
  if (stck.size) {
    const containing = suit.fCalls.slice(0, suit.fCount).find(s => containsCards(s.fCards, stck));
    if (containing && !sameCards(containing.fCards, stck)) InsertSuit(r.fTrump, { fCards: stck, fValue: 20 }, r.fSuits[forPlayer]);
  }
}
export function PlayCard(state, card) {
  const r = state.fRounds[state.fRound], rules = state.fRules, trick = r.fTricks[r.fTrick];
  const signals = { signalBPrice: false, signalWinner: false, signalStockings: false };
  let lookForBPrice = rules.fPointPlay && !state.fBPrice && Math.max(...state.fTmpPts.slice(1)) < rules.fCut;
  let lookForWinner = rules.fPointPlay && !state.fWinner && Math.max(...state.fTmpPts.slice(1)) < rules.fLimit;
  const look = () => {
    if (lookForBPrice && CheckLimit(state.fTmpPts[1], state.fTmpPts[2], rules.fCut)) {
      state.fBPrice = CheckLimit(state.fTmpPts[1], state.fTmpPts[2], rules.fCut); signals.signalBPrice = true; lookForBPrice = false;
    }
    if (lookForWinner && CheckLimit(state.fTmpPts[1], state.fTmpPts[2], rules.fLimit)) {
      state.fWinner = CheckLimit(state.fTmpPts[1], state.fTmpPts[2], rules.fLimit); signals.signalWinner = true; lookForWinner = false;
    }
  };
  let p = trick.fLeading;
  while (trick.fPlayed[p] !== 0 && gNextPlayer[p] !== trick.fLeading) p = gNextPlayer[p];
  if (trick.fPlayed[p] === 0) trick.fPlayed[p] = card;
  const index = state.fHands[p].indexOf(card); if (index >= 0) state.fHands[p][index] = 0;
  const stck = Stockings(rules, r.fTrump);
  const alreadyCalled = player => r.fSuits[player].fCalls.slice(0, r.fSuits[player].fCount).some(s => containsCards(s.fCards, stck));
  const factor = FactorOfTrump(rules, r.fTrump);
  if (stck.has(card)) {
    const remaining = new Set(stck); remaining.delete(card);
    for (let i = r.fTrick - 1; i >= 0 && remaining.size; i--) remaining.delete(r.fTricks[i].fPlayed[p]);
    if (!remaining.size && !alreadyCalled(p)) {
      InsertSuit(r.fTrump, { fCards: stck, fValue: 20 }, r.fSuits[p]); signals.signalStockings = true;
      if (lookForBPrice || lookForWinner) { state.fTmpPts[gTeamOf[p]] += 20 * factor; look(); state.fTmpPts[gTeamOf[p]] -= 20 * factor; }
    }
  }
  if (gNextPlayer[p] === trick.fLeading) {
    if (!signals.signalStockings && r.fTrick === 1 && stck.size && (lookForBPrice || lookForWinner)) {
      const previous = r.fTricks[r.fTrick - 1]; p = previous.fLeading;
      do {
        const cards = B.HandToCardSet(state.fHands[p]); cards.add(previous.fPlayed[p]);
        if (containsCards(cards, stck)) {
          state.fTmpPts[gTeamOf[p]] += 20 * factor; look(); state.fTmpPts[gTeamOf[p]] -= 20 * factor;
          if ((signals.signalBPrice || signals.signalWinner) && !alreadyCalled(p)) {
            InsertSuit(r.fTrump, { fCards: stck, fValue: 20 }, r.fSuits[p]); signals.signalStockings = true;
          }
        }
        p = gNextPlayer[p];
      } while (p !== previous.fLeading && !signals.signalStockings);
    }
    const winner = WinnerOfTrick(r.fTrump, trick); r.fTrick++; r.fTricks[r.fTrick].fLeading = winner;
    if (rules.fSuitsComeFirst && r.fTrick === 1 && EvalSuits(state, r)) look();
    state.fTmpPts[gTeamOf[winner]] += ValueOfTrick(r.fTrump, trick) * factor; look();
    if (!rules.fSuitsComeFirst && r.fTrick === 1 && EvalSuits(state, r)) look();
  }
  return signals;
}
