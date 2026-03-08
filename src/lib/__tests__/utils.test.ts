import { describe, it, expect } from "vitest";
import {
    formatFileSize,
    generateId,
    getFileExtension,
    removeFileExtension,
    pluralize,
    clamp,
} from "@/lib/utils";

describe("formatFileSize", () => {
    it("formats 0 bytes", () => {
        expect(formatFileSize(0)).toBe("0 Bytes");
    });

    it("formats bytes", () => {
        expect(formatFileSize(500)).toBe("500 Bytes");
    });

    it("formats KB", () => {
        expect(formatFileSize(1024)).toBe("1 KB");
        expect(formatFileSize(1536)).toBe("1.5 KB");
    });

    it("formats MB", () => {
        expect(formatFileSize(1048576)).toBe("1 MB");
    });

    it("formats GB", () => {
        expect(formatFileSize(1073741824)).toBe("1 GB");
    });
});

describe("generateId", () => {
    it("returns a string", () => {
        expect(typeof generateId()).toBe("string");
    });

    it("returns unique values", () => {
        const ids = new Set(Array.from({ length: 100 }, () => generateId()));
        expect(ids.size).toBe(100);
    });
});

describe("getFileExtension", () => {
    it("extracts pdf extension", () => {
        expect(getFileExtension("document.pdf")).toBe("pdf");
    });

    it("extracts from nested name", () => {
        expect(getFileExtension("my.file.name.txt")).toBe("txt");
    });

    it("returns empty for no extension", () => {
        expect(getFileExtension("noextension")).toBe("");
    });
});

describe("removeFileExtension", () => {
    it("removes extension", () => {
        expect(removeFileExtension("document.pdf")).toBe("document");
    });

    it("removes only last extension", () => {
        expect(removeFileExtension("file.name.pdf")).toBe("file.name");
    });
});

describe("pluralize", () => {
    it("returns singular for count 1", () => {
        expect(pluralize(1, "page")).toBe("page");
    });

    it("returns plural for count > 1", () => {
        expect(pluralize(5, "page")).toBe("pages");
    });

    it("returns custom plural", () => {
        expect(pluralize(2, "index", "indices")).toBe("indices");
    });

    it("returns plural for count 0", () => {
        expect(pluralize(0, "page")).toBe("pages");
    });
});

describe("clamp", () => {
    it("clamps below min", () => {
        expect(clamp(-5, 0, 100)).toBe(0);
    });

    it("clamps above max", () => {
        expect(clamp(150, 0, 100)).toBe(100);
    });

    it("returns value when in range", () => {
        expect(clamp(50, 0, 100)).toBe(50);
    });

    it("returns min when value equals min", () => {
        expect(clamp(0, 0, 100)).toBe(0);
    });

    it("returns max when value equals max", () => {
        expect(clamp(100, 0, 100)).toBe(100);
    });
});
