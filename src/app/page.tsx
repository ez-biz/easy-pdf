import { HeroSection } from "@/components/home/HeroSection";
import { ToolsGrid } from "@/components/home/ToolsGrid";

export default function HomePage() {
    return (
        <>
            <HeroSection />
            <ToolsGrid />
            {/* Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebSite",
                        name: "EasyPDF",
                        url: process.env.NEXT_PUBLIC_BASE_URL || "https://easypdf.com",
                        potentialAction: {
                            "@type": "SearchAction",
                            target: {
                                "@type": "EntryPoint",
                                urlTemplate: `${process.env.NEXT_PUBLIC_BASE_URL || "https://easypdf.com"
                                    }/search?q={search_term_string}`,
                            },
                            "query-input": "required name=search_term_string",
                        },
                    }),
                }}
            />
        </>
    );
}
