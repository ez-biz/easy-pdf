# API Reference

This document describes all PDF utility functions available in EasyPDF.

## Overview

All PDF operations are located in `src/lib/pdf/`. Each function:
- Processes files **client-side only**
- Returns a `PDFOperationResult` object
- Never uploads files to a server

### Common Types

```typescript
interface PDFOperationResult {
  success: boolean;
  data?: Uint8Array;      // The processed PDF bytes
  error?: string;         // Error message if failed
  pageCount?: number;     // Number of pages (if applicable)
}
```

---

## Core Functions

### merge.ts

#### `mergePDFs(files: File[]): Promise<PDFOperationResult>`

Combines multiple PDF files into a single document.

```typescript
import { mergePDFs } from "@/lib/pdf/merge";

const result = await mergePDFs([file1, file2, file3]);
if (result.success) {
  // result.data contains merged PDF bytes
}
```

---

### split.ts

#### `splitPDF(file: File, ranges: PageRange[]): Promise<PDFOperationResult>`

Splits a PDF by page ranges.

```typescript
import { splitPDF } from "@/lib/pdf/split";

// Extract pages 1-3 and 5-7
const result = await splitPDF(file, [
  { start: 0, end: 2 },
  { start: 4, end: 6 }
]);
```

---

### compress.ts

#### `compressPDF(file: File, quality: CompressionQuality): Promise<PDFOperationResult>`

Compresses a PDF to reduce file size.

```typescript
import { compressPDF } from "@/lib/pdf/compress";

type CompressionQuality = "low" | "medium" | "high";
const result = await compressPDF(file, "medium");
```

---

### rotate.ts

#### `rotatePDF(file: File, rotations: RotationMap): Promise<PDFOperationResult>`

Rotates specific pages in a PDF.

```typescript
import { rotatePDF } from "@/lib/pdf/rotate";

// Rotate page 0 by 90°, page 2 by 180°
const result = await rotatePDF(file, {
  0: 90,
  2: 180
});
```

---

### organize.ts

#### `getPageCount(file: File): Promise<number>`

Returns the number of pages in a PDF.

#### `extractPages(file: File, pageIndices: number[]): Promise<PDFOperationResult>`

Creates a new PDF from selected pages.

#### `removePages(file: File, pageIndices: number[]): Promise<PDFOperationResult>`

Removes specified pages from a PDF.

#### `reorderPages(file: File, newOrder: number[]): Promise<PDFOperationResult>`

Reorders pages according to new index array.

```typescript
import { extractPages, removePages, reorderPages } from "@/lib/pdf/organize";

// Extract pages 0, 2, 4
const extracted = await extractPages(file, [0, 2, 4]);

// Remove pages 1, 3
const removed = await removePages(file, [1, 3]);

// Reorder: page 2 first, then 0, then 1
const reordered = await reorderPages(file, [2, 0, 1]);
```

---

### watermark.ts

#### `addTextWatermark(file: File, options: WatermarkOptions): Promise<PDFOperationResult>`

Adds a text watermark to all pages.

```typescript
import { addTextWatermark, WatermarkPosition } from "@/lib/pdf/watermark";

type WatermarkPosition = 
  | "center" | "diagonal" 
  | "top-left" | "top-right" 
  | "bottom-left" | "bottom-right";

const result = await addTextWatermark(file, {
  text: "CONFIDENTIAL",
  fontSize: 48,
  opacity: 0.3,
  position: "diagonal",
  color: { r: 0.5, g: 0.5, b: 0.5 }
});
```

---

### pageNumbers.ts

#### `addPageNumbers(file: File, options: PageNumberOptions): Promise<PDFOperationResult>`

Adds page numbers to all pages.

```typescript
import { addPageNumbers, PageNumberPosition, PageNumberFormat } from "@/lib/pdf/pageNumbers";

type PageNumberPosition = 
  | "bottom-left" | "bottom-center" | "bottom-right"
  | "top-left" | "top-center" | "top-right";

type PageNumberFormat = "number" | "page-number" | "number-of-total";

const result = await addPageNumbers(file, {
  position: "bottom-center",
  format: "number-of-total",  // "1 of 10"
  fontSize: 12,
  startNumber: 1,
  margin: 30
});
```

---

### metadata.ts

#### `readMetadata(file: File): Promise<MetadataResult>`

Reads PDF metadata properties.

#### `updateMetadata(file: File, metadata: Partial<PDFMetadata>): Promise<PDFOperationResult>`

Updates PDF metadata.

```typescript
import { readMetadata, updateMetadata } from "@/lib/pdf/metadata";

interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

const meta = await readMetadata(file);
const updated = await updateMetadata(file, {
  title: "My Document",
  author: "John Doe"
});
```

---

### security.ts

#### `protectPDF(file: File, password: string): Promise<PDFOperationResult>`

Adds password protection to a PDF.

#### `unlockPDF(file: File, password: string): Promise<PDFOperationResult>`

Removes password from a protected PDF.

```typescript
import { protectPDF, unlockPDF } from "@/lib/pdf/security";

const protected = await protectPDF(file, "mypassword");
const unlocked = await unlockPDF(file, "mypassword");
```

> **Note:** Client-side encryption has limitations. For production security needs, use server-side encryption.

---

### toImage.ts

#### `convertPDFToImages(file: File, format: ImageFormat, quality: number): Promise<string[]>`

Converts PDF pages to images.

#### `getPDFThumbnails(file: File, size: number): Promise<string[]>`

Generates small thumbnail previews.

```typescript
import { convertPDFToImages, getPDFThumbnails } from "@/lib/pdf/toImage";

type ImageFormat = "png" | "jpeg" | "webp";

// Convert to JPEG at 80% quality
const images = await convertPDFToImages(file, "jpeg", 0.8);

// Get 150px wide thumbnails
const thumbs = await getPDFThumbnails(file, 150);
```

---

### fromImage.ts

#### `imagesToPDF(files: File[], options: ImageToPDFOptions): Promise<PDFOperationResult>`

Creates a PDF from images.

```typescript
import { imagesToPDF } from "@/lib/pdf/fromImage";

const result = await imagesToPDF([img1, img2], {
  pageSize: "A4",      // or "Letter", "fit"
  orientation: "auto"  // or "portrait", "landscape"
});
```

---

### addText.ts

#### `addTextToPDF(file: File, textBoxes: TextBox[]): Promise<PDFOperationResult>`

Adds text overlays to PDF pages.

```typescript
import { addTextToPDF, TextBox } from "@/lib/pdf/addText";

interface TextBox {
  id: string;
  text: string;
  x: number;          // Percentage (0-100)
  y: number;          // Percentage (0-100)
  page: number;       // 0-indexed
  fontSize: number;
  fontFamily: "Helvetica" | "Times-Roman" | "Courier";
  color: string;      // Hex color
  rotation: 0 | 90 | 180 | 270;
  align: "left" | "center" | "right";
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
}
```

---

### addImage.ts

#### `addImagesToPDF(file: File, overlays: ImageOverlay[]): Promise<PDFOperationResult>`

Adds image overlays to PDF pages.

```typescript
import { addImagesToPDF, ImageOverlay } from "@/lib/pdf/addImage";

interface ImageOverlay {
  id: string;
  file: File;         // The image file
  x: number;          // Percentage (0-100)
  y: number;          // Percentage (0-100)
  width: number;      // Percentage
  height: number;     // Percentage
  page: number;       // 0-indexed
  rotation: number;   // Degrees
}
```

---

## Utility Functions

### utils.ts

#### `downloadBlob(blob: Blob, filename: string): void`

Triggers a browser download.

#### `createPdfBlob(data: Uint8Array): Blob`

Creates a PDF blob from byte array.

```typescript
import { downloadBlob, createPdfBlob } from "@/lib/utils";

const blob = createPdfBlob(result.data);
downloadBlob(blob, "output.pdf");
```
