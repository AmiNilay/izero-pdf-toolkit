/**
 * Sign PDF Engine
 * Handles embedding digital/drawn signatures onto PDF pages using pdf-lib
 * 100% Client-Side & Private
 */
const SignEngine = (function() {
    'use strict';

    /**
     * Embeds a signature PNG onto a PDF page
     * @param {ArrayBuffer} pdfBuffer - Raw PDF buffer
     * @param {string|Uint8Array} signatureData - Data URL (PNG) or Uint8Array of signature image
     * @param {Object} options - { pageNumber, xRatio, yRatio, widthRatio, heightRatio }
     *   Coordinates are normalized ratios (0 to 1) relative to page display width and height
     * @returns {Promise<Uint8Array>} Signed PDF bytes
     */
    async function signPdf(pdfBuffer, signatureData, options) {
        if (typeof PDFLib === 'undefined') {
            throw new Error('PDFLib library is not loaded');
        }

        const pdfDoc = await PDFLib.PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
        const pages = pdfDoc.getPages();
        const pageIndex = (options.pageNumber || 1) - 1;

        if (pageIndex < 0 || pageIndex >= pages.length) {
            throw new Error('Page ' + options.pageNumber + ' is out of range (1-' + pages.length + ')');
        }

        const page = pages[pageIndex];
        const { width: pageWidth, height: pageHeight } = page.getSize();

        // Convert signatureData to PNG bytes if data URL
        let pngBytes;
        if (typeof signatureData === 'string' && signatureData.startsWith('data:')) {
            const base64Data = signatureData.split(',')[1];
            const binaryString = atob(base64Data);
            pngBytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                pngBytes[i] = binaryString.charCodeAt(i);
            }
        } else if (signatureData instanceof Uint8Array) {
            pngBytes = signatureData;
        } else {
            throw new Error('Invalid signature image data format');
        }

        const embeddedImage = await pdfDoc.embedPng(pngBytes);

        // Calculate physical coordinates on PDF page
        // In PDF coordinate system, (0,0) is bottom-left; in HTML canvas it is top-left
        const sigWidth = options.widthRatio * pageWidth;
        const sigHeight = options.heightRatio * pageHeight;
        const sigX = options.xRatio * pageWidth;
        const sigY = pageHeight - (options.yRatio * pageHeight) - sigHeight;

        page.drawImage(embeddedImage, {
            x: Math.max(0, sigX),
            y: Math.max(0, sigY),
            width: sigWidth,
            height: sigHeight,
        });

        return await pdfDoc.save();
    }

    return {
        signPdf: signPdf
    };
})();
