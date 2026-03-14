import { Metadata } from "next";
import PhotoToPdfClient from "./PhotoToPdfClient";

export const metadata: Metadata = {
    title: "Photo to PDF - Convert Photos to PDF Online",
    description:
        "Convert your photos to PDF online for free. Drag, drop, and reorder photos from your camera roll. Create beautiful PDF albums with custom layouts.",
    openGraph: {
        title: "Photo to PDF - Convert Photos to PDF Online",
        description:
            "Convert your photos to PDF online for free. Drag, drop, and reorder photos from your camera roll. Create beautiful PDF albums with custom layouts.",
    },
};

export default function PhotoToPdfPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        name: "EasyPDF Photo to PDF",
                        applicationCategory: "ProductivityApplication",
                        operatingSystem: "Any",
                        offers: {
                            "@type": "Offer",
                            price: "0",
                            priceCurrency: "USD",
                        },
                        description:
                            "Convert photos to PDF online. Create PDF albums from camera photos.",
                    }),
                }}
            />
            <PhotoToPdfClient />
        </>
    );
}
