"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Shield, FileText } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
    return (
        <section className="relative overflow-hidden hero-bg">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-grid opacity-30" />
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
                <div className="text-center max-w-4xl mx-auto">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>100% Free · No Registration Required</span>
                    </motion.div>

                    {/* Heading */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
                    >
                        Every tool you need to work with{" "}
                        <span className="text-gradient">PDFs</span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-lg sm:text-xl text-surface-600 dark:text-surface-300 mb-8 max-w-2xl mx-auto"
                    >
                        Merge, split, compress, convert, rotate, unlock, and watermark PDFs
                        with just a few clicks. All tools are free and easy to use.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
                    >
                        <Link href="#all-tools" className="btn-primary text-lg px-8 py-4">
                            Explore All Tools
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link href="/merge-pdf" className="btn-secondary text-lg px-8 py-4">
                            Start with Merge PDF
                        </Link>
                    </motion.div>

                    {/* Feature Pills */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="flex flex-wrap items-center justify-center gap-4"
                    >
                        {[
                            { icon: Zap, text: "Fast Processing" },
                            { icon: Shield, text: "Secure & Private" },
                            { icon: FileText, text: "No File Limit" },
                        ].map((feature, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-surface-800 shadow-card text-sm font-medium text-surface-700 dark:text-surface-200"
                            >
                                <feature.icon className="w-4 h-4 text-primary-500" />
                                {feature.text}
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Floating PDF Icons */}
                <div className="absolute top-1/4 left-10 hidden lg:block animate-float" style={{ animationDelay: "-1s" }}>
                    <div className="w-16 h-20 bg-white dark:bg-surface-800 rounded-lg shadow-card flex items-center justify-center border border-surface-200 dark:border-surface-700 rotate-[-15deg]">
                        <FileText className="w-8 h-8 text-red-500" />
                    </div>
                </div>
                <div className="absolute top-1/3 right-16 hidden lg:block animate-float" style={{ animationDelay: "-2s" }}>
                    <div className="w-14 h-18 bg-white dark:bg-surface-800 rounded-lg shadow-card flex items-center justify-center border border-surface-200 dark:border-surface-700 rotate-[12deg]">
                        <FileText className="w-7 h-7 text-primary-500" />
                    </div>
                </div>
                <div className="absolute bottom-1/4 left-20 hidden lg:block animate-float" style={{ animationDelay: "-4s" }}>
                    <div className="w-12 h-16 bg-white dark:bg-surface-800 rounded-lg shadow-card flex items-center justify-center border border-surface-200 dark:border-surface-700 rotate-[8deg]">
                        <FileText className="w-6 h-6 text-secondary-500" />
                    </div>
                </div>
            </div>
        </section>
    );
}
