"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    Layers,
    Scissors,
    RotateCw,
    LayoutGrid,
    Image,
    FileImage,
    FileText,
    FileType,
    Table,
    Sheet,
    Droplets,
    Hash,
    PenTool,
    Edit3,
    Lock,
    Unlock,
    Minimize2,
    Wrench,
    LucideIcon,
} from "lucide-react";
import { TOOLS, TOOL_CATEGORIES } from "@/lib/constants";
import { ToolCategory } from "@/types/tools";

const iconMap: { [key: string]: LucideIcon } = {
    Layers,
    Scissors,
    RotateCw,
    LayoutGrid,
    Image,
    FileImage,
    FileText,
    FileType,
    Table,
    Sheet,
    Droplets,
    Hash,
    PenTool,
    Edit3,
    Lock,
    Unlock,
    Minimize2,
    Wrench,
};

export function ToolsGrid() {
    const [activeCategory, setActiveCategory] = useState<ToolCategory | "all">(
        "all"
    );

    const filteredTools =
        activeCategory === "all"
            ? TOOLS
            : TOOLS.filter((tool) => tool.category === activeCategory);

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

                {/* Category Filters */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
                    <button
                        onClick={() => setActiveCategory("all")}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === "all"
                                ? "bg-primary-500 text-white shadow-lg shadow-primary-500/25"
                                : "bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
                            }`}
                    >
                        All Tools
                    </button>
                    {TOOL_CATEGORIES.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setActiveCategory(category.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === category.id
                                    ? "bg-primary-500 text-white shadow-lg shadow-primary-500/25"
                                    : "bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
                                }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                {/* Tools Grid */}
                <motion.div
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    {filteredTools.map((tool, index) => {
                        const IconComponent = iconMap[tool.icon] || FileText;

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
                                        <IconComponent className="w-7 h-7" />
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
