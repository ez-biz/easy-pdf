"use client";

import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Type, Trash2 } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { PDFPageRenderer } from "@/components/tools/PDFPageRenderer";
import { Button } from "@/components/ui/Button";
import { FileWithPreview } from "@/types/tools";
import { addTextToPDF, generatePagePreviews, TextBox } from "@/lib/pdf/addText";
import { downloadBlob, createPdfBlob } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import { useAppStore } from "@/store/useAppStore";

export default function AddTextPage() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [pageCount, setPageCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
    const [selectedBox, setSelectedBox] = useState<string | null>(null);
    const [result, setResult] = useState<Blob | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const toast = useToast();
    const { addActivity, incrementProcessed } = useAppStore();

    // Text editor state
    const [editText, setEditText] = useState("");
    const [editFontSize, setEditFontSize] = useState(16);
    const [editFontFamily, setEditFontFamily] = useState<TextBox["fontFamily"]>("Helvetica");
    const [editColor, setEditColor] = useState("#000000");
    const [editAlign, setEditAlign] = useState<TextBox["align"]>("left");
    const [editRotation, setEditRotation] = useState<TextBox["rotation"]>(0);

    const handleFilesChange = useCallback(
        async (newFiles: FileWithPreview[]) => {
            setFiles(newFiles);
            setResult(null);
            setTextBoxes([]);
            setSelectedBox(null);
            setCurrentPage(0);

            if (newFiles.length > 0) {
                const response = await generatePagePreviews(newFiles[0].file);
                if (response.success && response.pageCount) {
                    setPageCount(response.pageCount);
                } else {
                    toast.error(response.error || "Failed to load PDF");
                }
            }
        },
        [toast]
    );

    const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;

        const newTextBox: TextBox = {
            id: Math.random().toString(36).substring(2, 9),
            text: editText || "New Text",
            x,
            y,
            page: currentPage,
            fontSize: editFontSize,
            fontFamily: editFontFamily,
            color: editColor,
            rotation: editRotation,
            align: editAlign,
        };

        setTextBoxes((prev) => [...prev, newTextBox]);
        setSelectedBox(newTextBox.id);
        toast.success("Text box added! Click 'Apply' when ready.");
    };

    const handleDeleteBox = (id: string) => {
        setTextBoxes((prev) => prev.filter((box) => box.id !== id));
        if (selectedBox === id) {
            setSelectedBox(null);
        }
        toast.success("Text box removed");
    };

    const handleUpdateBox = () => {
        if (!selectedBox) return;

        setTextBoxes((prev) =>
            prev.map((box) =>
                box.id === selectedBox
                    ? {
                        ...box,
                        text: editText,
                        fontSize: editFontSize,
                        fontFamily: editFontFamily,
                        color: editColor,
                        align: editAlign,
                        rotation: editRotation,
                    }
                    : box
            )
        );
        toast.success("Text box updated");
    };

    const handleApply = async () => {
        if (files.length === 0) {
            toast.warning("Please upload a PDF file");
            return;
        }

        if (textBoxes.length === 0) {
            toast.warning("Please add at least one text box");
            return;
        }

        setIsProcessing(true);

        try {
            const response = await addTextToPDF(files[0].file, textBoxes);

            if (response.success && response.data) {
                const blob = createPdfBlob(response.data);
                setResult(blob);
                toast.success("Text added successfully!");
                addActivity({
                    toolName: "Add Text to PDF",
                    fileName: files[0].name,
                });
                incrementProcessed();
            } else {
                toast.error(response.error || "Failed to add text to PDF");
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (result) {
            downloadBlob(result, "text-added.pdf");
            toast.success("PDF downloaded successfully!");
        }
    };

    const handleReset = () => {
        setFiles([]);
        setResult(null);
        setTextBoxes([]);
        setSelectedBox(null);
        setCurrentPage(0);
        setPageCount(0);
    };

    // Get current page text boxes
    const currentPageTextBoxes = textBoxes.filter((box) => box.page === currentPage);

    return (
        <ToolLayout
            title="Add Text to PDF"
            description="Insert text boxes anywhere on your PDF"
            icon={Type}
            color="from-blue-500 to-blue-600"
        >
            <div className="space-y-6">
                {/* File Upload */}
                {!result && (
                    <FileUploader
                        accept={{ "application/pdf": [".pdf"] }}
                        maxFiles={1}
                        files={files}
                        onFilesChange={handleFilesChange}
                    />
                )}

                {/* Main Editor */}
                {files.length > 0 && !result && (
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Left: PDF Preview Canvas */}
                        <div className="lg:col-span-2 space-y-4">
                            {/* Page Navigator */}
                            {pageCount > 1 && (
                                <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-800 rounded-xl">
                                    <Button
                                        onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                                        disabled={currentPage === 0}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Previous
                                    </Button>
                                    <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                                        Page {currentPage + 1} of {pageCount}
                                    </span>
                                    <Button
                                        onClick={() =>
                                            setCurrentPage((p) => Math.min(pageCount - 1, p + 1))
                                        }
                                        disabled={currentPage === pageCount - 1}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}

                            {/* Canvas Area */}
                            <div className="relative">
                                <div
                                    ref={canvasRef}
                                    onClick={handleCanvasClick}
                                    className="relative w-full bg-white dark:bg-surface-700 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl cursor-crosshair overflow-hidden"
                                >
                                    {/* PDF Page Rendering */}
                                    <PDFPageRenderer
                                        file={files[0].file}
                                        pageNumber={currentPage + 1}
                                        className="pointer-events-none"
                                    />

                                    {/* Text Boxes Preview */}
                                    {currentPageTextBoxes.map((box) => (
                                        <div
                                            key={box.id}
                                            style={{
                                                position: "absolute",
                                                left: `${box.x}%`,
                                                top: `${box.y}%`,
                                                fontSize: `${box.fontSize}px`,
                                                fontFamily: box.fontFamily,
                                                color: box.color,
                                                transform: `rotate(${box.rotation}deg)`,
                                                textAlign: box.align,
                                                cursor: "pointer",
                                                border:
                                                    selectedBox === box.id
                                                        ? "2px dashed #3b82f6"
                                                        : "1px solid transparent",
                                                padding: "4px",
                                                whiteSpace: "nowrap",
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedBox(box.id);
                                                setEditText(box.text);
                                                setEditFontSize(box.fontSize);
                                                setEditFontFamily(box.fontFamily);
                                                setEditColor(box.color);
                                                setEditAlign(box.align);
                                                setEditRotation(box.rotation);
                                            }}
                                        >
                                            {box.text}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right: Text Editor Panel */}
                        <div className="space-y-6">
                            {/* Text Content */}
                            <div>
                                <label
                                    htmlFor="text"
                                    className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                                >
                                    Text Content
                                </label>
                                <textarea
                                    id="text"
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Enter text..."
                                    rows={3}
                                />
                            </div>

                            {/* Font Family */}
                            <div>
                                <label
                                    htmlFor="font"
                                    className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                                >
                                    Font Family
                                </label>
                                <select
                                    id="font"
                                    value={editFontFamily}
                                    onChange={(e) =>
                                        setEditFontFamily(e.target.value as TextBox["fontFamily"])
                                    }
                                    className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="Helvetica">Helvetica</option>
                                    <option value="Times-Roman">Times Roman</option>
                                    <option value="Courier">Courier</option>
                                </select>
                            </div>

                            {/* Font Size */}
                            <div>
                                <label
                                    htmlFor="fontSize"
                                    className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                                >
                                    Font Size: {editFontSize}px
                                </label>
                                <input
                                    type="range"
                                    id="fontSize"
                                    min="8"
                                    max="72"
                                    value={editFontSize}
                                    onChange={(e) => setEditFontSize(Number(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            {/* Color */}
                            <div>
                                <label
                                    htmlFor="color"
                                    className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                                >
                                    Text Color
                                </label>
                                <div className="flex gap-3">
                                    <input
                                        type="color"
                                        id="color"
                                        value={editColor}
                                        onChange={(e) => setEditColor(e.target.value)}
                                        className="w-16 h-12 rounded-lg cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={editColor}
                                        onChange={(e) => setEditColor(e.target.value)}
                                        className="flex-1 px-4 py-3 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="#000000"
                                    />
                                </div>
                            </div>

                            {/* Alignment */}
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                    Text Alignment
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(["left", "center", "right"] as const).map((align) => (
                                        <button
                                            key={align}
                                            onClick={() => setEditAlign(align)}
                                            className={`px-4 py-2 rounded-lg border transition-colors ${editAlign === align
                                                ? "bg-primary-500 text-white border-primary-500"
                                                : "bg-surface-50 dark:bg-surface-700 border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-300"
                                                }`}
                                        >
                                            {align.charAt(0).toUpperCase() + align.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Rotation */}
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                    Rotation
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {([0, 90, 180, 270] as const).map((rotation) => (
                                        <button
                                            key={rotation}
                                            onClick={() => setEditRotation(rotation)}
                                            className={`px-4 py-2 rounded-lg border transition-colors ${editRotation === rotation
                                                ? "bg-primary-500 text-white border-primary-500"
                                                : "bg-surface-50 dark:bg-surface-700 border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-300"
                                                }`}
                                        >
                                            {rotation}°
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Update Button */}
                            {selectedBox && (
                                <Button
                                    onClick={handleUpdateBox}
                                    variant="outline"
                                    className="w-full"
                                >
                                    Update Selected Text
                                </Button>
                            )}

                            {/* Text Boxes List */}
                            {textBoxes.length > 0 && (
                                <div className="border-t border-surface-200 dark:border-surface-700 pt-6">
                                    <h3 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
                                        Text Boxes ({textBoxes.length})
                                    </h3>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {textBoxes.map((box) => (
                                            <div
                                                key={box.id}
                                                className={`flex items-center justify-between p-3 rounded-lg border ${selectedBox === box.id
                                                    ? "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800"
                                                    : "bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700"
                                                    }`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
                                                        {box.text}
                                                    </p>
                                                    <p className="text-xs text-surface-500 dark:text-surface-400">
                                                        Page {box.page + 1} • {box.fontSize}px
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteBox(box.id)}
                                                    className="ml-2 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Apply Button */}
                            <Button
                                onClick={handleApply}
                                disabled={isProcessing || textBoxes.length === 0}
                                size="lg"
                                className="w-full"
                            >
                                {isProcessing ? "Processing..." : "Apply Text to PDF"}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Success State */}
                {result && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-6"
                    >
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                            <Type className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
                                Text Added Successfully!
                            </h3>
                            <p className="text-surface-600 dark:text-surface-400">
                                Your PDF has been updated with {textBoxes.length} text box
                                {textBoxes.length !== 1 ? "es" : ""}.
                            </p>
                        </div>
                        <div className="flex gap-4 justify-center">
                            <DownloadButton
                                onClick={handleDownload}
                                filename="text-added.pdf"
                                isReady={true}
                            />
                            <Button onClick={handleReset} variant="outline" size="lg">
                                Add Text to Another PDF
                            </Button>
                        </div>
                    </motion.div>
                )}
            </div>
        </ToolLayout>
    );
}
