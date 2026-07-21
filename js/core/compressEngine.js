/**
 * CompressEngine - PDF and Image compression
 */

const CompressEngine = (function() {
    'use strict';

    /**
     * Compress PDF to a target size by rasterizing pages and adjusting quality/scale
     */
    async function compressPDFToTargetSize(pdfFile, targetSizeKB, options = {}) {
        const { originalSize, originalArrayBuffer } = options;
        const targetBytes = targetSizeKB * 1024;
        const tolerance = 0.05; // 5% tolerance
        const toleranceBytes = targetBytes * tolerance;

        // If already under target, return original
        if (originalSize <= targetBytes) {
            return {
                pdfBlob: new Blob([originalArrayBuffer], { type: 'application/pdf' }),
                originalSize,
                compressedSize: originalSize,
                reduction: 0,
                achieved: true,
                note: 'Original file is already under target size.'
            };
        }

        if (typeof pdfjsLib === 'undefined') {
            throw new Error('pdf.js is required for target size compression');
        }

        const loadingTask = pdfjsLib.getDocument({ data: originalArrayBuffer });
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;

        // Helper to generate PDF at specific scale and quality
        async function generatePDFAtSettings(scale, quality) {
            const jsPDFConstructor = window.jspdf?.jsPDF || window.jsPDF;
            if (!jsPDFConstructor) {
                throw new Error('jsPDF is required for target size compression');
            }

            const firstPage = await pdf.getPage(1);
            const viewport1 = firstPage.getViewport({ scale: 1 });
            
            const doc = new jsPDFConstructor({
                orientation: viewport1.width > viewport1.height ? 'l' : 'p',
                unit: 'pt',
                format: [viewport1.width, viewport1.height]
            });

            for (let i = 1; i <= numPages; i++) {
                if (i > 1) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 1 });
                    doc.addPage([viewport.width, viewport.height], viewport.width > viewport.height ? 'l' : 'p');
                }
                
                const page = await pdf.getPage(i);
                const renderViewport = page.getViewport({ scale: scale });
                
                const canvas = document.createElement('canvas');
                canvas.width = renderViewport.width;
                canvas.height = renderViewport.height;
                const ctx = canvas.getContext('2d');
                
                // White background to prevent transparent PDFs turning black
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                await page.render({
                    canvasContext: ctx,
                    viewport: renderViewport
                }).promise;

                const imgData = canvas.toDataURL('image/jpeg', quality / 100);
                const pageViewport = page.getViewport({ scale: 1 });
                doc.addImage(imgData, 'JPEG', 0, 0, pageViewport.width, pageViewport.height);
            }

            return doc.output('blob');
        }

        let bestBlob = null;
        let bestSize = Infinity;
        let bestSettings = { scale: 1, quality: 80 };
        
        const scalesToTry = [1.0, 0.75, 0.5, 0.4];
        const minQuality = 30;
        const maxQuality = 95;

        for (const scale of scalesToTry) {
            let low = minQuality;
            let high = maxQuality;
            let bestQualityForScale = minQuality;
            let bestBlobForScale = null;
            let bestSizeForScale = Infinity;
            let attempts = 0;
            const maxAttempts = 12;

            while (low <= high && attempts < maxAttempts) {
                attempts++;
                const mid = Math.round((low + high) / 2);
                
                const blob = await generatePDFAtSettings(scale, mid);
                const size = blob.size;

                if (size <= targetBytes + toleranceBytes) {
                    if (size > bestSizeForScale && size <= targetBytes + toleranceBytes) {
                        bestBlobForScale = blob;
                        bestQualityForScale = mid;
                        bestSizeForScale = size;
                    }
                    low = mid + 1; // Try higher quality
                } else {
                    high = mid - 1; // Too big, lower quality
                }
            }

            if (bestBlobForScale && bestSizeForScale <= targetBytes + toleranceBytes) {
                if (bestSizeForScale > bestSize) {
                    bestBlob = bestBlobForScale;
                    bestSettings = { scale, quality: bestQualityForScale };
                    bestSize = bestSizeForScale;
                }
            } else if (!bestBlob && bestBlobForScale) {
                bestBlob = bestBlobForScale;
                bestSettings = { scale, quality: bestQualityForScale };
                bestSize = bestSizeForScale;
            }
        }

        if (!bestBlob) {
             bestBlob = await generatePDFAtSettings(0.4, minQuality);
             bestSettings = { scale: 0.4, quality: minQuality };
             bestSize = bestBlob.size;
        }

        const compressedSize = bestSize;
        const reduction = ((originalSize - compressedSize) / originalSize * 100);
        const achieved = compressedSize <= targetBytes + toleranceBytes;

        return {
            pdfBlob: bestBlob,
            originalSize,
            compressedSize,
            reduction: parseFloat(reduction.toFixed(1)),
            achieved,
            settings: bestSettings,
            note: achieved ? 'Target size achieved' : `Best effort: ${FileHelpers.formatFileSize(compressedSize)}`
        };
    }

    /**
     * Compress PDF with multiple strategies OR to a target size
     */
    async function compressPDF(pdfFile, options = {}) {
        const {
            strategy = 'balanced',
            imageQuality = 80,
            removeMetadata = false,
            optimizeImages = true,
            targetSizeKB = null
        } = options;

        const originalArrayBuffer = await FileHelpers.readAsArrayBuffer(pdfFile);
        const originalSize = originalArrayBuffer.byteLength;

        // If target size is specified, use rasterization approach
        if (targetSizeKB) {
            return await compressPDFToTargetSize(pdfFile, targetSizeKB, {
                originalSize,
                originalArrayBuffer
            });
        }

        const { PDFDocument } = window.PDFLib;
        const pdf = await PDFDocument.load(originalArrayBuffer);
        
        let compressionOptions = {};
        switch(strategy) {
            case 'lossless':
                compressionOptions = { compress: true, useObjectStreams: true, objectsPerTick: 50, jpegQuality: 95 };
                break;
            case 'balanced':
                compressionOptions = { compress: true, useObjectStreams: true, objectsPerTick: 100, jpegQuality: 80 };
                break;
            case 'maximum':
                compressionOptions = { compress: true, useObjectStreams: true, objectsPerTick: 200, jpegQuality: 60 };
                break;
            default:
                compressionOptions = { compress: true, useObjectStreams: true, objectsPerTick: 100, jpegQuality: 80 };
        }

        const pdfBytes = await pdf.save(compressionOptions);
        const compressedSize = pdfBytes.byteLength;
        const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

        return {
            pdfBlob: new Blob([pdfBytes], { type: 'application/pdf' }),
            originalSize,
            compressedSize,
            reduction: parseFloat(reduction),
            strategy
        };
    }

    /**
     * Compress image using Canvas
     */
    async function compressImage(file, options = {}) {
        const {
            quality = 80,
            format = 'auto',
            maxWidth = null,
            maxHeight = null,
            preserveMetadata = false
        } = options;

        const img = await FileHelpers.loadImage(file);
        let width = img.width;
        let height = img.height;
        
        if (maxWidth && width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = Math.round(height * ratio);
        }
        if (maxHeight && height > maxHeight) {
            const ratio = maxHeight / height;
            height = maxHeight;
            width = Math.round(width * ratio);
        }

        let outputFormat = format;
        if (format === 'auto') {
            const ext = FileHelpers.getFileExtension(file.name);
            if (['jpg', 'jpeg'].includes(ext)) outputFormat = 'jpeg';
            else if (['png'].includes(ext)) outputFormat = 'png';
            else if (['webp'].includes(ext)) outputFormat = 'webp';
            else outputFormat = 'jpeg';
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const mimeTypes = { 'jpeg': 'image/jpeg', 'png': 'image/png', 'webp': 'image/webp' };
        const mimeType = mimeTypes[outputFormat] || 'image/jpeg';
        const qualityFactor = quality / 100;
        const blob = await FileHelpers.canvasToBlob(canvas, mimeType, qualityFactor);
        
        const originalSize = file.size;
        const compressedSize = blob.size;
        const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

        const extension = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
        const newFileName = `${FileHelpers.getFileNameWithoutExtension(file.name)}_compressed.${extension}`;
        const newFile = new File([blob], newFileName, { type: mimeType });

        return {
            file: newFile,
            blob,
            canvas,
            originalSize,
            compressedSize,
            reduction: parseFloat(reduction),
            format: outputFormat,
            width,
            height
        };
    }

    /**
     * Compress image to target file size using binary search
     */
    async function compressToTargetSize(file, targetSizeKB, options = {}) {
        // (Existing image target size logic remains unchanged for brevity, 
        // but ensure the full file is pasted from your original if you modified it)
        // For this response, I'm providing the critical PDF updates. 
        // Keep your existing compressToTargetSize, batchCompressImages, and estimateCompression functions below this.
        const {
            maxWidth = null,
            maxHeight = null,
            format = 'auto',
            minQuality = 10,
            maxQuality = 98,
            tolerance = 0.1
        } = options;

        const img = await FileHelpers.loadImage(file);
        let width = img.width;
        let height = img.height;

        if (maxWidth && width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = Math.round(height * ratio);
        }
        if (maxHeight && height > maxHeight) {
            const ratio = maxHeight / height;
            height = maxHeight;
            width = Math.round(width * ratio);
        }

        let outputFormat = format;
        if (format === 'auto') {
            const ext = FileHelpers.getFileExtension(file.name);
            if (['jpg', 'jpeg'].includes(ext)) outputFormat = 'jpeg';
            else if (['png'].includes(ext)) outputFormat = 'png';
            else if (['webp'].includes(ext)) outputFormat = 'webp';
            else outputFormat = 'jpeg';
        }

        const mimeTypes = { 'jpeg': 'image/jpeg', 'png': 'image/png', 'webp': 'image/webp' };
        const mimeType = mimeTypes[outputFormat] || 'image/jpeg';
        const targetBytes = targetSizeKB * 1024;
        const toleranceBytes = targetBytes * tolerance;

        let low = minQuality;
        let high = maxQuality;
        let bestQuality = minQuality;
        let bestBlob = null;
        let bestSize = Infinity;
        let attempts = 0;
        const maxAttempts = 20;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const maxQualityBlob = await FileHelpers.canvasToBlob(canvas, mimeType, maxQuality / 100);
        if (maxQualityBlob.size < targetBytes) {
            const newFile = new File([maxQualityBlob], `${FileHelpers.getFileNameWithoutExtension(file.name)}_compressed.${outputFormat === 'jpeg' ? 'jpg' : outputFormat}`, { type: mimeType });
            return {
                file: newFile, blob: maxQualityBlob, canvas, originalSize: file.size, compressedSize: maxQualityBlob.size,
                reduction: ((file.size - maxQualityBlob.size) / file.size * 100), quality: maxQuality, format: outputFormat,
                width, height, targetSize: targetSizeKB, achieved: true, note: 'Maximum quality already meets target size'
            };
        }

        while (low <= high && attempts < maxAttempts) {
            attempts++;
            const mid = Math.round((low + high) / 2);
            const quality = mid / 100;
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const blob = await FileHelpers.canvasToBlob(canvas, mimeType, quality);
            const sizeDiff = Math.abs(blob.size - targetBytes);
            
            if (blob.size <= targetBytes + toleranceBytes) {
                if (blob.size > bestSize && blob.size <= targetBytes + toleranceBytes) {
                    bestBlob = blob; bestQuality = mid; bestSize = blob.size;
                }
                low = mid + 1;
            } else if (blob.size > targetBytes) {
                high = mid - 1;
            } else {
                low = mid + 1;
                if (blob.size > bestSize) { bestBlob = blob; bestQuality = mid; bestSize = blob.size; }
            }
        }

        if (!bestBlob) {
            const fallbackQuality = Math.round((minQuality + maxQuality) / 2);
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            bestBlob = await FileHelpers.canvasToBlob(canvas, mimeType, fallbackQuality / 100);
            bestQuality = fallbackQuality;
            bestSize = bestBlob.size;
        }

        const extension = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
        const newFileName = `${FileHelpers.getFileNameWithoutExtension(file.name)}_compressed.${extension}`;
        const newFile = new File([bestBlob], newFileName, { type: mimeType });
        const achieved = bestSize <= targetBytes + toleranceBytes;

        return {
            file: newFile, blob: bestBlob, canvas, originalSize: file.size, compressedSize: bestSize,
            reduction: ((file.size - bestSize) / file.size * 100), quality: bestQuality, format: outputFormat,
            width, height, targetSize: targetSizeKB, achieved, note: achieved ? 'Target size achieved' : `Best effort: ${FileHelpers.formatFileSize(bestSize)}`
        };
    }

    async function estimateCompression(pdfFile) {
        const arrayBuffer = await FileHelpers.readAsArrayBuffer(pdfFile);
        const originalSize = arrayBuffer.byteLength;
        try {
            const { PDFDocument } = window.PDFLib;
            const pdf = await PDFDocument.load(arrayBuffer);
            const totalPages = pdf.getPageCount();
            return {
                originalSize, originalSizeFormatted: FileHelpers.formatFileSize(originalSize),
                estimatedSize: originalSize * 0.7, estimatedSizeFormatted: FileHelpers.formatFileSize(originalSize * 0.7),
                estimatedReduction: 30, totalPages, hasImages: true
            };
        } catch {
            return {
                originalSize, originalSizeFormatted: FileHelpers.formatFileSize(originalSize),
                estimatedSize: originalSize * 0.85, estimatedSizeFormatted: FileHelpers.formatFileSize(originalSize * 0.85),
                estimatedReduction: 15, totalPages: 0, hasImages: false
            };
        }
    }

    async function batchCompressImages(files, options = {}) {
        const results = [];
        const total = files.length;
        for (let i = 0; i < total; i++) {
            const result = await compressImage(files[i], options);
            results.push(result);
            const progress = (i + 1) / total * 100;
            if (typeof window.showProgress === 'function') {
                window.showProgress(true, progress, `Compressing image ${i + 1}/${total}`);
            }
        }
        if (typeof window.showProgress === 'function') window.showProgress(false);
        return results;
    }

    return {
        compressPDF,
        compressImage,
        compressToTargetSize,
        batchCompressImages,
        estimateCompression
    };
})();

window.CompressEngine = CompressEngine;