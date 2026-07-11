"use client";
import { useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { FileUploader } from "@/components/tools/FileUploader";
import { OperationPicker } from "@/components/tools/batch/OperationPicker";
import { StepList } from "@/components/tools/batch/StepList";
import { RunProgress, type FileProgress } from "@/components/tools/batch/RunProgress";
import { ResultsReport } from "@/components/tools/batch/ResultsReport";
import { OPERATIONS } from "@/lib/pipeline/operations";
import { runPipeline } from "@/lib/pipeline/runPipeline";
import { validateChain } from "@/lib/pipeline/validateChain";
import type { FileStatus, MediaType, PipelineInput, PipelineStep } from "@/lib/pipeline/types";
import type { FileWithPreview } from "@/types/tools";
import { generateId } from "@/lib/utils";
import { PrimaryAction } from "@/components/tools/PrimaryAction";
import { MobileActionProvider } from "@/components/layout/MobileActionContext";
import { MobileActionBar } from "@/components/layout/MobileActionBar";

type Phase = "build" | "running" | "results";

export default function BatchClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [steps, setSteps] = useState<PipelineStep[]>([]);
    const [phase, setPhase] = useState<Phase>("build");
    const [progress, setProgress] = useState<FileProgress[]>([]);
    const [done, setDone] = useState(0);
    const [results, setResults] = useState<FileStatus[]>([]);
    const [outputType, setOutputType] = useState<MediaType>("pdf");
    const [error, setError] = useState<string | null>(null);
    const [cancelled, setCancelled] = useState(false);
    const abortRef = useRef<AbortController | null>(null);
    const runningRef = useRef(false);

    function addStep(opId: string) {
        setSteps((s) => [...s, { id: generateId(), opId, options: structuredClone(OPERATIONS[opId].defaultOptions) }]);
    }

    async function run() {
        if (runningRef.current) return;
        runningRef.current = true;
        try {
            setError(null);

            let inputs: PipelineInput[];
            try {
                // v1 reads all files into memory up front; fine for the current file/count limits. Revisit (sequential read) if limits grow.
                inputs = await Promise.all(
                    files.map(async (f) => ({ name: f.file.name, bytes: new Uint8Array(await f.file.arrayBuffer()) })),
                );
            } catch {
                setError("Couldn't read one or more files. Please re-add them and try again.");
                return;
            }

            setProgress(inputs.map((i) => ({ name: i.name, state: "queued" as const })));
            setDone(0);
            const lastOp = steps.length ? OPERATIONS[steps[steps.length - 1].opId] : null;
            setOutputType(lastOp?.outputType ?? "pdf");
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

            setCancelled(controller.signal.aborted);
            setResults(res);
            setPhase("results");
        } finally {
            runningRef.current = false;
        }
    }

    function reset() {
        setSteps([]);
        setFiles([]);
        setResults([]);
        setProgress([]);
        setDone(0);
        setPhase("build");
        setError(null);
        setCancelled(false);
    }

    const { errors, warnings } = validateChain(steps, OPERATIONS);
    const hasTerminal = steps.some((s) => OPERATIONS[s.opId]?.terminal);
    const canRun = files.length > 0 && steps.length > 0 && errors.length === 0;

    return (
        <MobileActionProvider>
        <div className="mx-auto max-w-2xl space-y-6 p-4 pb-28 md:pb-8">
            <header>
                <h1 className="text-2xl font-bold">Batch Process</h1>
                <p className="text-gray-500">Run a chain of operations across many PDFs at once.</p>
            </header>

            {phase === "build" && (
                <>
                    <FileUploader accept={{ "application/pdf": [".pdf"] }} multiple files={files} onFilesChange={setFiles}
                        label="Drop your PDFs here" />
                    {steps.length > 0 && <StepList steps={steps} onChange={setSteps} />}
                    <OperationPicker onAdd={addStep} disabled={hasTerminal} />
                    {errors.map((e) => (
                        <div key={e} className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
                            <AlertTriangle className="w-4 h-4 inline mr-1" />{e}
                        </div>
                    ))}
                    {warnings.length > 0 && (
                        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-200">
                            {warnings.map((w) => <p key={w}><AlertTriangle className="w-4 h-4 inline mr-1" />{w}</p>)}
                        </div>
                    )}
                    {error && <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">{error}</div>}
                    <PrimaryAction
                        onClick={run}
                        disabled={!canRun}
                        context={`${files.length} file${files.length === 1 ? "" : "s"} · ${steps.length} step${steps.length === 1 ? "" : "s"}`}
                    >
                        {`Run on ${files.length} file${files.length === 1 ? "" : "s"}`}
                    </PrimaryAction>
                </>
            )}

            {phase === "running" && (
                <RunProgress files={progress} done={done} total={progress.length}
                    // Cancel takes effect between files; a step already running on the current file runs to completion.
                    onCancel={() => abortRef.current?.abort()} />
            )}

            {phase === "results" && (
                <>
                    {cancelled && <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-200">Run cancelled — only the files completed before cancelling are included.</div>}
                    <ResultsReport results={results} outputType={outputType} onReset={reset} />
                </>
            )}
        </div>
        <MobileActionBar />
        </MobileActionProvider>
    );
}
