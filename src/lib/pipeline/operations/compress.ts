import { Minimize2 } from "lucide-react";
import { compressPDF } from "@/lib/pdf/compress";
import type { PdfOperation } from "../types";
import type { CompressOptions } from "./options";
import { bytesToFile } from "./bytes";

export const compressOp: PdfOperation<CompressOptions> = {
    id: "compress", label: "Compress", icon: Minimize2, defaultOptions: {},
    OptionsForm: (() => null) as never, // replaced in Task 5
    async run(input, _options) {
        const res = await compressPDF(bytesToFile(input));
        if (!res.success || !res.data) throw new Error(res.error ?? "Compress failed");
        return res.data;
    },
};
