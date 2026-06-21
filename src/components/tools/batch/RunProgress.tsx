"use client";
import { Check, Loader2, Circle, X } from "lucide-react";

export interface FileProgress { name: string; state: "queued" | "running" | "done" | "failed" }

export function RunProgress({ files, done, total, onCancel }: {
    files: FileProgress[]; done: number; total: number; onCancel: () => void;
}) {
    const pct = total ? Math.round((done / total) * 100) : 0;
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
                <span>{done} of {total} files</span>
                <button type="button" onClick={onCancel} className="text-gray-500 hover:text-red-500">Cancel</button>
            </div>
            <div className="h-2 w-full rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div className="h-full bg-primary-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="max-h-64 overflow-auto space-y-1">
                {files.map((f) => (
                    <div key={f.name} className="flex items-center gap-2 rounded border border-gray-100 dark:border-gray-700 p-2 text-sm">
                        {f.state === "done" && <Check className="w-4 h-4 text-green-600" />}
                        {f.state === "failed" && <X className="w-4 h-4 text-red-500" />}
                        {f.state === "running" && <Loader2 className="w-4 h-4 animate-spin text-primary-500" />}
                        {f.state === "queued" && <Circle className="w-3 h-3 text-gray-300" />}
                        <span className="truncate">{f.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
