"use client";
import { Plus } from "lucide-react";
import { useState } from "react";
import { OPERATION_LIST } from "@/lib/pipeline/operations";

export function OperationPicker({ onAdd }: { onAdd: (opId: string) => void }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button type="button" onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-3 text-sm text-gray-600 dark:text-gray-300 hover:border-primary-500">
                <Plus className="w-4 h-4" /> Add operation
            </button>
            {open && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                    {OPERATION_LIST.map((op) => {
                        const Icon = op.icon;
                        return (
                            <button key={op.id} type="button"
                                onClick={() => { onAdd(op.id); setOpen(false); }}
                                className="w-full flex items-center gap-2 p-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                                <Icon className="w-4 h-4 text-primary-500" /> {op.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
