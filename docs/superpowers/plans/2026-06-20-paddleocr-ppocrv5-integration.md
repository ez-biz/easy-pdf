# PaddleOCR (PP-OCRv5) Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Tesseract-only OCR in the "OCR PDF" tool with a high-accuracy PP-OCRv5 engine (`client-side-ocr`) as the default, keeping `tesseract.js` as a selectable fallback — all client-side.

**Architecture:** A small engine abstraction (`src/lib/ocr/`) puts both OCR engines behind one `OcrEngine` interface. `OcrClient` rasterizes each PDF page to a canvas (as today), then calls the selected engine. **Both libraries manage their own internal Web Workers for heavy compute**, so we do NOT build a custom wrapper worker — orchestration stays on the main thread, inference does not. Engines and models are loaded lazily via dynamic `import()` so nothing OCR-related ships in the initial bundle.

**Tech Stack:** Next.js 15 (static export), React 19, TypeScript, `client-side-ocr` (PP-OCRv5 / onnxruntime-web), `tesseract.js`, `pdfjs-dist`, vitest.

> **Deviation from design spec (§3.2/§3.3):** the spec described a custom `ocr.worker.ts` + `useOcrWorker` hook. During planning we confirmed both engines already run compute in internal workers, so a custom wrapper would nest `onnxruntime-web` in a worker-of-a-worker (fragile under webpack) for no benefit. This plan omits it. Heavy inference still runs off the main thread via each library's own workers. Update the spec to match after approval.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/ocr/types.ts` | `OcrEngine` interface, `OcrPageResult`, `OcrEngineId` |
| `src/lib/ocr/languages.ts` | Language data + UI↔engine code mapping helpers |
| `src/lib/ocr/tesseractEngine.ts` | `tesseract.js` behind `OcrEngine` |
| `src/lib/ocr/paddleEngine.ts` | `client-side-ocr` (PP-OCRv5) behind `OcrEngine` |
| `src/lib/ocr/index.ts` | `getEngine(id)` selector + `joinPages()` text assembly |
| `src/lib/ocr/__tests__/*.test.ts` | Unit tests for the pure pieces |
| `src/app/(tools)/ocr-pdf/OcrClient.tsx` | UI: engine toggle, language mapping, two-phase progress, fallback |
| `next.config.ts` | (Conditional) PWA runtime caching / ort wasm asset handling |
| `public/models/ppocr/` | (Conditional) self-hosted PP-OCRv5 ONNX models |

---

## Task 1: Install dependency & spike the library

**Files:**
- Modify: `package.json`, `package-lock.json`
- Create (scratch): `scripts/ocr-spike.md` (findings notes — delete or keep)

This task de-risks the three unknowns before any code depends on them: (a) the exact published package name, (b) `processImage`'s accepted input types, (c) whether model paths are self-hostable, (d) the real PP-OCRv5 language codes.

- [ ] **Step 1: Install the package**

Run:
```bash
npm install client-side-ocr
```
Expected: installs without peer-dependency errors. If the name resolves to a different published artifact, check `npm view client-side-ocr` and the `siva-sub/client-ocr` GitHub README, then use the correct name and record it.

- [ ] **Step 2: Confirm the API surface from the installed package**

Run:
```bash
node -e "const m=require('client-side-ocr'); console.log(Object.keys(m))"
```
Expected: output includes `createRapidOCREngine` (or the documented factory). Inspect `node_modules/client-side-ocr/dist/*.d.ts` for: the factory options (`language`, `modelVersion`), `initialize()`, `processImage(input, options)` accepted `input` types, and any **model path / base URL** config option.

- [ ] **Step 3: Record findings**

Write a short `scripts/ocr-spike.md` capturing: exact package name, factory name, `processImage` accepted input types (Blob? Canvas? ImageData?), the model-path option name if any (else "none — CDN download only"), and the list of supported PP-OCRv5 language codes (e.g. `en`, `ch`, `japan`, `korean`, `latin`, `arabic`, `devanagari`, `french`, `german`). These feed Tasks 5, 3, and 7.

- [ ] **Step 4: Verify build still passes**

Run:
```bash
npm run build
```
Expected: build succeeds (the package isn't imported yet, so this only checks it didn't break install/types).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json scripts/ocr-spike.md
git commit -m "chore(ocr): add client-side-ocr dependency and record spike findings"
```

---

## Task 2: Engine types

**Files:**
- Create: `src/lib/ocr/types.ts`

- [ ] **Step 1: Write the types**

```typescript
// src/lib/ocr/types.ts

/** Normalized result both engines return, one per page. */
export interface OcrPageResult {
    text: string;
    /** Overall confidence in the range 0..1. */
    confidence: number;
    lines?: { text: string; confidence: number }[];
}

export type OcrEngineId = "paddle" | "tesseract";

export interface OcrEngine {
    /**
     * Prepare the engine for a language. May download/initialize models.
     * `onProgress` reports model-load progress (0..100) with a stage label.
     * Safe to call repeatedly; cheap when already initialized for `lang`.
     */
    init(lang: string, onProgress?: (progress: number, stage: string) => void): Promise<void>;
    /** Run OCR on a rendered page. `lang` is the engine-specific language code. */
    recognize(canvas: HTMLCanvasElement, lang: string): Promise<OcrPageResult>;
    /** Release resources / internal workers. */
    terminate(): void;
}
```

- [ ] **Step 2: Typecheck**

Run:
```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/ocr/types.ts
git commit -m "feat(ocr): add OcrEngine interface and result types"
```

---

## Task 3: Language mapping

**Files:**
- Create: `src/lib/ocr/languages.ts`
- Test: `src/lib/ocr/__tests__/languages.test.ts`

> **Note:** the `paddleCode` values below are best-known PP-OCRv5 codes. Correct them from the Task 1 spike findings if they differ. The tests assert helper *behavior*, not specific code strings, so they remain valid after corrections.

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/ocr/__tests__/languages.test.ts
import { describe, it, expect } from "vitest";
import {
    OCR_LANGUAGES,
    getLanguage,
    getEngineLangCode,
    isSupportedBy,
} from "@/lib/ocr/languages";

describe("languages", () => {
    it("includes English mapped for both engines", () => {
        expect(getEngineLangCode("tesseract", "eng")).toBe("eng");
        expect(getEngineLangCode("paddle", "eng")).toBe("en");
    });

    it("returns undefined for an unknown ui code", () => {
        expect(getLanguage("zzz")).toBeUndefined();
        expect(getEngineLangCode("paddle", "zzz")).toBeUndefined();
        expect(isSupportedBy("paddle", "zzz")).toBe(false);
    });

    it("treats a language without a paddleCode as unsupported by paddle but supported by tesseract", () => {
        const noPaddle = OCR_LANGUAGES.find((l) => l.paddleCode === undefined);
        // Guard: if every language has a paddleCode, this assertion is vacuously skipped.
        if (noPaddle) {
            expect(isSupportedBy("paddle", noPaddle.uiCode)).toBe(false);
            expect(isSupportedBy("tesseract", noPaddle.uiCode)).toBe(true);
        }
        // Tesseract supports every listed language (universal fallback).
        for (const l of OCR_LANGUAGES) {
            expect(isSupportedBy("tesseract", l.uiCode)).toBe(true);
        }
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/ocr/__tests__/languages.test.ts`
Expected: FAIL — `Cannot find module '@/lib/ocr/languages'`.

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/ocr/languages.ts
import type { OcrEngineId } from "./types";

export interface OcrLanguage {
    uiCode: string;          // value stored in the dropdown / state
    label: string;
    tesseractCode: string;   // always present — Tesseract is the universal fallback
    paddleCode?: string;     // present only if PP-OCRv5 supports the language
}

export const OCR_LANGUAGES: OcrLanguage[] = [
    { uiCode: "eng", label: "English", tesseractCode: "eng", paddleCode: "en" },
    { uiCode: "chi_sim", label: "Chinese (Simplified)", tesseractCode: "chi_sim", paddleCode: "ch" },
    { uiCode: "jpn", label: "Japanese", tesseractCode: "jpn", paddleCode: "japan" },
    { uiCode: "kor", label: "Korean", tesseractCode: "kor", paddleCode: "korean" },
    { uiCode: "fra", label: "French", tesseractCode: "fra", paddleCode: "french" },
    { uiCode: "deu", label: "German", tesseractCode: "deu", paddleCode: "german" },
    { uiCode: "spa", label: "Spanish", tesseractCode: "spa", paddleCode: "latin" },
    { uiCode: "ita", label: "Italian", tesseractCode: "ita", paddleCode: "latin" },
    { uiCode: "por", label: "Portuguese", tesseractCode: "por", paddleCode: "latin" },
    { uiCode: "hin", label: "Hindi", tesseractCode: "hin", paddleCode: "devanagari" },
    { uiCode: "ara", label: "Arabic", tesseractCode: "ara", paddleCode: "arabic" },
];

export function getLanguage(uiCode: string): OcrLanguage | undefined {
    return OCR_LANGUAGES.find((l) => l.uiCode === uiCode);
}

export function getEngineLangCode(engine: OcrEngineId, uiCode: string): string | undefined {
    const lang = getLanguage(uiCode);
    if (!lang) return undefined;
    return engine === "paddle" ? lang.paddleCode : lang.tesseractCode;
}

export function isSupportedBy(engine: OcrEngineId, uiCode: string): boolean {
    return getEngineLangCode(engine, uiCode) !== undefined;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/ocr/__tests__/languages.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/ocr/languages.ts src/lib/ocr/__tests__/languages.test.ts
git commit -m "feat(ocr): add language data and engine code mapping"
```

---

## Task 4: Tesseract engine wrapper

**Files:**
- Create: `src/lib/ocr/tesseractEngine.ts`
- Test: `src/lib/ocr/__tests__/tesseractEngine.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/ocr/__tests__/tesseractEngine.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const recognizeMock = vi.fn();
vi.mock("tesseract.js", () => ({
    default: { recognize: (...args: unknown[]) => recognizeMock(...args) },
}));

import { tesseractEngine } from "@/lib/ocr/tesseractEngine";

describe("tesseractEngine", () => {
    beforeEach(() => recognizeMock.mockReset());

    it("normalizes confidence from 0..100 to 0..1", async () => {
        recognizeMock.mockResolvedValue({ data: { text: "hello world", confidence: 90 } });
        const canvas = document.createElement("canvas");
        const result = await tesseractEngine.recognize(canvas, "eng");
        expect(result.text).toBe("hello world");
        expect(result.confidence).toBeCloseTo(0.9);
        expect(recognizeMock).toHaveBeenCalledWith(canvas, "eng");
    });

    it("defaults missing fields safely", async () => {
        recognizeMock.mockResolvedValue({ data: {} });
        const result = await tesseractEngine.recognize(document.createElement("canvas"), "eng");
        expect(result.text).toBe("");
        expect(result.confidence).toBe(0);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/ocr/__tests__/tesseractEngine.test.ts`
Expected: FAIL — `Cannot find module '@/lib/ocr/tesseractEngine'`.

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/ocr/tesseractEngine.ts
import type { OcrEngine } from "./types";

/**
 * Wraps tesseract.js. Imported dynamically so it stays out of the initial
 * bundle and only loads when OCR actually runs. tesseract.js manages its
 * own worker internally, so no wrapper worker is needed here.
 */
export const tesseractEngine: OcrEngine = {
    async init() {
        // No-op: Tesseract.recognize lazily creates its own worker per call.
    },

    async recognize(canvas, lang) {
        const Tesseract = (await import("tesseract.js")).default;
        const { data } = await Tesseract.recognize(canvas, lang);
        return {
            text: data.text ?? "",
            confidence: (data.confidence ?? 0) / 100,
        };
    },

    terminate() {
        // Nothing persistent to release in the per-call recognize() path.
    },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/ocr/__tests__/tesseractEngine.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/ocr/tesseractEngine.ts src/lib/ocr/__tests__/tesseractEngine.test.ts
git commit -m "feat(ocr): wrap tesseract.js behind OcrEngine"
```

---

## Task 5: PaddleOCR (PP-OCRv5) engine wrapper

**Files:**
- Create: `src/lib/ocr/paddleEngine.ts`
- Test: `src/lib/ocr/__tests__/paddleEngine.test.ts`

> **Spike-dependent:** if Task 1 found that `processImage` accepts a canvas directly, you may pass `canvas` instead of converting to a Blob. The Blob path below is the safe default. If the factory exposes a model-path option, thread it through here (see Task 7).

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/ocr/__tests__/paddleEngine.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const initializeMock = vi.fn();
const processImageMock = vi.fn();
const createMock = vi.fn(() => ({ initialize: initializeMock, processImage: processImageMock }));

vi.mock("client-side-ocr", () => ({
    createRapidOCREngine: (...args: unknown[]) => createMock(...args),
}));

import { paddleEngine } from "@/lib/ocr/paddleEngine";

describe("paddleEngine", () => {
    beforeEach(() => {
        createMock.mockClear();
        initializeMock.mockReset().mockResolvedValue(undefined);
        processImageMock.mockReset();
        paddleEngine.terminate();
        // jsdom canvas.toBlob is not implemented — stub it.
        HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback) {
            cb(new Blob(["x"], { type: "image/png" }));
        };
    });

    it("initializes once per language and normalizes the result", async () => {
        processImageMock.mockResolvedValue({ text: "hola", confidence: 0.95, lines: [] });
        const canvas = document.createElement("canvas");

        const r1 = await paddleEngine.recognize(canvas, "en");
        const r2 = await paddleEngine.recognize(canvas, "en");

        expect(r1).toEqual({ text: "hola", confidence: 0.95, lines: [] });
        expect(r2.text).toBe("hola");
        // Same language → engine created only once.
        expect(createMock).toHaveBeenCalledTimes(1);
        expect(createMock).toHaveBeenCalledWith(
            expect.objectContaining({ language: "en", modelVersion: "PP-OCRv5" })
        );
    });

    it("recreates the engine when the language changes", async () => {
        processImageMock.mockResolvedValue({ text: "x", confidence: 1 });
        const canvas = document.createElement("canvas");
        await paddleEngine.recognize(canvas, "en");
        await paddleEngine.recognize(canvas, "ch");
        expect(createMock).toHaveBeenCalledTimes(2);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/ocr/__tests__/paddleEngine.test.ts`
Expected: FAIL — `Cannot find module '@/lib/ocr/paddleEngine'`.

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/ocr/paddleEngine.ts
import type { OcrEngine } from "./types";

interface RapidEngine {
    initialize(): Promise<void>;
    processImage(
        input: Blob,
        options?: { enableWordSegmentation?: boolean; returnConfidence?: boolean }
    ): Promise<{ text?: string; confidence?: number; lines?: { text: string; confidence: number }[] }>;
}

let instance: RapidEngine | null = null;
let currentLang: string | null = null;

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("canvas.toBlob returned null"))),
            "image/png"
        );
    });
}

/**
 * Wraps client-side-ocr (PP-OCRv5). Imported dynamically so the ~15-30MB of
 * models/onnxruntime-web only load when OCR runs. The library manages its own
 * detection/recognition workers internally.
 */
export const paddleEngine: OcrEngine = {
    async init(lang, onProgress) {
        if (instance && currentLang === lang) return;
        instance = null;
        onProgress?.(0, "Loading OCR model…");
        const { createRapidOCREngine } = await import("client-side-ocr");
        const engine = createRapidOCREngine({ language: lang, modelVersion: "PP-OCRv5" }) as RapidEngine;
        await engine.initialize();
        instance = engine;
        currentLang = lang;
        onProgress?.(100, "Model ready");
    },

    async recognize(canvas, lang) {
        if (!instance || currentLang !== lang) {
            await this.init(lang);
        }
        const blob = await canvasToBlob(canvas);
        const res = await instance!.processImage(blob, {
            enableWordSegmentation: true,
            returnConfidence: true,
        });
        return {
            text: res.text ?? "",
            confidence: res.confidence ?? 0,
            lines: res.lines,
        };
    },

    terminate() {
        instance = null;
        currentLang = null;
    },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/ocr/__tests__/paddleEngine.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/ocr/paddleEngine.ts src/lib/ocr/__tests__/paddleEngine.test.ts
git commit -m "feat(ocr): wrap client-side-ocr PP-OCRv5 behind OcrEngine"
```

---

## Task 6: Engine selector & page-text assembly

**Files:**
- Create: `src/lib/ocr/index.ts`
- Test: `src/lib/ocr/__tests__/index.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/ocr/__tests__/index.test.ts
import { describe, it, expect } from "vitest";
import { getEngine, joinPages } from "@/lib/ocr";
import { paddleEngine } from "@/lib/ocr/paddleEngine";
import { tesseractEngine } from "@/lib/ocr/tesseractEngine";

describe("getEngine", () => {
    it("returns the matching engine singleton", () => {
        expect(getEngine("paddle")).toBe(paddleEngine);
        expect(getEngine("tesseract")).toBe(tesseractEngine);
    });
});

describe("joinPages", () => {
    it("joins pages with a page-break separator", () => {
        expect(joinPages(["a", "b"])).toBe("a\n\n--- Page Break ---\n\nb");
    });
    it("returns a single page unchanged", () => {
        expect(joinPages(["only"])).toBe("only");
    });
    it("returns empty string for no pages", () => {
        expect(joinPages([])).toBe("");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/ocr/__tests__/index.test.ts`
Expected: FAIL — `Cannot find module '@/lib/ocr'`.

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/ocr/index.ts
import type { OcrEngine, OcrEngineId } from "./types";
import { tesseractEngine } from "./tesseractEngine";
import { paddleEngine } from "./paddleEngine";

export function getEngine(id: OcrEngineId): OcrEngine {
    return id === "paddle" ? paddleEngine : tesseractEngine;
}

const PAGE_SEPARATOR = "\n\n--- Page Break ---\n\n";

export function joinPages(pages: string[]): string {
    return pages.join(PAGE_SEPARATOR);
}

export type { OcrEngine, OcrEngineId, OcrPageResult } from "./types";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/ocr/__tests__/index.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: all tests pass (existing + new OCR tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/ocr/index.ts src/lib/ocr/__tests__/index.test.ts
git commit -m "feat(ocr): add engine selector and page-text assembly"
```

---

## Task 7: Model & onnxruntime-web asset hosting (conditional)

**Files:**
- Conditional Modify: `next.config.ts`
- Conditional Create: `public/models/ppocr/*`, `public/ort/*`
- Conditional Create: `src/lib/ocr/ortConfig.ts`

Pick the branch based on the Task 1 spike. The goal: OCR works offline after first use (the app is a PWA) and the static export serves any required `.wasm`.

### Branch A — `createRapidOCREngine` accepts a model base path

- [ ] **Step A1: Download PP-OCRv5 mobile models** (det, rec, cls + dictionary) into `public/models/ppocr/`, matching the filenames the library expects (from spike notes).

- [ ] **Step A2: Create `src/lib/ocr/ortConfig.ts`** to point onnxruntime-web at self-hosted wasm:

```typescript
// src/lib/ocr/ortConfig.ts
// Call once before engine init. Copy the ort-*.wasm files shipped in
// node_modules/onnxruntime-web/dist into public/ort/ during the build.
export async function configureOrt(): Promise<void> {
    const ort = await import("onnxruntime-web");
    ort.env.wasm.wasmPaths = "/ort/";
}
```

- [ ] **Step A3:** In `paddleEngine.init`, call `await configureOrt()` before `createRapidOCREngine`, and pass the model base path option (exact option name from spike), e.g. `createRapidOCREngine({ language: lang, modelVersion: "PP-OCRv5", modelPath: "/models/ppocr/" })`. Update `paddleEngine.test.ts`'s `objectContaining` only if you add asserted fields.

- [ ] **Step A4:** Add an npm `prebuild` step (or copy in `next.config.ts`) to copy `node_modules/onnxruntime-web/dist/*.wasm` → `public/ort/`. Verify `npm run build` emits them under `out/ort/`.

### Branch B — no model-path option (CDN download on first run)

- [ ] **Step B1: Add PWA runtime caching** so the CDN-downloaded models persist offline. In `next.config.ts`, pass `workboxOptions.runtimeCaching` to `withPWAInit` with a `CacheFirst` rule matching the model host (from spike notes), e.g.:

```typescript
const withPWA = withPWAInit({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    workboxOptions: {
        runtimeCaching: [
            {
                // Replace with the real model CDN host from the spike.
                urlPattern: /^https:\/\/.*\.(?:onnx|wasm)$/i,
                handler: "CacheFirst",
                options: {
                    cacheName: "ocr-models",
                    expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 90 },
                    cacheableResponse: { statuses: [0, 200] },
                },
            },
        ],
    },
});
```

- [ ] **Step B2:** Confirm the user-facing copy in `OcrClient` (Task 8) says the model downloads once and that **user files never leave the browser** (only model weights are fetched).

### Both branches

- [ ] **Step Z1: Verify build**

Run: `npm run build`
Expected: build succeeds; static export under `out/` includes any self-hosted assets.

- [ ] **Step Z2: Commit**

```bash
git add -A
git commit -m "feat(ocr): host/cache PP-OCRv5 models and onnxruntime-web wasm for offline use"
```

---

## Task 8: Wire the engine abstraction into OcrClient

**Files:**
- Modify: `src/app/(tools)/ocr-pdf/OcrClient.tsx`

This replaces the hard-coded Tesseract call with the engine abstraction, adds the engine toggle, drives the language dropdown from `OCR_LANGUAGES`, disables languages the selected engine can't handle, and shows a model-load stage. On a PaddleOCR failure it offers a one-click Tesseract retry.

- [ ] **Step 1: Replace the top imports and language list**

Replace the existing `import Tesseract from "tesseract.js";` and the local `LANGUAGES` array with:

```typescript
import { getEngine, joinPages } from "@/lib/ocr";
import { OCR_LANGUAGES, getEngineLangCode, isSupportedBy } from "@/lib/ocr/languages";
import type { OcrEngineId } from "@/lib/ocr/types";
```

(Keep the existing `pdfjsLib` import and `GlobalWorkerOptions.workerSrc` setup unchanged.)

- [ ] **Step 2: Add engine state and update handlers**

Inside the component, add engine state next to the existing `language` state:

```typescript
const [engineId, setEngineId] = useState<OcrEngineId>("paddle");
```

Replace the `handleOcr` function with the engine-driven version:

```typescript
const runOcr = async (useEngine: OcrEngineId) => {
    if (!file) {
        setError("Please upload a PDF file");
        return;
    }

    const langCode = getEngineLangCode(useEngine, language);
    if (!langCode) {
        setError("Selected language is not supported by this engine. Try the Tesseract engine.");
        return;
    }

    setIsProcessing(true);
    setProgress(0);
    setStage(useEngine === "paddle" ? "Loading OCR model…" : "Loading PDF…");
    setError(null);

    const engine = getEngine(useEngine);

    try {
        await engine.init(langCode, (_p, s) => setStage(s));

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;
        const allText: string[] = [];

        for (let i = 1; i <= totalPages; i++) {
            setStage(`Processing page ${i} of ${totalPages}…`);
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement("canvas");
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const context = canvas.getContext("2d")!;
            await page.render({ canvasContext: context, viewport }).promise;

            const { text } = await engine.recognize(canvas, langCode);
            allText.push(text);
            setProgress(Math.round((i / totalPages) * 100));
        }

        const text = joinPages(allText);
        setResult({ text, blob: new Blob([text], { type: "text/plain" }) });
        setStage("");
    } catch (err) {
        const message = err instanceof Error ? err.message : "An error occurred during OCR processing";
        if (useEngine === "paddle") {
            // Offer a Tesseract fallback rather than dead-ending.
            setError(`High-accuracy engine failed: ${message}. Retrying with Tesseract…`);
            setIsProcessing(false);
            await runOcr("tesseract");
            return;
        }
        setError(message);
    } finally {
        setIsProcessing(false);
    }
};

const handleOcr = () => runOcr(engineId);
```

- [ ] **Step 3: Add the engine toggle UI**

Above the existing language `<select>` block (inside the same settings card), add:

```tsx
<div className="mb-6">
    <span className="block font-semibold text-surface-900 dark:text-white mb-3">OCR Engine</span>
    <div className="grid grid-cols-2 gap-3">
        {([
            { id: "paddle", title: "High accuracy", sub: "PaddleOCR PP-OCRv5" },
            { id: "tesseract", title: "Fast", sub: "Tesseract" },
        ] as const).map((opt) => (
            <button
                key={opt.id}
                type="button"
                onClick={() => setEngineId(opt.id)}
                aria-pressed={engineId === opt.id}
                className={`rounded-xl border p-3 text-left transition focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none ${
                    engineId === opt.id
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                        : "border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900"
                }`}
            >
                <span className="block font-medium text-surface-900 dark:text-white">{opt.title}</span>
                <span className="block text-xs text-surface-500">{opt.sub}</span>
            </button>
        ))}
    </div>
    {engineId === "paddle" && (
        <p className="mt-2 text-xs text-surface-500">
            First run downloads the OCR model once (~15–30&nbsp;MB), then works offline. Your files never leave your browser.
        </p>
    )}
</div>
```

- [ ] **Step 4: Drive the language dropdown from OCR_LANGUAGES with per-engine disabling**

Replace the `LANGUAGES.map(...)` options with:

```tsx
{OCR_LANGUAGES.map((lang) => {
    const supported = isSupportedBy(engineId, lang.uiCode);
    return (
        <option key={lang.uiCode} value={lang.uiCode} disabled={!supported}>
            {lang.label}
            {!supported ? " (not in this engine)" : ""}
        </option>
    );
})}
```

Add an effect so switching to an engine that doesn't support the current language resets it to English:

```typescript
useEffect(() => {
    if (!isSupportedBy(engineId, language)) {
        setLanguage("eng");
    }
}, [engineId, language]);
```

(Add `useEffect` to the existing `react` import.)

- [ ] **Step 5: Typecheck and lint**

Run:
```bash
npx tsc --noEmit && npm run lint
```
Expected: no type errors; lint passes.

- [ ] **Step 6: Build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(tools)/ocr-pdf/OcrClient.tsx"
git commit -m "feat(ocr): use PP-OCRv5 by default with Tesseract fallback in OCR tool"
```

---

## Task 9: Manual verification & docs

**Files:**
- Modify: `README.md` (feature description)

Real ONNX/WASM inference cannot run in jsdom/CI, so accuracy is verified by hand.

- [ ] **Step 1: Run the app**

Run: `npm run dev`, open `http://localhost:3000`, navigate to the OCR PDF tool.

- [ ] **Step 2: Verify PaddleOCR path**

Upload a scanned PDF. With "High accuracy" selected, confirm: the "Loading OCR model…" stage appears on first run, per-page progress advances, and extracted text appears. Note quality vs. expectations.

- [ ] **Step 3: Compare against Tesseract**

Switch to "Fast (Tesseract)", run the same PDF, and confirm PaddleOCR output is at least as good (ideally clearly better) on the sample. Record a one-line before/after note in the PR description.

- [ ] **Step 4: Verify fallback**

Temporarily force a PaddleOCR failure (e.g. block the model request in devtools), run OCR, and confirm it auto-retries with Tesseract and still produces text.

- [ ] **Step 5: Verify offline (PWA)**

After a successful first run, build + serve the export (`npm run build && npx serve out`), reload, go offline (devtools), and confirm OCR still runs from cache/self-hosted models.

- [ ] **Step 6: Update README**

In `README.md`, update the OCR entry to mention PP-OCRv5 high-accuracy OCR with a Tesseract fallback, still 100% client-side.

- [ ] **Step 7: Commit**

```bash
git add README.md
git commit -m "docs: note PP-OCRv5 high-accuracy OCR with Tesseract fallback"
```

---

## Self-Review Notes

- **Spec coverage:** engine abstraction (Tasks 2,4,5,6) ✓; PP-OCRv5 via client-side-ocr (Task 5) ✓; Tesseract fallback (Tasks 4,8) ✓; lazy model loading (dynamic imports in Tasks 4,5) ✓; self-hosted-or-cached models (Task 7) ✓; engine toggle + language mapping + two-phase progress (Tasks 3,8) ✓; error handling/fallback (Task 8) ✓; testing of pure pieces + manual inference check (Tasks 3–6,9) ✓; YAGNI scope (no searchable-PDF/batch) ✓.
- **Deviation:** custom worker + `useOcrWorker` from spec §3.2/§3.3 intentionally dropped (libraries self-manage workers). Update the spec after approval.
- **Type consistency:** `OcrEngine` (`init`/`recognize`/`terminate`), `OcrPageResult` (`text`/`confidence`/`lines?`), `OcrEngineId` (`"paddle"|"tesseract"`), `getEngine`, `joinPages`, `getEngineLangCode`, `isSupportedBy` used consistently across tasks.
- **Spike-dependent specifics** (package name, `processImage` input type, model-path option, exact PP-OCRv5 language codes) are isolated to Tasks 1, 5, 7 and flagged inline.
