import { useState, useCallback, useRef, useEffect } from "react";
import type { WorkerOperation, WorkerResponse } from "@/lib/pdf/pdf.worker";

interface ProcessOptions {
    operation: WorkerOperation;
    files: File[];
    options?: Record<string, unknown>;
}

interface WorkerResult {
    data: Uint8Array | ArrayBuffer;
    details?: Record<string, unknown>;
}

export function usePDFWorker() {
    const [progress, setProgress] = useState(0);
    const [stage, setStage] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const workerRef = useRef<Worker | null>(null);
    const requestIdRef = useRef(0);

    // Clean up worker on unmount
    useEffect(() => {
        return () => {
            workerRef.current?.terminate();
            workerRef.current = null;
        };
    }, []);

    const getWorker = useCallback(() => {
        if (!workerRef.current) {
            workerRef.current = new Worker(
                new URL("@/lib/pdf/pdf.worker.ts", import.meta.url),
                { type: "module" }
            );
        }
        return workerRef.current;
    }, []);

    const process = useCallback(
        async ({ operation, files, options }: ProcessOptions): Promise<WorkerResult> => {
            setIsProcessing(true);
            setProgress(0);
            setStage("Preparing...");

            const id = String(++requestIdRef.current);

            // Convert files to ArrayBuffers
            const buffers = await Promise.all(files.map((f) => f.arrayBuffer()));

            return new Promise<WorkerResult>((resolve, reject) => {
                const worker = getWorker();

                const handleMessage = (e: MessageEvent<WorkerResponse>) => {
                    const msg = e.data;
                    if (msg.id !== id) return;

                    switch (msg.type) {
                        case "progress":
                            setProgress(msg.progress);
                            if (msg.stage) setStage(msg.stage);
                            break;
                        case "result":
                            worker.removeEventListener("message", handleMessage);
                            worker.removeEventListener("error", handleError);
                            setIsProcessing(false);
                            setProgress(100);
                            setStage("Complete");
                            resolve({ data: msg.data, details: msg.details });
                            break;
                        case "error":
                            worker.removeEventListener("message", handleMessage);
                            worker.removeEventListener("error", handleError);
                            setIsProcessing(false);
                            setProgress(0);
                            setStage("");
                            reject(new Error(msg.error));
                            break;
                    }
                };

                const handleError = (e: ErrorEvent) => {
                    worker.removeEventListener("message", handleMessage);
                    worker.removeEventListener("error", handleError);
                    setIsProcessing(false);
                    setProgress(0);
                    setStage("");
                    reject(new Error(e.message || "Worker error"));
                };

                worker.addEventListener("message", handleMessage);
                worker.addEventListener("error", handleError);

                worker.postMessage({
                    id,
                    operation,
                    buffers,
                    options,
                    fileNames: files.map((f) => f.name),
                });
            });
        },
        [getWorker]
    );

    const resetProgress = useCallback(() => {
        setProgress(0);
        setStage("");
    }, []);

    return {
        process,
        progress,
        stage,
        isProcessing,
        resetProgress,
    };
}
