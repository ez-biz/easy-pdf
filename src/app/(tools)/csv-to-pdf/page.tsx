import { Metadata } from 'next';
import CsvToPdfClient from './CsvToPdfClient';

export const metadata: Metadata = {
    title: 'CSV to PDF - Convert Spreadsheets to PDF Online',
    description: 'Convert CSV data into a clean, formatted PDF table. Free, fast, and secure browser-based converter.',
    openGraph: {
        title: 'CSV to PDF - Convert Spreadsheets to PDF Online',
        description: 'Convert CSV data into a clean, formatted PDF table. Free, fast, and secure.',
    },
};

export default function CsvToPdfPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF CSV to PDF",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
                        "description": "Convert CSV data into a clean, formatted PDF table."
                    })
                }}
            />
            <CsvToPdfClient />
        </>
    );
}
