# Secure Manual Redaction — Design Spec

**Date:** 2026-06-20
**Status:** Approved (pending implementation plan)
**Topic:** A new client-side "Redact PDF" tool that permanently removes content under user-drawn boxes — not a cosmetic black rectangle.

---

## 1. Background & Goal

EasyPDF is a 100% client-side, privacy-focused PDF suite (Next.js 15, static export, PWA). Redaction is the sharpest expression of its privacy moat: tools you can run on documents you'd never upload to a server.

**The defining constraint:** *true* redaction must **destroy the underlying content**, not cover it. Drawing a black rectangle with pdf-lib (as the add-text/add-image tools draw overlays) leaves the original text/image fully recoverable via copy-paste or any PDF parser. Shipping that under the word "redact" would be actively harmful. So the apply step must produce output from which the redacted content is genuinely unrecoverable.

**Goal (v1):** A new tool at `/redact-pdf`: upload a PDF → draw black redaction rectangles over any region on any page → apply → download a PDF where the redacted content is permanently gone.

**Decisions locked in:**

| Decision | Choice |
|---|---|
| Redaction granularity | Rectangle draw (covers text *and* images, works on scans). No word-click selection in v1. |
| "Truly remove" method | Rasterize only the pages that contain redactions to a flattened image with the black boxes baked in. |
| Untouched pages | Copied through unchanged (keep vector text/searchability). |
| Scope | Manual redaction only. **Auto-PII detection is a separate v2 spec.** |
| Branch | New branch off `main`, independent of the open OCR PR. |

**Non-goals (v1):** automatic PII detection, click-a-word/line text selection, vector-surgical content removal, annotation/markup.

---

## 2. Approaches Considered

- **Rasterize only the affected pages** *(chosen)* — pages with ≥1 box become flattened images (black boxes baked in, content gone); other pages untouched. Secure, feasible with existing tools (pdf.js render + pdf-lib image embed).
- **Rasterize the whole document** — secure but needlessly destroys selectable text on every page and bloats the file. Rejected.
- **Vector-surgical removal** (delete only the content under each box, keep the rest as text) — ideal UX but pdf-lib can't reliably edit content streams; high risk of partial/missed removal. Rejected for v1.

**Inherent tradeoff (accepted):** a redacted page loses *all* its selectable/searchable text (it becomes an image), not just the boxed region. This is the price of guaranteed removal and must be surfaced in the UI.

---

## 3. Architecture & Components

Follows the existing tool pattern (route + client component + pure lib + `ToolLayout`).

### 3.1 Files

| File | Responsibility |
|---|---|
| `src/app/(tools)/redact-pdf/page.tsx` | Route + metadata (mirrors other tool pages) |
| `src/app/(tools)/redact-pdf/RedactClient.tsx` | Orchestration: upload, page nav, box state, apply, download |
| `src/components/tools/RedactionEditor.tsx` | Renders the current page + the draw/move/resize overlay |
| `src/components/tools/RedactionBox.tsx` | A single draggable/resizable/deletable rectangle |
| `src/lib/pdf/redact.ts` | Pure logic: `applyRedactions(file, boxes, opts) → Blob` + coordinate helpers |
| `src/lib/pdf/__tests__/redact.test.ts` | Unit tests incl. the security round-trip |

### 3.2 Box model

```ts
export interface RedactionBox {
    id: string;
    page: number;   // 0-indexed page
    x: number;      // 0..1 of page width  (left)
    y: number;      // 0..1 of page height (top, screen-style: 0 = top)
    w: number;      // 0..1 of page width
    h: number;      // 0..1 of page height
}
```

Normalized (fraction-of-page) coordinates so they're resolution-independent and map cleanly to both the on-screen canvas and the PDF page. (The codebase uses %-based positions for `TextBox`/`ImageOverlay`; fractions are the same idea.)

### 3.3 Interaction (RedactionEditor)

- Render the current page to a canvas via pdf.js (extend `PDFPageRenderer` to report the rendered pixel size, or render inline).
- An absolutely-positioned overlay the size of the rendered page:
  - **Empty-area drag → create** a new box (marquee).
  - Existing boxes are `RedactionBox` components: drag to move, handles to resize, button to delete. Boxes render as solid black (with slight transparency *while editing only* so the user can see what's underneath; exported boxes are fully opaque black).
- Page navigation: Prev / Next + "Page N of M". Boxes are stored for all pages; only the current page's boxes render.
- A running count ("3 redactions") and a "Clear all" action.

---

## 4. The Secure Apply (`redact.ts`)

`applyRedactions(file: File, boxes: RedactionBox[], opts?: { dpi?: number }): Promise<Blob>`

1. Load the source with pdf.js (for rendering) and with pdf-lib (`@cantoo/pdf-lib`) for assembly.
2. Group boxes by page.
3. Build the output document page by page, preserving order and page size:
   - **Page with ≥1 box:** render it via pdf.js to a canvas at `dpi` (default **150**), then for each box on that page fill a solid-black rectangle at `(x·W, y·H, w·W, h·H)` in canvas pixels. Export the canvas to PNG, embed it in the output via pdf-lib, and draw it to fill a new page of the original page's dimensions. The new page contains **only** that image → no recoverable text/objects.
   - **Page with no boxes:** copy the original page through unchanged (`copyPages`) → keeps vector text.
4. Return the serialized PDF as a `Blob`.

**Memory bound:** rasterize and release one page at a time; cap effective dimensions (e.g., max ~2200px on the long edge regardless of `dpi`) so a huge page can't blow up memory. Document the cap.

---

## 5. Security Property & Verification

The feature is only honest if the redacted content is actually unrecoverable. Encode this as the central test:

**Round-trip test:** start from a generated PDF whose page 1 contains a known secret string (e.g. `SECRET-12345`) and whose page 2 contains a known non-secret string (e.g. `KEEP-99999`). Apply a redaction box covering the secret on page 1. Then re-open the output with pdf.js and assert:
1. `getTextContent()` of every page contains **no** occurrence of `SECRET-12345` (it was rasterized away).
2. The output has the **same page count**.
3. Page 2's text **still contains** `KEEP-99999` (proving only the affected page was rasterized).

If pdf.js canvas rendering can't run in jsdom/CI (as with OCR), the rasterization fidelity is verified manually in-browser, but the text-absence/extraction assertions run wherever pdf.js text extraction works. Pure coordinate/box helpers are always unit-tested.

---

## 6. UX Honesty

A persistent, visible notice in the editor and/or before download:

> "Redacted pages are flattened to images, so they lose selectable/searchable text. This is what makes the redaction permanent and unrecoverable."

Apply is disabled until at least one box exists.

---

## 7. Error Handling

- No boxes → Apply disabled (with hint).
- Encrypted/password PDF → surface a clear error (reuse the existing security-tool error pattern).
- Render/apply failure → toast + non-destructive (original file untouched; user can retry).
- Oversized page → dimension cap (§4) prevents OOM; if a page still fails, report which page and continue is **not** allowed (a failed redaction must not silently produce an under-redacted file — fail the whole apply with a clear message).

---

## 8. Testing

- **Unit (vitest):** coordinate transforms (fraction ↔ canvas px ↔ PDF points), box add/move/resize/delete reducers (pure), grouping-by-page, and the §5 security round-trip (to the extent pdf.js runs in jsdom; otherwise the text-extraction half runs and rasterization is verified in-browser).
- **Manual / browser:** draw boxes across multiple pages, apply, and confirm in the output that (a) the boxes are visually present, (b) selecting/copying text from a redacted region yields nothing, and (c) untouched pages still have selectable text.
- CI does **not** assert pixel rasterization fidelity.

---

## 9. Integration & Logistics

- Register the tool in `src/lib/constants.ts` (tool list), add a Lucide icon mapping (e.g. `Eraser` or `SquareSlash`) in `src/lib/icons.ts`, and a README entry under a **Security** or new **Privacy** category.
- New feature branch off `main`. Independent of the OCR PR.

---

## 10. Risks

1. **False sense of security if any non-rasterized path slips through.** Mitigated by the §5 absence test and by failing the whole apply on any page error (§7) rather than partial output.
2. **Large files / many pages** → memory + time. Mitigated by per-page processing + dimension cap; surface progress.
3. **pdf.js text extraction limits in jsdom** → the rasterization half of verification is manual (same posture as OCR). The security-relevant text-absence assertion still runs where extraction works.
4. **Scope creep toward auto-PII** → explicitly deferred to a v2 spec that reuses this box model.
