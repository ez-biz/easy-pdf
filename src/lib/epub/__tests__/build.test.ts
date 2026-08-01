import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { itemsToParagraphs, paragraphsToChapters, buildEpubZip, escapeXml } from "../build";

const OPTS = { identifier: "urn:uuid:test-1234", modified: "2026-08-01T00:00:00Z" };

const build = (pages: string[][], title = "Doc") =>
    buildEpubZip(paragraphsToChapters(pages), title, OPTS);

const read = async (zip: JSZip, path: string) => {
    const f = zip.file(path);
    if (!f) throw new Error(`missing entry: ${path}`);
    return f.async("string");
};

describe("itemsToParagraphs", () => {
    it("splits on end-of-line hints and joins consecutive lines into a paragraph", () => {
        expect(
            itemsToParagraphs([
                { str: "Hello ", hasEOL: false },
                { str: "world", hasEOL: true },
                { str: "second line", hasEOL: true },
            ]),
        ).toEqual(["Hello world second line"]);
    });

    it("breaks a paragraph on a blank line", () => {
        expect(
            itemsToParagraphs([
                { str: "One", hasEOL: true },
                { str: "", hasEOL: true },
                { str: "Two", hasEOL: true },
            ]),
        ).toEqual(["One", "Two"]);
    });

    it("keeps trailing text that has no end-of-line hint", () => {
        expect(itemsToParagraphs([{ str: "dangling" }])).toEqual(["dangling"]);
    });

    it("returns nothing for an empty or whitespace-only page", () => {
        expect(itemsToParagraphs([])).toEqual([]);
        expect(itemsToParagraphs([{ str: "   ", hasEOL: true }])).toEqual([]);
    });
});

describe("escapeXml", () => {
    it("escapes all five XML entities", () => {
        expect(escapeXml(`<a href="x">R&D 'q'</a>`)).toBe(
            "&lt;a href=&quot;x&quot;&gt;R&amp;D &apos;q&apos;&lt;/a&gt;",
        );
    });
});

describe("buildEpubZip", () => {
    // REGRESSION: the tool used to put the source PDF in the spine with
    // media-type application/pdf and no XHTML fallback. That is invalid
    // EPUB 3 and renders in no e-reader.
    it("puts only XHTML documents in the spine", async () => {
        const opf = await read(build([["a"], ["b"]]), "OEBPS/content.opf");
        const spineIds = [...opf.matchAll(/<itemref idref="([^"]+)"/g)].map((m) => m[1]);
        expect(spineIds).toEqual(["page1", "page2"]);

        for (const id of spineIds) {
            const item = opf.match(new RegExp(`<item id="${id}"[^>]*>`))![0];
            expect(item).toContain('media-type="application/xhtml+xml"');
        }
        expect(opf).not.toContain("application/pdf");
    });

    it("never embeds a PDF in the archive", async () => {
        const zip = build([["a"]]);
        expect(Object.keys(zip.files).some((n) => n.toLowerCase().endsWith(".pdf"))).toBe(false);
    });

    // OCF requirement: `mimetype` must be the first entry and stored uncompressed.
    it("writes mimetype first and uncompressed", async () => {
        const zip = build([["a"]]);
        expect(Object.keys(zip.files)[0]).toBe("mimetype");
        expect(await read(zip, "mimetype")).toBe("application/epub+zip");

        const bytes = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const method = view.getUint16(8, true); // local file header: compression method
        const nameLen = view.getUint16(26, true);
        const name = new TextDecoder().decode(bytes.slice(30, 30 + nameLen));
        expect(name).toBe("mimetype");
        expect(method).toBe(0); // 0 = STORE
    });

    it("emits one XHTML chapter per page containing the page text", async () => {
        const zip = build([["first para", "second para"], ["page two"]]);
        const p1 = await read(zip, "OEBPS/page1.xhtml");
        expect(p1).toContain("<p>first para</p>");
        expect(p1).toContain("<p>second para</p>");
        expect(await read(zip, "OEBPS/page2.xhtml")).toContain("<p>page two</p>");
    });

    it("declares the nav document and lists every chapter in it", async () => {
        const zip = build([["a"], ["b"], ["c"]]);
        const opf = await read(zip, "OEBPS/content.opf");
        expect(opf).toContain('<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>');

        const nav = await read(zip, "OEBPS/nav.xhtml");
        expect(nav).toContain('<a href="page1.xhtml">');
        expect(nav).toContain('<a href="page2.xhtml">');
        expect(nav).toContain('<a href="page3.xhtml">');
    });

    it("points container.xml at the package document", async () => {
        const c = await read(build([["a"]]), "META-INF/container.xml");
        expect(c).toContain('full-path="OEBPS/content.opf"');
        expect(c).toContain('media-type="application/oebps-package+xml"');
    });

    it("carries the unique identifier the package declares", async () => {
        const opf = await read(build([["a"]]), "OEBPS/content.opf");
        expect(opf).toContain('unique-identifier="book-id"');
        expect(opf).toContain(`<dc:identifier id="book-id">${OPTS.identifier}</dc:identifier>`);
    });

    it("escapes the title rather than breaking the XML", async () => {
        const opf = await read(build([["a"]], `Tom & "Jerry" <x>`), "OEBPS/content.opf");
        expect(opf).toContain("<dc:title>Tom &amp; &quot;Jerry&quot; &lt;x&gt;</dc:title>");
    });

    it("escapes page text so PDF content cannot inject markup", async () => {
        const p1 = await read(build([['</p><script>alert(1)</script>']]), "OEBPS/page1.xhtml");
        expect(p1).not.toContain("<script>");
        expect(p1).toContain("&lt;script&gt;");
    });

    it("emits a placeholder for a page with no extractable text", async () => {
        const zip = build([[]]);
        const opf = await read(zip, "OEBPS/content.opf");
        expect(opf).toContain('idref="page1"'); // still in the spine
        expect(await read(zip, "OEBPS/page1.xhtml")).toContain("<p/>");
    });
});
