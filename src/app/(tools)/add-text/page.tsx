import { Metadata } from 'next';
import AddTextClient from './AddTextClient';

export const metadata: Metadata = {
    title: 'Add Text to PDF - Write on PDF Online',
    description: 'Add text to your PDF documents. Fill forms, add comments, or insert new text content to your PDF files online.',
    openGraph: {
        title: 'Add Text to PDF - Write on PDF Online',
        description: 'Add text to your PDF documents. Fill forms, add comments, or insert new text content to your PDF files online.',
    },
};

export default function AddTextPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF Add Text",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "Add text to your PDF documents online."
                    })
                }}
            />
            <AddTextClient />
        </>
    );
}
