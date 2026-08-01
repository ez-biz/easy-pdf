"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, FileText, X, RotateCw } from "lucide-react";
import { PDFDocument } from "@cantoo/pdf-lib";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { PrimaryAction } from "@/components/tools/PrimaryAction";
import { Button } from "@/components/ui/Button";
import { downloadBlob, createPdfBlob } from "@/lib/utils";

interface CapturedImage {
    id: string;
    dataUrl: string;
}

export default function ScanToPdfClient() {
    const [images, setImages] = useState<CapturedImage[]>([]);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [result, setResult] = useState<{ blob: Blob; size: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
        setCameraActive(false);
    }, [stream]);

    const startCamera = useCallback(async () => {
        setCameraError(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
                audio: false,
            });
            setStream(mediaStream);
            setCameraActive(true);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            setCameraError("Could not access camera. Please allow camera permissions.");
            setCameraActive(false);
        }
    }, [facingMode]);

    const captureImage = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        // Capturing before the stream has dimensions yields a 0x0 page that only
        // fails later, at PDF assembly.
        if (!video.videoWidth || !video.videoHeight) {
            setCameraError("Camera is still starting — try again in a moment.");
            return;
        }
        setCameraError(null);

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        setImages((prev) => [...prev, { id: crypto.randomUUID(), dataUrl }]);
    }, []);

    const removeImage = (id: string) => {
        setImages((prev) => prev.filter((img) => img.id !== id));
    };

    const toggleCamera = () => {
        if (cameraActive) {
            stopCamera();
        } else {
            startCamera();
        }
    };

    const handleConvert = async () => {
        if (images.length === 0) {
            setError("Please capture at least one image");
            return;
        }

        setError(null);
        setIsProcessing(true);

        try {
            const pdfDoc = await PDFDocument.create();

            for (const img of images) {
                const response = await fetch(img.dataUrl);
                const buffer = await response.arrayBuffer();
                const isJpeg = img.dataUrl.startsWith("data:image/jpeg");
                const embedded = isJpeg
                    ? await pdfDoc.embedJpg(new Uint8Array(buffer))
                    : await pdfDoc.embedPng(new Uint8Array(buffer));

                // Fit each capture onto a real A4 sheet rather than using raw pixel
                // dimensions, which would produce a ~26x15in page for a 1080p camera.
                const A4_SHORT = 595.28;
                const A4_LONG = 841.89;
                const landscape = embedded.width > embedded.height;
                const pageWidth = landscape ? A4_LONG : A4_SHORT;
                const pageHeight = landscape ? A4_SHORT : A4_LONG;

                const page = pdfDoc.addPage([pageWidth, pageHeight]);

                const scale = Math.min(pageWidth / embedded.width, pageHeight / embedded.height);
                const drawWidth = embedded.width * scale;
                const drawHeight = embedded.height * scale;

                page.drawImage(embedded, {
                    x: (pageWidth - drawWidth) / 2,
                    y: (pageHeight - drawHeight) / 2,
                    width: drawWidth,
                    height: drawHeight,
                });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = createPdfBlob(pdfBytes);
            setResult({ blob, size: blob.size });
            stopCamera();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create PDF");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setImages([]);
        setResult(null);
        setError(null);
    };

    return (
        <ToolLayout
            title="Scan Document"
            description="Use your camera to scan documents and save as PDF"
            icon={Camera}
            color="from-rose-500 to-pink-600"
        >
            {!result ? (
                <div className="space-y-6">
                    {/* Camera Toggle */}
                    <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-surface-900 dark:text-white">Camera</h3>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setFacingMode(facingMode === "environment" ? "user" : "environment")}
                                >
                                    <RotateCw className="w-4 h-4" />
                                </Button>
                                <Button
                                    onClick={toggleCamera}
                                    variant={cameraActive ? "secondary" : "primary"}
                                    size="sm"
                                >
                                    {cameraActive ? "Stop Camera" : "Start Camera"}
                                </Button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {cameraActive && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex justify-center">
                                        <Button
                                            onClick={captureImage}
                                            size="lg"
                                            leftIcon={<Camera className="w-4 h-4" />}
                                        >
                                            Capture
                                        </Button>
                                    </div>
                                    <canvas ref={canvasRef} className="hidden" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {cameraError && (
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-300">
                                {cameraError}
                            </div>
                        )}
                    </div>

                    {/* Captured Images */}
                    {images.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700"
                        >
                            <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                                Captured Pages ({images.length})
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {images.map((img, i) => (
                                    <div key={img.id} className="relative group">
                                        <img
                                            src={img.dataUrl}
                                            alt={`Page ${i + 1}`}
                                            className="w-full aspect-[3/4] object-cover rounded-lg border border-surface-200 dark:border-surface-700"
                                        />
                                        <button
                                            onClick={() => removeImage(img.id)}
                                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                        <span className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">
                                            {i + 1}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm"
                        >
                            {error}
                        </motion.div>
                    )}

                    {images.length > 0 && (
                        <div className="flex justify-center gap-4">
                            <PrimaryAction
                                onClick={handleConvert}
                                loading={isProcessing}
                                icon={<FileText className="w-4 h-4" />}
                                context={`${images.length} page${images.length !== 1 ? "s" : ""} captured`}
                            >
                                Create PDF
                            </PrimaryAction>
                        </div>
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
                            className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        >
                            <FileText className="w-10 h-10 text-rose-500" />
                        </motion.div>
                        <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">PDF Ready</h2>
                        <p className="text-surface-500 dark:text-surface-400">
                            {images.length} page{images.length !== 1 ? "s" : ""} scanned to PDF.
                        </p>
                    </div>

                    <DownloadButton
                        onClick={() => downloadBlob(result.blob, "scanned-document.pdf")}
                        filename="scanned-document.pdf"
                        fileSize={result.size}
                        isReady={true}
                    />

                    <div className="text-center">
                        <div className="flex justify-center gap-3">
                            <Button variant="secondary" onClick={handleReset}>
                                Start Over
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </ToolLayout>
    );
}
