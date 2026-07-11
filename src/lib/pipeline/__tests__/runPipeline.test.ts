import { describe, it, expect } from "vitest";
import { runPipeline } from "../runPipeline";
import type { PdfOperation, PipelineInput, PipelineStep, ProgressEvent } from "../types";

// Fake ops operate on raw bytes — no pdf.js needed.
const appendByte = (id: string, value: number): PdfOperation<unknown> => ({
    id, label: id, icon: (() => null) as never,
    inputType: "pdf", outputType: "pdf",
    defaultOptions: {},
    OptionsForm: (() => null) as never,
    run: async (input) => new Uint8Array([...input, value]),
});
const explode = (id: string): PdfOperation<unknown> => ({
    id, label: id, icon: (() => null) as never,
    inputType: "pdf", outputType: "pdf",
    defaultOptions: {},
    OptionsForm: (() => null) as never,
    run: async () => { throw new Error("boom"); },
});

const input = (name: string, bytes: number[]): PipelineInput => ({ name, bytes: new Uint8Array(bytes) });
const step = (opId: string): PipelineStep => ({ id: `s-${opId}`, opId, options: {} });

describe("runPipeline", () => {
    it("runs steps in order, feeding output into the next", async () => {
        const ops = { a: appendByte("a", 1), b: appendByte("b", 2) };
        const res = await runPipeline([input("f.pdf", [0])], [step("a"), step("b")], ops);
        expect(res).toHaveLength(1);
        expect(res[0].status).toBe("success");
        if (res[0].status === "success") {
            expect([...res[0].bytes]).toEqual([0, 1, 2]);
            expect(res[0].stepsRun).toBe(2);
        }
    });

    it("isolates a failing step to its file; others continue", async () => {
        const ops = { ok: appendByte("ok", 9), bad: explode("bad") };
        const res = await runPipeline(
            [input("good.pdf", [0]), input("bad.pdf", [0])],
            [step("ok"), step("bad")],
            ops,
        );
        // First file fails at step index 1; second file also fails the same way.
        expect(res[0].status).toBe("failed");
        if (res[0].status === "failed") {
            expect(res[0].failedStepIndex).toBe(1);
            expect(res[0].opId).toBe("bad");
            expect(res[0].error).toBe("boom");
        }
    });

    it("only the failing file fails when inputs differ", async () => {
        // Op fails only on empty input.
        const failEmpty: PdfOperation<unknown> = {
            id: "fe", label: "fe", icon: (() => null) as never,
            inputType: "pdf", outputType: "pdf",
            defaultOptions: {},
            OptionsForm: (() => null) as never,
            run: async (b) => { if (b.length === 0) throw new Error("empty"); return b; },
        };
        const res = await runPipeline(
            [input("a.pdf", [1]), input("b.pdf", [])],
            [step("fe")],
            { fe: failEmpty },
        );
        expect(res[0].status).toBe("success");
        expect(res[1].status).toBe("failed");
    });

    it("emits file-start, step-done and file-done events", async () => {
        const ops = { a: appendByte("a", 1) };
        const events: ProgressEvent[] = [];
        await runPipeline([input("f.pdf", [0])], [step("a")], ops, (e) => events.push(e));
        expect(events.map((e) => e.type)).toEqual(["file-start", "step-done", "file-done"]);
    });

    it("does not start any file when the signal is already aborted", async () => {
        const ops = { a: appendByte("a", 1) };
        const controller = new AbortController();
        controller.abort();
        const res = await runPipeline([input("f.pdf", [0])], [step("a")], ops, undefined, controller.signal);
        expect(res).toHaveLength(0);
    });

    it("aborting mid-run keeps already-completed files and skips the rest", async () => {
        const ops = { a: appendByte("a", 1) };
        const controller = new AbortController();
        // Abort right after the first file finishes, before the second starts.
        const onProgress = (e: ProgressEvent) => {
            if (e.type === "file-done" && e.fileIndex === 0) controller.abort();
        };
        const res = await runPipeline(
            [input("a.pdf", [0]), input("b.pdf", [0])],
            [step("a")],
            ops,
            onProgress,
            controller.signal,
        );
        expect(res).toHaveLength(1);
        expect(res[0].name).toBe("a.pdf");
    });

    it("returns the input unchanged when there are no steps", async () => {
        const res = await runPipeline([input("f.pdf", [7, 8])], [], {});
        expect(res[0].status).toBe("success");
        if (res[0].status === "success") {
            expect([...res[0].bytes]).toEqual([7, 8]);
            expect(res[0].stepsRun).toBe(0);
        }
    });

    it("records an unknown operation id as a per-file failure", async () => {
        const res = await runPipeline([input("f.pdf", [0])], [step("missing")], {});
        expect(res[0].status).toBe("failed");
        if (res[0].status === "failed") {
            expect(res[0].opId).toBe("missing");
            expect(res[0].failedStepIndex).toBe(0);
            expect(res[0].error).toBe("Unknown operation: missing");
        }
    });
});
