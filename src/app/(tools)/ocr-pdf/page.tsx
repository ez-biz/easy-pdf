import { Metadata } from 'next';
import OcrClient from './OcrClient';

export const metadata: Metadata = {
    title: 'OCR PDF - Extract Text from Scanned PDFs',
    description: 'Use OCR to extract text from scanned PDF documents. Supports multiple languages. Free, private, and runs entirely in your browser.',
    openGraph: {
        title: 'OCR PDF - Extract Text from Scanned PDFs',
        description: 'Use OCR to extract text from scanned PDF documents. Supports multiple languages. Free, private, and runs entirely in your browser.',
    },
};

export default function OcrPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF OCR",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "Use OCR to extract text from scanned PDF documents. Supports multiple languages."
                    })
                }}
            />
            <OcrClient />
        </>
    );
}
