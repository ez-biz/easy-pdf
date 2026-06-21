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

**`ppu-paddle-ocr`** (npm, v5.8.3) + `onnxruntime-web` (peer). PP-OCRv5 ONNX models run via ONNX Runtime Web (WebGPU with automatic WASM fallback). Verified usable in a spike (entry points exist on disk; imports cleanly in jsdom; real typed API) — ~360 KB package, single dep `ppu-ocv`, zero new audit vulnerabilities.

> **History:** the originally-chosen `client-side-ocr@2.1.0` was found in the spike to be **broken as published** (declared entry points `dist/index.js`/`.d.ts` do not exist — only a built demo app ships), un-importable, and pulled in ~1298 packages / 38 audit vulnerabilities. It was removed. `@paddleocr/paddleocr-js` (official, 23.8 MB) remains the documented fallback if `ppu-paddle-ocr` proves insufficient.

**API shape (confirmed from installed `.d.ts`):**

```ts
import { PaddleOcrService } from 'ppu-paddle-ocr/web';

const service = new PaddleOcrService({
  // Self-hosted PP-OCRv5 models (see §4); omit to auto-fetch defaults from GitHub.
  model: {
    detection: '/models/ppocr/det.ort',
    recognition: '/models/ppocr/rec.ort',
    charactersDictionary: '/models/ppocr/dict.txt',
  },
});
await service.initialize();

const result = await service.recognize(arrayBuffer /* ArrayBuffer | CanvasLike */, {});
// result: { text, lines: RecognitionResult[][], confidence }
// RecognitionResult = { text, box: {x,y,width,height}, confidence }
```

Key API facts that shape the design:
- **Recognize input is `ArrayBuffer | CanvasLike`** — no `File`/`Blob` overload, so the wrapper converts the rendered page canvas to an `ArrayBuffer` (PNG blob → `arrayBuffer()`).
- **Language is selected by the model, not a string param.** Switching languages means pointing `model.recognition` + `model.charactersDictionary` at a different PP-OCRv5 model/dictionary (detection is shared/language-agnostic). For **v1 we ship only the default PP-OCRv5 model** (Latin script: English + major European languages); **Tesseract remains the fallback for everything else** (Chinese, Japanese, Korean, Hindi, Arabic, …). The exact default-model language coverage is confirmed in §4 / Task 7.
- `onnxruntime-web` is an optional peer the web build requires; it ships `.wasm` assets to self-host.

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
    recognize(canvas: HTMLCanvasElement, lang: string): Promise<OcrPageResult>;
    terminate(): void;
  }
  export type OcrEngineId = 'paddle' | 'tesseract';
  ```
- **`paddleEngine.ts`** — wraps `ppu-paddle-ocr/web` (`PaddleOcrService`); lazy singleton; loads the self-hosted default PP-OCRv5 model; converts the page canvas to an `ArrayBuffer`; normalizes `recognize()` output into `OcrPageResult`. (v1 uses the single default model, so `lang` is informational for paddle.)
- **`tesseractEngine.ts`** — the current Tesseract logic refactored behind `OcrEngine`.
- **`languages.ts`** — single source of truth mapping `{ uiCode, label, tesseractCode, paddleSupported }`. `paddleSupported` marks languages the default PP-OCRv5 model covers (Latin-script v1). Drives the dropdown and per-engine availability.
- **`index.ts`** — `getEngine(id: OcrEngineId): OcrEngine` selector + `joinPages()`.

### 3.2 No custom wrapper worker  *(revised — see note)*

> **Revised during planning.** The original design proposed a custom `src/lib/ocr/ocr.worker.ts` + `useOcrWorker` hook. Both `onnxruntime-web` (which `ppu-paddle-ocr` uses) and `tesseract.js` already run their heavy compute off the main thread (ONNX WASM/WebGPU sessions; Tesseract's worker). Wrapping them in another app-level worker would nest `onnxruntime-web` in a worker-of-a-worker — fragile under Next's webpack — for no benefit. So we **drop the custom wrapper worker**. The engine abstraction is called directly from the main thread; the libraries keep the actual inference off it.

Each engine is loaded lazily via dynamic `import()` so the model weights / `onnxruntime-web` runtime only load when OCR runs, not in the initial bundle. `engine.init(lang, onProgress)` performs (and reports progress for) the one-time model load.

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

## 4. Model Hosting & Assets

Self-hosting is **confirmed supported** via `PaddleOptions.model` (`detection`, `recognition`, `charactersDictionary` URLs/buffers). Plan:

- **Self-host the default PP-OCRv5 model files** (detection + recognition + dictionary) under `public/models/ppocr/`, and point `PaddleOcrService` at those `/models/ppocr/*` paths. By default `ppu-paddle-ocr` would fetch them from GitHub; self-hosting keeps everything on our origin.
- **Self-host the `onnxruntime-web` `.wasm` assets** under `public/` and set `ort.env.wasm.wasmPaths` so no runtime is fetched from a CDN.
- **Confirm default-model language coverage** (Task 7): the default appears to be the Latin-script PP-OCRv5 model (English + major European languages). `languages.ts` marks exactly those as `paddleSupported`; everything else routes to Tesseract.
- **Offline (PWA):** `ppu-paddle-ocr` `fetch()`es models each load relying on HTTP cache; to guarantee offline reuse we add a `runtimeCaching` rule (`CacheFirst`) to `@ducanh2912/next-pwa` for `/models/ppocr/*` and the ort `.wasm`. (Its built-in Node `~/.cache` does not apply in-browser.)

**Lazy loading:** models load only when the user runs OCR (dynamic `import()` of the engine + first `initialize()`), never in the initial JS bundle. **User PDF files never leave the browser** in any case — only model weights are served, from our own origin.

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
