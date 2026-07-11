# Batch Pipeline 2a — Terminal Conversions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the batch pipeline so a chain can end in a type-changing conversion (PDF→Word/Excel/PowerPoint), gated by a lightweight media-type model and a pure chain validator, reusing the per-file engine unchanged.

**Architecture:** Extract the existing conversion functions out of the `useConversionWorker` React hook into a pure `src/lib/pdf/convert.ts` shared by both the standalone convert tools and the pipeline. Add `inputType`/`outputType`/`terminal` to `PdfOperation`, three terminal conversion ops, and a pure `validateChain()` that also absorbs the existing Protect/Unlock ordering rules. The engine stays byte-in/byte-out; only output *naming* (extension + MIME) becomes type-aware.

**Tech Stack:** Next.js 16 / React 19, TypeScript, Vitest + jsdom, `pdfjs-dist`, `docx`, `xlsx`, `pptxgenjs`, `jszip` (all already in the project).

## Global Constraints

- **No new dependencies.** All libraries needed are already present.
- **Client-side only.** No backend/network calls.
- **Test framework:** Vitest (`npm test` → `vitest run`); tests live in `src/**/__tests__/*.test.ts`.
- **Conversion scope:** Word, Excel, PowerPoint only. No merge/split, PDF→Image, OCR, or Word/Excel→PDF.
- **No regression to standalone convert tools:** they read `details.pageCount` — the extracted functions MUST still return a page count.
- **Verification per task:** `npm test` (all pass) and, for tasks touching app code, `npx tsc --noEmit` clean. Final task also runs `npm run build`.
- **Commit after every task.**

---

### Task 1: Extract conversion logic into a pure module

**Files:**
- Create: `src/lib/pdf/convert.ts`
- Create: `src/lib/pdf/__tests__/convert.test.ts`
- Modify: `src/hooks/useConversionWorker.ts` (replace the three inlined handlers with imports)

**Interfaces:**
- Produces:
  - `type ConvertProgress = (pct: number, stage?: string) => void`
  - `pdfToWord(input: Uint8Array, onProgress?: ConvertProgress): Promise<{ bytes: Uint8Array; pageCount: number }>`
  - `pdfToExcel(input: Uint8Array, onProgress?: ConvertProgress): Promise<{ bytes: Uint8Array; pageCount: number }>`
  - `pdfToPptx(input: Uint8Array, onProgress?: ConvertProgress): Promise<{ bytes: Uint8Array; pageCount: number }>`

- [ ] **Step 1: Write the failing test**

Create `src/lib/pdf/__tests__/convert.test.ts`. A valid one-page PDF is built with `pdf-lib` (already used across the repo). DOCX/XLSX/PPTX are ZIP containers, so the output must start with the ZIP magic bytes `50 4B 03 04`.

```ts
import { describe, it, expect } from "vitest";
import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import { pdfToWord, pdfToExcel, pdfToPptx } from "../convert";

async function samplePdf(): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([300, 300]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    page.drawText("Hello batch", { x: 20, y: 250, size: 18, font });
    return doc.save();
}

const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04];

function startsWithZipMagic(bytes: Uint8Array): boolean {
    return ZIP_MAGIC.every((b, i) => bytes[i] === b);
}

describe("pdf conversions", () => {
    it("pdfToWord returns a non-empty .docx (zip) with a page count", async () => {
        const { bytes, pageCount } = await pdfToWord(await samplePdf());
        expect(bytes.length).toBeGreaterThan(0);
        expect(startsWithZipMagic(bytes)).toBe(true);
        expect(pageCount).toBe(1);
    });

    it("pdfToExcel returns a non-empty .xlsx (zip)", async () => {
        const { bytes } = await pdfToExcel(await samplePdf());
        expect(startsWithZipMagic(bytes)).toBe(true);
    });

    it("pdfToPptx returns a non-empty .pptx (zip)", async () => {
        const { bytes } = await pdfToPptx(await samplePdf());
        expect(startsWithZipMagic(bytes)).toBe(true);
    });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/pdf/__tests__/convert.test.ts`
Expected: FAIL — `Failed to resolve import "../convert"` / module not found.

- [ ] **Step 3: Create `src/lib/pdf/convert.ts`**

Move the bodies of `handlePdfToWord`, `handlePdfToExcel`, `handlePdfToPptx` **verbatim** from `src/hooks/useConversionWorker.ts` (current lines 26–256) into this new module, applying exactly these mechanical changes to each:

1. Signature: `(input: Uint8Array, onProgress: ConvertProgress = () => {})` instead of `(buffer, onProgress)`.
2. The pdf.js load line becomes `pdfjsLib.getDocument({ data: input }).promise` (drop `new Uint8Array(buffer)`).
3. The return becomes `{ bytes: new Uint8Array(<existingArrayBuffer>), pageCount: totalPages }` where `<existingArrayBuffer>` is the value each handler currently puts in `data` (`await docxBlob.arrayBuffer()` for Word; `excelBuffer` for Excel; `pptxOutput as ArrayBuffer` for PPT).

The file header and the exported names:

```ts
// Pure PDF→Office conversions. Extracted from useConversionWorker so both the
// standalone convert tools AND the batch pipeline can call them. Runs on the
// main thread (pptx uses a <canvas>); the previous "worker" name was a misnomer.
export type ConvertProgress = (pct: number, stage?: string) => void;

interface ConvertResult {
    bytes: Uint8Array;
    pageCount: number;
}

export async function pdfToWord(input: Uint8Array, onProgress: ConvertProgress = () => {}): Promise<ConvertResult> {
    // …verbatim body from handlePdfToWord, with the 3 changes above…
    // final line: return { bytes: new Uint8Array(await docxBlob.arrayBuffer()), pageCount: totalPages };
}

export async function pdfToExcel(input: Uint8Array, onProgress: ConvertProgress = () => {}): Promise<ConvertResult> {
    // …verbatim body from handlePdfToExcel…
    // final line: return { bytes: new Uint8Array(excelBuffer), pageCount: totalPages };
    // NOTE: XLSX.write(..., { type: "array" }) returns a Uint8Array already; wrap defensively with new Uint8Array(excelBuffer).
}

export async function pdfToPptx(input: Uint8Array, onProgress: ConvertProgress = () => {}): Promise<ConvertResult> {
    // …verbatim body from handlePdfToPptx…
    // final line: return { bytes: new Uint8Array(pptxOutput as ArrayBuffer), pageCount: totalPages };
}
```

Keep the lazy `await import(...)` calls (`pdfjs-dist`, `docx`, `xlsx`, `pptxgenjs`) exactly as they are.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/pdf/__tests__/convert.test.ts`
Expected: PASS (3 tests). If jsdom lacks `canvas` for the pptx test, see note below.

> **PPTX/canvas note:** `pdfToPptx` calls `page.render({ canvasContext })`. jsdom's canvas is a stub. If the pptx test throws on canvas, keep the Word and Excel assertions as-is and change the pptx test to assert the function is defined and rejects/resolves without a type error, OR guard the render. Prefer: if canvas is unavailable in jsdom, mark the pptx round-trip test `it.skip` with a comment that it is covered by the standalone tool + build, and keep Word/Excel round-trips (those don't use canvas). Do not add a canvas dependency.

- [ ] **Step 5: Rewire `useConversionWorker.ts` to import the extracted functions**

Delete the three `handlePdf*` function definitions (lines 26–256). Add at the top:

```ts
import { pdfToWord, pdfToExcel, pdfToPptx } from "@/lib/pdf/convert";
```

Replace the three matching `case` bodies in `process()` so each adapts the new return shape to the existing `ConversionResult` (`{ data: ArrayBuffer; details }`):

```ts
case "pdf-to-word": {
    const { bytes, pageCount } = await pdfToWord(new Uint8Array(buffer), onProgress);
    result = { data: bytes.buffer as ArrayBuffer, details: { pageCount } };
    break;
}
case "pdf-to-excel": {
    const { bytes, pageCount } = await pdfToExcel(new Uint8Array(buffer), onProgress);
    result = { data: bytes.buffer as ArrayBuffer, details: { pageCount } };
    break;
}
case "pdf-to-pptx": {
    const { bytes, pageCount } = await pdfToPptx(new Uint8Array(buffer), onProgress);
    result = { data: bytes.buffer as ArrayBuffer, details: { pageCount } };
    break;
}
```

Leave `word-to-pdf` and `excel-to-pdf` (`handleWordToPdf` / `handleExcelToPdf`) untouched in the hook — they are out of scope and still used by their standalone tools.

- [ ] **Step 6: Verify typecheck + full suite + standalone build**

Run: `npx tsc --noEmit && npm test`
Expected: tsc clean; all tests pass (including the new convert tests).

- [ ] **Step 7: Commit**

```bash
git add src/lib/pdf/convert.ts src/lib/pdf/__tests__/convert.test.ts src/hooks/useConversionWorker.ts
git commit -m "refactor(convert): extract pdf→office conversions into pure src/lib/pdf/convert.ts"
```

---

### Task 2: Add the MediaType model to operations

**Files:**
- Create: `src/lib/pipeline/mediaType.ts`
- Modify: `src/lib/pipeline/types.ts` (add fields to `PdfOperation`)
- Modify: the 7 existing op files in `src/lib/pipeline/operations/` (add `inputType`/`outputType`)

**Interfaces:**
- Produces:
  - `type MediaType = "pdf" | "docx" | "xlsx" | "pptx"`
  - `const MEDIA_META: Record<MediaType, { ext: string; mime: string }>`
  - `PdfOperation` gains `inputType: MediaType`, `outputType: MediaType`, `terminal?: boolean`.

- [ ] **Step 1: Create `src/lib/pipeline/mediaType.ts`**

```ts
/** Media types an operation can consume/produce. Extend when adding new outputs. */
export type MediaType = "pdf" | "docx" | "xlsx" | "pptx";

/** Download extension + MIME type for each media type. */
export const MEDIA_META: Record<MediaType, { ext: string; mime: string }> = {
    pdf: { ext: "pdf", mime: "application/pdf" },
    docx: { ext: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
    xlsx: { ext: "xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    pptx: { ext: "pptx", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
};
```

- [ ] **Step 2: Add fields to `PdfOperation` in `src/lib/pipeline/types.ts`**

Add the import and the three fields (place `inputType`/`outputType`/`terminal` right after `icon`):

```ts
import type { MediaType } from "./mediaType";
```

```ts
export interface PdfOperation<TOptions = unknown> {
    id: string;
    label: string;
    icon: LucideIcon;
    /** Media type this step consumes. The chain starts at "pdf" (uploader). */
    inputType: MediaType;
    /** Media type this step produces. */
    outputType: MediaType;
    /** True → this is a final step; nothing may run after it. */
    terminal?: boolean;
    defaultOptions: TOptions;
    OptionsForm: FC<{ value: TOptions; onChange: (next: TOptions) => void }>;
    run(input: Uint8Array, options: TOptions): Promise<Uint8Array>;
}
```

- [ ] **Step 3: Run typecheck to see the 7 expected errors**

Run: `npx tsc --noEmit`
Expected: FAIL — 7 errors, one per existing op file, "Property 'inputType' is missing …". This confirms every op is found.

- [ ] **Step 4: Add `inputType: "pdf", outputType: "pdf"` to each existing op**

In each of these files, add `inputType: "pdf", outputType: "pdf",` to the exported op object literal (they are all count-preserving PDF→PDF):

- `src/lib/pipeline/operations/compress.ts` → `compressOp`
- `src/lib/pipeline/operations/rotate.ts` → `rotateOp`
- `src/lib/pipeline/operations/watermark.ts` → `watermarkOp`
- `src/lib/pipeline/operations/pageNumbers.ts` → `pageNumbersOp`
- `src/lib/pipeline/operations/metadata.ts` → `metadataOp`
- `src/lib/pipeline/operations/protect.ts` → `protectOp`
- `src/lib/pipeline/operations/unlock.ts` → `unlockOp`

Example for `compress.ts`:

```ts
export const compressOp: PdfOperation<CompressOptions> = {
    id: "compress", label: "Compress", icon: Minimize2,
    inputType: "pdf", outputType: "pdf",
    defaultOptions: {},
    OptionsForm: () => null,
    async run(input) {
        const res = await compressPDF(bytesToFile(input));
        if (!res.success || !res.data) throw new Error(res.error ?? "Compress failed");
        return res.data;
    },
};
```

- [ ] **Step 5: Verify typecheck + tests pass**

Run: `npx tsc --noEmit && npm test`
Expected: tsc clean; all existing tests pass (no behavior change).

- [ ] **Step 6: Commit**

```bash
git add src/lib/pipeline/mediaType.ts src/lib/pipeline/types.ts src/lib/pipeline/operations/*.ts
git commit -m "feat(pipeline): add MediaType model (inputType/outputType/terminal) to PdfOperation"
```

---

### Task 3: Add the three terminal conversion operations

**Files:**
- Create: `src/lib/pipeline/operations/convertWord.ts`
- Create: `src/lib/pipeline/operations/convertExcel.ts`
- Create: `src/lib/pipeline/operations/convertPptx.ts`
- Modify: `src/lib/pipeline/operations/index.ts` (register them)
- Modify: `src/lib/pipeline/__tests__/operations.test.ts` (registry assertions)

**Interfaces:**
- Consumes: `pdfToWord`/`pdfToExcel`/`pdfToPptx` (Task 1); `PdfOperation`, `MediaType` (Task 2).
- Produces: `convertWordOp`, `convertExcelOp`, `convertPptxOp`; the ids `"pdf-to-word"`, `"pdf-to-excel"`, `"pdf-to-pptx"` in `OPERATIONS`/`OPERATION_LIST`.

- [ ] **Step 1: Write the failing registry test**

Append to `src/lib/pipeline/__tests__/operations.test.ts`:

```ts
import { OPERATIONS } from "../operations";

describe("terminal conversion operations", () => {
    it.each([
        ["pdf-to-word", "docx"],
        ["pdf-to-excel", "xlsx"],
        ["pdf-to-pptx", "pptx"],
    ])("%s is a terminal pdf→%s op", (id, outputType) => {
        const op = OPERATIONS[id];
        expect(op).toBeDefined();
        expect(op.inputType).toBe("pdf");
        expect(op.outputType).toBe(outputType);
        expect(op.terminal).toBe(true);
    });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/pipeline/__tests__/operations.test.ts`
Expected: FAIL — `op` is undefined for the new ids.

- [ ] **Step 3: Create the three op files**

`src/lib/pipeline/operations/convertWord.ts`:

```ts
import { FileText } from "lucide-react";
import { pdfToWord } from "@/lib/pdf/convert";
import type { PdfOperation } from "../types";

export const convertWordOp: PdfOperation = {
    id: "pdf-to-word", label: "PDF to Word", icon: FileText,
    inputType: "pdf", outputType: "docx", terminal: true,
    defaultOptions: {},
    OptionsForm: () => null,
    async run(input) {
        return (await pdfToWord(input)).bytes;
    },
};
```

`src/lib/pipeline/operations/convertExcel.ts`:

```ts
import { FileSpreadsheet } from "lucide-react";
import { pdfToExcel } from "@/lib/pdf/convert";
import type { PdfOperation } from "../types";

export const convertExcelOp: PdfOperation = {
    id: "pdf-to-excel", label: "PDF to Excel", icon: FileSpreadsheet,
    inputType: "pdf", outputType: "xlsx", terminal: true,
    defaultOptions: {},
    OptionsForm: () => null,
    async run(input) {
        return (await pdfToExcel(input)).bytes;
    },
};
```

`src/lib/pipeline/operations/convertPptx.ts`:

```ts
import { Presentation } from "lucide-react";
import { pdfToPptx } from "@/lib/pdf/convert";
import type { PdfOperation } from "../types";

export const convertPptxOp: PdfOperation = {
    id: "pdf-to-pptx", label: "PDF to PowerPoint", icon: Presentation,
    inputType: "pdf", outputType: "pptx", terminal: true,
    defaultOptions: {},
    OptionsForm: () => null,
    async run(input) {
        return (await pdfToPptx(input)).bytes;
    },
};
```

> Icons `FileText`, `FileSpreadsheet`, `Presentation` all exist in `lucide-react`.

- [ ] **Step 4: Register them in `src/lib/pipeline/operations/index.ts`**

```ts
import type { PdfOperation } from "../types";
import { compressOp } from "./compress";
import { rotateOp } from "./rotate";
import { watermarkOp } from "./watermark";
import { pageNumbersOp } from "./pageNumbers";
import { metadataOp } from "./metadata";
import { protectOp } from "./protect";
import { unlockOp } from "./unlock";
import { convertWordOp } from "./convertWord";
import { convertExcelOp } from "./convertExcel";
import { convertPptxOp } from "./convertPptx";

// Order shown in the "Add operation" picker. Terminal conversions last.
export const OPERATION_LIST: PdfOperation[] = [
    compressOp, rotateOp, watermarkOp, pageNumbersOp, metadataOp, protectOp, unlockOp,
    convertWordOp, convertExcelOp, convertPptxOp,
] as PdfOperation[];

export const OPERATIONS: Record<string, PdfOperation> = Object.fromEntries(
    OPERATION_LIST.map((op) => [op.id, op]),
);
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/lib/pipeline/__tests__/operations.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/pipeline/operations/convertWord.ts src/lib/pipeline/operations/convertExcel.ts src/lib/pipeline/operations/convertPptx.ts src/lib/pipeline/operations/index.ts src/lib/pipeline/__tests__/operations.test.ts
git commit -m "feat(pipeline): add terminal PDF→Word/Excel/PPT conversion operations"
```

---

### Task 4: Pure chain validator

**Files:**
- Create: `src/lib/pipeline/validateChain.ts`
- Create: `src/lib/pipeline/__tests__/validateChain.test.ts`

**Interfaces:**
- Consumes: `PdfOperation`, `PipelineStep` (types), `MediaType`.
- Produces: `validateChain(steps, ops): { errors: string[]; warnings: string[] }`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/pipeline/__tests__/validateChain.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { validateChain } from "../validateChain";
import type { MediaType, PdfOperation, PipelineStep } from "../types";

const mk = (id: string, label: string, inputType: MediaType, outputType: MediaType, terminal = false) =>
    ({ id, label, inputType, outputType, terminal }) as unknown as PdfOperation;

const OPS: Record<string, PdfOperation> = {
    compress: mk("compress", "Compress", "pdf", "pdf"),
    rotate: mk("rotate", "Rotate", "pdf", "pdf"),
    protect: mk("protect", "Protect", "pdf", "pdf"),
    unlock: mk("unlock", "Unlock", "pdf", "pdf"),
    "pdf-to-word": mk("pdf-to-word", "PDF to Word", "pdf", "docx", true),
    "needs-docx": mk("needs-docx", "Word Edit", "docx", "docx"),
};

const step = (opId: string): PipelineStep => ({ id: `${opId}-1`, opId, options: {} });

describe("validateChain", () => {
    it("accepts a valid count-preserving PDF chain", () => {
        const { errors, warnings } = validateChain([step("compress"), step("rotate")], OPS);
        expect(errors).toEqual([]);
        expect(warnings).toEqual([]);
    });

    it("accepts a chain ending in a terminal conversion", () => {
        const { errors } = validateChain([step("compress"), step("pdf-to-word")], OPS);
        expect(errors).toEqual([]);
    });

    it("rejects a step after a terminal step", () => {
        const { errors } = validateChain([step("pdf-to-word"), step("rotate")], OPS);
        expect(errors).toContain('Nothing can run after "PDF to Word" — it must be the last step.');
    });

    it("rejects a type mismatch (docx-input step on a PDF)", () => {
        const { errors } = validateChain([step("needs-docx")], OPS);
        expect(errors).toContain('"Word Edit" can\'t run on the uploaded PDF.');
    });

    it("blocks Protect when it is not the last step", () => {
        const { errors } = validateChain([step("protect"), step("compress")], OPS);
        expect(errors.some((e) => e.startsWith('Move "Protect"'))).toBe(true);
    });

    it("allows Protect as the last step", () => {
        const { errors } = validateChain([step("compress"), step("protect")], OPS);
        expect(errors.some((e) => e.startsWith('Move "Protect"'))).toBe(false);
    });

    it("warns (not errors) when Unlock is not first", () => {
        const { errors, warnings } = validateChain([step("compress"), step("unlock")], OPS);
        expect(errors).toEqual([]);
        expect(warnings).toContain("Unlock usually works best as the first step.");
    });
});
```

> Note: this test imports `MediaType` from `../types`. Re-export it there (Step 3).

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/pipeline/__tests__/validateChain.test.ts`
Expected: FAIL — module `../validateChain` not found.

- [ ] **Step 3: Re-export `MediaType` from `types.ts`**

In `src/lib/pipeline/types.ts`, add (near the top import) a re-export so consumers can import it from `./types`:

```ts
export type { MediaType } from "./mediaType";
```

- [ ] **Step 4: Create `src/lib/pipeline/validateChain.ts`**

```ts
import type { MediaType, PdfOperation, PipelineStep } from "./types";

export interface ChainValidation {
    errors: string[];
    warnings: string[];
}

/**
 * Pure validation of a step chain. `errors` block running; `warnings` are nudges.
 * The uploader always provides PDFs, so the chain's input type starts at "pdf".
 */
export function validateChain(
    steps: PipelineStep[],
    ops: Record<string, PdfOperation>,
): ChainValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Type continuity: each step must accept the previous step's output.
    let prevOut: MediaType = "pdf";
    let prevLabel = "the uploaded PDF";
    let prevTerminal = false;
    for (const s of steps) {
        const op = ops[s.opId];
        if (!op) continue;
        // A terminal predecessor is already reported by rule 2 — don't double-report.
        if (!prevTerminal && op.inputType !== prevOut) {
            errors.push(`"${op.label}" can't run on ${prevLabel}.`);
        }
        prevOut = op.outputType;
        prevLabel = `the output of "${op.label}"`;
        prevTerminal = op.terminal === true;
    }

    // 2. A terminal step must be the last step.
    for (let i = 0; i < steps.length - 1; i++) {
        const op = ops[steps[i].opId];
        if (op?.terminal) {
            errors.push(`Nothing can run after "${op.label}" — it must be the last step.`);
        }
    }

    // 3. Protect must be last (a later re-saving op silently strips encryption).
    const protectIdx = steps.findIndex((s) => s.opId === "protect");
    if (protectIdx !== -1 && protectIdx !== steps.length - 1) {
        errors.push(
            'Move "Protect" to the last step. Any operation after it removes the password protection, leaving the output unencrypted.',
        );
    }

    // 4. Unlock works best first (soft nudge).
    const unlockIdx = steps.findIndex((s) => s.opId === "unlock");
    if (unlockIdx > 0) {
        warnings.push("Unlock usually works best as the first step.");
    }

    return { errors, warnings };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/lib/pipeline/__tests__/validateChain.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/pipeline/validateChain.ts src/lib/pipeline/__tests__/validateChain.test.ts src/lib/pipeline/types.ts
git commit -m "feat(pipeline): add pure validateChain (type continuity, terminal-last, protect/unlock rules)"
```

---

### Task 5: Extension-aware zip + filename helper

**Files:**
- Modify: `src/lib/pipeline/zipResults.ts`
- Modify: `src/lib/pipeline/__tests__/zipResults.test.ts`

**Interfaces:**
- Produces:
  - `withExtension(name: string, ext: string): string` (exported)
  - `buildZip(results: FileStatus[], outputExt?: string): JSZip`
  - `zipResults(results: FileStatus[], outputExt?: string): Promise<Blob>`

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/pipeline/__tests__/zipResults.test.ts`:

```ts
import { buildZip, withExtension } from "../zipResults";

describe("withExtension", () => {
    it("swaps the extension", () => {
        expect(withExtension("report.pdf", "docx")).toBe("report.docx");
    });
    it("appends when there is no extension", () => {
        expect(withExtension("report", "docx")).toBe("report.docx");
    });
    it("only replaces the final extension", () => {
        expect(withExtension("my.report.pdf", "docx")).toBe("my.report.docx");
    });
});

describe("buildZip with outputExt", () => {
    it("renames entries to the output extension", () => {
        const zip = buildZip([ok("report.pdf")], "docx");
        expect(Object.keys(zip.files)).toEqual(["report.docx"]);
    });
    it("de-duplicates after the extension swap", () => {
        const zip = buildZip([ok("report.pdf"), ok("report.pdf")], "docx");
        expect(Object.keys(zip.files).sort()).toEqual(["report (1).docx", "report.docx"]);
    });
});
```

(`ok` is already defined at the top of this test file.)

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/pipeline/__tests__/zipResults.test.ts`
Expected: FAIL — `withExtension` is not exported; `buildZip` ignores the 2nd arg.

- [ ] **Step 3: Update `src/lib/pipeline/zipResults.ts`**

```ts
import JSZip from "jszip";
import type { FileStatus } from "./types";

function dedupe(name: string, used: Set<string>): string {
    if (!used.has(name)) { used.add(name); return name; }
    const dot = name.lastIndexOf(".");
    const base = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot) : "";
    let n = 1;
    let candidate = `${base} (${n})${ext}`;
    while (used.has(candidate)) { n++; candidate = `${base} (${n})${ext}`; }
    used.add(candidate);
    return candidate;
}

/** Replace a filename's final extension (or append if it has none). */
export function withExtension(name: string, ext: string): string {
    const dot = name.lastIndexOf(".");
    const base = dot > 0 ? name.slice(0, dot) : name;
    return `${base}.${ext}`;
}

/** Build (but don't serialize) a zip of all succeeded outputs. */
export function buildZip(results: FileStatus[], outputExt?: string): JSZip {
    const zip = new JSZip();
    const used = new Set<string>();
    for (const r of results) {
        if (r.status !== "success") continue;
        const name = outputExt ? withExtension(r.name, outputExt) : r.name;
        zip.file(dedupe(name, used), r.bytes);
    }
    return zip;
}

/** Serialize the success zip to a Blob for download. */
export async function zipResults(results: FileStatus[], outputExt?: string): Promise<Blob> {
    return buildZip(results, outputExt).generateAsync({ type: "blob" });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/pipeline/__tests__/zipResults.test.ts`
Expected: PASS (existing + new).

- [ ] **Step 5: Commit**

```bash
git add src/lib/pipeline/zipResults.ts src/lib/pipeline/__tests__/zipResults.test.ts
git commit -m "feat(pipeline): make zip output extension-aware (withExtension + buildZip outputExt)"
```

---

### Task 6: Wire BatchClient to validateChain + output type

**Files:**
- Modify: `src/app/(tools)/batch/BatchClient.tsx`

**Interfaces:**
- Consumes: `validateChain` (Task 4); `MEDIA_META`, `MediaType` (Task 2); `OPERATIONS`.
- Produces: passes `outputType: MediaType` to `ResultsReport` (consumed in Task 8); passes `disabled: boolean` to `OperationPicker` (consumed in Task 7).

- [ ] **Step 1: Add imports**

```ts
import { validateChain } from "@/lib/pipeline/validateChain";
import type { MediaType } from "@/lib/pipeline/types";
```

- [ ] **Step 2: Add output-type state and set it when a run starts**

Add near the other `useState` declarations:

```ts
const [outputType, setOutputType] = useState<MediaType>("pdf");
```

Inside `run()`, right before `setPhase("running");`, capture the final step's output type (steps don't change during a run):

```ts
const lastOp = steps.length ? OPERATIONS[steps[steps.length - 1].opId] : null;
setOutputType(lastOp?.outputType ?? "pdf");
```

- [ ] **Step 3: Replace the inline ordering logic with `validateChain`**

Delete the block currently at lines 87–95 (`protectIdx`/`unlockIdx`/`protectNotLast`/`softWarnings`/`canRun`) and replace with:

```ts
const { errors, warnings } = validateChain(steps, OPERATIONS);
const hasTerminal = steps.some((s) => OPERATIONS[s.opId]?.terminal);
const canRun = files.length > 0 && steps.length > 0 && errors.length === 0;
```

- [ ] **Step 4: Update the build-phase JSX**

Replace the `OperationPicker` usage and the two banner blocks (`protectNotLast` and `softWarnings`) with:

```tsx
<OperationPicker onAdd={addStep} disabled={hasTerminal} />
{errors.map((e) => (
    <div key={e} className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
        <AlertTriangle className="w-4 h-4 inline mr-1" />{e}
    </div>
))}
{warnings.length > 0 && (
    <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-200">
        {warnings.map((w) => <p key={w}><AlertTriangle className="w-4 h-4 inline mr-1" />{w}</p>)}
    </div>
)}
```

- [ ] **Step 5: Pass `outputType` to `ResultsReport`**

```tsx
<ResultsReport results={results} outputType={outputType} onReset={reset} />
```

> This introduces a type error until Task 8 adds the prop. That's expected — Tasks 6–8 land together conceptually; run the full typecheck at the end of Task 8. To keep this task independently committable, temporarily also accept it in Task 8. Commit this task now; tsc may report the missing `ResultsReport`/`OperationPicker` props until those tasks complete.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(tools)/batch/BatchClient.tsx"
git commit -m "feat(batch): drive validation via validateChain; track output type"
```

---

### Task 7: OperationPicker — group conversions + disable after a terminal step

**Files:**
- Modify: `src/components/tools/batch/OperationPicker.tsx`

**Interfaces:**
- Consumes: `disabled: boolean` from BatchClient (Task 6); `op.terminal` (Task 2).

- [ ] **Step 1: Rewrite `OperationPicker.tsx`**

```tsx
"use client";
import { Plus } from "lucide-react";
import { useState } from "react";
import { OPERATION_LIST } from "@/lib/pipeline/operations";
import type { PdfOperation } from "@/lib/pipeline/types";

export function OperationPicker({ onAdd, disabled = false }: { onAdd: (opId: string) => void; disabled?: boolean }) {
    const [open, setOpen] = useState(false);
    const regular = OPERATION_LIST.filter((op) => !op.terminal);
    const terminal = OPERATION_LIST.filter((op) => op.terminal);

    const item = (op: PdfOperation) => {
        const Icon = op.icon;
        return (
            <button key={op.id} type="button"
                onClick={() => { onAdd(op.id); setOpen(false); }}
                className="w-full flex items-center gap-2 p-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                <Icon className="w-4 h-4 text-primary-500" /> {op.label}
            </button>
        );
    };

    return (
        <div className="relative">
            <button type="button" disabled={disabled} onClick={() => setOpen((o) => !o)}
                title={disabled ? "Remove the final conversion step to add more operations" : undefined}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-3 text-sm text-gray-600 dark:text-gray-300 hover:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300">
                <Plus className="w-4 h-4" /> Add operation
            </button>
            {open && !disabled && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                    {regular.map(item)}
                    {terminal.length > 0 && (
                        <div className="px-2 py-1 text-xs text-gray-400 border-t border-gray-100 dark:border-gray-700">
                            Convert (final step — changes output format)
                        </div>
                    )}
                    {terminal.map(item)}
                </div>
            )}
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/tools/batch/OperationPicker.tsx
git commit -m "feat(batch): group conversions in picker and disable adding after a terminal step"
```

---

### Task 8: StepList terminal badge + ResultsReport extension naming

**Files:**
- Modify: `src/components/tools/batch/StepList.tsx`
- Modify: `src/components/tools/batch/ResultsReport.tsx`

**Interfaces:**
- Consumes: `op.terminal`, `op.outputType`, `MEDIA_META`, `MediaType` (Task 2); `withExtension`, `zipResults` (Task 5); `outputType` prop from BatchClient (Task 6).

- [ ] **Step 1: StepList — badge on terminal steps + a no-options note**

In `src/components/tools/batch/StepList.tsx`, add the import:

```ts
import { MEDIA_META } from "@/lib/pipeline/mediaType";
```

In `StepCard`, add a badge after the label span (inside the header row, before the expand button):

```tsx
<span className="flex-1 text-sm font-medium">{op.label}</span>
{op.terminal && (
    <span className="rounded bg-primary-100 dark:bg-primary-900/40 px-1.5 py-0.5 text-xs text-primary-700 dark:text-primary-300">
        → .{MEDIA_META[op.outputType].ext}
    </span>
)}
```

Extend the expanded-body branch to handle terminal ops (they have `OptionsForm: () => null`):

```tsx
{expanded && (
    <div className="border-t border-gray-100 dark:border-gray-700 p-3">
        {op.terminal
            ? <p className="text-sm text-gray-500">Converts each PDF to .{MEDIA_META[op.outputType].ext} — no options. Must be the final step.</p>
            : op.id === "compress"
                ? <p className="text-sm text-gray-500">Optimizes structure and strips unused objects. No options.</p>
                : <Form value={step.options} onChange={(options) => onChange({ ...step, options })} />}
    </div>
)}
```

- [ ] **Step 2: ResultsReport — accept `outputType`, name outputs with ext + MIME**

Rewrite `src/components/tools/batch/ResultsReport.tsx`:

```tsx
"use client";
import { Check, X, Download, RotateCcw } from "lucide-react";
import { downloadBlob } from "@/lib/utils";
import { zipResults, withExtension } from "@/lib/pipeline/zipResults";
import { MEDIA_META, type MediaType } from "@/lib/pipeline/mediaType";
import type { FileStatus } from "@/lib/pipeline/types";

export function ResultsReport({ results, outputType, onReset }: {
    results: FileStatus[]; outputType: MediaType; onReset: () => void;
}) {
    const { ext, mime } = MEDIA_META[outputType];
    const successes = results.filter((r) => r.status === "success");
    const failures = results.filter((r) => r.status === "failed");

    async function downloadZip() {
        downloadBlob(await zipResults(results, ext), "batch-results.zip");
    }
    function downloadOne(r: FileStatus) {
        if (r.status === "success") {
            downloadBlob(new Blob([r.bytes as BlobPart], { type: mime }), withExtension(r.name, ext));
        }
    }

    return (
        <div className="space-y-4">
            <div className="text-sm">
                <span className="text-green-600 font-semibold">{successes.length} succeeded</span>
                {failures.length > 0 && <> · <span className="text-red-500 font-semibold">{failures.length} failed</span></>}
                {" · "}{results.length} total
            </div>
            {successes.length > 0 && (
                <button type="button" onClick={downloadZip}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary-500 p-3 text-white font-medium hover:bg-primary-600">
                    <Download className="w-4 h-4" /> Download results.zip ({successes.length})
                </button>
            )}
            <div className="space-y-1">
                {results.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 rounded border border-gray-100 dark:border-gray-700 p-2 text-sm">
                        {r.status === "success"
                            ? <Check className="w-4 h-4 text-green-600" />
                            : <X className="w-4 h-4 text-red-500" />}
                        <span className="truncate flex-1">{r.status === "success" ? withExtension(r.name, ext) : r.name}</span>
                        {r.status === "success"
                            ? <button type="button" onClick={() => downloadOne(r)} className="text-primary-500 hover:underline">Download</button>
                            : <span className="text-red-500 text-xs">failed at step {r.failedStepIndex + 1} — {r.error}</span>}
                    </div>
                ))}
            </div>
            <button type="button" onClick={onReset} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                <RotateCcw className="w-4 h-4" /> Start over
            </button>
        </div>
    );
}
```

- [ ] **Step 3: Full typecheck + suite + build**

Run: `npx tsc --noEmit && npm test && npm run build`
Expected: tsc clean; all tests pass; build succeeds for all routes.

- [ ] **Step 4: Manual verification (browser)**

Run `npm run dev`, open `/batch`, and confirm:
1. Add files → add `Compress` → add `PDF to Word`. The Word step shows a `→ .docx` badge; "Add operation" is now disabled with the tooltip.
2. Run → results list shows `*.docx` names; `Download` yields a valid .docx; `Download results.zip` contains .docx files.
3. Build a chain with `Protect` not last → red banner, Run disabled. Move `Protect` last → banner clears.
4. `Unlock` second → amber nudge, Run still enabled.

- [ ] **Step 5: Commit**

```bash
git add src/components/tools/batch/StepList.tsx src/components/tools/batch/ResultsReport.tsx
git commit -m "feat(batch): terminal step badge + extension/MIME-aware result downloads"
```

---

## Self-Review

**Spec coverage:**
- Extract conversion logic → Task 1 ✅
- MediaType model on `PdfOperation` → Task 2 ✅
- 3 terminal conversion ops → Task 3 ✅
- Pure `validateChain` (type continuity, terminal-last, Protect-last, Unlock-first) → Task 4 ✅
- Engine unchanged; output naming via `outputType` → Tasks 5, 6, 8 ✅
- UI: picker grouping + disable-after-terminal (Task 7), step badge (Task 8), validation banner (Task 6), extension-named results (Task 8) ✅
- Testing: `validateChain`, conversion round-trips (ZIP magic bytes), extension-aware zip → Tasks 1, 4, 5 ✅
- No new deps; client-side; no-regression to standalone tools (pageCount preserved) → Task 1 ✅

**Placeholder scan:** No TBD/TODO. Task 1 Step 3 references moving verbatim bodies from cited line ranges (a pure move) rather than reproducing ~230 lines — the exact signature/return/load-line changes are specified.

**Type consistency:** `MediaType`, `MEDIA_META`, `withExtension`, `validateChain`, `pdfToWord/Excel/Pptx` (returning `{ bytes, pageCount }`), `outputType` prop, and `disabled` prop are named consistently across the tasks that define and consume them.

**Ordering note:** Tasks 6–8 have interlocking props (`ResultsReport.outputType`, `OperationPicker.disabled`); tsc is fully green only after Task 8 Step 3. Each task is still individually committable.
