import { Unlock } from "lucide-react";
import { unlockPDF } from "@/lib/pdf/security";
import type { PdfOperation } from "../types";
import type { PasswordOptions } from "./options";
import { bytesToFile } from "./bytes";

export const unlockOp: PdfOperation<PasswordOptions> = {
    id: "unlock", label: "Unlock", icon: Unlock,
    defaultOptions: { password: "" },
    OptionsForm: (() => null) as never,
    async run(input, options) {
        const res = await unlockPDF(bytesToFile(input), options.password);
        if (!res.success || !res.data) throw new Error(res.error ?? "Unlock failed");
        return res.data;
    },
};
