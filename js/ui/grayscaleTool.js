/**
 * iZeroPDF - Grayscale & Monochrome Tool UI Controller
 * Swiss Minimalist Design System
 */

function renderGrayscaleTool() {
    const container = document.getElementById('toolContent');
    const pageHome = document.getElementById('page-home') || document.getElementById('home');
    if (pageHome) pageHome.style.display = 'none';
    if (!container) return;
    container.style.display = 'block';
    container.style.visibility = 'visible';
    container.style.opacity = '1';

    let currentFile = null;
    let originalSize = 0;
    let convertedPdfBytes = null;

    container.innerHTML = `
        <div class="tool-workspace">
            <div class="tool-header">
                <button class="btn btn-secondary btn-sm" id="backToHomeBtn">
                    <span class="material-symbols-outlined">arrow_back</span> Back
                </button>
                <div class="tool-title-group">
                    <span class="tool-index">04 / PRINT OPTIMIZER</span>
                    <h2>Grayscale & Monochrome PDF</h2>
                    <p>Convert color documents to high-contrast grayscale or pure black & white to save toner and reduce file size.</p>
                </div>
            </div>

            <div class="tool-main-grid" style="display: grid; grid-template-columns: 1fr; gap: 24px; max-width: 960px; margin: 0 auto;">
                <!-- Upload Dropzone -->
                <div class="upload-dropzone" id="grayscaleDropzone" style="border: 2px dashed var(--dp-color-ink); padding: 48px 24px; text-align: center; cursor: pointer; background: var(--dp-color-surface);">
                    <span class="material-symbols-outlined" style="font-size: 48px; margin-bottom: 12px; display: block;">print</span>
                    <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Select or Drop PDF Document</h3>
                    <p style="font-size: 14px; opacity: 0.7; margin-bottom: 16px;">Files are processed 100% locally in your browser. Nothing is uploaded.</p>
                    <button class="btn btn-primary" type="button" id="browseBtn">Browse Files</button>
                    <input type="file" id="grayscaleFileInput" accept=".pdf,application/pdf" style="display: none;">
                </div>

                <!-- Controls & Preview Panel (Hidden initially) -->
                <div id="grayscalePanel" style="display: none; border: 2px solid var(--dp-color-ink); padding: 24px; background: var(--dp-color-ground);">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--dp-color-ink); padding-bottom: 16px; margin-bottom: 20px;">
                        <div>
                            <strong id="pdfFileName" style="font-size: 16px; display: block;">document.pdf</strong>
                            <span id="pdfFileSize" style="font-size: 13px; opacity: 0.7;">0 KB</span>
                        </div>
                        <button class="btn btn-secondary btn-sm" id="changeFileBtn">Change File</button>
                    </div>

                    <!-- Optimization Settings -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 24px;">
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Optimization Mode</label>
                            <select id="grayscaleMode" style="width: 100%; padding: 10px; border: 2px solid var(--dp-color-ink); background: var(--dp-color-ground); font-weight: 700;">
                                <option value="grayscale">Grayscale (256 Shades of Gray)</option>
                                <option value="monochrome">Pure Monochrome (High-Contrast B&W)</option>
                            </select>
                            <small style="display: block; margin-top: 6px; font-size: 12px; opacity: 0.75;">Grayscale preserves photos; Monochrome saves maximum toner for forms/text.</small>
                        </div>

                        <div id="thresholdGroup" style="display: none;">
                            <label style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">
                                <span>B&W Contrast Threshold</span>
                                <span id="threshVal">128</span>
                            </label>
                            <input type="range" id="thresholdSlider" min="50" max="220" value="128" style="width: 100%;">
                            <small style="display: block; margin-top: 6px; font-size: 12px; opacity: 0.75;">Higher values darken light text; lower values clear background scan noise.</small>
                        </div>

                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Export Quality</label>
                            <select id="qualitySelect" style="width: 100%; padding: 10px; border: 2px solid var(--dp-color-ink); background: var(--dp-color-ground); font-weight: 700;">
                                <option value="0.85">Balanced Print (85% Quality)</option>
                                <option value="0.95">High Definition Archival (95% Quality)</option>
                                <option value="0.65">Maximum Compression (65% Quality)</option>
                            </select>
                        </div>
                    </div>

                    <!-- Progress Rail -->
                    <div id="progressContainer" style="display: none; margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; margin-bottom: 6px;">
                            <span id="progressStatus">Converting pages...</span>
                            <span id="progressPercent">0%</span>
                        </div>
                        <div style="height: 8px; width: 100%; background: var(--dp-color-surface); border: 1px solid var(--dp-color-ink);">
                            <div id="progressBar" style="height: 100%; width: 0%; background: var(--dp-color-ink); transition: width 0.15s ease;"></div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div style="display: flex; gap: 12px; align-items: center; justify-content: flex-end;">
                        <button class="btn btn-primary" id="startConvertBtn" style="min-width: 200px;">
                            <span class="material-symbols-outlined">tune</span> Convert to Grayscale
                        </button>
                    </div>

                    <!-- Result Panel -->
                    <div id="resultPanel" style="display: none; margin-top: 24px; padding-top: 24px; border-top: 2px solid var(--dp-color-ink);">
                        <div style="background: var(--dp-color-surface); padding: 16px; margin-bottom: 16px; border: 1px solid var(--dp-color-ink); display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span style="font-size: 12px; text-transform: uppercase; font-weight: 700; display: block; color: #15803d;">✔ Optimization Complete</span>
                                <span id="sizeComparison" style="font-size: 14px; font-weight: 700;">Reduced from 0 KB to 0 KB</span>
                            </div>
                            <button class="btn btn-primary" id="downloadGrayscaleBtn">
                                <span class="material-symbols-outlined">download</span> Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Elements
    const backBtn = document.getElementById('backToHomeBtn');
    const dropzone = document.getElementById('grayscaleDropzone');
    const fileInput = document.getElementById('grayscaleFileInput');
    const browseBtn = document.getElementById('browseBtn');
    const panel = document.getElementById('grayscalePanel');
    const changeFileBtn = document.getElementById('changeFileBtn');
    const modeSelect = document.getElementById('grayscaleMode');
    const thresholdGroup = document.getElementById('thresholdGroup');
    const thresholdSlider = document.getElementById('thresholdSlider');
    const threshVal = document.getElementById('threshVal');
    const qualitySelect = document.getElementById('qualitySelect');
    const startConvertBtn = document.getElementById('startConvertBtn');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressStatus = document.getElementById('progressStatus');
    const progressPercent = document.getElementById('progressPercent');
    const resultPanel = document.getElementById('resultPanel');
    const sizeComparison = document.getElementById('sizeComparison');
    const downloadBtn = document.getElementById('downloadGrayscaleBtn');

    // Navigation
    backBtn.addEventListener('click', () => {
        if (typeof Router !== 'undefined') Router.navigate('home');
    });

    // Drag and Drop
    browseBtn.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('click', (e) => {
        if (e.target !== browseBtn) fileInput.click();
    });

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.background = '#e5e5e5';
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.style.background = 'var(--dp-color-surface)';
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.background = 'var(--dp-color-surface)';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    });

    changeFileBtn.addEventListener('click', () => {
        currentFile = null;
        convertedPdfBytes = null;
        fileInput.value = '';
        panel.style.display = 'none';
        dropzone.style.display = 'block';
        resultPanel.style.display = 'none';
    });

    modeSelect.addEventListener('change', () => {
        thresholdGroup.style.display = modeSelect.value === 'monochrome' ? 'block' : 'none';
    });

    thresholdSlider.addEventListener('input', () => {
        threshVal.textContent = thresholdSlider.value;
    });

    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(2) + ' MB';
    }

    function handleFileSelect(file) {
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            alert('Please select a valid PDF document.');
            return;
        }

        currentFile = file;
        originalSize = file.size;

        document.getElementById('pdfFileName').textContent = file.name;
        document.getElementById('pdfFileSize').textContent = formatBytes(file.size);

        dropzone.style.display = 'none';
        panel.style.display = 'block';
        resultPanel.style.display = 'none';
    }

    startConvertBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        startConvertBtn.disabled = true;
        progressContainer.style.display = 'block';
        resultPanel.style.display = 'none';

        const mode = modeSelect.value;
        const threshold = parseInt(thresholdSlider.value, 10);
        const quality = parseFloat(qualitySelect.value);

        try {
            convertedPdfBytes = await GrayscaleEngine.convertPdfToGrayscale(currentFile, {
                mode: mode,
                threshold: threshold,
                quality: quality,
                scale: 2.0,
                onProgress: (current, total, statusText) => {
                    const pct = Math.round((current / total) * 100);
                    progressBar.style.width = pct + '%';
                    progressPercent.textContent = pct + '%';
                    progressStatus.textContent = statusText;
                }
            });

            // Show result
            const newSize = convertedPdfBytes.length;
            const diff = originalSize - newSize;
            const pctReduced = ((diff / originalSize) * 100).toFixed(1);

            let diffText = '';
            if (diff > 0) {
                diffText = `Reduced from ${formatBytes(originalSize)} to ${formatBytes(newSize)} (-${pctReduced}%)`;
            } else {
                diffText = `Processed: ${formatBytes(newSize)} (High-contrast print ready)`;
            }

            sizeComparison.textContent = diffText;
            resultPanel.style.display = 'block';
            if (typeof window.incrementFileCount === 'function') {
                window.incrementFileCount();
            }
        } catch (err) {
            console.error('Grayscale conversion error:', err);
            alert('Error converting PDF: ' + err.message);
        } finally {
            startConvertBtn.disabled = false;
            progressContainer.style.display = 'none';
        }
    });

    downloadBtn.addEventListener('click', () => {
        if (!convertedPdfBytes) return;
        const blob = new Blob([convertedPdfBytes], { type: 'application/pdf' });
        const originalName = currentFile ? currentFile.name.replace(/\.pdf$/i, '') : 'document';
        const outName = `${originalName}-${modeSelect.value}.pdf`;
        saveAs(blob, outName);
    });
}

if (typeof window !== 'undefined') {
    window.renderGrayscaleTool = renderGrayscaleTool;
}
