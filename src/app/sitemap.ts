import { MetadataRoute } from "next";
import { TOOLS } from "@/lib/constants";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://easypdf.com";
    const lastModified = new Date();

    const staticRoutes = [
        "",
        "/settings",
        "/privacy",
        "/terms",
        "/contact",
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified,
        changeFrequency: "monthly" as const,
        priority: route === "" ? 1 : 0.5,
    }));

    const toolRoutes = TOOLS.map((tool) => ({
        url: `${baseUrl}${tool.href}`,
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.8,
    }));

    // Filter out duplicates if any tool href matches static routes
    const allRoutes = [...staticRoutes, ...toolRoutes];

    return allRoutes;
}
