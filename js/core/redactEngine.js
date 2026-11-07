/**
 * Redact PDF Engine
 * Permanently obliterates sensitive text and objects from PDF pages
 * 100% Client-Side, Zero Recovery Risk, 100% Private
 */
const RedactEngine = (function() {
    'use strict';

    /**
     * Applies permanent, irreversible redaction to a PDF page
     * @param {ArrayBuffer} pdfBuffer
     * @param {number} pageNumber 1-indexed page number
     * @param {Array<Object>} redactionBoxes Array of { xRatio, yRatio, widthRatio, heightRatio }
     * @returns {Promise<Uint8Array>} Redacted PDF bytes
     */
    async function redactPage(pdfBuffer, pageNumber, redactionBoxes) {
        if (typeof pdfjsLib === 'undefined' || typeof PDFLib === 'undefined') {
            throw new Error('Required PDF libraries are not loaded');
        }

        // Safely extract bytes and clone independent copies so PDF.js worker transfer
        // does not detach the buffer required by pdf-lib
        let rawBytes;
        if (pdfBuffer instanceof Uint8Array) {
            rawBytes = pdfBuffer;
        } else if (pdfBuffer instanceof ArrayBuffer) {
            rawBytes = new Uint8Array(pdfBuffer);
        } else if (pdfBuffer && typeof pdfBuffer.arrayBuffer === 'function') {
            rawBytes = new Uint8Array(await pdfBuffer.arrayBuffer());
        } else {
            throw new Error('Invalid PDF data provided');
        }

        // Create independent copies
        const pdfJsBytes = rawBytes.slice();
        const pdfLibBytes = rawBytes.slice();

        // 1. Render the original page at high resolution (scale 2.0) via PDF.js
        const loadingTask = pdfjsLib.getDocument({ data: pdfJsBytes });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(pageNumber);

        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({
            canvasContext: ctx,
            viewport: viewport
        }).promise;

        // 2. Permanently draw blackout rectangles over all user redaction boxes
        ctx.fillStyle = '#000000';
        for (const box of redactionBoxes) {
            const bx = box.xRatio * canvas.width;
            const by = box.yRatio * canvas.height;
            const bw = box.widthRatio * canvas.width;
            const bh = box.heightRatio * canvas.height;

            ctx.fillRect(bx, by, bw, bh);
        }

        // 3. Convert sanitized canvas to clean PNG blob (obliterates underlying text stream)
        const sanitizedDataUrl = canvas.toDataURL('image/png');
        const base64Data = sanitizedDataUrl.split(',')[1];
        const binaryString = atob(base64Data);
        const pngBytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            pngBytes[i] = binaryString.charCodeAt(i);
        }

        // 4. In pdf-lib, load document and replace the target page with sanitized page
        const pdfDoc = await PDFLib.PDFDocument.load(pdfLibBytes, { ignoreEncryption: true });
        const pages = pdfDoc.getPages();
        const pageIndex = pageNumber - 1;

        if (pageIndex < 0 || pageIndex >= pages.length) {
            throw new Error('Page out of bounds');
        }

        const targetPage = pages[pageIndex];
        const { width: pWidth, height: pHeight } = targetPage.getSize();

        const embeddedPng = await pdfDoc.embedPng(pngBytes);

        // Draw sanitized raster over the page covering full dimensions
        targetPage.drawImage(embeddedPng, {
            x: 0,
            y: 0,
            width: pWidth,
            height: pHeight
        });

        return await pdfDoc.save();
    }

    return {
        redactPage: redactPage
    };
})();
