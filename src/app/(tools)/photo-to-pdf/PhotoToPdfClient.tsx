"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Camera, Trash2, Check, ArrowUp, ArrowDown } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { Button } from "@/components/ui/Button";
import { PrimaryAction } from "@/components/tools/PrimaryAction";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FileWithPreview } from "@/types/tools";
import { imagesToPDF, PageSize, Orientation, Margin } from "@/lib/pdf/fromImage";
import { downloadBlob, createPdfBlob } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import Image from "next/image";

const LAYOUT_OPTIONS = [
    { id: "single" as const, name: "1 per page", description: "Full-page photos" },
    { id: "grid2" as const, name: "2 per page", description: "Two photos per page" },
    { id: "grid4" as const, name: "4 per page", description: "Grid of four" },
];

const PAGE_SIZE_OPTIONS = [
    { id: "a4" as PageSize, name: "A4", description: "210 × 297 mm" },
    { id: "letter" as PageSize, name: "Letter", description: "8.5 × 11 in" },
    { id: "original" as PageSize, name: "Original", description: "Match photo size" },
];

export default function PhotoToPdfClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [pageSize, setPageSize] = useState<PageSize>("a4");
    const [layout, setLayout] = useState<"single" | "grid2" | "grid4">("single");
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ blob: Blob; pageCount: number } | null>(null);
    const toast = useToast();

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles);
        setResult(null);
    }, []);

    const moveFile = useCallback((index: number, direction: "up" | "down") => {
        setFiles((prev) => {
            const newFiles = [...prev];
            const newIndex = direction === "up" ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= newFiles.length) return prev;
            [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
            return newFiles;
        });
    }, []);

    const removeFile = useCallback((fileId: string) => {
        setFiles((prev) => {
            const file = prev.find((f) => f.id === fileId);
            if (file?.preview) URL.revokeObjectURL(file.preview);
            return prev.filter((f) => f.id !== fileId);
        });
        setResult(null);
    }, []);

    const handleConvert = async () => {
        if (files.length === 0) {
            toast.warning("Please add at least one photo");
            return;
        }

        setIsProcessing(true);
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            const actualFiles = files.map((f) => f.file);

            // For grid layouts, we need to combine images on fewer pages
            if (layout === "single") {
                const convertResult = await imagesToPDF(
                    actualFiles,
                    pageSize,
                    "auto" as Orientation,
                    "small" as Margin,
                    true
                );

                clearInterval(progressInterval);
                setProgress(100);

                if (convertResult.success && convertResult.data) {
                    const blob = createPdfBlob(convertResult.data);
                    setResult({ blob, pageCount: convertResult.pageCount || 0 });
                    toast.success("Photos converted to PDF!");
                } else {
                    toast.error(convertResult.error || "Failed to create PDF");
                }
            } else {
                // Grid layout: use canvas to combine images
                const { PDFDocument } = await import("@cantoo/pdf-lib");
                const pdf = await PDFDocument.create();
                const perPage = layout === "grid2" ? 2 : 4;
                const cols = layout === "grid2" ? 1 : 2;
                const rows = layout === "grid2" ? 2 : 2;

                const sizeMap = {
                    a4: { width: 595.28, height: 841.89 },
                    letter: { width: 612, height: 792 },
                    original: { width: 595.28, height: 841.89 },
                };
                const { width: pageWidth, height: pageHeight } = sizeMap[pageSize];
                const margin = 20;
                const gap = 10;

                const cellWidth = (pageWidth - margin * 2 - gap * (cols - 1)) / cols;
                const cellHeight = (pageHeight - margin * 2 - gap * (rows - 1)) / rows;

                for (let i = 0; i < actualFiles.length; i += perPage) {
                    const page = pdf.addPage([pageWidth, pageHeight]);
                    const batch = actualFiles.slice(i, i + perPage);

                    for (let j = 0; j < batch.length; j++) {
                        const file = batch[j];
                        const arrayBuffer = await file.arrayBuffer();
                        const col = j % cols;
                        const row = Math.floor(j / cols);

                        let image;
                        if (file.type === "image/jpeg" || file.type === "image/jpg") {
                            image = await pdf.embedJpg(new Uint8Array(arrayBuffer));
                        } else if (file.type === "image/png") {
                            image = await pdf.embedPng(new Uint8Array(arrayBuffer));
                        } else {
                            // Convert to PNG via canvas
                            const blob = new Blob([arrayBuffer], { type: file.type });
                            const url = URL.createObjectURL(blob);
                            const img = await loadImage(url);
                            URL.revokeObjectURL(url);
                            const canvas = document.createElement("canvas");
                            canvas.width = img.width;
                            canvas.height = img.height;
                            canvas.getContext("2d")?.drawImage(img, 0, 0);
                            const pngBlob = await new Promise<Blob>((resolve) =>
                                canvas.toBlob((b) => resolve(b!), "image/png")
                            );
                            const pngBuffer = await pngBlob.arrayBuffer();
                            image = await pdf.embedPng(new Uint8Array(pngBuffer));
                        }

                        const imgRatio = image.width / image.height;
                        const cellRatio = cellWidth / cellHeight;
                        let drawW: number, drawH: number;
                        if (imgRatio > cellRatio) {
                            drawW = cellWidth;
                            drawH = cellWidth / imgRatio;
                        } else {
                            drawH = cellHeight;
                            drawW = cellHeight * imgRatio;
                        }

                        const x = margin + col * (cellWidth + gap) + (cellWidth - drawW) / 2;
                        const y =
                            pageHeight -
                            margin -
                            row * (cellHeight + gap) -
                            cellHeight +
                            (cellHeight - drawH) / 2;

                        page.drawImage(image, { x, y, width: drawW, height: drawH });
                    }

                    setProgress(Math.min(90, Math.round(((i + perPage) / actualFiles.length) * 90)));
                }

                clearInterval(progressInterval);
                const pdfBytes = await pdf.save();
                setProgress(100);

                const blob = createPdfBlob(pdfBytes);
                setResult({ blob, pageCount: pdf.getPageCount() });
                toast.success("Photos converted to PDF!");
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (result) {
            downloadBlob(result.blob, "photos.pdf");
        }
    };

    const handleReset = () => {
        files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
        setFiles([]);
        setResult(null);
        setProgress(0);
    };

    return (
        <ToolLayout
            title="Photo to PDF"
            description="Convert your photos into a beautiful PDF document. Drag, drop, and reorder."
            icon={Camera}
            color="from-pink-500 to-rose-600"
        >
            {!result ? (
                <div className="space-y-6">
                    <FileUploader
                        accept={{
                            "image/jpeg": [".jpg", ".jpeg"],
                            "image/png": [".png"],
                            "image/webp": [".webp"],
                            "image/heic": [".heic"],
                            "image/gif": [".gif"],
                        }}
                        multiple
                        files={files}
                        onFilesChange={handleFilesChange}
                        label="Drop your photos here"
                        description="JPG, PNG, WEBP, HEIC supported"
                    />

                    {/* Photo Preview & Reorder */}
                    {files.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-surface-900 dark:text-white">
                                    Photos ({files.length})
                                </h3>
                                <p className="text-sm text-surface-500">Drag to reorder</p>
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                {files.map((file, index) => (
                                    <div key={file.id} className="relative group">
                                        <div className="aspect-square rounded-xl overflow-hidden border-2 border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-700">
                                            {file.preview && (
                                                <Image
                                                    src={file.preview}
                                                    alt={file.name}
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            )}
                                        </div>
                                        <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-primary-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                                            {index + 1}
                                        </div>
                                        <div className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                                            {index > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => moveFile(index, "up")}
                                                    className="p-1 bg-surface-800/80 text-white rounded-full hover:bg-surface-700"
                                                    aria-label="Move left"
                                                >
                                                    <ArrowUp className="w-3 h-3" aria-hidden="true" />
                                                </button>
                                            )}
                                            {index < files.length - 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => moveFile(index, "down")}
                                                    className="p-1 bg-surface-800/80 text-white rounded-full hover:bg-surface-700"
                                                    aria-label="Move right"
                                                >
                                                    <ArrowDown className="w-3 h-3" aria-hidden="true" />
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeFile(file.id)}
                                                className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                aria-label="Remove photo"
                                            >
                                                <Trash2 className="w-3 h-3" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Options */}
                    {files.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="grid md:grid-cols-2 gap-6"
                        >
                            {/* Layout */}
                            <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                                    Layout
                                </h3>
                                <div className="space-y-2">
                                    {LAYOUT_OPTIONS.map((option) => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => setLayout(option.id)}
                                            className={`w-full p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-[border-color,background-color] ${
                                                layout === option.id
                                                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                                    : "border-surface-200 dark:border-surface-700"
                                            }`}
                                        >
                                            <div
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                    layout === option.id
                                                        ? "border-primary-500 bg-primary-500"
                                                        : "border-surface-300"
                                                }`}
                                            >
                                                {layout === option.id && (
                                                    <Check className="w-3 h-3 text-white" aria-hidden="true" />
                                                )}
                                            </div>
                                            <div>
                                                <span className="font-medium text-surface-900 dark:text-white">
                                                    {option.name}
                                                </span>
                                                <span className="text-sm text-surface-500 ml-2">
                                                    {option.description}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Page Size */}
                            <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                                    Page Size
                                </h3>
                                <div className="space-y-2">
                                    {PAGE_SIZE_OPTIONS.map((option) => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => setPageSize(option.id)}
                                            className={`w-full p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-[border-color,background-color] ${
                                                pageSize === option.id
                                                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                                    : "border-surface-200 dark:border-surface-700"
                                            }`}
                                        >
                                            <div
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                    pageSize === option.id
                                                        ? "border-primary-500 bg-primary-500"
                                                        : "border-surface-300"
                                                }`}
                                            >
                                                {pageSize === option.id && (
                                                    <Check className="w-3 h-3 text-white" aria-hidden="true" />
                                                )}
                                            </div>
                                            <div>
                                                <span className="font-medium text-surface-900 dark:text-white">
                                                    {option.name}
                                                </span>
                                                <span className="text-sm text-surface-500 ml-2">
                                                    {option.description}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Progress */}
                    {isProcessing && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                            <ProgressBar value={progress} />
                            <p className="text-sm text-center text-surface-500">
                                Creating PDF from {files.length} photos\u2026
                            </p>
                        </motion.div>
                    )}

                    {/* Action Buttons */}
                    {files.length > 0 && !isProcessing && (
                        <div className="flex justify-center gap-4">
                            <Button variant="secondary" onClick={handleReset}>
                                Clear All
                            </Button>
                            <PrimaryAction
                                onClick={handleConvert}
                                loading={isProcessing}
                                context={`${files.length} photo${files.length === 1 ? "" : "s"} ready`}
                            >
                                Create PDF
                            </PrimaryAction>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <DownloadButton
                        onClick={handleDownload}
                        filename="photos.pdf"
                        fileSize={result.blob.size}
                        isReady
                    />
                    <div className="text-center">
                        <p className="text-sm text-surface-500 mb-4">
                            {result.pageCount} {result.pageCount === 1 ? "page" : "pages"} created
                            from {files.length} {files.length === 1 ? "photo" : "photos"}
                        </p>
                        <Button variant="secondary" onClick={handleReset}>
                            Convert More Photos
                        </Button>
                    </div>
                </div>
            )}
        </ToolLayout>
    );
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}
