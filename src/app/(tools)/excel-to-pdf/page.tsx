import { Metadata } from 'next';
import ExcelToPdfClient from './ExcelToPdfClient';

export const metadata: Metadata = {
    title: 'Excel to PDF - Convert Spreadsheet to PDF Online',
    description: 'Convert Excel spreadsheets to PDF format. Free, private, and runs entirely in your browser.',
    openGraph: {
        title: 'Excel to PDF - Convert Spreadsheet to PDF Online',
        description: 'Convert Excel spreadsheets to PDF format. Free, private, and runs entirely in your browser.',
    },
};

export default function ExcelToPdfPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF Excel to PDF",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "Convert Excel spreadsheets to PDF format."
                    })
                }}
            />
            <ExcelToPdfClient />
        </>
    );
}
