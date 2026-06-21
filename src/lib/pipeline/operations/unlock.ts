import { Unlock } from "lucide-react";
import { unlockPDF } from "@/lib/pdf/security";
import type { PdfOperation } from "../types";
import type { PasswordOptions } from "./options";
import { bytesToFile } from "./bytes";
import { PasswordForm } from "./forms/PasswordForm";

export const unlockOp: PdfOperation<PasswordOptions> = {
    id: "unlock", label: "Unlock", icon: Unlock,
    defaultOptions: { password: "" },
    OptionsForm: PasswordForm,
    async run(input, options) {
        const res = await unlockPDF(bytesToFile(input), options.password);
        if (!res.success || !res.data) throw new Error(res.error ?? "Unlock failed");
        return res.data;
    },
};
