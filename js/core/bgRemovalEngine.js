/**
 * Background Removal Engine
 * Client-Side Background Segmentation and Transparency Extraction
 * 100% Client-Side, Zero Server Calls, 100% Private
 */
const BgRemovalEngine = (function() {
    'use strict';

    /**
     * Removes solid/light backgrounds from signatures, logos, and photos
     * using adaptive color-distance thresholding on canvas pixel buffers
     * @param {File|Blob|HTMLImageElement} imageSource
     * @param {Object} options - { targetColor: [r,g,b], tolerance: 0-100, smooth: boolean }
     * @returns {Promise<Blob>} Transparent PNG blob
     */
    async function removeBackground(imageSource, options = {}) {
        const targetColor = options.targetColor || [255, 255, 255]; // default white
        const tolerance = options.tolerance !== undefined ? options.tolerance : 35; // default tolerance
        const smooth = options.smooth !== false;

        return new Promise((resolve, reject) => {
            const img = new Image();
            let objectUrl = null;

            if (imageSource instanceof File || imageSource instanceof Blob) {
                objectUrl = URL.createObjectURL(imageSource);
                img.src = objectUrl;
            } else if (typeof imageSource === 'string') {
                img.src = imageSource;
            } else if (imageSource instanceof HTMLImageElement) {
                img.src = imageSource.src;
            }

            img.onload = () => {
                if (objectUrl) URL.revokeObjectURL(objectUrl);

                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');

                ctx.drawImage(img, 0, 0);

                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imgData.data;

                const tr = targetColor[0];
                const tg = targetColor[1];
                const tb = targetColor[2];

                // Max Euclidean distance in RGB space is ~441.67
                const threshold = (tolerance / 100) * 441.67;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    // Euclidean color distance
                    const dist = Math.sqrt(
                        (r - tr) * (r - tr) +
                        (g - tg) * (g - tg) +
                        (b - tb) * (b - tb)
                    );

                    if (dist < threshold) {
                        if (smooth && dist > threshold * 0.7) {
                            // Feathered alpha transition for soft edges
                            const factor = (dist - threshold * 0.7) / (threshold * 0.3);
                            data[i + 3] = Math.round(data[i + 3] * factor);
                        } else {
                            data[i + 3] = 0; // Fully transparent
                        }
                    }
                }

                ctx.putImageData(imgData, 0, 0);

                canvas.toBlob(blob => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to encode transparent PNG'));
                    }
                }, 'image/png');
            };

            img.onerror = () => {
                if (objectUrl) URL.revokeObjectURL(objectUrl);
                reject(new Error('Failed to load image for background removal'));
            };
        });
    }

    return {
        removeBackground: removeBackground
    };
})();
