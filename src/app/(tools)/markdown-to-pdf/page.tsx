import { Metadata } from 'next';
import MarkdownToPdfClient from './MarkdownToPdfClient';

export const metadata: Metadata = {
    title: 'Markdown to PDF - Convert MD to PDF Online',
    description: 'Convert Markdown documents to beautifully formatted PDFs. Free, fast, and browser-based.',
    openGraph: {
        title: 'Markdown to PDF - Convert MD to PDF Online',
        description: 'Convert Markdown documents to beautifully formatted PDFs. Free, fast, and browser-based.',
    },
};

export default function MarkdownToPdfPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF Markdown to PDF",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
                        "description": "Convert Markdown documents to beautifully formatted PDFs."
                    })
                }}
            />
            <MarkdownToPdfClient />
        </>
    );
}
