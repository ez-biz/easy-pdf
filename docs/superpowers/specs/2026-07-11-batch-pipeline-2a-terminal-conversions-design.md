# Batch Pipeline 2a — Terminal Conversions — Design

> **Date:** 2026-07-11
> **Status:** Approved design, pre-implementation
> **Owner:** Anchit Gupta
> **Predecessor:** [Batch Pipeline Sub-project 1](2026-06-21-batch-pipeline-design.md) (shipped, PR #17)

## Summary

Extend the existing **Batch Process** tool (`/batch`) so a chain can **end** in a
type-changing conversion: **PDF→Word**, **PDF→Excel**, **PDF→PowerPoint**. Each
file still flows through the chain independently; the final step produces a
non-PDF artifact instead of a PDF.

This is **Sub-project 2a**, the first slice of the originally-scoped Sub-project 2.
It deliberately covers only **terminal, type-changing, count-preserving (1→1)**
steps. Count-changing steps (merge N→1, split 1→N) are a separate future slice
**2b** that requires reworking the engine's execution model — explicitly out of
scope here.

## Goals

- Let users batch-convert many PDFs to Word/Excel/PPT as the last step of a chain
  (e.g. *Compress → Rotate → PDF to Word* across 20 files → `results.zip`).
- Introduce a **lightweight type model** on operations plus a **pure chain
  validator**, so invalid chains (a step after a terminal step, or a type
  mismatch) are prevented — and so cardinality (merge/split) can be layered on
  later without redesign.
- Reuse the existing per-file engine **unchanged**; keep everything client-side.
- Deduplicate the conversion logic that currently lives inside a React hook.

## Non-goals (this slice)

- **Count-changing** steps: merge (N→1), split (1→N) — Sub-project 2b.
- **PDF→Image** — it is 1 PDF → N images (per-page fan-out), i.e. count-changing;
  belongs with 2b.
- **OCR** — pulls in WASM engines, language/model selection, and its own
  output-format decision (searchable PDF vs. text). Separate mini-project.
- **Word→PDF / Excel→PDF** — their input is not a PDF, so they cannot consume the
  output of a PDF pipeline whose uploader ingests PDFs.
- Per-step intra-conversion progress percentage (pipeline shows step-level
  progress only).

## Decisions (locked during brainstorming)

1. **Terminal ops in scope:** Word, Excel, PowerPoint only.
2. **Type model:** lightweight `inputType`/`outputType` media tags + a `terminal`
   flag, validated by a pure `validateChain()`. Not a full cardinality enum
   (YAGNI until 2b), not a bare boolean (too weak to validate compatibility).

## Key finding that makes this tractable

The conversion logic already exists as **near-pure `bytes → bytes` functions**
inside `src/hooks/useConversionWorker.ts`: `handlePdfToWord`,
`handlePdfToExcel`, `handlePdfToPptx` each take an `ArrayBuffer` and return
`{ data: ArrayBuffer }`. They are private to the hook and run on the main thread
(the "worker" name is a misnomer — pptx uses `document.createElement`). Extract
them and the pipeline can wrap them directly.

## Architecture

### 1. Extract conversion logic (refactor)

Move `handlePdfToWord` / `handlePdfToExcel` / `handlePdfToPptx` out of
`useConversionWorker.ts` into a new pure module **`src/lib/pdf/convert.ts`**,
exported as:

```ts
export type ConvertProgress = (pct: number, stage?: string) => void;
export function pdfToWord(input: Uint8Array, onProgress?: ConvertProgress): Promise<Uint8Array>;
export function pdfToExcel(input: Uint8Array, onProgress?: ConvertProgress): Promise<Uint8Array>;
export function pdfToPptx(input: Uint8Array, onProgress?: ConvertProgress): Promise<Uint8Array>;
```

- Logic moved verbatim; `onProgress` becomes optional (default no-op).
- `useConversionWorker` imports these — standalone convert tools behave
  identically (verified by typecheck + build + manual smoke; no existing unit
  tests on these tools today).

### 2. Type model

Extend `PdfOperation` in `src/lib/pipeline/types.ts`:

```ts
export type MediaType = "pdf" | "docx" | "xlsx" | "pptx";

export interface PdfOperation<TOptions = unknown> {
  // ...existing fields...
  inputType: MediaType;   // what this step consumes
  outputType: MediaType;  // what this step produces
  terminal?: boolean;     // true → nothing may follow
}
```

- The 7 existing ops set `inputType = outputType = "pdf"`, `terminal` unset.
- The 3 new conversion ops set `inputType = "pdf"`, `outputType = "docx"|"xlsx"|"pptx"`,
  `terminal = true`, and have **no options**. `OptionsForm` becomes **optional**
  on the interface (`OptionsForm?: FC<...>`); `StepList` renders no accordion when
  it is absent. (The 7 existing ops keep their forms — no change.)
- Extension comes from a `MediaType → ext` map:
  `{ pdf:"pdf", docx:"docx", xlsx:"xlsx", pptx:"pptx" }`.

### 3. Chain validation (new pure unit)

**`src/lib/pipeline/validateChain.ts`**

```ts
interface ChainValidation { errors: string[]; warnings: string[] }
function validateChain(steps: PipelineStep[], ops: Record<string, PdfOperation>): ChainValidation;
```

Rules:

| Rule | Kind | Message (approx) |
|------|------|------------------|
| First step's `inputType` must be `"pdf"` | error | "First step can't accept the uploaded PDFs." |
| Each step's `inputType` === previous step's `outputType` | error | "'X' can't run on the output of 'Y'." |
| No step may follow a `terminal` step | error | "Nothing can run after 'PDF to Word' — it's the final step." |
| **Protect must be last** (migrated from BatchClient) | error | existing copy |
| **Unlock works best first** (migrated) | warning | existing copy |

`canRun = files.length > 0 && steps.length > 0 && errors.length === 0`.
`BatchClient`'s inline `protectNotLast` / `softWarnings` / `canRun` logic
(currently `BatchClient.tsx:87-95`) is replaced by a single `validateChain` call.

**Protect + terminal conversion is inherently contradictory** (both demand the
last slot, and converting an encrypted PDF to Word is meaningless). No special
case is needed: "Protect must be last" and "terminal is last" both fire as
errors, so the chain is un-runnable until the user removes one. This is the
correct outcome — we simply surface both messages and let the user choose.

### 4. Engine — unchanged

`runPipeline` stays `bytes → bytes` per file; a terminal step is simply the last
step and is still one-in/one-out, so the tested engine core does not change.

The only new concern is **output naming**. The output extension for a run is
derived from the last step's `op.outputType`:

- `zipResults(successes, outputExt)` — swaps each entry's extension
  (`report.pdf → report.docx`), keeping existing collision de-duplication.
- Per-file download in `ResultsReport` uses the same derived extension.

When the chain has no terminal step, `outputExt` stays `"pdf"` (today's behavior).

### 5. UI

- **`OperationPicker`** — add a "Convert (changes output format)" group listing
  the 3 conversions. Once a terminal step exists in the chain, adding **any**
  further step is disabled (nothing can follow a terminal step).
- **`StepList`** — a terminal step card shows an output badge (e.g. `→ .docx`) and
  renders no options accordion.
- **Validation banner** — reuse the existing blocking-banner pattern in
  `BatchClient`, now driven by `validateChain().errors`; render `warnings` as the
  existing amber nudge.
- **`ResultsReport`** — success entries and `results.zip` use the derived
  extension; failure reporting unchanged.

## Testing (TDD — tests first)

Per project convention (`src/lib/**/__tests__`, Vitest + jsdom):

1. **`validateChain`** (pure, no pdf.js):
   - Valid count-preserving chain → no errors.
   - Valid chain ending in a terminal conversion → no errors.
   - A step placed after a terminal step → error.
   - Type mismatch (e.g. a `"docx"`-input step after a `"pdf"` output) → error.
   - Protect-not-last still blocks; Unlock-not-first still warns.
2. **Conversion wrappers** (`src/lib/pdf/convert.ts`), round-trip:
   - `pdfToWord/Excel/Pptx(validPdfBytes)` returns a non-empty `Uint8Array`
     beginning with the ZIP magic bytes `50 4B 03 04` (`PK\x03\x04`) — docx/xlsx/
     pptx are ZIP containers. Reuse existing pdf-lib byte helpers to build input.
3. **`zipResults`**:
   - Given a terminal `outputExt`, entries are renamed to that extension.
   - Existing entry-count and collision-de-duplication tests still pass.
4. Full suite + production build green; standalone convert tools still build.

## What ships

- 3 new terminal conversion operations in the batch tool (Word/Excel/PPT).
- `MediaType` type model on `PdfOperation`; pure `validateChain`.
- Extracted `src/lib/pdf/convert.ts` shared by the hook and the pipeline.
- Extension-aware `zipResults` + per-file download.
- No new dependencies (`docx`, `xlsx`, `pptxgenjs`, `jszip` already present).

## Future

- **2b:** count-changing steps (merge/split) — needs a fan-in/fan-out engine
  execution model, a results model no longer 1:1 with inputs, and reworked
  progress UI. PDF→Image folds in here.
- OCR as a pipeline step (its own slice).
- Pipeline presets; per-file (non-uniform) step options.
