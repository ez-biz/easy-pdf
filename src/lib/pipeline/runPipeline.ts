import type {
    FileStatus, PdfOperation, PipelineInput, PipelineStep, ProgressEvent,
} from "./types";

export async function runPipeline(
    inputs: PipelineInput[],
    steps: PipelineStep[],
    ops: Record<string, PdfOperation>,
    onProgress: (e: ProgressEvent) => void = () => {},
    signal?: AbortSignal,
): Promise<FileStatus[]> {
    const results: FileStatus[] = [];

    for (let f = 0; f < inputs.length; f++) {
        if (signal?.aborted) break;
        const { name, bytes: startBytes } = inputs[f];
        onProgress({ type: "file-start", fileIndex: f, name });

        let bytes = startBytes;
        let failure: FileStatus | null = null;

        for (let s = 0; s < steps.length; s++) {
            const stepDef = steps[s];
            const op = ops[stepDef.opId];
            try {
                if (!op) throw new Error(`Unknown operation: ${stepDef.opId}`);
                bytes = await op.run(bytes, stepDef.options);
                onProgress({ type: "step-done", fileIndex: f, stepIndex: s });
            } catch (err) {
                failure = {
                    name, status: "failed", failedStepIndex: s, opId: stepDef.opId,
                    error: err instanceof Error ? err.message : String(err),
                };
                break;
            }
        }

        const status: FileStatus =
            failure ?? { name, status: "success", bytes, stepsRun: steps.length };
        onProgress({ type: "file-done", fileIndex: f, status });
        results.push(status);
    }

    return results;
}
