/**
 * CompressEngine - PDF and Image compression
 */

const CompressEngine = (function() {
    'use strict';

    /**
     * Compress PDF with multiple strategies
     */
    async function compressPDF(pdfFile, options = {}) {
        const {
            strategy = 'balanced', // 'lossless', 'balanced', 'maximum'
            imageQuality = 80,
            removeMetadata = false,
            optimizeImages = true
        } = options;

        const { PDFDocument } = window.PDFLib;
        const arrayBuffer = await FileHelpers.readAsArrayBuffer(pdfFile);
        const pdf = await PDFDocument.load(arrayBuffer);
        
        // Get original size
        const originalSize = arrayBuffer.byteLength;
        
        // Apply compression based on strategy
        let compressionOptions = {};
        
        switch(strategy) {
            case 'lossless':
                compressionOptions = {
                    compress: true,
                    useObjectStreams: true,
                    objectsPerTick: 50,
                    jpegQuality: 95
                };
                break;
            case 'balanced':
                compressionOptions = {
                    compress: true,
                    useObjectStreams: true,
                    objectsPerTick: 100,
                    jpegQuality: 80
                };
                break;
            case 'maximum':
                compressionOptions = {
                    compress: true,
                    useObjectStreams: true,
                    objectsPerTick: 200,
                    jpegQuality: 60
                };
                break;
            default:
                compressionOptions = {
                    compress: true,
                    useObjectStreams: true,
                    objectsPerTick: 100,
                    jpegQuality: 80
                };
        }

        // Save with compression
        const pdfBytes = await pdf.save(compressionOptions);
        const compressedSize = pdfBytes.byteLength;
        const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

        return {
            pdfBytes,
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
            quality = 80, // 0-100
            format = 'auto', // 'auto', 'jpeg', 'png', 'webp'
            maxWidth = null,
            maxHeight = null,
            preserveMetadata = false
        } = options;

        // Load image
        const img = await FileHelpers.loadImage(file);
        
        // Calculate dimensions
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

        // Determine format
        let outputFormat = format;
        if (format === 'auto') {
            const ext = FileHelpers.getFileExtension(file.name);
            if (['jpg', 'jpeg'].includes(ext)) {
                outputFormat = 'jpeg';
            } else if (['png'].includes(ext)) {
                outputFormat = 'png';
            } else if (['webp'].includes(ext)) {
                outputFormat = 'webp';
            } else {
                outputFormat = 'jpeg';
            }
        }

        // Create canvas and draw image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        const mimeTypes = {
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'webp': 'image/webp'
        };
        
        const mimeType = mimeTypes[outputFormat] || 'image/jpeg';
        const qualityFactor = quality / 100;
        const blob = await FileHelpers.canvasToBlob(canvas, mimeType, qualityFactor);
        
        // Calculate compression
        const originalSize = file.size;
        const compressedSize = blob.size;
        const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

        // Create new file
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
        const {
            maxWidth = null,
            maxHeight = null,
            format = 'auto',
            minQuality = 10,
            maxQuality = 98,
            tolerance = 0.1 // 10% tolerance
        } = options;

        // Load image
        const img = await FileHelpers.loadImage(file);
        let width = img.width;
        let height = img.height;

        // Calculate dimensions
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

        // Determine format
        let outputFormat = format;
        if (format === 'auto') {
            const ext = FileHelpers.getFileExtension(file.name);
            if (['jpg', 'jpeg'].includes(ext)) {
                outputFormat = 'jpeg';
            } else if (['png'].includes(ext)) {
                outputFormat = 'png';
            } else if (['webp'].includes(ext)) {
                outputFormat = 'webp';
            } else {
                outputFormat = 'jpeg';
            }
        }

        const mimeTypes = {
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'webp': 'image/webp'
        };
        const mimeType = mimeTypes[outputFormat] || 'image/jpeg';
        const targetBytes = targetSizeKB * 1024;
        const toleranceBytes = targetBytes * tolerance;

        // Binary search for optimal quality
        let low = minQuality;
        let high = maxQuality;
        let bestQuality = minQuality;
        let bestBlob = null;
        let bestSize = Infinity;
        let attempts = 0;
        const maxAttempts = 20;

        // First, try to compress with max quality
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Get the size at max quality
        const maxQualityBlob = await FileHelpers.canvasToBlob(canvas, mimeType, maxQuality / 100);
        
        // If even max quality is below target, return it
        if (maxQualityBlob.size < targetBytes) {
            const newFile = new File(
                [maxQualityBlob], 
                `${FileHelpers.getFileNameWithoutExtension(file.name)}_compressed.${outputFormat === 'jpeg' ? 'jpg' : outputFormat}`,
                { type: mimeType }
            );
            return {
                file: newFile,
                blob: maxQualityBlob,
                canvas,
                originalSize: file.size,
                compressedSize: maxQualityBlob.size,
                reduction: ((file.size - maxQualityBlob.size) / file.size * 100),
                quality: maxQuality,
                format: outputFormat,
                width,
                height,
                targetSize: targetSizeKB,
                achieved: true,
                note: 'Maximum quality already meets target size'
            };
        }

        // Binary search
        while (low <= high && attempts < maxAttempts) {
            attempts++;
            const mid = Math.round((low + high) / 2);
            const quality = mid / 100;

            // Clear canvas and redraw
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            
            const blob = await FileHelpers.canvasToBlob(canvas, mimeType, quality);

            // Check if we're within tolerance of target
            const sizeDiff = Math.abs(blob.size - targetBytes);
            
            if (blob.size <= targetBytes + toleranceBytes) {
                // We're close enough to target
                if (blob.size > bestSize && blob.size <= targetBytes + toleranceBytes) {
                    // Prefer larger files that are still within tolerance (better quality)
                    bestBlob = blob;
                    bestQuality = mid;
                    bestSize = blob.size;
                }
                // Try higher quality for better image
                low = mid + 1;
            } else if (blob.size > targetBytes) {
                // Too large, need lower quality
                high = mid - 1;
            } else {
                // Too small, can increase quality
                low = mid + 1;
                if (blob.size > bestSize) {
                    bestBlob = blob;
                    bestQuality = mid;
                    bestSize = blob.size;
                }
            }
        }

        // If we didn't find a good blob, use the best we found or fallback
        if (!bestBlob) {
            // Try one more time with the best quality we found
            const fallbackQuality = Math.round((minQuality + maxQuality) / 2);
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            bestBlob = await FileHelpers.canvasToBlob(canvas, mimeType, fallbackQuality / 100);
            bestQuality = fallbackQuality;
            bestSize = bestBlob.size;
        }

        // Create new file
        const extension = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
        const newFileName = `${FileHelpers.getFileNameWithoutExtension(file.name)}_compressed.${extension}`;
        const newFile = new File([bestBlob], newFileName, { type: mimeType });

        const achieved = bestSize <= targetBytes + toleranceBytes;

        return {
            file: newFile,
            blob: bestBlob,
            canvas,
            originalSize: file.size,
            compressedSize: bestSize,
            reduction: ((file.size - bestSize) / file.size * 100),
            quality: bestQuality,
            format: outputFormat,
            width,
            height,
            targetSize: targetSizeKB,
            achieved: achieved,
            note: achieved ? 'Target size achieved' : `Best effort: ${FileHelpers.formatFileSize(bestSize)}`
        };
    }

    /**
     * Estimate compression savings
     */
    async function estimateCompression(pdfFile) {
        const arrayBuffer = await FileHelpers.readAsArrayBuffer(pdfFile);
        const originalSize = arrayBuffer.byteLength;
        
        try {
            const { PDFDocument } = window.PDFLib;
            const pdf = await PDFDocument.load(arrayBuffer);
            const totalPages = pdf.getPageCount();
            
            // Simple estimation
            const estimatedReduction = 30;
            const estimatedSize = originalSize * (1 - estimatedReduction / 100);
            
            return {
                originalSize,
                originalSizeFormatted: FileHelpers.formatFileSize(originalSize),
                estimatedSize,
                estimatedSizeFormatted: FileHelpers.formatFileSize(estimatedSize),
                estimatedReduction,
                totalPages,
                hasImages: true
            };
        } catch {
            return {
                originalSize,
                originalSizeFormatted: FileHelpers.formatFileSize(originalSize),
                estimatedSize: originalSize * 0.85,
                estimatedSizeFormatted: FileHelpers.formatFileSize(originalSize * 0.85),
                estimatedReduction: 15,
                totalPages: 0,
                hasImages: false
            };
        }
    }

    /**
     * Batch compress multiple images
     */
    async function batchCompressImages(files, options = {}) {
        const results = [];
        const total = files.length;
        
        for (let i = 0; i < total; i++) {
            const result = await compressImage(files[i], options);
            results.push(result);
            
            const progress = (i + 1) / total * 100;
            window.showProgress(true, progress, `Compressing image ${i + 1}/${total}`);
        }
        
        window.showProgress(false);
        return results;
    }

    // Public API
    return {
        compressPDF,
        compressImage,
        compressToTargetSize,
        batchCompressImages,
        estimateCompression
    };

})();

// Make CompressEngine globally available
window.CompressEngine = CompressEngine;