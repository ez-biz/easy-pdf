import { Metadata } from 'next';
import ImageToPDFClient from './ImageToPDFClient';

export const metadata: Metadata = {
    title: 'Image to PDF - Convert JPG, PNG to PDF',
    description: 'Convert images to PDF online. Supports JPG, PNG, WEBP, and more. Combine multiple images into a single PDF document.',
    openGraph: {
        title: 'Image to PDF - Convert JPG, PNG to PDF',
        description: 'Convert images to PDF online. Supports JPG, PNG, WEBP, and more. Combine multiple images into a single PDF document.',
    },
};

export default function ImageToPDFPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF Image to PDF",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "Convert images to PDF online. Supports JPG, PNG, WEBP, and more."
                    })
                }}
            />
            <ImageToPDFClient />
        </>
    );
}
