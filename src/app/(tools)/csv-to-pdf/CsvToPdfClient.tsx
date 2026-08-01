"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Table, FileText, FileSpreadsheet } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "@cantoo/pdf-lib";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { PrimaryAction } from "@/components/tools/PrimaryAction";
import { FileWithPreview } from "@/types/tools";
import { downloadBlob, formatFileSize, createPdfBlob } from "@/lib/utils";

function parseCSV(text: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (inQuotes) {
            if (char === '"' && nextChar === '"') {
                currentField += '"';
                i++;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                currentField += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ",") {
                currentRow.push(currentField.trim());
                currentField = "";
            } else if (char === "\n" || (char === "\r" && nextChar === "\n")) {
                currentRow.push(currentField.trim());
                if (currentRow.some((f) => f !== "")) {
                    rows.push(currentRow);
                }
                currentRow = [];
                currentField = "";
                if (char === "\r") i++;
            } else if (char === "\r") {
                currentRow.push(currentField.trim());
                if (currentRow.some((f) => f !== "")) {
                    rows.push(currentRow);
                }
                currentRow = [];
                currentField = "";
            } else {
                currentField += char;
            }
        }
    }

    // Last field
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f !== "")) {
        rows.push(currentRow);
    }

    return rows;
}

export default function CsvToPdfClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [result, setResult] = useState<{ blob: Blob; size: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewRows, setPreviewRows] = useState<string[][]>([]);

    const file = files[0]?.file;

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles.slice(0, 1));
        setResult(null);
        setError(null);
        setPreviewRows([]);
    }, []);

    const handleConvert = async () => {
        if (!file) {
            setError("Please upload a CSV file");
            return;
        }

        setError(null);
        setIsProcessing(true);

        try {
            const text = await file.text();
            const rows = parseCSV(text);

            if (rows.length === 0) {
                throw new Error("No data found in CSV file");
            }

            const pdfDoc = await PDFDocument.create();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            const pageWidth = 841.89; // Landscape A4
            const pageHeight = 595.28;
            const marginX = 30;
            const marginTop = 40;
            const headerHeight = 25;
            const rowHeight = 20;
            const fontSize = 9;
            const headerFontSize = 9;

            // Calculate column widths
            const numCols = Math.max(...rows.map((r) => r.length));
            const colWidth = (pageWidth - marginX * 2) / numCols;

            let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            let currentY = pageHeight - marginTop;

            const addPage = () => {
                currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                currentY = pageHeight - marginTop;

                // Redraw header on new page
                const headerRow = rows[0];
                for (let c = 0; c < numCols; c++) {
                    const x = marginX + c * colWidth;
                    currentPage.drawRectangle({
                        x,
                        y: currentY - headerHeight + 2,
                        width: colWidth - 2,
                        height: headerHeight,
                        color: rgb(0.9, 0.9, 0.95),
                    });
                    const cellText = (headerRow[c] || "").substring(0, Math.floor(colWidth / 4));
                    currentPage.drawText(cellText, {
                        x: x + 3,
                        y: currentY - headerHeight + 7,
                        size: headerFontSize,
                        font: boldFont,
                        color: rgb(0.1, 0.1, 0.1),
                    });
                }
                currentY -= headerHeight;
            };

            // Draw header
            const headerRow = rows[0];
            for (let c = 0; c < numCols; c++) {
                const x = marginX + c * colWidth;
                currentPage.drawRectangle({
                    x,
                    y: currentY - headerHeight + 2,
                    width: colWidth - 2,
                    height: headerHeight,
                    color: rgb(0.9, 0.9, 0.95),
                });
                const cellText = (headerRow[c] || "").substring(0, Math.floor(colWidth / 4));
                currentPage.drawText(cellText, {
                    x: x + 3,
                    y: currentY - headerHeight + 7,
                    size: headerFontSize,
                    font: boldFont,
                    color: rgb(0.1, 0.1, 0.1),
                });
            }
            currentY -= headerHeight;

            // Draw data rows
            for (let r = 1; r < rows.length; r++) {
                if (currentY - rowHeight < 40) {
                    addPage();
                }

                const isEvenRow = r % 2 === 0;
                if (isEvenRow) {
                    currentPage.drawRectangle({
                        x: marginX,
                        y: currentY - rowHeight + 2,
                        width: pageWidth - marginX * 2,
                        height: rowHeight,
                        color: rgb(0.97, 0.97, 0.97),
                    });
                }

                for (let c = 0; c < numCols; c++) {
                    const cellText = (rows[r][c] || "").substring(0, Math.floor(colWidth / 4));
                    currentPage.drawText(cellText, {
                        x: marginX + c * colWidth + 3,
                        y: currentY - rowHeight + 6,
                        size: fontSize,
                        font,
                        color: rgb(0.1, 0.1, 0.1),
                    });
                }

                // Draw row separator
                currentPage.drawLine({
                    start: { x: marginX, y: currentY - rowHeight + 1 },
                    end: { x: pageWidth - marginX, y: currentY - rowHeight + 1 },
                    thickness: 0.5,
                    color: rgb(0.85, 0.85, 0.85),
                });

                currentY -= rowHeight;
            }

            const pdfBytes = await pdfDoc.save();
            const blob = createPdfBlob(pdfBytes);
            setResult({ blob, size: blob.size });
            setPreviewRows(rows.slice(0, 10));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to convert CSV to PDF");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (result && file) {
            const baseName = file.name.replace(/\.csv$/i, "");
            downloadBlob(result.blob, `${baseName}.pdf`);
        }
    };

    const handleReset = () => {
        setFiles([]);
        setResult(null);
        setError(null);
        setPreviewRows([]);
    };

    return (
        <ToolLayout
            title="CSV to PDF"
            description="Convert CSV spreadsheet data to a formatted PDF table"
            icon={Table}
            color="from-green-500 to-emerald-600"
        >
            {!result ? (
                <div className="space-y-6">
                    <FileUploader
                        accept={{ "text/csv": [".csv"], "text/plain": [".txt"] }}
                        multiple={false}
                        maxFiles={1}
                        files={files}
                        onFilesChange={handleFilesChange}
                        label="Drop your CSV file here"
                        description="Converts CSV data into a PDF table"
                    />

                    {file && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3 p-4 bg-surface-50 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
                                <div className="w-12 h-14 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                    <FileSpreadsheet className="w-6 h-6 text-green-500" />
                                </div>
                                <div>
                                    <p className="font-medium text-surface-900 dark:text-white truncate">{file.name}</p>
                                    <p className="text-sm text-surface-500">{formatFileSize(file.size)}</p>
                                </div>
                            </div>

                            {previewRows.length > 0 && (
                                <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                                    <h3 className="font-semibold text-surface-900 dark:text-white mb-3">
                                        Preview ({Math.min(10, previewRows.length)} rows)
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-surface-200 dark:border-surface-700">
                                                    {previewRows[0]?.map((col, i) => (
                                                        <th key={i} className="px-3 py-2 text-left font-medium text-surface-700 dark:text-surface-300 whitespace-nowrap">
                                                            {col}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {previewRows.slice(1).map((row, i) => (
                                                    <tr key={i} className="border-b border-surface-100 dark:border-surface-800">
                                                        {row.map((col, j) => (
                                                            <td key={j} className="px-3 py-2 text-surface-600 dark:text-surface-400 whitespace-nowrap">
                                                                {col}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <p className="text-sm text-surface-500">{previewRows.length > 0 ? `${previewRows.length} rows previewed` : "Ready to convert"}</p>
                                <PrimaryAction
                                    onClick={handleConvert}
                                    loading={isProcessing}
                                    icon={<Table className="w-4 h-4" />}
                                >
                                    Convert to PDF
                                </PrimaryAction>
                            </div>
                        </motion.div>
                    )}
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                >
                    <div className="bg-white dark:bg-surface-800 rounded-2xl p-8 border border-surface-200 dark:border-surface-700 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        >
                            <Table className="w-10 h-10 text-green-500" />
                        </motion.div>
                        <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">PDF Table Ready</h2>
                        <p className="text-surface-500 dark:text-surface-400">
                            Your CSV data has been converted to a formatted PDF table.
                        </p>
                    </div>

                    <div className="flex items-center justify-between">
                        <DownloadButton
                            onClick={handleDownload}
                            filename={file.name.replace(/\.csv$/i, ".pdf")}
                            fileSize={result.size}
                            isReady={true}
                        />
                        <button onClick={handleReset} className="text-sm text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 transition-colors">
                            Convert Another
                        </button>
                    </div>
                </motion.div>
            )}
        </ToolLayout>
    );
}
