# M1: original coordinate and semantic mappings

`node scripts/extract-reference-mappings.mjs` consumes the asset extractor's `artifacts/m1/manifest.json` and writes:

- `artifacts/m1/mappings.json`: original logical coordinates, numeric IDs, source-file hashes and source locations, asset bindings, mask pairs and card definitions.
- `artifacts/m1/mappings-gallery.html`: browsable piece, mask, icon, blend and card previews.
- `artifacts/m1/sprites/`: lossless original-resolution crops and clearly labelled mask-composite previews.

Run `node scripts/extract-reference-assets.mjs` first. These working outputs are regenerated from the ignored local archive; they do not alter `original/` or the browser's existing title-screen assets. No AI enhancement or image resizing is performed by either coordinate extraction or preview generation.

## Atlas authority

The coordinate tables come from `JassBmps.pas` and `ICONS.PAS` / `Icons.pas` in each project. The tool binds them to bitmap payloads extracted from the selected top-level executables (`SchiebPl.exe`, `DiffPl.exe`). It requires the relevant source-form and executable-form BMP hashes to agree before applying coordinates. Merely sharing a name or dimensions is insufficient. A mismatch stops generation for review rather than silently choosing a version.

This establishes that the source coordinate tables fit the same images. It does **not** prove that the executable's compiled coordinate instructions are identical; runtime comparison remains a separate check.

Both games retain their own mappings even where values coincide. Schieber has 121 interface pieces, Differenzler 128, and each game has 106 icon entries. Piece IDs are one-based. Icon semantic numbers such as 7006 and 5119 remain separate from their sequential table index. Right/bottom boundaries are exclusive.

Named `pr...` constants identify starts of ranges as well as single pieces. For example, the log border starts at 39; that name does not describe only one independent image. Source byte offsets and line numbers are recorded without rewriting legacy encodings.

## Masks and blending

`ShowMaskedPiece` and `ShowMaskedImage` perform two GDI operations:

```text
result RGB = (destination RGB AND mask RGB) OR foreground RGB
```

The manifest identifies the four log corners, four score corners, oriented name/name-active images, pencil, holder, Gloon states and Differenzler lever mask. Where a declared mask rectangle has different dimensions, the sampled rectangle follows the routine's actual foreground-sized copy at the mask origin; both facts are preserved.

Previews execute the exact bit operation against a grey checkerboard. They are **not** alpha assets, and white pixels are not removed from the foreground. Diagnostics report non-binary mask channels and nonzero foreground bits underneath passed mask channels. These cases should not be approximated by a single alpha value without checking the result.

The about-dialog `floatText`/`floatMask` and hint-dialog `Arm`/`ArmM` pairs are also bound to their executable payloads and previewed with the same exact operation. These are independent form images rather than subrectangles of the Pieces atlas.

`Blend1` and `Blend2` are separate 288 × 32 pattern sheets. All nine 32 × 32 factors (0–8) are retained for each sheet and each game. Their use in the legacy AND/OR drawing routines should be ported separately from ordinary transparency.

## Card identity and crop geometry

There are five sets: one in `Karten/Deutsch`, four in `Karten/Franz`. IDs 3 and 5 are flagged four-colour. The source set-type, filename-number and four-colour arrays are checked for equality between the games. Each set has two face-sheet sizes and two orientations, for 20 sheets and 720 raw card-cell previews.

Card ID is `9 * (colour - 1) + rank`; IDs 1–36 are faces, 0 is no card, and 37 is the back. Rank IDs 1–9 are Six, Seven, Eight, Nine, Ten, Knave, Queen, King and Ace. Preserve numeric IDs: the English colour constant names do not consistently match the French labels drawn to users. The source's displayed suit/rank labels are preserved separately in the manifest.

The display dimensions are 75 × 118 for size 1 and 97 × 151 for size 2. Raw vertical cells have pitches 74 × 117 and 96 × 150. Horizontal sheets place the suit columns in reversed order. The source drawing rectangles include `-1` offsets and border pixels; some intentionally extend beyond the sheet. The manifest records these without clamping, while previews show strictly bounded raw cells. Rounded clipping, outlines and the surrounding background belong to the renderer, not the extracted cell.

The area below the vertical card grid contains six trump symbols, six larger log-trump symbols, four small aces and a shared small-ace mask. These are mapped and previewed separately. The no-trump symbol slots are present in the sheets even though Differenzler's core uses only four suit trumps.

All 18 card-back files retain design IDs 0–2, size indices 0–2 and their H/V orientations. Size 0 has backs but no face sheets. Card-back drawing rectangles also begin at `(-1, -1)` and differ from raw bitmap dimensions; do not infer display size from the file alone.

## Verification

`node --test tests-node/mappings.test.mjs` checks the actual source tables, stable piece/icon identities, rectangle bounds, all card IDs in both orientations, deliberate drawing overhang and exact mask bit operations. The extractor validates every preview crop against image bounds and refuses missing, ambiguous or mismatched reference bindings. `mappings.json` includes a SHA-256 of the input asset manifest so the mapping can be tied to its exact extraction run.
