# Comprehensive Prompt: Build a PDF Tools Web Application (iLovePDF Clone)

## Project Overview

Build a modern, feature-rich web application that provides comprehensive PDF manipulation tools similar to iLovePDF. The application should offer a clean, intuitive interface where users can perform various PDF operations directly in their browser without requiring software installation.

---

## Core Features to Implement

### 1. PDF Merge
Allow users to combine multiple PDF files into a single document.
- Drag-and-drop file upload for multiple PDFs
- Visual preview of uploaded files with thumbnails
- Drag-to-reorder functionality to arrange page sequence
- Option to add more files after initial upload
- Progress indicator during merge operation
- Download merged PDF with custom filename

### 2. PDF Split
Enable splitting a single PDF into multiple documents.
- Upload single PDF file
- Display all pages as thumbnails with page numbers
- Multiple split modes:
  - Split by page ranges (e.g., "1-5, 6-10, 11-15")
  - Extract specific pages (e.g., "1, 3, 7, 12")
  - Split every N pages
  - Split into individual pages (one file per page)
- Preview split result before processing
- Download as ZIP containing all split PDFs

### 3. Compress PDF
Reduce PDF file size while maintaining acceptable quality.
- Three compression levels:
  - Extreme compression (smallest file, lower quality)
  - Recommended compression (balanced)
  - Less compression (larger file, higher quality)
- Show original vs compressed file size comparison
- Display compression percentage achieved
- Preview quality before download

### 4. PDF to Image Conversion
Convert PDF pages to image formats.
- Supported output formats: JPG, PNG, WEBP
- Quality/resolution settings (72, 150, 300 DPI)
- Convert all pages or select specific pages
- Download as ZIP for multiple images
- Option to download individual pages

### 5. Image to PDF Conversion
Create PDF documents from images.
- Support multiple image formats: JPG, PNG, WEBP, GIF, BMP, TIFF
- Batch upload multiple images
- Drag-to-reorder images before conversion
- Page size options: A4, Letter, Original size, Custom
- Orientation: Portrait, Landscape, Auto-detect
- Margin settings: None, Small, Medium, Large
- Option to fit image to page or maintain aspect ratio

### 6. Word to PDF
Convert Microsoft Word documents to PDF.
- Support .doc and .docx formats
- Preserve formatting, fonts, and images
- Maintain hyperlinks and bookmarks

### 7. PDF to Word
Convert PDF documents to editable Word format.
- Output as .docx format
- OCR option for scanned PDFs
- Preserve layout and formatting where possible

### 8. Excel to PDF
Convert spreadsheets to PDF format.
- Support .xls and .xlsx formats
- Options for page layout and scaling
- Handle multiple sheets

### 9. PDF to Excel
Extract data from PDFs into spreadsheet format.
- Intelligent table detection
- Output as .xlsx format
- Handle multiple tables per page

### 10. PowerPoint to PDF
Convert presentations to PDF.
- Support .ppt and .pptx formats
- Options: one slide per page or multiple slides per page
- Include or exclude speaker notes

### 11. PDF to PowerPoint
Convert PDF to editable presentation format.
- Each page becomes a slide
- Preserve images and text positioning

### 12. Rotate PDF
Rotate PDF pages to correct orientation.
- Rotate individual pages or all pages
- Rotation options: 90° clockwise, 90° counter-clockwise, 180°
- Visual preview of rotated pages

### 13. Add Page Numbers
Insert page numbers into PDF documents.
- Position options: Top/Bottom, Left/Center/Right
- Starting number customization
- Number format: 1, 2, 3 or Page 1, Page 2 or i, ii, iii
- Font size and color options
- Option to skip first page

### 14. Add Watermark
Add text or image watermarks to PDFs.
- Text watermark with customizable:
  - Font family, size, and color
  - Opacity (transparency level)
  - Rotation angle
  - Position (center, diagonal, tiled)
- Image watermark with:
  - Upload custom image
  - Size and position controls
  - Opacity settings
- Apply to all pages or specific pages
- Preview before applying

### 15. Protect PDF
Add password protection and permissions.
- Set document open password
- Set permissions password (for editing restrictions)
- Permission controls:
  - Allow/prevent printing
  - Allow/prevent copying text
  - Allow/prevent editing
  - Allow/prevent form filling
- Encryption level options

### 16. Unlock PDF
Remove password protection from PDFs.
- User must provide the correct password
- Remove both open and permissions passwords
- Maintain document content and formatting

### 17. Sign PDF
Add signatures to PDF documents.
- Three signature methods:
  - Draw signature with mouse/touch
  - Type signature (select from fonts)
  - Upload signature image
- Position signature anywhere on the page
- Resize and rotate signature
- Add date stamp option
- Apply to multiple pages if needed

### 18. Organize PDF
Rearrange, delete, or duplicate pages within a PDF.
- Visual thumbnail view of all pages
- Drag-and-drop page reordering
- Select and delete multiple pages
- Duplicate pages
- Insert blank pages
- Preview changes before applying

### 19. OCR PDF
Convert scanned PDFs to searchable/editable text.
- Multiple language support
- Output formats: Searchable PDF, Word, TXT
- Accuracy settings

### 20. Edit PDF
Basic PDF editing capabilities.
- Add text boxes with font customization
- Add shapes (rectangles, circles, lines, arrows)
- Highlight, underline, or strikethrough existing text
- Add annotations and comments
- Freehand drawing tool
- Insert images

### 21. PDF/A Conversion
Convert PDFs to PDF/A format for archival.
- Support PDF/A-1b, PDF/A-2b, PDF/A-3b standards
- Validation of converted document

### 22. Repair PDF
Fix corrupted or damaged PDF files.
- Attempt automatic repair
- Display repair status and any issues found

---

## User Interface Requirements

### Homepage Design
Create a visually appealing landing page featuring:
- Hero section with clear value proposition
- Grid/card layout displaying all available tools
- Each tool card shows: icon, name, brief description
- Search functionality to find specific tools
- Categorization of tools (Convert, Edit, Organize, Security, etc.)
- Responsive design for all screen sizes

### Tool Page Layout
Each individual tool page should include:
- Clear tool name and description
- Large, prominent upload area with drag-and-drop support
- File type restrictions clearly displayed
- Visual feedback during file upload
- Progress indicators for processing
- Clear call-to-action buttons
- Download section with file preview
- "Start Over" or "New Task" option

### Navigation
- Sticky header with logo and main navigation
- Tool categories in dropdown/mega menu
- Breadcrumb navigation on tool pages
- Footer with additional links, legal pages, social media

### Visual Design Guidelines
- Clean, modern aesthetic with ample white space
- Consistent color scheme (suggest professional blue/teal as primary)
- Smooth animations and transitions
- Loading states and skeleton screens
- Toast notifications for success/error messages
- Accessible design (WCAG 2.1 AA compliance)
- Dark mode support (optional but recommended)

---

## Technical Architecture

### Frontend Stack Recommendations

**Option A: React/Next.js (Recommended)**
```
- Next.js 14+ with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Framer Motion for animations
- React Dropzone for file uploads
- PDF.js for client-side PDF rendering
- Zustand or Redux for state management
```

**Option B: Vue/Nuxt**
```
- Nuxt 3
- TypeScript
- Tailwind CSS or Vuetify
- PDF.js for PDF rendering
- Pinia for state management
```

**Option C: Single-Page Application**
```
- Vanilla JavaScript or Alpine.js
- Tailwind CSS
- PDF.js for client-side operations
- Suitable for simpler implementations
```

### Backend Stack Recommendations

**Option A: Node.js**
```
- Express.js or Fastify
- pdf-lib for PDF manipulation
- Sharp for image processing
- Multer for file uploads
- Bull or BullMQ for job queues
```

**Option B: Python**
```
- FastAPI or Flask
- PyPDF2 or pikepdf for PDF manipulation
- Pillow for image processing
- Celery for background tasks
- ReportLab for PDF generation
```

**Option C: Serverless**
```
- AWS Lambda / Vercel Functions / Cloudflare Workers
- Process files in serverless functions
- S3 or R2 for temporary file storage
```

### Key Libraries for PDF Operations

**Client-Side:**
- `pdf.js` - PDF rendering and parsing (Mozilla)
- `pdf-lib` - Create and modify PDFs in browser
- `jspdf` - Generate PDFs from scratch
- `pdfmake` - Document definition-based PDF creation

**Server-Side (Node.js):**
- `pdf-lib` - Comprehensive PDF manipulation
- `pdf-parse` - Extract text from PDFs
- `puppeteer` - HTML to PDF conversion
- `sharp` - Image processing and conversion
- `pdf2pic` - PDF to image conversion
- `docx` - Word document generation

**Server-Side (Python):**
- `PyPDF2` / `pikepdf` - PDF manipulation
- `pdf2image` - PDF to image conversion
- `python-docx` - Word document handling
- `openpyxl` - Excel file handling
- `Pillow` - Image processing
- `reportlab` - PDF generation

---

## File Handling Specifications

### Upload Requirements
- Maximum file size: 100MB per file (configurable)
- Maximum files per operation: 20 files
- Supported input formats clearly documented
- Client-side file validation before upload
- Chunked uploads for large files
- Resume capability for interrupted uploads

### Processing Pipeline
1. File received and validated
2. Stored in temporary location
3. Queued for processing (for heavy operations)
4. Processing with progress updates
5. Result stored temporarily
6. Download link generated
7. Automatic cleanup after timeout (e.g., 1-2 hours)

### Security Considerations
- All file transfers over HTTPS
- Files processed in isolated environments
- No permanent storage of user files
- Automatic file deletion after processing
- Rate limiting to prevent abuse
- CSRF protection on all forms
- Input sanitization and validation
- Virus scanning on uploads (recommended)

---

## API Design (If Building Backend)

### RESTful Endpoints Structure

```
POST   /api/pdf/merge          - Merge multiple PDFs
POST   /api/pdf/split          - Split PDF into multiple files
POST   /api/pdf/compress       - Compress PDF
POST   /api/pdf/rotate         - Rotate PDF pages
POST   /api/pdf/watermark      - Add watermark to PDF
POST   /api/pdf/protect        - Add password protection
POST   /api/pdf/unlock         - Remove password protection
POST   /api/pdf/organize       - Reorder/delete pages
POST   /api/pdf/page-numbers   - Add page numbers
POST   /api/pdf/sign           - Add signature

POST   /api/convert/pdf-to-jpg     - Convert PDF to images
POST   /api/convert/jpg-to-pdf     - Convert images to PDF
POST   /api/convert/pdf-to-word    - Convert PDF to Word
POST   /api/convert/word-to-pdf    - Convert Word to PDF
POST   /api/convert/pdf-to-excel   - Convert PDF to Excel
POST   /api/convert/excel-to-pdf   - Convert Excel to PDF
POST   /api/convert/pdf-to-pptx    - Convert PDF to PowerPoint
POST   /api/convert/pptx-to-pdf    - Convert PowerPoint to PDF

GET    /api/job/{jobId}/status - Check processing status
GET    /api/job/{jobId}/download - Download result
DELETE /api/job/{jobId}        - Cancel/cleanup job
```

### Response Format
```json
{
  "success": true,
  "jobId": "uuid-here",
  "status": "processing|completed|failed",
  "progress": 75,
  "downloadUrl": "/api/job/{jobId}/download",
  "expiresAt": "2024-01-15T12:00:00Z",
  "error": null
}
```

---

## Progressive Enhancement Strategy

### Phase 1: Core Features (MVP)
1. PDF Merge
2. PDF Split
3. PDF Compress
4. PDF to Image
5. Image to PDF
6. Rotate PDF

### Phase 2: Document Conversions
7. Word to PDF
8. PDF to Word
9. Excel to PDF
10. PDF to Excel
11. PowerPoint to PDF
12. PDF to PowerPoint

### Phase 3: Advanced Features
13. Add Watermark
14. Add Page Numbers
15. Protect PDF
16. Unlock PDF
17. Organize PDF
18. Sign PDF

### Phase 4: Premium Features
19. OCR PDF
20. Edit PDF
21. PDF/A Conversion
22. Repair PDF
23. Batch processing
24. API access for developers

---

## Monetization Options (Optional)

### Freemium Model
- **Free Tier:**
  - Basic operations with file size limits (e.g., 15MB)
  - Limited daily operations (e.g., 5 per day)
  - Watermark on output (optional)
  - Queue priority: Low

- **Premium Tier ($5-10/month):**
  - Larger file sizes (100MB+)
  - Unlimited operations
  - Batch processing
  - Priority processing
  - No watermarks
  - Desktop app access

- **Business Tier ($20-50/month):**
  - Everything in Premium
  - API access
  - Team management
  - Custom branding
  - SSO integration
  - Priority support

---

## Performance Optimization

### Frontend
- Lazy load tool components
- Image optimization and WebP format
- Code splitting by routes
- Service Worker for offline capability
- Cache static assets aggressively
- Use CDN for global performance

### Backend
- Implement job queues for heavy operations
- Horizontal scaling capability
- Redis caching for session data
- Stream large files instead of loading in memory
- Implement request timeouts
- Use worker threads for CPU-intensive tasks

---

## Testing Requirements

### Unit Tests
- PDF manipulation functions
- File validation logic
- API endpoint handlers
- Utility functions

### Integration Tests
- Full upload-process-download flows
- API endpoint integration
- Database operations
- External service integrations

### E2E Tests
- User journey through each tool
- File upload and download flows
- Error handling scenarios
- Mobile responsiveness

### Performance Tests
- Load testing with concurrent users
- Large file handling
- Memory usage profiling
- Response time benchmarks

---

## Deployment Considerations

### Hosting Options
- **Vercel/Netlify:** For frontend, with serverless functions
- **AWS/GCP/Azure:** For full-stack with more control
- **DigitalOcean/Linode:** Cost-effective VPS options
- **Docker:** Containerized deployment
- **Kubernetes:** For scalable production deployments

### Required Infrastructure
- Web server (Node.js/Python runtime)
- Temporary file storage (S3/R2/local disk)
- Redis (for sessions, caching, job queues)
- CDN for static assets
- SSL certificate
- Domain name

### Environment Variables
```
DATABASE_URL=
REDIS_URL=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=
MAX_FILE_SIZE=104857600
FILE_RETENTION_HOURS=2
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=3600
```

---

## Accessibility Checklist

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management
- Color contrast ratios (4.5:1 minimum)
- Screen reader compatibility
- Alt text for all images
- Form labels and error messages
- Reduced motion option
- Resizable text support

---

## Legal Requirements

### Required Pages
- Privacy Policy (data handling, cookies, GDPR compliance)
- Terms of Service (usage terms, limitations, liability)
- Cookie Policy (if using cookies/analytics)
- DMCA/Copyright Policy

### Compliance Considerations
- GDPR (EU users) - data deletion, consent
- CCPA (California users) - privacy rights
- File handling transparency
- Data retention policies
- Right to be forgotten implementation

---

## Example User Flow: PDF Merge

1. User lands on homepage, clicks "Merge PDF" tool
2. Tool page loads with upload area prominent
3. User drags multiple PDF files onto upload zone
4. Files upload with progress indicators
5. Thumbnails appear showing first page of each PDF
6. User drags to reorder files as desired
7. User clicks "Merge PDFs" button
8. Progress bar shows merge operation status
9. Completion message displays with file size info
10. Download button becomes active
11. User downloads merged PDF
12. Option to "Merge More" or navigate to other tools

---

## Summary Checklist

Before launching, ensure:
- [ ] All core PDF tools functional
- [ ] Responsive design across devices
- [ ] File upload/download working reliably
- [ ] Error handling for all edge cases
- [ ] Loading states and progress indicators
- [ ] Security measures implemented
- [ ] Performance optimized
- [ ] Accessibility tested
- [ ] Legal pages in place
- [ ] Analytics/monitoring set up
- [ ] SSL certificate active
- [ ] Backup strategy defined
- [ ] Rate limiting configured
- [ ] File cleanup automation running

---

This prompt provides a comprehensive blueprint for building a professional PDF tools web application. Implement features incrementally, starting with the MVP phase, and expand based on user feedback and business requirements.