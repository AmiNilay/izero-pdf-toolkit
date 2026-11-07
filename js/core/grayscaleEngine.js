/**
 * iZeroPDF - Grayscale & Monochrome Print Optimizer Engine
 * 100% Client-Side PDF Color Optimization
 */

const GrayscaleEngine = (function() {
    'use strict';

    /**
     * Converts a single canvas or image data to grayscale or thresholded B&W.
     * Formula: Gray = 0.299*R + 0.587*G + 0.114*B (Standard Rec. 601 Luminosity)
     */
    function processImageData(imageData, mode, threshold) {
        const data = imageData.data;
        const len = data.length;
        const isThreshold = mode === 'monochrome';
        const thresh = typeof threshold === 'number' ? threshold : 128;

        for (let i = 0; i < len; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Standard luminosity
            const gray = (0.299 * r + 0.587 * g + 0.114 * b);

            if (isThreshold) {
                const val = gray >= thresh ? 255 : 0;
                data[i] = val;
                data[i + 1] = val;
                data[i + 2] = val;
            } else {
                data[i] = gray;
                data[i + 1] = gray;
                data[i + 2] = gray;
            }
        }
        return imageData;
    }

    /**
     * Converts an uploaded PDF file into a grayscale/monochrome PDF.
     * @param {File|ArrayBuffer} file - Source PDF file
     * @param {Object} options - Conversion options
     *   - mode: 'grayscale' | 'monochrome'
     *   - threshold: number (0-255, default 128)
     *   - quality: number (0.5 to 1.0, default 0.85)
     *   - scale: number (rendering resolution scale, default 2.0)
     *   - onProgress: callback(current, total, statusText)
     * @returns {Promise<Uint8Array>}
     */
    async function convertPdfToGrayscale(file, options = {}) {
        const mode = options.mode || 'grayscale';
        const threshold = options.threshold !== undefined ? options.threshold : 128;
        const quality = options.quality || 0.85;
        const scale = options.scale || 2.0;
        const onProgress = options.onProgress || function() {};

        const arrayBuffer = file instanceof ArrayBuffer ? file : await file.arrayBuffer();

        // Load PDF via PDF.js for high-fidelity rasterization
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
        const pdf = await loadingTask.promise;
        const totalPages = pdf.numPages;

        // Initialize new PDF via PDFLib
        const outPdf = await PDFLib.PDFDocument.create();

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            onProgress(pageNum, totalPages, `Converting page ${pageNum} of ${totalPages} to ${mode}...`);

            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: scale });

            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');

            await page.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise;

            // Apply luminosity filter to canvas pixels
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            processImageData(imgData, mode, threshold);
            ctx.putImageData(imgData, 0, 0);

            // Export to JPEG data URL
            const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
            const jpegBytes = await fetch(jpegDataUrl).then(r => r.arrayBuffer());

            // Embed into output PDF
            const embeddedImage = await outPdf.embedJpg(jpegBytes);
            // Maintain original dimensions at 72 DPI (unscaled viewport)
            const origViewport = page.getViewport({ scale: 1.0 });
            const newPage = outPdf.addPage([origViewport.width, origViewport.height]);
            newPage.drawImage(embeddedImage, {
                x: 0,
                y: 0,
                width: origViewport.width,
                height: origViewport.height
            });
        }

        onProgress(totalPages, totalPages, 'Finalizing optimized PDF...');
        return await outPdf.save();
    }

    return {
        processImageData,
        convertPdfToGrayscale
    };
})();

if (typeof window !== 'undefined') {
    window.GrayscaleEngine = GrayscaleEngine;
}
