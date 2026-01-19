import { Metadata } from 'next';
import PDFToImageClient from './PDFToImageClient';

export const metadata: Metadata = {
    title: 'PDF to Image - Convert PDF to JPG, PNG, WEBP',
    description: 'Convert PDF pages to high-quality images (JPG, PNG, WEBP). Free online converter with custom DPI settings.',
    openGraph: {
        title: 'PDF to Image - Convert PDF to JPG, PNG, WEBP',
        description: 'Convert PDF pages to high-quality images (JPG, PNG, WEBP). Free online converter with custom DPI settings.',
    },
};

export default function PDFToImagePage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF PDF to Image",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "Convert PDF pages to high-quality images (JPG, PNG, WEBP)."
                    })
                }}
            />
            <PDFToImageClient />
        </>
    );
}
