"use client";

import { useRef } from "react";
import { motion, useDragControls } from "framer-motion";
import { Trash2, RotateCw } from "lucide-react";
import { ImageOverlay } from "@/lib/pdf/addImage";

export interface DraggableImageBoxProps {
    overlay: ImageOverlay;
    containerRef: React.RefObject<HTMLDivElement | null>;
    isSelected: boolean;
    onSelect: () => void;
    onUpdate: (id: string, updates: Partial<ImageOverlay>) => void;
    onDelete: (id: string) => void;
    imageUrl: string;
    aspectRatio: number;
}

export function DraggableImageBox({
    overlay,
    containerRef,
    isSelected,
    onSelect,
    onUpdate,
    onDelete,
    imageUrl,
    aspectRatio,
}: DraggableImageBoxProps) {
    const controls = useDragControls();
    const boxRef = useRef<HTMLDivElement>(null);

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

                const deltaXPercent = (info.offset.x / rect.width) * 100;
                const deltaYPercent = (info.offset.y / rect.height) * 100;

                onUpdate(overlay.id, {
                    x: Math.max(0, Math.min(100 - overlay.width, overlay.x + deltaXPercent)),
                    y: Math.max(0, Math.min(100 - overlay.height, overlay.y + deltaYPercent)),
                });
            }}
            style={{
                position: "absolute",
                left: `${overlay.x}%`,
                top: `${overlay.y}%`,
                width: `${overlay.width}%`,
                height: `${overlay.height}%`,
                touchAction: "none",
            }}
            className="absolute"
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
        >
            <div
                ref={boxRef}
                className={`relative group h-full ${isSelected
                    ? "ring-2 ring-primary-500"
                    : "hover:ring-1 hover:ring-primary-300"
                    } rounded cursor-move transition-shadow`}
                style={{
                    transform: `rotate(${overlay.rotation}deg)`,
                }}
                onPointerDown={(e) => controls.start(e)}
            >
                {/* Image Display */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={imageUrl}
                    alt="overlay"
                    className="w-full h-full object-contain pointer-events-none select-none"
                    draggable={false}
                />

                {/* Controls */}
                {isSelected && (
                    <>
                        {/* Delete Button */}
                        <div
                            className="absolute -top-3 -right-3 p-1 bg-red-500 text-white rounded-full cursor-pointer shadow-sm hover:bg-red-600 z-10"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(overlay.id);
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            <Trash2 className="w-3 h-3" />
                        </div>

                        {/* Resize Handle (SE) - Aspect Ratio Locked */}
                        <div
                            className="absolute -bottom-2 -right-2 w-4 h-4 bg-primary-500 border-2 border-white rounded-full cursor-se-resize shadow-sm z-10"
                            onPointerDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const startX = e.clientX;
                                const startContainerWidth = containerRef.current?.getBoundingClientRect().width || 0;
                                const startContainerHeight = containerRef.current?.getBoundingClientRect().height || 0;
                                const startWidthPct = overlay.width;

                                const handlePointerMove = (moveEvent: PointerEvent) => {
                                    if (!startContainerWidth || !startContainerHeight) return;

                                    const deltaX = moveEvent.clientX - startX;
                                    const deltaXPct = (deltaX / startContainerWidth) * 100;

                                    const newWidthPct = Math.max(5, Math.min(100 - overlay.x, startWidthPct + deltaXPct));

                                    // Calculate height to maintain aspect ratio
                                    const containerRatio = startContainerWidth / startContainerHeight;
                                    const newHeightPct = newWidthPct * (containerRatio / aspectRatio);

                                    onUpdate(overlay.id, {
                                        width: newWidthPct,
                                        height: newHeightPct
                                    });
                                };

                                const handlePointerUp = () => {
                                    window.removeEventListener("pointermove", handlePointerMove);
                                    window.removeEventListener("pointerup", handlePointerUp);
                                };

                                window.addEventListener("pointermove", handlePointerMove);
                                window.addEventListener("pointerup", handlePointerUp);
                            }}
                        />

                        {/* Rotation Handle (Top Center) */}
                        <div
                            className="absolute -top-8 left-1/2 -translate-x-1/2 p-1 bg-primary-500 text-white rounded-full cursor-grab active:cursor-grabbing shadow-sm z-10"
                            onPointerDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                const box = boxRef.current;
                                if (!box) return;
                                const rect = box.getBoundingClientRect();
                                const centerX = rect.left + rect.width / 2;
                                const centerY = rect.top + rect.height / 2;

                                const handlePointerMove = (moveEvent: PointerEvent) => {
                                    const dx = moveEvent.clientX - centerX;
                                    const dy = moveEvent.clientY - centerY;
                                    const angle = Math.atan2(dy, dx);
                                    const degrees = angle * (180 / Math.PI) + 90;
                                    onUpdate(overlay.id, { rotation: degrees });
                                };

                                const handlePointerUp = () => {
                                    window.removeEventListener("pointermove", handlePointerMove);
                                    window.removeEventListener("pointerup", handlePointerUp);
                                };

                                window.addEventListener("pointermove", handlePointerMove);
                                window.addEventListener("pointerup", handlePointerUp);
                            }}
                        >
                            <RotateCw className="w-3 h-3" />
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
}
