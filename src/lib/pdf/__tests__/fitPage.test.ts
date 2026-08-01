import { describe, it, expect } from "vitest";
import { fitImageToPage, A4_SHORT, A4_LONG } from "../fitPage";

describe("fitImageToPage", () => {
    // REGRESSION: pages used to be created at the image's raw pixel size, so a
    // 1920x1080 capture produced a ~26x15 inch page instead of a sheet of paper.
    it("puts a 1080p capture on an A4 sheet, not a 26x15in page", () => {
        const fit = fitImageToPage(1920, 1080);
        expect(fit.pageWidth).toBe(A4_LONG);
        expect(fit.pageHeight).toBe(A4_SHORT);
        expect(fit.pageWidth / 72).toBeLessThan(12);
        expect(fit.pageHeight / 72).toBeLessThan(12);
    });

    it("uses landscape A4 for a landscape image", () => {
        const fit = fitImageToPage(1600, 900);
        expect([fit.pageWidth, fit.pageHeight]).toEqual([A4_LONG, A4_SHORT]);
    });

    it("uses portrait A4 for a portrait image", () => {
        const fit = fitImageToPage(900, 1600);
        expect([fit.pageWidth, fit.pageHeight]).toEqual([A4_SHORT, A4_LONG]);
    });

    it("treats a square image as portrait", () => {
        const fit = fitImageToPage(1000, 1000);
        expect([fit.pageWidth, fit.pageHeight]).toEqual([A4_SHORT, A4_LONG]);
    });

    it("preserves the source aspect ratio", () => {
        const fit = fitImageToPage(1920, 1080);
        expect(fit.drawWidth / fit.drawHeight).toBeCloseTo(1920 / 1080, 6);
    });

    it("never overflows the page", () => {
        for (const [w, h] of [
            [1920, 1080],
            [640, 480],
            [3000, 200],
            [200, 3000],
            [1, 1],
        ]) {
            const fit = fitImageToPage(w, h);
            expect(fit.drawWidth).toBeLessThanOrEqual(fit.pageWidth + 1e-9);
            expect(fit.drawHeight).toBeLessThanOrEqual(fit.pageHeight + 1e-9);
            expect(fit.x).toBeGreaterThanOrEqual(-1e-9);
            expect(fit.y).toBeGreaterThanOrEqual(-1e-9);
        }
    });

    it("centres the image on the page", () => {
        const fit = fitImageToPage(1000, 500);
        expect(fit.x * 2 + fit.drawWidth).toBeCloseTo(fit.pageWidth, 6);
        expect(fit.y * 2 + fit.drawHeight).toBeCloseTo(fit.pageHeight, 6);
    });

    it("fits an extreme panorama to the page width", () => {
        const fit = fitImageToPage(3000, 200);
        expect(fit.drawWidth).toBeCloseTo(fit.pageWidth, 6);
        expect(fit.y).toBeGreaterThan(0); // letterboxed vertically
    });

    it("scales small images up to fill the sheet", () => {
        const fit = fitImageToPage(100, 150);
        expect(fit.drawHeight).toBeCloseTo(A4_LONG, 6);
    });
});
