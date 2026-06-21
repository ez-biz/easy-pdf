"use client";
import { Check, X, Download, RotateCcw } from "lucide-react";
import { downloadBlob } from "@/lib/utils";
import { zipResults } from "@/lib/pipeline/zipResults";
import type { FileStatus } from "@/lib/pipeline/types";

export function ResultsReport({ results, onReset }: { results: FileStatus[]; onReset: () => void }) {
    const successes = results.filter((r) => r.status === "success");
    const failures = results.filter((r) => r.status === "failed");

    async function downloadZip() {
        downloadBlob(await zipResults(results), "batch-results.zip");
    }
    function downloadOne(r: FileStatus) {
        if (r.status === "success") {
            downloadBlob(new Blob([r.bytes as BlobPart], { type: "application/pdf" }), r.name);
        }
    }

    return (
        <div className="space-y-4">
            <div className="text-sm">
                <span className="text-green-600 font-semibold">{successes.length} succeeded</span>
                {failures.length > 0 && <> · <span className="text-red-500 font-semibold">{failures.length} failed</span></>}
                {" · "}{results.length} total
            </div>
            {successes.length > 0 && (
                <button type="button" onClick={downloadZip}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary-500 p-3 text-white font-medium hover:bg-primary-600">
                    <Download className="w-4 h-4" /> Download results.zip ({successes.length})
                </button>
            )}
            <div className="space-y-1">
                {results.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 rounded border border-gray-100 dark:border-gray-700 p-2 text-sm">
                        {r.status === "success"
                            ? <Check className="w-4 h-4 text-green-600" />
                            : <X className="w-4 h-4 text-red-500" />}
                        <span className="truncate flex-1">{r.name}</span>
                        {r.status === "success"
                            ? <button type="button" onClick={() => downloadOne(r)} className="text-primary-500 hover:underline">Download</button>
                            : <span className="text-red-500 text-xs">failed at step {r.failedStepIndex + 1} — {r.error}</span>}
                    </div>
                ))}
            </div>
            <button type="button" onClick={onReset} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                <RotateCcw className="w-4 h-4" /> Start over
            </button>
        </div>
    );
}
