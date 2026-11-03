// Compact, versionable M1 evidence; bulk recovery outputs remain under artifacts/.
import { readFile, writeFile, readdir, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'artifacts/m1');
const docs = path.join(root, 'docs/m1');
const digest = b => createHash('sha256').update(b).digest('hex');
const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
const manifestBytes = await readFile(path.join(output, 'manifest.json'));
const manifest = JSON.parse(manifestBytes);
const mappings = await readJson(path.join(output, 'mappings.json'));
if (mappings.sourceManifestSha256 !== digest(manifestBytes)) throw new Error('Mappings are stale; run reference:extract again');
await mkdir(docs, { recursive: true });
await mkdir(path.join(output, 'fixtures'), { recursive: true });
const fixtures = [];
for (const game of ['Schieber', 'Differ']) {
  for (const name of (await readdir(path.join(root, 'original', game))).filter(n => /\.(jss|jar)$/i.test(n)).sort()) {
    const file = `original/${game}/${name}`;
    const bytes = await readFile(path.join(root, file));
    const text = new TextDecoder('windows-1252').decode(bytes);
    const headings = text.split(/\r\n|\r|\n/).filter(l => /^### (Title:|Number Of Rounds:|Round:|Jass-Setup:|Rules:)/.test(l));
    const target = `fixtures/${game}-${name}`;
    await copyFile(path.join(root, file), path.join(output, target));
    fixtures.push({ file, bytes: bytes.length, sha256: digest(bytes), workingCopy: target,
      kind: /\.jar$/i.test(name) ? 'round-archive' : 'saved-game-or-setup',
      headings, note: 'Header inventory only; compatibility is established only by the recorded native scenarios.' });
  }
}
await writeFile(path.join(output, 'fixtures.json'), JSON.stringify(fixtures, null, 2) + '\n');

const capturedScenarios = [];
await mkdir(path.join(docs, 'screenshots'), { recursive: true });
for (const game of ['schieber', 'differ']) {
  for (const label of ['setup', 'rules', 'four-player', 'saved-archive', 'saved-game', 'saved-game-current']) {
    const file = path.join(output, 'native', game, `${label}.json`);
    let capture;
    try { capture = await readJson(file); }
    catch (e) { if (e.code === 'ENOENT') continue; throw e; }
    const expected = manifest.executables.find(e => e.file === capture.source);
    if (!expected || expected.sha256 !== capture.sha256) throw new Error(`Native capture identity mismatch: ${file}`);
    const screens = [];
    for (const [stepIndex, step] of capture.steps.entries()) {
      for (const window of step.windows.filter(w => w.capture?.status === 'captured' && w.capture.painted)) {
        // Keep the dialog being examined, or the main table when no dialog is open.
        const dialogPresent = step.windows.some(w => w.capture?.status === 'captured' && w.class !== 'TmainForm');
        if (dialogPresent && window.class === 'TmainForm') continue;
        const bytes = await readFile(path.join(root, window.capture.path));
        if (digest(bytes) !== window.capture.sha256) throw new Error('Screenshot digest mismatch');
        const name = `${game}-${label}-${stepIndex}-${window.class.replace(/[^a-zA-Z0-9]/g, '')}.png`;
        await writeFile(path.join(docs, 'screenshots', name), bytes);
        screens.push({ step: stepIndex, action: step.action, windowClass: window.class, title: window.text,
          dimensions: window.capture.dimensions, file: `screenshots/${name}`, sha256: window.capture.sha256,
          visibleControlText: window.children.filter(c => c.visible && c.text).map(c => c.text) });
      }
    }
    capturedScenarios.push({ game, label, reference: capture.source, referenceSha256: capture.sha256,
      fixture: capture.fixture, setupAction: capture.setupAction, commands: capture.commands,
      rawRecord: `artifacts/m1/native/${game}/${label}.json`, screens, cleanup: capture.cleanup,
      observedExitCode: capture.steps.find(s => s.exitCode !== null)?.exitCode
        ?? (capture.cleanup?.terminationRequested === false ? capture.cleanup.exitCode : null),
      observationStatus: capture.error ? 'observation-error' : screens.length ? 'windows-captured' : 'no-window-captured',
      error: capture.error ?? null,
      captureFailures: capture.steps.flatMap((step, index) => step.windows
        .filter(w => w.capture && (w.capture.status !== 'captured' || !w.capture.painted))
        .map(w => ({ step: index, windowClass: w.class, result: w.capture }))),
      interpretation: 'Observed windows and controls only; see scenarios.md for assertions, caveats and follow-up checks.' });
  }
}
const report = {
  schemaVersion: 1,
  referenceSelection: 'Top-level SchiebPl.exe and DiffPl.exe are authoritative for the browser port; PanelPl.exe is inventoried but excluded from the implementation.',
  executables: manifest.executables.map(({ file, bytes, sha256, project, buildRole, machine, format }) => ({ file, bytes, sha256, project, buildRole, machine, format })),
  assetCoverage: manifest.coverage, mappingCoverage: mappings.coverage,
  manifestSha256: digest(manifestBytes),
  mappingsSha256: digest(await readFile(path.join(output, 'mappings.json'))),
  buildDifferences: manifest.comparisons.filter(c => c.kind !== 'reference-form-versus-source'),
  sourceImageDifferences: manifest.comparisons.filter(c => c.kind === 'reference-form-versus-source' && c.bitmapDifferences.length)
    .map(({ reference, source, bitmapDifferences }) => ({ reference, source, bitmapDifferences })),
  fixtures, capturedScenarios,
  limitations: [
    'Native captures use Windows working copies and owned-window messages, not a virtual machine or a registry sandbox.',
    'Legacy process startup may show windows despite SW_HIDE. Each owned process is terminated without normal preference-save shutdown.',
    'Audio files are omitted from the native working copies and audio is configured off; audio timing is untested.',
    'Screenshots may vary with system fonts, DPI, window size and random initial opponent selection.',
    'Complete matches, end scoring, all rule variants, AI parity and file-format compatibility for every fixture are later validation work.',
    'The current browser renderer approximates some legacy AND/OR masks with alpha; mappings preserve exact operations for the later fidelity fix.',
  ],
};
await writeFile(path.join(docs, 'reference.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`M1 report: ${fixtures.length} saved fixtures, ${capturedScenarios.length} native scenarios; docs/m1/reference.json`);
