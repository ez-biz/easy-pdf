import { Metadata } from 'next';
import ScanToPdfClient from './ScanToPdfClient';

export const metadata: Metadata = {
    title: 'Scan Document to PDF - Camera to PDF Online',
    description: 'Use your camera to scan documents and save them as PDF. Free, fast, and entirely browser-based.',
    openGraph: {
        title: 'Scan Document to PDF - Camera to PDF Online',
        description: 'Use your camera to scan documents and save them as PDF. Free, fast, and entirely browser-based.',
    },
};

export default function ScanToPdfPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF Scan Document",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
                        "description": "Use your camera to scan documents and save them as PDF."
                    })
                }}
            />
            <ScanToPdfClient />
        </>
    );
}
