/**
 * Client-Side OCR Engine
 * Extracts text from scanned PDFs and images using Tesseract.js (Wasm)
 * 100% Client-Side, Zero Server Calls, 100% Private
 */
const OcrEngine = (function() {
    'use strict';

    let worker = null;
    let currentLanguage = null;

    /**
     * Initializes or reuses the Tesseract worker
     * @param {string} lang Language code (e.g. 'eng')
     * @param {Function} onProgress Progress callback ({ status, progress })
     */
    async function getWorker(lang = 'eng', onProgress = null) {
        if (typeof Tesseract === 'undefined') {
            throw new Error('Tesseract.js OCR library is not loaded');
        }

        if (worker && currentLanguage === lang) {
            return worker;
        }

        if (worker) {
            await worker.terminate();
            worker = null;
        }

        worker = await Tesseract.createWorker(lang, 1, {
            logger: (m) => {
                if (typeof onProgress === 'function') {
                    onProgress(m);
                }
            }
        });

        currentLanguage = lang;
        return worker;
    }

    /**
     * Performs OCR on an image source (Canvas, Image element, File, or Blob)
     * @param {Canvas|HTMLImageElement|File|Blob|string} imageSource
     * @param {string} lang
     * @param {Function} onProgress
     * @returns {Promise<Object>} Recognized text, confidence, words, and lines
     */
    async function recognizeImage(imageSource, lang = 'eng', onProgress = null) {
        const ocrWorker = await getWorker(lang, onProgress);
        const result = await ocrWorker.recognize(imageSource);
        
        return {
            text: result.data.text || '',
            confidence: Math.round(result.data.confidence || 0),
            lines: result.data.lines || [],
            words: result.data.words || []
        };
    }

    /**
     * Performs OCR on a specific page of a PDF document
     * @param {ArrayBuffer} pdfBuffer
     * @param {number} pageNumber 1-indexed page number
     * @param {string} lang
     * @param {Function} onProgress
     * @returns {Promise<Object>}
     */
    async function recognizePdfPage(pdfBuffer, pageNumber = 1, lang = 'eng', onProgress = null) {
        if (typeof pdfjsLib === 'undefined') {
            throw new Error('PDF.js library is not loaded');
        }

        if (typeof onProgress === 'function') {
            onProgress({ status: 'rendering_page', progress: 0.1 });
        }

        const bufferCopy = (pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer)).slice();
        const loadingTask = pdfjsLib.getDocument({ data: bufferCopy });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(pageNumber);

        // Render at high resolution (scale 2.0) for optimal OCR character clarity
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({
            canvasContext: ctx,
            viewport: viewport
        }).promise;

        if (typeof onProgress === 'function') {
            onProgress({ status: 'running_ocr', progress: 0.25 });
        }

        return await recognizeImage(canvas, lang, onProgress);
    }

    /**
     * Terminates any active worker to release WebAssembly memory
     */
    async function terminate() {
        if (worker) {
            await worker.terminate();
            worker = null;
            currentLanguage = null;
        }
    }

    return {
        recognizeImage: recognizeImage,
        recognizePdfPage: recognizePdfPage,
        terminate: terminate
    };
})();
