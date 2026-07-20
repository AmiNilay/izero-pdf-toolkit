/**
 * MergeEngine - PDF merging functionality using pdf-lib
 */

const MergeEngine = (function() {
    'use strict';

    /**
     * Merge multiple PDFs
     */
    async function mergePDFs(pdfFiles, options = {}) {
        const {
            pageSize = null, // If null, use first PDF's size
            orientation = null, // 'portrait', 'landscape', or null
            addPageNumbers = false,
            pageNumberPosition = 'bottom-center',
            pageNumberFormat = 'Page {page} of {total}'
        } = options;

        const { PDFDocument } = window.PDFLib;
        const mergedPdf = await PDFDocument.create();
        
        // If pageSize specified, set it
        if (pageSize) {
            // Convert page size to points (1 point = 1/72 inch)
            const sizes = {
                'a4': [595.28, 841.89],
                'letter': [612, 792],
                'legal': [612, 1008],
                'a3': [841.89, 1190.55],
                'a5': [419.53, 595.28]
            };
            const size = sizes[pageSize] || sizes['a4'];
            mergedPdf.setPageSize(size[0], size[1]);
        }

        let totalPages = 0;
        let pageCounter = 0;

        // First, count total pages
        for (const file of pdfFiles) {
            const arrayBuffer = await FileHelpers.readAsArrayBuffer(file);
            const pdf = await PDFDocument.load(arrayBuffer);
            totalPages += pdf.getPageCount();
        }

        // Merge all PDFs
        for (let i = 0; i < pdfFiles.length; i++) {
            const file = pdfFiles[i];
            const arrayBuffer = await FileHelpers.readAsArrayBuffer(file);
            const pdf = await PDFDocument.load(arrayBuffer);
            const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            
            for (const page of pages) {
                pageCounter++;
                mergedPdf.addPage(page);
                
                // Add page numbers if requested
                if (addPageNumbers) {
                    const { width, height } = page.getSize();
                    const text = pageNumberFormat
                        .replace('{page}', pageCounter)
                        .replace('{total}', totalPages);
                    
                    const fontSize = 10;
                    const textWidth = fontSize * text.length * 0.6;
                    
                    let x, y;
                    switch (pageNumberPosition) {
                        case 'top-left':
                            x = 50;
                            y = height - 50;
                            break;
                        case 'top-right':
                            x = width - textWidth - 50;
                            y = height - 50;
                            break;
                        case 'top-center':
                            x = (width - textWidth) / 2;
                            y = height - 50;
                            break;
                        case 'bottom-left':
                            x = 50;
                            y = 50;
                            break;
                        case 'bottom-right':
                            x = width - textWidth - 50;
                            y = 50;
                            break;
                        default: // bottom-center
                            x = (width - textWidth) / 2;
                            y = 50;
                    }
                    
                    page.drawText(text, {
                        x,
                        y,
                        size: fontSize,
                        color: { r: 0, g: 0, b: 0 },
                        opacity: 0.8
                    });
                }
            }
            
            const progress = (i + 1) / pdfFiles.length * 100;
            window.showProgress(true, progress, `Merging PDF ${i + 1}/${pdfFiles.length}`);
        }

        window.showProgress(false);
        
        const pdfBytes = await mergedPdf.save();
        return pdfBytes;
    }

    /**
     * Merge PDFs with page range selection
     */
    async function mergePDFsWithRanges(pdfFilesWithRanges) {
        const { PDFDocument } = window.PDFLib;
        const mergedPdf = await PDFDocument.create();
        let totalPages = 0;
        
        // Calculate total pages first
        for (const item of pdfFilesWithRanges) {
            const arrayBuffer = await FileHelpers.readAsArrayBuffer(item.file);
            const pdf = await PDFDocument.load(arrayBuffer);
            const pageIndices = item.pages || pdf.getPageIndices();
            totalPages += pageIndices.length;
        }
        
        let pageCounter = 0;
        
        for (let i = 0; i < pdfFilesWithRanges.length; i++) {
            const { file, pages: pageIndices } = pdfFilesWithRanges[i];
            const arrayBuffer = await FileHelpers.readAsArrayBuffer(file);
            const pdf = await PDFDocument.load(arrayBuffer);
            
            const indices = pageIndices || pdf.getPageIndices();
            const pages = await mergedPdf.copyPages(pdf, indices);
            
            for (const page of pages) {
                pageCounter++;
                mergedPdf.addPage(page);
            }
            
            const progress = (i + 1) / pdfFilesWithRanges.length * 100;
            window.showProgress(true, progress, `Merging PDF ${i + 1}/${pdfFilesWithRanges.length}`);
        }
        
        window.showProgress(false);
        return await mergedPdf.save();
    }

    /**
     * Reorder pages in a PDF
     */
    async function reorderPages(pdfFile, newOrder) {
        const { PDFDocument } = window.PDFLib;
        const arrayBuffer = await FileHelpers.readAsArrayBuffer(pdfFile);
        const pdf = await PDFDocument.load(arrayBuffer);
        const newPdf = await PDFDocument.create();
        
        const pages = await newPdf.copyPages(pdf, newOrder);
        for (const page of pages) {
            newPdf.addPage(page);
        }
        
        return await newPdf.save();
    }

    /**
     * Insert blank pages into PDF
     */
    async function insertBlankPages(pdfFile, positions, pageSize = null) {
        const { PDFDocument } = window.PDFLib;
        const arrayBuffer = await FileHelpers.readAsArrayBuffer(pdfFile);
        const pdf = await PDFDocument.load(arrayBuffer);
        const newPdf = await PDFDocument.create();
        
        const totalPages = pdf.getPageCount();
        let pageCounter = 0;
        
        for (let i = 0; i < totalPages; i++) {
            // Insert blank page before this page if position matches
            if (positions.includes(i + 1)) {
                const blankPage = newPdf.addPage();
                pageCounter++;
            }
            
            const [page] = await newPdf.copyPages(pdf, [i]);
            newPdf.addPage(page);
            pageCounter++;
        }
        
        // Insert blank pages at the end
        const endPositions = positions.filter(p => p === totalPages + 1);
        for (const pos of endPositions) {
            newPdf.addPage();
        }
        
        return await newPdf.save();
    }

    /**
     * Get page ranges from string input
     */
    function parsePageRanges(rangeStr, totalPages) {
        if (!rangeStr || rangeStr.trim() === '') {
            return Array.from({ length: totalPages }, (_, i) => i);
        }
        
        const pages = [];
        const parts = rangeStr.split(',').map(s => s.trim());
        
        for (const part of parts) {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(Number);
                for (let i = start; i <= end; i++) {
                    if (i >= 1 && i <= totalPages) {
                        pages.push(i - 1); // 0-indexed
                    }
                }
            } else {
                const page = Number(part);
                if (page >= 1 && page <= totalPages) {
                    pages.push(page - 1);
                }
            }
        }
        
        return [...new Set(pages)].sort((a, b) => a - b);
    }

    // Public API
    return {
        mergePDFs,
        mergePDFsWithRanges,
        reorderPages,
        insertBlankPages,
        parsePageRanges
    };

})();

// Make MergeEngine globally available
window.MergeEngine = MergeEngine;