import { Metadata } from 'next';
import ExtractTextClient from './ExtractTextClient';

export const metadata: Metadata = {
    title: 'Extract Text from PDF - Free Online PDF Text Extractor',
    description: 'Extract plain text from any PDF document instantly. Works with scanned PDFs via OCR. Free and secure.',
    openGraph: {
        title: 'Extract Text from PDF - Free Online PDF Text Extractor',
        description: 'Extract plain text from any PDF document instantly. Works with scanned PDFs via OCR. Free and secure.',
    },
};

export default function ExtractTextPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF Extract Text",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
                        "description": "Extract plain text from any PDF document instantly."
                    })
                }}
            />
            <ExtractTextClient />
        </>
    );
}
