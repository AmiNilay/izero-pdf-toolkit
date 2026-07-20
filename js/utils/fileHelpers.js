/**
 * FileHelpers - File reading and manipulation utilities
 */

const FileHelpers = (function() {
    'use strict';

    /**
     * Read file as ArrayBuffer
     */
    function readAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Read file as DataURL
     */
    function readAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Read file as Text
     */
    function readAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    /**
     * Load image from file
     */
    function loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Load image from DataURL
     */
    function loadImageFromDataURL(dataURL) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = dataURL;
        });
    }

    /**
     * Create a downloadable file from data
     */
    function createDownload(data, filename, mimeType = 'application/octet-stream') {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        return { url, blob, filename };
    }

    /**
     * Trigger download
     */
    function downloadFile(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    }

    /**
     * Download blob as file
     */
    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        downloadFile(url, filename);
    }

    /**
     * Format file size
     */
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get file extension
     */
    function getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    /**
     * Get filename without extension
     */
    function getFileNameWithoutExtension(filename) {
        const lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(0, lastDot) : filename;
    }

    /**
     * Check if file is valid
     */
    function isValidFile(file, allowedTypes = null) {
        if (!file) return false;
        if (!(file instanceof File) && !(file instanceof Blob)) return false;
        if (allowedTypes) {
            const type = file.type;
            const ext = getFileExtension(file.name || '');
            return allowedTypes.some(t => 
                type === t || 
                ext === t.replace('image/', '').replace('application/', '')
            );
        }
        return true;
    }

    /**
     * Create file from blob
     */
    function createFileFromBlob(blob, filename, mimeType) {
        return new File([blob], filename, { type: mimeType || blob.type });
    }

    /**
     * Merge multiple blobs
     */
    function mergeBlobs(blobs, mimeType = 'application/octet-stream') {
        return new Blob(blobs, { type: mimeType });
    }

    /**
     * DataURL to Blob
     */
    function dataURLToBlob(dataURL) {
        const parts = dataURL.split(',');
        const mimeType = parts[0].match(/:(.*?);/)[1];
        const byteString = atob(parts[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeType });
    }

    /**
     * Canvas to Blob
     */
    function canvasToBlob(canvas, mimeType = 'image/png', quality = 0.92) {
        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), mimeType, quality);
        });
    }

    // Public API
    return {
        readAsArrayBuffer,
        readAsDataURL,
        readAsText,
        loadImage,
        loadImageFromDataURL,
        createDownload,
        downloadFile,
        downloadBlob,
        formatFileSize,
        getFileExtension,
        getFileNameWithoutExtension,
        isValidFile,
        createFileFromBlob,
        mergeBlobs,
        dataURLToBlob,
        canvasToBlob
    };

})();

// Make FileHelpers globally available
window.FileHelpers = FileHelpers;