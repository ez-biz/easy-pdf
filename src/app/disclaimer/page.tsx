import { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
    title: "Disclaimer - EasyPDF",
    description:
        "Legal disclaimer for EasyPDF. Understand the limitations and terms of using our free online PDF tools.",
};

export default function DisclaimerPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-900 dark:to-surface-800">
            <div className="max-w-4xl mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-8 h-8 text-white" aria-hidden="true" />
                    </div>
                    <h1 className="text-4xl font-bold text-surface-900 dark:text-white mb-4">
                        Disclaimer
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400">
                        Last updated: March 14, 2026
                    </p>
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-surface-800 rounded-2xl p-8 shadow-xl space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            1. General Disclaimer
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            The information and tools provided on EasyPDF (&quot;the Service&quot;) are
                            offered on an &quot;as is&quot; and &quot;as available&quot; basis for general
                            informational and productivity purposes only. EasyPDF makes no
                            representations or warranties of any kind, express or implied, regarding
                            the accuracy, completeness, reliability, suitability, or availability of
                            the Service or the results produced by its tools.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            2. No Professional Advice
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            EasyPDF is a document processing utility and does not provide legal,
                            financial, medical, or any other form of professional advice. The tools
                            should not be used as a substitute for professional consultation. Users
                            should seek appropriate professional advice before relying on any
                            document processed through our Service for legal, business, or
                            compliance purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            3. Accuracy of Conversions
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed mb-4">
                            While we strive to provide accurate file conversions and processing,
                            EasyPDF cannot guarantee:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-surface-600 dark:text-surface-300">
                            <li>
                                Perfect formatting preservation when converting between file formats
                                (e.g., PDF to Word, PDF to Excel)
                            </li>
                            <li>
                                100% accuracy of OCR (Optical Character Recognition) text extraction
                            </li>
                            <li>
                                Lossless compression — some quality reduction may occur during PDF
                                compression
                            </li>
                            <li>
                                Compatibility of output files with all software applications or
                                devices
                            </li>
                        </ul>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed mt-4">
                            Users should always verify the output of any conversion or processing
                            operation and maintain backups of their original files.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            4. Client-Side Processing
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            All file processing occurs entirely within your web browser
                            (client-side). Your files are never uploaded to our servers. While this
                            provides strong privacy protection, it also means that processing
                            performance depends on your device&apos;s hardware capabilities, available
                            memory, and browser version. Very large files or complex operations may
                            not perform optimally on all devices.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            5. Limitation of Liability
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            To the fullest extent permitted by applicable law, EasyPDF and its
                            operators, contributors, and affiliates shall not be liable for any
                            direct, indirect, incidental, special, consequential, or punitive
                            damages, including but not limited to loss of data, loss of profits,
                            business interruption, or any other damages arising out of or in
                            connection with the use or inability to use the Service, even if
                            EasyPDF has been advised of the possibility of such damages.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            6. User Responsibility
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed mb-4">
                            By using EasyPDF, you acknowledge and agree that:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-surface-600 dark:text-surface-300">
                            <li>
                                You are solely responsible for any files you process and the use of
                                the resulting output
                            </li>
                            <li>
                                You have the legal right to process any documents you upload or
                                convert
                            </li>
                            <li>
                                You will maintain backup copies of all original files before
                                processing
                            </li>
                            <li>
                                You will verify the accuracy and completeness of all output files
                                before relying on them
                            </li>
                            <li>
                                You will not use the Service for any purpose that is illegal or
                                prohibited by applicable law
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            7. Third-Party Libraries
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            EasyPDF uses open-source third-party libraries for file processing
                            (including but not limited to pdf-lib, pdfjs-dist, docx, xlsx,
                            pptxgenjs, mammoth, tesseract.js, and jsPDF). These libraries are
                            provided under their respective licenses. EasyPDF does not warrant the
                            performance or accuracy of these third-party components and is not
                            responsible for any issues arising from their use.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            8. No Warranty
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTY OF ANY KIND, EITHER
                            EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES
                            OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
                            NON-INFRINGEMENT. EASYPDF DOES NOT WARRANT THAT THE SERVICE WILL BE
                            UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            9. Changes to This Disclaimer
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            EasyPDF reserves the right to modify this disclaimer at any time. Changes
                            will be effective immediately upon posting to the website. Your continued
                            use of the Service after any changes constitutes your acceptance of the
                            updated disclaimer.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">
                            10. Contact
                        </h2>
                        <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                            If you have questions about this disclaimer, please contact us through
                            our{" "}
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
