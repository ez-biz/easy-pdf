import { Shield } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-900 dark:to-surface-800">
            <div className="max-w-4xl mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-surface-900 dark:text-white mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400">
                        Last updated: January 19, 2026
                    </p>
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-surface-800 rounded-2xl p-8 shadow-xl space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            1. Overview
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            EasyPDF is committed to protecting your privacy. This policy explains how we handle your
                            data when you use our PDF processing tools.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            2. Client-Side Processing
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed mb-4">
                            All PDF operations are performed entirely in your browser using client-side JavaScript.
                            This means:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-surface-600 dark:text-surface-300">
                            <li>Your files never leave your device</li>
                            <li>We do not upload your PDFs to any server</li>
                            <li>We do not store or have access to your documents</li>
                            <li>All processing happens locally on your computer</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            3. Data Collection
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed mb-4">
                            We collect minimal data to improve our service:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-surface-600 dark:text-surface-300">
                            <li><strong>Analytics:</strong> We use Google Analytics (GA4) with IP anonymization to understand general usage trends (e.g., &quot;Merge PDF was used 50 times&quot;). We do <strong>not</strong> track individual filenames, file content, or personal identifiers.</li>
                            <li><strong>Cookies:</strong> We use essential cookies for site functionality and preferences (like dark mode).</li>
                            <li><strong>No Personal Data:</strong> We do not collect names, emails, or any personally identifiable information unless you voluntarily provide it.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            4. Third-Party Services
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            Our website may use third-party services for analytics and hosting. These services may
                            collect data according to their own privacy policies. We do not share your files with
                            any third parties.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            5. Data Security
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            Since all processing is client-side, your files remain secure on your device. We recommend
                            using HTTPS connections and keeping your browser updated for optimal security.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            6. Your Rights
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            Since we don&apos;t store your personal data or files, there is no data for you to request,
                            modify, or delete. You have full control over your files at all times.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            7. Children&apos;s Privacy
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            Our service is not directed to children under 13. We do not knowingly collect information
                            from children.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            8. Changes to This Policy
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            We may update this privacy policy from time to time. The &quot;Last updated&quot; date at the top
                            will reflect the most recent changes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            9. Contact Us
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            If you have any questions about this Privacy Policy, please contact us through our{" "}
                            <a href="/contact" className="text-primary-600 hover:text-primary-700 underline">
                                Contact page
                            </a>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
