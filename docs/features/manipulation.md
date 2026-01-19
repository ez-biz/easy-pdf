# Page Manipulation Tools

## Overview
These tools handle the structural organization of PDF pages without modifying their content.

## 1. Merge PDFs
Combines multiple PDF files into a single document.
-   **Frontend**: `src/app/(tools)/merge-pdf/`
-   **Logic**: `src/lib/pdf/merge.ts`
-   **Algorithm**:
    1.  Load all PDF buffers.
    2.  Create a new `PDFDocument`.
    3.  Iterate through each source doc, copy all pages using `copyPages()`, and add to the new doc.
    4.  Save.

## 2. Split PDF
Splits a PDF into separate files (e.g., by range or single pages).
-   **Frontend**: `src/app/(tools)/split-pdf/`
-   **Logic**: `src/lib/pdf/split.ts`
-   **Features**:
    -   **Extract Ranges**: "1-3, 5" -> Creates a new PDF with these pages.
    -   **Split All**: Creates one PDF per page.

## 3. Rotate PDF
Rotates specific pages or all pages by 90/180/270 degrees.
-   **Frontend**: `src/app/(tools)/rotate-pdf/`
-   **Logic**: `src/lib/pdf/rotate.ts`
-   **Details**: Modifies the `Rotation` dictionary entry of the PDF page object. Does not rasterize/re-render.

## 4. Organize Pages (Remove/Extract)
Reorder, delete, or extract specific pages.
-   **Frontend**: `src/app/(tools)/remove-pages/`, `extract-pages/`
-   **Logic**: `src/lib/pdf/organize.ts`
-   **Implementation**:
    -   **Remove**: Create new doc, copy all pages *except* selected.
    -   **Extract**: Create new doc, copy *only* selected pages.
