# M1 — Reference builds and recovered assets

M1 establishes the reference material for the port. It does not implement rules or AI, enhance the remaining artwork, or establish full gameplay equivalence.

## Selected references

Use `original/SchiebPl.exe` and `original/DiffPl.exe` as the authoritative behavioral references. Their full SHA-256 identities, the alternate builds and the resource differences are recorded in [reference.json](reference.json). The launcher is inventoried for completeness and remains excluded from the browser implementation.

Both selected executables ran from working copies on this Windows machine. Captured scenarios include startup/setup, rules, one-/four-player table views, saved-game loading and archived-round viewing. See [scenarios.md](scenarios.md) for reproducible steps, observed results and explicit gaps. Selected screenshots are retained in `screenshots/`; the detailed window/control/menu records remain in the ignored working output.

## Reproduce the extraction

With the original archive present and dependencies installed:

```sh
npm run reference:extract
npm run reference:test
```

The extraction is read-only against `original/`. No enhancement or resizing is performed. It creates:

| Output | Purpose |
| --- | --- |
| `artifacts/m1/manifest.json` | Source and executable identities, form hierarchy/properties, image payload hashes, dimensions, file offsets, component paths, button properties and build comparisons |
| `artifacts/m1/gallery.html` | Searchable recovered-image gallery with source, reference-build and alternate-build labels |
| `artifacts/m1/raw/` | Deduplicated original image and serialized property payloads |
| `artifacts/m1/previews/` | Lossless decoded PNG previews |
| `artifacts/m1/mappings.json` | Numeric sprite/icon/card IDs, logical rectangles, named constants, masks and asset bindings |
| `artifacts/m1/mappings-gallery.html` | Individual sprite, mask-composite, card and symbol previews |
| `artifacts/m1/fixtures.json` | All 15 supplied `.JSS`/`.JAR` fixture identities, sizes and header inventory |
| `artifacts/m1/fixtures/` | Working copies of the saved files, retaining their bytes |
| `docs/m1/reference.json` | Compact evidence summary suitable for version control |

Open the galleries directly, or use the development server at `/artifacts/m1/gallery.html` and `/artifacts/m1/mappings-gallery.html`. They are local inspection tools, not production app pages. The full collection is kept outside `public/` and excluded from Git and the production build. The browser's small existing title-screen asset collection remains separate.

Re-running extraction is deterministic for the same input files. Run mappings after asset extraction: the mappings record and verify the exact manifest hash. `npm run reference:report` refreshes the compact summary after additional native captures without repeating image extraction. Native capture records are optional inputs: on a fresh machine, extraction alone does not establish runtime observations.

## Coverage and checks

- All 77 non-backup source forms: 74 binary Delphi streams and three text forms.
- All six executable resource trees: 133 compiled form streams.
- 586 image instances across source forms, executable forms, loose images and PE bitmap/icon resources; 233 distinct image payloads. These counts include duplicates between builds and VCL artwork.
- All 106 loose BMP/BM files and five loose icons; all 95 embedded source BMP instances and two embedded source icons.
- 249 interface pieces, 212 icon mappings, 41 piece-mask pairs, four additional form-mask pairs, 36 blend-pattern tiles, 720 card cells, extra card-sheet symbols and 18 card backs.
- Source and raw payload hashes are checked by the extraction tests. All 233 distinct decoded images were independently compared with Pillow: their generated PNG previews have identical decoded pixels.
- Nine tests cover parser structure/corruption, image row orientation and palette decoding, exhaustive source-form/resource recovery, original identities, coordinate bounds, card overhang and exact mask composition. Tests requiring the ignored archive must be run on a machine with that archive.
- The image gallery was exercised in Edge: all 586 entries loaded, filtering worked and no page errors were observed. Mapping previews were checked for representative cards, portraits and masks.

## Differences resolved for the port

The source and reference builds should not be mixed indiscriminately:

- Schieber's reference and alternate executable have 90 matching resource payloads and 24 differing payloads.
- Differenzler has 98 matching and 17 differing entries across the union of 115 resource identities. Its alternate build includes a different set of forms.
- All 33 panel resource payloads match between its executables, although their overall executable hashes differ.
- The random-deal dialog glyphs have different BMP bytes between source and reference, but **identical decoded pixels**. These are not visible artwork changes.
- Schieber's `DirtyDlg.NoBtn` does have different decoded pixels. The reference executable's payload is authoritative for that dialog.
- The Pieces and Icons atlas payloads used for coordinate mapping match between source and selected executables. Source coordinates are therefore bound to the same images; compiled drawing instructions have not been decompiled or proven identical.
- Source-only forms are explicitly listed in `reference.json` and the full manifest. Their assets remain available but are not assumed to be required by the selected build.

## Fidelity findings to retain

Read [mappings-notes.md](mappings-notes.md) before implementing more rendering. In particular:

1. Some masks require `(destination RGB AND mask RGB) OR foreground RGB`. Non-binary mask channels and foreground bits under masks mean that generic alpha conversion is not exact. M3 subsequently replaced the browser pencil/corner approximation with these exact RGB operations; see [rendering notes](../m3-rendering.md).
2. Card source rectangles deliberately overlap borders and can begin at `-1`. The bounded card-cell previews are not replacements for the original clipping and outline logic.
3. Preserve numeric card/suit identities. English constant names in the legacy code do not consistently match the French suit labels displayed to players.
4. A fixture's presence is not proof of compatibility. The selected Differenzler executable opens `diff.jss` and `TEST.JAR`, but exited when loading the older `TEST.JSS`; see the scenario record rather than treating all saves as interchangeable.

M1 is complete within this discovery/extraction scope. Full rule coverage, AI parity, audio timing and whole-match comparisons remain later milestones, with concrete reference material now available.
