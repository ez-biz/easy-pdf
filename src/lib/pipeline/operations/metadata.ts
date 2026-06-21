import { Edit3 } from "lucide-react";
import { updateMetadata } from "@/lib/pdf/metadata";
import type { PdfOperation } from "../types";
import type { MetadataOptions } from "./options";
import { bytesToFile } from "./bytes";
import { MetadataForm } from "./forms/MetadataForm";

export const metadataOp: PdfOperation<MetadataOptions> = {
    id: "metadata", label: "Edit metadata", icon: Edit3,
    defaultOptions: { title: "", author: "", subject: "", keywords: "" },
    OptionsForm: MetadataForm,
    async run(input, options) {
        const res = await updateMetadata(bytesToFile(input), options);
        if (!res.success || !res.data) throw new Error(res.error ?? "Metadata failed");
        return res.data;
    },
};
