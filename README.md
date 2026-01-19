# EasyPDF - Free Online PDF Tools

A modern, privacy-focused PDF manipulation suite built with Next.js. All processing happens client-side in your browser - your files never leave your device.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.9-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## ✨ Features

### 12 PDF Tools Available

| Category | Tools |
|----------|-------|
| **Organize** | Merge PDFs, Split PDF, Rotate Pages |
| **Convert** | PDF to Image, Image to PDF |
| **Optimize** | Compress PDF |
| **Edit** | Add Watermark, Add Page Numbers, Remove Pages, Extract Pages |
| **Security** | Password Protect, Unlock PDF |

### Key Highlights

- 🔒 **100% Client-Side Processing** - Your files never leave your browser
- 🚀 **Fast & Responsive** - Built with Next.js 15 and optimized for performance
- 🎨 **Beautiful UI** - Modern design with dark mode support
- 📱 **Mobile Friendly** - Fully responsive across all devices
- ♿ **Accessible** - Following WCAG guidelines
- 🎉 **Toast Notifications** - Real-time feedback for all operations

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/easy-pdf.git
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
```

## 🏗️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **PDF Processing:** pdf-lib
- **Animations:** Framer Motion
- **Icons:** Lucide React

## 📁 Project Structure

```
easy-pdf/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── (tools)/           # Tool pages
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Homepage
│   ├── components/
│   │   ├── layout/            # Header, Footer
│   │   ├── tools/             # FileUploader, DownloadButton
│   │   └── ui/                # Button, ProgressBar, Toast
│   ├── contexts/              # Toast context
│   ├── lib/
│   │   ├── pdf/               # PDF processing utilities
│   │   ├── constants.ts       # App constants
│   │   └── utils.ts           # Helper functions
│   └── types/                 # TypeScript types
├── public/                    # Static assets
└── tailwind.config.ts         # Tailwind configuration
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Run production server |
| `npm run lint` | Run ESLint |

## 🎯 Features in Detail

### Client-Side Processing

All PDF operations are performed entirely in your browser using the `pdf-lib` library. This means:
- ✅ Complete privacy - files never uploaded
- ✅ Works offline after initial load
- ✅ Fast processing - no network latency
- ✅ No file size limits (browser memory only)

### Toast Notification System

Real-time feedback for all user actions:
- Success messages for completed operations
- Error handling with clear messages
- Warning alerts for edge cases
- Info notifications for ongoing processes

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [pdf-lib](https://pdf-lib.js.org/) - PDF manipulation library
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Lucide](https://lucide.dev/) - Icon library

## 📞 Support

For support, questions, or feature requests, please visit our [Contact](/contact) page.

---

**Built with ❤️ using Next.js**
