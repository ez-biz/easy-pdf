# Shared Components

This document describes the reusable components in EasyPDF.

---

## Layout Components

### ToolLayout (`src/components/layout/ToolLayout.tsx`)

Standard wrapper for every tool page.

```typescript
<ToolLayout
  title="Merge PDF"
  description="Combine multiple PDFs into one"
  icon={Combine}
  color="from-blue-500 to-blue-600"
>
  {/* Tool content */}
</ToolLayout>
```

**Features:**
- Gradient header with icon
- Consistent padding and margins
- Responsive layout
- Breadcrumb-style header

---

### Header (`src/components/layout/Header.tsx`)

Site-wide navigation header.

**Features:**
- Logo with home link
- Tool categories dropdown
- Mobile hamburger menu
- Dark mode toggle
- Settings link

---

### Footer (`src/components/layout/Footer.tsx`)

Site-wide footer with links and legal info.

---

## Tool Components

### FileUploader (`src/components/tools/FileUploader.tsx`)

Drag-and-drop file upload zone.

```typescript
<FileUploader
  accept={{ "application/pdf": [".pdf"] }}
  maxFiles={10}
  maxSize={50 * 1024 * 1024}  // 50MB
  files={files}
  onFilesChange={handleFilesChange}
  label="Drop your PDFs here"
  description="or click to browse"
/>
```

**Features:**
- Drag-and-drop support
- File type validation
- Max size/count checks
- Visual feedback on drag
- Uses `react-dropzone`

---

### PDFPageRenderer (`src/components/tools/PDFPageRenderer.tsx`)

Renders a single PDF page to HTML canvas.

```typescript
<PDFPageRenderer
  file={file}
  pageNumber={1}  // 1-indexed
  className="w-full"
  onPageRendered={() => console.log("Rendered!")}
/>
```

**Internals:**
- Uses `pdfjs-dist` for rendering
- 1.5x scale for high-DPI displays
- Caches rendered pages
- Worker configured in global worker options

---

### DownloadButton (`src/components/tools/DownloadButton.tsx`)

Styled download button with file info.

```typescript
<DownloadButton
  onClick={handleDownload}
  filename="merged.pdf"
  fileSize={1024000}  // bytes
  isReady={true}
/>
```

---

### DraggableImageBox (`src/components/tools/DraggableImageBox.tsx`)

Interactive overlay for positioning images on PDF pages.

```typescript
<DraggableImageBox
  overlay={overlay}
  containerRef={canvasRef}
  isSelected={isSelected}
  onSelect={() => setSelected(id)}
  onUpdate={(id, updates) => updateOverlay(id, updates)}
  onDelete={(id) => deleteOverlay(id)}
  imageUrl={objectUrl}
  aspectRatio={ratio}
/>
```

**Gestures:**
- **Drag**: Move the element
- **Corner drag**: Resize (maintains aspect ratio)
- **Top handle drag**: Rotate

---

### SignaturePad (`src/components/tools/SignaturePad.tsx`)

Canvas-based signature drawing component.

```typescript
<SignaturePad
  onSave={(signatureDataUrl) => handleSignature(signatureDataUrl)}
  onClose={() => setShowPad(false)}
/>
```

**Features:**
- Freehand drawing
- Multiple stroke widths
- Color selection
- Clear/reset button
- Save as PNG data URL

---

## UI Components

### Button (`src/components/ui/Button.tsx`)

Styled button with variants.

```typescript
<Button variant="primary" size="lg" onClick={handleClick}>
  Click Me
</Button>

<Button variant="outline" size="sm">
  Cancel
</Button>

<Button variant="danger">
  Delete
</Button>
```

**Variants:** `primary`, `secondary`, `outline`, `ghost`, `danger`
**Sizes:** `sm`, `md`, `lg`

---

### ProgressBar (`src/components/ui/ProgressBar.tsx`)

Animated progress indicator.

```typescript
<ProgressBar value={75} />  // 0-100
```

---

### Toast System (`src/contexts/ToastContext.tsx`)

Toast notification system with auto-dismiss.

```typescript
const toast = useToast();

toast.success("PDF merged successfully!");
toast.error("Failed to process file");
toast.warning("File too large");
toast.info("Processing...");
```

**Toast Types:**
- ✅ `success` - Green, checkmark icon
- ❌ `error` - Red, X icon
- ⚠️ `warning` - Yellow, alert icon
- ℹ️ `info` - Blue, info icon

---

## Component Patterns

### Creating a New Tool Component

1. Create `*Client.tsx` with `"use client"` directive
2. Use `ToolLayout` as wrapper
3. Use `FileUploader` for file input
4. Use `ProgressBar` during processing
5. Use `DownloadButton` for results
6. Use `toast` for feedback

```typescript
"use client";

export default function NewToolClient() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [result, setResult] = useState<Blob | null>(null);
  const toast = useToast();

  return (
    <ToolLayout title="New Tool" ...>
      {!result ? (
        <>
          <FileUploader files={files} onFilesChange={setFiles} />
          <Button onClick={process}>Process</Button>
        </>
      ) : (
        <DownloadButton onClick={download} isReady />
      )}
    </ToolLayout>
  );
}
```
