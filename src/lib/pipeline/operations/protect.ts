import { Lock } from "lucide-react";
import { protectPDF } from "@/lib/pdf/security";
import type { PdfOperation } from "../types";
import type { PasswordOptions } from "./options";
import { bytesToFile } from "./bytes";

export const protectOp: PdfOperation<PasswordOptions> = {
    id: "protect", label: "Protect", icon: Lock,
    defaultOptions: { password: "" },
    OptionsForm: (() => null) as never,
    async run(input, options) {
        if (!options.password) throw new Error("Password required");
        const res = await protectPDF(bytesToFile(input), { userPassword: options.password });
        if (!res.success || !res.data) throw new Error(res.error ?? "Protect failed");
        return res.data;
    },
};
