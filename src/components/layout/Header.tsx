"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Menu,
    X,
    ChevronDown,
    FileText,
    Moon,
    Sun,
} from "lucide-react";
import { TOOLS, TOOL_CATEGORIES } from "@/lib/constants";
import { getToolIcon } from "@/lib/icons";

export function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [isDark, setIsDark] = useState(false);

    const toggleDarkMode = () => {
        setIsDark(!isDark);
        document.documentElement.classList.toggle("dark");
    };

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [mobileMenuOpen]);

    return (
        <header className="fixed top-0 inset-x-0 z-50 glass border-b border-surface-200 dark:border-surface-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-shadow">
                            <FileText className="w-5 h-5 text-white" aria-hidden="true" />
                        </div>
                        <span className="text-xl font-bold text-gradient">EasyPDF</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-1">
                        {TOOL_CATEGORIES.slice(0, 4).map((category) => (
                            <div
                                key={category.id}
                                className="relative"
                                onMouseEnter={() => setActiveDropdown(category.id)}
                                onMouseLeave={() => setActiveDropdown(null)}
                            >
                                <button
                                    type="button"
                                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-white rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                                    aria-expanded={activeDropdown === category.id}
                                    aria-haspopup="true"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            setActiveDropdown(activeDropdown === category.id ? null : category.id);
                                        } else if (e.key === "Escape") {
                                            setActiveDropdown(null);
                                        }
                                    }}
                                >
                                    {category.name}
                                    <ChevronDown
                                        className={`w-4 h-4 transition-transform ${activeDropdown === category.id ? "rotate-180" : ""
                                            }`}
                                        aria-hidden="true"
                                    />
                                </button>

                                <AnimatePresence>
                                    {activeDropdown === category.id && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-surface-800 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 overflow-hidden"
                                        >
                                            <div className="p-2">
                                                {TOOLS.filter(
                                                    (tool) => tool.category === category.id
                                                ).map((tool) => (
                                                    <div key={tool.id}>
                                                        {tool.comingSoon ? (
                                                            <div
                                                                className="flex items-start gap-3 p-3 rounded-lg opacity-50 cursor-not-allowed"
                                                            >
                                                                <div
                                                                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center text-white flex-shrink-0`}
                                                                >
                                                                    {(() => { const Icon = getToolIcon(tool.icon); return <Icon className="w-4 h-4" aria-hidden="true" />; })()}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-medium text-surface-900 dark:text-white">
                                                                            {tool.name}
                                                                        </span>
                                                                        <span className="text-xs px-2 py-0.5 bg-surface-100 dark:bg-surface-600 text-surface-500 dark:text-surface-400 rounded-full">
                                                                            Soon
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                                                                        {tool.description}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <Link
                                                                href={tool.href}
                                                                className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                                                            >
                                                                <div
                                                                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center text-white flex-shrink-0`}
                                                                >
                                                                    {(() => { const Icon = getToolIcon(tool.icon); return <Icon className="w-4 h-4" aria-hidden="true" />; })()}
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium text-surface-900 dark:text-white">
                                                                        {tool.name}
                                                                    </span>
                                                                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                                                                        {tool.description}
                                                                    </p>
                                                                </div>
                                                            </Link>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}

                        <Link
                            href="#all-tools"
                            className="px-4 py-2 text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-white rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        >
                            All Tools
                        </Link>
                    </nav>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-2">
                        {/* Settings Link */}
                        <Link
                            href="/settings"
                            className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-white rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        >
                            Settings
                        </Link>

                        {/* Dark Mode Toggle */}
                        <button
                            type="button"
                            onClick={toggleDarkMode}
                            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                            aria-label="Toggle dark mode"
                        >
                            {isDark ? (
                                <Sun className="w-5 h-5 text-surface-600 dark:text-surface-300" aria-hidden="true" />
                            ) : (
                                <Moon className="w-5 h-5 text-surface-600 dark:text-surface-300" aria-hidden="true" />
                            )}
                        </button>

                        {/* Mobile Menu Button */}
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? (
                                <X className="w-6 h-6" aria-hidden="true" />
                            ) : (
                                <Menu className="w-6 h-6" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="lg:hidden border-t border-surface-200 dark:border-surface-700 max-h-[calc(100vh-4rem)] overflow-y-auto"
                        >
                            <div className="py-4 space-y-2">
                                {TOOL_CATEGORIES.map((category) => (
                                    <div key={category.id} className="space-y-1">
                                        <div className="px-3 py-2 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                                            {category.name}
                                        </div>
                                        {TOOLS.filter((tool) => tool.category === category.id).map(
                                            (tool) => {
                                                const ToolIcon = getToolIcon(tool.icon);
                                                return (
                                                <div key={tool.id}>
                                                    {tool.comingSoon ? (
                                                        <div
                                                            className="flex items-center gap-3 px-3 py-2 rounded-lg opacity-50 cursor-not-allowed"
                                                        >
                                                            <div
                                                                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center text-white`}
                                                            >
                                                                <ToolIcon className="w-4 h-4" aria-hidden="true" />
                                                            </div>
                                                            <span className="font-medium text-surface-900 dark:text-white">
                                                                {tool.name}
                                                            </span>
                                                            <span className="text-xs px-2 py-0.5 bg-surface-100 dark:bg-surface-600 text-surface-500 dark:text-surface-400 rounded-full ml-auto">
                                                                Soon
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <Link
                                                            href={tool.href}
                                                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"
                                                        >
                                                            <div
                                                                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center text-white`}
                                                            >
                                                                <ToolIcon className="w-4 h-4" aria-hidden="true" />
                                                            </div>
                                                            <span className="font-medium text-surface-900 dark:text-white">
                                                                {tool.name}
                                                            </span>
                                                        </Link>
                                                    )}
                                                </div>
                                                );
                                            }
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
}
