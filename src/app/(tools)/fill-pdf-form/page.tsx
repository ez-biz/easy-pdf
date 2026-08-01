import { Metadata } from 'next';
import FillPdfFormClient from './FillPdfFormClient';

export const metadata: Metadata = {
    title: 'Fill PDF Form - Complete PDF Forms Online',
    description: 'Fill interactive PDF form fields directly in your browser. No software needed — free and secure.',
    openGraph: {
        title: 'Fill PDF Form - Complete PDF Forms Online',
        description: 'Fill interactive PDF form fields directly in your browser. No software needed — free and secure.',
    },
};

export default function FillPdfFormPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF Fill PDF Form",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
                        "description": "Fill interactive PDF form fields directly in your browser."
                    })
                }}
            />
            <FillPdfFormClient />
        </>
    );
}
