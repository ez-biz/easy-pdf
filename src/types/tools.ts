// LucideIcon removed
export interface Tool {
    id: string;
    name: string;
    description: string;
    href: string;
    icon: string;
    category: ToolCategory;
    color: string;
    comingSoon?: boolean;
}

export type ToolCategory =
    | "organize"
    | "convert"
    | "edit"
    | "security"
    | "optimize";

export interface ToolCategoryInfo {
    id: ToolCategory;
    name: string;
    description: string;
}

export interface FileWithPreview {
    file: File;
    preview?: string;
    id: string;
    name: string;
    size: number;
    type: string;
}

export interface ProcessingResult {
    success: boolean;
    data?: Blob;
    filename?: string;
    error?: string;
    details?: {
        originalSize?: number;
        newSize?: number;
        pageCount?: number;
    };
}
