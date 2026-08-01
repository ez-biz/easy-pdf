import { Metadata } from 'next';
import FlattenPdfClient from './FlattenPdfClient';

export const metadata: Metadata = {
    title: 'Flatten PDF - Merge Annotations & Forms into PDF',
    description: 'Flatten PDF annotations, form fields, and layers into the document permanently. Free and secure browser-based tool.',
    openGraph: {
        title: 'Flatten PDF - Merge Annotations & Forms into PDF',
        description: 'Flatten PDF annotations, form fields, and layers into the document permanently.',
    },
};

export default function FlattenPdfPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF Flatten PDF",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
                        "description": "Flatten PDF annotations, form fields, and layers into the document permanently."
                    })
                }}
            />
            <FlattenPdfClient />
        </>
    );
}
