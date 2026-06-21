"use client";
import { useState, type FC } from "react";
import { GripVertical, ChevronDown, ChevronUp, X } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { OPERATIONS } from "@/lib/pipeline/operations";
import type { PipelineStep } from "@/lib/pipeline/types";

function StepCard({ step, index, onChange, onRemove }: {
    step: PipelineStep; index: number;
    onChange: (s: PipelineStep) => void; onRemove: () => void;
}) {
    const [expanded, setExpanded] = useState(true);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });
    const op = OPERATIONS[step.opId];
    const Form = op.OptionsForm as FC<{ value: unknown; onChange: (v: unknown) => void }>;
    return (
        <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-2 p-3">
                <button type="button" {...attributes} {...listeners} className="cursor-grab touch-none select-none text-gray-400"><GripVertical className="w-4 h-4" /></button>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-xs text-white">{index + 1}</span>
                <span className="flex-1 text-sm font-medium">{op.label}</span>
                <button type="button" onClick={() => setExpanded((e) => !e)} className="text-gray-400">
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button type="button" onClick={onRemove} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
            </div>
            {expanded && (
                <div className="border-t border-gray-100 dark:border-gray-700 p-3">
                    {op.id === "compress"
                        ? <p className="text-sm text-gray-500">Optimizes structure and strips unused objects. No options.</p>
                        : <Form value={step.options} onChange={(options) => onChange({ ...step, options })} />}
                </div>
            )}
        </div>
    );
}

export function StepList({ steps, onChange }: { steps: PipelineStep[]; onChange: (s: PipelineStep[]) => void }) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );
    function onDragEnd(e: DragEndEvent) {
        const { active, over } = e;
        if (over && active.id !== over.id) {
            const from = steps.findIndex((s) => s.id === active.id);
            const to = steps.findIndex((s) => s.id === over.id);
            onChange(arrayMove(steps, from, to));
        }
    }
    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                    {steps.map((step, i) => (
                        <StepCard key={step.id} step={step} index={i}
                            onChange={(s) => onChange(steps.map((x) => (x.id === s.id ? s : x)))}
                            onRemove={() => onChange(steps.filter((x) => x.id !== step.id))} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
