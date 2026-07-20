/**
 * PDFProcessor - Core PDF operations using PDF.js
 */

const PDFProcessor = (function() {
    'use strict';

    // Configure PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    /**
     * Convert PDF to images
     */
    async function pdfToImages(file, options = {}) {
        const {
            dpi = 150,
            format = 'image/png',
            quality = 0.92,
            pageRange = null
        } = options;

        const arrayBuffer = await FileHelpers.readAsArrayBuffer(file);
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;
        
        // Determine which pages to process
        let pages = [];
        if (pageRange) {
            const result = Validators.validatePageRange(pageRange, totalPages);
            if (!result.valid) {
                throw new Error(result.error);
            }
            pages = result.pages;
        } else {
            pages = Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const scale = dpi / 72;
        const images = [];

        for (const pageNum of pages) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            
            const blob = await FileHelpers.canvasToBlob(canvas, format, quality);
            images.push({
                blob,
                canvas,
                page: pageNum,
                width: canvas.width,
                height: canvas.height
            });
            
            // Update progress
            const progress = (pages.indexOf(pageNum) + 1) / pages.length * 100;
            window.showProgress(true, progress, `Processing page ${pageNum}/${totalPages}`);
        }

        window.showProgress(false);
        return images;
    }

    /**
     * Get PDF info/metadata
     */
    async function getPDFInfo(file) {
        const arrayBuffer = await FileHelpers.readAsArrayBuffer(file);
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const metadata = await pdf.getMetadata();
        const totalPages = pdf.numPages;
        
        return {
            fileName: file.name,
            fileSize: FileHelpers.formatFileSize(file.size),
            totalPages,
            metadata: metadata.info || {},
            metadataRaw: metadata.metadata || null
        };
    }

    /**
     * Extract images from PDF
     */
    async function extractImagesFromPDF(file, options = {}) {
        const {
            minSize = 100,  // Minimum size in bytes
            format = 'image/png'
        } = options;

        const arrayBuffer = await FileHelpers.readAsArrayBuffer(file);
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;
        const images = [];

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            const operatorList = await page.getOperatorList();
            
            // Find image data in operator list
            const imageData = await extractImageDataFromPage(page, operatorList);
            
            for (const data of imageData) {
                if (data.size >= minSize) {
                    images.push({
                        data,
                        page: i,
                        format: data.format || 'unknown'
                    });
                }
            }
            
            const progress = i / totalPages * 100;
            window.showProgress(true, progress, `Scanning page ${i}/${totalPages}`);
        }

        window.showProgress(false);
        return images;
    }

    /**
     * Extract image data from page (helper)
     */
    async function extractImageDataFromPage(page, operatorList) {
        const images = [];
        const args = operatorList.argsArray;
        const fnArray = operatorList.fnArray;
        
        for (let i = 0; i < fnArray.length; i++) {
            if (fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
                const name = args[i][0];
                try {
                    const image = await page.objs.get(name);
                    if (image && image.data) {
                        // Try to get image as blob
                        const canvas = document.createElement('canvas');
                        canvas.width = image.width || 100;
                        canvas.height = image.height || 100;
                        const ctx = canvas.getContext('2d');
                        
                        if (image.data instanceof Uint8Array) {
                            // Create ImageData from the raw data
                            const imageData = new ImageData(
                                new Uint8ClampedArray(image.data),
                                image.width || 100,
                                image.height || 100
                            );
                            ctx.putImageData(imageData, 0, 0);
                            
                            const blob = await FileHelpers.canvasToBlob(canvas);
                            images.push({
                                blob,
                                width: image.width,
                                height: image.height,
                                size: blob.size,
                                format: blob.type
                            });
                        }
                    }
                } catch (e) {
                    console.warn('Could not extract image:', e);
                }
            }
        }
        
        return images;
    }

    /**
     * Get total pages in PDF
     */
    async function getPDFPageCount(file) {
        const arrayBuffer = await FileHelpers.readAsArrayBuffer(file);
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        return pdf.numPages;
    }

    // Public API
    return {
        pdfToImages,
        getPDFInfo,
        extractImagesFromPDF,
        getPDFPageCount
    };

})();

// Make PDFProcessor globally available
window.PDFProcessor = PDFProcessor;