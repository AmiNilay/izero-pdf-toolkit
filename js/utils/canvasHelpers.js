/**
 * CanvasHelpers - Canvas manipulation utilities
 */

const CanvasHelpers = (function() {
    'use strict';

    /**
     * Create canvas from image
     */
    function imageToCanvas(image, width = null, height = null) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = width || image.width;
        canvas.height = height || image.height;
        
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        return canvas;
    }

    /**
     * Resize image maintaining aspect ratio
     */
    function resizeImage(image, maxWidth, maxHeight, maintainAspect = true) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let width = image.width;
        let height = image.height;
        
        if (maintainAspect) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        } else {
            width = maxWidth;
            height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Use better quality for downscaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(image, 0, 0, width, height);
        
        return canvas;
    }

    /**
     * Crop image
     */
    function cropImage(image, x, y, width, height) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
        return canvas;
    }

    /**
     * Rotate image
     */
    function rotateImage(image, degrees) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const radians = (degrees * Math.PI) / 180;
        const is90 = degrees % 90 === 0;
        
        if (is90 && (degrees % 180 !== 0)) {
            canvas.width = image.height;
            canvas.height = image.width;
        } else {
            canvas.width = image.width;
            canvas.height = image.height;
        }
        
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(radians);
        ctx.drawImage(image, -image.width / 2, -image.height / 2);
        
        return canvas;
    }

    /**
     * Apply filter to image
     */
    function applyFilter(image, filter, value = null) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = image.width;
        canvas.height = image.height;
        
        ctx.drawImage(image, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        switch(filter) {
            case 'grayscale':
                for (let i = 0; i < data.length; i += 4) {
                    const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
                    data[i] = data[i+1] = data[i+2] = gray;
                }
                break;
                
            case 'sepia':
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i], g = data[i+1], b = data[i+2];
                    data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
                    data[i+1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
                    data[i+2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
                }
                break;
                
            case 'brightness':
                const brightness = value || 20;
                for (let i = 0; i < data.length; i++) {
                    data[i] = Math.min(255, Math.max(0, data[i] + brightness));
                }
                break;
                
            case 'contrast':
                const contrast = (value || 20) / 100;
                const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
                for (let i = 0; i < data.length; i++) {
                    data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
                }
                break;
                
            case 'blur':
                // Simple box blur
                const radius = value || 2;
                const tempData = new Uint8ClampedArray(data);
                const width = canvas.width;
                const height = canvas.height;
                const kernelSize = radius * 2 + 1;
                const kernel = new Array(kernelSize * kernelSize).fill(1 / (kernelSize * kernelSize));
                
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        let r = 0, g = 0, b = 0, a = 0;
                        let weightSum = 0;
                        
                        for (let ky = -radius; ky <= radius; ky++) {
                            for (let kx = -radius; kx <= radius; kx++) {
                                const px = Math.min(width - 1, Math.max(0, x + kx));
                                const py = Math.min(height - 1, Math.max(0, y + ky));
                                const idx = (py * width + px) * 4;
                                const weight = kernel[(ky + radius) * kernelSize + (kx + radius)];
                                r += tempData[idx] * weight;
                                g += tempData[idx + 1] * weight;
                                b += tempData[idx + 2] * weight;
                                a += tempData[idx + 3] * weight;
                                weightSum += weight;
                            }
                        }
                        
                        const idx = (y * width + x) * 4;
                        data[idx] = r / weightSum;
                        data[idx + 1] = g / weightSum;
                        data[idx + 2] = b / weightSum;
                        data[idx + 3] = a / weightSum;
                    }
                }
                break;
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    /**
     * Create thumbnail
     */
    function createThumbnail(image, size = 120) {
        const ratio = Math.min(size / image.width, size / image.height);
        const width = Math.round(image.width * ratio);
        const height = Math.round(image.height * ratio);
        return resizeImage(image, width, height, false);
    }

    /**
     * Convert canvas to data URL
     */
    function canvasToDataURL(canvas, format = 'image/png', quality = 0.92) {
        return canvas.toDataURL(format, quality);
    }

    /**
     * Get image data from canvas
     */
    function getImageData(canvas) {
        const ctx = canvas.getContext('2d');
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    /**
     * Put image data on canvas
     */
    function putImageData(canvas, imageData) {
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    /**
     * Calculate image dimensions for resize
     */
    function calculateResizeDimensions(originalWidth, originalHeight, targetWidth, targetHeight, maintainAspect) {
        if (maintainAspect) {
            const ratio = Math.min(targetWidth / originalWidth, targetHeight / originalHeight);
            return {
                width: Math.round(originalWidth * ratio),
                height: Math.round(originalHeight * ratio)
            };
        }
        return { width: targetWidth, height: targetHeight };
    }

    // Public API
    return {
        imageToCanvas,
        resizeImage,
        cropImage,
        rotateImage,
        applyFilter,
        createThumbnail,
        canvasToDataURL,
        getImageData,
        putImageData,
        calculateResizeDimensions
    };

})();

// Make CanvasHelpers globally available
window.CanvasHelpers = CanvasHelpers;