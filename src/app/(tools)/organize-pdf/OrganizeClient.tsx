"use client";

import { useState } from "react";
import { LayoutGrid, RotateCw, Trash2, FileOutput } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { Button } from "@/components/ui/Button";
import { FileWithPreview } from "@/types/tools";
import { organizePDF, PageOperation } from "@/lib/pdf/organize";
import { useToast } from "@/contexts/ToastContext";
import { useAppStore } from "@/store/useAppStore";
import { PDFPageRenderer } from "@/components/tools/PDFPageRenderer";

// dnd-kit imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PageItem {
    id: string; // Unique ID
    originalIndex: number; // 0-indexed
    rotation: number; // 0, 90, 180, 270
}

// === Sortable Item Component ===
function SortablePageItem({
    page,
    file,
    onRotate,
    onDelete
}: {
    page: PageItem;
    file: File | undefined;
    onRotate: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: page.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : "auto",
    };

    const isRotatedSideways = page.rotation === 90 || page.rotation === 270;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group relative bg-white dark:bg-surface-800 rounded-lg shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden select-none touch-none"
        >
            {/* Drag Handle Area */}
            <div
                {...attributes}
                {...listeners}
                className="relative aspect-[3/4] bg-surface-100 dark:bg-surface-900 p-2 cursor-grab active:cursor-grabbing flex items-center justify-center"
            >
                <div
                    className={`transition-transform duration-300 ease-in-out origin-center ${isRotatedSideways ? 'scale-75' : 'scale-100'}`}
                    style={{
                        transform: `rotate(${page.rotation}deg)`,
                        width: '100%',
                        height: '100%'
                    }}
                >
                    {file && (
                        <div className="w-full h-full flex items-center justify-center">
                            <PDFPageRenderer
                                file={file}
                                pageNumber={page.originalIndex + 1}
                                scale={0.3}
                                className="shadow-sm"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Page Number Badge */}
            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm z-10 pointer-events-none">
                Page {page.originalIndex + 1}
            </div>

            {/* Actions (Separate form drag handle to remain clickable) */}
            <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-center gap-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent drag start
                        onRotate(page.id);
                    }}
                    className="p-1.5 bg-white text-surface-900 rounded-full hover:bg-blue-50 hover:text-blue-600 shadow-lg"
                    title="Rotate 90°"
                    onPointerDown={(e) => e.stopPropagation()} // Stop dnd-kit drag
                >
                    <RotateCw className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(page.id);
                    }}
                    className="p-1.5 bg-white text-surface-900 rounded-full hover:bg-red-50 hover:text-red-600 shadow-lg"
                    title="Remove Page"
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

// === Main Page Component ===
export default function OrganizeClient() {
    const [file, setFile] = useState<FileWithPreview | null>(null);
    const [pages, setPages] = useState<PageItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null); // For DragOverlay

    const toast = useToast();
    const { addActivity, incrementProcessed } = useAppStore();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleFilesSelected = async (newFiles: FileWithPreview[]) => {
        const selectedFile = newFiles[0];
        setFile(selectedFile);
        setDownloadUrl(null);

        try {
            const buffer = await selectedFile.file.arrayBuffer();
            const { PDFDocument } = await import("@cantoo/pdf-lib");
            const doc = await PDFDocument.load(buffer);
            const count = doc.getPageCount();

            // Initialize pages
            const newPages: PageItem[] = Array.from({ length: count }, (_, i) => ({
                id: `page-${i}`, // Simple ID for now
                originalIndex: i,
                rotation: 0
            }));
            setPages(newPages);
        } catch (e) {
            console.error("Failed to load PDF", e);
            toast.error("Failed to load PDF pages");
        }
    };

    const handleRotate = (id: string) => {
        setPages(prev => prev.map(p => {
            if (p.id === id) {
                return { ...p, rotation: (p.rotation + 90) % 360 };
            }
            return p;
        }));
    };

    const handleDelete = (id: string) => {
        setPages(prev => prev.filter(p => p.id !== id));
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            setPages((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleOrganize = async () => {
        if (!file || pages.length === 0) return;

        setIsProcessing(true);
        try {
            const instructions: PageOperation[] = pages.map(p => ({
                originalIndex: p.originalIndex,
                rotation: p.rotation
            }));

            const result = await organizePDF(file.file, instructions);

            if (result.success && result.data) {
                const blob = new Blob([result.data as BlobPart], { type: "application/pdf" });
                const url = URL.createObjectURL(blob);
                setDownloadUrl(url);
                toast.success("PDF organized successfully!");
                addActivity({ toolName: "Organize PDF", fileName: file.name });
                incrementProcessed();
            } else {
                toast.error(result.error || "Failed to organize PDF");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleStartOver = () => {
        setFile(null);
        setPages([]);
        setDownloadUrl(null);
        setActiveId(null);
    };

    const activePage = activeId ? pages.find(p => p.id === activeId) : null;

    return (
        <ToolLayout
            title="Organize PDF"
            description="Reorder, rotate, and remove pages"
            icon={LayoutGrid}
            color="from-indigo-500 to-indigo-600"
        >
            <div className="space-y-8">
                {/* Upload Section */}
                {!file && (
                    <FileUploader
                        files={[]}
                        onFilesChange={handleFilesSelected}
                        accept={{ "application/pdf": [".pdf"] }}
                        maxSize={50 * 1024 * 1024} // 50MB
                        maxFiles={1}
                    />
                )}

                {/* Organizer Interface */}
                {file && !downloadUrl && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-surface-50 dark:bg-surface-800/50 p-4 rounded-xl border border-surface-200 dark:border-surface-700">
                            <div>
                                <h3 className="font-medium">{file.name}</h3>
                                <p className="text-sm text-surface-500">{pages.length} pages remaining</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handleStartOver}>
                                    Cancel
                                </Button>
                                <Button onClick={handleOrganize} disabled={isProcessing || pages.length === 0}>
                                    {isProcessing ? "Processing..." : "Save PDF"}
                                </Button>
                            </div>
                        </div>

                        {/* Draggable Grid */}
                        <div className="bg-surface-100 dark:bg-surface-900/50 p-6 rounded-xl border border-surface-200 dark:border-surface-700 min-h-[400px]">
                            {pages.length === 0 ? (
                                <div className="text-center py-20 text-surface-400">
                                    All pages removed. Reverting to empty...
                                </div>
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={pages.map(p => p.id)}
                                        strategy={rectSortingStrategy}
                                    >
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {pages.map((page) => (
                                                <SortablePageItem
                                                    key={page.id}
                                                    page={page}
                                                    file={file.file}
                                                    onRotate={handleRotate}
                                                    onDelete={handleDelete}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>

                                    <DragOverlay>
                                        {activePage ? (
                                            <div className="opacity-80 scale-105 cursor-grabbing">
                                                <div className="relative aspect-[3/4] bg-surface-100 dark:bg-surface-900 p-2 rounded-lg border border-primary-500 shadow-xl flex items-center justify-center">
                                                    <div
                                                        className={`transition-transform duration-300 ease-in-out origin-center ${(activePage.rotation === 90 || activePage.rotation === 270) ? 'scale-75' : 'scale-100'}`}
                                                        style={{
                                                            transform: `rotate(${activePage.rotation}deg)`,
                                                            width: '100%',
                                                            height: '100%'
                                                        }}
                                                    >
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <PDFPageRenderer
                                                                file={file.file}
                                                                pageNumber={activePage.originalIndex + 1}
                                                                scale={0.3}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : null}
                                    </DragOverlay>
                                </DndContext>
                            )}
                        </div>
                    </div>
                )}

                {/* Success Screen (Reuse from before, standard) */}
                {downloadUrl && (
                    <div className="text-center space-y-6">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                            <FileOutput className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-semibold">Ready to Download!</h3>
                        <p className="text-surface-600 dark:text-surface-400 max-w-md mx-auto">
                            Your PDF has been reorganized successfully.
                        </p>
                        <div className="flex justify-center gap-4">
                            <DownloadButton
                                isReady={true}
                                filename={`organized-${file?.name || 'document'}`}
                                onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = downloadUrl;
                                    a.download = `organized-${file?.name || 'document.pdf'}`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                }}
                            />
                            <Button onClick={handleStartOver} variant="outline">Start Over</Button>
                        </div>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
