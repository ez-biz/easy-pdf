"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Eraser, Check, X } from "lucide-react";

interface SignaturePadProps {
    onSave: (dataUrl: string) => void;
    onCancel: () => void;
}

export function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    const [color, setColor] = useState("#000000");

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.strokeStyle = color;
        }
    }, [color]);

    const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Capture pointer to handle drawing outside canvas
        canvas.setPointerCapture(e.pointerId);

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.strokeStyle = color;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
        setHasSignature(true);
    };

    const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.releasePointerCapture(e.pointerId);
        }
        setIsDrawing(false);
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
    };

    const getContentBoundingBox = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const pixels = ctx.getImageData(0, 0, width, height).data;
        let minX = width;
        let minY = height;
        let maxX = 0;
        let maxY = 0;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const alpha = pixels[index + 3];
                if (alpha > 0) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }

        // Return null if empty
        if (maxX < minX) return null;

        return { minX, minY, width: maxX - minX + 1, height: maxY - minY + 1 };
    };

    const save = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const bounds = getContentBoundingBox(ctx, canvas.width, canvas.height);

        // If empty or analysis failed, fallback to full
        if (!bounds) {
            onSave(canvas.toDataURL("image/png"));
            return;
        }

        // Create temp canvas for cropped image
        const padding = 10;
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = bounds.width + (padding * 2);
        tempCanvas.height = bounds.height + (padding * 2);

        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) return;

        // Draw cropped data
        tempCtx.drawImage(
            canvas,
            bounds.minX, bounds.minY, bounds.width, bounds.height,
            padding, padding, bounds.width, bounds.height
        );

        onSave(tempCanvas.toDataURL("image/png"));
    };

    return (
        <div className="bg-white dark:bg-surface-800 p-6 rounded-xl shadow-2xl border border-surface-200 dark:border-surface-700 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Draw Signature</h3>
                <button onClick={onCancel} className="text-surface-500 hover:text-surface-700 dark:hover:text-surface-300">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Color Selection */}
            <div className="flex justify-center gap-3 mb-4">
                {[
                    { val: "#000000", bg: "bg-black", label: "Black" },
                    { val: "#2563eb", bg: "bg-blue-600", label: "Blue" },
                    { val: "#dc2626", bg: "bg-red-600", label: "Red" },
                ].map((c) => (
                    <button
                        key={c.val}
                        onClick={() => setColor(c.val)}
                        className={`w-8 h-8 rounded-full ${c.bg} transition-all ${color === c.val
                                ? "ring-2 ring-offset-2 ring-primary-500 dark:ring-offset-surface-800 scale-110"
                                : "hover:scale-105 opacity-80 hover:opacity-100"
                            }`}
                        title={c.label}
                        aria-label={`Select ${c.label} ink`}
                    />
                ))}
            </div>

            <div className="relative border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-lg bg-white overflow-hidden touch-none">
                <canvas
                    ref={canvasRef}
                    width={500}
                    height={250}
                    className="w-full h-auto cursor-crosshair block"
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerLeave={stopDrawing}
                />
            </div>

            <p className="text-xs text-surface-500 mt-2 text-center">
                Use your mouse or finger to sign above
            </p>

            <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={clear} disabled={!hasSignature} size="sm">
                    <Eraser className="w-4 h-4 mr-2" /> Clear
                </Button>
                <Button onClick={save} disabled={!hasSignature} size="sm">
                    <Check className="w-4 h-4 mr-2" /> Add Signature
                </Button>
            </div>
        </div>
    );
}
