import { Metadata } from 'next';
import RemovePagesClient from './RemovePagesClient';

export const metadata: Metadata = {
    title: 'Remove Pages - Delete PDF Pages Online',
    description: 'Delete unwanted pages from PDF documents. Remove specific pages or page ranges from your PDF quickly and easily.',
    openGraph: {
        title: 'Remove Pages - Delete PDF Pages Online',
        description: 'Delete unwanted pages from PDF documents. Remove specific pages or page ranges from your PDF quickly and easily.',
    },
};

export default function RemovePagesPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF Remove Pages",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "Delete unwanted pages from PDF documents online."
                    })
                }}
            />
            <RemovePagesClient />
        </>
    );
}
