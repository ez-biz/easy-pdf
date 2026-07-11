import { FileSpreadsheet } from "lucide-react";
import { pdfToExcel } from "@/lib/pdf/convert";
import type { PdfOperation } from "../types";

export const convertExcelOp: PdfOperation = {
    id: "pdf-to-excel", label: "PDF to Excel", icon: FileSpreadsheet,
    inputType: "pdf", outputType: "xlsx", terminal: true,
    defaultOptions: {},
    OptionsForm: () => null,
    async run(input) {
        return (await pdfToExcel(input)).bytes;
    },
};
