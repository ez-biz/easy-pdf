import { Metadata } from 'next';
import SplitClient from './SplitClient';

export const metadata: Metadata = {
    title: 'Split PDF - Separate PDF Pages Online',
    description: 'Split specific page ranges or extract every page into separate PDF documents. Free, fast, and secure.',
    openGraph: {
        title: 'Split PDF - Separate PDF Pages Online',
        description: 'Split specific page ranges or extract every page into separate PDF documents. Free, fast, and secure.',
    },
};

export default function SplitPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF Split",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "Split specific page ranges or extract every page into separate PDF documents."
                    })
                }}
            />
            <SplitClient />
        </>
    );
}
