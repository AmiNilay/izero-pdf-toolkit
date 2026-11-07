/**
 * Privacy Metadata Scrubber Engine
 * Inspects and sanitizes metadata from PDFs and images
 * 100% Client-Side & Private
 */
const MetadataEngine = (function() {
    'use strict';

    /**
     * Reads metadata from a PDF ArrayBuffer
     * @param {ArrayBuffer} pdfBuffer
     * @returns {Promise<Object>} Extracted metadata fields
     */
    async function readPdfMetadata(pdfBuffer) {
        if (typeof PDFLib === 'undefined') {
            throw new Error('PDFLib is not loaded');
        }

        const pdfDoc = await PDFLib.PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
        
        return {
            title: pdfDoc.getTitle() || '',
            author: pdfDoc.getAuthor() || '',
            subject: pdfDoc.getSubject() || '',
            creator: pdfDoc.getCreator() || '',
            producer: pdfDoc.getProducer() || '',
            keywords: pdfDoc.getKeywords() || '',
            creationDate: pdfDoc.getCreationDate() ? pdfDoc.getCreationDate().toISOString() : '',
            modificationDate: pdfDoc.getModificationDate() ? pdfDoc.getModificationDate().toISOString() : '',
            pageCount: pdfDoc.getPageCount()
        };
    }

    /**
     * Scrubs or updates metadata on a PDF ArrayBuffer
     * @param {ArrayBuffer} pdfBuffer
     * @param {Object} customMetadata Optional custom overrides; empty values wipe the field
     * @returns {Promise<Uint8Array>} Sanitized PDF bytes
     */
    async function scrubPdfMetadata(pdfBuffer, customMetadata = null) {
        if (typeof PDFLib === 'undefined') {
            throw new Error('PDFLib is not loaded');
        }

        const pdfDoc = await PDFLib.PDFDocument.load(pdfBuffer, { ignoreEncryption: true });

        if (!customMetadata) {
            // Full Anonymization Mode: Wipe all fields
            pdfDoc.setTitle('');
            pdfDoc.setAuthor('');
            pdfDoc.setSubject('');
            pdfDoc.setCreator('');
            pdfDoc.setProducer('');
            pdfDoc.setKeywords([]);
            pdfDoc.setCreationDate(new Date(0));
            pdfDoc.setModificationDate(new Date(0));
        } else {
            // Custom Override Mode
            pdfDoc.setTitle(customMetadata.title || '');
            pdfDoc.setAuthor(customMetadata.author || '');
            pdfDoc.setSubject(customMetadata.subject || '');
            pdfDoc.setCreator(customMetadata.creator || '');
            pdfDoc.setProducer(customMetadata.producer || '');
            if (customMetadata.keywords) {
                const kwArray = Array.isArray(customMetadata.keywords) 
                    ? customMetadata.keywords 
                    : customMetadata.keywords.split(',').map(s => s.trim()).filter(Boolean);
                pdfDoc.setKeywords(kwArray);
            } else {
                pdfDoc.setKeywords([]);
            }
            pdfDoc.setCreationDate(new Date(0));
            pdfDoc.setModificationDate(new Date(0));
        }

        return await pdfDoc.save();
    }

    /**
     * Scrubs all EXIF, GPS, and device metadata from an Image
     * by decoding and re-rendering onto a clean HTML5 canvas buffer
     * @param {File|Blob} imageFile
     * @param {string} format Target format (image/png or image/jpeg)
     * @param {number} quality JPEG quality (0.1 - 1.0)
     * @returns {Promise<Blob>} Cleaned image Blob without any EXIF/GPS tags
     */
    async function scrubImageMetadata(imageFile, format = 'image/png', quality = 0.95) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(imageFile);

            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                canvas.toBlob(blob => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to encode clean image buffer'));
                    }
                }, format, quality);
            };

            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Failed to load image for metadata scrubbing'));
            };

            img.src = objectUrl;
        });
    }

    return {
        readPdfMetadata: readPdfMetadata,
        scrubPdfMetadata: scrubPdfMetadata,
        scrubImageMetadata: scrubImageMetadata
    };
})();
