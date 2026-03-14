import { Metadata } from 'next';
import WordToPdfClient from './WordToPdfClient';

export const metadata: Metadata = {
    title: 'Word to PDF - Convert DOCX to PDF Online',
    description: 'Convert Word documents to PDF format. Free, private, and runs entirely in your browser.',
    openGraph: {
        title: 'Word to PDF - Convert DOCX to PDF Online',
        description: 'Convert Word documents to PDF format. Free, private, and runs entirely in your browser.',
    },
};

export default function WordToPdfPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF Word to PDF",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "Convert Word documents to PDF format. Free, private, and runs entirely in your browser."
                    })
                }}
            />
            <WordToPdfClient />
        </>
    );
}
