# Codebase Audit & Fixes Documentation

This document provides a detailed record of the architectural, security, and functional audit conducted on the **iZeroPDF** codebase, detailing what was changed, how it was changed, and the criticality of each fix.

---

## 1. Criticality & Severity Matrix

| Criticality | Impact Definition | Issues Fixed |
| :--- | :--- | :--- |
| **CRITICAL** | Production breaking, PWA offline failure, or security vulnerability (XSS). | - Vercel routing intercepting Service Worker & HTML pages<br>- Service Worker 404 cache install failure<br>- DOM-based XSS via unsanitized file names<br>- Merge PDF `setPageSize` unhandled crash<br>- Extract Images data structure mismatch & `ImageData` crash<br>- Stray `clear` terminal command breaking script execution |
| **HIGH** | Core functionality failures on common documents or data distortion. | - `EncryptedPDFError` crashing on owner-restricted PDFs<br>- Rotate Tool setting absolute instead of relative rotation<br>- Organize PDF crashing on 0-page save<br>- Photo Resizer ignoring user aspect-ratio settings |
| **MEDIUM** | Inconsistent UI states, subpath deployment failure, and subpage theme breaks. | - Hardcoded `<base href="/">` breaking GitHub Pages / subpaths<br>- Split Tool displaying "0 pages" on extracted single pages<br>- Theme toggle unresponsive on direct subpage visits<br>- Watermark clipping corners & zero-spacing loop hazard<br>- PDF compression returning larger files than original |
| **LOW** | Memory hygiene and lifecycle cleanup. | - Memory leaks from unrevoked `URL.createObjectURL` references |

---

## 2. Detailed Breakdown of Changes

### Issue 1: Vercel Routing Intercepting Service Worker & Subpages
* **File:** [`vercel.json`](../vercel.json)
* **Criticality:** **CRITICAL**
* **Why it needed to change:** The wildcard rule `/(.*) -> /index.html` was positioned without explicit overrides for `/sw.js` and root `.html` pages. When the browser fetched `/sw.js`, Vercel served `index.html` as `text/html`. The browser refused to register the service worker due to an invalid MIME type, breaking the entire offline/PWA capability on Vercel.
* **How it was changed:**
  Added explicit routes for `/sw.js` (including necessary `cache-control` and `service-worker-allowed` headers) and `/(.*\.html)` before the final SPA catch-all rule:
  ```json
  {
    "src": "/sw.js",
    "dest": "/sw.js",
    "headers": {
      "cache-control": "public, max-age=0, must-revalidate",
      "service-worker-allowed": "/"
    }
  },
  {
    "src": "/(.*\\.html)",
    "dest": "/$1"
  }
  ```

---

### Issue 2: Service Worker Atomic Install Failure (404 on Missing Asset)
* **File:** [`sw.js`](../sw.js)
* **Criticality:** **CRITICAL**
* **Why it needed to change:** In `STATIC_ASSETS`, `/js/ui/pdfToImage.js` was listed, but the file did not exist in the repository (it is named `pdfToJpgTool.js`). Because the Cache API's `cache.addAll()` is atomic, a single 404 response causes the entire `install` promise to reject, permanently disabling the Service Worker. Furthermore, newly added core engines and tools were missing from offline caching.
* **How it was changed:**
  1. Replaced `/js/ui/pdfToImage.js` with `/js/ui/pdfToJpgTool.js`.
  2. Added all missing engines (`imageConverter.js`, `imageEditorEngine.js`) and UI controllers (`imageConverterTool.js`, `imageEditorTool.js`, `organizePdfTool.js`, `rotateImageTool.js`, `watermarkTool.js`).
  3. Added `cdn.jsdelivr.net` to the allowed origins in the fetch handler.
  4. Added null-safety check for `event.request.headers.get('accept')`.

---

### Issue 3: DOM-Based Cross-Site Scripting (XSS) via Uploaded File Names
* **Files:** [`js/utils/fileHelpers.js`](../js/utils/fileHelpers.js), [`js/ui/mergeTool.js`](../js/ui/mergeTool.js), [`js/ui/imageToPdf.js`](../js/ui/imageToPdf.js), [`js/ui/imageConverterTool.js`](../js/ui/imageConverterTool.js), [`js/ui/splitTool.js`](../js/ui/splitTool.js)
* **Criticality:** **CRITICAL**
* **Why it needed to change:** Dynamic file names (`file.name`, `pdf.name`, `img.name`, `result.filename`) were directly concatenated into template literal strings and rendered via `.innerHTML`. A file named `<img src=x onerror=alert(1)>.pdf` resulted in arbitrary JavaScript execution.
* **How it was changed:**
  1. Created a dedicated sanitization helper in `FileHelpers`:
     ```javascript
     function escapeHtml(str) {
         if (str === null || str === undefined) return '';
         return String(str)
             .replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;')
             .replace(/"/g, '&quot;')
             .replace(/'/g, '&#39;');
     }
     ```
  2. Wrapped all interpolated file names across UI tool list renders and modal headers with `FileHelpers.escapeHtml(...)`.

---

### Issue 4: Merge PDF Crash on Page Size Selection
* **File:** [`js/core/mergeEngine.js`](../js/core/mergeEngine.js)
* **Criticality:** **CRITICAL**
* **Why it needed to change:** When selecting a standard page size (e.g. A4, Letter, Legal), the engine called `mergedPdf.setPageSize(size[0], size[1])`. In `pdf-lib`, `PDFDocument` does not possess a `setPageSize` method; page sizes are properties of individual `PDFPage` instances. This caused an unhandled `TypeError: mergedPdf.setPageSize is not a function`, halting all merge operations.
* **How it was changed:**
  Extracted target dimensions into `targetSize` and applied them directly to each copied page instance in the document construction loop:
  ```javascript
  for (const page of pages) {
      pageCounter++;
      if (targetSize) {
          page.setSize(targetSize[0], targetSize[1]);
      }
      mergedPdf.addPage(page);
  }
  ```

---

### Issue 5: Extract Images Tool Data Structure Mismatch & ImageData Crash
* **File:** [`js/core/pdfProcessor.js`](../js/core/pdfProcessor.js)
* **Criticality:** **CRITICAL**
* **Why it needed to change:**
  1. `pdfProcessor.js` returned an object nested as `{ data: { blob, width, height, size, format }, page, format }`. In `extractTool.js`, functions evaluated `if (img.blob)`. Because `img.blob` was `undefined`, previews, direct downloads, and ZIP exports did nothing.
  2. `new ImageData(new Uint8ClampedArray(image.data), width, height)` threw an `IndexSizeError` whenever an image in a PDF was 3-channel RGB or 1-channel Grayscale, as `ImageData` strictly demands `width * height * 4` bytes.
* **How it was changed:**
  1. Flattened the returned image structure so `blob`, `width`, `height`, and `size` exist at top-level on each image item.
  2. Implemented automated pixel-buffer expansion converting RGB (3 bytes) and Grayscale (1 byte) buffers into 4-channel RGBA before instantiating `ImageData`.

---

### Issue 6: Stray Terminal Command in `pdfToJpgTool.js`
* **File:** [`js/ui/pdfToJpgTool.js`](../js/ui/pdfToJpgTool.js)
* **Criticality:** **CRITICAL**
* **Why it needed to change:** The file ended with `window.PdfToJpgController = PdfToJpgController;clear`. In a browser runtime, `clear` was parsed as an undefined identifier, causing an unhandled `ReferenceError: clear is not defined`.
* **How it was changed:**
  Removed the accidental `clear` token.

---

### Issue 7: `EncryptedPDFError` on Owner-Restricted PDFs
* **Files:** [`js/core/mergeEngine.js`](../js/core/mergeEngine.js), [`js/core/splitEngine.js`](../js/core/splitEngine.js), [`js/core/compressEngine.js`](../js/core/compressEngine.js), [`js/ui/lockTool.js`](../js/ui/lockTool.js), [`js/ui/rotateTool.js`](../js/ui/rotateTool.js), [`js/ui/organizePdfTool.js`](../js/ui/organizePdfTool.js), [`js/ui/removePagesTool.js`](../js/ui/removePagesTool.js)
* **Criticality:** **HIGH**
* **Why it needed to change:** Documents with owner security restrictions or permission metadata (read-allowed without an open password) threw an unhandled `EncryptedPDFError: Input document to PDFDocument.load is encrypted` when passed into `PDFDocument.load(arrayBuffer)`.
* **How it was changed:**
  Passed `{ ignoreEncryption: true }` into every `PDFDocument.load(arrayBuffer, { ignoreEncryption: true })` invocation across all engines and UI controllers.

---

### Issue 8: Rotate Tool Overwrote Page Rotation & Distorted Previews
* **File:** [`js/ui/rotateTool.js`](../js/ui/rotateTool.js)
* **Criticality:** **HIGH**
* **Why it needed to change:**
  1. `page.setRotation(degrees(rotation))` replaced the existing rotation rather than adding to it. Pages with initial non-zero rotation (e.g. 90° landscape scans) ended up with incorrect orientations.
  2. The canvas preview manually rotated the 2D context using inverted canvas dimensions, causing canvas clipping and distortion.
* **How it was changed:**
  1. Accumulated rotation angle relatively: `finalAngle = ((page.getRotation().angle || 0) + addedRotation) % 360`.
  2. Passed `finalAngle` directly to PDF.js's viewport renderer (`page.getViewport({ scale: 0.5, rotation: finalAngle })`), letting the engine compute proper bounding boxes and orientation.

---

### Issue 9: Organize PDF Zero-Page Save Crash
* **File:** [`js/ui/organizePdfTool.js`](../js/ui/organizePdfTool.js)
* **Criticality:** **HIGH**
* **Why it needed to change:** If a user deleted all pages and clicked "Apply Changes", `pdf-lib` threw an unhandled exception because a PDF cannot be saved with zero pages.
* **How it was changed:**
  Added validation in `applyChanges()`:
  ```javascript
  if (pageOrder.length === 0) {
      showToast('error', 'Cannot create a PDF with 0 pages. Please keep at least one page.');
      return;
  }
  ```

---

### Issue 10: Photo Resizer Ignored User Aspect Ratio Setting
* **File:** [`js/ui/photoResizerTool.js`](../js/ui/photoResizerTool.js)
* **Criticality:** **HIGH**
* **Why it needed to change:** Both `updateResizePreview()` and `applyResize()` hardcoded `false` into `CanvasHelpers.resizeImage(currentImage, width, height, false)`, completely ignoring the `#maintainAspectResizer` checkbox. This severely distorted facial proportions on ID/passport presets.
* **How it was changed:**
  Read the active state of `#maintainAspectResizer` and forwarded it dynamically to `CanvasHelpers.resizeImage`.

---

### Issue 11: Hardcoded `<base href="/">` Broke Subdirectory Deployments
* **Files:** [`index.html`](../index.html), [`js/router.js`](../js/router.js)
* **Criticality:** **MEDIUM**
* **Why it needed to change:** `<base href="/">` forced all relative stylesheet and script paths to resolve to the domain root. When hosted on GitHub Pages (`https://username.github.io/repo/`) or subpaths, assets failed to load. Additionally, `router.js` pushed `'/?tool=...'`, stripping the subpath from the URL.
* **How it was changed:**
  1. Removed `<base href="/">` from `index.html`.
  2. Updated `router.js` to build URLs from `window.location.pathname`.
  3. Made `pageRoutes` relative (`privacy.html` instead of `/privacy.html`).

---

### Issue 12: Split Tool Extracted Pages Displayed "0 pages"
* **File:** [`js/core/splitEngine.js`](../js/core/splitEngine.js)
* **Criticality:** **MEDIUM**
* **Why it needed to change:** In `extractPages()`, the result object omitted `pageCount` and `pages`, causing the preview card template to display "0 pages".
* **How it was changed:**
  Added `pageCount: 1` and `pages: [pageNum + 1]` to each item in the results array.

---

### Issue 13: Theme Toggle Inactive on Direct Subpage Visits
* **File:** [`js/app.js`](../js/app.js)
* **Criticality:** **MEDIUM**
* **Why it needed to change:** On direct visits to subpages (`privacy.html`, `license.html`, etc.), `checkCacheConsent()` called `showCacheDialog()`. Because `#cacheConsentDialog` does not exist on those pages, it returned early without calling `initializeApp(false)`, leaving `ThemeManager.init()` uncalled and the dark/light toggle dead.
* **How it was changed:**
  Added a fallback in `showCacheDialog()` to call `initializeApp(false)` when the modal dialog element is not present.

---

### Issue 14: Watermark Corner Clipping & Infinite Loop Protection
* **File:** [`js/ui/watermarkTool.js`](../js/ui/watermarkTool.js)
* **Criticality:** **MEDIUM**
* **Why it needed to change:** The loop bounds were constrained to `[-width, width]`, leaving the corners of rotated watermarks unpainted. If `size` was 0, `spacing` evaluated to 0, locking the main thread in an infinite loop.
* **How it was changed:**
  Expanded loop limits using the canvas diagonal `Math.hypot(width, height)` and enforced a minimum spacing of 40px:
  ```javascript
  const spacing = Math.max(40, (parseInt(size) || 60) * 4);
  const diagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
  ```

---

### Issue 15: PDF Compression File Ballooning Prevention
* **File:** [`js/core/compressEngine.js`](../js/core/compressEngine.js)
* **Criticality:** **MEDIUM**
* **Why it needed to change:** Standard mode compression with `pdf-lib` does not re-compress existing embedded raster images; it only re-packages streams. For already-optimized PDFs, saving often caused the output file to be larger than the original, displaying negative savings.
* **How it was changed:**
  Added a safeguard check: if `compressedSize >= originalSize`, the original buffer is preserved with a clear notification that the document is already optimized.

---

### Issue 16: Memory Leaks from Unrevoked Object URLs
* **File:** [`js/utils/fileHelpers.js`](../js/utils/fileHelpers.js)
* **Criticality:** **LOW**
* **Why it needed to change:** `FileHelpers.loadImage()` called `URL.createObjectURL(file)` without revoking it, causing progressive memory leaks during batch image processing.
* **How it was changed:**
  Added `URL.revokeObjectURL(objectUrl)` to both `img.onload` and `img.onerror` handlers.

---

### Issue 17: Duplicate Conflicting PWA Manifest in `index.html`
* **File:** [`index.html`](../index.html)
* **Criticality:** **HIGH**
* **Why it needed to change:** `<head>` contained two conflicting `<link rel="manifest">` tags: `assets/icons/favicon_io/site.webmanifest` followed by `manifest.json`. The first manifest contained empty name strings (`"name": ""`), which caused Chromium browsers to fail the PWA installability audit.
* **How it was changed:** Removed the redundant `site.webmanifest` link, ensuring `manifest.json` acts as the single authoritative manifest.

---

### Issue 18: Incomplete `manifest.json` Metadata & Missing Real PNG Icons
* **File:** [`manifest.json`](../manifest.json)
* **Criticality:** **MEDIUM**
* **Why it needed to change:** `manifest.json` used legacy branding ("Offline PDF Toolkit"), an outdated `#1a237e` theme color, and a fallback data-SVG emoji icon instead of referencing the actual 192x192 and 512x512 PNG assets present in the repository.
* **How it was changed:** Updated app name to "iZeroPDF", synchronized `theme_color` to `#7c3aed`, set relative `start_url` to `"./"`, and pointed icons to `assets/icons/favicon_io/android-chrome-192x192.png` and `512x512.png`.

---

### Issue 19: Static 404 Redirect Causing Infinite Loop on Root Deployments
* **File:** [`404.html`](../404.html)
* **Criticality:** **MEDIUM**
* **Why it needed to change:** `404.html` hardcoded a meta refresh redirect to `/iZeroPDF/`. On Vercel or any root-domain deployment, any 404 redirected to a non-existent `/iZeroPDF/` path, creating an infinite redirect loop.
* **How it was changed:** Added dynamic path detection via JavaScript that redirects to `/iZeroPDF/` only if on a GitHub Pages subdirectory, otherwise redirecting to root `/`.

---

## 3. Summary of Modified Files

| File | Type | Changes Made |
| :--- | :--- | :--- |
| `vercel.json` | Config | Added `/sw.js` and `/(.*\.html)` routes before SPA catch-all |
| `sw.js` | Service Worker | Fixed 404 on `pdfToImage.js`, added all missing tools/engines, added jsdelivr CDN |
| `index.html` | Markup | Removed `<base href="/">` and duplicate conflicting manifest |
| `manifest.json` | PWA Config | Updated metadata to iZeroPDF, synced theme color, and linked real PNG icons |
| `404.html` | Page | Made redirect path dynamic to prevent loop on root deployments |
| `js/app.js` | Core | Fallback app initialization for subpages to fix theme toggle |
| `js/router.js` | Routing | Dynamic URL construction and relative footer paths |
| `js/utils/fileHelpers.js` | Utilities | Added `escapeHtml()`, fixed `loadImage()` object URL memory leak |
| `js/core/mergeEngine.js` | Engine | Fixed `setPageSize` crash; added `{ ignoreEncryption: true }` |
| `js/core/splitEngine.js` | Engine | Added `{ ignoreEncryption: true }`; fixed `extractPages` pageCount |
| `js/core/pdfProcessor.js` | Engine | Fixed image extraction data shape; handled RGB/Grayscale to RGBA |
| `js/core/compressEngine.js` | Engine | Added `{ ignoreEncryption: true }`; prevented returning ballooned files |
| `js/ui/mergeTool.js` | Tool UI | Sanitized file names against XSS |
| `js/ui/imageToPdf.js` | Tool UI | Sanitized file names against XSS |
| `js/ui/imageConverterTool.js` | Tool UI | Sanitized file names against XSS |
| `js/ui/splitTool.js` | Tool UI | Sanitized file names in results and preview modal against XSS |
| `js/ui/rotateTool.js` | Tool UI | Fixed relative rotation, native PDF.js preview rendering, and encryption handling |
| `js/ui/organizePdfTool.js` | Tool UI | Blocked 0-page saving; added `{ ignoreEncryption: true }` |
| `js/ui/removePagesTool.js` | Tool UI | Added `{ ignoreEncryption: true }` to `PDFDocument.load` |
| `js/ui/lockTool.js` | Tool UI | Added `{ ignoreEncryption: true }` to `PDFDocument.load` |
| `js/ui/photoResizerTool.js` | Tool UI | Connected `maintainAspectResizer` to canvas resizer |
| `js/ui/pdfToJpgTool.js` | Tool UI | Removed stray `clear` token at EOF |
| `js/ui/watermarkTool.js` | Tool UI | Fixed corner clipping and zero-spacing infinite loop hazard |
| `docs/audit-and-fixes.md` | Documentation | **New file** documenting all audit findings, severity, and solutions |
