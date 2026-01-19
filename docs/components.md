# Shared Components

## 1. PDFPageRenderer (`src/components/tools/PDFPageRenderer.tsx`)
Renders a single PDF page into an HTML `<canvas>`.
-   **Props**: `file` (File object), `pageNumber` (1-indexed).
-   **Internals**: Uses `pdfjs-dist` to render the page at 1.5x scale (for crispness on high-DPI screens).
-   **Critical Configuration**:
    -   Sets `pdfjsLib.GlobalWorkerOptions.workerSrc` to the local worker file.
    -   *If you change Next.js bundler config, this path might break.*

## 2. FileUploader (`src/components/tools/FileUploader.tsx`)
A drag-and-drop zone for selecting files.
-   **Features**:
    -   Validates file types (PDF, Images).
    -   Max file size checks.
    -   Max file count checks.
-   **Usage**: Wraps `react-dropzone`.

## 3. ToolLayout (`src/components/layout/ToolLayout.tsx`)
The standard wrapper for every tool page.
-   **Props**: `title`, `description`, `icon`, `color`.
-   **Layout**:
    -   Header with breadcrumbs.
    -   Consistent padding/margins.
    -   Footer integration.

## 4. DraggableImageBox (`src/components/tools/DraggableImageBox.tsx`)
A complex interactive component for positioning elements (images, signatures) over a canvas.
-   **Gestures**: Drag (Move), Corner Drag (Resize), Top Drag (Rotate).
-   **Aspect Ratio**: Enforces aspect ratio locking on resize.
-   **Event Propagation**: Handles touch/mouse events carefully to avoid scrolling the page while dragging.
