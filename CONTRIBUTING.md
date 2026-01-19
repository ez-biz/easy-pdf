# Contributing to EasyPDF

Thank you for your interest in contributing to EasyPDF! This document provides guidelines for contributing to the project.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/ez-biz/easy-pdf.git
cd easy-pdf

# Install dependencies
npm install

# Start development server
npm run dev
```

## 📋 Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Changes

- Follow the code style guidelines below
- Write meaningful commit messages
- Keep changes focused and atomic

### 3. Test Your Changes

```bash
# Run linter
npm run lint

# Build to check for errors
npm run build
```

### 4. Submit a Pull Request

- Push your branch to GitHub
- Create a PR against `main`
- Fill out the PR template
- Wait for review

## 🎨 Code Style

### TypeScript

- Use strict TypeScript (`strict: true` in tsconfig.json)
- Define explicit types for function parameters and return values
- Avoid `any` - use `unknown` if type is truly unknown

```typescript
// ✅ Good
function processFile(file: File): Promise<Uint8Array> { ... }

// ❌ Bad
function processFile(file: any): any { ... }
```

### React Components

- Use functional components with hooks
- Prefer named exports for components
- Use `"use client"` directive only when necessary

```typescript
// ✅ Good - Client component
"use client";
export function MyComponent() { ... }

// ✅ Good - Server component (default)
export function MyServerComponent() { ... }
```

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `FileUploader.tsx` |
| Utilities | camelCase | `downloadBlob.ts` |
| Pages | lowercase | `page.tsx` |
| Client Components | PascalCase + Client | `MergeClient.tsx` |

### Imports

Order imports as follows:
1. React/Next.js
2. External libraries
3. Internal components
4. Internal utilities
5. Types
6. Styles

```typescript
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { mergePDFs } from "@/lib/pdf/merge";
import type { FileWithPreview } from "@/types/tools";
```

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── (tools)/         # Tool routes (each tool has page.tsx + *Client.tsx)
│   └── page.tsx         # Homepage
├── components/
│   ├── layout/          # Header, Footer, ToolLayout
│   ├── tools/           # Tool-specific components
│   └── ui/              # Reusable UI components
├── lib/
│   ├── pdf/             # PDF processing functions
│   └── utils.ts         # Helper utilities
├── store/               # Zustand stores
└── types/               # TypeScript type definitions
```

## 🛠️ Adding a New Tool

1. **Add to constants** - Update `src/lib/constants.ts`:
   ```typescript
   { slug: "new-tool", name: "New Tool", icon: ToolIcon, ... }
   ```

2. **Create page directory** - `src/app/(tools)/new-tool/`

3. **Create client component** - `NewToolClient.tsx` with `"use client"`

4. **Create server page** - `page.tsx` with metadata and JSON-LD

5. **Add PDF utility** - `src/lib/pdf/newTool.ts` if needed

## 🔧 PDF Processing Guidelines

- All PDF processing happens client-side using `pdf-lib`
- Never upload files to a server
- Handle errors gracefully with try/catch
- Show progress feedback for long operations

```typescript
export async function processPDF(file: File): Promise<PDFOperationResult> {
  try {
    const buffer = await file.arrayBuffer();
    const doc = await PDFDocument.load(buffer);
    // ... processing
    const output = await doc.save();
    return { success: true, data: output };
  } catch (error) {
    return { success: false, error: "Failed to process PDF" };
  }
}
```

## 🧪 Testing Checklist

Before submitting a PR, verify:

- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` completes successfully
- [ ] Feature works in Chrome, Firefox, Safari
- [ ] Mobile responsive design is maintained
- [ ] Dark mode works correctly
- [ ] No console errors in browser

## 📝 Commit Messages

Use conventional commit format:

```
feat: add crop PDF tool
fix: resolve merge ordering issue
docs: update API documentation
refactor: simplify file upload logic
style: fix button alignment
chore: update dependencies
```

## 🐛 Reporting Issues

When reporting bugs, include:

1. Browser and version
2. Steps to reproduce
3. Expected vs actual behavior
4. Screenshots if applicable
5. Console errors if any

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Questions?** Open an issue or start a discussion on GitHub.
