# System Architecture

## Overview
**Easy PDF** is a client-side first PDF manipulation tool built with [Next.js](https://nextjs.org/). It prioritizes user privacy by processing files completely within the browser whenever possible, avoiding unrelated server uploads.

## Tech Stack
-   **Framework**: Next.js 14+ (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **PDF Engine**: `pdf-lib` (Client-side PDF modification)
-   **UI Animations**: `framer-motion`
-   **State Management**: `zustand` (App state), React Context (Toast)
-   **Icons**: `lucide-react`

## Directory Structure
```
src/
├── app/                 # Next.js App Router
│   ├── (tools)/         # Route groups for specific tools (e.g., /sign-pdf, /add-image)
│   ├── layout.tsx       # Root layout (Header, Footer, Analytics)
│   └── page.tsx         # Homepage (Tool Grid)
├── components/
│   ├── layout/          # Shared layout components (Header, Footer, ToolLayout)
│   ├── tools/           # specific tool components (SignaturePad, DraggableImageBox)
│   └── ui/              # Generic UI Setup (Button, Card, Toast)
├── lib/
│   ├── pdf/             # Core PDF logic (addImage, merge, etc.)
│   ├── image-processing.ts # Canvas-based image manipulation
│   └── constants.ts     # Configuration for all tools (Metadata, Icons, Slugs)
├── store/               # Zustand stores
└── styles/              # Global CSS
```

## Core Concepts

### 1. Client-Side Processing
We use `pdf-lib` to load and modify PDFs in the browser.
-   **Input**: User uploads a file -> `ArrayBuffer`.
-   **Processing**: `PDFDocument.load(buffer)`.
-   **Output**: `doc.save()` -> `Blob` -> Download Link.

### 2. Coordinate Systems (The Tricky Part)
PDFs use a bottom-left coordinate system (0,0 is bottom-left), while HTML/Canvas uses top-left.
-   When placing elements (like images or signatures), we must convert HTML coordinates (top-left relative to container) to PDF coordinates (bottom-left relative to page).
-   **CropBox vs MediaBox**: We respect the PDF `CropBox` to ensure overlays align correctly even on cropped pages.

### 3. Tool Configuration
All available tools are defined in `src/lib/constants.ts`. Adding a new tool requires:
1.  Adding an entry to `ALL_TOOLS`.
2.  Creating the route directory in `src/app/(tools)/[tool-slug]`.
