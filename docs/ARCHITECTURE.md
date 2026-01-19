# System Architecture

## Overview

**EasyPDF** is a privacy-focused PDF manipulation suite built with Next.js 15. All file processing happens client-side in the browser—files are never uploaded to a server.

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15.5+ (App Router) |
| **Language** | TypeScript 5+ (strict mode) |
| **Styling** | Tailwind CSS 3.4 |
| **PDF Engine** | pdf-lib (client-side) |
| **PDF Rendering** | pdfjs-dist (thumbnails) |
| **Animations** | Framer Motion 11+ |
| **State** | Zustand 5 (app state), React Context (toasts) |
| **Icons** | Lucide React |

---

## Directory Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (tools)/              # Tool route group
│   │   ├── merge-pdf/
│   │   │   ├── page.tsx      # Server Component (metadata, JSON-LD)
│   │   │   └── MergeClient.tsx  # Client Component (UI logic)
│   │   └── ...               # Other tools follow same pattern
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Homepage
│   ├── robots.ts             # Dynamic robots.txt
│   └── sitemap.ts            # Dynamic sitemap.xml
├── components/
│   ├── layout/               # Header, Footer, ToolLayout
│   ├── tools/                # FileUploader, PDFPageRenderer, etc.
│   └── ui/                   # Button, ProgressBar, Toast
├── lib/
│   ├── pdf/                  # PDF processing functions
│   ├── constants.ts          # Tool definitions
│   └── utils.ts              # Helper utilities
├── store/                    # Zustand stores
├── contexts/                 # React Context (ToastContext)
└── types/                    # TypeScript types
```

---

## Core Concepts

### 1. Client-Side Processing

All PDF operations use `pdf-lib` in the browser:

```
User Upload → ArrayBuffer → PDFDocument.load() → Processing → doc.save() → Download
```

**Benefits:**
- ✅ Complete privacy (files never leave device)
- ✅ No server costs
- ✅ Works offline after initial load
- ✅ No file size restrictions

### 2. Server/Client Component Pattern

Each tool follows this pattern for SEO optimization:

```
page.tsx (Server Component)
├── Exports Metadata (title, description, OpenGraph)
├── Renders JSON-LD structured data
└── Renders *Client.tsx component

*Client.tsx (Client Component)
├── "use client" directive
├── useState, useEffect, event handlers
└── Interactive UI logic
```

**Example:**
```typescript
// page.tsx (Server Component)
import { Metadata } from 'next';
import MergeClient from './MergeClient';

export const metadata: Metadata = {
  title: 'Merge PDF - Combine PDF Files',
  description: 'Merge multiple PDFs into one document.',
};

export default function MergePage() {
  return (
    <>
      <script type="application/ld+json" ... />
      <MergeClient />
    </>
  );
}
```

### 3. Coordinate System

PDFs use **bottom-left origin** while HTML uses **top-left origin**.

```
PDF Coordinates:          HTML Coordinates:
┌─────────────┐           ┌─────────────┐
│             │           │ (0,0)       │
│             │           │             │
│ (0,0)       │           │             │
└─────────────┘           └─────────────┘
```

When placing overlays, always convert:
```typescript
const pdfY = pageHeight - htmlY - elementHeight;
```

### 4. Tool Registration

All tools are defined in `src/lib/constants.ts`:

```typescript
export const ALL_TOOLS: Tool[] = [
  { slug: "merge-pdf", name: "Merge PDF", icon: Combine, ... },
  { slug: "split-pdf", name: "Split PDF", icon: Scissors, ... },
  // ...
];
```

Adding a new tool requires:
1. Add entry to `ALL_TOOLS` array
2. Create directory `src/app/(tools)/[slug]/`
3. Create `page.tsx` (server) + `*Client.tsx` (client)
4. Create PDF utility in `src/lib/pdf/`

---

## SEO Architecture

### Metadata

Each page exports a `Metadata` object:

```typescript
export const metadata: Metadata = {
  title: 'Tool Name - Description',
  description: 'Detailed description for search engines.',
  openGraph: {
    title: 'Tool Name',
    description: 'Description for social sharing.',
  },
};
```

### JSON-LD Structured Data

Each tool includes SoftwareApplication schema:

```typescript
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "EasyPDF Merge",
  "applicationCategory": "ProductivityApplication",
  "offers": { "@type": "Offer", "price": "0" }
}
</script>
```

### Sitemap & Robots

Dynamic generation from constants:

- `src/app/sitemap.ts` - Generates sitemap.xml from `ALL_TOOLS`
- `src/app/robots.ts` - Generates robots.txt with sitemap reference

Both use `export const dynamic = "force-static"` for static export.

---

## State Management

### Zustand Store (`src/store/useAppStore.ts`)

```typescript
interface AppState {
  settings: Settings;          // Theme, preferences
  activities: Activity[];      // Recent operations
  stats: Stats;                // Usage statistics
  toggleDarkMode: () => void;
  addActivity: (activity) => void;
}
```

Persisted to localStorage with `persist` middleware.

### Toast Context (`src/contexts/ToastContext.tsx`)

```typescript
const toast = useToast();
toast.success("Operation complete!");
toast.error("Something went wrong");
toast.warning("Please upload a file");
toast.info("Processing...");
```
