import { Tool, ToolCategoryInfo } from "@/types/tools";

export const TOOL_CATEGORIES: ToolCategoryInfo[] = [
    {
        id: "organize",
        name: "Organize",
        description: "Merge, split, and organize your PDFs",
    },
    {
        id: "convert",
        name: "Convert",
        description: "Convert PDFs to and from other formats",
    },
    {
        id: "edit",
        name: "Edit",
        description: "Edit and modify your PDF documents",
    },
    {
        id: "security",
        name: "Security",
        description: "Protect and unlock your PDFs",
    },
    {
        id: "optimize",
        name: "Optimize",
        description: "Compress and optimize your PDFs",
    },
];

export const TOOLS: Tool[] = [
    // Organize
    {
        id: "merge-pdf",
        name: "Merge PDF",
        description: "Combine multiple PDFs into one document",
        href: "/merge-pdf",
        icon: "Layers",
        category: "organize",
        color: "from-primary-500 to-primary-600",
    },
    {
        id: "split-pdf",
        name: "Split PDF",
        description: "Separate PDF pages into multiple files",
        href: "/split-pdf",
        icon: "Scissors",
        category: "organize",
        color: "from-secondary-500 to-secondary-600",
    },
    {
        id: "rotate-pdf",
        name: "Rotate PDF",
        description: "Rotate PDF pages to the correct orientation",
        href: "/rotate-pdf",
        icon: "RotateCw",
        category: "organize",
        color: "from-accent-500 to-accent-600",
    },
    {
        id: "organize-pdf",
        name: "Organize PDF",
        description: "Reorder, delete, or duplicate pages",
        href: "/organize-pdf",
        icon: "LayoutGrid",
        category: "organize",
        color: "from-orange-500 to-orange-600",
        comingSoon: true,
    },

    // Convert
    {
        id: "pdf-to-image",
        name: "PDF to Image",
        description: "Convert PDF pages to JPG, PNG, or WEBP",
        href: "/pdf-to-image",
        icon: "Image",
        category: "convert",
        color: "from-pink-500 to-pink-600",
    },
    {
        id: "image-to-pdf",
        name: "Image to PDF",
        description: "Create a PDF from multiple images",
        href: "/image-to-pdf",
        icon: "FileImage",
        category: "convert",
        color: "from-rose-500 to-rose-600",
    },
    {
        id: "word-to-pdf",
        name: "Word to PDF",
        description: "Convert Word documents to PDF",
        href: "/word-to-pdf",
        icon: "FileText",
        category: "convert",
        color: "from-blue-500 to-blue-600",
        comingSoon: true,
    },
    {
        id: "pdf-to-word",
        name: "PDF to Word",
        description: "Convert PDF to editable Word documents",
        href: "/pdf-to-word",
        icon: "FileType",
        category: "convert",
        color: "from-indigo-500 to-indigo-600",
        comingSoon: true,
    },
    {
        id: "excel-to-pdf",
        name: "Excel to PDF",
        description: "Convert Excel spreadsheets to PDF",
        href: "/excel-to-pdf",
        icon: "Table",
        category: "convert",
        color: "from-green-500 to-green-600",
        comingSoon: true,
    },
    {
        id: "pdf-to-excel",
        name: "PDF to Excel",
        description: "Extract data from PDF to Excel",
        href: "/pdf-to-excel",
        icon: "Sheet",
        category: "convert",
        color: "from-emerald-500 to-emerald-600",
        comingSoon: true,
    },

    // Edit
    {
        id: "add-watermark",
        name: "Add Watermark",
        description: "Add text or image watermarks to PDF",
        href: "/add-watermark",
        icon: "Droplets",
        category: "edit",
        color: "from-cyan-500 to-cyan-600",
    },
    {
        id: "add-page-numbers",
        name: "Add Page Numbers",
        description: "Add page numbers to your PDF",
        href: "/add-page-numbers",
        icon: "Hash",
        category: "edit",
        color: "from-teal-500 to-teal-600",
    },
    {
        id: "remove-pages",
        name: "Remove Pages",
        description: "Delete specific pages from your PDF",
        href: "/remove-pages",
        icon: "Trash2",
        category: "edit",
        color: "from-red-400 to-red-500",
    },
    {
        id: "extract-pages",
        name: "Extract Pages",
        description: "Extract selected pages to a new PDF",
        href: "/extract-pages",
        icon: "FileOutput",
        category: "edit",
        color: "from-emerald-500 to-emerald-600",
    },
    {
        id: "edit-metadata",
        name: "Edit Metadata",
        description: "View and edit PDF document properties",
        href: "/edit-metadata",
        icon: "FileText",
        category: "edit",
        color: "from-purple-500 to-purple-600",
    },
    {
        id: "add-text",
        name: "Add Text to PDF",
        description: "Insert text boxes anywhere on your PDF",
        href: "/add-text",
        icon: "Type",
        category: "edit",
        color: "from-blue-500 to-blue-600",
    },
    {
        id: "sign-pdf",
        name: "Sign PDF",
        description: "Add your signature to PDF documents",
        href: "/sign-pdf",
        icon: "PenTool",
        category: "edit",
        color: "from-violet-500 to-violet-600",
        comingSoon: true,
    },
    {
        id: "edit-pdf",
        name: "Edit PDF",
        description: "Add text, shapes, and annotations",
        href: "/edit-pdf",
        icon: "Edit3",
        category: "edit",
        color: "from-fuchsia-500 to-fuchsia-600",
        comingSoon: true,
    },

    // Security
    {
        id: "protect-pdf",
        name: "Protect PDF",
        description: "Add password protection to your PDF",
        href: "/protect-pdf",
        icon: "Lock",
        category: "security",
        color: "from-red-500 to-red-600",
    },
    {
        id: "unlock-pdf",
        name: "Unlock PDF",
        description: "Remove password protection from PDF",
        href: "/unlock-pdf",
        icon: "Unlock",
        category: "security",
        color: "from-amber-500 to-amber-600",
    },

    // Optimize
    {
        id: "compress-pdf",
        name: "Compress PDF",
        description: "Reduce PDF file size without losing quality",
        href: "/compress-pdf",
        icon: "Minimize2",
        category: "optimize",
        color: "from-lime-500 to-lime-600",
    },
    {
        id: "repair-pdf",
        name: "Repair PDF",
        description: "Fix corrupted or damaged PDF files",
        href: "/repair-pdf",
        icon: "Wrench",
        category: "optimize",
        color: "from-yellow-500 to-yellow-600",
        comingSoon: true,
    },
];

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_FILES = 20;

export const SUPPORTED_PDF_TYPES = ["application/pdf"];
export const SUPPORTED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
    "image/tiff",
];

export const PAGE_SIZES = {
    a4: { width: 595.28, height: 841.89 },
    letter: { width: 612, height: 792 },
};

export const COMPRESSION_LEVELS = {
    extreme: {
        label: "Extreme Compression",
        description: "Smallest file size, lower quality",
        quality: 0.3,
    },
    recommended: {
        label: "Recommended",
        description: "Good balance of size and quality",
        quality: 0.6,
    },
    less: {
        label: "Less Compression",
        description: "Larger file, higher quality",
        quality: 0.85,
    },
};

export const DPI_OPTIONS = [
    { value: 72, label: "72 DPI (Screen)" },
    { value: 150, label: "150 DPI (Standard)" },
    { value: 300, label: "300 DPI (Print)" },
];

export const IMAGE_FORMATS = [
    { value: "jpg", label: "JPG" },
    { value: "png", label: "PNG" },
    { value: "webp", label: "WEBP" },
];
