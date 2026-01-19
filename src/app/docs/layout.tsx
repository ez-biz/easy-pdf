import { ReactNode } from 'react';
import Link from 'next/link';
import { FileText, Home, Rocket, Code, Layers, Upload, Users } from 'lucide-react';

const sidebarItems = [
    { href: '/docs', label: 'Introduction', icon: Home },
    { href: '/docs/getting-started', label: 'Getting Started', icon: Rocket },
    { href: '/docs/architecture', label: 'Architecture', icon: Layers },
    { href: '/docs/api', label: 'API Reference', icon: Code },
    { href: '/docs/components', label: 'Components', icon: FileText },
    { href: '/docs/deployment', label: 'Deployment', icon: Upload },
    { href: '/docs/contributing', label: 'Contributing', icon: Users },
];

export default function DocsLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/docs" className="flex items-center gap-2 font-bold text-xl">
                        <FileText className="w-6 h-6 text-primary-600" />
                        EasyPDF Docs
                    </Link>
                    <Link
                        href="/"
                        className="text-sm text-surface-600 hover:text-primary-600 dark:text-surface-400"
                    >
                        ← Back to App
                    </Link>
                </div>
            </header>

            <div className="max-w-7xl mx-auto flex">
                {/* Sidebar */}
                <aside className="w-64 shrink-0 hidden md:block">
                    <nav className="sticky top-20 p-4 space-y-1">
                        {sidebarItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0 px-4 py-8 md:px-8">
                    <article className="prose prose-slate dark:prose-invert max-w-none">
                        {children}
                    </article>
                </main>
            </div>
        </div>
    );
}
