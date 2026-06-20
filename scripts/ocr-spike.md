# OCR Spike Findings — `client-side-ocr` (Task 1)

Date: 2026-06-20
Branch: `feature/ppocr-v5-integration`
Investigator notes for the PP-OCRv5 integration. This is a scratch/spike doc, not user docs.

## TL;DR / Status

- **Package name:** `client-side-ocr` (correct; resolves to `siva-sub/client-ocr`, MIT). Installed `^2.1.0` (2.1.0).
- **CRITICAL BLOCKER:** the published 2.1.0 tarball is **broken as a library**. Its
  `package.json` declares `main`/`module`/`types` + `exports` pointing at
  `./dist/index.js`, `./dist/index.mjs`, `./dist/index.d.ts` and `./dist/react/*`,
  but **none of those files exist** in the tarball. `dist/` only contains the built
  *demo web app* (hashed Vite chunks in `dist/assets/`, a service worker, PWA icons,
  a test image). There are **zero `.d.ts` files** in the package.
- Consequence: `import { ... } from 'client-side-ocr'` fails to resolve at module
  load. Verified:
  ```
  $ node --input-type=module -e "import('client-side-ocr').then(...).catch(...)"
  IMPORT_ERROR: ERR_MODULE_NOT_FOUND | Cannot find module
    '/.../node_modules/client-side-ocr/dist/index.mjs'
  ```
- The API contract below is reconstructed from the package `README.md` and from
  string/structure mining of the minified demo bundle
  (`dist/assets/ocr-engine-*.js`). It is **not** confirmed against runnable code or
  type definitions, because neither ships.

## npm metadata

```
client-side-ocr@2.1.0 | MIT | deps: 14 | versions: 19
homepage: https://siva-sub.github.io/client-ocr/
repo: git+https://github.com/siva-sub/client-ocr.git
maintainer: siva-sub <sivasub987@gmail.com>  (single maintainer)
created: 2025-07-26 | last modified: 2025-07-29 (latest = 2.1.0, ~10 months old)
downloads (last month): 308
unpackedSize: 35.7 MB
```

`npm install client-side-ocr` succeeded with **no peer-dependency errors**, but it is
a heavy install: **+1298 packages**, and `npm audit` reported **38 vulnerabilities
(2 critical, 16 high, 18 moderate, 2 low)** in the resulting tree. The package's own
declared deps include the full **Mantine v8 UI kit**, `@tabler/icons-react`,
`@techstark/opencv-js`, `tesseract.js@^6`, `vite-plugin-pwa`, `workbox-window`,
`react`/`react-dom@^19`, and **`pdfjs-dist@^5.3.93`** (the host app pins
`pdfjs-dist@^4.10.38` — major-version mismatch; npm installed both side by side).

## Factory function & options (from README — UNVERIFIED, see blocker)

The README is internally **inconsistent** about the factory name. It shows all three:
- `import { RapidOCREngine } from 'client-side-ocr'; new RapidOCREngine({ lang: 'en' })`
- `import { createOCREngine } from 'client-side-ocr'; createOCREngine({ language, modelVersion })`
- `const ocr = createRapidOCREngine({ language, modelVersion, modelType })`  ← "API Overview" section

Because the JS/`.d.ts` entry points are missing, the real exported symbol could not be
resolved at runtime, and the minified bundle has the names mangled away (no
`createRapidOCREngine` / `createOCREngine` / `RapidOCREngine` literals survive in
`ocr-engine-*.js`). **Treat the factory name as unconfirmed.** The most-documented form
is `createRapidOCREngine`.

Documented factory options:
- `language` / `lang` — language code (see table below)
- `modelVersion` — `'PP-OCRv4'` (default) or `'PP-OCRv5'`
- `modelType` — `'mobile'` (default) or `'server'`

Documented lifecycle: `await ocr.initialize()` then `await ocr.processImage(input, opts)`.

`processImage(input, options)` documented `options`:
`enableTextClassification`, `enableWordSegmentation`,
`preprocessConfig.{detectImageNetNorm, recStandardNorm}`,
`postprocessConfig.{unclipRatio, boxThresh}`.
Result shape: `{ text, confidence, lines, wordBoxes, angle, processingTime }`.

## `processImage` accepted input types — UNCONFIRMED

Could not be confirmed (no `.d.ts`, no engine source). README examples pass a browser
`File` (`imageFile`) and an `imageData`/`imageFile` variable; no explicit type union is
documented. The demo UI chunk decodes via `URL.createObjectURL` + `<canvas>.drawImage`
+ `getImageData`, which *suggests* it accepts at least `File`/`Blob` and produces
`ImageData` internally — but that code is in the UI layer, not the engine entry, so it
is not authoritative about what `processImage` itself accepts.
**Recommendation for later tasks: assume `File`/`Blob` is the safe input; verify
`Canvas`/`ImageData`/`ImageBitmap` empirically once a working build of the lib exists.**

## Model path / base-URL config — SELF-HOSTING LOOKS SUPPORTED

There **is** a model-path option. The engine config object uses a **`modelPaths`** field
(31+ references in `ocr-engine-*.js`) with per-component `det` / `rec` / `cls` entries.
The resolution logic is roughly:

```js
// reconstructed from minified source
url = String.startsWith("http") ? url : `${base}/${url}`
// each of modelPaths.det / .rec / .cls may be a string or { url }
```

i.e. absolute `http(s)` URLs are used as-is, otherwise they are prefixed with a base
path. So **self-hosting is feasible** by either (a) supplying absolute URLs to your own
host via `modelPaths`, or (b) mirroring the model directory layout under a base path.
Default remote sources observed in the bundle:
- RapidOCR models: ModelScope —
  `https://www.modelscope.cn/models/RapidAI/RapidOCR/resolve/v3.3.0/...` (also a
  `.../resolve/master/onnx` and `.../resolve/v3.3.0/onnx` root)
- PPU PaddleOCR models: `https://siva-sub.github.io/client-ocr/models/ppu-paddle-ocr`

NOTE: it is **not** "none — CDN download only". The option exists; the exact public
config key name on the factory (vs. internal `modelPaths`) is unconfirmed due to the
missing types.

## Supported PP-OCRv5 language codes (HIGH-VALUE FINDING)

The bundle defines a per-language config map keyed by these codes (each with
`det`/`rec`/`cls` models, keyed by version then `mobile`/`server`):

```
arabic, ch, chinese_cht, cyrillic, devanagari, en, eslav, ja, ka, ko, latin, ta, te
```

Default `ocr_version` is **`PP-OCRv4`**. **PP-OCRv5 recognition models exist for only a
subset.** The only `*_PP-OCRv5_rec_*` dictionaries/models present in the bundle:

| v5 rec model | Covers |
|---|---|
| `ch_PP-OCRv5_rec_mobile_infer` / `ch_PP-OCRv5_rec_server_infer` | Chinese (`ch`) — also used for `en`/general Latin in PP-OCRv5 |
| `latin_PP-OCRv5_rec_mobile_infer` | Latin-script langs (`latin`) |
| `korean_PP-OCRv5_rec_mobile_infer` | Korean (`korean`/`ko`) |
| `eslav_PP-OCRv5_rec_mobile_infer` | East-Slavic / Cyrillic (`eslav`) |

So for **PP-OCRv5**, the practical recognition coverage is: **`ch`, `latin`, `korean`,
`eslav`** (plus `ch` server variant). Everything else (`arabic`, `devanagari`, `ja`
(`japan`), `ta`, `te`, `chinese_cht`, `cyrillic`, French/German/etc.) is **PP-OCRv4 /
PP-OCRv3 only** in this package. In particular **`japan` is v4-only** (`japan_PP-OCRv4_rec_infer`);
there is no PP-OCRv5 Japanese rec model shipped.

This contradicts the plan's example list (`en, ch, japan, korean, latin, arabic,
devanagari, french, german`): those are valid *engine* language codes, but only
`ch`/`latin`/`korean`/`eslav` actually have v5 recognition models here. The README's
14-language marketing table (`ch, en, fr, de, ja, ko, ru, pt, es, it, id, vi, fa, ka`)
also does not map 1:1 to the v5 model set.

## `npm run build`

**Result: FAILS — but for a PRE-EXISTING reason unrelated to this task.**

`npm run build` compiles successfully (Next.js compiled in ~11s) and then fails in the
type-check phase with:

```
./src/components/layout/Header.tsx:221:66
Type error: Cannot find name 'iconMap'.
```

This is a genuine pre-existing bug on `feature/ppocr-v5-integration`: `iconMap` is
referenced at `Header.tsx:221` and `:240` but never defined. Verified it is present in
committed `HEAD` (`git show HEAD:src/components/layout/Header.tsx | grep iconMap`) and
that `Header.tsx` is unmodified by this task (`git diff HEAD -- ...` is empty). This task
only changed `package.json` / `package-lock.json` and added this file under `scripts/`;
`client-side-ocr` is not imported anywhere, so it cannot be the cause. The build was
already broken before the dependency was added.

## Recommendations for downstream tasks (Tasks 2–9)

1. **Do not depend on `import 'client-side-ocr'` as-is — it will not resolve.** Options:
   - Pin/install from the GitHub repo built output or a fork that actually ships
     `dist/index.mjs` + types, or open an issue upstream (single maintainer, stale).
   - Vendor only the engine + workers + opencv chunks and load them directly
     (heavy; bundle/licensing review needed).
   - Reconsider whether the existing `tesseract.js@^7` (already a dep) plus a
     thinner PP-OCRv5 ONNX path is a better fit than this package.
2. If proceeding, plan for self-hosted models via `modelPaths` (ModelScope is a
   China-hosted CDN; reliability/latency + the `pdfjs-dist@5` vs `4` conflict and the
   38 audit findings should be weighed before shipping).
3. Limit PP-OCRv5 language options in the UI to `ch / latin / korean / eslav`; route
   everything else to PP-OCRv4 or Tesseract.
