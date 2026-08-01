import { Metadata } from 'next';
import CreatePdfClient from './CreatePdfClient';

export const metadata: Metadata = {
    title: 'Create PDF - Make a Blank PDF Online',
    description: 'Create a new blank PDF document with custom page size and orientation. Free, no upload needed.',
    openGraph: {
        title: 'Create PDF - Make a Blank PDF Online',
        description: 'Create a new blank PDF document with custom page size and orientation. Free, no upload needed.',
    },
};

export default function CreatePdfPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF Create PDF",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
                        "description": "Create a new blank PDF document with custom page size and orientation."
                    })
                }}
            />
            <CreatePdfClient />
        </>
    );
}
