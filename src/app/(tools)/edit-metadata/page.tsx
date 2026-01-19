import { Metadata } from 'next';
import EditMetadataClient from './EditMetadataClient';

export const metadata: Metadata = {
    title: 'Edit PDF Metadata - Change PDF Properties',
    description: 'View and edit PDF metadata online. Change title, author, subject, keywords, and other document properties.',
    openGraph: {
        title: 'Edit PDF Metadata - Change PDF Properties',
        description: 'View and edit PDF metadata online. Change title, author, subject, keywords, and other document properties.',
    },
};

export default function EditMetadataPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF Edit Metadata",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "View and edit PDF metadata online."
                    })
                }}
            />
            <EditMetadataClient />
        </>
    );
}
