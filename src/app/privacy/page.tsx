import { Metadata } from "next";
import Link from "next/link";
import { Shield } from "lucide-react";

export const metadata: Metadata = {
    title: "Privacy Policy - EasyPDF",
    description:
        "EasyPDF Privacy Policy. Learn how we protect your data with 100% client-side processing — your files never leave your device.",
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-900 dark:to-surface-800">
            <div className="max-w-4xl mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Shield className="w-8 h-8 text-white" aria-hidden="true" />
                    </div>
                    <h1 className="text-4xl font-bold text-surface-900 dark:text-white mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400">
                        Last updated: March 14, 2026
                    </p>
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-surface-800 rounded-2xl p-8 shadow-xl space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            1. Overview
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            EasyPDF (&quot;we,&quot; &quot;our,&quot; or &quot;the Service&quot;) is committed to
                            protecting your privacy. This Privacy Policy explains how we collect,
                            use, and safeguard information when you use our website and PDF
                            processing tools. By using EasyPDF, you agree to the collection and
                            use of information in accordance with this policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            2. Client-Side Processing
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed mb-4">
                            All PDF and document processing operations are performed entirely in
                            your web browser using client-side JavaScript. This is a core design
                            principle of EasyPDF. Specifically:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-surface-600 dark:text-surface-300">
                            <li>
                                <strong>Your files never leave your device.</strong> No files are
                                uploaded to any server at any point during processing.
                            </li>
                            <li>
                                We do not store, access, read, copy, or transmit your documents.
                            </li>
                            <li>
                                All file conversions, merging, splitting, compression, OCR, and
                                other operations happen locally on your computer.
                            </li>
                            <li>
                                When you close your browser tab, all processed data is discarded
                                from memory.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            3. Information We Collect
                        </h2>

                        <h3 className="text-lg font-medium text-surface-800 dark:text-surface-200 mb-2">
                            3.1 Automatically Collected Information
                        </h3>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed mb-4">
                            When you visit EasyPDF, we may automatically collect certain
                            non-personally identifiable information, including:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-surface-600 dark:text-surface-300 mb-4">
                            <li>
                                Browser type and version
                            </li>
                            <li>
                                Operating system
                            </li>
                            <li>
                                Page views and navigation paths
                            </li>
                            <li>
                                Referring website
                            </li>
                            <li>
                                Approximate geographic location (country/region level, derived from
                                anonymized IP)
                            </li>
                            <li>
                                Device type (desktop, mobile, tablet)
                            </li>
                        </ul>

                        <h3 className="text-lg font-medium text-surface-800 dark:text-surface-200 mb-2">
                            3.2 Analytics
                        </h3>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed mb-4">
                            We use Google Analytics (GA4) with IP anonymization enabled to
                            understand general usage trends (e.g., &quot;Merge PDF was used 50
                            times today&quot;). We do <strong>not</strong> track individual
                            filenames, file content, document metadata, or personal identifiers
                            through analytics.
                        </p>

                        <h3 className="text-lg font-medium text-surface-800 dark:text-surface-200 mb-2">
                            3.3 Information We Do NOT Collect
                        </h3>
                        <ul className="list-disc list-inside space-y-2 text-surface-600 dark:text-surface-300">
                            <li>File names, contents, or metadata of documents you process</li>
                            <li>
                                Personal information such as names, email addresses, or phone
                                numbers (unless voluntarily provided via our contact form)
                            </li>
                            <li>Payment information (EasyPDF is completely free)</li>
                            <li>Login credentials (no account required)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            4. Cookies and Local Storage
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed mb-4">
                            EasyPDF uses the following types of storage:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-surface-600 dark:text-surface-300">
                            <li>
                                <strong>Essential cookies:</strong> Required for basic site
                                functionality
                            </li>
                            <li>
                                <strong>Preference storage:</strong> Local storage to save your
                                settings (such as dark mode preference, compression quality
                                defaults)
                            </li>
                            <li>
                                <strong>Analytics cookies:</strong> Used by Google Analytics to
                                distinguish users and track sessions (anonymized)
                            </li>
                        </ul>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed mt-4">
                            You can disable cookies through your browser settings. Disabling
                            cookies will not affect the core functionality of our PDF tools.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            5. Third-Party Services
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed mb-4">
                            EasyPDF uses the following third-party services:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-surface-600 dark:text-surface-300">
                            <li>
                                <strong>Google Analytics:</strong> For anonymous usage statistics.
                                See{" "}
                                <a
                                    href="https://policies.google.com/privacy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-600 hover:text-primary-700 underline"
                                >
                                    Google&apos;s Privacy Policy
                                </a>
                                .
                            </li>
                            <li>
                                <strong>Google Fonts:</strong> For typography. Font files may be
                                loaded from Google&apos;s CDN.
                            </li>
                            <li>
                                <strong>Hosting provider:</strong> Our website is hosted on a
                                static hosting platform. The hosting provider may collect standard
                                server logs (IP addresses, timestamps).
                            </li>
                        </ul>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed mt-4">
                            We do not share, sell, or rent your data to any third parties. Your
                            files are never transmitted to any external service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            6. Data Security
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            Because all file processing happens client-side, your documents benefit
                            from strong inherent privacy protection — they never traverse a
                            network. Our website is served over HTTPS to protect the integrity and
                            confidentiality of data in transit. We recommend keeping your browser
                            and operating system up to date for optimal security.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            7. Your Rights
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed mb-4">
                            Depending on your jurisdiction, you may have the following rights:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-surface-600 dark:text-surface-300">
                            <li>
                                <strong>Right to access:</strong> Request a copy of any personal
                                data we hold about you
                            </li>
                            <li>
                                <strong>Right to deletion:</strong> Request deletion of your
                                personal data
                            </li>
                            <li>
                                <strong>Right to opt out:</strong> Opt out of analytics tracking by
                                using browser extensions or disabling cookies
                            </li>
                            <li>
                                <strong>Right to portability:</strong> Request your data in a
                                portable format
                            </li>
                        </ul>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed mt-4">
                            Since we do not store your personal data or files, most data requests
                            are automatically satisfied by our architecture. For any specific
                            requests, please contact us.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            8. GDPR Compliance
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            For users in the European Economic Area (EEA), we process data in
                            accordance with the General Data Protection Regulation (GDPR). Our
                            legal basis for processing analytics data is legitimate interest in
                            understanding how our Service is used. You can exercise your GDPR
                            rights by contacting us through our Contact page.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            9. CCPA Compliance
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            For California residents, under the California Consumer Privacy Act
                            (CCPA): we do not sell personal information, we do not collect
                            sensitive personal information, and you have the right to know what
                            data we collect and request its deletion. Since our Service processes
                            all files client-side and does not require accounts, we collect minimal
                            data by design.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            10. Children&apos;s Privacy
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            EasyPDF is not directed to children under 13 (or under 16 in the EEA).
                            We do not knowingly collect personal information from children. If you
                            believe a child has provided us with personal data, please contact us
                            and we will take steps to delete it.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            11. Changes to This Policy
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            We may update this Privacy Policy from time to time. The &quot;Last
                            updated&quot; date at the top will reflect the most recent changes.
                            Continued use of the Service after any modifications constitutes your
                            acceptance of the updated policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            12. Contact Us
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            If you have any questions or concerns about this Privacy Policy, please
                            contact us through our{" "}
                            <Link
                                href="/contact"
                                className="text-primary-600 hover:text-primary-700 underline"
                            >
                                Contact page
                            </Link>
                            .
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
