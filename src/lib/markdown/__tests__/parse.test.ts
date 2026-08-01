import { describe, it, expect } from "vitest";
import { parseMarkdown, parseInlineFormatting, renderSegmentsToString } from "../parse";

describe("parseInlineFormatting", () => {
    it("parses bold, italic and inline code", () => {
        expect(parseInlineFormatting("a **b** c *d* e `f`")).toEqual([
            { text: "a " },
            { text: "b", bold: true },
            { text: " c " },
            { text: "d", italic: true },
            { text: " e " },
            { text: "f", code: true },
        ]);
    });

    // REGRESSION: links used to fall through to plain text, so the raw
    // "[text](url)" markdown was drawn into the PDF verbatim.
    it("parses a link into its label, dropping the raw syntax", () => {
        expect(parseInlineFormatting("see [A link](https://example.com) here")).toEqual([
            { text: "see " },
            { text: "A link", link: "https://example.com" },
            { text: " here" },
        ]);
    });

    it("never leaves link markup in the rendered string", () => {
        const out = renderSegmentsToString(parseInlineFormatting("[x](https://e.com)"));
        expect(out).toBe("x");
        expect(out).not.toContain("[");
        expect(out).not.toContain("](");
    });

    it("handles a titled link and an empty label", () => {
        expect(parseInlineFormatting('[hi](https://e.com "T")')).toEqual([
            { text: "hi", link: "https://e.com" },
        ]);
        expect(parseInlineFormatting("[](https://e.com)")).toEqual([
            { text: "", link: "https://e.com" },
        ]);
    });

    it("leaves a bare bracket pair alone", () => {
        expect(renderSegmentsToString(parseInlineFormatting("[not a link]"))).toBe("[not a link]");
    });
});

describe("parseMarkdown", () => {
    it("parses headings, blockquote, hr and code fences", () => {
        const blocks = parseMarkdown("# H1\n## H2\n### H3\n> quote\n---\n```\ncode\n```");
        expect(blocks.map((b) => b.type)).toEqual([
            "h1",
            "h2",
            "h3",
            "blockquote",
            "hr",
            "code",
        ]);
        expect(blocks[5].text).toBe("code");
    });

    // REGRESSION: numbered lists were emitted as "bullet", losing the numbering.
    it("keeps ordered-list numbering instead of downgrading to bullets", () => {
        const blocks = parseMarkdown("1. one\n2. two\n10. ten");
        expect(blocks.map((b) => b.type)).toEqual(["ordered", "ordered", "ordered"]);
        expect(blocks.map((b) => b.marker)).toEqual(["1.", "2.", "10."]);
        expect(renderSegmentsToString(blocks[0].segments)).toBe("one");
    });

    it("still parses bullet lists as bullets", () => {
        const blocks = parseMarkdown("- a\n* b\n+ c");
        expect(blocks.map((b) => b.type)).toEqual(["bullet", "bullet", "bullet"]);
    });

    // REGRESSION: tables had no handling at all, so every row — including the
    // |---|---| separator — was drawn into the PDF as a literal paragraph.
    it("parses a pipe table into rows and consumes the separator", () => {
        const blocks = parseMarkdown(
            "| Column A | Column B |\n| -------- | -------- |\n| Value 1  | Value 2  |",
        );
        expect(blocks).toHaveLength(1);
        expect(blocks[0].type).toBe("table");
        expect(blocks[0].rows).toEqual([
            ["Column A", "Column B"],
            ["Value 1", "Value 2"],
        ]);
    });

    it("emits no paragraph containing raw pipe syntax", () => {
        const blocks = parseMarkdown("| A | B |\n| - | - |\n| 1 | 2 |");
        const paragraphs = blocks
            .filter((b) => b.type === "paragraph")
            .map((b) => renderSegmentsToString(b.segments));
        expect(paragraphs).toEqual([]);
        expect(blocks.some((b) => b.type === "table")).toBe(true);
    });

    it("resumes normal parsing after a table", () => {
        const blocks = parseMarkdown("| A | B |\n| - | - |\n| 1 | 2 |\n\n# After");
        expect(blocks.map((b) => b.type)).toEqual(["table", "h1"]);
        expect(renderSegmentsToString(blocks[1].segments)).toBe("After");
    });

    it("handles a header-only table", () => {
        const blocks = parseMarkdown("| A | B |\n| - | - |");
        expect(blocks[0].type).toBe("table");
        expect(blocks[0].rows).toEqual([["A", "B"]]);
    });

    it("supports alignment markers in the separator row", () => {
        const blocks = parseMarkdown("| A | B |\n|:--|--:|\n| 1 | 2 |");
        expect(blocks[0].type).toBe("table");
        expect(blocks[0].rows).toEqual([
            ["A", "B"],
            ["1", "2"],
        ]);
    });

    it("does not treat a pipe row without a separator as a table", () => {
        const blocks = parseMarkdown("| A | B |\njust text");
        expect(blocks.every((b) => b.type !== "table")).toBe(true);
    });

    it("keeps inline formatting inside table-adjacent content", () => {
        const blocks = parseMarkdown("**bold** text\n\n| A |\n| - |\n| 1 |");
        expect(blocks[0].type).toBe("paragraph");
        expect(blocks[0].segments?.[0]).toEqual({ text: "bold", bold: true });
        expect(blocks[1].type).toBe("table");
    });
});
