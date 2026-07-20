/**
 * ImageProcessor - Core image processing operations
 */

const ImageProcessor = (function() {
    'use strict';

    /**
     * Convert images to PDF
     */
    async function imagesToPDF(images, options = {}) {
        const {
            pageSize = 'a4',
            orientation = 'portrait',
            margin = 10,
            quality = 0.92,
            fit = 'contain' // 'contain', 'cover', 'fill'
        } = options;

        const { jsPDF } = window.jspdf;
        
        // Page size mapping
        const pageSizes = {
            'a4': { width: 210, height: 297 },
            'letter': { width: 215.9, height: 279.4 },
            'legal': { width: 215.9, height: 355.6 },
            'a3': { width: 297, height: 420 },
            'a5': { width: 148, height: 210 }
        };

        let pageSizeObj = pageSizes[pageSize] || pageSizes['a4'];
        if (orientation === 'landscape') {
            pageSizeObj = { width: pageSizeObj.height, height: pageSizeObj.width };
        }

        const pdf = new jsPDF({
            orientation: orientation,
            unit: 'mm',
            format: [pageSizeObj.width, pageSizeObj.height],
            compress: true
        });

        const pageWidth = pageSizeObj.width - (margin * 2);
        const pageHeight = pageSizeObj.height - (margin * 2);

        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            
            // Add new page for each image (except first)
            if (i > 0) {
                pdf.addPage([pageSizeObj.width, pageSizeObj.height]);
            }

            // Load image
            let imgData;
            let imgWidth, imgHeight;
            
            if (image instanceof HTMLCanvasElement) {
                imgData = image.toDataURL('image/png');
                imgWidth = image.width;
                imgHeight = image.height;
            } else if (image instanceof Blob || image instanceof File) {
                const dataURL = await FileHelpers.readAsDataURL(image);
                const img = await FileHelpers.loadImageFromDataURL(dataURL);
                imgWidth = img.width;
                imgHeight = img.height;
                imgData = dataURL;
            } else if (typeof image === 'string' && image.startsWith('data:image')) {
                const img = await FileHelpers.loadImageFromDataURL(image);
                imgWidth = img.width;
                imgHeight = img.height;
                imgData = image;
            } else {
                throw new Error(`Unsupported image format at index ${i}`);
            }

            // Calculate dimensions to fit page
            let finalWidth, finalHeight;
            
            if (fit === 'contain') {
                const scale = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
                finalWidth = imgWidth * scale;
                finalHeight = imgHeight * scale;
            } else if (fit === 'cover') {
                const scale = Math.max(pageWidth / imgWidth, pageHeight / imgHeight);
                finalWidth = imgWidth * scale;
                finalHeight = imgHeight * scale;
            } else { // fill
                finalWidth = pageWidth;
                finalHeight = pageHeight;
            }

            // Center the image
            const x = margin + (pageWidth - finalWidth) / 2;
            const y = margin + (pageHeight - finalHeight) / 2;

            pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
            
            // Update progress
            const progress = (i + 1) / images.length * 100;
            window.showProgress(true, progress, `Processing image ${i + 1}/${images.length}`);
        }

        window.showProgress(false);
        return pdf;
    }

    /**
     * Process multiple images with same operation
     */
    async function batchProcessImages(images, operation, options = {}) {
        const results = [];
        const total = images.length;
        
        for (let i = 0; i < total; i++) {
            const result = await operation(images[i], options);
            results.push(result);
            
            const progress = (i + 1) / total * 100;
            window.showProgress(true, progress, `Processing image ${i + 1}/${total}`);
        }
        
        window.showProgress(false);
        return results;
    }

    /**
     * Convert image format
     */
    async function convertImageFormat(file, targetFormat = 'png', quality = 0.92) {
        const img = await FileHelpers.loadImage(file);
        const canvas = CanvasHelpers.imageToCanvas(img);
        
        const mimeTypes = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'webp': 'image/webp',
            'bmp': 'image/bmp'
        };
        
        const mimeType = mimeTypes[targetFormat.toLowerCase()] || 'image/png';
        const blob = await FileHelpers.canvasToBlob(canvas, mimeType, quality);
        
        const filename = `${FileHelpers.getFileNameWithoutExtension(file.name)}.${targetFormat}`;
        return new File([blob], filename, { type: mimeType });
    }

    /**
     * Apply multiple filters
     */
    async function applyFilters(image, filters) {
        let img = image;
        
        if (img instanceof File || img instanceof Blob) {
            img = await FileHelpers.loadImage(img);
        }
        
        let canvas = CanvasHelpers.imageToCanvas(img);
        
        for (const filter of filters) {
            canvas = CanvasHelpers.applyFilter(canvas, filter.name, filter.value);
        }
        
        return canvas;
    }

    /**
     * Compare two images
     */
    function compareImages(image1, image2) {
        // Simple pixel comparison
        const canvas1 = image1 instanceof HTMLCanvasElement ? image1 : CanvasHelpers.imageToCanvas(image1);
        const canvas2 = image2 instanceof HTMLCanvasElement ? image2 : CanvasHelpers.imageToCanvas(image2);
        
        if (canvas1.width !== canvas2.width || canvas1.height !== canvas2.height) {
            return { match: false, reason: 'Different dimensions' };
        }
        
        const ctx1 = canvas1.getContext('2d');
        const ctx2 = canvas2.getContext('2d');
        const data1 = ctx1.getImageData(0, 0, canvas1.width, canvas1.height).data;
        const data2 = ctx2.getImageData(0, 0, canvas2.width, canvas2.height).data;
        
        let differences = 0;
        const total = data1.length;
        
        for (let i = 0; i < total; i++) {
            if (data1[i] !== data2[i]) {
                differences++;
            }
        }
        
        const similarity = 1 - (differences / total);
        return {
            match: similarity > 0.99,
            similarity: similarity,
            differences: differences,
            total: total
        };
    }

    // Public API
    return {
        imagesToPDF,
        batchProcessImages,
        convertImageFormat,
        applyFilters,
        compareImages
    };

})();

// Make ImageProcessor globally available
window.ImageProcessor = ImageProcessor;