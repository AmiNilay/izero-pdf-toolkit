/**
 * iZeroPDF - Visual PDF Diff & Contract Comparator Engine
 * 100% Client-Side Canvas Pixel Diffing
 */

const CompareEngine = (function() {
    'use strict';

    /**
     * Renders a specific page of a PDF document to an HTML5 Canvas.
     */
    async function renderPageToCanvas(pdfDoc, pageNum, scale = 1.2) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));
        const ctx = canvas.getContext('2d');

        // Fill background white
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
            canvasContext: ctx,
            viewport: viewport
        }).promise;

        return canvas;
    }

    /**
     * Compares two canvases pixel-by-pixel.
     * Highlights additions in Green, deletions in Red, and unchanged areas in faded gray.
     * @returns {Object} { diffCanvas, diffCount, totalPixels, diffPercentage }
     */
    function diffCanvases(canvasA, canvasB, threshold = 25) {
        const width = Math.max(canvasA.width, canvasB.width);
        const height = Math.max(canvasA.height, canvasB.height);

        // Normalize canvases onto standard dimension
        const normA = document.createElement('canvas');
        normA.width = width; normA.height = height;
        const ctxA = normA.getContext('2d');
        ctxA.fillStyle = '#ffffff'; ctxA.fillRect(0, 0, width, height);
        ctxA.drawImage(canvasA, 0, 0);

        const normB = document.createElement('canvas');
        normB.width = width; normB.height = height;
        const ctxB = normB.getContext('2d');
        ctxB.fillStyle = '#ffffff'; ctxB.fillRect(0, 0, width, height);
        ctxB.drawImage(canvasB, 0, 0);

        const imgDataA = ctxA.getImageData(0, 0, width, height);
        const imgDataB = ctxB.getImageData(0, 0, width, height);

        const diffCanvas = document.createElement('canvas');
        diffCanvas.width = width;
        diffCanvas.height = height;
        const diffCtx = diffCanvas.getContext('2d');
        const diffData = diffCtx.createImageData(width, height);

        const dataA = imgDataA.data;
        const dataB = imgDataB.data;
        const out = diffData.data;
        const len = dataA.length;
        let diffCount = 0;

        for (let i = 0; i < len; i += 4) {
            const rA = dataA[i], gA = dataA[i + 1], bA = dataA[i + 2];
            const rB = dataB[i], gB = dataB[i + 1], bB = dataB[i + 2];

            // Color distance
            const dr = Math.abs(rA - rB);
            const dg = Math.abs(gA - gB);
            const db = Math.abs(bA - bB);
            const delta = (dr + dg + db) / 3;

            if (delta > threshold) {
                diffCount++;
                // Check if content was deleted (dark in A, light in B) or added (light in A, dark in B)
                const lumA = 0.299 * rA + 0.587 * gA + 0.114 * bA;
                const lumB = 0.299 * rB + 0.587 * gB + 0.114 * bB;

                if (lumA < lumB) {
                    // Removed / Deleted in B -> Red
                    out[i] = 220;
                    out[i + 1] = 38;
                    out[i + 2] = 38;
                    out[i + 3] = 255;
                } else {
                    // Added / Inserted in B -> Green
                    out[i] = 22;
                    out[i + 1] = 163;
                    out[i + 2] = 74;
                    out[i + 3] = 255;
                }
            } else {
                // Unchanged pixel -> subtle faded grayscale
                const gray = (rA + gA + bA) / 3;
                const washed = Math.min(255, Math.floor(gray * 0.4 + 150));
                out[i] = washed;
                out[i + 1] = washed;
                out[i + 2] = washed;
                out[i + 3] = 255;
            }
        }

        diffCtx.putImageData(diffData, 0, 0);

        const totalPixels = width * height;
        const diffPercentage = ((diffCount / totalPixels) * 100).toFixed(2);

        return {
            diffCanvas,
            diffCount,
            totalPixels,
            diffPercentage
        };
    }

    /**
     * Loads a PDF file and returns the PDF.js document handle.
     */
    async function loadPdfDocument(file) {
        const arrayBuffer = file instanceof ArrayBuffer ? file : await file.arrayBuffer();
        const copy = new Uint8Array(arrayBuffer).slice();
        const loadingTask = pdfjsLib.getDocument({ data: copy });
        return await loadingTask.promise;
    }

    return {
        loadPdfDocument,
        renderPageToCanvas,
        diffCanvases
    };
})();

if (typeof window !== 'undefined') {
    window.CompareEngine = CompareEngine;
}
