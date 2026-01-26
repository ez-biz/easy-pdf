"use client";

import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker - use local worker file
if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

interface PDFPageRendererProps {
    file: File;
    pageNumber: number; // 1-indexed
    onPageRendered?: (width: number, height: number) => void;
    className?: string;
    scale?: number;
}

export function PDFPageRenderer({
    file,
    pageNumber,
    onPageRendered,
    className,
    scale = 1.5,
}: PDFPageRendererProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const renderPage = async () => {
            if (!canvasRef.current) return;

            try {
                // Cancel any pending render task
                if (renderTaskRef.current) {
                    try {
                        renderTaskRef.current.cancel();
                    } catch {
                        // Ignore cancel errors
                    }
                }

                setIsLoading(true);
                setError(null);

                // Load PDF
                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;

                if (!isMounted) return;

                // Get page
                const page = await pdf.getPage(pageNumber);
                const viewport = page.getViewport({ scale });

                if (!isMounted) return;

                // Prepare canvas
                const canvas = canvasRef.current;
                const context = canvas.getContext("2d");
                if (!context) return;

                // Clear canvas before new render
                context.clearRect(0, 0, canvas.width, canvas.height);

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                // Render PDF page
                const renderTask = page.render({
                    canvasContext: context,
                    viewport: viewport,
                });

                renderTaskRef.current = renderTask;
                await renderTask.promise;

                if (isMounted) {
                    setIsLoading(false);
                    onPageRendered?.(viewport.width, viewport.height);
                }
            } catch (err: unknown) {
                const error = err as { name?: string; message?: string };
                if (error?.name === 'RenderingCancelledException') {
                    // Ignore cancelled renders
                    return;
                }
                if (isMounted) {
                    setError(error.message || "Failed to render PDF");
                    setIsLoading(false);
                }
            }
        };

        renderPage();

        return () => {
            isMounted = false;
            if (renderTaskRef.current) {
                try {
                    renderTaskRef.current.cancel();
                } catch {
                    // Ignore
                }
            }
        };
    }, [file, pageNumber, onPageRendered, scale]);

    return (
        <div className={className}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-100 dark:bg-surface-800">
                    <div className="text-center">
                        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-sm text-surface-600 dark:text-surface-400">
                            Loading page {pageNumber}...
                        </p>
                    </div>
                </div>
            )}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/20">
                    <p className="text-red-600 dark:text-red-400">Error: {error}</p>
                </div>
            )}
            <canvas ref={canvasRef} className="w-full h-auto block" />
        </div>
    );
}
