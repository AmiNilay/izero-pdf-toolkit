# ⚡ iZeroPDF - Offline PDF & Image Toolkit

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Made with Vanilla JS](https://img.shields.io/badge/Made%20with-Vanilla%20JS-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-purple.svg)](https://web.dev/progressive-web-apps/)
[![GitHub stars](https://img.shields.io/github/stars/AmiNilay/iZeroPDF.svg?style=social)](https://github.com/AmiNilay/iZeroPDF)

**iZeroPDF** is a premium, 100% offline PDF and image manipulation toolkit that runs entirely in your browser. **Zero data leaves your device. Zero uploads. 100% private.**

🔗 **Live:** [iZeroPDF](https://i-zero-pdf.vercel.app/)

---

## 📸 Screenshots

<div align="center">
  <img src="assets/icons/Home Screen .png" alt="iZeroPDF Home" width="600"/>
  <br/>
  <em>Home Page - Your PDF & Image Toolkit</em>
</div>

---

## ✨ Features

### 📄 PDF Tools

| Tool | Description |
|------|-------------|
| **Merge PDF** | Combine multiple PDF files into one unified document |
| **Split PDF** | Split a PDF into multiple files |
| **PDF → Images** | Convert PDF pages to images |
| **PDF → JPG** | Convert PDF to JPG images |
| **Rotate PDF** | Rotate pages left or right |
| **Extract Images** | Extract images from PDF |
| **Compress PDF** | Reduce PDF file size without quality loss |
| **Organize PDF** | Reorder, delete, or duplicate pages |
| **Lock PDF** | Add password protection to PDF |
| **Remove Pages** | Remove unwanted pages from PDF |

### 🖼️ Image Tools

| Tool | Description |
|------|-------------|
| **Images → PDF** | Convert images to a single PDF |
| **Compress Image** | Reduce image size without losing quality |
| **Crop Image** | Crop images to the perfect size |
| **Resize Image** | Resize images to custom dimensions |
| **Photo Resizer** | ID, Social Media & more presets |
| **Convert Images** | 60+ formats supported (HEIC, RAW, TIFF, etc.) |
| **Image Editor** | Circle Crop, Square Crop, Round Corners, Rotate, Flip, Watermark |

### 🎯 Key Highlights

- ✅ **100% Offline** - No internet needed after first load
- 🔒 **100% Private** - All processing happens in your browser
- 📁 **No Uploads** - Your files never leave your device
- 📱 **PWA Ready** - Install as a native app on any device
- 🌙 **Dark Mode** - Material You design with dynamic theming
- 💾 **Cache Support** - Optional offline caching for history and stats
- 📊 **Usage Stats** - Track your visits and conversions (optional)

---

## 🚀 Quick Start

### Option 1: Use Live
Visit: [iZeroPDF](https://i-zero-pdf.vercel.app/)

### Option 2: Run Locally

```bash
# Clone the repository
git clone https://github.com/AmiNilay/iZeroPDF.git

# Navigate to project directory
cd iZeroPDF

# Start a local server (Python 3)
python3 -m http.server 8000

# Or using Node.js
npx serve

# Or using PHP
php -S localhost:8000

```
izero-pdf-toolkit-main
├─ .nojekyll
├─ 404.html
├─ assets
│  └─ icons
│     ├─ favicon_io
│     │  ├─ android-chrome-192x192.png
│     │  ├─ android-chrome-512x512.png
│     │  ├─ apple-touch-icon.png
│     │  ├─ favicon-16x16.png
│     │  ├─ favicon-32x32.png
│     │  ├─ favicon.ico
│     │  └─ site.webmanifest
│     ├─ Home Screen .png
│     ├─ logo-dark.png
│     ├─ logo-light.png
│     ├─ pdf-icon-dark.png
│     ├─ pdf-icon-light.png
│     └─ pdf-icon-light6.png
├─ CONTRIBUTING.md
├─ css
│  ├─ main.css
│  ├─ theme-dark.css
│  └─ theme-light.css
├─ docs
│  ├─ api.md
│  ├─ changelog.md
│  └─ user-guide.md
├─ github.html
├─ google5b988d9348ce5c94.html
├─ index.html
├─ js
│  ├─ app.js
│  ├─ core
│  │  ├─ compressEngine.js
│  │  ├─ cropEngine.js
│  │  ├─ imageConverter.js
│  │  ├─ imageEditorEngine.js
│  │  ├─ imageProcessor.js
│  │  ├─ mergeEngine.js
│  │  ├─ pdfProcessor.js
│  │  └─ splitEngine.js
│  ├─ lib
│  │  ├─ filesaver.min.js
│  │  ├─ jspdf.min.js
│  │  ├─ jszip.min.js
│  │  ├─ pdf-lib.min.js
│  │  ├─ pdf.min.js
│  │  └─ pdf.worker.min.js
│  ├─ router.js
│  ├─ state.js
│  ├─ ui
│  │  ├─ compressTool.js
│  │  ├─ cropTool.js
│  │  ├─ extractTool.js
│  │  ├─ imageConverterTool.js
│  │  ├─ imageEditorTool.js
│  │  ├─ imageToPdf.js
│  │  ├─ lockTool.js
│  │  ├─ mergeTool.js
│  │  ├─ organizePdfTool.js
│  │  ├─ pdfToImage.js
│  │  ├─ pdfToJpgTool.js
│  │  ├─ photoResizerTool.js
│  │  ├─ removePagesTool.js
│  │  ├─ resizeTool.js
│  │  ├─ rotateTool.js
│  │  └─ splitTool.js
│  └─ utils
│     ├─ canvasHelpers.js
│     ├─ downloadHelpers.js
│     ├─ fileHelpers.js
│     ├─ validators.js
│     └─ zipHelpers.js
├─ LICENSE
├─ manifest.json
├─ open-source.html
├─ privacy.html
├─ README.md
├─ SECURITY.md
├─ sitemap.xml
├─ support.html
├─ sw.js
└─ vercel.json

```