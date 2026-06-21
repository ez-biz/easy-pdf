import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { buildZip } from "../zipResults";
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

    it("round-trips through JSZip", async () => {
        const blob = await buildZip([ok("a.pdf")]).generateAsync({ type: "uint8array" });
        const reloaded = await JSZip.loadAsync(blob);
        expect(Object.keys(reloaded.files)).toEqual(["a.pdf"]);
    });
});
