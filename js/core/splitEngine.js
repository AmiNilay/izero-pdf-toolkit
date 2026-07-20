/**
 * SplitEngine - PDF splitting functionality using pdf-lib
 */

const SplitEngine = (function() {
    'use strict';

    /**
     * Split PDF by page ranges
     */
    async function splitByRanges(pdfFile, ranges) {
        const { PDFDocument } = window.PDFLib;
        const arrayBuffer = await FileHelpers.readAsArrayBuffer(pdfFile);
        const pdf = await PDFDocument.load(arrayBuffer);
        const totalPages = pdf.getPageCount();
        
        const results = [];
        let pageCounter = 0;
        
        for (let i = 0; i < ranges.length; i++) {
            const range = ranges[i];
            let pageIndices = [];
            
            if (typeof range === 'string') {
                // Parse range string like "1-5" or "1,3,5"
                pageIndices = MergeEngine.parsePageRanges(range, totalPages);
            } else if (Array.isArray(range)) {
                pageIndices = range.map(p => p - 1); // 0-indexed
            } else {
                // Single page number
                pageIndices = [range - 1];
            }
            
            if (pageIndices.length === 0) continue;
            
            const newPdf = await PDFDocument.create();
            const pages = await newPdf.copyPages(pdf, pageIndices);
            for (const page of pages) {
                newPdf.addPage(page);
            }
            
            const pdfBytes = await newPdf.save();
            const filename = `split_part_${i + 1}.pdf`;
            
            results.push({
                blob: new Blob([pdfBytes], { type: 'application/pdf' }),
                filename: filename,
                pages: pageIndices.map(p => p + 1),
                pageCount: pageIndices.length
            });
            
            pageCounter += pageIndices.length;
            const progress = (i + 1) / ranges.length * 100;
            window.showProgress(true, progress, `Splitting part ${i + 1}/${ranges.length}`);
        }
        
        window.showProgress(false);
        return results;
    }

    /**
     * Split PDF every N pages
     */
    async function splitByPageCount(pdfFile, pagesPerFile) {
        const { PDFDocument } = window.PDFLib;
        const arrayBuffer = await FileHelpers.readAsArrayBuffer(pdfFile);
        const pdf = await PDFDocument.load(arrayBuffer);
        const totalPages = pdf.getPageCount();
        
        const results = [];
        const numParts = Math.ceil(totalPages / pagesPerFile);
        
        for (let i = 0; i < numParts; i++) {
            const start = i * pagesPerFile;
            const end = Math.min(start + pagesPerFile, totalPages);
            const pageIndices = Array.from({ length: end - start }, (_, j) => start + j);
            
            const newPdf = await PDFDocument.create();
            const pages = await newPdf.copyPages(pdf, pageIndices);
            for (const page of pages) {
                newPdf.addPage(page);
            }
            
            const pdfBytes = await newPdf.save();
            const filename = `split_part_${i + 1}.pdf`;
            
            results.push({
                blob: new Blob([pdfBytes], { type: 'application/pdf' }),
                filename: filename,
                pages: pageIndices.map(p => p + 1),
                pageCount: pageIndices.length
            });
            
            const progress = (i + 1) / numParts * 100;
            window.showProgress(true, progress, `Splitting part ${i + 1}/${numParts}`);
        }
        
        window.showProgress(false);
        return results;
    }

    /**
     * Extract single pages from PDF
     */
    async function extractPages(pdfFile, pageNumbers) {
        const { PDFDocument } = window.PDFLib;
        const arrayBuffer = await FileHelpers.readAsArrayBuffer(pdfFile);
        const pdf = await PDFDocument.load(arrayBuffer);
        const totalPages = pdf.getPageCount();
        
        // Validate page numbers
        const validPages = pageNumbers
            .filter(p => p >= 1 && p <= totalPages)
            .map(p => p - 1); // 0-indexed
        
        if (validPages.length === 0) {
            throw new Error('No valid pages to extract');
        }
        
        const results = [];
        
        for (let i = 0; i < validPages.length; i++) {
            const pageNum = validPages[i];
            const newPdf = await PDFDocument.create();
            const [page] = await newPdf.copyPages(pdf, [pageNum]);
            newPdf.addPage(page);
            
            const pdfBytes = await newPdf.save();
            const filename = `page_${pageNum + 1}.pdf`;
            
            results.push({
                blob: new Blob([pdfBytes], { type: 'application/pdf' }),
                filename: filename,
                page: pageNum + 1
            });
            
            const progress = (i + 1) / validPages.length * 100;
            window.showProgress(true, progress, `Extracting page ${i + 1}/${validPages.length}`);
        }
        
        window.showProgress(false);
        return results;
    }

    /**
     * Split PDF at specific page numbers
     */
    async function splitAtPages(pdfFile, splitPoints) {
        const { PDFDocument } = window.PDFLib;
        const arrayBuffer = await FileHelpers.readAsArrayBuffer(pdfFile);
        const pdf = await PDFDocument.load(arrayBuffer);
        const totalPages = pdf.getPageCount();
        
        // Sort and validate split points
        const points = [...new Set(splitPoints)]
            .filter(p => p >= 1 && p < totalPages)
            .sort((a, b) => a - b);
        
        if (points.length === 0) {
            throw new Error('No valid split points');
        }
        
        const ranges = [];
        let start = 0;
        
        for (const point of points) {
            ranges.push([start, point - 1]);
            start = point;
        }
        ranges.push([start, totalPages - 1]);
        
        const results = [];
        
        for (let i = 0; i < ranges.length; i++) {
            const [startPage, endPage] = ranges[i];
            const pageIndices = Array.from(
                { length: endPage - startPage + 1 },
                (_, j) => startPage + j
            );
            
            const newPdf = await PDFDocument.create();
            const pages = await newPdf.copyPages(pdf, pageIndices);
            for (const page of pages) {
                newPdf.addPage(page);
            }
            
            const pdfBytes = await newPdf.save();
            const filename = `split_part_${i + 1}.pdf`;
            
            results.push({
                blob: new Blob([pdfBytes], { type: 'application/pdf' }),
                filename: filename,
                pages: pageIndices.map(p => p + 1),
                pageCount: pageIndices.length
            });
            
            const progress = (i + 1) / ranges.length * 100;
            window.showProgress(true, progress, `Splitting part ${i + 1}/${ranges.length}`);
        }
        
        window.showProgress(false);
        return results;
    }

    /**
     * Delete pages from PDF
     */
    async function deletePages(pdfFile, pagesToDelete) {
        const { PDFDocument } = window.PDFLib;
        const arrayBuffer = await FileHelpers.readAsArrayBuffer(pdfFile);
        const pdf = await PDFDocument.load(arrayBuffer);
        const totalPages = pdf.getPageCount();
        
        const deleteSet = new Set(pagesToDelete.map(p => p - 1));
        const keepPages = [];
        
        for (let i = 0; i < totalPages; i++) {
            if (!deleteSet.has(i)) {
                keepPages.push(i);
            }
        }
        
        if (keepPages.length === 0) {
            throw new Error('Cannot delete all pages');
        }
        
        const newPdf = await PDFDocument.create();
        const pages = await newPdf.copyPages(pdf, keepPages);
        for (const page of pages) {
            newPdf.addPage(page);
        }
        
        return await newPdf.save();
    }

    /**
     * Reverse page order
     */
    async function reversePages(pdfFile) {
        const { PDFDocument } = window.PDFLib;
        const arrayBuffer = await FileHelpers.readAsArrayBuffer(pdfFile);
        const pdf = await PDFDocument.load(arrayBuffer);
        const totalPages = pdf.getPageCount();
        
        const newPdf = await PDFDocument.create();
        const pageIndices = Array.from({ length: totalPages }, (_, i) => totalPages - 1 - i);
        const pages = await newPdf.copyPages(pdf, pageIndices);
        for (const page of pages) {
            newPdf.addPage(page);
        }
        
        return await newPdf.save();
    }

    // Public API
    return {
        splitByRanges,
        splitByPageCount,
        extractPages,
        splitAtPages,
        deletePages,
        reversePages
    };

})();

// Make SplitEngine globally available
window.SplitEngine = SplitEngine;