// Shared, equivalent portions of SWSBase.pas and DiffBase.pas.
// Keep Pascal identifiers and 1-based card/player arrays; index 0 is the sentinel.
export const NoColour = 0, Spades = 1, Hearts = 2, Diamonds = 3, Clubs = 4;
export const TopDown = 5, BottomUp = 6;
export const NoRank = 0, Six = 1, Seven = 2, Eight = 3, Nine = 4, Ten = 5;
export const Knave = 6, Queen = 7, King = 8, Ace = 9;
export const NoCard = 0, kCardHigh = 36;
export const NoPlayer = 0, North = 1, West = 2, South = 3, East = 4;
export const NoTeam = 0, TeamNS = 1, TeamWE = 2;
export const kPointsPerRound = 157;

export const gCardOf = Object.freeze(Array.from({ length: 5 }, (_, colour) =>
  Object.freeze(Array.from({ length: 10 }, (_, rank) => colour && rank ? 9 * (colour - 1) + rank : 0))));
export const gColourOf = Object.freeze(Array.from({ length: 37 }, (_, card) => card ? Math.floor((card - 1) / 9) + 1 : 0));
export const gRankOf = Object.freeze(Array.from({ length: 37 }, (_, card) => card ? (card - 1) % 9 + 1 : 0));
export const gTeamOf = Object.freeze([0, 1, 2, 1, 2]);
export const gNextPlayer = Object.freeze([0, 2, 3, 4, 1]);
export const gPrevPlayer = Object.freeze([0, 4, 1, 2, 3]);

// SWSBase:535, DiffBase:411. This is trump strength, not point value.
export function TrumpRank(rank) {
  switch (rank) {
    case Six: case Seven: case Eight: return rank;
    case Nine: return King;
    case Ten: return Nine;
    case Knave: return Ace;
    case Queen: case King: case Ace: return rank - 2;
    default: return NoRank;
  }
}

export function HandToCardSet(hand) { return new Set(hand.filter(card => card !== NoCard)); }
export function CardSetToHand(cards, handHigh) {
  const hand = Array(handHigh + 1).fill(NoCard);
  let index = 0;
  for (let card = 1; card <= kCardHigh; card++) {
    if (cards.has(card) && index <= handHigh) hand[index++] = card;
  }
  return hand;
}
export function SortHand(hand, handHigh) { return CardSetToHand(HandToCardSet(hand), handHigh); }
export function NrInTrick(trick) {
  return trick.fPlayed.slice(1, 5).filter(card => card > NoCard && card <= kCardHigh).length;
}

// SWSBase:1557–1615 / DiffBase:1124–1182. A context replaces mutable unit globals
// so independent games do not share random streams. DIV truncates toward zero.
export class RandomStreams {
  constructor() {
    this.gRnd = Array.from({ length: 11 }, (_, id) => ({ fUsed: id === 0, fName: '', fSeed: 1 }));
    this.gDealRnd = this.NewRnd('Verteilen');
  }
  NewRnd(name) {
    const id = this.gRnd.findIndex(stream => !stream.fUsed);
    if (id < 0) return 0;
    this.gRnd[id] = { fUsed: true, fName: name, fSeed: 1 };
    return id;
  }
  used(id) { return Number.isInteger(id) && id > 0 && id <= 10 && this.gRnd[id].fUsed; }
  SetRnd(id, seed) {
    if (this.used(id)) {
      if (!Number.isInteger(seed) || seed < -2147483648 || seed > 2147483647) throw new RangeError('Seed must be a Delphi LongInt');
      this.gRnd[id].fSeed = seed;
    }
  }
  GetRnd(id) { return this.used(id) ? this.gRnd[id].fSeed : 0; }
  Rnd(id, absolute) {
    if (!this.used(id)) return 0;
    const A = 16807, M = 2147483647, Q = Math.trunc(M / A), R = M % A, hi = 65536;
    let seed = this.gRnd[id].fSeed;
    seed = A * (seed % Q) - R * Math.trunc(seed / Q);
    if (seed <= 0) seed += M;
    this.gRnd[id].fSeed = seed;
    const value = Math.max(-32767, Math.trunc(seed / (Math.trunc(M / (hi + 1)) + 1)) - hi / 2);
    return absolute && value < 0 ? -value : value;
  }
}

// Both DealCards routines choose the nth remaining card, slot first/player second.
// This deliberately is not a Fisher–Yates shuffle: seed compatibility depends on it.
export function DealCards(random, nuPlayers, handHigh) {
  const hands = Array.from({ length: 5 }, () => Array(handHigh + 1).fill(NoCard));
  const cards = Array.from({ length: kCardHigh }, (_, i) => i + 1);
  for (let i = 0; i < 36 / nuPlayers; i++) {
    for (let p = North; p <= nuPlayers; p++) {
      const index = random.Rnd(random.gDealRnd, true) % cards.length;
      hands[p][i] = cards.splice(index, 1)[0];
    }
  }
  for (let p = North; p <= nuPlayers; p++) hands[p] = SortHand(hands[p], handHigh);
  return hands;
}
