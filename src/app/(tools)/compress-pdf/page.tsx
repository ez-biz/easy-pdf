import { Metadata } from 'next';
import CompressClient from './CompressClient';

export const metadata: Metadata = {
    title: 'Compress PDF - Reduce PDF Size Online',
    description: 'Compress PDF files to reduce file size while maintaining quality. Optimize PDFs for web and email. Free and secure.',
    openGraph: {
        title: 'Compress PDF - Reduce PDF Size Online',
        description: 'Compress PDF files to reduce file size while maintaining quality. Optimize PDFs for web and email. Free and secure.',
    },
};

export default function CompressPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF Compress",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "Compress PDF files to reduce file size while maintaining quality."
                    })
                }}
            />
            <CompressClient />
        </>
    );
}
