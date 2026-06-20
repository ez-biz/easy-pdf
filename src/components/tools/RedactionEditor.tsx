"use client";

import { useRef, useState } from "react";
import { PDFPageRenderer } from "./PDFPageRenderer";
import { RedactionBox } from "./RedactionBox";
import { pointerToFractionRect, type RedactionBox as Box } from "@/lib/pdf/redact";
import { Button } from "@/components/ui/Button";

interface Props {
    file: File;
    pageNumber: number; // 1-indexed
    totalPages: number;
    boxes: Box[]; // boxes for the current page only
    onPageChange: (page: number) => void;
    onAddBox: (rect: { x: number; y: number; w: number; h: number }) => void;
    onUpdateBox: (id: string, updates: Partial<Box>) => void;
    onDeleteBox: (id: string) => void;
}

export function RedactionEditor({
    file,
    pageNumber,
    totalPages,
    boxes,
    onPageChange,
    onAddBox,
    onUpdateBox,
    onDeleteBox,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const startPt = useRef<{ x: number; y: number } | null>(null);
    const [draft, setDraft] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const down = (e: React.PointerEvent) => {
        const el = containerRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        startPt.current = { x: e.clientX - r.left, y: e.clientY - r.top };
        setSelectedId(null);
    };

    const move = (e: React.PointerEvent) => {
        const el = containerRef.current;
        if (!startPt.current || !el) return;
        const r = el.getBoundingClientRect();
        setDraft(
            pointerToFractionRect(startPt.current.x, startPt.current.y, e.clientX - r.left, e.clientY - r.top, r.width, r.height)
        );
    };

    const up = () => {
        if (draft && draft.w > 0.005 && draft.h > 0.005) onAddBox(draft);
        startPt.current = null;
        setDraft(null);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-center gap-4">
                <Button variant="secondary" disabled={pageNumber <= 1} onClick={() => onPageChange(pageNumber - 1)}>
                    Prev
                </Button>
                <span className="text-sm text-surface-600 dark:text-surface-300">
                    Page {pageNumber} of {totalPages}
                </span>
                <Button variant="secondary" disabled={pageNumber >= totalPages} onClick={() => onPageChange(pageNumber + 1)}>
                    Next
                </Button>
            </div>

            <div
                ref={containerRef}
                onPointerDown={down}
                onPointerMove={move}
                onPointerUp={up}
                className="relative w-full cursor-crosshair touch-none overflow-hidden rounded-xl border border-surface-200 dark:border-surface-700"
            >
                <PDFPageRenderer file={file} pageNumber={pageNumber} className="pointer-events-none select-none" />
                {boxes.map((b) => (
                    <RedactionBox
                        key={b.id}
                        box={b}
                        containerRef={containerRef}
                        selected={selectedId === b.id}
                        onSelect={() => setSelectedId(b.id)}
                        onChange={(u) => onUpdateBox(b.id, u)}
                        onDelete={() => onDeleteBox(b.id)}
                    />
                ))}
                {draft && (
                    <div
                        className="pointer-events-none absolute border border-black bg-black/40"
                        style={{
                            left: `${draft.x * 100}%`,
                            top: `${draft.y * 100}%`,
                            width: `${draft.w * 100}%`,
                            height: `${draft.h * 100}%`,
                        }}
                    />
                )}
            </div>
            <p className="text-center text-xs text-surface-500">Drag on the page to draw a redaction box. Click a box to move, resize, or delete it.</p>
        </div>
    );
}
