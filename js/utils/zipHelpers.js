/**
 * ZipHelpers - ZIP file creation and management
 */

const ZipHelpers = (function() {
    'use strict';

    /**
     * Create a ZIP file from blobs
     */
    async function createZip(files) {
        const zip = new JSZip();
        
        for (const file of files) {
            zip.file(file.filename, file.data);
        }
        
        return await zip.generateAsync({ 
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });
    }

    /**
     * Create a ZIP from images
     */
    async function createZipFromImages(images, baseName = 'images') {
        const zip = new JSZip();
        
        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            let blob;
            
            if (image instanceof HTMLCanvasElement) {
                blob = await FileHelpers.canvasToBlob(image);
            } else if (image instanceof Blob || image instanceof File) {
                blob = image;
            } else {
                console.warn(`Skipping invalid image at index ${i}`);
                continue;
            }
            
            const extension = blob.type.split('/')[1] || 'png';
            const filename = `${baseName}_${String(i + 1).padStart(3, '0')}.${extension}`;
            zip.file(filename, blob);
        }
        
        return await zip.generateAsync({ 
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });
    }

    /**
     * Create ZIP from PDFs
     */
    async function createZipFromPDFs(pdfs, baseName = 'documents') {
        const zip = new JSZip();
        
        for (let i = 0; i < pdfs.length; i++) {
            const pdf = pdfs[i];
            const filename = `${baseName}_${String(i + 1).padStart(3, '0')}.pdf`;
            zip.file(filename, pdf);
        }
        
        return await zip.generateAsync({ 
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });
    }

    /**
     * Extract files from ZIP
     */
    async function extractZip(blob) {
        const zip = new JSZip();
        const entries = await zip.loadAsync(blob);
        const files = {};
        
        for (const [name, entry] of Object.entries(entries.files)) {
            if (!entry.dir) {
                files[name] = await entry.async('blob');
            }
        }
        
        return files;
    }

    /**
     * Add file to existing zip
     */
    async function addToZip(zipBlob, filename, data) {
        const zip = new JSZip();
        await zip.loadAsync(zipBlob);
        zip.file(filename, data);
        return await zip.generateAsync({ type: 'blob' });
    }

    /**
     * Remove file from ZIP
     */
    async function removeFromZip(zipBlob, filename) {
        const zip = new JSZip();
        await zip.loadAsync(zipBlob);
        zip.remove(filename);
        return await zip.generateAsync({ type: 'blob' });
    }

    /**
     * List files in ZIP
     */
    async function listZipFiles(zipBlob) {
        const zip = new JSZip();
        await zip.loadAsync(zipBlob);
        return Object.keys(zip.files).filter(name => !zip.files[name].dir);
    }

    // Public API
    return {
        createZip,
        createZipFromImages,
        createZipFromPDFs,
        extractZip,
        addToZip,
        removeFromZip,
        listZipFiles
    };

})();

// Make ZipHelpers globally available
window.ZipHelpers = ZipHelpers;