import { Metadata } from 'next';
import UnlockClient from './UnlockClient';

export const metadata: Metadata = {
    title: 'Unlock PDF - Remove Password from PDF',
    description: 'Remove password protection from PDF files instantly. Unlock encrypted PDFs online for free without installing software.',
    openGraph: {
        title: 'Unlock PDF - Remove Password from PDF',
        description: 'Remove password protection from PDF files instantly. Unlock encrypted PDFs online for free without installing software.',
    },
};

export default function UnlockPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF Unlock",
                        "applicationCategory": "SecurityApplication",
                        "operatingSystem": "Any",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "Remove password protection from PDF files instantly."
                    })
                }}
            />
            <UnlockClient />
        </>
    );
}
