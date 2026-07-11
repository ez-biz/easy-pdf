import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { buildZip, withExtension } from "../zipResults";
import type { FileStatus } from "../types";

const ok = (name: string): FileStatus => ({
    name, status: "success", bytes: new Uint8Array([1, 2, 3]), stepsRun: 1,
});
const fail = (name: string): FileStatus => ({
    name, status: "failed", failedStepIndex: 0, opId: "x", error: "no",
});

describe("buildZip", () => {
    it("includes only successes", () => {
        const zip = buildZip([ok("a.pdf"), fail("b.pdf"), ok("c.pdf")]);
        expect(Object.keys(zip.files).sort()).toEqual(["a.pdf", "c.pdf"]);
    });

    it("de-duplicates colliding names", () => {
        const zip = buildZip([ok("report.pdf"), ok("report.pdf")]);
        expect(Object.keys(zip.files).sort()).toEqual(["report (1).pdf", "report.pdf"]);
    });

    it("handles a 3-way collision including a pre-existing numbered name", () => {
        const zip = buildZip([ok("report.pdf"), ok("report (1).pdf"), ok("report.pdf")]);
        expect(Object.keys(zip.files).sort()).toEqual([
            "report (1).pdf", "report (2).pdf", "report.pdf",
        ]);
    });

    it("round-trips through JSZip", async () => {
        const blob = await buildZip([ok("a.pdf")]).generateAsync({ type: "uint8array" });
        const reloaded = await JSZip.loadAsync(blob);
        expect(Object.keys(reloaded.files)).toEqual(["a.pdf"]);
    });
});

describe("withExtension", () => {
    it("swaps the extension", () => {
        expect(withExtension("report.pdf", "docx")).toBe("report.docx");
    });
    it("appends when there is no extension", () => {
        expect(withExtension("report", "docx")).toBe("report.docx");
    });
    it("only replaces the final extension", () => {
        expect(withExtension("my.report.pdf", "docx")).toBe("my.report.docx");
    });
});

describe("buildZip with outputExt", () => {
    it("renames entries to the output extension", () => {
        const zip = buildZip([ok("report.pdf")], "docx");
        expect(Object.keys(zip.files)).toEqual(["report.docx"]);
    });
    it("de-duplicates after the extension swap", () => {
        const zip = buildZip([ok("report.pdf"), ok("report.pdf")], "docx");
        expect(Object.keys(zip.files).sort()).toEqual(["report (1).docx", "report.docx"]);
    });
});
