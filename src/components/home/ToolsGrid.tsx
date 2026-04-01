"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Search } from "lucide-react";
import { TOOLS, TOOL_CATEGORIES } from "@/lib/constants";
import { getToolIcon } from "@/lib/icons";
import { ToolCategory } from "@/types/tools";

export function ToolsGrid() {
    const [activeCategory, setActiveCategory] = useState<ToolCategory | "all">(
        "all"
    );
    const [searchQuery, setSearchQuery] = useState("");

    const filteredTools = TOOLS.filter((tool) => {
        const matchesCategory = activeCategory === "all" || tool.category === activeCategory;
        const matchesSearch = searchQuery === "" ||
            tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tool.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <section id="all-tools" className="py-16 lg:py-24 bg-surface-50 dark:bg-surface-900/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                        All PDF Tools
                    </h2>
                    <p className="text-lg text-surface-600 dark:text-surface-300 max-w-2xl mx-auto">
                        Choose from our collection of PDF tools to accomplish any task
                    </p>
                </div>

                {/* Search Bar */}
                <div className="max-w-md mx-auto mb-8">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" aria-hidden="true" />
                        <input
                            type="text"
                            placeholder="Search tools..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                        />
                    </div>
                </div>

                {/* Category Filters */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
                    <button
                        onClick={() => setActiveCategory("all")}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-[background-color,color,box-shadow] ${activeCategory === "all"
                            ? "bg-primary-500 text-white shadow-lg shadow-primary-500/25"
                            : "bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
                            }`}
                    >
                        All Tools
                    </button>
                    {TOOL_CATEGORIES.map((category) => {
                        const count = TOOLS.filter((t) => t.category === category.id).length;
                        return (
                            <button
                                key={category.id}
                                onClick={() => setActiveCategory(category.id)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-[background-color,color,box-shadow] ${activeCategory === category.id
                                    ? "bg-primary-500 text-white shadow-lg shadow-primary-500/25"
                                    : "bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
                                    }`}
                            >
                                {category.name}
                                <span className={`ml-1.5 text-xs ${activeCategory === category.id ? "text-white/70" : "text-surface-400"}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Tools Grid */}
                {filteredTools.length === 0 && (
                    <div className="text-center py-16">
                        <Search className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" aria-hidden="true" />
                        <p className="text-lg font-medium text-surface-600 dark:text-surface-400 mb-2">
                            No tools found
                        </p>
                        <p className="text-sm text-surface-400 dark:text-surface-500">
                            Try a different search term or category
                        </p>
                    </div>
                )}
                <motion.div
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    {filteredTools.map((tool, index) => {
                        const IconComponent = getToolIcon(tool.icon);

                        return (
                            <motion.div
                                key={tool.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                                <Link
                                    href={tool.comingSoon ? "#" : tool.href}
                                    className={`tool-card flex flex-col items-start h-full group ${tool.comingSoon ? "opacity-60 cursor-not-allowed" : ""
                                        }`}
                                    onClick={(e) => tool.comingSoon && e.preventDefault()}
                                >
                                    {/* Icon */}
                                    <div
                                        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}
                                    >
                                        <IconComponent className="w-7 h-7" aria-hidden="true" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-semibold text-lg text-surface-900 dark:text-white">
                                                {tool.name}
                                            </h3>
                                            {tool.comingSoon && (
                                                <span className="text-xs px-2 py-0.5 bg-surface-100 dark:bg-surface-700 text-surface-500 dark:text-surface-400 rounded-full">
                                                    Soon
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-surface-500 dark:text-surface-400">
                                            {tool.description}
                                        </p>
                                    </div>

                                    {/* Hover Arrow */}
                                    {!tool.comingSoon && (
                                        <div className="mt-4 flex items-center text-primary-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span>Use Tool</span>
                                            <svg
                                                className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 5l7 7-7 7"
                                                />
                                            </svg>
                                        </div>
                                    )}
                                </Link>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}
