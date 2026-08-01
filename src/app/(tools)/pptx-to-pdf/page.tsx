import { Metadata } from 'next';
import PptxToPdfClient from './PptxToPdfClient';

export const metadata: Metadata = {
    title: 'PowerPoint to PDF - Convert PPTX to PDF Online',
    description: 'Convert PowerPoint presentations to PDF format. Free, fast, and secure — all processing happens in your browser.',
    openGraph: {
        title: 'PowerPoint to PDF - Convert PPTX to PDF Online',
        description: 'Convert PowerPoint presentations to PDF format. Free, fast, and secure.',
    },
};

export default function PptxToPdfPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF PPTX to PDF",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
                        "description": "Convert PowerPoint presentations to PDF format."
                    })
                }}
            />
            <PptxToPdfClient />
        </>
    );
}
