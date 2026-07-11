"use client";
import { Plus } from "lucide-react";
import { useState } from "react";
import { OPERATION_LIST } from "@/lib/pipeline/operations";
import type { PdfOperation } from "@/lib/pipeline/types";

export function OperationPicker({ onAdd, disabled = false }: { onAdd: (opId: string) => void; disabled?: boolean }) {
    const [open, setOpen] = useState(false);
    const regular = OPERATION_LIST.filter((op) => !op.terminal);
    const terminal = OPERATION_LIST.filter((op) => op.terminal);

    const item = (op: PdfOperation) => {
        const Icon = op.icon;
        return (
            <button key={op.id} type="button"
                onClick={() => { onAdd(op.id); setOpen(false); }}
                className="w-full flex items-center gap-2 p-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                <Icon className="w-4 h-4 text-primary-500" /> {op.label}
            </button>
        );
    };

    return (
        <div className="relative">
            <button type="button" disabled={disabled} onClick={() => setOpen((o) => !o)}
                title={disabled ? "Remove the final conversion step to add more operations" : undefined}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-3 text-sm text-gray-600 dark:text-gray-300 hover:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300">
                <Plus className="w-4 h-4" /> Add operation
            </button>
            {open && !disabled && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                    {regular.map(item)}
                    {terminal.length > 0 && (
                        <div className="px-2 py-1 text-xs text-gray-400 border-t border-gray-100 dark:border-gray-700">
                            Convert (final step — changes output format)
                        </div>
                    )}
                    {terminal.map(item)}
                </div>
            )}
        </div>
    );
}
