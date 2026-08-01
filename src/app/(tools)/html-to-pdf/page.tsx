import { Metadata } from 'next';
import HtmlToPdfClient from './HtmlToPdfClient';

export const metadata: Metadata = {
    title: 'HTML to PDF - Convert Web Pages to PDF Online',
    description: 'Convert HTML code to a PDF document. Paste your HTML and get a PDF instantly. Free and secure.',
    openGraph: {
        title: 'HTML to PDF - Convert Web Pages to PDF Online',
        description: 'Convert HTML code to a PDF document. Paste your HTML and get a PDF instantly.',
    },
};

export default function HtmlToPdfPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF HTML to PDF",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
                        "description": "Convert HTML code to a PDF document."
                    })
                }}
            />
            <HtmlToPdfClient />
        </>
    );
}
