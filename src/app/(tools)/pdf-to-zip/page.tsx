import { Metadata } from 'next';
import PdfToZipClient from './PdfToZipClient';

export const metadata: Metadata = {
    title: 'PDF to ZIP - Compress PDFs into ZIP Archive',
    description: 'Package multiple PDF files into a single ZIP archive for easy sharing. Free, fast, and secure — all processing happens in your browser.',
    openGraph: {
        title: 'PDF to ZIP - Compress PDFs into ZIP Archive',
        description: 'Package multiple PDF files into a single ZIP archive for easy sharing. Free, fast, and secure.',
    },
};

export default function PdfToZipPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF PDF to ZIP",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "Package multiple PDF files into a single ZIP archive."
                    })
                }}
            />
            <PdfToZipClient />
        </>
    );
}
