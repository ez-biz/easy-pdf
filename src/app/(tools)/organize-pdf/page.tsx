import { Metadata } from 'next';
import OrganizeClient from './OrganizeClient';

export const metadata: Metadata = {
    title: 'Organize PDF - Rotate, Reorder, Remove Pages',
    description: 'Organize PDF pages online. Rotate, reorder, sort, and remove PDF pages. Free and secure online PDF organizer.',
    openGraph: {
        title: 'Organize PDF - Rotate, Reorder, Remove Pages',
        description: 'Organize PDF pages online. Rotate, reorder, sort, and remove PDF pages. Free and secure online PDF organizer.',
    },
};

export default function OrganizePage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF Organize",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "Organize PDF pages online. Rotate, reorder, sort, and remove PDF pages."
                    })
                }}
            />
            <OrganizeClient />
        </>
    );
}
