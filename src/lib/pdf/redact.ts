import { PDFDocument } from "@cantoo/pdf-lib";

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
