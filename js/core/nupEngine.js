/**
 * iZeroPDF - N-Up Multi-Page Imposition Engine
 * 100% Client-Side PDF Booklet & Grid Imposition via pdf-lib
 */

const NupEngine = (function() {
    'use strict';

    // Standard paper sizes in points (72 DPI)
    const PAGE_SIZES = {
        'A4': { width: 595.28, height: 841.89 },
        'Letter': { width: 612.0, height: 792.0 },
        'Legal': { width: 612.0, height: 1008.0 }
    };

    /**
     * Creates an N-Up imposed PDF document.
     * @param {File|ArrayBuffer} file - Source PDF file
     * @param {Object} options
     *   - nup: 2 | 4 | 6 | 8 (number of pages per sheet)
     *   - paperSize: 'A4' | 'Letter' | 'Legal'
     *   - orientation: 'portrait' | 'landscape'
     *   - drawBorders: boolean (draw thin outline around each sub-page)
     *   - margin: number in points (outer padding, default 20)
     *   - spacing: number in points (gutter between pages, default 10)
     *   - onProgress: callback(current, total, status)
     * @returns {Promise<Uint8Array>}
     */
    async function imposePdf(file, options = {}) {
        const nup = parseInt(options.nup, 10) || 2;
        const paperSizeName = options.paperSize || 'A4';
        const orientation = options.orientation || (nup === 2 || nup === 6 ? 'landscape' : 'portrait');
        const drawBorders = !!options.drawBorders;
        const margin = typeof options.margin === 'number' ? options.margin : 20;
        const spacing = typeof options.spacing === 'number' ? options.spacing : 12;
        const onProgress = options.onProgress || function() {};

        const arrayBuffer = file instanceof ArrayBuffer ? file : await file.arrayBuffer();
        const srcDoc = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const totalSrcPages = srcDoc.getPageCount();

        if (totalSrcPages === 0) {
            throw new Error('Source document has no pages.');
        }

        // Determine base sheet dimensions
        const baseSize = PAGE_SIZES[paperSizeName] || PAGE_SIZES.A4;
        let sheetWidth = baseSize.width;
        let sheetHeight = baseSize.height;

        if (orientation === 'landscape' && sheetWidth < sheetHeight) {
            sheetWidth = baseSize.height;
            sheetHeight = baseSize.width;
        } else if (orientation === 'portrait' && sheetWidth > sheetHeight) {
            sheetWidth = baseSize.height;
            sheetHeight = baseSize.width;
        }

        // Grid layout calculation: rows and cols
        let cols = 1;
        let rows = 1;

        if (nup === 2) {
            if (orientation === 'landscape') { cols = 2; rows = 1; }
            else { cols = 1; rows = 2; }
        } else if (nup === 4) {
            cols = 2; rows = 2;
        } else if (nup === 6) {
            if (orientation === 'landscape') { cols = 3; rows = 2; }
            else { cols = 2; rows = 3; }
        } else if (nup === 8) {
            if (orientation === 'landscape') { cols = 4; rows = 2; }
            else { cols = 2; rows = 4; }
        }

        // Available area for cells
        const usableWidth = sheetWidth - (margin * 2) - ((cols - 1) * spacing);
        const usableHeight = sheetHeight - (margin * 2) - ((rows - 1) * spacing);
        const cellWidth = usableWidth / cols;
        const cellHeight = usableHeight / rows;

        const outDoc = await PDFLib.PDFDocument.create();

        // Copy all pages into embeddable handles
        const pageIndices = [];
        for (let i = 0; i < totalSrcPages; i++) pageIndices.push(i);
        const embeddedPages = await outDoc.embedPdf(srcDoc, pageIndices);

        const totalSheets = Math.ceil(totalSrcPages / nup);

        for (let sheetIndex = 0; sheetIndex < totalSheets; sheetIndex++) {
            onProgress(sheetIndex + 1, totalSheets, `Imposing sheet ${sheetIndex + 1} of ${totalSheets}...`);
            const sheet = outDoc.addPage([sheetWidth, sheetHeight]);

            for (let slot = 0; slot < nup; slot++) {
                const srcPageIndex = (sheetIndex * nup) + slot;
                if (srcPageIndex >= totalSrcPages) break;

                const embedded = embeddedPages[srcPageIndex];
                const origW = embedded.width;
                const origH = embedded.height;

                // Scale to fit inside cell maintaining aspect ratio
                const scaleW = cellWidth / origW;
                const scaleH = cellHeight / origH;
                const scale = Math.min(scaleW, scaleH);

                const finalW = origW * scale;
                const finalH = origH * scale;

                // Grid coordinates (slot 0 at top-left)
                const col = slot % cols;
                const row = Math.floor(slot / cols);

                // PDF Y is 0 at bottom
                const cellX = margin + (col * (cellWidth + spacing));
                const cellY = sheetHeight - margin - ((row + 1) * cellHeight) - (row * spacing);

                // Center page inside its cell
                const posX = cellX + ((cellWidth - finalW) / 2);
                const posY = cellY + ((cellHeight - finalH) / 2);

                sheet.drawPage(embedded, {
                    x: posX,
                    y: posY,
                    width: finalW,
                    height: finalH
                });

                if (drawBorders) {
                    sheet.drawRectangle({
                        x: posX,
                        y: posY,
                        width: finalW,
                        height: finalH,
                        borderColor: PDFLib.rgb(0.7, 0.7, 0.7),
                        borderWidth: 0.5
                    });
                }
            }
        }

        onProgress(totalSheets, totalSheets, 'Saving imposed document...');
        return await outDoc.save();
    }

    return {
        imposePdf,
        PAGE_SIZES
    };
})();

if (typeof window !== 'undefined') {
    window.NupEngine = NupEngine;
}
