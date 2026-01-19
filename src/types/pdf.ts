export interface PDFPage {
    pageNumber: number;
    thumbnail?: string;
    width: number;
    height: number;
    rotation: number;
    selected?: boolean;
}

export interface PDFDocument {
    id: string;
    name: string;
    file: File;
    pageCount: number;
    pages: PDFPage[];
    size: number;
    thumbnail?: string;
}

export interface MergeOptions {
    files: File[];
    order: number[];
}

export interface SplitOptions {
    file: File;
    mode: "range" | "pages" | "every" | "all";
    ranges?: string;
    pages?: number[];
    everyN?: number;
}

export interface CompressOptions {
    file: File;
    level: "extreme" | "recommended" | "less";
}

export interface RotateOptions {
    file: File;
    rotations: Map<number, number>;
    applyToAll?: number;
}

export interface ConvertToImageOptions {
    file: File;
    format: "jpg" | "png" | "webp";
    dpi: 72 | 150 | 300;
    pages?: number[];
}

export interface ConvertFromImageOptions {
    images: File[];
    pageSize: "a4" | "letter" | "original" | "custom";
    orientation: "portrait" | "landscape" | "auto";
    margin: "none" | "small" | "medium" | "large";
    fitToPage: boolean;
}
