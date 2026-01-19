import { Metadata } from 'next';
import AddWatermarkClient from './AddWatermarkClient';

export const metadata: Metadata = {
    title: 'Add Watermark - Stamp PDF Documents',
    description: 'Add text or image watermarks to your PDF files. Secure your documents with custom watermarks online for free.',
    openGraph: {
        title: 'Add Watermark - Stamp PDF Documents',
        description: 'Add text or image watermarks to your PDF files. Secure your documents with custom watermarks online for free.',
    },
};

export default function AddWatermarkPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF Add Watermark",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "Add text or image watermarks to your PDF files online."
                    })
                }}
            />
            <AddWatermarkClient />
        </>
    );
}
