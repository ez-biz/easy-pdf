"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, useDragControls } from "framer-motion";
import { Type, Trash2, Bold, Italic, Underline } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { PDFPageRenderer } from "@/components/tools/PDFPageRenderer";
import { Button } from "@/components/ui/Button";
import { FileWithPreview } from "@/types/tools";
import { addTextToPDF, generatePagePreviews, type TextBox } from "@/lib/pdf/addText";
import { downloadBlob, createPdfBlob } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import { useAppStore } from "@/store/useAppStore";

// Draggable Text Box Component
interface DraggableTextBoxProps {
    box: TextBox;
    isSelected: boolean;
    containerRef: React.RefObject<HTMLDivElement | null>;
    onSelect: () => void;
    onUpdate: (id: string, updates: Partial<TextBox>) => void;
    onDelete: (id: string) => void;
}

function DraggableTextBox({
    box,
    isSelected,
    containerRef,
    onSelect,
    onUpdate,
    onDelete,
}: DraggableTextBoxProps) {
    const controls = useDragControls();

    return (
        <motion.div
            drag
            dragControls={controls}
            dragListener={false}
            dragMomentum={false}
            dragConstraints={containerRef}
            onDragEnd={(_, info) => {
                if (!containerRef.current) return;
                const rect = containerRef.current.getBoundingClientRect();

                // Calculate new position as percentage
                // box.x/y are percentages. info.offset is pixel delta.
                const deltaXPercent = (info.offset.x / rect.width) * 100;
                const deltaYPercent = (info.offset.y / rect.height) * 100;

                onUpdate(box.id, {
                    x: Math.max(0, Math.min(100, box.x + deltaXPercent)),
                    y: Math.max(0, Math.min(100, box.y + deltaYPercent)),
                });
            }}
            style={{
                position: "absolute",
                left: `${box.x}%`,
                top: `${box.y}%`,
                touchAction: "none",
            }}
            className="absolute"
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
        >
            <div
                className={`relative group ${isSelected
                    ? "ring-2 ring-primary-500 ring-offset-2 ring-offset-white dark:ring-offset-surface-800"
                    : "hover:ring-1 hover:ring-primary-300"
                    } rounded p-1 cursor-move transition-shadow`}
                onPointerDown={(e) => {
                    controls.start(e);
                }}
            >
                {/* Text Display */}
                <div
                    style={{
                        fontWeight: box.isBold ? "bold" : "normal",
                        fontStyle: box.isItalic ? "italic" : "normal",
                        textDecoration: box.isUnderline ? "underline" : "none",
                        fontSize: `${box.fontSize}px`,
                        fontFamily: box.fontFamily,
                        color: box.color,
                        transform: `rotate(${box.rotation}deg)`,
                        textAlign: box.align,
                        whiteSpace: "nowrap",
                        userSelect: "none",
                    }}
                >
                    {box.text}
                </div>

                {/* Controls (visible when selected) */}
                {isSelected && (
                    <>
                        {/* Delete Button (Top Right) */}
                        <div
                            className="absolute -top-3 -right-3 p-1 bg-red-500 text-white rounded-full cursor-pointer shadow-sm hover:bg-red-600"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(box.id);
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            <Trash2 className="w-3 h-3" />
                        </div>

                        {/* Resize Handle (Bottom Right) */}
                        <div
                            className="absolute -bottom-2 -right-2 w-4 h-4 bg-primary-500 border-2 border-white rounded-full cursor-se-resize shadow-sm"
                            onPointerDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const startY = e.clientY;
                                const startSize = box.fontSize;

                                const handlePointerMove = (moveEvent: PointerEvent) => {
                                    const delta = moveEvent.clientY - startY;
                                    // Dragging down (increasing Y) increases size
                                    // Dragging up (decreasing Y) decreases size
                                    const newSize = Math.max(8, Math.min(72, startSize + delta));
                                    onUpdate(box.id, { fontSize: newSize });
                                };

                                const handlePointerUp = () => {
                                    window.removeEventListener("pointermove", handlePointerMove);
                                    window.removeEventListener("pointerup", handlePointerUp);
                                };

                                window.addEventListener("pointermove", handlePointerMove);
                                window.addEventListener("pointerup", handlePointerUp);
                            }}
                        />
                    </>
                )}
            </div>
        </motion.div>
    );
}

export default function AddTextPage() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [pageCount, setPageCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
    const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
    const [result, setResult] = useState<Blob | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const toast = useToast();
    const { addActivity, incrementProcessed } = useAppStore();

    // Editor state
    const [editorState, setEditorState] = useState({
        text: "",
        fontSize: 16,
        fontFamily: "Helvetica" as TextBox["fontFamily"],
        color: "#000000",
        align: "left" as TextBox["align"],
        rotation: 0 as 0 | 90 | 180 | 270,
        isBold: false,
        isItalic: false,
        isUnderline: false,
    });

    // Update editor when selection changes
    useEffect(() => {
        if (selectedBoxId) {
            const box = textBoxes.find((b) => b.id === selectedBoxId);
            if (box) {
                setEditorState({
                    text: box.text,
                    fontSize: box.fontSize,
                    fontFamily: box.fontFamily,
                    color: box.color,
                    align: box.align,
                    rotation: box.rotation,
                    isBold: box.isBold || false,
                    isItalic: box.isItalic || false,
                    isUnderline: box.isUnderline || false,
                });
            }
        }
    }, [selectedBoxId, textBoxes]);

    const handleFilesChange = useCallback(
        async (newFiles: FileWithPreview[]) => {
            setFiles(newFiles);
            setResult(null);
            setTextBoxes([]);
            setSelectedBoxId(null);
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
        if (!canvasRef.current || selectedBoxId) {
            // If something is selected, deselect it on background click
            setSelectedBoxId(null);
            return;
        }

        const rect = canvasRef.current.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;

        const newTextBox: TextBox = {
            id: Math.random().toString(36).substring(2, 9),
            text: "New Text",
            x,
            y,
            page: currentPage,
            fontSize: 16,
            fontFamily: "Helvetica",
            color: "#000000",
            rotation: 0,
            align: "left",
            isBold: false,
            isItalic: false,
            isUnderline: false,
        };

        setTextBoxes((prev) => [...prev, newTextBox]);
        setSelectedBoxId(newTextBox.id);
        toast.success("Text box added");
    };

    const updateBox = (id: string, updates: Partial<TextBox>) => {
        setTextBoxes((prev) =>
            prev.map((box) => (box.id === id ? { ...box, ...updates } : box))
        );
    };

    // Live update from editor
    const handleEditorChange = (updates: Partial<typeof editorState>) => {
        setEditorState((prev) => ({ ...prev, ...updates }));
        if (selectedBoxId) {
            updateBox(selectedBoxId, updates);
        }
    };

    const handleDeleteBox = (id: string) => {
        setTextBoxes((prev) => prev.filter((box) => box.id !== id));
        if (selectedBoxId === id) setSelectedBoxId(null);
    };

    const handleApply = async () => {
        if (files.length === 0 || textBoxes.length === 0) return;
        setIsProcessing(true);
        try {
            const response = await addTextToPDF(files[0].file, textBoxes);
            if (response.success && response.data) {
                setResult(createPdfBlob(response.data));
                toast.success("PDF updated successfully!");
                addActivity({ toolName: "Add Text to PDF", fileName: files[0].name });
                incrementProcessed();
            } else {
                toast.error(response.error || "Failed");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setIsProcessing(false);
        }
    };

    const currentPageTextBoxes = textBoxes.filter((box) => box.page === currentPage);

    return (
        <ToolLayout
            title="Add Text to PDF"
            description="Insert, position, and customize text on your PDF"
            icon={Type}
            color="from-blue-500 to-blue-600"
        >
            <div className="space-y-6">
                {!result && (
                    <FileUploader
                        accept={{ "application/pdf": [".pdf"] }}
                        maxFiles={1}
                        files={files}
                        onFilesChange={handleFilesChange}
                    />
                )}

                {files.length > 0 && !result && (
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Canvas Area */}
                        <div className="lg:col-span-2 space-y-4">
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
                                    <span className="text-sm font-medium">
                                        Page {currentPage + 1} of {pageCount}
                                    </span>
                                    <Button
                                        onClick={() => setCurrentPage((p) => Math.min(pageCount - 1, p + 1))}
                                        disabled={currentPage === pageCount - 1}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}

                            <div className="relative">
                                <div
                                    ref={canvasRef}
                                    onClick={handleCanvasClick}
                                    className="relative w-full bg-white dark:bg-surface-700 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl overflow-hidden touch-none"
                                >
                                    <PDFPageRenderer
                                        file={files[0].file}
                                        pageNumber={currentPage + 1}
                                        className="pointer-events-none select-none"
                                    />

                                    {currentPageTextBoxes.map((box) => (
                                        <DraggableTextBox
                                            key={`${box.id}-${box.x.toFixed(2)}-${box.y.toFixed(2)}`}
                                            box={box}
                                            isSelected={selectedBoxId === box.id}
                                            containerRef={canvasRef}
                                            onSelect={() => setSelectedBoxId(box.id)}
                                            onUpdate={updateBox}
                                            onDelete={handleDeleteBox}
                                        />
                                    ))}

                                    {currentPageTextBoxes.length === 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <p className="text-surface-400 font-medium">
                                                Click anywhere to add text
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Editor Panel */}
                        <div className="space-y-6">
                            <div className="bg-surface-50 dark:bg-surface-800 p-6 rounded-xl space-y-6">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <Type className="w-5 h-5" />
                                    Text Properties
                                </h3>

                                {/* Text Content */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Content</label>
                                    <textarea
                                        value={editorState.text}
                                        onChange={(e) => handleEditorChange({ text: e.target.value })}
                                        disabled={!selectedBoxId}
                                        className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-surface-700 dark:border-surface-600 disabled:opacity-50"
                                        rows={3}
                                        placeholder={selectedBoxId ? "Type text..." : "Select a text box"}
                                    />
                                </div>

                                {/* Font Settings */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Font</label>
                                        <select
                                            value={editorState.fontFamily}
                                            onChange={(e) => handleEditorChange({ fontFamily: e.target.value as TextBox["fontFamily"] })}
                                            disabled={!selectedBoxId}
                                            className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-surface-700 dark:border-surface-600 disabled:opacity-50"
                                        >
                                            <option value="Helvetica">Helvetica</option>
                                            <option value="Times-Roman">Times</option>
                                            <option value="Courier">Courier</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Size</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={editorState.fontSize}
                                                onChange={(e) => handleEditorChange({ fontSize: Number(e.target.value) })}
                                                disabled={!selectedBoxId}
                                                className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-surface-700 dark:border-surface-600 disabled:opacity-50"
                                            />
                                            <span className="text-sm text-surface-500">px</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Style</label>
                                        <div className="flex rounded-lg border bg-white dark:bg-surface-700 overflow-hidden divide-x dark:divide-surface-600">
                                            <button
                                                onClick={() => handleEditorChange({ isBold: !editorState.isBold })}
                                                disabled={!selectedBoxId}
                                                className={`flex-1 py-2 flex items-center justify-center transition-colors ${editorState.isBold
                                                    ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                                                    : "hover:bg-surface-100 dark:hover:bg-surface-600"
                                                    }`}
                                            >
                                                <Bold className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleEditorChange({ isItalic: !editorState.isItalic })}
                                                disabled={!selectedBoxId}
                                                className={`flex-1 py-2 flex items-center justify-center transition-colors ${editorState.isItalic
                                                    ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                                                    : "hover:bg-surface-100 dark:hover:bg-surface-600"
                                                    }`}
                                            >
                                                <Italic className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleEditorChange({ isUnderline: !editorState.isUnderline })}
                                                disabled={!selectedBoxId}
                                                className={`flex-1 py-2 flex items-center justify-center transition-colors ${editorState.isUnderline
                                                    ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                                                    : "hover:bg-surface-100 dark:hover:bg-surface-600"
                                                    }`}
                                            >
                                                <Underline className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Color & Align */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Color</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={editorState.color}
                                                onChange={(e) => handleEditorChange({ color: e.target.value })}
                                                disabled={!selectedBoxId}
                                                className="w-8 h-8 rounded cursor-pointer disabled:opacity-50"
                                            />
                                            <span className="text-sm font-mono">{editorState.color}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Align</label>
                                        <div className="flex rounded-lg border bg-white dark:bg-surface-700 overflow-hidden">
                                            {(["left", "center", "right"] as const).map((align) => (
                                                <button
                                                    key={align}
                                                    onClick={() => handleEditorChange({ align })}
                                                    disabled={!selectedBoxId}
                                                    className={`flex-1 py-2 text-xs font-medium transition-colors ${editorState.align === align
                                                        ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                                                        : "hover:bg-surface-100 dark:hover:bg-surface-600"
                                                        }`}
                                                >
                                                    {align.charAt(0).toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <p className="text-xs text-surface-500">
                                    Tip: Drag text to move. Drag corner handle to resize.
                                </p>
                            </div>

                            <Button
                                onClick={handleApply}
                                disabled={isProcessing || textBoxes.length === 0}
                                size="lg"
                                className="w-full"
                            >
                                {isProcessing ? "Processing..." : "Download Updated PDF"}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Success Screen */}
                {result && (
                    <div className="text-center space-y-6">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                            <Type className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-semibold">Success!</h3>
                        <div className="flex justify-center gap-4">
                            <DownloadButton onClick={() => downloadBlob(result, "text-added.pdf")} filename="text-added.pdf" isReady={true} />
                            <Button onClick={() => { setResult(null); setTextBoxes([]); }} variant="outline">Start Over</Button>
                        </div>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
