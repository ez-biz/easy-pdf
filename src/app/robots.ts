import { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://easypdf.com";

    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/api/", "/private/"],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
