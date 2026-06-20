"use client";

import { useRef } from "react";
import { X } from "lucide-react";
import type { RedactionBox as Box } from "@/lib/pdf/redact";

interface Props {
    box: Box;
    containerWidth: number;
    containerHeight: number;
    selected: boolean;
    onSelect: () => void;
    onChange: (updates: Partial<Box>) => void;
    onDelete: () => void;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export function RedactionBox({
    box,
    containerWidth,
    containerHeight,
    selected,
    onSelect,
    onChange,
    onDelete,
}: Props) {
    const drag = useRef<null | { mode: "move" | "resize"; startX: number; startY: number; orig: Box }>(null);

    const start = (mode: "move" | "resize") => (e: React.PointerEvent) => {
        e.stopPropagation();
        onSelect();
        (e.target as Element).setPointerCapture?.(e.pointerId);
        drag.current = { mode, startX: e.clientX, startY: e.clientY, orig: { ...box } };
    };

    const move = (e: React.PointerEvent) => {
        const s = drag.current;
        if (!s || containerWidth === 0 || containerHeight === 0) return;
        const dx = (e.clientX - s.startX) / containerWidth;
        const dy = (e.clientY - s.startY) / containerHeight;
        if (s.mode === "move") {
            onChange({
                x: clamp(s.orig.x + dx, 0, 1 - s.orig.w),
                y: clamp(s.orig.y + dy, 0, 1 - s.orig.h),
            });
        } else {
            onChange({
                w: clamp(s.orig.w + dx, 0.005, 1 - s.orig.x),
                h: clamp(s.orig.h + dy, 0.005, 1 - s.orig.y),
            });
        }
    };

    const end = () => {
        drag.current = null;
    };

    return (
        <div
            onPointerDown={start("move")}
            onPointerMove={move}
            onPointerUp={end}
            style={{
                position: "absolute",
                left: `${box.x * 100}%`,
                top: `${box.y * 100}%`,
                width: `${box.w * 100}%`,
                height: `${box.h * 100}%`,
            }}
            className={`cursor-move bg-black/80 ${selected ? "ring-2 ring-primary-500" : ""}`}
        >
            {selected && (
                <>
                    <button
                        type="button"
                        aria-label="Delete redaction"
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="absolute -right-2 -top-2 rounded-full bg-white p-0.5 shadow"
                    >
                        <X className="h-3 w-3 text-black" />
                    </button>
                    <div
                        onPointerDown={start("resize")}
                        className="absolute -bottom-1 -right-1 h-3 w-3 cursor-se-resize border border-black bg-white"
                    />
                </>
            )}
        </div>
    );
}
