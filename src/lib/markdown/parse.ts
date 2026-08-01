/**
 * Markdown -> structured content blocks.
 *
 * Extracted from MarkdownToPdfClient so the parsing rules (tables, links,
 * ordered lists) can be unit-tested without rendering a PDF.
 */

export interface TextSegment {
    text: string;
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
    link?: string;
}

export interface ContentBlock {
    type: "h1" | "h2" | "h3" | "paragraph" | "bullet" | "ordered" | "blockquote" | "code" | "hr" | "table";
    segments?: TextSegment[];
    text?: string;
    /** Rendered marker for ordered list items, e.g. "1." */
    marker?: string;
    /** Table cells; the first row is the header. */
    rows?: string[][];
}

export function parseInlineFormatting(text: string): TextSegment[] {
    const segments: TextSegment[] = [];
    let remaining = text;
    let currentPlain = "";

    const flushPlain = () => {
        if (currentPlain) {
            segments.push({ text: currentPlain });
            currentPlain = "";
        }
    };

    while (remaining.length > 0) {
        const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
        const italicMatch = remaining.match(/^\*(.+?)\*(?!\*)/);
        const codeMatch = remaining.match(/^`(.+?)`/);
        const linkMatch = remaining.match(/^\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/);

        if (linkMatch) {
            flushPlain();
            segments.push({ text: linkMatch[1], link: linkMatch[2] });
            remaining = remaining.slice(linkMatch[0].length);
        } else if (boldMatch) {
            flushPlain();
            segments.push({ text: boldMatch[1], bold: true });
            remaining = remaining.slice(boldMatch[0].length);
        } else if (italicMatch) {
            flushPlain();
            segments.push({ text: italicMatch[1], italic: true });
            remaining = remaining.slice(italicMatch[0].length);
        } else if (codeMatch) {
            flushPlain();
            segments.push({ text: codeMatch[1], code: true });
            remaining = remaining.slice(codeMatch[0].length);
        } else {
            currentPlain += remaining[0];
            remaining = remaining.slice(1);
        }
    }

    flushPlain();
    return segments;
}

export function parseMarkdown(md: string): ContentBlock[] {
    const lines = md.split("\n");
    const blocks: ContentBlock[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Headings
        const h1 = line.match(/^# (.+)/);
        const h2 = line.match(/^## (.+)/);
        const h3 = line.match(/^### (.+)/);

        if (h1) {
            blocks.push({ type: "h1", segments: parseInlineFormatting(h1[1]) });
            continue;
        }
        if (h2) {
            blocks.push({ type: "h2", segments: parseInlineFormatting(h2[1]) });
            continue;
        }
        if (h3) {
            blocks.push({ type: "h3", segments: parseInlineFormatting(h3[1]) });
            continue;
        }

        // Horizontal rule
        if (/^[-*_]{3,}\s*$/.test(line)) {
            blocks.push({ type: "hr" });
            continue;
        }

        // Blockquote
        if (line.startsWith("> ")) {
            blocks.push({ type: "blockquote", segments: parseInlineFormatting(line.slice(2)) });
            continue;
        }

        // Code block
        if (line.startsWith("```")) {
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].startsWith("```")) {
                codeLines.push(lines[i]);
                i++;
            }
            blocks.push({ type: "code", text: codeLines.join("\n") });
            continue;
        }

        // Table: a pipe row followed by a |---|---| separator row
        const isPipeRow = (l?: string) => !!l && /^\s*\|.*\|\s*$/.test(l);
        const isSeparatorRow = (l?: string) => !!l && /^\s*\|[\s:|-]+\|\s*$/.test(l) && l.includes("-");
        if (isPipeRow(line) && isSeparatorRow(lines[i + 1])) {
            const splitRow = (l: string) =>
                l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

            const rows: string[][] = [splitRow(line)];
            i += 2; // consume header + separator
            while (i < lines.length && isPipeRow(lines[i])) {
                rows.push(splitRow(lines[i]));
                i++;
            }
            i--; // the outer loop will advance past the last consumed line
            blocks.push({ type: "table", rows });
            continue;
        }

        // Bullet list
        const bullet = line.match(/^[-*+]\s+(.+)/);
        if (bullet) {
            blocks.push({ type: "bullet", segments: parseInlineFormatting(bullet[1]) });
            continue;
        }

        // Numbered list
        const numbered = line.match(/^(\d+)\.\s+(.+)/);
        if (numbered) {
            blocks.push({
                type: "ordered",
                marker: `${numbered[1]}.`,
                segments: parseInlineFormatting(numbered[2]),
            });
            continue;
        }

        // Empty line
        if (line.trim() === "") {
            continue;
        }

        // Regular paragraph
        blocks.push({ type: "paragraph", segments: parseInlineFormatting(line) });
    }

    return blocks;
}

export function renderSegmentsToString(segments?: TextSegment[]): string {
    if (!segments) return "";
    return segments.map((s) => s.text).join("");
}
