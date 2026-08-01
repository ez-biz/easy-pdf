import { Metadata } from 'next';
import PdfToEpubClient from './PdfToEpubClient';

export const metadata: Metadata = {
    title: 'PDF to EPUB - Convert PDF to eBook Online',
    description: 'Convert PDF documents to EPUB format for e-readers. Free, fast, and secure browser-based tool.',
    openGraph: {
        title: 'PDF to EPUB - Convert PDF to eBook Online',
        description: 'Convert PDF documents to EPUB format for e-readers. Free, fast, and secure.',
    },
};

export default function PdfToEpubPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF PDF to EPUB",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
                        "description": "Convert PDF documents to EPUB format for e-readers."
                    })
                }}
            />
            <PdfToEpubClient />
        </>
    );
}
