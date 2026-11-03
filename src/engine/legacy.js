import * as S from './SWSBase.js';
import * as D from './DiffBase.js';

const numbers = text => text.trim().split(/\s+/).filter(Boolean).map(Number);
const check = (condition, message) => { if (!condition) throw new Error(`Jass-Datei: ${message}`); };
// SWSFile/DIFFFILE text records. Private saved AI dumps after End Of Jass are
// deliberately not interpreted: the archive viewer replays public game records.
export function parseLegacy(text) {
  text = text.replace(/\r\n?/g, '\n');
  const games = [];
  for (const block of text.split(/(?=^### Title:)/m).filter(s => s.startsWith('### Title:'))) {
    const kind = /^### Round: card /m.test(block) ? 'differ' : 'schieber';
    const base = kind === 'schieber' ? S : D;
    const rulesText = block.match(/^### Rules:\s*\n([^#]+)/m)?.[1];
    check(rulesText, 'Regeln fehlen');
    const lines = rulesText.trim().split('\n'), rules = base.DefaultRules();
    if (kind === 'schieber') {
      const a = lines[0].trim().split(/\s+/), b = lines[1]?.trim().split(/\s+/), factors = numbers(lines[2] ?? '');
      check(b?.length >= 6 && factors.length === 6, 'Ungültige Schieber-Regeln');
      Object.assign(rules, { fPointPlay: a[0] === 'pointPlay', fLimit: +a[1], fCut: +a[2], fRoundLimit: +a[3], fLooserBegins: a[4] === 'looserBegins',
        fSuitsEnabled: b[0] === 'suitsOn', fSuitAllFourEqs: b[1] === 'allFourOn', fSuitCrossingOn: b[2] === 'crossingOn', fSuitsComeFirst: b[3] === 'suitsFirst',
        fSuitsIncrement: +b[4], fMatchBonus: +b[5], fTrumpFactor: [0, ...factors] });
    } else {
      const a = lines[0].trim().split(/\s+/);
      Object.assign(rules, { fNuPlayers: +a[0], fRoundLimit: +a[1], fSumUpRanks: a[2] === 'ranks', fCallMode: +a[3], fSCallBonus: a[4] === 'callBonus', fDZeroBonus: +a[5], fStockings: +a[6] });
    }
    const count = kind === 'schieber' ? 4 : rules.fNuPlayers;
    check([3, 4].includes(count), 'Ungültige Spielerzahl');
    const names = ['', 'Nord', 'West', 'Süd', 'Ost'], hands = Array.from({length:5},()=>[]);
    for (const m of block.matchAll(/^### Player ([1-4]): (.*?)\(([^)]*)\)/gm)) {
      names[+m[1]] = m[2].trim(); hands[+m[1]] = numbers(m[3]).filter(Boolean);
    }
    const rounds = [];
    for (const m of block.matchAll(/^### Round:([^\n]*)\n([\s\S]*?)^### End Of Round\./gm)) {
      const header = m[1], body = m[2], trump = +(header.match(/trumps? (\d+)/)?.[1] ?? 0);
      if (!trump) continue;
      check(trump >= 1 && trump <= (kind === 'schieber' ? 6 : 4), 'Ungültiger Trumpf');
      const round = base.SetupJassState(rules,1).fRounds[0];
      round.fTrump = trump; round.fTrick = +(header.match(/trick (\d+)/)?.[1] ?? 0);
      check(round.fTrick >= 0 && round.fTrick <= 36 / count, 'Ungültige Stichzahl');
      if (kind === 'schieber') {
        round.fTrumpedBy = +(header.match(/^\s*(\d)/)?.[1] ?? 0);
        for (const suit of body.matchAll(/^([1-4]) suits([^\n]*)/gm)) {
          const calls = [...suit[2].matchAll(/\(([^)]*)\)/g)].map(c => {
            const [fValue,...cards] = numbers(c[1]); return {fValue,fCards:new Set(cards)};
          });
          round.fSuits[+suit[1]] = {fCount:calls.length,fCalls:calls};
        }
      } else {
        round.fDrawn = +(header.match(/card (\d+)/)?.[1] ?? 0);
        round.fStocksFor = +(header.match(/stocksFor (\d+)/)?.[1] ?? 0);
        round.fStockings = +(header.match(/stockings (\d+)/)?.[1] ?? 0);
        for (const call of body.matchAll(/^([1-4]) call (-?\d+) made (-?\d+)(?: bonus (-?\d+))?/gm)) {
          const p = +call[1]; round.fCall[p] = +call[2]; round.fMade[p] = +call[3]; round.fBonus[p] = +(call[4] ?? 0);
        }
      }
      const seen = new Set(), plays = [];
      let t = 0;
      for (const row of body.matchAll(/^([0-4]) ->\s*([^\n]*)/gm)) {
        check(t < round.fTricks.length, 'Zu viele Stiche');
        const leader = +row[1], cards = numbers(row[2]);
        check(cards.length === count || cards.length === 4, 'Ungültige Stichzeile');
        const trick = {fLeading:leader,fPlayed:[0,0,0,0,0]};
        for (let i=0;i<count;i++) {
          const card = cards[i], p = (leader-1+i)%count+1;
          check(Number.isInteger(card) && card>=0 && card<=36, 'Ungültige Karte');
          if (!card) continue;
          check(leader>=1 && leader<=count && !seen.has(card), 'Karte doppelt oder Spieler ungültig');
          seen.add(card); trick.fPlayed[p]=card; plays.push({player:p,card,trick:t,leader});
        }
        round.fTricks[t++]=trick;
      }
      check(t > 0, 'Stiche fehlen');
      rounds.push({round,plays});
    }
    if (!rounds.length) continue;
    games.push({kind,rules,count,names,hands,rounds,title:block.match(/^### Title:\s*(.*)/)?.[1] ?? 'Jass'});
  }
  check(games.length>0, 'Kein Jass-Archiv erkannt');
  return games;
}

export function legacyView(game, roundIndex, step) {
  const {kind,count,names,rules} = game, item = game.rounds[roundIndex], r = item.round;
  const hands = Array.from({length:5},()=>[]), scores = Array(kind==='schieber'?3:5).fill(0), history=[];
  for (let i=0;i<roundIndex + (step===36 ? 1 : 0);i++) {
    const round=game.rounds[i].round;
    if(kind==='schieber') {const result=S.ValueOfRound(rules,round);history.push(result);scores[1]+=result.pts[1];scores[2]+=result.pts[2];}
    else {history.push({call:round.fCall,made:round.fMade,bonus:round.fBonus});for(let p=1;p<=count;p++) scores[p]+=D.DeltaOf(round.fCall[p],round.fMade[p],round.fBonus[p]);}
  }
  for(const play of item.plays.slice(step)) hands[play.player].push(play.card);
  if(roundIndex===game.rounds.length-1 && item.plays.length<36) for(let p=1;p<=count;p++) hands[p].push(...game.hands[p]);
  const last=item.plays[step-1];
  const trick={fLeading:last?.leader??r.fTricks[0].fLeading,fPlayed:[0,0,0,0,0]};
  if(last) for(const play of item.plays.slice(0,step)) if(play.trick===last.trick) trick.fPlayed[play.player]=play.card;
  return {kind,phase:'replay',count,human:3,names,roundNumber:roundIndex+1,trump:r.fTrump,hand:hands[3].sort((a,b)=>a-b),
    handCounts:hands.map(h=>h.length),trick,calls:r.fCall??null,scores,history,events:[],request:null,allHands:hands};
}
