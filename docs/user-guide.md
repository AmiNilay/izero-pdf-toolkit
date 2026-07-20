# Offline PDF Toolkit - User Guide

## Welcome
The Offline PDF Toolkit is a 100% client-side application that runs entirely in your browser. No data is ever uploaded to any server - everything stays on your device.

## Getting Started

### Installation
1. Visit the website
2. The service worker will cache all assets for offline use
3. Add to home screen for PWA experience

### Navigation
Use the navigation bar at the top to switch between tools. On mobile, tap the ☰ icon to open the menu.

## Tools Guide

### 1. PDF → Images
Extract every page of a PDF as an image.

**How to use:**
1. Upload your PDF
2. Select DPI (72 for web, 150+ for print)
3. Choose image format (PNG, JPEG, WebP)
4. Click "Convert to Images"
5. Download individual images or as ZIP

**Tips:**
- Higher DPI = better quality but larger files
- PNG is best for text and graphics
- JPEG is smaller for photographs

### 2. Images → PDF
Convert multiple images into a single PDF.

**How to use:**
1. Upload your images (select multiple)
2. Choose page size (A4, Letter, etc.)
3. Select orientation
4. Choose how images fit on the page
5. Click "Create PDF"
6. Download the resulting PDF

**Tips:**
- Upload images in the order you want them in the PDF
- You can remove images by clicking the ✕ button
- "Contain" fits the entire image on the page

### 3. Crop Image
Select and crop a specific area of an image.

**How to use:**
1. Upload your image
2. Click and drag on the image to select crop area
3. Adjust using the coordinate inputs
4. Click "Apply Crop"
5. Download the cropped image

**Tips:**
- Use "Lock Aspect" to maintain proportions
- Show grid helps with precise alignment

### 4. Resize Image
Change the dimensions of an image.

**How to use:**
1. Upload your image
2. Set new width and height
3. Use the percentage slider for quick resizing
4. Click "Apply Resize"
5. Download the resized image

**Tips:**
- Enable "Maintain Aspect Ratio" to prevent distortion
- Preview shows the result before applying

### 5. Merge PDF
Combine multiple PDFs into one document.

**How to use:**
1. Upload your PDFs (select multiple)
2. Choose page size (or auto)
3. Optionally add page numbers
4. Click "Merge PDFs"
5. Download the merged PDF

**Tips:**
- The order of upload determines the order in the merged PDF
- You can reorder by removing and re-adding files

### 6. Split PDF
Split a PDF into multiple documents.

**Methods:**
- **By Page Ranges:** e.g., "1-3,5,7-9"
- **Every N Pages:** Split every X pages
- **Extract Specific Pages:** Extract selected pages
- **Split at Pages:** Split before specified page numbers

**How to use:**
1. Upload your PDF
2. Choose split method
3. Enter page ranges or numbers
4. Click "Split PDF"
5. Download individual parts or as ZIP

### 7. Rotate PDF
Rotate pages in a PDF.

**How to use:**
1. Upload your PDF
2. Choose rotation angle
3. Choose "All Pages" or "Specific Pages"
4. For specific pages, enter page numbers
5. Click "Rotate PDF"
6. Download the rotated PDF

**Tips:**
- Use the page list to rotate individual pages
- Click ↻ for clockwise rotation, ↺ for counter-clockwise

### 8. Extract Images
Extract all embedded images from a PDF.

**How to use:**
1. Upload your PDF
2. Set minimum image size to filter small images
3. Choose output format
4. Click "Extract Images"
5. Download individual images or as ZIP

**Tips:**
- Increase minimum size to skip small icons and logos
- PNG preserves quality, JPEG reduces file size

## Keyboard Shortcuts

- `Ctrl+Z` - Undo (where supported)
- `Esc` - Close dialogs / Cancel
- `Enter` - Confirm/Submit

## Privacy & Security

- All processing happens locally
- No data is ever uploaded to any server
- No cookies or tracking
- Your files are never stored

## Troubleshooting

**File too large?**
- Maximum file size is 100MB
- Reduce file size or split into smaller files

**Browser not supported?**
- Use Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Update your browser to the latest version

**Processing slow?**
- Large files take more time
- Close other tabs for better performance
- Your device's RAM affects processing speed

**Images not extracting?**
- Some PDFs have images in non-standard formats
- Try increasing the minimum size
- Some images may be encoded differently

## Feedback

Found a bug or have a suggestion? Please report it through the appropriate channels.

## Version History

### v1.0.0 - Initial Release
- All 8 core tools
- Offline support via Service Worker
- PWA ready
- Dark mode support
- ZIP file downloads