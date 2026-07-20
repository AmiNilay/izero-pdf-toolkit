/**
 * Validators - Input validation utilities
 */

const Validators = (function() {
    'use strict';

    /**
     * Check if value is a valid number
     */
    function isNumber(value, min = null, max = null) {
        const num = Number(value);
        if (isNaN(num)) return false;
        if (min !== null && num < min) return false;
        if (max !== null && num > max) return false;
        return true;
    }

    /**
     * Check if file is a PDF
     */
    function isPDF(file) {
        if (!file) return false;
        const type = file.type;
        const ext = file.name.split('.').pop().toLowerCase();
        return type === 'application/pdf' || ext === 'pdf';
    }

    /**
     * Check if file is an image
     */
    function isImage(file) {
        if (!file) return false;
        const types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];
        const exts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
        const type = file.type;
        const ext = file.name.split('.').pop().toLowerCase();
        return types.includes(type) || exts.includes(ext);
    }

    /**
     * Check file size (in MB)
     */
    function checkFileSize(file, maxMB = 100) {
        if (!file) return false;
        const sizeMB = file.size / (1024 * 1024);
        return sizeMB <= maxMB;
    }

    /**
     * Validate email
     */
    function isEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Validate URL
     */
    function isURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validate page range string (e.g., "1,3,5-8")
     */
    function validatePageRange(range, totalPages) {
        if (!range || range.trim() === '') return { valid: true, pages: [] };
        
        const pages = [];
        const parts = range.split(',').map(s => s.trim());
        
        for (const part of parts) {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(Number);
                if (!isNumber(start) || !isNumber(end) || start > end) {
                    return { valid: false, error: `Invalid range: ${part}` };
                }
                if (start < 1 || end > totalPages) {
                    return { valid: false, error: `Page range ${part} out of bounds (1-${totalPages})` };
                }
                for (let i = start; i <= end; i++) {
                    pages.push(i);
                }
            } else {
                const page = Number(part);
                if (!isNumber(page) || page < 1 || page > totalPages) {
                    return { valid: false, error: `Invalid page: ${part}` };
                }
                pages.push(page);
            }
        }
        
        return { valid: true, pages: [...new Set(pages)].sort((a, b) => a - b) };
    }

    /**
     * Check if string is empty or whitespace
     */
    function isEmpty(str) {
        return !str || str.trim() === '';
    }

    /**
     * Check if value is in allowed list
     */
    function isAllowed(value, allowed) {
        return allowed.includes(value);
    }

    /**
     * Validate DPI value
     */
    function validateDPI(dpi) {
        const num = Number(dpi);
        return isNumber(num, 72, 1200);
    }

    /**
     * Validate percentage (0-100)
     */
    function validatePercentage(value) {
        return isNumber(value, 0, 100);
    }

    /**
     * Validate image dimensions
     */
    function validateDimensions(width, height, maxDimension = 10000) {
        return isNumber(width, 1, maxDimension) && isNumber(height, 1, maxDimension);
    }

    // Public API
    return {
        isNumber,
        isPDF,
        isImage,
        checkFileSize,
        isEmail,
        isURL,
        validatePageRange,
        isEmpty,
        isAllowed,
        validateDPI,
        validatePercentage,
        validateDimensions
    };

})();

// Make Validators globally available
window.Validators = Validators;