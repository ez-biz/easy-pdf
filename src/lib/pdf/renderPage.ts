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
