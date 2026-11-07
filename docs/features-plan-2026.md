# 🚀 2026-Era Feature Roadmap & Implementation Plan

> **iZeroPDF Engineering Blueprint**  
> **Core Principle**: 100% Free, 100% Client-Side, Zero Server Costs, Zero Remote Uploads, 100% Private.  
> **Last Updated**: 2026-11-07  
> **Status**: Living Tracking Document — Update this file upon completing any phase or adding new capabilities.

---

## 📋 Executive Overview

In the 2026 era, web browsers function as secure, high-performance operating environments capable of running WebAssembly (Wasm), WebGPU, and advanced client-side processing without paying for cloud servers or external API subscriptions.

This roadmap outlines the systematic evolution of iZeroPDF into an offline workstation, organized into four prioritized implementation phases.

---

## 🗺️ Implementation Phases

```
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Zero-Dependency Security & Essential Utilities (Immediate)   │
│ ├── e-Sign PDF & Signature Placement                                   │
│ ├── Privacy Metadata Scrubber & EXIF Cleaner                           │
│ ├── Grayscale / Monochrome Print Optimizer                             │
│ └── PDF Form & Annotation Flattening                                   │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 2: Client-Side AI & Vision (Zero API / Token Fees)               │
│ ├── Client-Side OCR & Searchable PDF (Tesseract.js Wasm)               │
│ ├── 1-Click Client-Side Background Removal (ONNX Wasm/WebGPU)          │
│ └── Irreversible Stream-Level PDF Redaction                            │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 3: Conversions & Imposition Utilities                            │
│ ├── PDF to Editable Word (.docx) Extraction                            │
│ ├── N-Up Multi-Page Imposition (2-up, 4-up per sheet)                  │
│ └── Visual Contract / Drawing PDF Diff                                 │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 4: 2026 Web Platform & Performance Standards                     │
│ ├── File System Access API (In-place batch folder processing)          │
│ ├── Web Share Target API (Native OS Share menu integration)            │
│ ├── Web Workers & OffscreenCanvas Multi-Threading                      │
│ └── AVIF Next-Gen Image Format Encoding / Decoding                     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Phase 1: Zero-Dependency Core Tools (Current Priority)

All tools in this phase use our existing, verified stack (`pdf-lib`, `pdf.js`, `jspdf`, HTML5 Canvas) with **zero external bandwidth or package overhead**.

### 1.1 ✍️ e-Sign & Signature Placement (`sign-pdf`)
- **Objective**: Allow users to draw, type, or upload transparent signatures, place and resize them visually on any PDF page, and stamp them permanently.
- **Engine**: `js/core/signEngine.js` using `pdfDoc.embedPng()`.
- **UI Controller**: `js/ui/signTool.js` with signature drawing canvas pad, cursive font generator, page carousel navigator, and draggable/resizable bounding box.
- **Status**: [ ] Not Started
- **Checklist**:
  - [ ] Canvas signature drawing pad with pen width and smoothing.
  - [ ] Type-to-signature generator with cursive typography presets.
  - [ ] Signature image upload (transparent PNG/SVG).
  - [ ] Interactive draggable/resizable placement overlay on rendered PDF page.
  - [ ] Multi-page navigation (place signature on page N).
  - [ ] Embed and export via `pdf-lib`.

---

### 1.2 🕵️ Privacy Metadata Scrubber & EXIF Cleaner (`metadata-scrubber`)
- **Objective**: Inspect, sanitize, and completely scrub tracking metadata (Author, Software, Creator, Creation/Modification dates, GPS tags, device serials) from PDFs and images.
- **Engine**: `js/core/metadataEngine.js` (PDF dictionary sanitizer + Canvas EXIF strip).
- **UI Controller**: `js/ui/metadataTool.js` with Swiss Minimalist inspection matrix.
- **Status**: [ ] Not Started
- **Checklist**:
  - [ ] Extract and display all document info dictionary keys.
  - [ ] 1-Click "Scrub All Metadata" (set to empty strings and purge date stamps).
  - [ ] Custom field editor (modify author/title without leaking creator info).
  - [ ] Image EXIF/GPS metadata stripping via pixel buffer rebuild.
  - [ ] Before/After metadata audit report.

---

### 1.3 🖨️ Grayscale & Monochrome Print Optimizer (`grayscale-pdf`)
- **Objective**: Convert color documents into high-contrast grayscale or pure black & white to save up to 70% file size and prevent printer toner waste.
- **Engine**: `js/core/grayscaleEngine.js` using luminosity formula:
  $$\text{Gray} = 0.299R + 0.587G + 0.114B$$
- **UI Controller**: `js/ui/grayscaleTool.js`.
- **Status**: [ ] Not Started
- **Checklist**:
  - [ ] Multi-page rendering through OffscreenCanvas.
  - [ ] Grayscale mode (256 shades of gray).
  - [ ] Pure B&W threshold mode with adjustable contrast slider.
  - [ ] Reassembly into PDF using `jsPDF` / `pdf-lib`.
  - [ ] Before/After file size comparison.

---

### 1.4 📋 PDF Form & Annotation Flattening (`flatten-pdf`)
- **Objective**: Freeze interactive AcroForms, form fields, checkboxes, and annotations into immutable document vectors (required for visa, court, and tax filings).
- **Engine**: `js/core/flattenEngine.js` via `pdfDoc.getForm().flatten()`.
- **UI Controller**: `js/ui/flattenTool.js`.
- **Status**: [ ] Not Started
- **Checklist**:
  - [ ] Detect if uploaded PDF has interactive forms or annotations.
  - [ ] Execute `pdfDoc.getForm().flatten()`.
  - [ ] Flatten annotation layers and comments.
  - [ ] Instant export of immutable static PDF.

---

## 🧠 Phase 2: Client-Side AI & Vision (Zero API Cost)

### 2.1 🔍 Client-Side OCR & Searchable PDF (`ocr-pdf`)
- **Engine**: `tesseract.js` via WebAssembly web worker (runs 100% offline).
- **Capabilities**:
  - Extract raw text from scanned PDFs, receipts, and images.
  - Create searchable PDF with an invisible selectable text layer superimposed over the scan.
  - Multi-language offline language pack support (English, Spanish, German, French, etc.).
- **Status**: [ ] Planned

### 2.2 ✂️ 1-Click Client-Side Background Removal (`remove-bg`)
- **Engine**: `@imgly/background-removal` or RMBG ONNX model via ONNX Runtime WebAssembly.
- **Capabilities**:
  - 100% in-browser foreground/background segmentation.
  - Export transparent PNG signatures, product photos, or headshots.
  - Zero cloud dependency, zero API fees.
- **Status**: [ ] Planned

### 2.3 🛡️ Irreversible Stream-Level Redaction (`redact-pdf`)
- **Engine**: Native PDF stream object parser.
- **Capabilities**:
  - Select text or draw redaction boxes.
  - Purge underlying text strings, font glyphs, and raster image data from the raw PDF stream (preventing the common security failure where black boxes can be deleted to reveal text).
- **Status**: [ ] Planned

---

## 🔄 Phase 3: Conversions & Imposition Utilities

### 3.1 📄 PDF to Editable Word (.docx) (`pdf-to-docx`)
- **Engine**: `docx.js` + client-side text run positioning.
- **Capabilities**:
  - Extract text blocks, font sizes, alignments, and embedded images.
  - Generate `.docx` files natively in the browser without LibreOffice or remote servers.
- **Status**: [ ] Planned

### 3.2 📑 N-Up Multi-Page Imposition (`nup-pdf`)
- **Engine**: `pdf-lib` custom transformation matrix.
- **Capabilities**:
  - Place 2, 4, 6, or 8 pages onto a single sheet of A4/Letter paper.
  - Generate booklet layouts, handout sheets, and cheat sheets.
- **Status**: [ ] Planned

### 3.3 ⚖️ Visual PDF Diff & Contract Comparator (`compare-pdf`)
- **Engine**: Dual canvas pixel diffing (`pixelmatch`).
- **Capabilities**:
  - Compare two versions of a contract, architectural drawing, or proposal.
  - Highlight additions in green and deletions in red side-by-side.
- **Status**: [ ] Planned

---

## ⚡ Phase 4: 2026 Web Platform & Performance Standards

### 4.1 📁 File System Access API Integration
- Allow users to select an entire local folder.
- Batch convert, compress, or watermark hundreds of files in-place without individual download prompts.
- **Status**: [ ] Planned

### 4.2 📲 Web Share Target & Native OS Menus
- Register `share_target` in `manifest.json`.
- When installed as a PWA on iOS, Android, macOS, or Windows, iZeroPDF appears directly in the system "Share" sheet.
- **Status**: [ ] Planned

### 4.3 🧵 Web Workers & OffscreenCanvas Multi-Threading
- Background threads for PDF rendering and image compression.
- Prevents UI frame drops and freezes on large (100+ page) files.
- **Status**: [ ] Planned

### 4.4 🖼️ AVIF & Next-Gen Image Standards
- Client-side AVIF encoding and decoding.
- Offers 30% smaller sizes than WebP and 50% smaller than JPEG at equal visual fidelity.
- **Status**: [ ] Planned

---

## 📝 Change Log & Progress Updates

| Date | Phase | Feature / Task | Status | Commit / Notes |
| :--- | :--- | :--- | :--- | :--- |
| **2026-11-07** | **Planning** | Created `docs/features-plan-2026.md` | Completed | Roadmap initialization |

---

## 📌 Maintenance Directive

Whenever any task from this plan is started, updated, or completed:
1. Update the status checkbox (`[ ]` $\to$ `[x]`).
2. Add an entry to the **Change Log & Progress Updates** table above with the date, feature name, status, and commit hash.
3. Update [`docs/changelog.md`](changelog.md) and [`README.md`](../README.md) to maintain synchronization across the codebase.
