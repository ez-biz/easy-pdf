import { Presentation } from "lucide-react";
import { pdfToPptx } from "@/lib/pdf/convert";
import type { PdfOperation } from "../types";

export const convertPptxOp: PdfOperation = {
    id: "pdf-to-pptx", label: "PDF to PowerPoint", icon: Presentation,
    inputType: "pdf", outputType: "pptx", terminal: true,
    defaultOptions: {},
    OptionsForm: () => null,
    async run(input) {
        return (await pdfToPptx(input)).bytes;
    },
};
