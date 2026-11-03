// Capture the first completed round from each M1 native archive scenario.
// This is test-fixture preparation, not a general .JAR importer.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const fixtures = [];
for (const [game, file] of [['schieber', 'original/Schieber/GRUMPY.JAR'], ['differ', 'original/Differ/TEST.JAR']]) {
  const bytes = await readFile(path.join(root, file));
  const text = bytes.toString('latin1');
  const match = [...text.matchAll(/^### Round:.*\(trick 9\)[\s\S]*?^### End Of Round\./gm)][0];
  if (!match) throw new Error(`No completed round in ${file}`);
  const excerpt = match[0];
  const header = excerpt.split(/\r?\n/)[0];
  const fTrump = Number(header.match(/trumps? (\d+)/)[1]);
  const fTricks = [...excerpt.matchAll(/^(\d) ->\s*([^\r\n]*)/gm)].map(row => {
    const fLeading = Number(row[1]), fPlayed = [0, 0, 0, 0, 0];
    const cards = row[2].trim().split(/\s+/).map(Number);
    if (cards.length !== 4) throw new Error('Expected four-player reference');
    // SWSFile/DIFFFILE write cards in play-circle order starting at fLeading.
    cards.forEach((card, i) => { fPlayed[(fLeading - 1 + i) % 4 + 1] = card; });
    return { fLeading, fPlayed };
  });
  if (fTricks.length !== 10) throw new Error('Missing final winner row');
  const round = { fTrump, fTrick: 9, fTricks };
  if (game === 'schieber') {
    round.fTrumpedBy = Number(header.match(/Round: (\d)/)[1]);
    round.fSuits = Array.from({ length: 5 }, () => ({ fCount: 0, fCalls: [] }));
    for (const row of excerpt.matchAll(/^(\d) suits([^\r\n]*)/gm)) {
      const fCalls = [...row[2].matchAll(/\(([^)]+)\)/g)].map(m => {
        const [fValue, ...fCards] = m[1].trim().split(/\s+/).map(Number);
        return { fValue, fCards };
      });
      round.fSuits[Number(row[1])] = { fCount: fCalls.length, fCalls };
    }
  } else {
    round.fDrawn = Number(header.match(/card (\d+)/)[1]);
    round.fStocksFor = Number(header.match(/stocksFor (\d+)/)[1]);
    round.fStockings = Number(header.match(/stockings (\d+)/)[1]);
    round.fCall = Array(5).fill(-10000); round.fMade = Array(5).fill(-10000); round.fBonus = Array(5).fill(0);
    for (const row of excerpt.matchAll(/^(\d) call (-?\d+) made (-?\d+) bonus (-?\d+)/gm)) {
      const [p, call, made, bonus] = row.slice(1).map(Number);
      round.fCall[p] = call; round.fMade[p] = made; round.fBonus[p] = bonus;
    }
  }
  fixtures.push({ game, source: file, sourceSha256: createHash('sha256').update(bytes).digest('hex'),
    sourceLine: text.slice(0, match.index).split('\n').length,
    excerpt, round });
}
await mkdir(path.join(root, 'tests-node/fixtures'), { recursive: true });
await writeFile(path.join(root, 'tests-node/fixtures/legacy-rounds.json'), JSON.stringify(fixtures, null, 2) + '\n');
console.log('Prepared 2 archived rounds: 18 recorded tricks / 72 plays.');
