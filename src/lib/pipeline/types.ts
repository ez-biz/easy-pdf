import type { FC } from "react";
import type { LucideIcon } from "lucide-react";

/** One available operation kind (e.g. "rotate"). Wraps an existing lib/pdf fn. */
export interface PdfOperation<TOptions = unknown> {
    id: string;
    label: string;
    icon: LucideIcon;
    defaultOptions: TOptions;
    /** Inline-accordion config UI for a single step. */
    OptionsForm: FC<{ value: TOptions; onChange: (next: TOptions) => void }>;
    /** Pure transform: bytes in, bytes out. May internally build a File / use pdf-lib. */
    run(input: Uint8Array, options: TOptions): Promise<Uint8Array>;
}

/** A configured step instance in the user's chain. */
export interface PipelineStep {
    id: string;       // unique instance id (dnd + react keys), from generateId()
    opId: string;     // which PdfOperation
    options: unknown; // operation-specific options
}

/** A file fed into the engine. The UI converts File -> this before running. */
export interface PipelineInput {
    name: string;
    bytes: Uint8Array;
}

export type FileStatus =
    | { name: string; status: "success"; bytes: Uint8Array; stepsRun: number }
    | { name: string; status: "failed"; failedStepIndex: number; opId: string; error: string };

export type ProgressEvent =
    | { type: "file-start"; fileIndex: number; name: string }
    | { type: "step-done"; fileIndex: number; stepIndex: number }
    | { type: "file-done"; fileIndex: number; status: FileStatus };
