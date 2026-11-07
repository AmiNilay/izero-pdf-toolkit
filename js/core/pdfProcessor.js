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
            const imageData = await extractImageDataFromPage(page, operatorList, format);
            
            for (const data of imageData) {
                if (data.size >= minSize) {
                    images.push({
                        blob: data.blob,
                        width: data.width,
                        height: data.height,
                        size: data.size,
                        page: i,
                        format: data.format || format || 'image/png'
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
    async function extractImageDataFromPage(page, operatorList, format = 'image/png') {
        const images = [];
        const args = operatorList.argsArray;
        const fnArray = operatorList.fnArray;
        
        for (let i = 0; i < fnArray.length; i++) {
            if (fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
                const name = args[i][0];
                try {
                    let image = null;
                    if (typeof page.objs.get === 'function') {
                        image = await new Promise(resolve => {
                            try {
                                const res = page.objs.get(name, resolve);
                                if (res && typeof res.then === 'function') {
                                    res.then(resolve).catch(() => resolve(null));
                                } else if (res) {
                                    resolve(res);
                                }
                            } catch {
                                resolve(null);
                            }
                        });
                    }

                    if (image && image.data) {
                        const canvas = document.createElement('canvas');
                        const width = image.width || 100;
                        const height = image.height || 100;
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        
                        if (image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray) {
                            const totalPixels = width * height;
                            let rgbaData;
                            
                            if (image.data.length === totalPixels * 4) {
                                rgbaData = new Uint8ClampedArray(image.data.buffer || image.data);
                            } else if (image.data.length === totalPixels * 3) {
                                rgbaData = new Uint8ClampedArray(totalPixels * 4);
                                for (let p = 0, q = 0; p < image.data.length; p += 3, q += 4) {
                                    rgbaData[q] = image.data[p];
                                    rgbaData[q + 1] = image.data[p + 1];
                                    rgbaData[q + 2] = image.data[p + 2];
                                    rgbaData[q + 3] = 255;
                                }
                            } else if (image.data.length === totalPixels) {
                                rgbaData = new Uint8ClampedArray(totalPixels * 4);
                                for (let p = 0, q = 0; p < image.data.length; p++, q += 4) {
                                    const val = image.data[p];
                                    rgbaData[q] = val;
                                    rgbaData[q + 1] = val;
                                    rgbaData[q + 2] = val;
                                    rgbaData[q + 3] = 255;
                                }
                            } else {
                                continue;
                            }

                            const imageData = new ImageData(rgbaData, width, height);
                            ctx.putImageData(imageData, 0, 0);
                            
                            const blob = await FileHelpers.canvasToBlob(canvas, format);
                            images.push({
                                blob,
                                width: width,
                                height: height,
                                size: blob.size,
                                format: blob.type || format
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