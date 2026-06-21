import { Hash } from "lucide-react";
import { addPageNumbers } from "@/lib/pdf/pageNumbers";
import type { PdfOperation } from "../types";
import type { PageNumbersOptions } from "./options";
import { bytesToFile } from "./bytes";
import { PageNumbersForm } from "./forms/PageNumbersForm";

export const pageNumbersOp: PdfOperation<PageNumbersOptions> = {
    id: "page-numbers", label: "Page numbers", icon: Hash,
    defaultOptions: { format: "number", position: "bottom-center", startNumber: 1 },
    OptionsForm: PageNumbersForm,
    async run(input, options) {
        const res = await addPageNumbers(bytesToFile(input), {
            format: options.format, position: options.position, startNumber: options.startNumber,
        });
        if (!res.success || !res.data) throw new Error(res.error ?? "Page numbers failed");
        return res.data;
    },
};
