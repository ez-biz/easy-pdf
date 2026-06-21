# Batch Pipeline (Sub-project 1) — Design

> **Date:** 2026-06-21
> **Status:** Approved design, pre-implementation
> **Owner:** Anchit Gupta
> **Roadmap item:** Batch Processing (highest user demand, 52%)

## Summary

A new client-side tool, **Batch Process** (route `/batch`), where the user drops
many PDFs, builds an **ordered chain** of count-preserving PDF→PDF operations,
runs the chain over every file, and downloads a zip of the results. Each file
flows through the whole chain independently; failures are isolated per file.

This is **Sub-project 1** of a decomposed pipeline feature. It deliberately
covers only operations that compose cleanly. Count-changing (merge/split) and
type-changing (convert/OCR) steps are a future **Sub-project 2**.

## Goals

- Let users apply a sequence of operations to many PDFs in one run.
- Reuse the existing per-operation logic in `src/lib/pdf/` — wrap, don't rewrite.
- Keep everything client-side (no backend), consistent with the product's
  privacy model.
- Be well-bounded enough for a single implementation plan.

## Non-goals (v1)

- Interactive operations that need per-page visual placement: **add text, add
  image, redact**. (No meaningful "apply the same placement to many documents".)
- Count-changing operations: **merge (N→1), split (1→N)**.
- Type-changing / terminal operations: **pdf-to-word/excel/pptx/image, OCR**.
- Per-file (non-uniform) step options. v1 applies each step's options uniformly
  to all files.
- Retry-failed-only re-runs. (Deferred; "Start over" is available.)
- Saving/loading pipeline presets. (Possible future enhancement.)

## In-scope operations (v1)

All are count-preserving PDF→PDF and "configure once, apply to all":

| Operation | Wraps existing | Options (uniform) |
|-----------|----------------|-------------------|
| Compress | `lib/pdf/compress.ts` (worker) | level |
| Rotate | `lib/pdf/rotate.ts` | angle, page scope (all / odd / even) |
| Watermark | `lib/pdf/watermark.ts` | text/image, opacity, position |
| Page numbers | `lib/pdf/pageNumbers.ts` | format, position, start |
| Edit metadata | `lib/pdf/metadata.ts` | title, author, subject, keywords |
| Protect | `lib/pdf/security.ts` | password |
| Unlock | `lib/pdf/security.ts` | password |

## Architecture

Three new units plus a registry; no new dependencies (`jszip` and
`@dnd-kit/sortable` already in the project).

### (a) `PdfOperation` interface — the foundational abstraction

```ts
interface PdfOperation<TOptions> {
  id: string;                  // "compress", "watermark", ...
  label: string;
  icon: LucideIcon;
  defaultOptions: TOptions;
  // Accordion config UI for one step
  OptionsForm: React.FC<{ value: TOptions; onChange: (o: TOptions) => void }>;
  // Pure-ish transform: bytes in, bytes out. May internally use a worker.
  run(input: Uint8Array, options: TOptions): Promise<Uint8Array>;
}
```

- Lives in `src/lib/pipeline/operations/`, one file per operation.
- Each `run()` adapts an existing `lib/pdf` function, normalizing its varied
  signature to `(bytes, options) => bytes`.
- Compress's `run()` drives the existing conversion worker; the interface hides
  whether an op runs on the main thread or in a worker.
- A registry (`src/lib/pipeline/operations/index.ts`) exports the ordered list
  of available operations for the picker.

### (b) Pipeline engine — `src/lib/pipeline/runPipeline.ts`

Pure, framework-free, fully unit-testable (no pdf.js, no React).

```ts
interface PipelineStep { opId: string; options: unknown }

type FileStatus =
  | { file: File; status: "success"; bytes: Uint8Array; stepsRun: number }
  | { file: File; status: "failed"; failedStepIndex: number; opId: string; error: string };

async function runPipeline(
  files: File[],
  steps: PipelineStep[],
  ops: Record<string, PdfOperation<any>>,
  onProgress: (e: ProgressEvent) => void,
  signal?: AbortSignal,
): Promise<FileStatus[]>;
```

- For each file: run steps in order, feeding each step's output bytes into the
  next. Any thrown error → record `failed` with the step index/op/message and
  move to the next file (never throws for a single-file failure).
- Emits progress events (`file-start`, `step-done`, `file-done`) for the UI.
- `signal` supports Cancel: stop scheduling new files after the current one
  finishes; already-completed results are kept.

### (c) Zip assembly — `src/lib/pipeline/zipResults.ts`

Uses `jszip`. Takes the succeeded `FileStatus[]`, adds each output under its
original filename (de-duplicating collisions with a numeric suffix), returns a
`Blob`.

## Data flow

```
FileUploader (multiple)             →  pipeline store
  files: File[]                         { files, steps[], perStepOptions }
StepList (build/reorder/configure)  →  Run
  runPipeline(files, steps, ops, onProgress, signal)
     → streams progress → RunProgress
     → FileStatus[]      → ResultsReport → zipResults() / per-file download
```

State held as local React state in `BatchClient` (`useState`/`useReducer`),
matching the existing tool clients. No global store needed — a run is
self-contained to the page.

Because step options apply uniformly across files of differing page counts,
options must be **file-agnostic** (e.g. rotate uses a page *scope* like
all/odd/even, never specific page indices; page numbers use a format + start,
not a fixed count). Operation option schemas are designed accordingly.

## UI components

Route `src/app/(tools)/batch/` + `page.tsx` (SEO metadata) + new entry in the
tools registry (`src/lib/constants.ts`) and homepage card. Layout = **vertical
stepper**, single column (matches existing tools, mobile-first).

- `BatchClient.tsx` — orchestrator; owns files, steps, run state.
- `StepList.tsx` — vertical list of step cards; **inline accordion** to configure
  each; drag-to-reorder via `@dnd-kit/sortable`; add/remove.
- `OperationPicker.tsx` — "＋ Add operation" menu listing the 7 ops.
- `RunProgress.tsx` — live per-file checklist (✓ / ⟳ / • queued), overall
  progress bar, Cancel button.
- `ResultsReport.tsx` — "N succeeded · M failed" summary; per-failure reason
  (step + message); **Download results.zip** of successes; per-file download for
  any single success; "Start over".

## Error handling

- **Per-file isolation:** a file failing any step is marked failed (with step +
  reason) and excluded from the zip; other files continue.
- The engine records failures rather than throwing.
- **Ordering nudge (non-blocking):** warn if "Protect" is not the last step or
  "Unlock" is not the first, since those orderings usually break later steps.
  The user can proceed anyway.
- Empty states: disable Run when there are no files or no steps.

## Testing (TDD)

Write tests first, per project convention (`src/lib/**/__tests__`).

1. **Engine** (`runPipeline`) with **fake operations** — no pdf.js:
   - Steps run in order; output of step N feeds step N+1.
   - A step that throws fails only that file; other files complete.
   - Failed file excluded from results-success set; reason captured.
   - Progress events fire in the expected sequence.
   - Cancel stops scheduling further files; completed results retained.
2. **Operation wrappers** — round-trip: `run(validPdfBytes, opts)` returns a
   loadable PDF (reuse existing pdf-lib test helpers); protect→unlock round-trip.
3. **Zip** (`zipResults`) — correct entry count and names; filename-collision
   de-duplication.

## What ships

- Route `/batch`, name **"Batch Process"**, registry + homepage card.
- Reuses `MAX_FILES` / `MAX_FILE_SIZE`.
- No new dependencies.

## Future (Sub-project 2, out of scope here)

Extend the pipeline to count-changing (merge/split) and terminal type-changing
(convert/OCR) steps, with a type+cardinality model that keeps chains valid
(e.g. no PDF step after pdf-to-word). Optional: pipeline presets, per-file
options.
