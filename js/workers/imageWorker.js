/**
 * iZeroPDF - Background Multi-Threaded Image & Pixel Processing Worker
 * Runs heavy pixel manipulation off the main UI thread via Web Worker
 */

self.onmessage = function(e) {
    const { action, imageData, options, id } = e.data;

    try {
        let resultData = imageData;

        if (action === 'grayscale') {
            const data = imageData.data;
            const len = data.length;
            const isThreshold = options && options.mode === 'monochrome';
            const thresh = options && typeof options.threshold === 'number' ? options.threshold : 128;

            for (let i = 0; i < len; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const gray = (0.299 * r + 0.587 * g + 0.114 * b);

                if (isThreshold) {
                    const val = gray >= thresh ? 255 : 0;
                    data[i] = val;
                    data[i + 1] = val;
                    data[i + 2] = val;
                } else {
                    data[i] = gray;
                    data[i + 1] = gray;
                    data[i + 2] = gray;
                }
            }
            resultData = imageData;
        } else if (action === 'removeBackground') {
            const data = imageData.data;
            const len = data.length;
            const targetColor = (options && options.targetColor) || { r: 255, g: 255, b: 255 };
            const tolerance = (options && options.tolerance) || 30;
            const feather = (options && options.feather) || 15;

            for (let i = 0; i < len; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                const dr = r - targetColor.r;
                const dg = g - targetColor.g;
                const db = b - targetColor.b;
                const dist = Math.sqrt(dr * dr + dg * dg + db * db);

                if (dist <= tolerance) {
                    data[i + 3] = 0;
                } else if (dist < tolerance + feather) {
                    const factor = (dist - tolerance) / feather;
                    data[i + 3] = Math.round(data[i + 3] * factor);
                }
            }
            resultData = imageData;
        }

        self.postMessage({ id, status: 'success', imageData: resultData });
    } catch (err) {
        self.postMessage({ id, status: 'error', error: err.message });
    }
};
