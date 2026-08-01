import { Metadata } from 'next';
import EbookToPdfClient from './EbookToPdfClient';

export const metadata: Metadata = {
    title: 'eBook to PDF - Convert EPUB to PDF Online',
    description: 'Convert EPUB eBooks to PDF format. Free, fast, and secure — all conversion happens in your browser.',
    openGraph: {
        title: 'eBook to PDF - Convert EPUB to PDF Online',
        description: 'Convert EPUB eBooks to PDF format. Free, fast, and secure.',
    },
};

export default function EbookToPdfPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF eBook to PDF",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
                        "description": "Convert EPUB eBooks to PDF format."
                    })
                }}
            />
            <EbookToPdfClient />
        </>
    );
}
