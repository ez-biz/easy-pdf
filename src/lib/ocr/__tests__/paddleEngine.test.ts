import { describe, it, expect, vi, beforeEach } from "vitest";

const initializeMock = vi.fn();
const recognizeMock = vi.fn();
// NB: must be a regular function (not an arrow) so it is callable with `new`.
const PaddleOcrServiceMock = vi.fn(function () {
    return { initialize: initializeMock, recognize: recognizeMock };
});

vi.mock("ppu-paddle-ocr/web", () => ({
    PaddleOcrService: PaddleOcrServiceMock,
}));

import { paddleEngine } from "@/lib/ocr/paddleEngine";

describe("paddleEngine", () => {
    beforeEach(() => {
        PaddleOcrServiceMock.mockClear();
        initializeMock.mockReset().mockResolvedValue(undefined);
        recognizeMock.mockReset();
        paddleEngine.terminate();
        // jsdom canvas.toBlob is not implemented — stub it.
        HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback) {
            cb(new Blob(["x"], { type: "image/png" }));
        };
    });

    it("initializes the service once and normalizes flattened results", async () => {
        recognizeMock.mockResolvedValue({
            text: "hola mundo",
            confidence: 0.95,
            results: [
                { text: "hola", confidence: 0.9 },
                { text: "mundo", confidence: 1 },
            ],
        });
        const canvas = document.createElement("canvas");

        const r1 = await paddleEngine.recognize(canvas, "eng");
        const r2 = await paddleEngine.recognize(canvas, "eng");

        expect(r1.text).toBe("hola mundo");
        expect(r1.confidence).toBeCloseTo(0.95);
        expect(r1.lines).toEqual([
            { text: "hola", confidence: 0.9 },
            { text: "mundo", confidence: 1 },
        ]);
        expect(r2.text).toBe("hola mundo");
        // Singleton: constructed and initialized exactly once across calls.
        expect(PaddleOcrServiceMock).toHaveBeenCalledTimes(1);
        expect(initializeMock).toHaveBeenCalledTimes(1);
    });

    it("passes self-hosted model paths and calls recognize with an ArrayBuffer + flatten", async () => {
        recognizeMock.mockResolvedValue({ text: "x", confidence: 1, results: [] });
        const canvas = document.createElement("canvas");
        await paddleEngine.recognize(canvas, "eng");

        expect(PaddleOcrServiceMock).toHaveBeenCalledWith(
            expect.objectContaining({
                model: expect.objectContaining({
                    recognition: expect.stringContaining("/models/ppocr/"),
                }),
            })
        );
        const [img, opts] = recognizeMock.mock.calls[0];
        expect(img).toBeInstanceOf(ArrayBuffer);
        expect(opts).toMatchObject({ flatten: true });
    });
});
