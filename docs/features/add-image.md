# Add Image - Technical Documentation

## Overview
Allows placing images (PNG/JPG) onto specific PDF pages.

## Key Logic: Coordinate Conversion
This is the most critical part of the implementation.
-   **HTML Preview**: We render the PDF page into a `div` (Canvas container).
-   **User Interaction**: User drags a `div` (the image overlay) relative to the container `top-left`.
-   **PDF Embedding**: We must place the image into the PDF using `(x, y)` relative to the PDF's `bottom-left`.

### The Formulae
Given:
-   `containerHeight`: Height of the HTML preview element.
-   `pageHeight`: Height of the PDF page point.
-   `yHTML`: Top position in pixels.

Conversion:
```typescript
// Y-Axis Inversion
const yPDF = pageHeight - (yHTML * (pageHeight / containerHeight)) - (imageHeightPDF);
```
*Note: We must subtract the image height because PDF placement origin is bottom-left, but we usually position the top-left of the image.*

## Aspect Ratio Lock
When resizing images, we force the `width/height` ratio to remain constant to prevent skewing.
-   **Implementation**: `DraggableImageBox.tsx` (using `onResize` handler).
-   Logic: When `width` changes by `delta`, update `height` by `delta / aspectRatio`.
