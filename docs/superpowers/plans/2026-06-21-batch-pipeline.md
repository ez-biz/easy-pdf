# Batch Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a client-side "Batch Process" tool at `/batch` where users drop many PDFs, build an ordered chain of count-preserving PDF→PDF operations (compress, rotate, watermark, page numbers, edit metadata, protect, unlock), run it with per-file isolation, and download the results as a zip.

**Architecture:** A uniform `PdfOperation` interface wraps the existing `src/lib/pdf/*` functions. A pure, framework-free engine (`runPipeline`) runs each file through each step's `run()`, isolating per-file failures. UI is a single-column vertical stepper with inline-accordion step config. Results assemble into a zip via `jszip`.

**Tech Stack:** Next.js 15 (App Router), React, TypeScript, `@cantoo/pdf-lib`, `jszip`, `@dnd-kit/sortable`, Tailwind, **vitest** for tests. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-06-21-batch-pipeline-design.md`

---

## File Structure

**Create:**
- `src/lib/pipeline/types.ts` — shared types (`PdfOperation`, `PipelineStep`, `FileStatus`, `ProgressEvent`, `PipelineInput`).
- `src/lib/pipeline/runPipeline.ts` — pure execution engine.
- `src/lib/pipeline/zipResults.ts` — zip assembly via jszip.
- `src/lib/pipeline/operations/*.ts` — one wrapper per operation + `index.ts` registry.
- `src/lib/pipeline/operations/forms/*.tsx` — the per-operation OptionsForm components.
- `src/lib/pipeline/__tests__/runPipeline.test.ts`, `zipResults.test.ts`, `operations.test.ts`.
- `src/components/tools/batch/StepList.tsx`, `OperationPicker.tsx`, `RunProgress.tsx`, `ResultsReport.tsx`.
- `src/app/(tools)/batch/page.tsx`, `src/app/(tools)/batch/BatchClient.tsx`.

**Modify:**
- `src/lib/icons.ts` — add a `Workflow` icon.
- `src/lib/constants.ts` — register the `batch-pdf` tool.

---

## Task 1: Pipeline types

**Files:**
- Create: `src/lib/pipeline/types.ts`

- [ ] **Step 1: Write the types file**

```ts
import type { FC } from "react";
import type { LucideIcon } from "lucide-react";

/** One available operation kind (e.g. "rotate"). Wraps an existing lib/pdf fn. */
export interface PdfOperation<TOptions = unknown> {
    id: string;
    label: string;
    icon: LucideIcon;
    defaultOptions: TOptions;
    /** Inline-accordion config UI for a single step. */
    OptionsForm: FC<{ value: TOptions; onChange: (next: TOptions) => void }>;
    /** Pure transform: bytes in, bytes out. May internally build a File / use pdf-lib. */
    run(input: Uint8Array, options: TOptions): Promise<Uint8Array>;
}

/** A configured step instance in the user's chain. */
export interface PipelineStep {
    id: string;       // unique instance id (dnd + react keys), from generateId()
    opId: string;     // which PdfOperation
    options: unknown; // operation-specific options
}

/** A file fed into the engine. The UI converts File -> this before running. */
export interface PipelineInput {
    name: string;
    bytes: Uint8Array;
}

export type FileStatus =
    | { name: string; status: "success"; bytes: Uint8Array; stepsRun: number }
    | { name: string; status: "failed"; failedStepIndex: number; opId: string; error: string };

export type ProgressEvent =
    | { type: "file-start"; fileIndex: number; name: string }
    | { type: "step-done"; fileIndex: number; stepIndex: number }
    | { type: "file-done"; fileIndex: number; status: FileStatus };
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors referencing `src/lib/pipeline/types.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pipeline/types.ts
git commit -m "feat(batch): add pipeline shared types"
```

---

## Task 2: Pipeline engine (TDD with fake operations)

**Files:**
- Create: `src/lib/pipeline/runPipeline.ts`
- Test: `src/lib/pipeline/__tests__/runPipeline.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi } from "vitest";
import { runPipeline } from "../runPipeline";
import type { PdfOperation, PipelineInput, PipelineStep, ProgressEvent } from "../types";

// Fake ops operate on raw bytes — no pdf.js needed.
const appendByte = (id: string, value: number): PdfOperation<unknown> => ({
    id, label: id, icon: (() => null) as never, defaultOptions: {},
    OptionsForm: (() => null) as never,
    run: async (input) => new Uint8Array([...input, value]),
});
const explode = (id: string): PdfOperation<unknown> => ({
    id, label: id, icon: (() => null) as never, defaultOptions: {},
    OptionsForm: (() => null) as never,
    run: async () => { throw new Error("boom"); },
});

const input = (name: string, bytes: number[]): PipelineInput => ({ name, bytes: new Uint8Array(bytes) });
const step = (opId: string): PipelineStep => ({ id: `s-${opId}`, opId, options: {} });

describe("runPipeline", () => {
    it("runs steps in order, feeding output into the next", async () => {
        const ops = { a: appendByte("a", 1), b: appendByte("b", 2) };
        const res = await runPipeline([input("f.pdf", [0])], [step("a"), step("b")], ops);
        expect(res).toHaveLength(1);
        expect(res[0].status).toBe("success");
        if (res[0].status === "success") {
            expect([...res[0].bytes]).toEqual([0, 1, 2]);
            expect(res[0].stepsRun).toBe(2);
        }
    });

    it("isolates a failing step to its file; others continue", async () => {
        const ops = { ok: appendByte("ok", 9), bad: explode("bad") };
        const res = await runPipeline(
            [input("good.pdf", [0]), input("bad.pdf", [0])],
            [step("ok"), step("bad")],
            ops,
        );
        // First file fails at step index 1; second file also fails the same way.
        expect(res[0].status).toBe("failed");
        if (res[0].status === "failed") {
            expect(res[0].failedStepIndex).toBe(1);
            expect(res[0].opId).toBe("bad");
            expect(res[0].error).toBe("boom");
        }
    });

    it("only the failing file fails when inputs differ", async () => {
        // Op fails only on empty input.
        const failEmpty: PdfOperation<unknown> = {
            id: "fe", label: "fe", icon: (() => null) as never, defaultOptions: {},
            OptionsForm: (() => null) as never,
            run: async (b) => { if (b.length === 0) throw new Error("empty"); return b; },
        };
        const res = await runPipeline(
            [input("a.pdf", [1]), input("b.pdf", [])],
            [step("fe")],
            { fe: failEmpty },
        );
        expect(res[0].status).toBe("success");
        expect(res[1].status).toBe("failed");
    });

    it("emits file-start, step-done and file-done events", async () => {
        const ops = { a: appendByte("a", 1) };
        const events: ProgressEvent[] = [];
        await runPipeline([input("f.pdf", [0])], [step("a")], ops, (e) => events.push(e));
        expect(events.map((e) => e.type)).toEqual(["file-start", "step-done", "file-done"]);
    });

    it("stops scheduling further files once aborted; keeps completed", async () => {
        const ops = { a: appendByte("a", 1) };
        const controller = new AbortController();
        controller.abort();
        const res = await runPipeline([input("f.pdf", [0])], [step("a")], ops, undefined, controller.signal);
        expect(res).toHaveLength(0);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/pipeline/__tests__/runPipeline.test.ts`
Expected: FAIL — `runPipeline` is not defined / module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
import type {
    FileStatus, PdfOperation, PipelineInput, PipelineStep, ProgressEvent,
} from "./types";

export async function runPipeline(
    inputs: PipelineInput[],
    steps: PipelineStep[],
    ops: Record<string, PdfOperation>,
    onProgress: (e: ProgressEvent) => void = () => {},
    signal?: AbortSignal,
): Promise<FileStatus[]> {
    const results: FileStatus[] = [];

    for (let f = 0; f < inputs.length; f++) {
        if (signal?.aborted) break;
        const { name, bytes: startBytes } = inputs[f];
        onProgress({ type: "file-start", fileIndex: f, name });

        let bytes = startBytes;
        let failure: FileStatus | null = null;

        for (let s = 0; s < steps.length; s++) {
            const stepDef = steps[s];
            const op = ops[stepDef.opId];
            try {
                if (!op) throw new Error(`Unknown operation: ${stepDef.opId}`);
                bytes = await op.run(bytes, stepDef.options);
                onProgress({ type: "step-done", fileIndex: f, stepIndex: s });
            } catch (err) {
                failure = {
                    name, status: "failed", failedStepIndex: s, opId: stepDef.opId,
                    error: err instanceof Error ? err.message : String(err),
                };
                break;
            }
        }

        const status: FileStatus =
            failure ?? { name, status: "success", bytes, stepsRun: steps.length };
        onProgress({ type: "file-done", fileIndex: f, status });
        results.push(status);
    }

    return results;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/pipeline/__tests__/runPipeline.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/pipeline/runPipeline.ts src/lib/pipeline/__tests__/runPipeline.test.ts
git commit -m "feat(batch): add per-file-isolated pipeline engine"
```

---

## Task 3: Operation option types + wrappers + registry (TDD round-trip)

**Files:**
- Create: `src/lib/pipeline/operations/options.ts` (option types)
- Create: `src/lib/pipeline/operations/bytes.ts` (helper)
- Create: `src/lib/pipeline/operations/{compress,rotate,watermark,pageNumbers,metadata,protect,unlock}.ts`
- Create: `src/lib/pipeline/operations/index.ts`
- Test: `src/lib/pipeline/__tests__/operations.test.ts`

Note: the `OptionsForm` field on each operation is filled in **Task 5**. In this task each operation temporarily sets `OptionsForm: (() => null) as never` so the logic and `run()` can be tested first. Task 5 replaces those with real forms.

- [ ] **Step 1: Write option types**

`src/lib/pipeline/operations/options.ts`:

```ts
import type { RotationAngle } from "@/lib/pdf/rotate";
import type { WatermarkPosition } from "@/lib/pdf/watermark";
import type { PageNumberFormat, PageNumberPosition } from "@/lib/pdf/pageNumbers";

export type CompressOptions = Record<string, never>; // no options in v1
export interface RotateOptions { angle: RotationAngle; scope: "all" | "odd" | "even" }
export interface WatermarkOptions { text: string; opacity: number; position: WatermarkPosition }
export interface PageNumberFormOptions { format: PageNumberFormat; position: PageNumberPosition; startNumber: number }
export interface MetadataOptions { title: string; author: string; subject: string; keywords: string }
export interface PasswordOptions { password: string }
```

- [ ] **Step 2: Write the bytes helper**

`src/lib/pipeline/operations/bytes.ts`:

```ts
/** Wrap raw PDF bytes in a File so the existing lib/pdf functions can consume them. */
export function bytesToFile(bytes: Uint8Array, name = "doc.pdf"): File {
    return new File([bytes], name, { type: "application/pdf" });
}
```

- [ ] **Step 3: Write the failing test**

`src/lib/pipeline/__tests__/operations.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import { OPERATIONS, OPERATION_LIST } from "../operations";

async function samplePdf(pages = 3): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    for (let i = 0; i < pages; i++) {
        const p = doc.addPage([300, 400]);
        p.drawText(`Page ${i + 1}`, { x: 20, y: 360, size: 18, font });
    }
    return doc.save();
}

const isValidPdf = async (bytes: Uint8Array) => {
    const doc = await PDFDocument.load(bytes);
    return doc.getPageCount();
};

describe("operations registry", () => {
    it("exposes the 7 v1 operations in order", () => {
        expect(OPERATION_LIST.map((o) => o.id)).toEqual([
            "compress", "rotate", "watermark", "page-numbers", "metadata", "protect", "unlock",
        ]);
    });

    it("rotate produces a valid same-page-count PDF", async () => {
        const out = await OPERATIONS.rotate.run(await samplePdf(3), { angle: 90, scope: "all" });
        expect(await isValidPdf(out)).toBe(3);
    });

    it("page-numbers produces a valid PDF", async () => {
        const out = await OPERATIONS["page-numbers"].run(await samplePdf(2), {
            format: "number-of-total", position: "bottom-center", startNumber: 1,
        });
        expect(await isValidPdf(out)).toBe(2);
    });

    it("metadata sets the title", async () => {
        const out = await OPERATIONS.metadata.run(await samplePdf(1), {
            title: "Hello", author: "", subject: "", keywords: "",
        });
        const doc = await PDFDocument.load(out);
        expect(doc.getTitle()).toBe("Hello");
    });

    it("protect then unlock round-trips", async () => {
        const protectedBytes = await OPERATIONS.protect.run(await samplePdf(1), { password: "s3cret" });
        const unlocked = await OPERATIONS.unlock.run(protectedBytes, { password: "s3cret" });
        expect(await isValidPdf(unlocked)).toBe(1);
    });

    it("unlock with wrong password throws", async () => {
        const protectedBytes = await OPERATIONS.protect.run(await samplePdf(1), { password: "right" });
        await expect(OPERATIONS.unlock.run(protectedBytes, { password: "wrong" })).rejects.toThrow();
    });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run src/lib/pipeline/__tests__/operations.test.ts`
Expected: FAIL — `../operations` not found.

- [ ] **Step 5: Write the operation wrappers**

`src/lib/pipeline/operations/compress.ts`:

```ts
import { Minimize2 } from "lucide-react";
import { compressPDF } from "@/lib/pdf/compress";
import type { PdfOperation } from "../types";
import type { CompressOptions } from "./options";
import { bytesToFile } from "./bytes";

export const compressOp: PdfOperation<CompressOptions> = {
    id: "compress", label: "Compress", icon: Minimize2, defaultOptions: {},
    OptionsForm: (() => null) as never, // replaced in Task 5
    async run(input) {
        const res = await compressPDF(bytesToFile(input));
        if (!res.success || !res.data) throw new Error(res.error ?? "Compress failed");
        return res.data;
    },
};
```

`src/lib/pipeline/operations/rotate.ts`:

```ts
import { RotateCw } from "lucide-react";
import { PDFDocument } from "@cantoo/pdf-lib";
import { rotatePDF, type RotationAngle } from "@/lib/pdf/rotate";
import type { PdfOperation } from "../types";
import type { RotateOptions } from "./options";
import { bytesToFile } from "./bytes";

export const rotateOp: PdfOperation<RotateOptions> = {
    id: "rotate", label: "Rotate", icon: RotateCw,
    defaultOptions: { angle: 90, scope: "all" },
    OptionsForm: (() => null) as never,
    async run(input, options) {
        const file = bytesToFile(input);
        let rotations: Map<number, RotationAngle> | RotationAngle = options.angle;
        if (options.scope !== "all") {
            const count = (await PDFDocument.load(input)).getPageCount();
            const map = new Map<number, RotationAngle>();
            for (let i = 0; i < count; i++) {
                const isOdd = (i + 1) % 2 === 1; // 1-based page numbers
                if ((options.scope === "odd" && isOdd) || (options.scope === "even" && !isOdd)) {
                    map.set(i, options.angle);
                }
            }
            rotations = map;
        }
        const res = await rotatePDF(file, rotations);
        if (!res.success || !res.data) throw new Error(res.error ?? "Rotate failed");
        return res.data;
    },
};
```

`src/lib/pipeline/operations/watermark.ts`:

```ts
import { Droplets } from "lucide-react";
import { addTextWatermark } from "@/lib/pdf/watermark";
import type { PdfOperation } from "../types";
import type { WatermarkOptions } from "./options";
import { bytesToFile } from "./bytes";

export const watermarkOp: PdfOperation<WatermarkOptions> = {
    id: "watermark", label: "Watermark", icon: Droplets,
    defaultOptions: { text: "CONFIDENTIAL", opacity: 0.3, position: "diagonal" },
    OptionsForm: (() => null) as never,
    async run(input, options) {
        const res = await addTextWatermark(bytesToFile(input), {
            text: options.text, opacity: options.opacity, position: options.position,
        });
        if (!res.success || !res.data) throw new Error(res.error ?? "Watermark failed");
        return res.data;
    },
};
```

`src/lib/pipeline/operations/pageNumbers.ts`:

```ts
import { Hash } from "lucide-react";
import { addPageNumbers } from "@/lib/pdf/pageNumbers";
import type { PdfOperation } from "../types";
import type { PageNumberFormOptions } from "./options";
import { bytesToFile } from "./bytes";

export const pageNumbersOp: PdfOperation<PageNumberFormOptions> = {
    id: "page-numbers", label: "Page numbers", icon: Hash,
    defaultOptions: { format: "number", position: "bottom-center", startNumber: 1 },
    OptionsForm: (() => null) as never,
    async run(input, options) {
        const res = await addPageNumbers(bytesToFile(input), {
            format: options.format, position: options.position, startNumber: options.startNumber,
        });
        if (!res.success || !res.data) throw new Error(res.error ?? "Page numbers failed");
        return res.data;
    },
};
```

`src/lib/pipeline/operations/metadata.ts`:

```ts
import { Edit3 } from "lucide-react";
import { updateMetadata } from "@/lib/pdf/metadata";
import type { PdfOperation } from "../types";
import type { MetadataOptions } from "./options";
import { bytesToFile } from "./bytes";

export const metadataOp: PdfOperation<MetadataOptions> = {
    id: "metadata", label: "Edit metadata", icon: Edit3,
    defaultOptions: { title: "", author: "", subject: "", keywords: "" },
    OptionsForm: (() => null) as never,
    async run(input, options) {
        const res = await updateMetadata(bytesToFile(input), options);
        if (!res.success || !res.data) throw new Error(res.error ?? "Metadata failed");
        return res.data;
    },
};
```

`src/lib/pipeline/operations/protect.ts`:

```ts
import { Lock } from "lucide-react";
import { protectPDF } from "@/lib/pdf/security";
import type { PdfOperation } from "../types";
import type { PasswordOptions } from "./options";
import { bytesToFile } from "./bytes";

export const protectOp: PdfOperation<PasswordOptions> = {
    id: "protect", label: "Protect", icon: Lock,
    defaultOptions: { password: "" },
    OptionsForm: (() => null) as never,
    async run(input, options) {
        if (!options.password) throw new Error("Password required");
        const res = await protectPDF(bytesToFile(input), { userPassword: options.password });
        if (!res.success || !res.data) throw new Error(res.error ?? "Protect failed");
        return res.data;
    },
};
```

`src/lib/pipeline/operations/unlock.ts`:

```ts
import { Unlock } from "lucide-react";
import { unlockPDF } from "@/lib/pdf/security";
import type { PdfOperation } from "../types";
import type { PasswordOptions } from "./options";
import { bytesToFile } from "./bytes";

export const unlockOp: PdfOperation<PasswordOptions> = {
    id: "unlock", label: "Unlock", icon: Unlock,
    defaultOptions: { password: "" },
    OptionsForm: (() => null) as never,
    async run(input, options) {
        const res = await unlockPDF(bytesToFile(input), options.password);
        if (!res.success || !res.data) throw new Error(res.error ?? "Unlock failed");
        return res.data;
    },
};
```

- [ ] **Step 6: Write the registry**

`src/lib/pipeline/operations/index.ts`:

```ts
import type { PdfOperation } from "../types";
import { compressOp } from "./compress";
import { rotateOp } from "./rotate";
import { watermarkOp } from "./watermark";
import { pageNumbersOp } from "./pageNumbers";
import { metadataOp } from "./metadata";
import { protectOp } from "./protect";
import { unlockOp } from "./unlock";

// Order shown in the "Add operation" picker.
export const OPERATION_LIST: PdfOperation[] = [
    compressOp, rotateOp, watermarkOp, pageNumbersOp, metadataOp, protectOp, unlockOp,
] as PdfOperation[];

export const OPERATIONS: Record<string, PdfOperation> = Object.fromEntries(
    OPERATION_LIST.map((op) => [op.id, op]),
);
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run src/lib/pipeline/__tests__/operations.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 8: Commit**

```bash
git add src/lib/pipeline/operations
git commit -m "feat(batch): add operation wrappers + registry for the 7 v1 ops"
```

---

## Task 4: Zip assembly (TDD)

**Files:**
- Create: `src/lib/pipeline/zipResults.ts`
- Test: `src/lib/pipeline/__tests__/zipResults.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { buildZip } from "../zipResults";
import type { FileStatus } from "../types";

const ok = (name: string): FileStatus => ({
    name, status: "success", bytes: new Uint8Array([1, 2, 3]), stepsRun: 1,
});
const fail = (name: string): FileStatus => ({
    name, status: "failed", failedStepIndex: 0, opId: "x", error: "no",
});

describe("buildZip", () => {
    it("includes only successes", () => {
        const zip = buildZip([ok("a.pdf"), fail("b.pdf"), ok("c.pdf")]);
        expect(Object.keys(zip.files).sort()).toEqual(["a.pdf", "c.pdf"]);
    });

    it("de-duplicates colliding names", () => {
        const zip = buildZip([ok("report.pdf"), ok("report.pdf")]);
        expect(Object.keys(zip.files).sort()).toEqual(["report (1).pdf", "report.pdf"]);
    });

    it("round-trips through JSZip", async () => {
        const blob = await buildZip([ok("a.pdf")]).generateAsync({ type: "uint8array" });
        const reloaded = await JSZip.loadAsync(blob);
        expect(Object.keys(reloaded.files)).toEqual(["a.pdf"]);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/pipeline/__tests__/zipResults.test.ts`
Expected: FAIL — `../zipResults` not found.

- [ ] **Step 3: Write the implementation**

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

/** Build (but don't serialize) a zip of all succeeded outputs. */
export function buildZip(results: FileStatus[]): JSZip {
    const zip = new JSZip();
    const used = new Set<string>();
    for (const r of results) {
        if (r.status !== "success") continue;
        zip.file(dedupe(r.name, used), r.bytes);
    }
    return zip;
}

/** Serialize the success zip to a Blob for download. */
export async function zipResults(results: FileStatus[]): Promise<Blob> {
    return buildZip(results).generateAsync({ type: "blob" });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/pipeline/__tests__/zipResults.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/pipeline/zipResults.ts src/lib/pipeline/__tests__/zipResults.test.ts
git commit -m "feat(batch): add zip assembly for pipeline results"
```

---

## Task 5: Operation OptionsForm components

**Files:**
- Create: `src/lib/pipeline/operations/forms/{Rotate,Watermark,PageNumbers,Metadata,Password}Form.tsx`
- Modify: each `src/lib/pipeline/operations/*.ts` to import its form and set `OptionsForm`.

Compress has no options — its form is a static note. Protect and Unlock share `PasswordForm`.

- [ ] **Step 1: Write the form components**

`src/lib/pipeline/operations/forms/RotateForm.tsx`:

```tsx
import type { RotateOptions } from "../options";

export function RotateForm({ value, onChange }: { value: RotateOptions; onChange: (v: RotateOptions) => void }) {
    return (
        <div className="space-y-3 text-sm">
            <label className="block">
                <span className="text-gray-600 dark:text-gray-300">Angle</span>
                <select className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2"
                    value={value.angle}
                    onChange={(e) => onChange({ ...value, angle: Number(e.target.value) as RotateOptions["angle"] })}>
                    <option value={90}>90° clockwise</option>
                    <option value={180}>180°</option>
                    <option value={270}>270° clockwise</option>
                </select>
            </label>
            <label className="block">
                <span className="text-gray-600 dark:text-gray-300">Pages</span>
                <select className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2"
                    value={value.scope}
                    onChange={(e) => onChange({ ...value, scope: e.target.value as RotateOptions["scope"] })}>
                    <option value="all">All pages</option>
                    <option value="odd">Odd pages</option>
                    <option value="even">Even pages</option>
                </select>
            </label>
        </div>
    );
}
```

`src/lib/pipeline/operations/forms/WatermarkForm.tsx`:

```tsx
import type { WatermarkOptions } from "../options";

const POSITIONS = ["diagonal", "center", "top-left", "top-right", "bottom-left", "bottom-right"] as const;

export function WatermarkForm({ value, onChange }: { value: WatermarkOptions; onChange: (v: WatermarkOptions) => void }) {
    return (
        <div className="space-y-3 text-sm">
            <label className="block">
                <span className="text-gray-600 dark:text-gray-300">Text</span>
                <input className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2"
                    value={value.text} onChange={(e) => onChange({ ...value, text: e.target.value })} />
            </label>
            <label className="block">
                <span className="text-gray-600 dark:text-gray-300">Opacity: {Math.round(value.opacity * 100)}%</span>
                <input type="range" min={0.05} max={1} step={0.05} className="mt-1 w-full"
                    value={value.opacity} onChange={(e) => onChange({ ...value, opacity: Number(e.target.value) })} />
            </label>
            <label className="block">
                <span className="text-gray-600 dark:text-gray-300">Position</span>
                <select className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2"
                    value={value.position} onChange={(e) => onChange({ ...value, position: e.target.value as WatermarkOptions["position"] })}>
                    {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
            </label>
        </div>
    );
}
```

`src/lib/pipeline/operations/forms/PageNumbersForm.tsx`:

```tsx
import type { PageNumberFormOptions } from "../options";

const FORMATS = [
    { v: "number", label: "1, 2, 3" },
    { v: "page-number", label: "Page 1" },
    { v: "number-of-total", label: "1 of N" },
] as const;
const POSITIONS = ["bottom-center", "bottom-left", "bottom-right", "top-center", "top-left", "top-right"] as const;

export function PageNumbersForm({ value, onChange }: { value: PageNumberFormOptions; onChange: (v: PageNumberFormOptions) => void }) {
    return (
        <div className="space-y-3 text-sm">
            <label className="block">
                <span className="text-gray-600 dark:text-gray-300">Format</span>
                <select className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2"
                    value={value.format} onChange={(e) => onChange({ ...value, format: e.target.value as PageNumberFormOptions["format"] })}>
                    {FORMATS.map((f) => <option key={f.v} value={f.v}>{f.label}</option>)}
                </select>
            </label>
            <label className="block">
                <span className="text-gray-600 dark:text-gray-300">Position</span>
                <select className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2"
                    value={value.position} onChange={(e) => onChange({ ...value, position: e.target.value as PageNumberFormOptions["position"] })}>
                    {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
            </label>
            <label className="block">
                <span className="text-gray-600 dark:text-gray-300">Start at</span>
                <input type="number" min={1} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2"
                    value={value.startNumber} onChange={(e) => onChange({ ...value, startNumber: Math.max(1, Number(e.target.value) || 1) })} />
            </label>
        </div>
    );
}
```

`src/lib/pipeline/operations/forms/MetadataForm.tsx`:

```tsx
import type { MetadataOptions } from "../options";

const FIELDS: { key: keyof MetadataOptions; label: string }[] = [
    { key: "title", label: "Title" }, { key: "author", label: "Author" },
    { key: "subject", label: "Subject" }, { key: "keywords", label: "Keywords (comma-separated)" },
];

export function MetadataForm({ value, onChange }: { value: MetadataOptions; onChange: (v: MetadataOptions) => void }) {
    return (
        <div className="space-y-3 text-sm">
            {FIELDS.map((f) => (
                <label key={f.key} className="block">
                    <span className="text-gray-600 dark:text-gray-300">{f.label}</span>
                    <input className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2"
                        value={value[f.key]} onChange={(e) => onChange({ ...value, [f.key]: e.target.value })} />
                </label>
            ))}
        </div>
    );
}
```

`src/lib/pipeline/operations/forms/PasswordForm.tsx`:

```tsx
import type { PasswordOptions } from "../options";

export function PasswordForm({ value, onChange }: { value: PasswordOptions; onChange: (v: PasswordOptions) => void }) {
    return (
        <label className="block text-sm">
            <span className="text-gray-600 dark:text-gray-300">Password</span>
            <input type="password" className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2"
                value={value.password} onChange={(e) => onChange({ ...value, password: e.target.value })} />
        </label>
    );
}
```

- [ ] **Step 2: Wire each form into its operation**

In each operation file, replace `OptionsForm: (() => null) as never,` with the imported form. Examples:

- `rotate.ts`: add `import { RotateForm } from "./forms/RotateForm";` and set `OptionsForm: RotateForm,`
- `watermark.ts`: `import { WatermarkForm } from "./forms/WatermarkForm";` → `OptionsForm: WatermarkForm,`
- `pageNumbers.ts`: `import { PageNumbersForm } from "./forms/PageNumbersForm";` → `OptionsForm: PageNumbersForm,`
- `metadata.ts`: `import { MetadataForm } from "./forms/MetadataForm";` → `OptionsForm: MetadataForm,`
- `protect.ts` and `unlock.ts`: `import { PasswordForm } from "./forms/PasswordForm";` → `OptionsForm: PasswordForm,`
- `compress.ts`: set `OptionsForm: () => null,` (compress has no options; the UI shows a static note instead).

- [ ] **Step 3: Verify type-check + existing tests still pass**

Run: `npx tsc --noEmit -p tsconfig.json && npx vitest run src/lib/pipeline`
Expected: no type errors; all pipeline tests still PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/pipeline/operations
git commit -m "feat(batch): add per-operation options forms"
```

---

## Task 6: StepList + OperationPicker UI

**Files:**
- Create: `src/components/tools/batch/OperationPicker.tsx`
- Create: `src/components/tools/batch/StepList.tsx`

- [ ] **Step 1: OperationPicker**

```tsx
"use client";
import { Plus } from "lucide-react";
import { useState } from "react";
import { OPERATION_LIST } from "@/lib/pipeline/operations";

export function OperationPicker({ onAdd }: { onAdd: (opId: string) => void }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button type="button" onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-3 text-sm text-gray-600 dark:text-gray-300 hover:border-primary-500">
                <Plus className="w-4 h-4" /> Add operation
            </button>
            {open && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                    {OPERATION_LIST.map((op) => {
                        const Icon = op.icon;
                        return (
                            <button key={op.id} type="button"
                                onClick={() => { onAdd(op.id); setOpen(false); }}
                                className="w-full flex items-center gap-2 p-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                                <Icon className="w-4 h-4 text-primary-500" /> {op.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
```

- [ ] **Step 2: StepList (drag-reorder + inline accordion config)**

```tsx
"use client";
import { useState, type FC } from "react";
import { GripVertical, ChevronDown, ChevronUp, X } from "lucide-react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { OPERATIONS } from "@/lib/pipeline/operations";
import type { PipelineStep } from "@/lib/pipeline/types";

function StepCard({ step, index, onChange, onRemove }: {
    step: PipelineStep; index: number;
    onChange: (s: PipelineStep) => void; onRemove: () => void;
}) {
    const [expanded, setExpanded] = useState(true);
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: step.id });
    const op = OPERATIONS[step.opId];
    const Form = op.OptionsForm as FC<{ value: unknown; onChange: (v: unknown) => void }>;
    return (
        <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-2 p-3">
                <button type="button" {...attributes} {...listeners} className="cursor-grab text-gray-400"><GripVertical className="w-4 h-4" /></button>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-xs text-white">{index + 1}</span>
                <span className="flex-1 text-sm font-medium">{op.label}</span>
                <button type="button" onClick={() => setExpanded((e) => !e)} className="text-gray-400">
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button type="button" onClick={onRemove} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
            </div>
            {expanded && (
                <div className="border-t border-gray-100 dark:border-gray-700 p-3">
                    {op.id === "compress"
                        ? <p className="text-sm text-gray-500">Optimizes structure and strips unused objects. No options.</p>
                        : <Form value={step.options} onChange={(options) => onChange({ ...step, options })} />}
                </div>
            )}
        </div>
    );
}

export function StepList({ steps, onChange }: { steps: PipelineStep[]; onChange: (s: PipelineStep[]) => void }) {
    function onDragEnd(e: DragEndEvent) {
        const { active, over } = e;
        if (over && active.id !== over.id) {
            const from = steps.findIndex((s) => s.id === active.id);
            const to = steps.findIndex((s) => s.id === over.id);
            onChange(arrayMove(steps, from, to));
        }
    }
    return (
        <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                    {steps.map((step, i) => (
                        <StepCard key={step.id} step={step} index={i}
                            onChange={(s) => onChange(steps.map((x) => (x.id === s.id ? s : x)))}
                            onRemove={() => onChange(steps.filter((x) => x.id !== step.id))} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
```

- [ ] **Step 3: Verify type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors in the two new files.

- [ ] **Step 4: Commit**

```bash
git add src/components/tools/batch/OperationPicker.tsx src/components/tools/batch/StepList.tsx
git commit -m "feat(batch): add step list (reorder + inline config) and operation picker"
```

---

## Task 7: RunProgress + ResultsReport UI

**Files:**
- Create: `src/components/tools/batch/RunProgress.tsx`
- Create: `src/components/tools/batch/ResultsReport.tsx`

- [ ] **Step 1: RunProgress**

```tsx
"use client";
import { Check, Loader2, Circle, X } from "lucide-react";

export interface FileProgress { name: string; state: "queued" | "running" | "done" | "failed" }

export function RunProgress({ files, done, total, onCancel }: {
    files: FileProgress[]; done: number; total: number; onCancel: () => void;
}) {
    const pct = total ? Math.round((done / total) * 100) : 0;
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
                <span>{done} of {total} files</span>
                <button type="button" onClick={onCancel} className="text-gray-500 hover:text-red-500">Cancel</button>
            </div>
            <div className="h-2 w-full rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div className="h-full bg-primary-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="max-h-64 overflow-auto space-y-1">
                {files.map((f) => (
                    <div key={f.name} className="flex items-center gap-2 rounded border border-gray-100 dark:border-gray-700 p-2 text-sm">
                        {f.state === "done" && <Check className="w-4 h-4 text-green-600" />}
                        {f.state === "failed" && <X className="w-4 h-4 text-red-500" />}
                        {f.state === "running" && <Loader2 className="w-4 h-4 animate-spin text-primary-500" />}
                        {f.state === "queued" && <Circle className="w-3 h-3 text-gray-300" />}
                        <span className="truncate">{f.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
```

- [ ] **Step 2: ResultsReport**

```tsx
"use client";
import { Check, X, Download, RotateCcw } from "lucide-react";
import { downloadBlob } from "@/lib/utils";
import { zipResults } from "@/lib/pipeline/zipResults";
import type { FileStatus } from "@/lib/pipeline/types";

export function ResultsReport({ results, onReset }: { results: FileStatus[]; onReset: () => void }) {
    const successes = results.filter((r) => r.status === "success");
    const failures = results.filter((r) => r.status === "failed");

    async function downloadZip() {
        downloadBlob(await zipResults(results), "batch-results.zip");
    }
    function downloadOne(r: FileStatus) {
        if (r.status === "success") {
            downloadBlob(new Blob([r.bytes], { type: "application/pdf" }), r.name);
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
                {results.map((r) => (
                    <div key={r.name} className="flex items-center gap-2 rounded border border-gray-100 dark:border-gray-700 p-2 text-sm">
                        {r.status === "success"
                            ? <Check className="w-4 h-4 text-green-600" />
                            : <X className="w-4 h-4 text-red-500" />}
                        <span className="truncate flex-1">{r.name}</span>
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

- [ ] **Step 3: Verify type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/tools/batch/RunProgress.tsx src/components/tools/batch/ResultsReport.tsx
git commit -m "feat(batch): add run progress and results report components"
```

---

## Task 8: BatchClient orchestrator

**Files:**
- Create: `src/app/(tools)/batch/BatchClient.tsx`

- [ ] **Step 1: Write BatchClient**

```tsx
"use client";
import { useRef, useState } from "react";
import { FileUploader } from "@/components/tools/FileUploader";
import { OperationPicker } from "@/components/tools/batch/OperationPicker";
import { StepList } from "@/components/tools/batch/StepList";
import { RunProgress, type FileProgress } from "@/components/tools/batch/RunProgress";
import { ResultsReport } from "@/components/tools/batch/ResultsReport";
import { OPERATIONS } from "@/lib/pipeline/operations";
import { runPipeline } from "@/lib/pipeline/runPipeline";
import type { FileStatus, PipelineInput, PipelineStep } from "@/lib/pipeline/types";
import type { FileWithPreview } from "@/types/tools";
import { generateId } from "@/lib/utils";

type Phase = "build" | "running" | "results";

export default function BatchClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [steps, setSteps] = useState<PipelineStep[]>([]);
    const [phase, setPhase] = useState<Phase>("build");
    const [progress, setProgress] = useState<FileProgress[]>([]);
    const [done, setDone] = useState(0);
    const [results, setResults] = useState<FileStatus[]>([]);
    const abortRef = useRef<AbortController | null>(null);

    function addStep(opId: string) {
        setSteps((s) => [...s, { id: generateId(), opId, options: structuredClone(OPERATIONS[opId].defaultOptions) }]);
    }

    async function run() {
        const inputs: PipelineInput[] = await Promise.all(
            files.map(async (f) => ({ name: f.file.name, bytes: new Uint8Array(await f.file.arrayBuffer()) })),
        );
        setProgress(inputs.map((i) => ({ name: i.name, state: "queued" as const })));
        setDone(0);
        setPhase("running");
        const controller = new AbortController();
        abortRef.current = controller;

        const res = await runPipeline(inputs, steps, OPERATIONS, (e) => {
            if (e.type === "file-start") {
                setProgress((p) => p.map((x, i) => (i === e.fileIndex ? { ...x, state: "running" } : x)));
            } else if (e.type === "file-done") {
                setProgress((p) => p.map((x, i) => (i === e.fileIndex ? { ...x, state: e.status.status === "success" ? "done" : "failed" } : x)));
                setDone((d) => d + 1);
            }
        }, controller.signal);

        setResults(res);
        setPhase("results");
    }

    function reset() {
        setSteps([]); setFiles([]); setResults([]); setProgress([]); setDone(0); setPhase("build");
    }

    const canRun = files.length > 0 && steps.length > 0;

    // Non-blocking ordering nudge (spec: error handling).
    const orderingWarnings: string[] = [];
    const protectIdx = steps.findIndex((s) => s.opId === "protect");
    const unlockIdx = steps.findIndex((s) => s.opId === "unlock");
    if (protectIdx !== -1 && protectIdx !== steps.length - 1) {
        orderingWarnings.push("Protect usually works best as the last step — later steps may fail on an encrypted file.");
    }
    if (unlockIdx > 0) {
        orderingWarnings.push("Unlock usually works best as the first step.");
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6 p-4">
            <header>
                <h1 className="text-2xl font-bold">Batch Process</h1>
                <p className="text-gray-500">Run a chain of operations across many PDFs at once.</p>
            </header>

            {phase === "build" && (
                <>
                    <FileUploader accept={{ "application/pdf": [".pdf"] }} multiple files={files} onFilesChange={setFiles}
                        label="Drop your PDFs here" />
                    {steps.length > 0 && <StepList steps={steps} onChange={setSteps} />}
                    <OperationPicker onAdd={addStep} />
                    {orderingWarnings.length > 0 && (
                        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-200">
                            {orderingWarnings.map((w) => <p key={w}>⚠ {w}</p>)}
                        </div>
                    )}
                    <button type="button" disabled={!canRun} onClick={run}
                        className="w-full rounded-lg bg-primary-500 p-3 text-white font-medium disabled:opacity-40 hover:bg-primary-600">
                        Run on {files.length} file{files.length === 1 ? "" : "s"}
                    </button>
                </>
            )}

            {phase === "running" && (
                <RunProgress files={progress} done={done} total={progress.length}
                    onCancel={() => abortRef.current?.abort()} />
            )}

            {phase === "results" && <ResultsReport results={results} onReset={reset} />}
        </div>
    );
}
```

- [ ] **Step 2: Verify type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors. (If `FileUploader` requires additional props, match its interface in `src/components/tools/FileUploader.tsx`.)

- [ ] **Step 3: Commit**

```bash
git add "src/app/(tools)/batch/BatchClient.tsx"
git commit -m "feat(batch): add BatchClient orchestrator"
```

---

## Task 9: Route page + registry + icon wiring

**Files:**
- Create: `src/app/(tools)/batch/page.tsx`
- Modify: `src/lib/icons.ts`
- Modify: `src/lib/constants.ts`

- [ ] **Step 1: Add the page with SEO metadata**

`src/app/(tools)/batch/page.tsx`:

```tsx
import { Metadata } from "next";
import BatchClient from "./BatchClient";

export const metadata: Metadata = {
    title: "Batch Process PDFs - Chain Operations Across Many Files",
    description:
        "Drop many PDFs, build a chain of operations (compress, rotate, watermark, page numbers, metadata, protect, unlock), run them all at once, and download a zip. Entirely in your browser.",
    openGraph: {
        title: "Batch Process PDFs - Chain Operations Across Many Files",
        description: "Run a chain of PDF operations across many files at once, entirely in your browser.",
    },
};

export default function BatchPage() {
    return <BatchClient />;
}
```

- [ ] **Step 2: Add the Workflow icon**

In `src/lib/icons.ts`, add `Workflow` to the import list and to `ICON_MAP`:

```ts
// in the import from "lucide-react": add `Workflow,`
// in ICON_MAP: add `    Workflow,`
```

- [ ] **Step 3: Register the tool**

In `src/lib/constants.ts`, add to the `TOOLS` array (in the "Organize" group, after `organize-pdf`):

```ts
    {
        id: "batch-pdf",
        name: "Batch Process",
        description: "Chain operations across many PDFs at once",
        href: "/batch",
        icon: "Workflow",
        category: "organize",
        color: "from-violet-500 to-violet-600",
    },
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: build succeeds; `/batch` appears in the route list.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(tools)/batch/page.tsx" src/lib/icons.ts src/lib/constants.ts
git commit -m "feat(batch): add /batch route, Workflow icon, and tool registry entry"
```

---

## Task 10: Full test run + manual verification

- [ ] **Step 1: Run the whole suite**

Run: `npx vitest run`
Expected: all tests PASS, including the new pipeline tests.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Manual smoke test (dev server)**

Run: `npm run dev`, open `/batch`. Verify:
- Drop 2-3 PDFs; add Compress → Watermark → Page numbers; reorder via drag; configure watermark text.
- Click Run; watch the per-file checklist; land on results; download the zip and confirm it contains the processed PDFs.
- Add a Protect step with a password and a deliberately broken/empty file to confirm per-file failure isolation (failed file excluded from zip, reason shown).

- [ ] **Step 4: Commit any fixes, then open PR**

```bash
git add -A && git commit -m "test(batch): verify full pipeline end-to-end"
```

---

## Self-Review Notes (for the planner)

- **Spec coverage:** ops set (Task 3/5), engine + per-file isolation (Task 2), zip + individual downloads (Task 4/7), vertical stepper + inline accordion (Task 6), run progress + cancel (Task 7/8), results report with reasons (Task 7), non-blocking ordering nudge (Task 8), route/registry/limits (Task 9). All spec requirements have a task.
- **Watermark is text-only in v1:** the spec table listed "text/image", but a uniform batch image watermark would need a separately-uploaded image asset. v1 ships text watermark only (`addTextWatermark`); image watermark is a future enhancement. Note this in the PR.
- **Compress options:** the existing `compressPDF` ignores level, so the compress op ships with no options (documented in the UI). Honest to current behavior; revisit if real level support lands.
