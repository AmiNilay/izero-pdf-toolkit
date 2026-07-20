/**
 * Image Converter - Convert between image formats
 */

const ImageConverter = (function() {
    'use strict';

    // Supported input formats
    var SUPPORTED_FORMATS = {
        'image/jpeg': { extensions: ['jpg', 'jpeg'], label: 'JPEG' },
        'image/png': { extensions: ['png'], label: 'PNG' },
        'image/webp': { extensions: ['webp'], label: 'WebP' },
        'image/gif': { extensions: ['gif'], label: 'GIF' },
        'image/bmp': { extensions: ['bmp'], label: 'BMP' },
        'image/svg+xml': { extensions: ['svg'], label: 'SVG' },
        'image/tiff': { extensions: ['tiff', 'tif'], label: 'TIFF' },
        'image/heic': { extensions: ['heic'], label: 'HEIC' },
        'image/avif': { extensions: ['avif'], label: 'AVIF' },
        'image/ico': { extensions: ['ico'], label: 'ICO' }
    };

    // Output formats
    var OUTPUT_FORMATS = {
        'jpeg': { mime: 'image/jpeg', extensions: ['jpg', 'jpeg'], label: 'JPEG' },
        'png': { mime: 'image/png', extensions: ['png'], label: 'PNG' },
        'webp': { mime: 'image/webp', extensions: ['webp'], label: 'WebP' },
        'jpg': { mime: 'image/jpeg', extensions: ['jpg', 'jpeg'], label: 'JPEG' },
        'bmp': { mime: 'image/bmp', extensions: ['bmp'], label: 'BMP' },
        'ico': { mime: 'image/x-icon', extensions: ['ico'], label: 'ICO' }
    };

    function isFormatSupported(format) {
        return SUPPORTED_FORMATS[format] !== undefined;
    }

    function isOutputFormat(format) {
        return OUTPUT_FORMATS[format] !== undefined;
    }

    async function convertImage(file, targetFormat, options) {
        options = options || {};
        var quality = options.quality || 0.92;
        var maxWidth = options.maxWidth || null;
        var maxHeight = options.maxHeight || null;

        var outputFormat = OUTPUT_FORMATS[targetFormat.toLowerCase()];
        if (!outputFormat) {
            throw new Error('Unsupported target format: ' + targetFormat);
        }

        var currentExt = FileHelpers.getFileExtension(file.name);
        var targetExt = targetFormat.toLowerCase();
        if (currentExt === targetExt) {
            return {
                sameFormat: true,
                message: 'File is already in ' + targetExt.toUpperCase() + ' format'
            };
        }

        var img = await FileHelpers.loadImage(file);
        
        var width = img.width;
        var height = img.height;
        
        if (maxWidth && width > maxWidth) {
            var ratio = maxWidth / width;
            width = maxWidth;
            height = Math.round(height * ratio);
        }
        
        if (maxHeight && height > maxHeight) {
            var ratio = maxHeight / height;
            height = maxHeight;
            width = Math.round(width * ratio);
        }

        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        var mimeType = outputFormat.mime;
        var blob = await FileHelpers.canvasToBlob(canvas, mimeType, quality);
        
        var extension = outputFormat.extensions[0];
        var newFileName = FileHelpers.getFileNameWithoutExtension(file.name) + '.' + extension;
        var newFile = new File([blob], newFileName, { type: mimeType });

        return {
            file: newFile,
            blob: blob,
            canvas: canvas,
            originalSize: file.size,
            newSize: blob.size,
            reduction: ((file.size - blob.size) / file.size * 100),
            format: targetFormat,
            width: width,
            height: height,
            sameFormat: false
        };
    }

    async function batchConvert(files, targetFormat, options) {
        options = options || {};
        var results = [];
        var total = files.length;
        
        for (var i = 0; i < total; i++) {
            var result = await convertImage(files[i], targetFormat, options);
            results.push(result);
            
            var progress = (i + 1) / total * 100;
            window.showProgress(true, progress, 'Converting image ' + (i + 1) + '/' + total);
        }
        
        window.showProgress(false);
        return results;
    }

    function getSupportedInputFormats() {
        return SUPPORTED_FORMATS;
    }

    function getOutputFormats() {
        return OUTPUT_FORMATS;
    }

    return {
        convertImage: convertImage,
        batchConvert: batchConvert,
        isFormatSupported: isFormatSupported,
        isOutputFormat: isOutputFormat,
        getSupportedInputFormats: getSupportedInputFormats,
        getOutputFormats: getOutputFormats,
        SUPPORTED_FORMATS: SUPPORTED_FORMATS,
        OUTPUT_FORMATS: OUTPUT_FORMATS
    };

})();

window.ImageConverter = ImageConverter;