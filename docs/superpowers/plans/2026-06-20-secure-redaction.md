# Secure Manual Redaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/redact-pdf` tool that permanently removes content under user-drawn boxes by rasterizing only the affected pages (black boxes baked in), leaving untouched pages as vector text.

**Architecture:** A pure assembly function (`redact.ts`) iterates pages: pages with redaction boxes are replaced by a flattened PNG (rendered + black-filled by a browser-only `renderPage.ts`), pages without boxes are copied through unchanged. The canvas renderer is injected as a dependency so the assembly logic is unit-testable in jsdom without a real canvas. The UI (`RedactClient` + `RedactionEditor` + `RedactionBox`) lets the user draw/move/resize/delete rectangles per page.

**Tech Stack:** Next.js 15, React 19, TypeScript, `@cantoo/pdf-lib` (assembly + image embed), `pdfjs-dist` (page rasterization), vitest.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/pdf/redact.ts` | `RedactionBox` type, pure helpers, `applyRedactions` (injectable renderer) |
| `src/lib/pdf/renderPage.ts` | Browser-only: render a page to a black-boxed PNG via pdf.js (default renderer) |
| `src/lib/pdf/__tests__/redact.test.ts` | Unit tests: helpers + assembly (fake renderer) |
| `src/components/tools/RedactionBox.tsx` | One draggable/resizable/deletable rectangle |
| `src/components/tools/RedactionEditor.tsx` | Page render + draw-to-create overlay + page nav |
| `src/app/(tools)/redact-pdf/RedactClient.tsx` | Orchestration: upload, box state, apply, download, notice |
| `src/app/(tools)/redact-pdf/page.tsx` | Route + metadata |
| `src/lib/constants.ts` | Register the tool (modify) |
| `src/lib/icons.ts` | Add the `Eraser` icon (modify) |
| `README.md` | Document the tool (modify) |

---

## Task 1: Box model + pure helpers

**Files:**
- Create: `src/lib/pdf/redact.ts`
- Test: `src/lib/pdf/__tests__/redact.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/pdf/__tests__/redact.test.ts
import { describe, it, expect } from "vitest";
import {
    clampBox,
    groupBoxesByPage,
    pointerToFractionRect,
    type RedactionBox,
} from "@/lib/pdf/redact";

const box = (over: Partial<RedactionBox> = {}): RedactionBox => ({
    id: "b1", page: 0, x: 0.1, y: 0.1, w: 0.2, h: 0.2, ...over,
});

describe("clampBox", () => {
    it("clamps coordinates into the page and keeps positive size", () => {
        const c = clampBox(box({ x: -0.5, y: 1.2, w: 5, h: -1 }));
        expect(c.x).toBe(0);
        expect(c.y).toBeLessThanOrEqual(1);
        expect(c.w).toBeGreaterThan(0);
        expect(c.h).toBeGreaterThan(0);
        expect(c.x + c.w).toBeLessThanOrEqual(1.0000001);
    });
});

describe("groupBoxesByPage", () => {
    it("groups boxes by their page index", () => {
        const g = groupBoxesByPage([box({ id: "a", page: 0 }), box({ id: "b", page: 2 }), box({ id: "c", page: 0 })]);
        expect(g.get(0)?.map((b) => b.id)).toEqual(["a", "c"]);
        expect(g.get(2)?.map((b) => b.id)).toEqual(["b"]);
        expect(g.has(1)).toBe(false);
    });
});

describe("pointerToFractionRect", () => {
    it("normalizes a drag (any direction) into a top-left fraction rect", () => {
        // drag from (80,60) up-left to (20,10) in a 100x100 surface
        const r = pointerToFractionRect(80, 60, 20, 10, 100, 100);
        expect(r.x).toBeCloseTo(0.2);
        expect(r.y).toBeCloseTo(0.1);
        expect(r.w).toBeCloseTo(0.6);
        expect(r.h).toBeCloseTo(0.5);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/pdf/__tests__/redact.test.ts`
Expected: FAIL — `Cannot find module '@/lib/pdf/redact'`.

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/pdf/redact.ts

/** A redaction rectangle in page-fraction coordinates (0..1), y measured from the top. */
export interface RedactionBox {
    id: string;
    page: number; // 0-indexed page
    x: number;    // left, fraction of page width
    y: number;    // top, fraction of page height
    w: number;    // width, fraction of page width
    h: number;    // height, fraction of page height
}

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

/** Clamp a box to the page bounds with a positive minimum size. */
export function clampBox(b: RedactionBox): RedactionBox {
    const x = clamp(b.x, 0, 1);
    const y = clamp(b.y, 0, 1);
    const w = clamp(b.w, 0.005, 1 - x);
    const h = clamp(b.h, 0.005, 1 - y);
    return { ...b, x, y, w, h };
}

/** Group boxes by their page index, preserving input order within a page. */
export function groupBoxesByPage(boxes: RedactionBox[]): Map<number, RedactionBox[]> {
    const map = new Map<number, RedactionBox[]>();
    for (const b of boxes) {
        const list = map.get(b.page);
        if (list) list.push(b);
        else map.set(b.page, [b]);
    }
    return map;
}

/** Normalize a pointer drag (start→current, any direction) into a fraction rect. */
export function pointerToFractionRect(
    startX: number,
    startY: number,
    curX: number,
    curY: number,
    widthPx: number,
    heightPx: number
): { x: number; y: number; w: number; h: number } {
    const left = Math.min(startX, curX);
    const top = Math.min(startY, curY);
    const w = Math.abs(curX - startX);
    const h = Math.abs(curY - startY);
    return {
        x: clamp(left / widthPx, 0, 1),
        y: clamp(top / heightPx, 0, 1),
        w: clamp(w / widthPx, 0, 1),
        h: clamp(h / heightPx, 0, 1),
    };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/pdf/__tests__/redact.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/pdf/redact.ts src/lib/pdf/__tests__/redact.test.ts
git commit -m "feat(redact): add redaction box model and pure helpers"
```

---

## Task 2: applyRedactions (secure assembly)

**Files:**
- Modify: `src/lib/pdf/redact.ts`
- Modify: `src/lib/pdf/__tests__/redact.test.ts`

The renderer is injected so the assembly is testable without a real canvas. The default renderer (pdf.js) is added in Task 3 and lazy-imported so importing `redact.ts` never pulls pdf.js into the test environment.

- [ ] **Step 1: Add the failing test**

Append to `src/lib/pdf/__tests__/redact.test.ts`:

```typescript
import { applyRedactions, type RenderDeps } from "@/lib/pdf/redact";
import { PDFDocument } from "@cantoo/pdf-lib";

// Minimal valid 1x1 PNG.
const PNG_1x1 = Uint8Array.from(
    atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="),
    (c) => c.charCodeAt(0)
);

async function makePdf(pageCount: number): Promise<File> {
    const doc = await PDFDocument.create();
    for (let i = 0; i < pageCount; i++) doc.addPage([612, 792]);
    const bytes = await doc.save();
    return new File([new Uint8Array(bytes)], "in.pdf", { type: "application/pdf" });
}

describe("applyRedactions", () => {
    it("rasterizes only pages with boxes, copies the rest, preserves page count", async () => {
        const file = await makePdf(3);
        const boxes: RedactionBox[] = [
            { id: "a", page: 0, x: 0.1, y: 0.1, w: 0.3, h: 0.1 },
            { id: "b", page: 2, x: 0.2, y: 0.2, w: 0.2, h: 0.2 },
        ];
        const deps: RenderDeps = { renderPageToPng: vi.fn().mockResolvedValue(PNG_1x1) };

        const { blob, rasterizedPages } = await applyRedactions(file, boxes, {}, deps);

        expect(rasterizedPages).toEqual([0, 2]);
        expect(deps.renderPageToPng).toHaveBeenCalledTimes(2);
        const outDoc = await PDFDocument.load(new Uint8Array(await blob.arrayBuffer()));
        expect(outDoc.getPageCount()).toBe(3);
        // Page sizes are preserved (Letter).
        expect(Math.round(outDoc.getPage(0).getWidth())).toBe(612);
    });

    it("returns an empty rasterized list when there are no boxes", async () => {
        const file = await makePdf(2);
        const deps: RenderDeps = { renderPageToPng: vi.fn() };
        const { rasterizedPages } = await applyRedactions(file, [], {}, deps);
        expect(rasterizedPages).toEqual([]);
        expect(deps.renderPageToPng).not.toHaveBeenCalled();
    });
});
```

Add `vi` to the import at the top of the test file: change the first import line to
`import { describe, it, expect, vi } from "vitest";`

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/pdf/__tests__/redact.test.ts`
Expected: FAIL — `applyRedactions` / `RenderDeps` not exported.

- [ ] **Step 3: Add the implementation**

Append to `src/lib/pdf/redact.ts`:

```typescript
import { PDFDocument } from "@cantoo/pdf-lib";

export interface ApplyOptions {
    dpi?: number;     // rasterization DPI for affected pages (default 150)
    maxEdge?: number; // cap on the longest rasterized edge in px (default 2200)
}

export interface RenderDeps {
    /** Render page `pageIndex` of `file` to a PNG with `boxes` painted solid black. */
    renderPageToPng(
        file: File,
        pageIndex: number,
        boxes: RedactionBox[],
        dpi: number,
        maxEdge: number
    ): Promise<Uint8Array>;
}

export interface ApplyResult {
    blob: Blob;
    rasterizedPages: number[];
}

// Default renderer is browser-only; lazy-imported so tests/SSR never load pdf.js.
const defaultDeps: RenderDeps = {
    async renderPageToPng(file, pageIndex, boxes, dpi, maxEdge) {
        const mod = await import("./renderPage");
        return mod.renderPageToPng(file, pageIndex, boxes, dpi, maxEdge);
    },
};

/**
 * Build a redacted copy: pages with ≥1 box are replaced by a flattened image
 * (content permanently removed); pages without boxes are copied unchanged.
 * Fails the whole operation if any affected page fails to render — never
 * produces a partially-redacted file.
 */
export async function applyRedactions(
    file: File,
    boxes: RedactionBox[],
    opts: ApplyOptions = {},
    deps: RenderDeps = defaultDeps
): Promise<ApplyResult> {
    const dpi = opts.dpi ?? 150;
    const maxEdge = opts.maxEdge ?? 2200;
    const byPage = groupBoxesByPage(boxes.map(clampBox));

    const srcBytes = new Uint8Array(await file.arrayBuffer());
    const srcDoc = await PDFDocument.load(srcBytes);
    const out = await PDFDocument.create();
    const rasterizedPages: number[] = [];

    const pageCount = srcDoc.getPageCount();
    for (let i = 0; i < pageCount; i++) {
        const pageBoxes = byPage.get(i);
        if (pageBoxes && pageBoxes.length > 0) {
            const { width, height } = srcDoc.getPage(i).getSize();
            const png = await deps.renderPageToPng(file, i, pageBoxes, dpi, maxEdge);
            const img = await out.embedPng(png);
            const page = out.addPage([width, height]);
            page.drawImage(img, { x: 0, y: 0, width, height });
            rasterizedPages.push(i);
        } else {
            const [copied] = await out.copyPages(srcDoc, [i]);
            out.addPage(copied);
        }
    }

    const outBytes = await out.save();
    return {
        blob: new Blob([new Uint8Array(outBytes)], { type: "application/pdf" }),
        rasterizedPages,
    };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/pdf/__tests__/redact.test.ts`
Expected: PASS (5 tests total).

- [ ] **Step 5: Run the full suite + typecheck**

Run: `npm test && npx tsc --noEmit`
Expected: all pass; no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/pdf/redact.ts src/lib/pdf/__tests__/redact.test.ts
git commit -m "feat(redact): add secure applyRedactions assembly with injectable renderer"
```

---

## Task 3: Browser page rasterizer (default renderer)

**Files:**
- Create: `src/lib/pdf/renderPage.ts`

Browser-only (uses pdf.js + canvas). Not unit-tested (canvas unavailable in jsdom); verified in Task 7. It renders the page, paints solid-black rectangles over each box, and returns PNG bytes.

- [ ] **Step 1: Write the implementation**

```typescript
// src/lib/pdf/renderPage.ts
import * as pdfjsLib from "pdfjs-dist";
import { boxToPixelRect } from "./redact";
import type { RedactionBox } from "./redact";

if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

/** Render one page to a PNG with the given boxes painted solid black. */
export async function renderPageToPng(
    file: File,
    pageIndex: number,
    boxes: RedactionBox[],
    dpi: number,
    maxEdge: number
): Promise<Uint8Array> {
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const page = await pdf.getPage(pageIndex + 1); // pdf.js is 1-indexed

    let scale = dpi / 72;
    const base = page.getViewport({ scale: 1 });
    const longest = Math.max(base.width, base.height) * scale;
    if (longest > maxEdge) scale *= maxEdge / longest;

    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context for redaction render");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;

    ctx.fillStyle = "#000000";
    for (const b of boxes) {
        const r = boxToPixelRect(b, canvas.width, canvas.height);
        ctx.fillRect(r.x, r.y, r.w, r.h);
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas.toBlob returned null"))), "image/png");
    });
    return new Uint8Array(await blob.arrayBuffer());
}
```

- [ ] **Step 2: Add `boxToPixelRect` to `redact.ts`** (used above). Append to `src/lib/pdf/redact.ts`:

```typescript
/** Convert a fraction box to integer pixel coords for a given canvas size. */
export function boxToPixelRect(
    b: RedactionBox,
    widthPx: number,
    heightPx: number
): { x: number; y: number; w: number; h: number } {
    return {
        x: Math.round(b.x * widthPx),
        y: Math.round(b.y * heightPx),
        w: Math.round(b.w * widthPx),
        h: Math.round(b.h * heightPx),
    };
}
```

- [ ] **Step 3: Add a unit test for `boxToPixelRect`**

Append to `src/lib/pdf/__tests__/redact.test.ts` (import it by adding `boxToPixelRect` to the existing `@/lib/pdf/redact` import):

```typescript
describe("boxToPixelRect", () => {
    it("scales a fraction box to pixel coordinates", () => {
        const r = boxToPixelRect({ id: "x", page: 0, x: 0.25, y: 0.5, w: 0.5, h: 0.25 }, 1000, 800);
        expect(r).toEqual({ x: 250, y: 400, w: 500, h: 200 });
    });
});
```

- [ ] **Step 4: Run tests + typecheck**

Run: `npx vitest run src/lib/pdf/__tests__/redact.test.ts && npx tsc --noEmit`
Expected: PASS (6 tests); no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pdf/renderPage.ts src/lib/pdf/redact.ts src/lib/pdf/__tests__/redact.test.ts
git commit -m "feat(redact): add pdf.js page rasterizer and pixel-rect helper"
```

---

## Task 4: RedactionBox component

**Files:**
- Create: `src/components/tools/RedactionBox.tsx`

A single rectangle: drag the body to move, drag the corner handle to resize, click the X to delete. Positions itself in % within the overlay (parent passes pixel size for delta→fraction math).

- [ ] **Step 1: Write the component**

```tsx
// src/components/tools/RedactionBox.tsx
"use client";

import { useRef } from "react";
import { X } from "lucide-react";
import type { RedactionBox as Box } from "@/lib/pdf/redact";

interface Props {
    box: Box;
    containerWidth: number;
    containerHeight: number;
    selected: boolean;
    onSelect: () => void;
    onChange: (updates: Partial<Box>) => void;
    onDelete: () => void;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export function RedactionBox({
    box,
    containerWidth,
    containerHeight,
    selected,
    onSelect,
    onChange,
    onDelete,
}: Props) {
    const drag = useRef<null | { mode: "move" | "resize"; startX: number; startY: number; orig: Box }>(null);

    const start = (mode: "move" | "resize") => (e: React.PointerEvent) => {
        e.stopPropagation();
        onSelect();
        (e.target as Element).setPointerCapture?.(e.pointerId);
        drag.current = { mode, startX: e.clientX, startY: e.clientY, orig: { ...box } };
    };

    const move = (e: React.PointerEvent) => {
        const s = drag.current;
        if (!s || containerWidth === 0 || containerHeight === 0) return;
        const dx = (e.clientX - s.startX) / containerWidth;
        const dy = (e.clientY - s.startY) / containerHeight;
        if (s.mode === "move") {
            onChange({
                x: clamp(s.orig.x + dx, 0, 1 - s.orig.w),
                y: clamp(s.orig.y + dy, 0, 1 - s.orig.h),
            });
        } else {
            onChange({
                w: clamp(s.orig.w + dx, 0.005, 1 - s.orig.x),
                h: clamp(s.orig.h + dy, 0.005, 1 - s.orig.y),
            });
        }
    };

    const end = () => {
        drag.current = null;
    };

    return (
        <div
            onPointerDown={start("move")}
            onPointerMove={move}
            onPointerUp={end}
            style={{
                position: "absolute",
                left: `${box.x * 100}%`,
                top: `${box.y * 100}%`,
                width: `${box.w * 100}%`,
                height: `${box.h * 100}%`,
            }}
            className={`cursor-move bg-black/80 ${selected ? "ring-2 ring-primary-500" : ""}`}
        >
            {selected && (
                <>
                    <button
                        type="button"
                        aria-label="Delete redaction"
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="absolute -right-2 -top-2 rounded-full bg-white p-0.5 shadow"
                    >
                        <X className="h-3 w-3 text-black" />
                    </button>
                    <div
                        onPointerDown={start("resize")}
                        className="absolute -bottom-1 -right-1 h-3 w-3 cursor-se-resize border border-black bg-white"
                    />
                </>
            )}
        </div>
    );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/tools/RedactionBox.tsx
git commit -m "feat(redact): add draggable/resizable RedactionBox component"
```

---

## Task 5: RedactionEditor component

**Files:**
- Create: `src/components/tools/RedactionEditor.tsx`

Renders the current page via the existing `PDFPageRenderer` (which reports its rendered pixel size through `onPageRendered`), overlays a draw surface for marquee-creating boxes, renders the current page's boxes, and provides page navigation.

- [ ] **Step 1: Write the component**

```tsx
// src/components/tools/RedactionEditor.tsx
"use client";

import { useRef, useState } from "react";
import { PDFPageRenderer } from "./PDFPageRenderer";
import { RedactionBox } from "./RedactionBox";
import { pointerToFractionRect, type RedactionBox as Box } from "@/lib/pdf/redact";
import { Button } from "@/components/ui/Button";

interface Props {
    file: File;
    pageNumber: number; // 1-indexed
    totalPages: number;
    boxes: Box[]; // boxes for the current page only
    onPageChange: (page: number) => void;
    onAddBox: (rect: { x: number; y: number; w: number; h: number }) => void;
    onUpdateBox: (id: string, updates: Partial<Box>) => void;
    onDeleteBox: (id: string) => void;
}

export function RedactionEditor({
    file,
    pageNumber,
    totalPages,
    boxes,
    onPageChange,
    onAddBox,
    onUpdateBox,
    onDeleteBox,
}: Props) {
    const [size, setSize] = useState<{ w: number; h: number } | null>(null);
    const [draft, setDraft] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const startPt = useRef<{ x: number; y: number } | null>(null);

    const down = (e: React.PointerEvent) => {
        if (!overlayRef.current) return;
        const r = overlayRef.current.getBoundingClientRect();
        startPt.current = { x: e.clientX - r.left, y: e.clientY - r.top };
        setSelectedId(null);
    };

    const move = (e: React.PointerEvent) => {
        if (!startPt.current || !overlayRef.current || !size) return;
        const r = overlayRef.current.getBoundingClientRect();
        setDraft(
            pointerToFractionRect(startPt.current.x, startPt.current.y, e.clientX - r.left, e.clientY - r.top, size.w, size.h)
        );
    };

    const up = () => {
        if (draft && draft.w > 0.005 && draft.h > 0.005) onAddBox(draft);
        startPt.current = null;
        setDraft(null);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-center gap-4">
                <Button variant="secondary" disabled={pageNumber <= 1} onClick={() => onPageChange(pageNumber - 1)}>
                    Prev
                </Button>
                <span className="text-sm text-surface-600 dark:text-surface-300">
                    Page {pageNumber} of {totalPages}
                </span>
                <Button variant="secondary" disabled={pageNumber >= totalPages} onClick={() => onPageChange(pageNumber + 1)}>
                    Next
                </Button>
            </div>

            <div className="relative mx-auto w-fit" style={size ? { width: size.w, height: size.h } : undefined}>
                <PDFPageRenderer
                    file={file}
                    pageNumber={pageNumber}
                    scale={1.3}
                    onPageRendered={(w, h) => setSize({ w, h })}
                />
                {size && (
                    <div
                        ref={overlayRef}
                        className="absolute inset-0 cursor-crosshair touch-none"
                        onPointerDown={down}
                        onPointerMove={move}
                        onPointerUp={up}
                    >
                        {boxes.map((b) => (
                            <RedactionBox
                                key={b.id}
                                box={b}
                                containerWidth={size.w}
                                containerHeight={size.h}
                                selected={selectedId === b.id}
                                onSelect={() => setSelectedId(b.id)}
                                onChange={(u) => onUpdateBox(b.id, u)}
                                onDelete={() => onDeleteBox(b.id)}
                            />
                        ))}
                        {draft && (
                            <div
                                className="absolute border border-black bg-black/40"
                                style={{
                                    left: `${draft.x * 100}%`,
                                    top: `${draft.y * 100}%`,
                                    width: `${draft.w * 100}%`,
                                    height: `${draft.h * 100}%`,
                                }}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (If `PDFPageRenderer`'s prop types differ, align the props — it accepts `file`, `pageNumber`, `scale`, `onPageRendered(width, height)`.)

- [ ] **Step 3: Commit**

```bash
git add src/components/tools/RedactionEditor.tsx
git commit -m "feat(redact): add RedactionEditor with marquee draw and page nav"
```

---

## Task 6: RedactClient + route + registration

**Files:**
- Create: `src/app/(tools)/redact-pdf/RedactClient.tsx`
- Create: `src/app/(tools)/redact-pdf/page.tsx`
- Modify: `src/lib/icons.ts`
- Modify: `src/lib/constants.ts`
- Modify: `README.md`

- [ ] **Step 1: Write `RedactClient.tsx`**

```tsx
// src/app/(tools)/redact-pdf/RedactClient.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Eraser } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { RedactionEditor } from "@/components/tools/RedactionEditor";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FileWithPreview } from "@/types/tools";
import { downloadBlob } from "@/lib/utils";
import { applyRedactions, type RedactionBox } from "@/lib/pdf/redact";

if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

export default function RedactClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [boxes, setBoxes] = useState<RedactionBox[]>([]);
    const [pageNumber, setPageNumber] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);

    const file = files[0]?.file;

    useEffect(() => {
        let cancelled = false;
        if (!file) {
            setTotalPages(0);
            return;
        }
        (async () => {
            try {
                const data = new Uint8Array(await file.arrayBuffer());
                const pdf = await pdfjsLib.getDocument({ data }).promise;
                if (!cancelled) setTotalPages(pdf.numPages);
            } catch {
                if (!cancelled) setError("Could not read this PDF. It may be encrypted.");
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [file]);

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles.slice(0, 1));
        setBoxes([]);
        setPageNumber(1);
        setResult(null);
        setError(null);
    }, []);

    const addBox = (rect: { x: number; y: number; w: number; h: number }) =>
        setBoxes((prev) => [...prev, { id: crypto.randomUUID(), page: pageNumber - 1, ...rect }]);
    const updateBox = (id: string, updates: Partial<RedactionBox>) =>
        setBoxes((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
    const deleteBox = (id: string) => setBoxes((prev) => prev.filter((b) => b.id !== id));

    const currentBoxes = boxes.filter((b) => b.page === pageNumber - 1);

    const handleApply = async () => {
        if (!file || boxes.length === 0) return;
        setIsProcessing(true);
        setError(null);
        try {
            const { blob } = await applyRedactions(file, boxes);
            setResult(blob);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Redaction failed. No file was produced.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (result && file) downloadBlob(result, `${file.name.replace(".pdf", "")}_redacted.pdf`);
    };

    const handleReset = () => {
        setFiles([]);
        setBoxes([]);
        setPageNumber(1);
        setResult(null);
        setError(null);
    };

    return (
        <ToolLayout
            title="Redact PDF"
            description="Permanently black out sensitive content — redacted pages are flattened so the hidden text is truly gone"
            icon={Eraser}
            color="from-red-500 to-red-600"
        >
            {!result ? (
                <div className="space-y-6">
                    <FileUploader
                        accept={{ "application/pdf": [".pdf"] }}
                        multiple={false}
                        maxFiles={1}
                        files={files}
                        onFilesChange={handleFilesChange}
                        label="Drop your PDF here to redact"
                    />

                    {file && totalPages > 0 && (
                        <>
                            <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                                Redacted pages are flattened to images, so they lose selectable/searchable text. This is what
                                makes the redaction permanent and unrecoverable.
                            </div>

                            <RedactionEditor
                                file={file}
                                pageNumber={pageNumber}
                                totalPages={totalPages}
                                boxes={currentBoxes}
                                onPageChange={setPageNumber}
                                onAddBox={addBox}
                                onUpdateBox={updateBox}
                                onDeleteBox={deleteBox}
                            />

                            {error && (
                                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                    {error}
                                </div>
                            )}

                            {isProcessing && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                                    <ProgressBar value={50} />
                                    <p className="text-center text-sm text-surface-500">Applying redactions…</p>
                                </motion.div>
                            )}

                            {!isProcessing && (
                                <div className="flex justify-center gap-4">
                                    <Button variant="secondary" onClick={handleReset}>
                                        Clear
                                    </Button>
                                    <Button size="lg" onClick={handleApply} disabled={boxes.length === 0}>
                                        Apply {boxes.length > 0 ? `${boxes.length} ` : ""}Redaction{boxes.length === 1 ? "" : "s"}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="rounded-2xl border border-surface-200 bg-white p-6 text-center dark:border-surface-700 dark:bg-surface-800">
                        <h3 className="mb-2 font-semibold text-surface-900 dark:text-white">Redacted PDF ready</h3>
                        <p className="text-sm text-surface-500">The redacted content has been permanently removed.</p>
                    </div>
                    <div className="flex justify-center gap-4">
                        <DownloadButton
                            onClick={handleDownload}
                            filename={`${file!.name.replace(".pdf", "")}_redacted.pdf`}
                            fileSize={result.size}
                            isReady
                        />
                        <Button variant="secondary" onClick={handleReset}>
                            Redact Another
                        </Button>
                    </div>
                </div>
            )}
        </ToolLayout>
    );
}
```

- [ ] **Step 2: Write `page.tsx`**

```tsx
// src/app/(tools)/redact-pdf/page.tsx
import { Metadata } from "next";
import RedactClient from "./RedactClient";

export const metadata: Metadata = {
    title: "Redact PDF - Permanently Remove Sensitive Content",
    description:
        "Black out and permanently remove sensitive text or images from a PDF, entirely in your browser. Redacted content is truly gone, not just covered.",
    openGraph: {
        title: "Redact PDF - Permanently Remove Sensitive Content",
        description:
            "Black out and permanently remove sensitive text or images from a PDF, entirely in your browser.",
    },
};

export default function RedactPdfPage() {
    return <RedactClient />;
}
```

- [ ] **Step 3: Add the icon** to `src/lib/icons.ts`

In the import block from `"lucide-react"`, add `Eraser,`. In the `ICON_MAP` object, add `Eraser,`.

- [ ] **Step 4: Register the tool** in `src/lib/constants.ts`

Add this entry to the `TOOLS` array (place it next to the other `security` tools):

```typescript
    {
        id: "redact-pdf",
        name: "Redact PDF",
        description: "Permanently black out sensitive content",
        href: "/redact-pdf",
        icon: "Eraser",
        category: "security",
        color: "from-red-500 to-red-600",
    },
```

- [ ] **Step 5: Document in `README.md`**

Add to the tools table — change the Security row to include Redact, or add a row:

```markdown
| **Security** | Password Protect PDF, Unlock PDF, **Redact PDF** | ✅ Live |
```

And under "#### Security" in the detailed list:

```markdown
- **Redact PDF** - Permanently remove sensitive content. Redacted pages are flattened to images so the hidden text is truly gone (not just covered) — 100% client-side.
```

- [ ] **Step 6: Typecheck, lint, build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: no type errors; lint clean (pre-existing warnings only); build succeeds and prerenders `/redact-pdf`.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(tools)/redact-pdf" src/lib/icons.ts src/lib/constants.ts README.md
git commit -m "feat(redact): add /redact-pdf tool, route, registration, and docs"
```

---

## Task 7: Manual / browser verification (the security property)

**Files:** none (verification only).

Real rasterization can't run in jsdom, so the §5 security round-trip is verified here.

- [ ] **Step 1: Run the app**

Run: `npm run dev`, open `http://localhost:3000/redact-pdf`.

- [ ] **Step 2: Redact and verify removal**

Upload a text PDF, draw a box over a known word/line, click Apply, download the result. Open the downloaded PDF and confirm:
- The boxed area is solid black.
- Selecting/copying text over the redacted region yields **nothing** (the text is gone, not hidden).
- A non-redacted page still has selectable text.

- [ ] **Step 3: Verify extraction-proof**

In the browser console on the result, run pdf.js `getTextContent()` on the redacted page (or use any PDF text extractor) and confirm the secret string is absent.

- [ ] **Step 4: Edge checks**

- Multi-page: redact boxes on two different pages; confirm both are redacted and other pages untouched.
- Move/resize/delete a box before applying.
- Apply is disabled with zero boxes.

- [ ] **Step 5: Record results** in the PR description (before/after, what was verified).

---

## Self-Review Notes

- **Spec coverage:** box model + helpers (Task 1) ✓; secure rasterize-affected-pages apply (Task 2) ✓; browser rasterizer painting black boxes (Task 3) ✓; draw/move/resize/delete UI (Tasks 4–5) ✓; route + registration + README (Task 6) ✓; UX honesty notice (Task 6 RedactClient) ✓; fail-whole-apply on render error (Task 2 — any `renderPageToPng` rejection propagates, no partial output) ✓; security verification (Task 2 assembly test for "affected pages only" + Task 7 browser text-absence) ✓; dimension cap / per-page memory bound (Task 3 `maxEdge`, Task 2 loop) ✓; encrypted-PDF error (Task 6 `useEffect`) ✓.
- **Automated-test limit (honest):** the *text-absence* security property is browser-verified (Task 7), because pdf.js rasterization needs a real canvas; CI covers the assembly logic (only affected pages rasterized, page count/size preserved) via the injected fake renderer.
- **Type consistency:** `RedactionBox` (`id/page/x/y/w/h`), `applyRedactions(file, boxes, opts?, deps?) → { blob, rasterizedPages }`, `RenderDeps.renderPageToPng(file, pageIndex, boxes, dpi, maxEdge)`, `pointerToFractionRect`, `boxToPixelRect`, `clampBox`, `groupBoxesByPage` — used consistently across tasks.
- **No placeholders:** every code step contains complete code; commands have expected outcomes.
