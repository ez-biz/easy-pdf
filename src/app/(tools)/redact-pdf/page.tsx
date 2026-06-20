import { Metadata } from "next";
import RedactClient from "./RedactClient";

export const metadata: Metadata = {
    title: "Redact PDF - Permanently Remove Sensitive Content",
    description:
        "Black out and permanently remove sensitive text or images from a PDF, entirely in your browser. Redacted content is truly gone, not just covered.",
    openGraph: {
        title: "Redact PDF - Permanently Remove Sensitive Content",
        description:
            "Black out and permanently remove sensitive text or images from a PDF, entirely in your browser.",
    },
};

export default function RedactPdfPage() {
    return <RedactClient />;
}
