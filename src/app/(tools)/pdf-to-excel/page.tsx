import { Metadata } from 'next';
import PdfToExcelClient from './PdfToExcelClient';

export const metadata: Metadata = {
    title: 'PDF to Excel - Extract PDF Data to Spreadsheet',
    description: 'Extract data and tables from PDF files to Excel spreadsheets. Free, private, and runs entirely in your browser.',
    openGraph: {
        title: 'PDF to Excel - Extract PDF Data to Spreadsheet',
        description: 'Extract data and tables from PDF files to Excel spreadsheets. Free, private, and runs entirely in your browser.',
        images: ['/og/pdf-to-excel.png'],
    },
};

export default function PdfToExcelPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF PDF to Excel",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "Extract data and tables from PDF files to Excel spreadsheets."
                    })
                }}
            />
            <PdfToExcelClient />
        </>
    );
}
