import { Metadata } from 'next';
import PdfToWordClient from './PdfToWordClient';

export const metadata: Metadata = {
    title: 'PDF to Word - Convert PDF to DOCX Online',
    description: 'Convert PDF files to editable Word documents. Extract text with formatting. Free, private, and runs entirely in your browser.',
    openGraph: {
        title: 'PDF to Word - Convert PDF to DOCX Online',
        description: 'Convert PDF files to editable Word documents. Extract text with formatting. Free, private, and runs entirely in your browser.',
        images: ['/og/pdf-to-word.png'],
    },
};

export default function PdfToWordPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF PDF to Word",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "Convert PDF files to editable Word documents. Extract text with formatting."
                    })
                }}
            />
            <PdfToWordClient />
        </>
    );
}
