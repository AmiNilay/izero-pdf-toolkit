/**
 * iZeroPDF - File System Access API & Batch Folder Processing Engine
 * 100% Client-Side In-Place Directory Processing & Batch Manipulation
 */

const BatchEngine = (function() {
    'use strict';

    /**
     * Checks if the modern File System Access API is supported by the current browser.
     */
    function hasDirectoryPicker() {
        return typeof window.showDirectoryPicker === 'function';
    }

    /**
     * Prompts the user to pick a local folder with read/write access.
     */
    async function pickDirectory() {
        if (!hasDirectoryPicker()) {
            throw new Error('File System Access API is not supported in this browser.');
        }
        return await window.showDirectoryPicker({
            id: 'izero-pdf-batch-folder',
            mode: 'readwrite'
        });
    }

    /**
     * Reads supported files from a directory handle.
     * @param {FileSystemDirectoryHandle} dirHandle
     * @returns {Promise<Array<{ handle: FileSystemFileHandle, file: File, path: string }>>}
     */
    async function scanDirectory(dirHandle) {
        const supportedExts = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.bmp', '.avif'];
        const results = [];

        for await (const entry of dirHandle.values()) {
            if (entry.kind === 'file') {
                const lowerName = entry.name.toLowerCase();
                const isSupported = supportedExts.some(ext => lowerName.endsWith(ext));
                if (isSupported) {
                    const file = await entry.getFile();
                    results.push({
                        handle: entry,
                        file: file,
                        name: entry.name,
                        size: file.size,
                        type: file.type
                    });
                }
            }
        }

        return results;
    }

    /**
     * Writes processed bytes directly to a destination directory handle.
     */
    async function writeFileToDir(dirHandle, filename, data) {
        const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(data);
        await writable.close();
    }

    /**
     * Executes batch operation across a list of files.
     * Writes in-place to an output subfolder if dirHandle is provided, or returns a ZIP blob.
     */
    async function processBatch(filesList, operation, options = {}, onProgress = null) {
        const dirHandle = options.dirHandle || null;
        let outDirHandle = null;
        let zip = null;

        if (dirHandle) {
            // Create a dedicated output subfolder inside the selected directory
            outDirHandle = await dirHandle.getDirectoryHandle('iZero_Optimized', { create: true });
        } else {
            zip = new JSZip();
        }

        const total = filesList.length;
        const results = [];

        for (let i = 0; i < total; i++) {
            const item = filesList[i];
            const file = item.file || item;
            const name = file.name;
            const lowerName = name.toLowerCase();

            if (onProgress) {
                onProgress(i + 1, total, `Processing (${i + 1}/${total}): ${name}`);
            }

            try {
                let outBytes = null;
                let outName = name;

                if (operation === 'scrub-metadata') {
                    if (lowerName.endsWith('.pdf')) {
                        outBytes = await MetadataEngine.sanitizePdfMetadata(file);
                        outName = name.replace(/\.pdf$/i, '_scrubbed.pdf');
                    } else {
                        outBytes = await MetadataEngine.stripImageExif(file);
                        outName = name.replace(/\.[^/.]+$/, '_scrubbed.png');
                    }
                } else if (operation === 'grayscale-pdf') {
                    if (lowerName.endsWith('.pdf')) {
                        outBytes = await GrayscaleEngine.convertPdfToGrayscale(file, {
                            mode: options.grayscaleMode || 'grayscale',
                            threshold: options.threshold || 128
                        });
                        outName = name.replace(/\.pdf$/i, '_grayscale.pdf');
                    }
                } else if (operation === 'flatten-pdf') {
                    if (lowerName.endsWith('.pdf')) {
                        outBytes = await FlattenEngine.flattenPdf(file);
                        outName = name.replace(/\.pdf$/i, '_flattened.pdf');
                    }
                } else if (operation === 'convert-to-webp') {
                    if (!lowerName.endsWith('.pdf')) {
                        const img = await FileHelpers.loadImage(file);
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        const webpDataUrl = canvas.toDataURL('image/webp', options.quality || 0.85);
                        outBytes = await fetch(webpDataUrl).then(r => r.arrayBuffer());
                        outName = name.replace(/\.[^/.]+$/, '.webp');
                    }
                }

                if (outBytes) {
                    if (outDirHandle) {
                        await writeFileToDir(outDirHandle, outName, outBytes);
                    } else if (zip) {
                        zip.file(outName, outBytes);
                    }

                    results.push({
                        name: name,
                        outName: outName,
                        origSize: file.size,
                        newSize: outBytes.byteLength || outBytes.size || file.size,
                        status: 'success'
                    });
                }
            } catch (err) {
                console.error(`Batch item error on ${name}:`, err);
                results.push({
                    name: name,
                    origSize: file.size,
                    newSize: 0,
                    status: 'error',
                    error: err.message
                });
            }
        }

        let zipBlob = null;
        if (zip && !outDirHandle) {
            if (onProgress) onProgress(total, total, 'Creating ZIP archive...');
            zipBlob = await zip.generateAsync({ type: 'blob' });
        }

        return {
            results: results,
            zipBlob: zipBlob,
            savedInPlace: !!outDirHandle
        };
    }

    return {
        hasDirectoryPicker,
        pickDirectory,
        scanDirectory,
        processBatch
    };
})();

if (typeof window !== 'undefined') {
    window.BatchEngine = BatchEngine;
}
