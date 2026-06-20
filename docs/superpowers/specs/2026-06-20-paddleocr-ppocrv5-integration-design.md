# PaddleOCR (PP-OCRv5) Integration — Design Spec

**Date:** 2026-06-20
**Status:** Approved (pending implementation plan)
**Topic:** Replace the existing Tesseract-only OCR with a high-accuracy PP-OCRv5 engine, client-side, with Tesseract retained as a fallback.

---

## 1. Background & Goal

EasyPDF is a 100% client-side, privacy-focused PDF suite (Next.js 15 / React 19, static export to GitHub Pages, PWA via `@ducanh2912/next-pwa`). It already ships an **OCR PDF** tool at `src/app/(tools)/ocr-pdf/OcrClient.tsx` that renders each PDF page to a canvas with `pdfjs-dist` and runs `Tesseract.recognize()` **on the main thread**.

The user originally linked `PaddlePaddle/PP-OCRv6_medium_det_safetensors`. Key clarifications established during brainstorming:

- That model is **detection-only** (`det` = bounding boxes, not character reading) and is published as `safetensors` with no proven browser runtime.
- The actual goal is **better OCR text-extraction accuracy** than Tesseract, via the **full PaddleOCR pipeline** (detection + recognition), **staying fully client-side**.
- Version number is not a hard requirement — results are. The current ecosystem offers proven **PP-OCRv5** browser support, which is the chosen target.

**Decisions locked in:**

| Decision | Choice |
|---|---|
| Engine | `client-side-ocr` (npm), PP-OCRv5, ONNX + onnxruntime-web |
| Tesseract | **Keep as a selectable fallback** (PaddleOCR is the default) |
| Execution | Run inference in a **Web Worker** (off the main thread) |
| Models | **Lazy-loaded**; self-hosted if configurable, else CDN-on-first-run + PWA cache |
| Deploy constraints | Must remain client-side + static-export + PWA-compatible |

**Non-goal:** running PP-OCRv6 specifically, or any server-side inference.

---

## 2. Chosen Library

**`client-side-ocr`** (npm; GitHub: `siva-sub/client-ocr`), v2.x (Jul 2025, actively maintained). The exact published package name is to be confirmed in the spike (§4), since the project also publishes related packages.

- PP-OCRv4 **and PP-OCRv5** ONNX models via ONNX Runtime Web (WASM, optional WebGPU acceleration with automatic WASM fallback).
- 100+ languages — covers and extends the tool's current 11-language dropdown.
- Built-in Web Worker support ("ONNX Detection Worker" / "ONNX Recognition Worker").
- Automatic model caching with SHA256 verification.

**API shape (confirmed):**

```ts
import { createRapidOCREngine } from 'client-side-ocr';

const ocr = createRapidOCREngine({
  language: 'en',            // 'ch', 'fr', 'de', 'ja', 'ko', ...
  modelVersion: 'PP-OCRv5',
});
await ocr.initialize();

const result = await ocr.processImage(imageOrCanvas, {
  enableWordSegmentation: true,
  returnConfidence: true,
});
// result: { text, confidence, lines, wordBoxes, angle, processingTime }
```

**Alternatives considered & rejected:**
- `@paddleocr/paddleocr-js` (official) — authoritative and PP-OCRv5, but less clear language breadth and more setup. Kept as a documented fallback option if `client-side-ocr` proves unsuitable during the spike.
- `@gutenye/ocr-browser` — PP-OCRv4 only, stale (~2024).

---

## 3. Architecture

### 3.1 Engine abstraction (`src/lib/ocr/`)

A small abstraction so both engines are interchangeable and testable:

- **`types.ts`** — the contract:
  ```ts
  export interface OcrPageResult {
    text: string;
    confidence: number;      // 0..1, overall
    lines?: { text: string; confidence: number }[];
  }
  export interface OcrEngine {
    init(lang: string, onProgress?: (p: number, stage: string) => void): Promise<void>;
    recognize(image: ImageBitmap, lang: string): Promise<OcrPageResult>;
    terminate(): void;
  }
  export type OcrEngineId = 'paddle' | 'tesseract';
  ```
- **`paddleEngine.ts`** — wraps `client-side-ocr`; lazy singleton; maps UI language codes → PaddleOCR codes; normalizes `processImage` output into `OcrPageResult`.
- **`tesseractEngine.ts`** — the current Tesseract logic refactored behind `OcrEngine`.
- **`languages.ts`** — single source of truth mapping `{ uiCode, label, tesseractCode, paddleCode? }`. Drives the dropdown and per-engine availability.
- **`index.ts`** — `getEngine(id: OcrEngineId): OcrEngine` selector.

### 3.2 No custom wrapper worker  *(revised — see note)*

> **Revised during planning.** The original design proposed a custom `src/lib/ocr/ocr.worker.ts` + `useOcrWorker` hook. We confirmed that **both `client-side-ocr` and `tesseract.js` already run their heavy compute in their own internal Web Workers** (onnxruntime detection/recognition workers; Tesseract's worker). Wrapping them in another worker would nest `onnxruntime-web` in a worker-of-a-worker — fragile under Next's webpack — for no benefit. So we **drop the custom wrapper worker**. The engine abstraction is called directly from the main thread; the libraries keep the actual inference off it.

Each engine is loaded lazily via dynamic `import()` so the ~15–30 MB of models / `onnxruntime-web` only load when OCR runs, not in the initial bundle. `engine.init(lang, onProgress)` performs (and reports progress for) the one-time model load.

### 3.3 Data flow

```
OcrClient (main thread)
  → pdfjs renders page N to <canvas>           (light)
  → engine.init(lang, onProgress)              (first run only; lazy import + model load)
  → engine.recognize(canvas, lang)             (library offloads ONNX/Tesseract to its own worker)
  ← { text, confidence }
  ← accumulate page text → joinPages() → display / copy / download .txt
```

PDF parsing/rasterization stays on the main thread (pdfjs already uses its own worker for parsing). The heavy ONNX/Tesseract inference runs in each library's internal worker.

---

## 4. Model Hosting & Assets  *(primary risk)*

PP-OCRv5 ONNX models + `onnxruntime-web` WASM total roughly **15–30MB** (det ~4–5MB, rec ~8–17MB, cls ~0.5MB).

**Spike first:** confirm whether `createRapidOCREngine` accepts a custom model base path / URL.

- **If configurable:** self-host models under `public/models/ppocr/` and the onnxruntime-web WASM under `public/` (or the library's expected path), and point the engine there. Result: fully offline, **nothing fetched from any external host**.
- **If not configurable:** allow the library to download models from its CDN **once on first run**, then rely on the existing PWA service worker (`@ducanh2912/next-pwa`) Cache API to persist them for offline reuse.
  - **Privacy framing (must be accurate):** only model *weights* are downloaded; **user PDF files never leave the browser**. The "files never leave your device" promise is preserved. This nuance should be reflected in any user-facing copy if first-run download is used.

**Lazy loading (both cases):** models are fetched only when the user clicks "Extract Text" — never in the initial JS bundle. The initial page load is unaffected.

---

## 5. UI Changes (`OcrClient.tsx`)

- **Engine toggle:** "High accuracy (PaddleOCR v5)" *(default)* vs "Fast (Tesseract)".
- **Language dropdown:** retained; values map through `languages.ts`. Languages unsupported by the selected engine are disabled with a short annotation.
- **Progress:** two phases — (1) one-time model load ("Downloading OCR model…"), (2) per-page recognition (`page i of N`).
- **Output:** unchanged — extracted-text view, Copy Text, Download `.txt`.

---

## 6. Error Handling

- Model download/init failure → toast + one-click "Retry with Tesseract" fallback.
- WebGPU unavailable → onnxruntime-web automatically uses WASM (library-handled); ensure WASM backend is configured/available.
- Worker crash / OOM on very large PDFs → caught and surfaced; suggest processing fewer pages.
- Language unsupported by selected engine → prevented in UI (guarded by `languages.ts`).

---

## 7. Testing

Pure logic is unit-tested with vitest (jsdom); real inference is verified manually.

- **Unit (vitest):** language-code mapping (UI ↔ Tesseract ↔ Paddle), engine selector, result normalization, worker message-handler functions (extracted as pure functions).
- **Mocked:** `OcrEngine` implementations are mocked in CI — ONNX/WASM/WebGPU cannot run in jsdom.
- **Manual / integration:**
  1. Run OCR on a sample scanned PDF; compare PaddleOCR vs Tesseract output for an accuracy improvement.
  2. Verify the engine toggle and language switching.
  3. Verify offline operation after first model load (PWA).

CI will **not** attempt real ONNX inference.

---

## 8. Scope (YAGNI)

**In scope:**
- Engine abstraction (`src/lib/ocr/`), PaddleOCR + Tesseract behind one interface.
- OCR Web Worker + `useOcrWorker` hook.
- `OcrClient` changes: engine toggle, language mapping, two-phase progress.
- Lazy + self-hosted-or-cached model loading.

**Out of scope (future follow-ons):**
- Searchable/overlay PDF output (text layer over the original).
- Batch multi-file OCR.
- Table/layout extraction.
- Using detection bounding boxes for redaction.

---

## 9. Risks

1. **Self-hosted model paths** may not be first-class in `client-side-ocr` → mitigated by the spike + PWA-cache fallback (§4).
2. **Asset weight (~15–30MB)** → mitigated by lazy load + caching; never in the initial bundle.
3. **PP-OCRv5 language coverage** vs the current 11 languages → verify each maps; any gap falls back to Tesseract (the reason it is retained).
4. **Library longevity** (third-party) → the engine abstraction (§3.1) isolates the dependency; swapping to `@paddleocr/paddleocr-js` later touches only `paddleEngine.ts`.
