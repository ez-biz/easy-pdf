import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function generateId(): string {
    return Math.random().toString(36).substring(2, 11);
}

export function getFileExtension(filename: string): string {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

export function removeFileExtension(filename: string): string {
    return filename.replace(/\.[^/.]+$/, "");
}

export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
}

export async function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export function pluralize(
    count: number,
    singular: string,
    plural?: string
): string {
    return count === 1 ? singular : plural || singular + "s";
}

// Helper function to create a Blob from Uint8Array
// This handles TypeScript 5.7+ type compatibility issues
export function createPdfBlob(data: Uint8Array): Blob {
    return new Blob([data as BlobPart], { type: "application/pdf" });
}
