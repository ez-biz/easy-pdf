import { Metadata } from 'next';
import RotateClient from './RotateClient';

export const metadata: Metadata = {
    title: 'Rotate PDF - Rotate PDF Pages Online',
    description: 'Rotate PDF pages permanently. Rotate individual pages or the entire document 90, 180, or 270 degrees. Free online PDF rotator.',
    openGraph: {
        title: 'Rotate PDF - Rotate PDF Pages Online',
        description: 'Rotate PDF pages permanently. Rotate individual pages or the entire document 90, 180, or 270 degrees. Free online PDF rotator.',
    },
};

export default function RotatePage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF Rotate",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "Rotate PDF pages permanently online."
                    })
                }}
            />
            <RotateClient />
        </>
    );
}
