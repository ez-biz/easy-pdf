import { Metadata } from 'next';
import InvertPdfClient from './InvertPdfClient';

export const metadata: Metadata = {
    title: 'Invert PDF Colours - Switch to Dark Mode PDF',
    description: 'Invert the colours of your PDF — turn white backgrounds to black for dark mode reading. Free and secure.',
    openGraph: {
        title: 'Invert PDF Colours - Switch to Dark Mode PDF',
        description: 'Invert the colours of your PDF — turn white backgrounds to black for dark mode reading.',
    },
};

export default function InvertPdfPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF Invert PDF",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
                        "description": "Invert the colours of your PDF for dark mode reading."
                    })
                }}
            />
            <InvertPdfClient />
        </>
    );
}
