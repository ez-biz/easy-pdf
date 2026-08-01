import { Metadata } from 'next';
import CropResizeClient from './CropResizeClient';

export const metadata: Metadata = {
    title: 'Crop & Resize PDF - Trim PDF Pages Online',
    description: 'Crop margins and resize PDF pages to custom dimensions. Free, fast, and entirely browser-based.',
    openGraph: {
        title: 'Crop & Resize PDF - Trim PDF Pages Online',
        description: 'Crop margins and resize PDF pages to custom dimensions. Free, fast, and entirely browser-based.',
    },
};

export default function CropResizePage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF Crop & Resize",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
                        "description": "Crop margins and resize PDF pages to custom dimensions."
                    })
                }}
            />
            <CropResizeClient />
        </>
    );
}
