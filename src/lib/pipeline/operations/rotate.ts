import { RotateCw } from "lucide-react";
import { PDFDocument } from "@cantoo/pdf-lib";
import { rotatePDF, type RotationAngle } from "@/lib/pdf/rotate";
import type { PdfOperation } from "../types";
import type { RotateOptions } from "./options";
import { bytesToFile } from "./bytes";

export const rotateOp: PdfOperation<RotateOptions> = {
    id: "rotate", label: "Rotate", icon: RotateCw,
    defaultOptions: { angle: 90, scope: "all" },
    OptionsForm: (() => null) as never,
    async run(input, options) {
        const file = bytesToFile(input);
        let rotations: Map<number, RotationAngle> | RotationAngle = options.angle;
        if (options.scope !== "all") {
            const count = (await PDFDocument.load(input)).getPageCount();
            const map = new Map<number, RotationAngle>();
            for (let i = 0; i < count; i++) {
                const isOdd = (i + 1) % 2 === 1; // 1-based page numbers
                if ((options.scope === "odd" && isOdd) || (options.scope === "even" && !isOdd)) {
                    map.set(i, options.angle);
                }
            }
            rotations = map;
        }
        const res = await rotatePDF(file, rotations);
        if (!res.success || !res.data) throw new Error(res.error ?? "Rotate failed");
        return res.data;
    },
};
