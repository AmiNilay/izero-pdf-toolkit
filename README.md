# ⚡ iZeroPDF - Offline PDF & Image Toolkit

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-black.svg?style=flat-square)](http://makeapullrequest.com)
[![Vanilla JS](https://img.shields.io/badge/Stack-Vanilla%20JS%20%2B%20HTML5-black.svg?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Design](https://img.shields.io/badge/Design-Swiss%20Minimalist-c90000.svg?style=flat-square)](#-swiss-minimalist-design-system)
[![PWA Ready](https://img.shields.io/badge/PWA-100%25%20Offline-black.svg?style=flat-square)](https://web.dev/progressive-web-apps/)
[![GitHub stars](https://img.shields.io/github/stars/AmiNilay/izero-pdf-toolkit.svg?style=social)](https://github.com/AmiNilay/izero-pdf-toolkit)

**iZeroPDF** is an offline, client-side PDF and image manipulation toolkit designed with the **Swiss Minimalist** design system.

All processing executes entirely inside your browser's local sandbox memory. **Zero data leaves your device. Zero remote server uploads. 100% private.**

🔗 **Live Deployment:** [https://i-zero-pdf.vercel.app/](https://i-zero-pdf.vercel.app/)  
📂 **Source Code:** [https://github.com/AmiNilay/izero-pdf-toolkit](https://github.com/AmiNilay/izero-pdf-toolkit)

---

## 🏛️ Swiss Minimalist Design System

iZeroPDF incorporates an editorial Swiss typography grid:

- **Continuous 12-Column Grid**: Dynamic layout featuring a 9-column opening statement and persistent 3-column index rails (`01 / FEATURED`, `02 / PDF`, `03 / IMAGE`).
- **Unified Grotesque Typography**: Built around `Host Grotesk` (`"SwissMinimalistHost"`) with heavy display headings, tight tracking (`-0.04em`), and tracked uppercase indexes (`0.12em`).
- **Exposed Structural Rules**: Visible 2px dividing rules (`--dp-border-rule: 2px`) and zero corner radii (`--dp-radius-control: 0`) connecting every matrix cell.
- **Immediate Tactile Feedback**: Zero animation lag (`--dp-motion-feedback: 0s`) with direct high-contrast monochrome inversion states and precision red signals (`#c90000`).
- **Dark Mode Parity**: Seamless token switching between high-contrast daylight mode and deep black canvas (`#0a0a0a`).

---

## 🔒 100% Private & Security First

- **Zero Server Uploads**: No backend infrastructure. Your files and images are never uploaded or transmitted across the wire.
- **Local WebAssembly & Canvas Engines**: File conversions, compression algorithms, and page extractions run in-memory via client-side JavaScript.
- **DOM XSS Sanitization**: User-controlled file names and file metadata are strictly HTML-escaped before insertion into the DOM.
- **AES PDF Encryption**: Standard 128-bit and 256-bit AES encryption powered by `pdf-lib-with-encrypt`.
- **Zero Third-Party Telemetry**: No cookies, tracking beacons, or analytics scripts.
- **Opt-In Offline Caching**: Optional browser cache consent dialog to store local conversion counters with zero sensitive payload retention.

---

## 🛠️ Complete Tool Matrix

### 📑 PDF Manipulation & Management

| Tool | Action |
| :--- | :--- |
| **Merge PDF** | Combine multiple PDF files into one unified document with customizable page sizes. |
| **Split PDF** | Divide documents into distinct files by single pages, custom ranges, or set intervals. |
| **Compress PDF** | Reduce document weight locally without server-side compression degradation. |
| **PDF to JPG** | Render high-resolution JPG image sets from multi-page PDF documents. |
| **Images to PDF** | Convert JPG, PNG, and WebP collections into structured PDF publications. |
| **Rotate PDF** | Real-time page-by-page clockwise, counter-clockwise, or 180° rotation adjustments. |
| **Organize PDF** | Visual drag-and-drop workspace to reorder, duplicate, reverse, or delete document pages. |
| **Extract Images** | Scan PDF objects and extract embedded raster imagery into individual files or ZIP archives. |
| **Protect PDF** | Add user and owner password encryption with granular permissions. |
| **Remove Pages** | Interactive visual grid to select and strip unwanted pages from documents. |

### 🖼️ Image Utilities

| Tool | Action |
| :--- | :--- |
| **Resize Image** | Scale image dimensions by exact pixel measurements or percentage ratios. |
| **Compress Image** | Lossy and lossless image compression targeting specific file weight thresholds. |
| **Convert Image** | Client-side format conversion between JPEG, PNG, WebP, and common formats. |
| **Crop Image** | Crosshair interactive canvas cropper with manual coordinate inputs and aspect ratio presets. |
| **Rotate & Flip** | 90° rotation increments with horizontal and vertical canvas mirroring. |
| **Watermark Image** | Repeated diagonal and center text watermarks with customizable opacity and color. |
| **Photo Resizer** | Pre-calibrated aspect ratios and dimension standards for passports, IDs, and social platforms. |

---

## 🚀 Quick Start & Local Development

No package managers, compilation steps, or build runtimes are required.

### 1. Clone the Repository
```bash
git clone https://github.com/AmiNilay/izero-pdf-toolkit.git
cd izero-pdf-toolkit
```

### 2. Launch Local Static Server

Using Python 3:
```bash
python -m http.server 8000
```

Using Node.js (`npx`):
```bash
npx serve .
```

Using PHP:
```bash
php -S localhost:8000
```

Open `http://localhost:8000` in any modern web browser.

---

## 📚 Technical Stack

- **Markup & Styling**: HTML5, Vanilla CSS3 (Swiss Minimalist Custom Design System), CSS Grid / Flexbox.
- **Typography & Icons**: [Host Grotesk](https://fonts.google.com/specimen/Host+Grotesk), [Material Symbols](https://fonts.google.com/icons).
- **PDF Manipulation**: [PDF.js](https://mozilla.github.io/pdf.js/) (v3.11.174), [jsPDF](https://github.com/parallax/jsPDF) (v2.5.1), [pdf-lib-with-encrypt](https://github.com/cantoo-scribe/pdf-lib) (v1.2.1).
- **Archiving & Streams**: [JSZip](https://stuk.github.io/jszip/) (v3.10.1), [FileSaver.js](https://github.com/eligrey/FileSaver.js/) (v2.0.5).
- **PWA & Offline Execution**: Service Worker cache layer (`sw.js`), Web App Manifest (`manifest.json`).

---

## 📖 Documentation

- [API & Architecture Guide](docs/api.md)
- [Swiss Minimalist Design System](docs/swiss-minimalist-design.md)
- [Audit & Fixes Log](docs/audit-and-fixes.md)
- [Changelog](docs/changelog.md)
- [Security Policy](SECURITY.md)
- [Contributing Guidelines](CONTRIBUTING.md)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
