/**
 * DownloadHelpers - Download utilities
 */

const DownloadHelpers = (function() {
    'use strict';

    /**
     * Download a single blob
     */
    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        FileHelpers.downloadFile(url, filename);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    }

    /**
     * Download a canvas as image
     */
    function downloadCanvas(canvas, filename, format = 'image/png', quality = 0.92) {
        const dataURL = canvas.toDataURL(format, quality);
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Download multiple files as ZIP
     */
    async function downloadAsZip(files, zipName = 'download.zip') {
        const zip = await ZipHelpers.createZip(files);
        downloadBlob(zip, zipName);
    }

    /**
     * Download images as ZIP
     */
    async function downloadImagesAsZip(images, baseName = 'images', zipName = 'images.zip') {
        const zip = await ZipHelpers.createZipFromImages(images, baseName);
        downloadBlob(zip, zipName);
    }

    /**
     * Download PDFs as ZIP
     */
    async function downloadPDFsAsZip(pdfs, baseName = 'documents', zipName = 'documents.zip') {
        const zip = await ZipHelpers.createZipFromPDFs(pdfs, baseName);
        downloadBlob(zip, zipName);
    }

    /**
     * Download data as CSV
     */
    function downloadCSV(data, headers, filename = 'data.csv') {
        let csv = headers.join(',') + '\n';
        for (const row of data) {
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        }
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        downloadBlob(blob, filename);
    }

    /**
     * Download data as JSON
     */
    function downloadJSON(data, filename = 'data.json') {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
        downloadBlob(blob, filename);
    }

    /**
     * Download as text file
     */
    function downloadText(text, filename = 'document.txt') {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
        downloadBlob(blob, filename);
    }

    /**
     * Download HTML content
     */
    function downloadHTML(html, filename = 'page.html') {
        const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
        downloadBlob(blob, filename);
    }

    /**
     * Create a download link for a blob
     */
    function createDownloadLink(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        return link;
    }

    /**
     * Trigger download of multiple files sequentially
     */
    async function downloadMultiple(files, delay = 500) {
        for (const file of files) {
            downloadBlob(file.blob, file.filename);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    /**
     * Save file using FileSaver
     */
    function saveAs(blob, filename) {
        if (typeof window.saveAs === 'function') {
            window.saveAs(blob, filename);
        } else {
            downloadBlob(blob, filename);
        }
    }

    // Public API
    return {
        downloadBlob,
        downloadCanvas,
        downloadAsZip,
        downloadImagesAsZip,
        downloadPDFsAsZip,
        downloadCSV,
        downloadJSON,
        downloadText,
        downloadHTML,
        createDownloadLink,
        downloadMultiple,
        saveAs
    };

})();

// Make DownloadHelpers globally available
window.DownloadHelpers = DownloadHelpers;