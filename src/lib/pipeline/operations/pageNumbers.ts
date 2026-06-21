import { Hash } from "lucide-react";
import { addPageNumbers } from "@/lib/pdf/pageNumbers";
import type { PdfOperation } from "../types";
import type { PageNumberFormOptions } from "./options";
import { bytesToFile } from "./bytes";

export const pageNumbersOp: PdfOperation<PageNumberFormOptions> = {
    id: "page-numbers", label: "Page numbers", icon: Hash,
    defaultOptions: { format: "number", position: "bottom-center", startNumber: 1 },
    OptionsForm: (() => null) as never,
    async run(input, options) {
        const res = await addPageNumbers(bytesToFile(input), {
            format: options.format, position: options.position, startNumber: options.startNumber,
        });
        if (!res.success || !res.data) throw new Error(res.error ?? "Page numbers failed");
        return res.data;
    },
};
