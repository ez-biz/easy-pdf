import { Metadata } from 'next';
import AddImageClient from './AddImageClient';

export const metadata: Metadata = {
    title: 'Add Image to PDF - Insert Images Online',
    description: 'Insert images into PDF documents. Overlay photos, logos, or signatures onto your PDF pages easily.',
    openGraph: {
        title: 'Add Image to PDF - Insert Images Online',
        description: 'Insert images into PDF documents. Overlay photos, logos, or signatures onto your PDF pages easily.',
    },
};

export default function AddImagePage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF Add Image",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "Insert images into PDF documents online."
                    })
                }}
            />
            <AddImageClient />
        </>
    );
}
