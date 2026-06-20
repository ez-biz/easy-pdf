# EasyPDF - Free Online PDF Tools

A modern, privacy-focused PDF manipulation suite built with Next.js 15. All processing happens client-side in your browser - your files never leave your device.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.9-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Zustand](https://img.shields.io/badge/Zustand-5.0-purple)](https://zustand-demo.pmnd.rs/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## ✨ Features

### 17 Complete PDF Tools

| Category | Tools | Status |
|----------|-------|--------|
| **Organize** | Merge PDFs, Split PDF, Rotate Pages | ✅ Live |
| **Convert** | PDF to Image, Image to PDF | ✅ Live |
| **Optimize** | Compress PDF | ✅ Live |
| **Edit** | Add Watermark, Add Page Numbers, Remove Pages, Extract Pages, Edit Metadata, Add Text, Add Image, **Sign PDF** | ✅ Live |
| **Security** | Password Protect PDF, Unlock PDF, **Redact PDF** | ✅ Live |

### Core Features

- 🔒 **100% Client-Side Processing** - Files never leave your browser
- 🎯 **State Management** - Zustand for settings, activity tracking & preferences
- 🎉 **Toast Notifications** - Real-time feedback with animated notifications
- 🌙 **Dark Mode** - Persistent theme with automatic detection
- 🚀 **Performance Optimized** - Next.js Image optimization & lazy loading
- 📱 **Fully Responsive** - Works seamlessly on all devices
- ♿ **Accessible** - WCAG compliant with keyboard navigation
- 💾 **LocalStorage Persistence** - Settings & recent activity saved
- 🎨 **Modern UI/UX** - Beautiful interface with Framer Motion animations
- 📄 **Legal Pages** - Privacy Policy, Terms of Service, Contact

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/ez-biz/easy-pdf.git
cd easy-pdf

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
# Create optimized production build
npm run build

# Start production server
npm start

# Or deploy to Vercel (recommended)
vercel deploy
```

## 🏗️ Tech Stack

### Core
- **Framework:** Next.js 15.5.9 (App Router)
- **Language:** TypeScript 5+
- **Styling:** Tailwind CSS 3.4
- **State Management:** Zustand 5.0 (with persistence)

### Libraries
- **PDF Processing:** pdf-lib (client-side manipulation)
- **Animations:** Framer Motion 11+
- **Icons:** Lucide React
- **File Handling:** react-dropzone

### Features
- **Toast System:** Custom context with auto-dismiss
- **Dark Mode:** Persistent theme switching
- **Image Optimization:** Next.js Image component
- **Type Safety:** Strict TypeScript configuration

## 📁 Project Structure

```
easy-pdf/
├── src/
│   ├── app/
│   │   ├── (tools)/              # Tool pages (merge, split, etc.)
│   │   ├── docs/                 # Documentation site (MDX)
│   │   ├── layout.tsx            # Root layout with providers
│   │   └── page.tsx              # Homepage
│   ├── components/
│   │   ├── layout/               # Header, Footer, ToolLayout
│   │   ├── tools/                # FileUploader, DownloadButton
│   │   └── ui/                   # Button, ProgressBar, Toast
│   ├── contexts/
│   │   └── ToastContext.tsx      # Toast notification provider
│   ├── store/
│   │   └── useAppStore.ts        # Zustand global state
│   ├── lib/
│   │   ├── pdf/                  # PDF utilities (merge, split, etc.)
│   │   ├── constants.ts          # App constants & tool definitions
│   │   └── utils.ts              # Helper functions
│   └── types/
│       └── tools.ts              # TypeScript type definitions
├── public/                       # Static assets
├── .gitignore                    # Git ignore patterns
├── LICENSE                       # MIT License
└── README.md                     # This file
```

## 🎯 Key Features Explained

### 1. Client-Side Processing
All PDF operations happen in your browser using `pdf-lib`:
- ✅ **Zero Server Costs** - No backend required
- ✅ **Complete Privacy** - Files never uploaded
- ✅ **Offline Capable** - Works after initial load
- ✅ **Fast Processing** - No network latency
- ✅ **Unlimited Usage** - No file size restrictions

### 2. State Management (Zustand)
Lightweight, powerful state management:
```typescript
const { settings, toggleDarkMode, addActivity } = useAppStore();
```
- **Settings:** Dark mode, default page sizes, compression levels
- **Activity:** Track last 10 PDF operations
- **Stats:** Total files processed
- **Persistent:** Auto-saved to localStorage

### 3. Toast Notifications
Elegant feedback system with 4 types:
- ✅ **Success** - Operation completed
- ❌ **Error** - Operation failed
- ⚠️ **Warning** - User attention needed
- ℹ️ **Info** - Process updates

### 4. PDF Tools

#### Organize Tools
- **Merge PDFs** - Combine multiple PDFs with drag-and-drop reordering
- **Split PDF** - Extract pages or split by page count
- **Rotate Pages** - Rotate individual or all pages (90°, 180°, 270°)

#### Convert Tools
- **PDF to Image** - Export pages as JPG/PNG with quality settings
- **Image to PDF** - Convert multiple images with page size options

#### Optimize
- **Compress PDF** - Reduce file size while maintaining quality

#### Edit Tools
- **Add Watermark** - Text or image watermarks with positioning
- **Add Page Numbers** - Customizable page numbering
- **Remove Pages** - Select and delete specific pages
- **Extract Pages** - Create new PDF from selected pages
- **Edit Metadata** - View and modify PDF title, author, subject, and keywords
- **Add Text** - Insert text boxes with custom fonts, colors, and positioning
- **Add Image** - Overlay images on PDF pages with resizing and rotation

#### Security
- **Protect PDF** - Add password protection (note: client-side limitation)
- **Unlock PDF** - Remove password from protected PDFs
- **Redact PDF** - Permanently remove sensitive content. Redacted pages are flattened to images so the hidden text is truly gone (not just covered) — 100% client-side.

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build optimized production bundle |
| `npm start` | Run production server |
| `npm run lint` | Run ESLint with Next.js config |

## 🔐 Security & Privacy

### What We Track
- ✅ **Anonymous Analytics** (optional) - Page views only
- ✅ **LocalStorage** - User preferences & settings
- ❌ **No File Upload** - Files stay on your device
- ❌ **No User Data** - No accounts or personal info
- ❌ **No Cookies** - Except essential preferences

### Data You Control
All data stored locally via `localStorage`:
- Theme preferences (dark/light mode)
- Default tool settings
- Recent activity (tool names & timestamps only)
- Usage statistics

## 🚢 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Other Platforms
Works on any platform supporting Next.js:
- Netlify
- AWS Amplify
- Cloudflare Pages
- Docker

## 🤝 Contributing

Contributions welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Use ESLint configuration provided
- Write meaningful commit messages
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

### Core Libraries
- [pdf-lib](https://pdf-lib.js.org/) - PDF manipulation
- [Next.js](https://nextjs.org/) - React framework
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [Lucide](https://lucide.dev/) - Icons

### Inspiration
- Privacy-first design philosophy
- Modern web application standards
- User-centric PDF tools

## 📊 Stats

- **Bundle Size:** ~147 KB (gzipped)
- **Lighthouse Score:** 95+ Performance
- **TypeScript Coverage:** 100%
- **Tools Available:** 12
- **Supported Formats:** PDF, JPG, PNG, WEBP, GIF, BMP

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/ez-biz/easy-pdf/issues)
- **Contact:** [Contact Page](/contact)
- **Documentation:** See [`/docs`](/docs) for detailed architectural and feature documentation.

---

**Made with ❤️ by ez-biz** • **Privacy First** • **100% Open Source**
