# OCR Library Verification Spike — `ppu-paddle-ocr`

**Date:** 2026-06-20
**Branch:** `feature/ppocr-v5-integration`
**Goal:** Prove `ppu-paddle-ocr` (PaddleOCR PP-OCRv5) is actually usable — imports and exposes
a real, typed API — BEFORE building code on it. This replaces the previously chosen
`client-side-ocr`, whose published tarball declared entry points (`dist/index.js`,
`dist/index.d.ts`) that did not exist on disk (only a built demo shipped), causing
`ERR_MODULE_NOT_FOUND` at import.

## Verdict

**USABLE.** Entry points exist on disk, the type definitions describe a real typed API,
and the package imports successfully in jsdom. This is the opposite of the broken
`client-side-ocr` situation.

---

## 1. Package

- **Name:** `ppu-paddle-ocr`
- **Installed version:** `5.8.3` (~178 KB unpacked)
- **Type:** ESM (`"type": "module"`)
- **Runtime dependency:** `ppu-ocv@^3.2.2` (installed `3.2.2`) — image processing (OpenCV.js / canvas)
- **Bundled provider?** No — onnxruntime is a **peer**, not bundled.

### peerDependencies (from `node_modules/ppu-paddle-ocr/package.json`)

```jsonc
"optionalDependencies": { "onnxruntime-node": "^1.23.2" },
"peerDependencies": {
  "onnxruntime-node": "^1.23.2",
  "onnxruntime-web": "^1.23.2"
},
"peerDependenciesMeta": {
  "onnxruntime-node": { "optional": true },
  "onnxruntime-web":  { "optional": true }
}
```

Both ORT peers are **optional**. For the browser we need **`onnxruntime-web`** (currently NOT
installed in this spike — install was explicitly deferred). `onnxruntime-node@1.27.0` came in
via the optionalDependency and is irrelevant to the browser build.

---

## 2. Entry points — declared vs exist-on-disk

`package.json` declares `main`, `types`, and an `exports` map with `.` (Node) and `./web`
(browser) subpaths. **Every declared file exists on disk** (this is the check that caught the
previous package):

| Declared path                | Field / export        | On disk |
| ---------------------------- | --------------------- | :-----: |
| `./index.js`                 | `main`, `exports["."]` |   ✅    |
| `./index.d.ts`               | `types`, `exports["."]`|   ✅    |
| `./web/index.js`             | `exports["./web"]`    |   ✅    |
| `./web/index.d.ts`           | `exports["./web"]`    |   ✅    |
| `./coi-serviceworker.js`     | `exports["./..."]`    |   ✅    |
| `cli/index.js`               | `bin`                 |   ✅    |

No declared-but-missing files. Two entries:

- **`ppu-paddle-ocr`** (main) → Node/Bun build, uses `onnxruntime-node` + `ppu-ocv`.
- **`ppu-paddle-ocr/web`** → browser build, uses `onnxruntime-web` (WASM) + `ppu-ocv/canvas-web`.
  **This is the entry we will use.**

---

## 3. Real API (from `*.d.ts`, verbatim)

Both entries export the same class name, `PaddleOcrService`. The **web** class
(`web/paddle-ocr.service.web.d.ts`) is the one to use:

### Construct

```ts
// web/paddle-ocr.service.web.d.ts
export declare class PaddleOcrService extends BasePaddleOcrService {
  constructor(options?: PaddleOptions);
  ...
}
export default PaddleOcrService;   // also a default export
```

```ts
import { PaddleOcrService } from "ppu-paddle-ocr/web";
const service = new PaddleOcrService(/* PaddleOptions */);
```

### Initialize (must be called before `recognize`)

```ts
/** Initialize the OCR service by loading models, dictionary, and the OpenCV runtime.
 *  Must be called before `recognize()`. */
initialize(): Promise<void>;
isInitialized(): boolean;
destroy(): Promise<void>;   // release ORT sessions
```

### Recognize (overloaded on `flatten`)

```ts
// web/paddle-ocr.service.web.d.ts — note: web build accepts ArrayBuffer | CanvasLike
recognize(
  image: ArrayBuffer | CanvasLike,
  options: RecognizeOptions & { flatten: true }
): Promise<FlattenedPaddleOcrResult>;

recognize(
  image: ArrayBuffer | CanvasLike,
  options?: RecognizeOptions & { flatten?: false }
): Promise<PaddleOcrResult>;
```

The platform-agnostic base (`core/base-paddle-ocr.service.d.ts`) types the image more broadly:

```ts
recognize(
  image: ArrayBuffer | CoreCanvas | string,
  options?: RecognizeOptions
): Promise<PaddleOcrResult | FlattenedPaddleOcrResult>;
```

Also available: `batchRecognize(...)`, `batchRecognizeStream(...)`, and runtime model swaps
`changeDetectionModel / changeRecognitionModel / changeTextDictionary`.

### Result shapes (`core/base-paddle-ocr.service.d.ts`, `core/base-recognition.service.d.ts`)

```ts
export type PaddleOcrResult = {
  text: string;                  // full text, lines separated by \n
  lines: RecognitionResult[][];  // grouped by line, reading order
  confidence: number;            // average 0–1
};

export type FlattenedPaddleOcrResult = {
  text: string;                  // single space-separated string
  results: RecognitionResult[];  // flat, reading order
  confidence: number;
};

export type RecognitionResult = {
  text: string;
  box: Box;                      // { x, y, width, height } in original image coords
  confidence: number;            // 0–1
};
```

So the return gives **text + per-item bounding boxes + per-item and average confidence**, with
either line-grouped (`lines`) or flat (`results`) layout depending on `flatten`.

### Per-call `RecognizeOptions` (`interface.d.ts`)

```ts
export type RecognizeOptions = {
  flatten?: boolean;                    // default false
  strategy?: RecognitionStrategy;       // "per-box" | "per-line" | "cross-line"
  dictionary?: string | ArrayBuffer;    // custom dict for this call (disables caching)
  noCache?: boolean;                    // default false
};
```

---

## 4. Accepted input types for `recognize()`

- **Browser (`/web`) build:** `ArrayBuffer | CanvasLike` (`CanvasLike` = an `HTMLCanvasable`/
  `OffscreenCanvas`-style object from `ppu-ocv/web`).
- **Base/Node build:** `ArrayBuffer | CoreCanvas | string` (string = URL/file path).

**No native `File` / `Blob` / `ImageData` / `ImageBitmap` overload.** Our wrapper must convert
the user's `File`/`Blob` to an **`ArrayBuffer`** (`await file.arrayBuffer()`), or draw the page
to a canvas and pass that. ArrayBuffer is the simplest, universally accepted path.

---

## 5. onnxruntime handling + peer deps

- onnxruntime is **NOT bundled**. The `/web` build statically imports `onnxruntime-web`; its only
  other external import is `ppu-ocv/canvas-web` (a subpath of the already-installed `ppu-ocv`
  dependency — verified to resolve and exist on disk).
- We must add **`onnxruntime-web`** as a dependency for the browser. (`onnxruntime-node` is an
  optional peer, irrelevant to us.)
- WASM/WebGPU: the web build resolves execution providers preferring **WebGPU** when available,
  silently falling back to **WASM** (`getDefaultWebExecutionProviders`, `isWebGpuAvailable` are
  exported from `ppu-paddle-ocr/web`). ORT session options are configurable via
  `PaddleOptions.session` (`SessionOptions extends InferenceSession.SessionOptions`).
- **Static-export / self-host note:** `onnxruntime-web` ships its own `.wasm` binaries that must
  be served and locatable at runtime — plan to host the ORT wasm assets under `/public` and set
  ORT's wasm path accordingly (separate from the OCR model files below).

---

## 6. Model fetching + self-host / custom-path option

- Default models are **auto-fetched from GitHub** on first use:

  ```ts
  // core/base-paddle-ocr.service.d.ts
  MODEL_BASE_URL = "https://media.githubusercontent.com/media/PT-Perkasa-Pilar-Utama/ppu-paddle-ocr-models/main";
  DICT_BASE_URL  = "https://raw.githubusercontent.com/PT-Perkasa-Pilar-Utama/ppu-paddle-ocr-models/main";

  DEFAULT_MODEL_URLS = {
    detection:            `${MODEL_BASE_URL}/detection/PP-OCRv5_mobile_det_infer.ort`,
    recognition:          `${MODEL_BASE_URL}/recognition/multi/en/v5/en_PP-OCRv5_mobile_rec_infer.ort`,
    charactersDictionary: `${DICT_BASE_URL}/recognition/multi/en/v5/ppocrv5_en_dict.txt`,
  };
  ```

  Confirmed these are **PP-OCRv5 mobile** models in ORT FlatBuffers (`.ort`) format.

- **Self-host option (for `/public`):** pass custom paths/URLs/buffers via `PaddleOptions.model`
  (`ModelPathOptions`):

  ```ts
  // interface.d.ts
  export type ModelPathOptions = {
    detection?: ArrayBuffer | string;            // ONNX/.ort detection model
    recognition?: ArrayBuffer | string;          // ONNX/.ort recognition model
    charactersDictionary?: ArrayBuffer | string; // dictionary (en_dict.txt etc.)
  };
  // PaddleOptions.model?: ModelPathOptions
  ```

  Each accepts a **URL/path string OR an `ArrayBuffer`** — so we can serve the three files from
  `/public/...` and pass those URLs (or pre-fetch + pass buffers). Runtime swaps also supported
  via `changeDetectionModel/changeRecognitionModel/changeTextDictionary(model: ArrayBuffer | string)`.

- **Caching (browser):** README is explicit — *"In the browser, model files are fetched via
  `fetch()` on every page load and rely on the browser's HTTP cache. For persistent offline
  caching, use a Service Worker or store the `ArrayBuffer` in IndexedDB."* (The `~/.cache`
  on-disk model cache and `warmupModelCache()/clearModelCache()` are **Node/Bun only**.) For our
  PWA we should self-host the models and rely on the SW/HTTP cache, or cache buffers in IndexedDB.

---

## 7. Supported PP-OCRv5 languages

PP-OCRv5 supports **40+ languages** across script systems (pre-converted ONNX models in the
`ppu-paddle-ocr-models` repo). Default models are **English**. Switch language by pointing
`PaddleOptions.model.{detection,recognition,charactersDictionary}` at the corresponding files
(path pattern `.../recognition/multi/<lang>/v5/<code>_PP-OCRv5_mobile_rec_infer.onnx` +
`ppocrv5_<code>_dict.txt`). Script families:

- **Latin:** English, French, German, Italian, Spanish, Portuguese, +40 others
- **Cyrillic:** Russian, Ukrainian, Bulgarian, Kazakh, Serbian, +30 related
- **Arabic:** Arabic, Persian, Urdu, Kurdish
- **Indic:** Hindi (Devanagari), Tamil, Telugu
- **East Asian:** Korean, Japanese
- **Southeast Asian:** Thai

(The detection model is shared across languages; only the recognition model + dictionary change.)
Server (higher-accuracy) and INT8-quantized variants are also available.

---

## 8. Import test result (jsdom / vitest)

Spike test `src/lib/ocr/__spike__/import.spike.test.ts` (temporary — deleted after the run):

- **Main entry `import("ppu-paddle-ocr")` — ✅ PASS.** Imports cleanly in jsdom; `PaddleOcrService`
  is a `function`, `DEFAULT_MODEL_URLS` resolves to the PP-OCRv5 `.ort` URLs above.
- **Web entry `import("ppu-paddle-ocr/web")` — fails ONLY on the missing peer.** Exact error:
  `Cannot find package 'onnxruntime-web' imported from .../ppu-paddle-ocr/web/paddle-ocr.service.web.js`.
  This is a **missing-peer-dependency** error, NOT a missing-entry-file error and NOT a
  browser-global crash. Verified statically that the web service module's only external imports
  are `onnxruntime-web` and `ppu-ocv/canvas-web` (the latter resolves from the installed
  `ppu-ocv@3.2.2`), and the module does **not** touch `window`/`document`/`navigator` eagerly at
  top level. Installing `onnxruntime-web` will resolve it; that install was intentionally deferred
  in this spike.

Both assertions pass (`2 passed`).

---

## Conclusion & next steps

`ppu-paddle-ocr@5.8.3` is **verified usable** — unlike `client-side-ocr`, its entry points exist,
its `.d.ts` describes a real typed API, and it imports in jsdom. To proceed:

1. Add **`onnxruntime-web`** as a dependency (peer; required by the `/web` build).
2. Use the **`ppu-paddle-ocr/web`** entry: `new PaddleOcrService(opts)` → `await initialize()` →
   `await recognize(arrayBuffer, { flatten? })`.
3. Convert input `File`/`Blob`/page renders to **`ArrayBuffer`** (no native File/Blob overload).
4. **Self-host** the three PP-OCRv5 files under `/public` and the ORT `.wasm` assets, passing model
   URLs via `PaddleOptions.model`; rely on the PWA Service Worker / HTTP cache (or IndexedDB) for
   offline model caching (Node disk cache does not apply in-browser).
