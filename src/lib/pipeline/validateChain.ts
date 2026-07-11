import type { MediaType, PdfOperation, PipelineStep } from "./types";

export interface ChainValidation {
    errors: string[];
    warnings: string[];
}

/**
 * Pure validation of a step chain. `errors` block running; `warnings` are nudges.
 * The uploader always provides PDFs, so the chain's input type starts at "pdf".
 */
export function validateChain(
    steps: PipelineStep[],
    ops: Record<string, PdfOperation>,
): ChainValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Type continuity: each step must accept the previous step's output.
    let prevOut: MediaType = "pdf";
    let prevLabel = "the uploaded PDF";
    let prevTerminal = false;
    for (const s of steps) {
        const op = ops[s.opId];
        if (!op) continue;
        // A terminal predecessor is already reported by rule 2 — don't double-report.
        if (!prevTerminal && op.inputType !== prevOut) {
            errors.push(`"${op.label}" can't run on ${prevLabel}.`);
        }
        prevOut = op.outputType;
        prevLabel = `the output of "${op.label}"`;
        prevTerminal = op.terminal === true;
    }

    // 2. A terminal step must be the last step.
    for (let i = 0; i < steps.length - 1; i++) {
        const op = ops[steps[i].opId];
        if (op?.terminal) {
            errors.push(`Nothing can run after "${op.label}" — it must be the last step.`);
        }
    }

    // 3. Protect must be last (a later re-saving op silently strips encryption).
    const protectIdx = steps.findIndex((s) => s.opId === "protect");
    if (protectIdx !== -1 && protectIdx !== steps.length - 1) {
        errors.push(
            'Move "Protect" to the last step. Any operation after it removes the password protection, leaving the output unencrypted.',
        );
    }

    // 4. Unlock works best first (soft nudge).
    const unlockIdx = steps.findIndex((s) => s.opId === "unlock");
    if (unlockIdx > 0) {
        warnings.push("Unlock usually works best as the first step.");
    }

    return { errors, warnings };
}
