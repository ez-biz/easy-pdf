# Conversion & Optimization

## 1. Image to PDF
Converts images (JPG, PNG) into a PDF document.
-   **Frontend**: `src/app/(tools)/image-to-pdf/`
-   **Logic**: `src/lib/pdf/fromImage.ts`
-   **Process**:
    1.  Create blank PDF page(s) (A4 or Image Dimensions).
    2.  Embed image.
    3.  Draw image to fill page (with or without margins).

## 2. PDF to Image
Rasterizes PDF pages into images.
-   **Frontend**: `src/app/(tools)/pdf-to-image/`
-   **Logic**: `src/lib/pdf/toImage.ts`
-   **Tech**: Uses `pdf.js` (Mozilla) to render PDF to an HTML Canvas, then exports canvas as Data URL.
-   **Note**: This is computationally expensive in the browser for large PDFs.

## 3. Compress PDF
Reduces PDF file size.
-   **Frontend**: `src/app/(tools)/compress-pdf/`
-   **Logic**: `src/lib/pdf/compress.ts`
-   **Limitations (Client-Side)**:
    -   `pdf-lib` does not support strong compression/resampling of existing images out-of-the-box.
    -   Current implementation often relies on removing unused objects or Metadata.
    -   *For effective image compression, we would need to extract images, resize them on a canvas, and re-embed them (complex).*
