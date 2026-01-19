"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, LucideIcon } from "lucide-react";

interface ToolLayoutProps {
    title: string;
    description: string;
    icon: LucideIcon;
    color: string;
    children: ReactNode;
}

export function ToolLayout({
    title,
    description,
    icon: Icon,
    color,
    children,
}: ToolLayoutProps) {
    return (
        <div className="min-h-[calc(100vh-64px)] bg-surface-50 dark:bg-surface-900/50">
            {/* Tool Header */}
            <div className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to all tools
                    </Link>

                    <div className="flex items-start gap-4">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg`}
                        >
                            <Icon className="w-8 h-8" />
                        </motion.div>
                        <div>
                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-white mb-2"
                            >
                                {title}
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-surface-600 dark:text-surface-300"
                            >
                                {description}
                            </motion.p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tool Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    {children}
                </motion.div>
            </div>
        </div>
    );
}
