import { Metadata } from 'next';
import MergeClient from './MergeClient';

export const metadata: Metadata = {
    title: 'Merge PDF - Combine PDF Files Online',
    description: 'Combine multiple PDF files into one distinct PDF document. Free, no registration, no watermarks, secure online merging.',
    openGraph: {
        title: 'Merge PDF - Combine PDF Files Online',
        description: 'Combine multiple PDF files into one distinct PDF document. Free, no registration, no watermarks, secure online merging.',
        images: ['/og/merge-pdf.png'], // Ideal future improvement: add dynamic OG images
    },
};

export default function MergePage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF Merge",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "Combine multiple PDF files into one distinct PDF document."
                    })
                }}
            />
            <MergeClient />
        </>
    );
}
