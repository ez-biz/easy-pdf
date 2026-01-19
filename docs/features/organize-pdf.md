# Organize PDF

**Path:** `src/app/(tools)/organize-pdf/page.tsx`

The Organize PDF tool is a comprehensive page manager that combines the functionality of "Merge", "Split", "Rotate", and "Remove Pages" into a single visual interface.

## Features
-   **Visual Grid**: View all pages as thumbnails.
-   **Drag & Drop**: Reorder pages using a sophisticated grid-based sorting system (powered by `@dnd-kit`).
-   **Rotation**: Rotate individual pages 90-degrees clockwise.
-   **Deletion**: Remove unwanted pages.
-   **Smart Layout**: Automatically handles mixed orientation (Portrait/Landscape) by scaling landscape pages to fit within the grid's card structure.

## Technical Implementation

### Backend (`src/lib/pdf/organize.ts`)
The `organizePDF` function is the core engine:
```typescript
interface PageOperation {
    originalIndex: number; 
    rotation: number; // Additional rotation (0, 90, 180, 270)
}

// Logic
1. Load Source PDF.
2. Create New PDF.
3. Copy pages in the specific order requested (indicesToCopy).
4. Iterate through copied pages and apply the requested additional rotation.
5. Save.
```

### Frontend (`OrganizePdfPage`)
-   **State**: `pages: { id, originalIndex, rotation }[]`.
-   **Drag & Drop**:
    -   Uses `@dnd-kit/core` with `rectSortingStrategy` for true 2D grid support.
    -   `SortableContext` tracks item positions.
    -   `DragOverlay` provides the "ghost" image while dragging.
-   **Rendering**:
    -   Uses `PDFPageRenderer` with a custom `scale=0.3` prop to generate lightweight thumbnails.
    -   Canvas is reused/cleared to prevent memory leaks.

## UX Decisions
-   **Square vs Portrait Cards**: We use a standardized Portrait (`aspect-[3/4]`) card.
-   **Handling Landscape**: If a page is rotated 90/270 degrees, it visually becomes "Landscape". To fit this inside the Portrait card without cropping or overflowing, we scale it down (`scale-75`) and center it.
