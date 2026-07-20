# Offline PDF Toolkit - API Documentation

## Overview
This document describes the internal API of the Offline PDF Toolkit. All APIs are client-side and run entirely in the browser.

## Core Modules

### PDFProcessor
PDF manipulation using PDF.js.

**Methods:**
- `pdfToImages(file, options)` - Convert PDF to images
- `getPDFInfo(file)` - Get PDF metadata
- `extractImagesFromPDF(file, options)` - Extract embedded images
- `getPDFPageCount(file)` - Get total pages

### ImageProcessor
Image processing operations.

**Methods:**
- `imagesToPDF(images, options)` - Convert images to PDF
- `batchProcessImages(images, operation, options)` - Process multiple images
- `convertImageFormat(file, targetFormat, quality)` - Change image format
- `applyFilters(image, filters)` - Apply filters to image
- `compareImages(image1, image2)` - Compare two images

### CropEngine
Image cropping engine.

**Methods:**
- `initCrop(canvas, image)` - Initialize crop tool
- `executeCrop()` - Execute crop operation
- `resetCrop()` - Reset crop selection
- `getCropCoordinates()` - Get crop coordinates

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
PDF compression.

**Methods:**
- `compressPDF(pdfFile, options)` - Compress PDF
- `estimateCompression(pdfFile)` - Estimate compression ratio
- `optimizeForWeb(pdfFile)` - Optimize for web
- `compressWithPDFLib(pdfFile, quality)` - Compress using pdf-lib

## Utility Modules

### FileHelpers
File operations.

**Methods:**
- `readAsArrayBuffer(file)` - Read as ArrayBuffer
- `readAsDataURL(file)` - Read as DataURL
- `loadImage(file)` - Load image from file
- `downloadFile(url, filename)` - Trigger download
- `formatFileSize(bytes)` - Format file size

### CanvasHelpers
Canvas manipulation.

**Methods:**
- `imageToCanvas(image, width, height)` - Convert image to canvas
- `resizeImage(image, maxWidth, maxHeight, maintainAspect)` - Resize image
- `cropImage(image, x, y, width, height)` - Crop image
- `rotateImage(image, degrees)` - Rotate image
- `applyFilter(image, filter, value)` - Apply filter

### ZipHelpers
ZIP file operations.

**Methods:**
- `createZip(files)` - Create ZIP from files
- `createZipFromImages(images, baseName)` - Create ZIP from images
- `extractZip(blob)` - Extract ZIP contents
- `addToZip(zipBlob, filename, data)` - Add to ZIP
- `removeFromZip(zipBlob, filename)` - Remove from ZIP

### Validators
Input validation.

**Methods:**
- `isPDF(file)` - Check if PDF
- `isImage(file)` - Check if image
- `checkFileSize(file, maxMB)` - Check file size
- `validatePageRange(range, totalPages)` - Validate page range
- `isNumber(value, min, max)` - Check if number

## UI Controllers

Each tool has a corresponding UI controller:

- `PdfToImageController.render()` - PDF to Images tool
- `ImageToPdfController.render()` - Images to PDF tool
- `CropToolController.render()` - Crop tool
- `ResizeToolController.render()` - Resize tool
- `MergeToolController.render()` - Merge PDF tool
- `SplitToolController.render()` - Split PDF tool
- `RotateToolController.render()` - Rotate PDF tool
- `ExtractToolController.render()` - Extract Images tool

## Global Functions

- `showToast(type, message, duration)` - Show toast notification
- `showProgress(show, percentage, text)` - Show progress bar
- `Router.navigate(tool)` - Navigate to tool
- `AppState.getState(key)` - Get application state
- `AppState.setState(updates)` - Update application state