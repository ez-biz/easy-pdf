import Link from "next/link";
import { FileText, Github, Twitter, Heart } from "lucide-react";
import { TOOLS, TOOL_CATEGORIES } from "@/lib/constants";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-surface-900 text-surface-300 mt-auto">
            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                    {/* Brand Section */}
                    <div className="col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-white" aria-hidden="true" />
                            </div>
                            <span className="text-xl font-bold text-white">EasyPDF</span>
                        </Link>
                        <p className="text-sm text-surface-400 mb-4 max-w-xs">
                            Free online PDF tools to merge, split, compress, convert, and edit
                            PDFs. No installation required.
                        </p>
                        <div className="flex items-center gap-3">
                            <a
                                href="https://github.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 transition-colors"
                                aria-label="GitHub"
                            >
                                <Github className="w-5 h-5" aria-hidden="true" />
                            </a>
                            <a
                                href="https://twitter.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 transition-colors"
                                aria-label="Twitter"
                            >
                                <Twitter className="w-5 h-5" aria-hidden="true" />
                            </a>
                        </div>
                    </div>

                    {/* Tool Categories */}
                    {TOOL_CATEGORIES.slice(0, 4).map((category) => (
                        <div key={category.id}>
                            <h3 className="font-semibold text-white mb-4">{category.name}</h3>
                            <ul className="space-y-2">
                                {TOOLS.filter((tool) => tool.category === category.id)
                                    .slice(0, 5)
                                    .map((tool) => (
                                        <li key={tool.id}>
                                            {tool.comingSoon ? (
                                                <span className="text-sm opacity-50 cursor-not-allowed">
                                                    {tool.name}
                                                </span>
                                            ) : (
                                                <Link
                                                    href={tool.href}
                                                    className="text-sm hover:text-white transition-colors"
                                                >
                                                    {tool.name}
                                                </Link>
                                            )}
                                        </li>
                                    ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-surface-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-1 text-sm text-surface-400">
                            <span>© {currentYear} EasyPDF. Made with</span>
                            <Heart className="w-4 h-4 text-red-500 fill-red-500" aria-hidden="true" />
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                            <Link
                                href="/privacy"
                                className="text-surface-400 hover:text-white transition-colors"
                            >
                                Privacy Policy
                            </Link>
                            <Link
                                href="/terms"
                                className="text-surface-400 hover:text-white transition-colors"
                            >
                                Terms of Service
                            </Link>
                            <Link
                                href="/contact"
                                className="text-surface-400 hover:text-white transition-colors"
                            >
                                Contact
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
