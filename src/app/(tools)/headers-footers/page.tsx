import { Metadata } from 'next';
import HeadersFootersClient from './HeadersFootersClient';

export const metadata: Metadata = {
    title: 'Headers & Footers - Add to PDF Online',
    description: 'Add custom headers and footers to every page of your PDF. Free and secure browser-based tool.',
    openGraph: {
        title: 'Headers & Footers - Add to PDF Online',
        description: 'Add custom headers and footers to every page of your PDF. Free and secure browser-based tool.',
    },
};

export default function HeadersFootersPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "EasyPDF Headers & Footers",
                        "applicationCategory": "ProductivityApplication",
                        "operatingSystem": "Any",
                        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
                        "description": "Add custom headers and footers to every page of your PDF."
                    })
                }}
            />
            <HeadersFootersClient />
        </>
    );
}
