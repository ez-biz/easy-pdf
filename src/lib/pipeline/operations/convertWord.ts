import { FileText } from "lucide-react";
import { pdfToWord } from "@/lib/pdf/convert";
import type { PdfOperation } from "../types";

export const convertWordOp: PdfOperation = {
    id: "pdf-to-word", label: "PDF to Word", icon: FileText,
    inputType: "pdf", outputType: "docx", terminal: true,
    defaultOptions: {},
    OptionsForm: () => null,
    async run(input) {
        return (await pdfToWord(input)).bytes;
    },
};
