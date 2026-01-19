# Sign PDF - Technical Documentation

## Overview
The **Sign PDF** tool allows users to overlay signatures onto PDF documents. It supports two modes:
1.  **Draw Signature**: Using an HTML5 Canvas.
2.  **Upload Signature**: Using an image file.

## Key Components
-   `src/app/(tools)/sign-pdf/page.tsx`: Main controller. Manages state (overlays, current page).
-   `SignaturePad.tsx`: The drawing interface.
-   `image-processing.ts`: Utilities for image manipulation.

## Features & Algorithms

### 1. Canvas Trimming (Whitespace Removal)
When a user draws a signature, we want to save *only* the drawn area, not the huge empty white canvas.
-   **Implementation**: `SignaturePad.tsx -> getContentBoundingBox()`
-   **Logic**:
    1.  Get `ImageData` (pixels) from the canvas.
    2.  Iterate to find the `minX`, `minY`, `maxX`, `maxY` of non-transparent pixels.
    3.  Create a temporary canvas sized to these bounds.
    4.  Draw the source content into the temp canvas.
    5.  Export temp canvas as PNG.

### 2. Background Removal (Magic Wand)
Users often upload photos of signatures on white paper. We need to make the background transparent.
-   **Implementation**: `src/lib/image-processing.ts -> removeWhiteBackground`
-   **Logic**:
    -   Iterate all pixels.
    -   Check RGB values against a threshold (default 220).
    -   If `R > 220` AND `G > 220` AND `B > 220` (i.e., White/Light Gray):
        -   Set Alpha channel to 0 (Transparent).

### 3. Tinting (Ink Color Change)
Users may want to change a Black signature to Blue or Red.
-   **Implementation**: `src/lib/image-processing.ts -> changeImageColor`
-   **Challenge**: Simple tinting turns the *entire image* (including background) into the target color if not careful.
-   **Logic (Smart Tint)**:
    -   Calculate Pixel Luminance: `L = (R+G+B)/3`.
    -   **Threshold**: Check if `L < 230` (Dark/Ink).
    -   **Action**:
        -   If Dark: Change RGB to Target Color (e.g., Blue).
        -   If Light (Background): Leave unchanged (preserve White/Alpha).
