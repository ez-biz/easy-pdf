import { Metadata } from 'next';
import ExtractPagesClient from './ExtractPagesClient';

export const metadata: Metadata = {
    title: 'Extract Pages - Split PDF Pages Online',
    description: 'Extract pages from PDF documents to create a new PDF. Select specific pages to keep and save them as a separate file.',
    openGraph: {
        title: 'Extract Pages - Split PDF Pages Online',
        description: 'Extract pages from PDF documents to create a new PDF. Select specific pages to keep and save them as a separate file.',
    },
};

export default function ExtractPagesPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF Extract Pages",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "Extract pages from PDF documents online."
                    })
                }}
            />
            <ExtractPagesClient />
        </>
    );
}
