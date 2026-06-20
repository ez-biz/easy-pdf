# PaddleOCR (PP-OCRv5) Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Tesseract-only OCR in the "OCR PDF" tool with a high-accuracy PP-OCRv5 engine (`ppu-paddle-ocr`) as the default, keeping `tesseract.js` as a selectable fallback for languages the default model doesn't cover — all client-side.

**Architecture:** A small engine abstraction (`src/lib/ocr/`) puts both OCR engines behind one `OcrEngine` interface. `OcrClient` rasterizes each PDF page to a canvas (as today), then calls the selected engine. **The heavy compute runs off the main thread inside `onnxruntime-web` (WebGPU/WASM) and Tesseract's own worker**, so we do NOT build a custom wrapper worker. Engines and models are loaded lazily via dynamic `import()` so nothing OCR-related ships in the initial bundle.

**Tech Stack:** Next.js 15 (static export), React 19, TypeScript, `ppu-paddle-ocr` + `onnxruntime-web` (PP-OCRv5), `tesseract.js`, `pdfjs-dist`, vitest.

> **Engine note:** the originally-chosen `client-side-ocr` was found broken/unpublishable in the spike and removed; we pivoted to `ppu-paddle-ocr` (verified importable). `ppu-paddle-ocr` selects language by recognition model, so v1 ships only the default PP-OCRv5 model (Latin-script) with Tesseract as the fallback for other scripts. The spec's custom `ocr.worker.ts`/`useOcrWorker` are intentionally omitted (libraries already run inference off-thread).

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/ocr/types.ts` | `OcrEngine` interface, `OcrPageResult`, `OcrEngineId` |
| `src/lib/ocr/languages.ts` | Language data + UI↔engine code mapping helpers |
| `src/lib/ocr/tesseractEngine.ts` | `tesseract.js` behind `OcrEngine` |
| `src/lib/ocr/paddleEngine.ts` | `ppu-paddle-ocr` (PP-OCRv5) behind `OcrEngine` |
| `src/lib/ocr/index.ts` | `getEngine(id)` selector + `joinPages()` text assembly |
| `src/lib/ocr/__tests__/*.test.ts` | Unit tests for the pure pieces |
| `src/app/(tools)/ocr-pdf/OcrClient.tsx` | UI: engine toggle, language mapping, two-phase progress, fallback |
| `next.config.ts` | (Conditional) PWA runtime caching / ort wasm asset handling |
| `public/models/ppocr/` | (Conditional) self-hosted PP-OCRv5 ONNX models |

---

## Task 1: Install dependency & spike the library

> **✅ DONE (with a pivot).** Spiking `client-side-ocr` found it broken/unpublishable, so it was removed and we pivoted to **`ppu-paddle-ocr`** + `onnxruntime-web`, which a follow-up spike verified is importable with a real typed API. Both are installed and committed; findings are in `scripts/ocr-spike.md`. The original step text below is retained for history. Proceed from Task 2.

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

> **Engine model note:** `ppu-paddle-ocr` selects language by the recognition *model*, not a code string. For v1 we ship only the default PP-OCRv5 model (Latin script), so a language is "PaddleOCR-supported" iff the default model covers it. We represent this with a boolean `paddleSupported`, NOT a `paddleCode`. Tesseract needs a real code (`tesseractCode`) and supports every language as the universal fallback. The `paddleSupported` set below (English + major European Latin-script languages) is the working assumption; Task 7 confirms the default model's true coverage and trims/extends this list. The tests assert helper *behavior*, so they stay valid regardless.

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/ocr/__tests__/languages.test.ts
import { describe, it, expect } from "vitest";
import {
    OCR_LANGUAGES,
    getLanguage,
    getTesseractCode,
    isSupportedBy,
} from "@/lib/ocr/languages";

describe("languages", () => {
    it("maps the Tesseract code and marks English as PaddleOCR-supported", () => {
        expect(getTesseractCode("eng")).toBe("eng");
        expect(isSupportedBy("paddle", "eng")).toBe(true);
        expect(isSupportedBy("tesseract", "eng")).toBe(true);
    });

    it("returns undefined / false for an unknown ui code", () => {
        expect(getLanguage("zzz")).toBeUndefined();
        expect(getTesseractCode("zzz")).toBeUndefined();
        expect(isSupportedBy("paddle", "zzz")).toBe(false);
        expect(isSupportedBy("tesseract", "zzz")).toBe(false);
    });

    it("routes a non-Latin language (e.g. Arabic) to Tesseract only in v1", () => {
        expect(isSupportedBy("tesseract", "ara")).toBe(true);
        expect(isSupportedBy("paddle", "ara")).toBe(false);
    });

    it("supports every listed language under Tesseract (universal fallback)", () => {
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
    paddleSupported: boolean; // true iff the default PP-OCRv5 model (Latin script, v1) covers it
}

// v1: the default ppu-paddle-ocr PP-OCRv5 model is Latin-script. Mark those true;
// non-Latin scripts (CJK, Devanagari, Arabic) route to Tesseract until we host their models.
export const OCR_LANGUAGES: OcrLanguage[] = [
    { uiCode: "eng", label: "English", tesseractCode: "eng", paddleSupported: true },
    { uiCode: "fra", label: "French", tesseractCode: "fra", paddleSupported: true },
    { uiCode: "deu", label: "German", tesseractCode: "deu", paddleSupported: true },
    { uiCode: "spa", label: "Spanish", tesseractCode: "spa", paddleSupported: true },
    { uiCode: "ita", label: "Italian", tesseractCode: "ita", paddleSupported: true },
    { uiCode: "por", label: "Portuguese", tesseractCode: "por", paddleSupported: true },
    { uiCode: "chi_sim", label: "Chinese (Simplified)", tesseractCode: "chi_sim", paddleSupported: false },
    { uiCode: "jpn", label: "Japanese", tesseractCode: "jpn", paddleSupported: false },
    { uiCode: "kor", label: "Korean", tesseractCode: "kor", paddleSupported: false },
    { uiCode: "hin", label: "Hindi", tesseractCode: "hin", paddleSupported: false },
    { uiCode: "ara", label: "Arabic", tesseractCode: "ara", paddleSupported: false },
];

export function getLanguage(uiCode: string): OcrLanguage | undefined {
    return OCR_LANGUAGES.find((l) => l.uiCode === uiCode);
}

export function getTesseractCode(uiCode: string): string | undefined {
    return getLanguage(uiCode)?.tesseractCode;
}

export function isSupportedBy(engine: OcrEngineId, uiCode: string): boolean {
    const lang = getLanguage(uiCode);
    if (!lang) return false;
    return engine === "paddle" ? lang.paddleSupported : true;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/ocr/__tests__/languages.test.ts`
Expected: PASS (4 tests).

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

> **API (confirmed from spike):** `ppu-paddle-ocr/web` exports `PaddleOcrService`. Construct with self-hosted model paths, `await initialize()`, then `recognize(arrayBuffer, { flatten: true })` → `{ text, confidence, results: { text, box, confidence }[] }`. Input is `ArrayBuffer | CanvasLike` (no Blob/File overload) so the wrapper converts the canvas → PNG blob → `ArrayBuffer`. v1 uses the single default model, so `lang` is ignored by this engine (Tesseract handles non-default languages). The model files are placed by Task 7; reference them by the `/models/ppocr/*` paths here. `onnxruntime-web` wasm path config is NOT done here — it is Task 7's job (ORT defaults work for the unit test, which mocks the library).

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/ocr/__tests__/paddleEngine.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const initializeMock = vi.fn();
const recognizeMock = vi.fn();
// NB: must be a regular function (not an arrow) so it is callable with `new`.
const PaddleOcrServiceMock = vi.fn(function () {
    return { initialize: initializeMock, recognize: recognizeMock };
});

vi.mock("ppu-paddle-ocr/web", () => ({
    PaddleOcrService: PaddleOcrServiceMock,
}));

import { paddleEngine } from "@/lib/ocr/paddleEngine";

describe("paddleEngine", () => {
    beforeEach(() => {
        PaddleOcrServiceMock.mockClear();
        initializeMock.mockReset().mockResolvedValue(undefined);
        recognizeMock.mockReset();
        paddleEngine.terminate();
        // jsdom canvas.toBlob is not implemented — stub it.
        HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback) {
            cb(new Blob(["x"], { type: "image/png" }));
        };
    });

    it("initializes the service once and normalizes flattened results", async () => {
        recognizeMock.mockResolvedValue({
            text: "hola mundo",
            confidence: 0.95,
            results: [
                { text: "hola", confidence: 0.9 },
                { text: "mundo", confidence: 1 },
            ],
        });
        const canvas = document.createElement("canvas");

        const r1 = await paddleEngine.recognize(canvas, "eng");
        const r2 = await paddleEngine.recognize(canvas, "eng");

        expect(r1.text).toBe("hola mundo");
        expect(r1.confidence).toBeCloseTo(0.95);
        expect(r1.lines).toEqual([
            { text: "hola", confidence: 0.9 },
            { text: "mundo", confidence: 1 },
        ]);
        expect(r2.text).toBe("hola mundo");
        // Singleton: constructed and initialized exactly once across calls.
        expect(PaddleOcrServiceMock).toHaveBeenCalledTimes(1);
        expect(initializeMock).toHaveBeenCalledTimes(1);
    });

    it("passes self-hosted model paths and calls recognize with an ArrayBuffer + flatten", async () => {
        recognizeMock.mockResolvedValue({ text: "x", confidence: 1, results: [] });
        const canvas = document.createElement("canvas");
        await paddleEngine.recognize(canvas, "eng");

        expect(PaddleOcrServiceMock).toHaveBeenCalledWith(
            expect.objectContaining({
                model: expect.objectContaining({
                    recognition: expect.stringContaining("/models/ppocr/"),
                }),
            })
        );
        const [img, opts] = recognizeMock.mock.calls[0];
        expect(img).toBeInstanceOf(ArrayBuffer);
        expect(opts).toMatchObject({ flatten: true });
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

interface PaddleRecognitionItem {
    text: string;
    confidence: number;
}

interface PaddleService {
    initialize(): Promise<void>;
    recognize(
        image: ArrayBuffer,
        options?: { flatten?: boolean }
    ): Promise<{ text?: string; confidence?: number; results?: PaddleRecognitionItem[] }>;
}

// Self-hosted PP-OCRv5 default (Latin-script) model files — placed by Task 7.
const MODEL_PATHS = {
    detection: "/models/ppocr/det.ort",
    recognition: "/models/ppocr/rec.ort",
    charactersDictionary: "/models/ppocr/dict.txt",
};

let service: PaddleService | null = null;

function canvasToArrayBuffer(canvas: HTMLCanvasElement): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("canvas.toBlob returned null"));
                return;
            }
            blob.arrayBuffer().then(resolve, reject);
        }, "image/png");
    });
}

/**
 * Wraps ppu-paddle-ocr (PP-OCRv5) via its web entry. Imported dynamically so
 * the model weights and onnxruntime-web runtime only load when OCR actually
 * runs. v1 uses the single default (Latin-script) model, so `lang` is ignored
 * here — Tesseract handles languages the default model does not cover.
 */
export const paddleEngine: OcrEngine = {
    async init(_lang, onProgress) {
        if (service) return;
        onProgress?.(0, "Loading OCR model…");
        const { PaddleOcrService } = await import("ppu-paddle-ocr/web");
        const created = new PaddleOcrService({ model: MODEL_PATHS }) as unknown as PaddleService;
        await created.initialize();
        service = created;
        onProgress?.(100, "Model ready");
    },

    async recognize(canvas, lang) {
        if (!service) await this.init(lang);
        const buffer = await canvasToArrayBuffer(canvas);
        const res = await service!.recognize(buffer, { flatten: true });
        return {
            text: res.text ?? "",
            confidence: res.confidence ?? 0,
            lines: res.results?.map((r) => ({ text: r.text, confidence: r.confidence })),
        };
    },

    terminate() {
        service = null;
    },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/ocr/__tests__/paddleEngine.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/ocr/paddleEngine.ts src/lib/ocr/__tests__/paddleEngine.test.ts
git commit -m "feat(ocr): wrap ppu-paddle-ocr PP-OCRv5 behind OcrEngine"
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

## Task 7: Self-host PP-OCRv5 models & onnxruntime-web wasm

**Files:**
- Create: `public/models/ppocr/{det.ort,rec.ort,dict.txt}` (default PP-OCRv5 model)
- Create: `public/ort/*.wasm` (onnxruntime-web runtime, via a build copy step)
- Create: `src/lib/ocr/ortConfig.ts`
- Modify: `src/lib/ocr/paddleEngine.ts` (call `configureOrt()` before init; align `MODEL_PATHS` to real filenames)
- Modify: `src/lib/ocr/languages.ts` (set `paddleSupported` to the default model's real coverage)
- Modify: `next.config.ts` (PWA `runtimeCaching` for `/models/ppocr/` + `/ort/`)
- Modify: `package.json` (copy ort wasm into `public/ort/` before build)

Goal: OCR runs fully from our own origin and works offline after first use (PWA). No model/runtime is fetched from a third-party host at runtime. Real inference can't run in CI, so this task is verified by build + the Task 9 manual check.

- [ ] **Step 1: Find the default model file URLs + confirm language coverage.** Read the resolved `DEFAULT_MODEL_URLS` from the installed package (e.g. `grep -r "DEFAULT_MODEL_URLS\|githubusercontent\|ppu-paddle-ocr-models" node_modules/ppu-paddle-ocr/`). Note the three default files (detection `.ort`, recognition `.ort`, dictionary `.txt`) and which language/script the default recognition model covers. Record this; it determines the `paddleSupported` list.

- [ ] **Step 2: Download the three default model files** into `public/models/ppocr/`, naming them `det.ort`, `rec.ort`, `dict.txt` (matching `MODEL_PATHS` in `paddleEngine.ts`). If the dictionary is `.txt` vs another extension, name it to match and update `MODEL_PATHS.charactersDictionary` + the `paddleEngine.test.ts` `stringContaining("/models/ppocr/")` assertion if needed. Use `curl -L -o`.

```bash
mkdir -p public/models/ppocr
# URLs from Step 1, e.g.:
curl -L -o public/models/ppocr/det.ort  "<detection .ort url>"
curl -L -o public/models/ppocr/rec.ort  "<recognition .ort url>"
curl -L -o public/models/ppocr/dict.txt "<dictionary url>"
ls -lh public/models/ppocr
```

- [ ] **Step 3: Align `languages.ts` `paddleSupported`** to the Step 1 finding. If the default model is Latin-script (English + French/German/Spanish/Italian/Portuguese), the existing list is correct. If it differs (e.g. covers Chinese/Japanese instead), flip the booleans accordingly and update the `languages.test.ts` "non-Latin → Tesseract only" case to use a language that is genuinely unsupported. Re-run: `npx vitest run src/lib/ocr/__tests__/languages.test.ts`.

- [ ] **Step 4: Create `src/lib/ocr/ortConfig.ts`** to point onnxruntime-web at the self-hosted wasm:

```typescript
// src/lib/ocr/ortConfig.ts
// Points onnxruntime-web at the self-hosted wasm copied into /public/ort/.
// Idempotent — safe to call before every engine init.
let configured = false;

export async function configureOrt(): Promise<void> {
    if (configured) return;
    const ort = await import("onnxruntime-web");
    ort.env.wasm.wasmPaths = "/ort/";
    configured = true;
}
```

- [ ] **Step 5: Call `configureOrt()` in `paddleEngine.init`** before constructing `PaddleOcrService`:

```typescript
// in paddleEngine.init, before `const { PaddleOcrService } = await import(...)`:
const { configureOrt } = await import("./ortConfig");
await configureOrt();
```

Add to `paddleEngine.test.ts` a mock so the unit test does not load real onnxruntime-web:

```typescript
vi.mock("@/lib/ocr/ortConfig", () => ({ configureOrt: vi.fn().mockResolvedValue(undefined) }));
```

Re-run `npx vitest run src/lib/ocr/__tests__/paddleEngine.test.ts` — expected PASS.

- [ ] **Step 6: Copy ort wasm into `public/ort/` via a build step.** Add to `package.json` scripts and ensure it runs before `build`:

```json
"scripts": {
  "copy-ort": "mkdir -p public/ort && cp node_modules/onnxruntime-web/dist/*.wasm public/ort/",
  "prebuild": "npm run copy-ort"
}
```

Run `npm run copy-ort` and confirm `.wasm` files now exist under `public/ort/`. Add `public/ort/` and `public/models/ppocr/` to `.gitignore` ONLY if the team prefers not to commit binaries; otherwise commit them so the static deploy is self-contained (recommended — commit them).

- [ ] **Step 7: Add PWA runtime caching** so the self-hosted models + wasm persist offline. In `next.config.ts`, extend `withPWAInit`:

```typescript
const withPWA = withPWAInit({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    workboxOptions: {
        runtimeCaching: [
            {
                urlPattern: /\/(?:models\/ppocr|ort)\/.*\.(?:ort|wasm|txt)$/i,
                handler: "CacheFirst",
                options: {
                    cacheName: "ocr-assets",
                    expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 90 },
                    cacheableResponse: { statuses: [0, 200] },
                },
            },
        ],
    },
});
```

- [ ] **Step 8: Verify build**

Run: `npm run build`
Expected: build succeeds; `out/models/ppocr/` and `out/ort/` contain the assets.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(ocr): self-host PP-OCRv5 models + onnxruntime-web wasm for offline OCR"
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
import { OCR_LANGUAGES, getTesseractCode, isSupportedBy } from "@/lib/ocr/languages";
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

    if (!isSupportedBy(useEngine, language)) {
        setError("Selected language isn't available for this engine. Switch engine or language.");
        return;
    }
    // Tesseract needs its language code; the PaddleOCR v1 default model is
    // language-agnostic, so we pass the UI code through (the engine ignores it).
    const langArg = useEngine === "tesseract" ? getTesseractCode(language)! : language;

    setIsProcessing(true);
    setProgress(0);
    setStage(useEngine === "paddle" ? "Loading OCR model…" : "Loading PDF…");
    setError(null);

    const engine = getEngine(useEngine);

    try {
        await engine.init(langArg, (_p, s) => setStage(s));

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

            const { text } = await engine.recognize(canvas, langArg);
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

- **Spec coverage:** engine abstraction (Tasks 2,4,5,6) ✓; PP-OCRv5 via `ppu-paddle-ocr` (Task 5) ✓; Tesseract fallback (Tasks 4,8) ✓; lazy model loading (dynamic imports in Tasks 4,5) ✓; self-hosted models + ort wasm + offline PWA cache (Task 7) ✓; engine toggle + language mapping + two-phase progress (Tasks 3,8) ✓; error handling/fallback (Task 8) ✓; testing of pure pieces + manual inference check (Tasks 3–6,9) ✓; YAGNI scope (no searchable-PDF/batch) ✓.
- **Deviation:** custom worker + `useOcrWorker` from spec §3.2/§3.3 intentionally dropped (inference already runs off-thread in onnxruntime-web/Tesseract). Spec updated to match.
- **Type consistency:** `OcrEngine` (`init`/`recognize`/`terminate`), `OcrPageResult` (`text`/`confidence`/`lines?`), `OcrEngineId` (`"paddle"|"tesseract"`), `getEngine`, `joinPages`, `getTesseractCode`, `isSupportedBy` used consistently across tasks.
- **Pivot:** `client-side-ocr` → `ppu-paddle-ocr` (verified importable). Language is model-selected, so v1 paddle coverage = default Latin-script model; Tesseract covers the rest. Engine-specific unknowns isolated to Tasks 5 & 7.
