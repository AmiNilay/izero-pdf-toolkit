# Changelog

All notable changes to the Offline PDF Toolkit will be documented in this file.

## [2.1.0] - 2026-11-07

### Design System & Visual Style
- **Swiss Minimalist Transformation**: Full migration from Material You to the Swiss Minimalist design system:
  - **Color Palette & Surfaces**: High-contrast white ground (`#ffffff`), black ink (`#000000`), pale grey surface (`#f0f0f0`), and punchy red accent signals (`#c90000`). Removed all floating card shadows, blur backdrop filters, gradients, and pastel surfaces.
  - **Authoritative Geometry**: Enforced 0 radius (`--dp-radius-control: 0`) across all controls, buttons, cards, modals, and workspaces, alongside continuous visible 2px dividing rules (`--dp-border-rule: 2px`).
  - **Continuous Typographic Grid**: Adopted a 12-column desktop layout featuring a 9-column opening statement in the hero and a persistent 3-column index rail (`01 / FEATURED`, `02 / PDF`, `03 / IMAGE`) with tool matrixes aligning to the 4th column.
  - **Typography Scale**: Bound Host Grotesk (`"SwissMinimalistHost", "Host Grotesk", Arial, sans-serif`) with heavy display headings (scale up to 110px, line-height 0.92, tight letter tracking) and tracked uppercase labels/metadata.
  - **Ruled Matrix Cards**: Converted floating tool cards into a continuous ruled matrix with direct black-and-white state inversions and red featured markers.
  - **Immediate Visual Feedback**: Set `--dp-motion-feedback: 0s` removing ornamental float/pulse animations for immediate tactile responsiveness and reduced-motion compliance.
  - **Full Dark Mode Parity**: Synchronized Swiss Minimalist tokens in `css/theme-dark.css` with dark ground (`#0a0a0a`), white ink (`#ffffff`), dark surface (`#141414`), and vibrant red signals (`#e50000`).

---

## [2.0.1] - 2024-05-21

### Security
- **DOM-Based XSS Remediation**: Sanitized user file name interpolation in `mergeTool`, `imageToPdf`, `imageConverterTool`, and `splitTool` using a new `FileHelpers.escapeHtml()` utility.

### Fixed
- **Vercel Routing**: Added explicit routing overrides for `/sw.js` and root `.html` files in `vercel.json` to prevent rewrite collisions with the single-page application wildcard.
- **Service Worker Installation**: Corrected 404 cache failure caused by missing `pdfToImage.js`, registered all missing tools and engines, and added `cdn.jsdelivr.net` to allowed fetch origins.
- **Merge Engine Crash**: Replaced invalid `mergedPdf.setPageSize()` call with per-page `page.setSize()` adjustments.
- **Extract Images**: Fixed data structure nesting mismatch so image previews and ZIP downloads work, and added conversion for RGB and Grayscale buffers into 4-channel RGBA before creating `ImageData`.
- **Encrypted/Restricted PDF Support**: Added `{ ignoreEncryption: true }` across all PDF tools to allow handling of owner-restricted documents.
- **Rotate PDF Logic**: Replaced absolute angle overrides with relative angle accumulation and switched previews to PDF.js native rotation.
- **Subdirectory Portability**: Removed hardcoded `<base href="/">` in `index.html` and updated router logic to allow deployment on subpaths and GitHub Pages.
- **Photo Resizer Aspect Ratio**: Connected the aspect ratio checkbox dynamically instead of hardcoding `false`.
- **Organize PDF**: Added safeguard against saving empty documents (0 pages).
- **Watermark Tool**: Expanded repeating pattern bounds to canvas diagonal to prevent corner clipping and protected against infinite loops on 0-spacing.
- **Syntax Cleanup**: Removed stray `clear` command in `pdfToJpgTool.js`.
- **Memory Management**: Revoked temporary object URLs in `FileHelpers.loadImage()`.

---

## [2.0.0] - 2024-05-20

### Added
- **9 New Tools**: 
  - Compress PDF (with smart "Target Size" binary search compression)
  - Compress Image (with target size optimization)
  - Organize PDF (drag-and-drop reordering, duplicating, and reversing)
  - Remove Pages (visual selection with "Select All/Invert" controls)
  - Lock PDF (128-bit and 256-bit AES password encryption)
  - Rotate Image (with flip horizontal/vertical controls)
  - Watermark Image (customizable tiled text watermarks)
  - Convert Image (format conversion between JPEG, PNG, WebP, etc.)
  - Photo Resizer (preset dimensions for IDs, social media, etc.)
- **Live Previews**: Real-time canvas previews for Crop, Rotate PDF, Organize PDF, Remove Pages, and Lock PDF tools.
- **Documentation**: Comprehensive new User Guide and fully redesigned Footer pages (Privacy, Open Source, GitHub, Support, and a new License page).
- **PWA Enhancements**: Improved cache consent dialog and offline readiness.

### Changed
- **Major UI/UX Overhaul**: Complete redesign of all tool interfaces using modern Material You design principles, featuring cleaner layouts, better spacing, and intuitive controls.
- **Mobile Responsiveness**: Enhanced adaptive grids, touch-friendly buttons, and optimized canvas scaling for all screen sizes (especially tall 9:16 images).
- **Dependencies**: Switched to `pdf-lib-with-encrypt` to enable robust client-side PDF password protection.

### Fixed
- **Icon Rendering**: Replaced invalid Material Symbols names (`extract` → `file_download`, `watermark` → `water_drop`) to prevent giant text overflow on tool cards.
- **Encryption Errors**: Resolved the `pdf.encrypt is not a function` crash by migrating to the encryption-compatible library fork.
- **Canvas Scaling**: Fixed layout breaks when uploading tall/portrait images in the Crop tool.
- **Routing**: Added missing routes for newly created tools to prevent accidental redirects to the home page.

---

## [1.0.0] - 2024-01-15

### Added
- Initial stable release of Offline PDF Toolkit
- PDF to Images conversion with DPI options
- Images to PDF conversion with page size options
- Interactive crop tool with grid and aspect lock
- Image resize tool with maintain aspect ratio
- PDF merge with page numbering
- PDF split with multiple methods (ranges, every N pages, specific pages)
- PDF rotation with individual page control
- Image extraction from PDFs
- Full offline support via Service Worker
- PWA manifest for installability
- Dark mode toggle
- Drag and drop support for all tools
- ZIP file downloads for multiple files
- Toast notifications for user feedback
- Progress indicators for long operations

### Technical
- Built with vanilla JavaScript (no heavy frameworks)
- PDF.js for client-side PDF rendering
- jsPDF for PDF generation
- pdf-lib for PDF manipulation
- FileSaver.js for reliable file downloads
- JSZip for client-side ZIP file creation

### Performance
- Optimized image processing with HTML5 Canvas
- Aggressive memory cleanup after operations
- Lazy loading of tool controllers
- Efficient Service Worker caching strategy

---

## [0.9.0] - 2024-01-01

### Added
- Beta release of core tools
- Basic PDF to Images conversion
- Basic Images to PDF conversion
- Simple crop tool
- Simple resize tool

### Known Issues (Resolved in v1.0.0+)
- Memory leaks on large file processing
- Some PDFs failed to load due to parser limitations
- Mobile UI layout issues

---

## Future Plans

### [2.1.0] - Planned
- PDF to Word/Text (OCR) extraction
- Advanced batch processing queue
- More image filters (brightness, contrast, grayscale)
- Custom watermark image/logo support

### [2.2.0] - Planned
- PDF form filling
- Digital signatures
- Advanced metadata editing
- Additional export formats (e.g., PDF to HTML)

### [3.0.0] - Roadmap
- AI-powered document summarization
- Visual document comparison
- Advanced vector editing capabilities
- Optional, privacy-focused cloud sync