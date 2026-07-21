# Offline PDF Toolkit - API Documentation

## Overview
This document describes the internal API of the Offline PDF Toolkit. All APIs are client-side and run entirely in the browser.

## Core Modules

### PDFProcessor
PDF manipulation using PDF.js and pdf-lib.

**Methods:**
- `pdfToImages(file, options)` - Convert PDF to images
- `getPDFInfo(file)` - Get PDF metadata
- `extractImagesFromPDF(file, options)` - Extract embedded images
- `getPDFPageCount(file)` - Get total pages
- `encryptPDF(pdf, options)` - Encrypt PDF with password protection
- `decryptPDF(pdf, password)` - Decrypt PDF with password

### ImageProcessor
Image processing operations.

**Methods:**
- `imagesToPDF(images, options)` - Convert images to PDF
- `batchProcessImages(images, operation, options)` - Process multiple images
- `convertImageFormat(file, targetFormat, quality)` - Change image format
- `applyFilters(image, filters)` - Apply filters to image
- `compareImages(image1, image2)` - Compare two images
- `compressImage(file, targetSize)` - Compress image to target size
- `addWatermark(image, text, options)` - Add text watermark
- `rotateImage(image, degrees)` - Rotate image

### CropEngine
Image cropping engine.

**Methods:**
- `initCrop(canvas, image)` - Initialize crop tool
- `executeCrop()` - Execute crop operation
- `resetCrop()` - Reset crop selection
- `getCropCoordinates()` - Get crop coordinates
- `setCropFromCoordinates(x, y, width, height)` - Set crop area

### MergeEngine
PDF merging functionality.

**Methods:**
- `mergePDFs(pdfFiles, options)` - Merge multiple PDFs
- `mergePDFsWithRanges(pdfFilesWithRanges)` - Merge with page ranges
- `reorderPages(pdfFile, newOrder)` - Reorder pages
- `insertBlankPages(pdfFile, positions, pageSize)` - Insert blank pages
- `parsePageRanges(rangeStr, totalPages)` - Parse page ranges

### SplitEngine
PDF splitting functionality.

**Methods:**
- `splitByRanges(pdfFile, ranges)` - Split by page ranges
- `splitByPageCount(pdfFile, pagesPerFile)` - Split every N pages
- `extractPages(pdfFile, pageNumbers)` - Extract specific pages
- `splitAtPages(pdfFile, splitPoints)` - Split at page numbers
- `deletePages(pdfFile, pagesToDelete)` - Delete pages
- `reversePages(pdfFile)` - Reverse page order

### CompressEngine
PDF and image compression.

**Methods:**
- `compressPDF(pdfFile, options)` - Compress PDF
- `estimateCompression(pdfFile)` - Estimate compression ratio
- `optimizeForWeb(pdfFile)` - Optimize for web
- `compressWithPDFLib(pdfFile, quality)` - Compress using pdf-lib
- `compressImage(file, targetSize)` - Compress image to target size
- `calculateTargetQuality(file, targetSize)` - Calculate quality for target size

## Utility Modules

### FileHelpers
File operations.

**Methods:**
- `readAsArrayBuffer(file)` - Read as ArrayBuffer
- `readAsDataURL(file)` - Read as DataURL
- `loadImage(file)` - Load image from file
- `downloadFile(url, filename)` - Trigger download
- `formatFileSize(bytes)` - Format file size
- `getFileNameWithoutExtension(filename)` - Get filename without extension
- `isFileValid(file, validTypes, maxSize)` - Check if file is valid

### CanvasHelpers
Canvas manipulation.

**Methods:**
- `imageToCanvas(image, width, height)` - Convert image to canvas
- `resizeImage(image, maxWidth, maxHeight, maintainAspect)` - Resize image
- `cropImage(image, x, y, width, height)` - Crop image
- `rotateImage(image, degrees)` - Rotate image
- `applyFilter(image, filter, value)` - Apply filter
- `drawGrid(canvas, gridSize)` - Draw grid on canvas

### ZipHelpers
ZIP file operations.

**Methods:**
- `createZip(files)` - Create ZIP from files
- `createZipFromImages(images, baseName)` - Create ZIP from images
- `extractZip(blob)` - Extract ZIP contents
- `addToZip(zipBlob, filename, data)` - Add to ZIP
- `removeFromZip(zipBlob, filename)` - Remove from ZIP
- `getZipEntries(zipBlob)` - Get all entries in ZIP

### Validators
Input validation.

**Methods:**
- `isPDF(file)` - Check if PDF
- `isImage(file)` - Check if image
- `checkFileSize(file, maxMB)` - Check file size
- `validatePageRange(range, totalPages)` - Validate page range
- `isNumber(value, min, max)` - Check if number
- `isPasswordValid(password)` - Check if password is valid
- `isPageRangeValid(range, totalPages)` - Check if page range is valid

## UI Controllers

Each tool has a corresponding UI controller:

- `PdfToJpgController.render()` - PDF to JPG tool
- `ImageToPdfController.render()` - Images to PDF tool
- `CropToolController.render()` - Crop tool
- `ResizeToolController.render()` - Resize tool
- `MergeToolController.render()` - Merge PDF tool
- `SplitToolController.render()` - Split PDF tool
- `RotateToolController.render()` - Rotate PDF tool
- `ExtractToolController.render()` - Extract Images tool
- `CompressToolController.render()` - Compress PDF tool
- `OrganizePdfToolController.render()` - Organize PDF tool
- `RemovePagesToolController.render()` - Remove Pages tool
- `LockToolController.render()` - Lock PDF tool
- `CompressImageToolController.render()` - Compress Image tool
- `ImageConverterToolController.render()` - Convert Image tool
- `RotateImageToolController.render()` - Rotate Image tool
- `WatermarkToolController.render()` - Watermark Image tool
- `PhotoResizerToolController.render()` - Photo Resizer tool

## Global Functions

- `showToast(type, message, duration)` - Show toast notification
- `showProgress(show, percentage, text)` - Show progress bar
- `Router.navigate(tool)` - Navigate to tool
- `AppState.getState(key)` - Get application state
- `AppState.setState(updates)` - Update application state
- `FileHelpers.formatFileSize(bytes)` - Format file size in human-readable format
- `Validators.validatePageRange(range, totalPages)` - Validate page range format
- `showToast(type, message, duration)` - Display toast notification to user

## New Features in v2.0.0

### Enhanced PDF Processing
- **PDF Encryption**: Full AES-128/256 encryption support with password protection
- **Smart Compression**: Binary search algorithm to hit exact target file sizes
- **Page Management**: Visual page reordering and manipulation

### Image Processing
- **Image Watermarking**: Tiled text watermarking across the entire image
- **Image Rotation**: Full rotation and flip capabilities with visual preview
- **Photo Resizing**: Preset dimensions for common use cases (ID, social media)

### UI Improvements
- **Live Previews**: Real-time canvas previews for all image and PDF tools
- **Visual Selection**: Visual page selection and highlighting for PDF tools
- **Responsive Grids**: Improved tool grid layouts for all screen sizes

### Performance
- **Faster Processing**: Optimized canvas operations and memory management
- **Better Caching**: Improved service worker caching strategy
- **Progress Indicators**: More detailed progress feedback for long operations