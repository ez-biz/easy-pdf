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

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.strokeStyle = "#000000";
        }
    }, []);

    const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Capture pointer to handle drawing outside canvas
        canvas.setPointerCapture(e.pointerId);

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

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

    const save = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        // Trim whitespace logic could go here, but full canvas is fine for now.
        // We could also allow color selection.
        const dataUrl = canvas.toDataURL("image/png");
        onSave(dataUrl);
    };

    return (
        <div className="bg-white dark:bg-surface-800 p-6 rounded-xl shadow-2xl border border-surface-200 dark:border-surface-700 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Draw Signature</h3>
                <button onClick={onCancel} className="text-surface-500 hover:text-surface-700 dark:hover:text-surface-300">
                    <X className="w-5 h-5" />
                </button>
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
