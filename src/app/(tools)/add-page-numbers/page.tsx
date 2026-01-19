import { Metadata } from 'next';
import AddPageNumbersClient from './AddPageNumbersClient';

export const metadata: Metadata = {
    title: 'Add Page Numbers - Number PDF Pages',
    description: 'Add page numbers to your PDF documents easily. Customize position, format, and style of page numbering.',
    openGraph: {
        title: 'Add Page Numbers - Number PDF Pages',
        description: 'Add page numbers to your PDF documents easily. Customize position, format, and style of page numbering.',
    },
};

export default function AddPageNumbersPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF Add Page Numbers",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "Add page numbers to your PDF documents online."
                    })
                }}
            />
            <AddPageNumbersClient />
        </>
    );
}
