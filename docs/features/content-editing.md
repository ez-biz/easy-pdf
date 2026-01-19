# Content Editing Tools

## 1. Add Text
Overlay text onto PDF pages.
-   **Frontend**: `src/app/(tools)/add-text/`
-   **Logic**: `src/lib/pdf/addText.ts`
-   **Features**:
    -   Font Size, Color (Hex), Family (Standard Fonts: Helvetica, Times, Courier).
    -   Positioning (x, y coordinates).

## 2. Add Watermark
Stamp a text or image watermark across all (or selected) pages.
-   **Frontend**: `src/app/(tools)/add-watermark/`
-   **Logic**: `src/lib/pdf/watermark.ts`
-   **Implementation**:
    -   Draws text/image at center (or repeated).
    -   Applies `opacity` (Alpha) and `rotation` (typically 45 deg).
    -   Placed on top of existing content.

## 3. Add Page Numbers
Inserts dynamic page numbering.
-   **Frontend**: `src/app/(tools)/add-page-numbers/`
-   **Logic**: `src/lib/pdf/pageNumbers.ts`
-   **Features**:
    -   Format: "Page n", "n of N", "Page n of N".
    -   Position: Top/Bottom, Left/Center/Right.
    -   Start Page / Range.
