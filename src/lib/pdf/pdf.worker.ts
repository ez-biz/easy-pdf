import { PDFDocument, degrees } from "@cantoo/pdf-lib";
import JSZip from "jszip";

export type WorkerOperation = "merge" | "compress" | "split" | "rotate";

export interface WorkerRequest {
    id: string;
    operation: WorkerOperation;
    buffers: ArrayBuffer[];
    options?: Record<string, unknown>;
    fileNames?: string[];
}

export interface WorkerProgressMessage {
    id: string;
    type: "progress";
    progress: number;
    stage?: string;
}

export interface WorkerResultMessage {
    id: string;
    type: "result";
    data: Uint8Array | ArrayBuffer;
    details?: Record<string, unknown>;
}

export interface WorkerErrorMessage {
    id: string;
    type: "error";
    error: string;
}

export type WorkerResponse = WorkerProgressMessage | WorkerResultMessage | WorkerErrorMessage;

function postProgress(id: string, progress: number, stage?: string) {
    self.postMessage({ id, type: "progress", progress, stage } satisfies WorkerProgressMessage);
}

async function handleMerge(id: string, buffers: ArrayBuffer[]) {
    if (buffers.length < 2) {
        throw new Error("At least 2 PDF files are required to merge");
    }

    const mergedPdf = await PDFDocument.create();
    postProgress(id, 5, "Starting merge...");

    for (let i = 0; i < buffers.length; i++) {
        const pdf = await PDFDocument.load(buffers[i]);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        postProgress(id, 5 + ((i + 1) / buffers.length) * 80, `Processing file ${i + 1} of ${buffers.length}`);
    }

    postProgress(id, 90, "Saving merged PDF...");
    const result = await mergedPdf.save();
    postProgress(id, 100, "Complete");

    return {
        data: result,
        details: { pageCount: mergedPdf.getPageCount() },
    };
}

async function handleCompress(id: string, buffers: ArrayBuffer[]) {
    const buffer = buffers[0];
    const originalSize = buffer.byteLength;

    postProgress(id, 10, "Loading PDF...");
    const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });

    postProgress(id, 30, "Optimizing structure...");
    const newPdf = await PDFDocument.create();
    const pages = await newPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => newPdf.addPage(page));

    postProgress(id, 60, "Copying metadata...");
    newPdf.setTitle(pdf.getTitle() || "");
    newPdf.setAuthor(pdf.getAuthor() || "");
    newPdf.setSubject(pdf.getSubject() || "");
    newPdf.setCreator("EasyPDF");
    newPdf.setProducer("EasyPDF - PDF Compression Tool");

    postProgress(id, 80, "Compressing...");
    const compressedBytes = await newPdf.save({
        useObjectStreams: true,
        addDefaultPage: false,
    });

    postProgress(id, 100, "Complete");

    return {
        data: compressedBytes,
        details: {
            originalSize,
            compressedSize: compressedBytes.length,
        },
    };
}

interface SplitOptions {
    mode: "range" | "pages" | "every" | "all";
    ranges?: string;
    pages?: number[];
    everyN?: number;
    fileName?: string;
}

function parseRanges(rangesStr: string, totalPages: number): number[][] {
    const ranges: number[][] = [];
    const parts = rangesStr.split(",").map((s) => s.trim());

    for (const part of parts) {
        if (part.includes("-")) {
            const [start, end] = part.split("-").map((n) => parseInt(n.trim()));
            if (start >= 1 && end <= totalPages && start <= end) {
                ranges.push(Array.from({ length: end - start + 1 }, (_, i) => start + i - 1));
            }
        } else {
            const page = parseInt(part);
            if (page >= 1 && page <= totalPages) {
                ranges.push([page - 1]);
            }
        }
    }

    return ranges;
}

async function handleSplit(id: string, buffers: ArrayBuffer[], options: SplitOptions) {
    postProgress(id, 5, "Loading PDF...");
    const pdf = await PDFDocument.load(buffers[0]);
    const totalPages = pdf.getPageCount();

    let pageGroups: number[][] = [];

    switch (options.mode) {
        case "range":
            if (!options.ranges) throw new Error("Please specify page ranges");
            pageGroups = parseRanges(options.ranges, totalPages);
            break;
        case "pages":
            if (!options.pages || options.pages.length === 0) throw new Error("Please select pages to extract");
            pageGroups = options.pages.map((p) => [p - 1]);
            break;
        case "every":
            if (!options.everyN || options.everyN < 1) throw new Error("Please specify a valid number");
            for (let i = 0; i < totalPages; i += options.everyN) {
                const group: number[] = [];
                for (let j = i; j < Math.min(i + options.everyN, totalPages); j++) {
                    group.push(j);
                }
                pageGroups.push(group);
            }
            break;
        case "all":
            pageGroups = Array.from({ length: totalPages }, (_, i) => [i]);
            break;
    }

    if (pageGroups.length === 0) throw new Error("No valid pages to split");

    postProgress(id, 15, "Splitting pages...");
    const zip = new JSZip();
    const baseName = (options.fileName || "document").replace(".pdf", "");

    for (let i = 0; i < pageGroups.length; i++) {
        const group = pageGroups[i];
        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdf, group);
        copiedPages.forEach((page) => newPdf.addPage(page));

        const pdfBytes = await newPdf.save();
        const fileName =
            options.mode === "all"
                ? `${baseName}_page_${group[0] + 1}.pdf`
                : `${baseName}_part_${i + 1}.pdf`;
        zip.file(fileName, pdfBytes);

        postProgress(id, 15 + ((i + 1) / pageGroups.length) * 70, `Creating part ${i + 1} of ${pageGroups.length}`);
    }

    postProgress(id, 90, "Creating ZIP archive...");
    const zipBlob = await zip.generateAsync({ type: "arraybuffer" });

    postProgress(id, 100, "Complete");

    return {
        data: zipBlob,
        details: { fileCount: pageGroups.length },
    };
}

interface RotateOptions {
    angle?: number; // Uniform rotation
    rotations?: [number, number][]; // [pageIndex, angle] pairs
}

async function handleRotate(id: string, buffers: ArrayBuffer[], options: RotateOptions) {
    postProgress(id, 10, "Loading PDF...");
    const pdf = await PDFDocument.load(buffers[0]);
    const pages = pdf.getPages();

    postProgress(id, 40, "Rotating pages...");

    if (options.angle !== undefined) {
        pages.forEach((page) => {
            const currentRotation = page.getRotation().angle;
            page.setRotation(degrees(currentRotation + options.angle!));
        });
    } else if (options.rotations) {
        for (const [pageIndex, angle] of options.rotations) {
            if (pageIndex < pages.length) {
                const page = pages[pageIndex];
                const currentRotation = page.getRotation().angle;
                page.setRotation(degrees(currentRotation + angle));
            }
        }
    }

    postProgress(id, 80, "Saving...");
    const result = await pdf.save();
    postProgress(id, 100, "Complete");

    return {
        data: result,
        details: {},
    };
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
    const { id, operation, buffers, options } = e.data;

    try {
        let result: { data: Uint8Array | ArrayBuffer; details?: Record<string, unknown> };

        switch (operation) {
            case "merge":
                result = await handleMerge(id, buffers);
                break;
            case "compress":
                result = await handleCompress(id, buffers);
                break;
            case "split":
                result = await handleSplit(id, buffers, options as unknown as SplitOptions);
                break;
            case "rotate":
                result = await handleRotate(id, buffers, options as unknown as RotateOptions);
                break;
            default:
                throw new Error(`Unknown operation: ${operation}`);
        }

        const msg: WorkerResultMessage = {
            id,
            type: "result",
            data: result.data,
            details: result.details,
        };
        self.postMessage(msg);
    } catch (error) {
        const msg: WorkerErrorMessage = {
            id,
            type: "error",
            error: error instanceof Error ? error.message : "Operation failed",
        };
        self.postMessage(msg);
    }
};
