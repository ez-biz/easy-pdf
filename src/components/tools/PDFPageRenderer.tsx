"use client";

import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker - use local worker from node_modules
if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
    ).toString();
}

interface PDFPageRendererProps {
    file: File;
    pageNumber: number; // 1-indexed
    onPageRendered?: (width: number, height: number) => void;
    className?: string;
}

export function PDFPageRenderer({
    file,
    pageNumber,
    onPageRendered,
    className,
}: PDFPageRendererProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const renderPage = async () => {
            if (!canvasRef.current) return;

            try {
                setIsLoading(true);
                setError(null);

                // Load PDF
                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;

                // Get page
                const page = await pdf.getPage(pageNumber);
                const viewport = page.getViewport({ scale: 1.5 });

                // Prepare canvas
                const canvas = canvasRef.current;
                const context = canvas.getContext("2d");
                if (!context) return;

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                // Render PDF page
                await page.render({
                    canvasContext: context,
                    viewport: viewport,
                }).promise;

                if (isMounted) {
                    setIsLoading(false);
                    onPageRendered?.(viewport.width, viewport.height);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : "Failed to render PDF");
                    setIsLoading(false);
                }
            }
        };

        renderPage();

        return () => {
            isMounted = false;
        };
    }, [file, pageNumber, onPageRendered]);

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
            <canvas ref={canvasRef} className="w-full h-auto" />
        </div>
    );
}
