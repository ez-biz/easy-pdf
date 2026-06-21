import { Metadata } from "next";
import BatchClient from "./BatchClient";

export const metadata: Metadata = {
    title: "Batch Process PDFs - Chain Operations Across Many Files",
    description:
        "Drop many PDFs, build a chain of operations (compress, rotate, watermark, page numbers, metadata, protect, unlock), run them all at once, and download a zip. Entirely in your browser.",
    openGraph: {
        title: "Batch Process PDFs - Chain Operations Across Many Files",
        description: "Run a chain of PDF operations across many files at once, entirely in your browser.",
    },
};

export default function BatchPage() {
    return <BatchClient />;
}
