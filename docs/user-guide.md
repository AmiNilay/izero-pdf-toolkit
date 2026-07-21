# Offline PDF Toolkit - User Guide

## Welcome
The Offline PDF Toolkit is a 100% client-side application that runs entirely in your browser. No data is ever uploaded to any server—everything stays securely on your device.

## Getting Started

### Installation
1. Visit the website.
2. The service worker will automatically cache all assets for offline use.
3. Click "Accept & Continue" on the cache consent dialog for the best experience.
4. Add to your home screen for a seamless Progressive Web App (PWA) experience.

### Navigation
Use the navigation bar at the top to switch between tools. On mobile, scroll down to explore the categorized tool grids.

---

## Tools Guide

### 📄 PDF Tools

#### 1. PDF → JPG
Convert PDF pages into high-quality JPG images.
- **How to use:** Upload your PDF, select the DPI (72 for web, 150+ for print) and quality, then click "Convert to JPG".
- **Features:** View live previews, select specific pages, save individually, or download selected pages as a ZIP file.
- **Tips:** Higher DPI yields better quality but larger file sizes.

#### 2. Images → PDF
Convert multiple images into a single, unified PDF document.
- **How to use:** Upload your images, choose the page size (A4, Letter, etc.), select orientation, and choose how images fit on the page.
- **Tips:** Upload images in the desired order. You can remove images before conversion by clicking the ✕ button.

#### 3. Merge PDF
Combine multiple PDF files into one document.
- **How to use:** Upload your PDFs, choose a page size (or auto), optionally add page numbers, and click "Merge PDFs".
- **Tips:** The order of upload determines the order in the final merged PDF.

#### 4. Split PDF
Split a PDF into multiple smaller documents.
- **Methods:** 
  - *By Page Ranges:* e.g., "1-3,5,7-9"
  - *Every N Pages:* Split every X pages
  - *Extract Specific Pages:* Extract only selected pages
  - *Split at Pages:* Split before specified page numbers
- **Features:** Live preview of split parts, individual downloads, or bulk ZIP download.

#### 5. Compress PDF
Reduce PDF file size efficiently.
- **How to use:** Upload your PDF, choose between "Quality Based" (Lossless, Balanced, Maximum) or "Target Size" (e.g., under 1MB).
- **Tips:** The "Target Size" mode uses smart rasterization to guarantee the file meets your exact size requirement.

#### 6. Rotate PDF
Rotate pages within a PDF document.
- **How to use:** Upload your PDF, choose a rotation angle (90°, 180°, 270°), and apply it to "All Pages" or "Specific Pages".
- **Features:** Live page previews with individual rotate/reset buttons for precise control.

#### 7. Organize PDF
Reorder, delete, or duplicate pages in your PDF.
- **How to use:** Upload your PDF, then drag and drop page thumbnails to reorder them. Use the ✕ button to delete pages.
- **Tips:** Use the "Reverse All" or "Duplicate" buttons for quick bulk actions.

#### 8. Remove Pages
Visually select and remove unwanted pages from a PDF.
- **How to use:** Upload your PDF, click on the pages you want to remove (they will be highlighted in red), and click "Remove Selected Pages".
- **Features:** "Select All", "Deselect All", and "Invert Selection" buttons for easy management.

#### 9. Lock PDF
Password-protect your PDF documents.
- **How to use:** Upload your PDF, enter and confirm a password (min. 4 characters), and choose an encryption level (128-bit or 256-bit).
- **Tips:** 256-bit AES encryption provides the strongest security for sensitive documents.

#### 10. Extract Images
Extract all embedded images from a PDF.
- **How to use:** Upload your PDF, set a minimum image size to filter out tiny icons/logos, choose the output format, and click "Extract".
- **Tips:** PNG preserves original quality, while JPEG significantly reduces the extracted file size.

---

### 🖼️ Image Tools

#### 11. Resize Image
Change the dimensions of an image.
- **How to use:** Upload your image, set the new width and height, or use the percentage slider for quick proportional resizing.
- **Tips:** Enable "Maintain Aspect Ratio" to prevent the image from stretching or squishing.

#### 12. Compress Image
Reduce image file size while maintaining visual quality.
- **How to use:** Upload your image, choose "Quality Based" compression or set a specific "Target Size" (e.g., 50 KB, 500 KB).
- **Tips:** The binary search algorithm automatically finds the perfect balance between quality and file size.

#### 13. Convert Image
Convert images between different formats seamlessly.
- **How to use:** Upload your image and select the desired output format (JPEG, PNG, WebP, etc.).

#### 14. Crop Image
Select and crop a specific area of an image.
- **How to use:** Upload your image, click and drag on the canvas to select the crop area, or manually enter X, Y, Width, and Height coordinates.
- **Tips:** Use "Lock Aspect Ratio" to maintain specific proportions (like 16:9 or 1:1). The "Show Grid" overlay helps with precise alignment.

#### 15. Rotate Image
Rotate and flip images in any direction.
- **How to use:** Upload your image, then use the controls to Rotate Left, Rotate Right, Flip Horizontal, or Flip Vertical.
- **Features:** Live canvas preview updates instantly with every click.

#### 16. Watermark Image
Add customizable text watermarks to your images.
- **How to use:** Upload your image, enter your watermark text, and adjust the font size, opacity, and color.
- **Tips:** The watermark tiles diagonally across the entire image for maximum protection.

#### 17. Photo Resizer
Quickly resize images to standard dimensions for specific use cases.
- **How to use:** Upload your image and select a preset (e.g., Passport ID, Social Media Profile, etc.) for instant, perfectly sized outputs.

---

## Keyboard Shortcuts
- `Esc` - Close dialogs or cancel operations.
- `Enter` - Confirm or submit forms.
- `Ctrl + Z` - Undo (where supported by the browser).

---

## Privacy & Security
- **100% Local Processing:** All file manipulation happens locally in your browser using WebAssembly and JavaScript.
- **Zero Uploads:** Your files are never sent to any external server.
- **No Tracking:** We do not use cookies, analytics, or third-party tracking scripts.
- **Open Source:** The code is fully transparent and available for community audit.

---

## Troubleshooting

**File too large?**
- The maximum recommended file size is 100MB. For larger files, try splitting the PDF first or compressing it.

**Browser not supported?**
- For the best experience, use Chrome 90+, Firefox 88+, Safari 14+, Brave or Edge 90+. Ensure your browser is updated to the latest version.

**Processing slow?**
- Large or high-resolution files require more processing power. Close unnecessary browser tabs to free up RAM, which significantly improves performance.

**Images not extracting from PDF?**
- Some PDFs embed images in non-standard or highly compressed formats. Try lowering the "minimum size" filter, or note that some vector graphics may not be extractable as raster images.

---

## Feedback & Support
Found a bug or have a feature suggestion? We welcome community contributions! Please report issues or submit pull requests via our [GitHub Repository](https://github.com/AmiNilay/izero-pdf-toolkit).

---

## Version History

### v2.0.0 - Major Expansion & UI Overhaul
- Added 9 new tools: Compress PDF, Organize PDF, Remove Pages, Lock PDF, Compress Image, Convert Image, Rotate Image, Watermark Image, and Photo Resizer.
- Completely redesigned tool UIs with live canvas previews, drag-and-drop reordering, and mobile-responsive grids.
- Implemented smart "Target Size" compression for both PDFs and Images.
- Enhanced security with `pdf-lib-with-encrypt` for robust 128/256-bit PDF locking.
- Fixed icon rendering issues and improved overall app performance.

### v1.0.0 - Initial Release
- 8 core tools (PDF to Images, Images to PDF, Crop, Resize, Merge, Split, Rotate, Extract).
- Offline support via Service Worker.
- PWA ready with Add to Home Screen support.
- Dark mode support.
- Bulk ZIP file downloads.