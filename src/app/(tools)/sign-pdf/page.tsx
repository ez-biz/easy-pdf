import { Metadata } from 'next';
import SignClient from './SignClient';

export const metadata: Metadata = {
    title: 'Sign PDF - Add Signature to PDF Online',
    description: 'Sign PDF documents online for free. Draw, type, or upload your signature securely. No registration required.',
    openGraph: {
        title: 'Sign PDF - Add Signature to PDF Online',
        description: 'Sign PDF documents online for free. Draw, type, or upload your signature securely. No registration required.',
    },
};

export default function SignPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF Sign",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "Sign PDF documents online for free. Draw, type, or upload your signature securely."
                    })
                }}
            />
            <SignClient />
        </>
    );
}
