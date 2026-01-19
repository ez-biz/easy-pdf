import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToastProvider } from "@/contexts/ToastContext";

export const metadata: Metadata = {
    title: "EasyPDF - Free Online PDF Tools",
    description:
        "Merge, split, compress, convert PDFs and more. All the tools you need to work with PDFs, completely free and easy to use.",
    keywords: [
        "PDF",
        "merge PDF",
        "split PDF",
        "compress PDF",
        "PDF converter",
        "free PDF tools",
    ],
    openGraph: {
        title: "EasyPDF - Free Online PDF Tools",
        description:
            "Merge, split, compress, convert PDFs and more. All the tools you need to work with PDFs.",
        type: "website",
    },
};

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
                    <main className="flex-1">{children}</main>
                    <Footer />
                </ToastProvider>
            </body>
        </html>
    );
}

