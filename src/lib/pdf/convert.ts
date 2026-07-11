// Pure PDF→Office conversions. Extracted from useConversionWorker so both the
// standalone convert tools AND the batch pipeline can call them. Runs on the
// main thread (pptx uses a <canvas>); the previous "worker" name was a misnomer.
export type ConvertProgress = (pct: number, stage?: string) => void;

interface ConvertResult {
    bytes: Uint8Array;
    pageCount: number;
}

export async function pdfToWord(input: Uint8Array, onProgress: ConvertProgress = () => {}): Promise<ConvertResult> {
    onProgress(5, "Loading PDF...");
    const pdfjsLib = await import("pdfjs-dist");
    if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            "pdfjs-dist/legacy/build/pdf.worker.mjs",
            import.meta.url
        ).toString();
    }

    const { Document, Packer, Paragraph, TextRun, PageBreak, HeadingLevel } = await import("docx");

    const pdf = await pdfjsLib.getDocument({ data: input }).promise;
    const totalPages = pdf.numPages;
    const allParagraphs: InstanceType<typeof Paragraph>[] = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        onProgress(5 + (pageNum / totalPages) * 70, `Extracting page ${pageNum} of ${totalPages}`);

        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.0 });

        const items: { str: string; x: number; y: number; fontSize: number; fontName: string }[] = [];
        for (const item of textContent.items) {
            if ("str" in item && item.str.trim()) {
                const tx = item.transform;
                items.push({
                    str: item.str,
                    x: tx[4],
                    y: viewport.height - tx[5],
                    fontSize: Math.abs(tx[0]) || 12,
                    fontName: item.fontName || "",
                });
            }
        }

        items.sort((a, b) => a.y - b.y || a.x - b.x);

        const lines: typeof items[] = [];
        let currentLine: typeof items = [];
        let lastY = -999;

        for (const item of items) {
            if (Math.abs(item.y - lastY) > 3) {
                if (currentLine.length > 0) lines.push(currentLine);
                currentLine = [item];
                lastY = item.y;
            } else {
                currentLine.push(item);
            }
        }
        if (currentLine.length > 0) lines.push(currentLine);

        for (const line of lines) {
            const text = line.map((item) => item.str).join(" ");
            const avgFontSize = line.reduce((sum, item) => sum + item.fontSize, 0) / line.length;
            const isBold = line.some((item) => item.fontName.toLowerCase().includes("bold"));

            let heading: (typeof HeadingLevel)[keyof typeof HeadingLevel] | undefined;
            if (avgFontSize > 20) heading = HeadingLevel.HEADING_1;
            else if (avgFontSize > 16) heading = HeadingLevel.HEADING_2;
            else if (avgFontSize > 14) heading = HeadingLevel.HEADING_3;

            allParagraphs.push(
                new Paragraph({
                    heading,
                    children: [
                        new TextRun({
                            text,
                            bold: isBold,
                            size: Math.round(avgFontSize * 2),
                        }),
                    ],
                })
            );
        }

        if (pageNum < totalPages) {
            allParagraphs.push(new Paragraph({ children: [new PageBreak()] }));
        }
    }

    onProgress(85, "Creating Word document...");

    const doc = new Document({ sections: [{ children: allParagraphs }] });
    const docxBlob = await Packer.toBlob(doc);

    onProgress(100, "Complete");
    return { bytes: new Uint8Array(await docxBlob.arrayBuffer()), pageCount: totalPages };
}

export async function pdfToExcel(input: Uint8Array, onProgress: ConvertProgress = () => {}): Promise<ConvertResult> {
    onProgress(5, "Loading PDF...");
    const pdfjsLib = await import("pdfjs-dist");
    if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            "pdfjs-dist/legacy/build/pdf.worker.mjs",
            import.meta.url
        ).toString();
    }
    const XLSX = await import("xlsx");

    const pdf = await pdfjsLib.getDocument({ data: input }).promise;
    const totalPages = pdf.numPages;
    const workbook = XLSX.utils.book_new();

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        onProgress(5 + (pageNum / totalPages) * 80, `Processing page ${pageNum} of ${totalPages}`);

        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.0 });

        const items: { str: string; x: number; y: number }[] = [];
        for (const item of textContent.items) {
            if ("str" in item && item.str.trim()) {
                const tx = item.transform;
                items.push({
                    str: item.str,
                    x: Math.round(tx[4]),
                    y: Math.round(viewport.height - tx[5]),
                });
            }
        }

        items.sort((a, b) => a.y - b.y || a.x - b.x);

        const rows: { str: string; x: number }[][] = [];
        let currentRow: { str: string; x: number }[] = [];
        let lastY = -999;

        for (const item of items) {
            if (Math.abs(item.y - lastY) > 5) {
                if (currentRow.length > 0) rows.push(currentRow);
                currentRow = [{ str: item.str, x: item.x }];
                lastY = item.y;
            } else {
                currentRow.push({ str: item.str, x: item.x });
            }
        }
        if (currentRow.length > 0) rows.push(currentRow);

        const allXPositions = items.map((i) => i.x).sort((a, b) => a - b);
        const columnBoundaries: number[] = [];
        if (allXPositions.length > 0) {
            columnBoundaries.push(allXPositions[0]);
            for (let i = 1; i < allXPositions.length; i++) {
                if (allXPositions[i] - allXPositions[i - 1] > 30) {
                    columnBoundaries.push(allXPositions[i]);
                }
            }
        }

        const gridRows: string[][] = rows.map((row) => {
            const cells = new Array(Math.max(columnBoundaries.length, 1)).fill("");
            for (const item of row) {
                let colIdx = 0;
                for (let c = columnBoundaries.length - 1; c >= 0; c--) {
                    if (item.x >= columnBoundaries[c] - 15) {
                        colIdx = c;
                        break;
                    }
                }
                cells[colIdx] = cells[colIdx] ? cells[colIdx] + " " + item.str : item.str;
            }
            return cells;
        });

        const worksheet = XLSX.utils.aoa_to_sheet(gridRows);
        XLSX.utils.book_append_sheet(workbook, worksheet, `Page ${pageNum}`);
    }

    onProgress(90, "Creating Excel file...");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    onProgress(100, "Complete");

    return { bytes: new Uint8Array(excelBuffer), pageCount: totalPages };
}

export async function pdfToPptx(input: Uint8Array, onProgress: ConvertProgress = () => {}): Promise<ConvertResult> {
    onProgress(5, "Loading PDF...");
    const pdfjsLib = await import("pdfjs-dist");
    if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            "pdfjs-dist/legacy/build/pdf.worker.mjs",
            import.meta.url
        ).toString();
    }
    const PptxGenJS = (await import("pptxgenjs")).default;

    const pdf = await pdfjsLib.getDocument({ data: input }).promise;
    const totalPages = pdf.numPages;
    const pptx = new PptxGenJS();

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        onProgress(5 + (pageNum / totalPages) * 80, `Rendering page ${pageNum} of ${totalPages}`);

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Cannot create canvas context");

        await page.render({ canvasContext: ctx, viewport }).promise;

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

        const slide = pptx.addSlide();
        slide.addImage({
            data: dataUrl,
            x: 0,
            y: 0,
            w: "100%",
            h: "100%",
        });
    }

    onProgress(90, "Creating PowerPoint...");
    const pptxOutput = await pptx.write({ outputType: "arraybuffer" });
    onProgress(100, "Complete");

    return { bytes: new Uint8Array(pptxOutput as ArrayBuffer), pageCount: totalPages };
}
