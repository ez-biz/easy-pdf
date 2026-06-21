import { Droplets } from "lucide-react";
import { addTextWatermark } from "@/lib/pdf/watermark";
import type { PdfOperation } from "../types";
import type { WatermarkOptions } from "./options";
import { bytesToFile } from "./bytes";
import { WatermarkForm } from "./forms/WatermarkForm";

export const watermarkOp: PdfOperation<WatermarkOptions> = {
    id: "watermark", label: "Watermark", icon: Droplets,
    defaultOptions: { text: "CONFIDENTIAL", opacity: 0.3, position: "diagonal" },
    OptionsForm: WatermarkForm,
    async run(input, options) {
        const res = await addTextWatermark(bytesToFile(input), {
            text: options.text, opacity: options.opacity, position: options.position,
        });
        if (!res.success || !res.data) throw new Error(res.error ?? "Watermark failed");
        return res.data;
    },
};
