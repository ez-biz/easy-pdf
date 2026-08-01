/**
 * EPUB 3 assembly.
 *
 * Extracted from PdfToEpubClient so the package structure can be unit-tested.
 * The bug this guards against: the tool used to drop the source PDF into the
 * spine (`media-type="application/pdf"`, no XHTML fallback), which is invalid
 * EPUB 3 — no e-reader will render it.
 */
import JSZip from "jszip";

export interface EpubChapter {
    id: string;
    href: string;
    title: string;
    /** Pre-escaped XHTML body markup. */
    body: string;
}

export function escapeXml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

/** Turn one PDF page's text items into paragraphs, using pdf.js end-of-line hints. */
export function itemsToParagraphs(items: { str: string; hasEOL?: boolean }[]): string[] {
    const lines: string[] = [];
    let line = "";

    for (const item of items) {
        line += item.str;
        if (item.hasEOL) {
            lines.push(line.trim());
            line = "";
        }
    }
    if (line.trim()) lines.push(line.trim());

    // Blank lines separate paragraphs; consecutive lines are joined.
    const paragraphs: string[] = [];
    let current: string[] = [];
    for (const l of lines) {
        if (l === "") {
            if (current.length) paragraphs.push(current.join(" "));
            current = [];
        } else {
            current.push(l);
        }
    }
    if (current.length) paragraphs.push(current.join(" "));

    return paragraphs.filter((p) => p.trim() !== "");
}

/** Build the chapter list for a document whose pages are already extracted to paragraphs. */
export function paragraphsToChapters(pages: string[][]): EpubChapter[] {
    return pages.map((paragraphs, idx) => {
        const i = idx + 1;
        return {
            id: `page${i}`,
            href: `page${i}.xhtml`,
            title: `Page ${i}`,
            body: paragraphs.length
                ? paragraphs.map((p) => `    <p>${escapeXml(p)}</p>`).join("\n")
                : `    <p/>`,
        };
    });
}

/**
 * Assemble a spec-valid EPUB 3 archive. Returns the JSZip instance so callers
 * choose their own output type (and tests can inspect entries).
 */
export function buildEpubZip(
    chapters: EpubChapter[],
    title: string,
    opts: { identifier: string; modified: string },
): JSZip {
    const zip = new JSZip();

    // OCF requires `mimetype` to be the first entry and stored uncompressed.
    zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

    zip.folder("META-INF")?.file("container.xml", `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

    const oebps = zip.folder("OEBPS");

    for (const ch of chapters) {
        oebps?.file(ch.href, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeXml(ch.title)}</title>
  <meta charset="utf-8"/>
</head>
<body>
  <section epub:type="chapter" xmlns:epub="http://www.idpf.org/2007/ops">
${ch.body}
  </section>
</body>
</html>`);
    }

    const manifestItems = chapters
        .map((ch) => `    <item id="${ch.id}" href="${ch.href}" media-type="application/xhtml+xml"/>`)
        .join("\n");
    const spineItems = chapters
        .map((ch) => `    <itemref idref="${ch.id}" linear="yes"/>`)
        .join("\n");

    oebps?.file("content.opf", `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="book-id" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>EasyPDF</dc:creator>
    <dc:language>en</dc:language>
    <dc:identifier id="book-id">${escapeXml(opts.identifier)}</dc:identifier>
    <dc:date>${opts.modified.split("T")[0]}</dc:date>
    <meta property="dcterms:modified">${opts.modified}</meta>
  </metadata>
  <manifest>
${manifestItems}
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
  </manifest>
  <spine>
${spineItems}
  </spine>
</package>`);

    const navItems = chapters
        .map((ch) => `      <li><a href="${ch.href}">${escapeXml(ch.title)}</a></li>`)
        .join("\n");

    oebps?.file("nav.xhtml", `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${escapeXml(title)}</title><meta charset="utf-8"/></head>
<body>
  <nav epub:type="toc">
    <h1>Contents</h1>
    <ol>
${navItems}
    </ol>
  </nav>
</body>
</html>`);

    return zip;
}
