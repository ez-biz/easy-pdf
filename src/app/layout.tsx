import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToastProvider } from "@/contexts/ToastContext";

export const viewport: Viewport = {
    themeColor: "#6366f1",
};

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://easypdf.com"),
    title: {
        default: "EasyPDF - Free Online PDF Tools",
        template: "%s | EasyPDF",
    },
    description:
        "Merge, split, compress, convert PDFs and more. All the tools you need to work with PDFs, completely free and easy to use.",
    keywords: [
        "PDF",
        "merge PDF",
        "split PDF",
        "compress PDF",
        "PDF converter",
        "free PDF tools",
        "online pdf tools",
    ],
    authors: [{ name: "EasyPDF Team" }],
    creator: "EasyPDF",
    publisher: "EasyPDF",
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "EasyPDF",
    },
    openGraph: {
        title: "EasyPDF - Free Online PDF Tools",
        description:
            "Merge, split, compress, convert PDFs and more. All the tools you need to work with PDFs.",
        url: process.env.NEXT_PUBLIC_BASE_URL || "https://easypdf.com",
        siteName: "EasyPDF",
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "EasyPDF - Free Online PDF Tools",
        description: "All the tools you need to work with PDFs, completely free and easy to use.",
    },
};

import { GoogleAnalytics } from "@next/third-parties/google";

// ... existing imports

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="min-h-screen flex flex-col antialiased">
                <ToastProvider>
                    <Header />
                    <main className="flex-1 pt-16">{children}</main>
                    <Footer />
                </ToastProvider>
            </body>
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ""} />
        </html>
    );
}

