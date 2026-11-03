import * as S from './SWSBase.js';
import * as D from './DiffBase.js';

const hiddenSuit = suit => ({ fCount: suit.fCount, fCalls: suit.fCalls.map(s => ({ ...s, fCards: new Set() })) });
const assert = (condition, message) => { if (!condition) throw new Error(message); };

// Browser command boundary, following TJassManager in SWSPlay/DiffPlay.
// The AI receives notifications through its adapter, never the manager state.
export class Game {
  constructor(options, ai) {
    assert(['schieber', 'differ'].includes(options.kind), 'Unbekanntes Spiel');
    this.options = structuredClone(options);
    this.kind = options.kind; this.base = this.kind === 'schieber' ? S : D;
    this.rules = { ...this.base.DefaultRules(), ...options.rules };
    this.count = this.kind === 'schieber' ? 4 : this.rules.fNuPlayers;
    assert([3, 4].includes(this.count), 'Ungültige Spielerzahl');
    assert(Number.isInteger(this.rules.fRoundLimit) && this.rules.fRoundLimit >= 1 && this.rules.fRoundLimit <= 48, 'Ungültige Rundenzahl');
    this.human = options.human ?? 3;
    assert(Number.isInteger(this.human) && this.human >= 1 && this.human <= this.count, 'Ungültiger Spieler');
    assert(Number.isInteger(options.leading ?? 3) && (options.leading ?? 3) >= 1 && (options.leading ?? 3) <= this.count, 'Ungültiger Startspieler');
    assert(Number.isInteger(options.level ?? 66) && (options.level ?? 66) >= 0 && (options.level ?? 66) <= 99, 'Ungültige Spielstärke');
    for (const [key, value] of Object.entries(this.base.DefaultRules())) {
      if (typeof value === 'boolean') assert(typeof this.rules[key] === 'boolean', 'Ungültige Regel: '+key);
      else if (typeof value === 'number') assert(Number.isInteger(this.rules[key]) && this.rules[key] >= 0 && this.rules[key] <= 100000, 'Ungültige Regel: '+key);
    }
    if (this.kind === 'schieber') {
      assert(this.rules.fLimit > 0 && Array.isArray(this.rules.fTrumpFactor) && this.rules.fTrumpFactor.length === 7
        && this.rules.fTrumpFactor.every(n => Number.isInteger(n) && n >= 0 && n <= 10)
        && this.rules.fTrumpFactor.slice(1).some(n => n > 0), 'Ungültige Trumpffaktoren oder Zielpunkte');
    } else assert([0, 1, 2].includes(this.rules.fCallMode) && [0, 1, 2].includes(this.rules.fStockings), 'Ungültiger Ansage- oder Stöck-Modus');
    this.names = options.names ?? ['', 'Nord', 'West', 'Sie', 'Ost'];
    assert(Array.isArray(this.names) && this.names.length === 5 && this.names.every(n => typeof n === 'string' && n.length <= 80), 'Ungültige Spielernamen');
    this.ai = ai; this.state = this.base.SetupJassState(this.rules, options.leading ?? 3);
    this.random = new S.RandomStreams(); this.random.SetRnd(this.random.gDealRnd, options.seed ?? 1);
    this.phase = 'deal'; this.journal = []; this.history = []; this.events = [];
    this.lastTrick = null; this.pause = false; this.pending = null;
    this.ai.notify('cmdNew', { fRules: this.rules, fPlayer: this.state.fLeading,
      fTypes: [0, 1, 1, 1, 1].map((v, p) => p === this.human ? 0 : v), fNames: this.names,
      fLevel: [0, ...Array(4).fill(options.level ?? 66)] });
  }
  get round() { return this.state.fRounds[this.state.fRound]; }
  notify(command, data, recipients) { this.ai.notify(command, data, recipients); }
  deal() {
    assert(this.phase === 'deal', 'Jetzt können keine Karten verteilt werden.');
    this.pending = null; this.lastTrick = null; this.pause = false;
    if (this.kind === 'schieber') {
      this.state.fHands = S.DealCards(this.random);
      // GetCurrentPlayer must see the new round's leader before trump selection.
      this.round.fTricks[0].fLeading = this.state.fLeading;
      this.mayCall = Array(5).fill(this.rules.fSuitsEnabled);
      this.phase = 'trump';
      this.notify('cmdDeal', { fHands: this.state.fHands, fPoints: this.state.fPoints });
    } else {
      D.PrepareRound(this.state, D.DealCards(this.rules, this.random), 0, this.random);
      this.phase = 'call';
      this.notify('cmdDeal', { fHands: this.state.fHands, fTotal: this.state.fTotal,
        fDrawn: this.round.fDrawn, fDrawnFor: this.state.fPrevPlayer[this.state.fLeading] });
    }
  }
  request() {
    if (this.pause || ['deal', 'done'].includes(this.phase)) return null;
    if (this.pending) return this.pending;
    let player = this.base.GetCurrentPlayer(this.state), command, data = {};
    if (this.phase === 'trump') command = 'cmdTrump';
    else if (this.phase === 'shift') { command = 'cmdShift'; player = S.gNextPlayer[S.gNextPlayer[player]]; }
    else if (this.phase === 'call') command = 'cmdCall';
    else if (this.phase === 'card') {
      const r = this.round;
      if (this.kind === 'schieber' && r.fTrick === 0 && this.mayCall[player]) {
        this.mayCall[player] = false;
        const suit = S.GetBestSuit(this.rules, r.fTrump, this.state.fHands[player]);
        if (suit.fCount) {
          let best = { fCount: 0, fCalls: [] }, bestBy = 0;
          for (let p = r.fTricks[0].fLeading; p !== player; p = S.gNextPlayer[p]) {
            const temp = hiddenSuit(r.fSuits[p]);
            if (!S.BetterSuit(r.fTrump, best, temp)) { best = temp; bestBy = p; }
          }
          if (player === S.gNextPlayer[r.fTricks[0].fLeading] || !bestBy || S.gTeamOf[bestBy] === S.gTeamOf[player]
            || !S.BetterSuit(r.fTrump, best, hiddenSuit(suit))) {
            command = 'cmdSuit'; data = { fPlayer: player, fSuit: suit };
          }
        }
      } else if (this.kind === 'differ' && this.rules.fCallMode === D.kShowShow) {
        const stocks = D.NeedStockings(this.state);
        if (stocks.needed) { command = 'cmdStockings'; player = stocks.fromPlayer; data = { fPlayer: player, fStockings: this.rules.fStockings }; }
      }
      if (!command) {
        command = 'cmdPlay';
        const trick = this.base.GetCurrentTrick(this.state), hand = this.state.fHands[player];
        data = { fTrump: r.fTrump, fTrick: trick, fHand: [...hand], fLegal: this.base.LegalHand(r.fTrump, trick, hand) };
      }
    }
    this.pending = { player, command, data }; return this.pending;
  }
  submit(command, data) {
    const req = this.request();
    assert(req && data.fPlayer === req.player, 'Dieser Spieler ist nicht am Zug.');
    const r = this.round, p = req.player;
    if (command === 'cmdTrump') {
      assert(['cmdTrump', 'cmdShift'].includes(req.command), 'Jetzt kann kein Trumpf gewählt werden.');
      assert(Number.isInteger(data.fTrump) && data.fTrump >= 1 && data.fTrump <= 6 && this.rules.fTrumpFactor[data.fTrump] > 0, 'Ungültiger Trumpf');
      S.PrepareRound(this.state, data.fTrump, p); this.phase = 'card'; this.notify(command, data);
    } else if (command === 'cmdShift') {
      assert(req.command === 'cmdTrump', 'Schieben ist jetzt nicht möglich.');
      this.phase = 'shift'; this.notify(command, data);
    } else if (command === 'cmdSuit') {
      assert(req.command === command, 'Jetzt kann nicht gewiesen werden.');
      // The caller accepts the offered combination or declines it; never accept arbitrary scoring records.
      const suit = data.accept === false ? { fCount: 0, fCalls: [] } : req.data.fSuit;
      S.CallSuit(this.state, p, suit);
      this.notify(command, { fPlayer: p, fSuit: hiddenSuit(suit) });
      if (suit.fCount) this.events.push(`${this.names[p]}: ${S.ValueOfSuit(r.fTrump, false, suit)} Weis`);
    } else if (command === 'cmdCall') {
      assert(req.command === command, 'Jetzt kann nicht angesagt werden.');
      assert(Number.isInteger(data.fCall) && data.fCall >= 0 && data.fCall <= 157, 'Ansage muss zwischen 0 und 157 liegen.');
      r.fCall[p] = data.fCall;
      if (r.fCall[this.state.fNextPlayer[p]] !== D.NoCall) this.phase = 'card';
      const visible = this.rules.fCallMode === D.kShowShow || (this.rules.fCallMode === D.kHideShow && this.phase === 'card');
      this.notify(command, data, visible ? undefined : [p]);
      // In HideShow the original manager only broadcasts the final call. Keep
      // that AI notification behavior; the human table can show all predictions.
    } else if (command === 'cmdStockings') {
      assert(req.command === command && [0, 1, 2].includes(data.fStockings), 'Ungültige Stöck-Ansage');
      D.PlayStockings(this.state, p, data.fStockings); this.notify(command, data);
      if (D.RoundFinished(this.state)) this.finish();
    } else if (command === 'cmdCard') {
      assert(req.command === 'cmdPlay' && data.fCard > 0 && req.data.fLegal.includes(data.fCard), 'Diese Karte darf jetzt nicht gespielt werden.');
      const trickIndex = r.fTrick;
      const signals = this.base.PlayCard(this.state, data.fCard);
      this.notify(command, data);
      if (this.kind === 'schieber' && r.fTrick === 1 && trickIndex === 0) {
        for (let q = 1; q <= 4; q++) if (r.fSuits[q].fCount) this.notify('cmdSuit', { fPlayer: q, fSuit: r.fSuits[q] });
      } else if (this.kind === 'schieber' && signals.signalStockings) {
        this.notify('cmdSuit', { fPlayer: p, fSuit: { fCount: 1, fCalls: [{ fValue: 22, fCards: S.Stockings(this.rules, r.fTrump) }] } });
        this.events.push(`${this.names[p]}: Stöck`);
      }
      if (r.fTrick > trickIndex) {
        this.lastTrick = { ...structuredClone(r.fTricks[trickIndex]), winner: r.fTricks[r.fTrick].fLeading };
        this.pause = true;
      }
      if (this.base.RoundFinished(this.state) && !(this.kind === 'differ' && this.rules.fCallMode === D.kShowShow && D.NeedStockings(this.state).needed)) this.finish();
    } else throw new Error('Unbekannter Spielbefehl');
    this.pending = null;
  }
  finish() {
    const r = structuredClone(this.round), result = this.base.FinishRound(this.state);
    this.history.push({ round: r, result: structuredClone(result) });
    if (this.kind === 'differ') this.notify('cmdCount', { fCall: result.call, fMade: result.made, fBonus: result.bonus, fCounts: result.counts });
    else {
      const suits = S.ValueOfSuits(this.rules, r);
      this.notify('cmdCount', { fPoints: result.pts.map((n, i) => n - suits[i]), fSuitPts: suits, fMatchBy: result.matchBy });
    }
    this.phase = this.base.MatchFinished(this.state) ? 'done' : 'deal';
  }
  act(action) {
    if (action.type === 'deal') this.deal();
    else if (action.type === 'continue') { assert(this.pause, 'Kein Stich abzuräumen.'); this.pause = false; }
    else if (action.type === 'answer') this.submit(action.command, action.data);
    else if (action.type === 'forfeit') {
      assert(!['deal','done'].includes(this.phase),'Keine laufende Runde');
      this.base.ForfaitRound(this.state,this.human);
      this.pause=false;this.pending=null;this.lastTrick=null;this.events.push(`${this.names[this.human]} gibt die Runde auf.`);
      this.finish();
    }
    else throw new Error('Unbekannte Aktion');
    this.journal.push(structuredClone(action));
  }
  computer() {
    const req = this.request();
    assert(req, 'Kein Computerzug verfügbar');
    const reply = this.ai.request(req.player, req.command, req.data);
    this.act({ type: 'answer', source: 'computer', command: reply.command, data: { ...reply.data, ...(reply.command === 'cmdSuit' ? { accept: true } : {}) } });
  }
  view() {
    const req = this.request(), active = !['deal', 'done'].includes(this.phase);
    const r = active ? this.round : this.history.at(-1)?.round;
    const visibleCalls = this.kind === 'differ' && r ? r.fCall.map((call, p) =>
      p === this.human || !active || this.rules.fCallMode === D.kShowShow || (this.rules.fCallMode === D.kHideShow && this.phase !== 'call') ? call : D.NoCall) : null;
    return { kind: this.kind, phase: this.phase, count: this.count, human: this.human, names: this.names,
      roundNumber: active ? this.state.fRoundTotal + 1 : this.state.fRoundTotal, trump: r?.fTrump ?? 0, rules: this.rules,
      hand: [...this.state.fHands[this.human]],
      handCounts: this.state.fHands.map(h => h.filter(Boolean).length),
      trick: this.pause ? this.lastTrick : active ? this.base.GetCurrentTrick(this.state) : this.lastTrick,
      lastTrick: this.lastTrick, pause: this.pause, calls: visibleCalls,
      scores: this.kind === 'schieber' ? this.state.fPoints : this.state.fTotal,
      winner: this.state.fWinner ?? 0, ranks: this.state.fFinal,
      history: this.history.map(h => h.result), events: this.events.slice(-12),
      request: req ? { player: req.player, command: req.command, ...(req.player === this.human ? { data: req.data } : {}) } : null };
  }
  save() { return { format: 'sws-browser', version: 1, options: this.options, actions: this.journal }; }
  static restore(saved, ai) {
    assert(saved?.format === 'sws-browser' && saved.version === 1 && Array.isArray(saved.actions) && saved.actions.length <= 20000, 'Ungültige SWS-Spiel-Datei');
    const game = new Game(saved.options, ai);
    for (const action of saved.actions) {
      if (action.source === 'computer') {
        const req = game.request();
        assert(req, 'Ungültige Computerzug-Folge');
        game.ai.request(req.player, req.command, req.data);
      }
      game.act(action);
    }
    return game;
  }
}
