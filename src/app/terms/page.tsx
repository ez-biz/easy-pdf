import { FileText } from "lucide-react";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-900 dark:to-surface-800">
            <div className="max-w-4xl mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-surface-900 dark:text-white mb-4">
                        Terms of Service
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400">
                        Last updated: January 19, 2026
                    </p>
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-surface-800 rounded-2xl p-8 shadow-xl space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            1. Acceptance of Terms
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            By accessing and using EasyPDF, you accept and agree to be bound by the terms and provision
                            of this agreement. If you do not agree to these terms, please do not use our service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            2. Use License
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed mb-4">
                            Permission is granted to use EasyPDF for personal and commercial purposes, subject to the
                            following restrictions:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-surface-600 dark:text-surface-300">
                            <li>You may not modify or copy the materials</li>
                            <li>You may not use the materials for any commercial purpose without attribution</li>
                            <li>You may not attempt to reverse engineer any software contained on EasyPDF</li>
                            <li>You may not remove any copyright or other proprietary notations from the materials</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            3. User Responsibilities
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed mb-4">
                            You are responsible for:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-surface-600 dark:text-surface-300">
                            <li>Ensuring you have the rights to process any PDFs you upload</li>
                            <li>Using the service in compliance with all applicable laws</li>
                            <li>Not using the service for any illegal or unauthorized purpose</li>
                            <li>Maintaining the confidentiality of any sensitive documents you process</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            4. Service Availability
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            EasyPDF is provided &quot;as is&quot; without any warranties. We do not guarantee that the service will
                            be uninterrupted, secure, or error-free. We reserve the right to modify or discontinue the
                            service at any time without notice.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            5. Disclaimer
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed mb-4">
                            The materials on EasyPDF are provided on an &apos;as is&apos; basis. EasyPDF makes no warranties,
                            expressed or implied, and hereby disclaims and negates all other warranties including,
                            without limitation, implied warranties or conditions of merchantability, fitness for a
                            particular purpose, or non-infringement of intellectual property or other violation of rights.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            6. Limitations
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            In no event shall EasyPDF or its suppliers be liable for any damages (including, without
                            limitation, damages for loss of data or profit, or due to business interruption) arising
                            out of the use or inability to use EasyPDF, even if EasyPDF has been notified of the
                            possibility of such damage.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            7. File Processing
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            All file processing is performed client-side in your browser. We do not store, access, or
                            transmit your files. You are solely responsible for backing up and maintaining your original
                            documents.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            8. Intellectual Property
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            The service and its original content, features, and functionality are owned by EasyPDF and
                            are protected by international copyright, trademark, patent, trade secret, and other
                            intellectual property laws.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            9. Modifications
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            EasyPDF may revise these terms of service at any time without notice. By using this service,
                            you are agreeing to be bound by the current version of these terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            10. Governing Law
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            These terms shall be governed and construed in accordance with applicable laws, without
                            regard to its conflict of law provisions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            11. Contact Information
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            If you have any questions about these Terms, please contact us through our{" "}
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
