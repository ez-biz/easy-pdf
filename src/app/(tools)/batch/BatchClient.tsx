"use client";
import { useRef, useState } from "react";
import { FileUploader } from "@/components/tools/FileUploader";
import { OperationPicker } from "@/components/tools/batch/OperationPicker";
import { StepList } from "@/components/tools/batch/StepList";
import { RunProgress, type FileProgress } from "@/components/tools/batch/RunProgress";
import { ResultsReport } from "@/components/tools/batch/ResultsReport";
import { OPERATIONS } from "@/lib/pipeline/operations";
import { runPipeline } from "@/lib/pipeline/runPipeline";
import type { FileStatus, PipelineInput, PipelineStep } from "@/lib/pipeline/types";
import type { FileWithPreview } from "@/types/tools";
import { generateId } from "@/lib/utils";

type Phase = "build" | "running" | "results";

export default function BatchClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [steps, setSteps] = useState<PipelineStep[]>([]);
    const [phase, setPhase] = useState<Phase>("build");
    const [progress, setProgress] = useState<FileProgress[]>([]);
    const [done, setDone] = useState(0);
    const [results, setResults] = useState<FileStatus[]>([]);
    const abortRef = useRef<AbortController | null>(null);

    function addStep(opId: string) {
        setSteps((s) => [...s, { id: generateId(), opId, options: structuredClone(OPERATIONS[opId].defaultOptions) }]);
    }

    async function run() {
        const inputs: PipelineInput[] = await Promise.all(
            files.map(async (f) => ({ name: f.file.name, bytes: new Uint8Array(await f.file.arrayBuffer()) })),
        );
        setProgress(inputs.map((i) => ({ name: i.name, state: "queued" as const })));
        setDone(0);
        setPhase("running");
        const controller = new AbortController();
        abortRef.current = controller;

        const res = await runPipeline(inputs, steps, OPERATIONS, (e) => {
            if (e.type === "file-start") {
                setProgress((p) => p.map((x, i) => (i === e.fileIndex ? { ...x, state: "running" } : x)));
            } else if (e.type === "file-done") {
                setProgress((p) => p.map((x, i) => (i === e.fileIndex ? { ...x, state: e.status.status === "success" ? "done" : "failed" } : x)));
                setDone((d) => d + 1);
            }
        }, controller.signal);

        setResults(res);
        setPhase("results");
    }

    function reset() {
        setSteps([]); setFiles([]); setResults([]); setProgress([]); setDone(0); setPhase("build");
    }

    const canRun = files.length > 0 && steps.length > 0;

    // Non-blocking ordering nudge (spec: error handling).
    const orderingWarnings: string[] = [];
    const protectIdx = steps.findIndex((s) => s.opId === "protect");
    const unlockIdx = steps.findIndex((s) => s.opId === "unlock");
    if (protectIdx !== -1 && protectIdx !== steps.length - 1) {
        orderingWarnings.push("Protect usually works best as the last step — later steps may fail on an encrypted file.");
    }
    if (unlockIdx > 0) {
        orderingWarnings.push("Unlock usually works best as the first step.");
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6 p-4">
            <header>
                <h1 className="text-2xl font-bold">Batch Process</h1>
                <p className="text-gray-500">Run a chain of operations across many PDFs at once.</p>
            </header>

            {phase === "build" && (
                <>
                    <FileUploader accept={{ "application/pdf": [".pdf"] }} multiple files={files} onFilesChange={setFiles}
                        label="Drop your PDFs here" />
                    {steps.length > 0 && <StepList steps={steps} onChange={setSteps} />}
                    <OperationPicker onAdd={addStep} />
                    {orderingWarnings.length > 0 && (
                        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-200">
                            {orderingWarnings.map((w) => <p key={w}>⚠ {w}</p>)}
                        </div>
                    )}
                    <button type="button" disabled={!canRun} onClick={run}
                        className="w-full rounded-lg bg-primary-500 p-3 text-white font-medium disabled:opacity-40 hover:bg-primary-600">
                        Run on {files.length} file{files.length === 1 ? "" : "s"}
                    </button>
                </>
            )}

            {phase === "running" && (
                <RunProgress files={progress} done={done} total={progress.length}
                    onCancel={() => abortRef.current?.abort()} />
            )}

            {phase === "results" && <ResultsReport results={results} onReset={reset} />}
        </div>
    );
}
