import { Metadata } from 'next';
import PdfToPptxClient from './PdfToPptxClient';

export const metadata: Metadata = {
    title: 'PDF to PowerPoint - Convert PDF to PPTX Online',
    description: 'Convert PDF pages to PowerPoint presentations. Each page becomes a slide. Free, private, and runs entirely in your browser.',
    openGraph: {
        title: 'PDF to PowerPoint - Convert PDF to PPTX Online',
        description: 'Convert PDF pages to PowerPoint presentations. Each page becomes a slide. Free, private, and runs entirely in your browser.',
    },
};

export default function PdfToPptxPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF PDF to PowerPoint",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "Convert PDF pages to PowerPoint presentations. Each page becomes a slide."
                    })
                }}
            />
            <PdfToPptxClient />
        </>
    );
}
