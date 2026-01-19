"use client";

import { useState, useRef, useCallback } from "react";
import { PenTool, Upload, Trash2 } from "lucide-react"; // PenTool icon for Sign
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { PDFPageRenderer } from "@/components/tools/PDFPageRenderer";
import { Button } from "@/components/ui/Button";
import { FileWithPreview } from "@/types/tools";
import { addImagesToPDF, ImageOverlay } from "@/lib/pdf/addImage";
import { useToast } from "@/contexts/ToastContext";
import { useAppStore } from "@/store/useAppStore";
import { DraggableImageBox } from "@/components/tools/DraggableImageBox";
import { SignaturePad } from "@/components/tools/SignaturePad";

export default function SignPdfPage() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [numPages, setNumPages] = useState(0);
    const [overlays, setOverlays] = useState<ImageOverlay[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [showSignaturePad, setShowSignaturePad] = useState(false);

    // Store image URLs for preview mapping
    const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
    // Store aspect ratios
    const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});

    const canvasRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null); // For uploading signature image
    const toast = useToast();
    const { addActivity, incrementProcessed } = useAppStore();

    const handleFilesSelected = async (newFiles: FileWithPreview[]) => {
        setFiles(newFiles);
        setDownloadUrl(null);
        setOverlays([]);
        // Reset image urls/blobs
        Object.values(imageUrls).forEach(url => URL.revokeObjectURL(url));
        setImageUrls({});
        setAspectRatios({});

        try {
            const buffer = await newFiles[0].file.arrayBuffer();
            const { PDFDocument } = await import("pdf-lib");
            const doc = await PDFDocument.load(buffer);
            setNumPages(doc.getPageCount());
        } catch (e) {
            console.error("Failed to load PDF", e);
        }
    };

    // Helper to add a signature/image to the current page
    const addSignatureToPage = async (blob: Blob, name: string) => {
        const objectUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
            const ratio = img.width / img.height;
            const id = Math.random().toString(36).substring(7);

            // Initial size: 20% width
            const initialWidthPct = 20;

            // We need container aspect ratio to calculate initial height %
            let initialHeightPct = 20;
            const container = canvasRef.current;

            if (container) {
                const rect = container.getBoundingClientRect();
                const containerRatio = rect.width / rect.height;
                initialHeightPct = initialWidthPct * (containerRatio / ratio);
            }

            // Create a file object from blob for the API
            const file = new File([blob], name, { type: blob.type });

            setOverlays(prev => [...prev, {
                id,
                file: file,
                x: 30, // Center-ish
                y: 30,
                width: initialWidthPct,
                height: initialHeightPct,
                page: currentPage - 1,
                rotation: 0
            }]);

            setImageUrls(prev => ({ ...prev, [id]: objectUrl }));
            setAspectRatios(prev => ({ ...prev, [id]: ratio }));
            setSelectedId(id);
        };
        img.src = objectUrl;
    };

    const handleSignatureSave = async (dataUrl: string) => {
        setShowSignaturePad(false);
        // Convert base64 to blob
        try {
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            await addSignatureToPage(blob, "signature.png");
        } catch (e) {
            console.error("Failed to process signature", e);
            toast.error("Failed to add signature");
        }
    };

    const handleUploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            addSignatureToPage(file, file.name);
            e.target.value = ""; // Reset
        }
    };

    const handleUpdateOverlay = (id: string, updates: Partial<ImageOverlay>) => {
        setOverlays(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
    };

    const handleDeleteOverlay = (id: string) => {
        setOverlays(prev => prev.filter(o => o.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const handlePageRendered = useCallback(() => { }, []);

    const handleDownload = async () => {
        if (!files.length) return;

        setIsProcessing(true);
        try {
            const result = await addImagesToPDF(files[0].file, overlays);
            if (result.success && result.data) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const blob = new Blob([result.data as any], { type: "application/pdf" });
                const url = URL.createObjectURL(blob);
                setDownloadUrl(url);
                toast.success("PDF signed successfully!");
                addActivity({ toolName: "Sign PDF", fileName: files[0].name });
                incrementProcessed();
            } else {
                toast.error(result.error || "Failed to sign PDF");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleStartOver = () => {
        setFiles([]);
        setDownloadUrl(null);
        setOverlays([]);
        setImageUrls({});
        setAspectRatios({});
        setSelectedId(null);
    };

    return (
        <ToolLayout
            title="Sign PDF"
            description="Add your signature to PDF documents"
            icon={PenTool}
            color="from-violet-500 to-violet-600"
        >
            <div className="space-y-6">
                {!downloadUrl && (
                    <FileUploader
                        files={files}
                        onFilesChange={handleFilesSelected}
                        accept={{ "application/pdf": [".pdf"] }}
                        maxSize={10 * 1024 * 1024}
                        maxFiles={1}
                    />
                )}

                {files.length > 0 && !downloadUrl && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Main Canvas Area */}
                        <div className="lg:col-span-3 space-y-4">
                            {/* Toolbar */}
                            <div className="flex items-center justify-between bg-surface-50 dark:bg-surface-800/50 p-2 rounded-lg border border-surface-200 dark:border-surface-700">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage <= 1}
                                    >
                                        Previous
                                    </Button>
                                    <span className="text-sm font-medium px-2">
                                        Page {currentPage} of {numPages || "--"}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                                        disabled={currentPage >= numPages}
                                    >
                                        Next
                                    </Button>
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/png, image/jpeg"
                                        onChange={handleUploadSignature}
                                    />
                                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                        <Upload className="w-4 h-4 mr-2" /> Upload Image
                                    </Button>
                                    <Button onClick={() => setShowSignaturePad(true)} size="sm" className="gap-2">
                                        <PenTool className="w-4 h-4" /> Add Signature
                                    </Button>
                                </div>
                            </div>

                            {/* Canvas */}
                            <div
                                ref={canvasRef}
                                className="relative border rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-inner min-h-[500px]"
                                onClick={() => setSelectedId(null)}
                            >
                                <PDFPageRenderer
                                    file={files[0].file}
                                    pageNumber={currentPage}
                                    className="w-full"
                                    onPageRendered={handlePageRendered}
                                />

                                {/* Overlays for current page */}
                                {overlays
                                    .filter(o => o.page === currentPage - 1)
                                    .map(overlay => (
                                        <DraggableImageBox
                                            key={overlay.id}
                                            overlay={overlay}
                                            containerRef={canvasRef}
                                            isSelected={selectedId === overlay.id}
                                            onSelect={() => setSelectedId(overlay.id)}
                                            onUpdate={handleUpdateOverlay}
                                            onDelete={handleDeleteOverlay}
                                            imageUrl={imageUrls[overlay.id]}
                                            aspectRatio={aspectRatios[overlay.id]}
                                        />
                                    ))
                                }
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Signatures List */}
                            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-4">
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <PenTool className="w-4 h-4" /> Signatures
                                </h3>

                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {overlays.length === 0 ? (
                                        <p className="text-sm text-surface-500 italic">No signatures added yet.</p>
                                    ) : (
                                        overlays.map((overlay, i) => (
                                            <div
                                                key={overlay.id}
                                                className={`flex items-center gap-2 p-2 rounded text-sm cursor-pointer border ${selectedId === overlay.id
                                                    ? "bg-primary-50 border-primary-200 dark:bg-primary-900/20 dark:border-primary-800"
                                                    : "hover:bg-surface-50 dark:hover:bg-surface-700 border-transparent"
                                                    }`}
                                                onClick={() => {
                                                    setCurrentPage(overlay.page + 1);
                                                    setSelectedId(overlay.id);
                                                }}
                                            >
                                                <div className="w-12 h-8 rounded overflow-hidden bg-white border flex-shrink-0 flex items-center justify-center">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={imageUrls[overlay.id]} className="max-w-full max-h-full object-contain" alt="" />
                                                </div>
                                                <div className="flex-1 truncate">
                                                    Signature (Page {overlay.page + 1})
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteOverlay(overlay.id);
                                                    }}
                                                    className="text-surface-400 hover:text-red-500"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Download Action */}
                            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-4">
                                <Button
                                    className="w-full"
                                    onClick={handleDownload}
                                    disabled={isProcessing || overlays.length === 0}
                                >
                                    {isProcessing ? "Processing..." : "Download PDF"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Screen */}
                {downloadUrl && (
                    <div className="text-center space-y-6">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                            <PenTool className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-semibold">Success!</h3>
                        <div className="flex justify-center gap-4">
                            <DownloadButton
                                isReady={true}
                                filename={`signed-${files[0]?.name || 'document.pdf'}`}
                                onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = downloadUrl;
                                    a.download = `signed-${files[0]?.name || 'document.pdf'}`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                }}
                            />
                            <Button onClick={handleStartOver} variant="outline">Start Over</Button>
                        </div>
                    </div>
                )}

                {/* Signature Pad Modal */}
                {showSignaturePad && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <SignaturePad
                            onSave={handleSignatureSave}
                            onCancel={() => setShowSignaturePad(false)}
                        />
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
