import { Metadata } from 'next';
import ProtectClient from './ProtectClient';

export const metadata: Metadata = {
    title: 'Protect PDF - Encrypt and Password Protect PDF',
    description: 'Secure your PDF files with password protection entirely in your browser. Encrypt PDF documents safely without uploading to any server.',
    openGraph: {
        title: 'Protect PDF - Encrypt and Password Protect PDF',
        description: 'Secure your PDF files with password protection entirely in your browser. Encrypt PDF documents safely without uploading to any server.',
    },
};

export default function ProtectPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF Protect",
                        "applicationCategory": "SecurityApplication",
                        "operatingSystem": "Any",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "Secure your PDF files with password protection entirely in your browser."
                    })
                }}
            />
            <ProtectClient />
        </>
    );
}
