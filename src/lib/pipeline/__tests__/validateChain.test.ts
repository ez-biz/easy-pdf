import { describe, it, expect } from "vitest";
import { validateChain } from "../validateChain";
import type { MediaType, PdfOperation, PipelineStep } from "../types";

const mk = (id: string, label: string, inputType: MediaType, outputType: MediaType, terminal = false) =>
    ({ id, label, inputType, outputType, terminal }) as unknown as PdfOperation;

const OPS: Record<string, PdfOperation> = {
    compress: mk("compress", "Compress", "pdf", "pdf"),
    rotate: mk("rotate", "Rotate", "pdf", "pdf"),
    protect: mk("protect", "Protect", "pdf", "pdf"),
    unlock: mk("unlock", "Unlock", "pdf", "pdf"),
    "pdf-to-word": mk("pdf-to-word", "PDF to Word", "pdf", "docx", true),
    "needs-docx": mk("needs-docx", "Word Edit", "docx", "docx"),
};

const step = (opId: string): PipelineStep => ({ id: `${opId}-1`, opId, options: {} });

describe("validateChain", () => {
    it("accepts a valid count-preserving PDF chain", () => {
        const { errors, warnings } = validateChain([step("compress"), step("rotate")], OPS);
        expect(errors).toEqual([]);
        expect(warnings).toEqual([]);
    });

    it("accepts a chain ending in a terminal conversion", () => {
        const { errors } = validateChain([step("compress"), step("pdf-to-word")], OPS);
        expect(errors).toEqual([]);
    });

    it("rejects a step after a terminal step", () => {
        const { errors } = validateChain([step("pdf-to-word"), step("rotate")], OPS);
        expect(errors).toContain('Nothing can run after "PDF to Word" — it must be the last step.');
    });

    it("rejects a type mismatch (docx-input step on a PDF)", () => {
        const { errors } = validateChain([step("needs-docx")], OPS);
        expect(errors).toContain('"Word Edit" can\'t run on the uploaded PDF.');
    });

    it("blocks Protect when it is not the last step", () => {
        const { errors } = validateChain([step("protect"), step("compress")], OPS);
        expect(errors.some((e) => e.startsWith('Move "Protect"'))).toBe(true);
    });

    it("allows Protect as the last step", () => {
        const { errors } = validateChain([step("compress"), step("protect")], OPS);
        expect(errors.some((e) => e.startsWith('Move "Protect"'))).toBe(false);
    });

    it("warns (not errors) when Unlock is not first", () => {
        const { errors, warnings } = validateChain([step("compress"), step("unlock")], OPS);
        expect(errors).toEqual([]);
        expect(warnings).toContain("Unlock usually works best as the first step.");
    });
});
