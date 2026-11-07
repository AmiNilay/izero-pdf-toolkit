/**
 * Background Removal Tool - UI Controller
 * Client-Side Transparency Extraction & Signature Cleaning
 * Swiss Minimalist Design System Compliant
 */

const BgRemovalToolController = (function() {
    'use strict';

    let currentFile = null;
    let originalImageEl = null;
    let processedBlob = null;

    function render() {
        const container = document.getElementById('toolContent');
        if (!container) return;

        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-header">
                    <h2>✂️ Remove Background</h2>
                    <p>Extract transparent signatures, logos, and graphics directly in your browser</p>
                </div>

                <div class="upload-area" id="bgUploadArea">
                    <input type="file" id="bgFileInput" accept="image/png,image/jpeg,image/webp,image/bmp">
                    <div class="upload-icon material-symbols-outlined">auto_fix_high</div>
                    <div class="upload-text">Drop an Image here or click to browse</div>
                    <div class="upload-hint">Extract transparent signatures, logos & portraits • 100% Client-Side</div>
                </div>

                <div id="bgWorkspace" style="display: none;">
                    <div class="file-info" id="bgFileInfo">
                        <span id="bgFileName"></span>
                    </div>

                    <!-- Settings Controls -->
                    <div class="settings-group" style="flex-direction: column; align-items: stretch;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--dp-color-ink); padding-bottom: 12px; margin-bottom: 16px;">
                            <strong style="text-transform: uppercase; font-size: 14px; letter-spacing: 0.05em;">Segmentation Settings</strong>
                            <span style="font-size: 11px; font-weight: 700; background: var(--dp-color-surface); border: 1px solid var(--dp-color-ink); padding: 2px 8px;">Adaptive Canvas</span>
                        </div>

                        <div style="display: flex; gap: 24px; flex-wrap: wrap; align-items: center;">
                            <div>
                                <label class="setting-label">Target Background:</label>
                                <select id="bgTargetPreset" class="setting-select" style="min-width: 180px;">
                                    <option value="white" selected>White / Paper Background</option>
                                    <option value="black">Black / Dark Background</option>
                                    <option value="custom">Custom Color Picker</option>
                                </select>
                            </div>

                            <div id="bgCustomColorWrapper" style="display: none;">
                                <label class="setting-label">Pick Color:</label>
                                <input type="color" id="bgCustomColorInput" value="#ffffff" style="width: 50px; height: 38px; border: 2px solid var(--dp-color-ink); cursor: pointer;">
                            </div>

                            <div style="flex: 1; min-width: 200px;">
                                <label class="setting-label">Removal Tolerance: <span id="bgToleranceVal" style="font-family: monospace;">35%</span></label>
                                <input type="range" id="bgToleranceSlider" min="5" max="85" value="35" class="slider" style="width: 100%;">
                            </div>
                        </div>
                    </div>

                    <!-- Live Transparent Checkerboard Preview -->
                    <div class="settings-group" style="flex-direction: column; align-items: center; padding: 24px;">
                        <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <strong style="text-transform: uppercase; font-size: 13px; letter-spacing: 0.05em;">Transparent Canvas Output</strong>
                            <span style="font-size: 11px; font-weight: 700; background: var(--dp-color-accent); color: #ffffff; padding: 2px 8px;">PNG 32-bit Alpha</span>
                        </div>

                        <div style="max-width: 100%; max-height: 55vh; overflow: auto; border: 2px solid var(--dp-color-ink); background-image: linear-gradient(45deg, #e5e5e5 25%, transparent 25%), linear-gradient(-45deg, #e5e5e5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e5e5 75%), linear-gradient(-45deg, transparent 75%, #e5e5e5 75%); background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px; padding: 16px; display: flex; justify-content: center;">
                            <img id="bgOutputPreviewImg" style="max-width: 100%; max-height: 45vh; object-fit: contain; display: block;">
                        </div>
                    </div>

                    <div style="margin-top: 24px; display: flex; gap: 14px; flex-wrap: wrap;">
                        <button type="button" class="btn btn-primary btn-lg" id="btnDownloadTransparentPng">
                            <span class="material-symbols-outlined">download</span> Download Transparent PNG
                        </button>
                        <button type="button" class="btn btn-secondary btn-lg" id="btnBgReset">
                            <span class="material-symbols-outlined">refresh</span> Reset
                        </button>
                    </div>

                    <div class="progress-container" id="bgProgress">
                        <div class="progress-bar" id="bgProgressBar"></div>
                        <div class="progress-text" id="bgProgressText">Extracting transparent foreground...</div>
                    </div>
                </div>
            </div>
        `;

        initEvents();
    }

    function initEvents() {
        const fileInput = document.getElementById('bgFileInput');
        const uploadArea = document.getElementById('bgUploadArea');

        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.borderStyle = 'solid';
            });
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.style.borderStyle = 'dashed';
            });
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.style.borderStyle = 'dashed';
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    loadImage(e.dataTransfer.files[0]);
                }
            });
            fileInput.addEventListener('change', function() {
                if (this.files && this.files[0]) {
                    loadImage(this.files[0]);
                }
            });
        }

        const presetSelect = document.getElementById('bgTargetPreset');
        const customWrapper = document.getElementById('bgCustomColorWrapper');
        if (presetSelect && customWrapper) {
            presetSelect.onchange = () => {
                customWrapper.style.display = presetSelect.value === 'custom' ? 'block' : 'none';
                applyBackgroundRemoval();
            };
        }

        const customColorInput = document.getElementById('bgCustomColorInput');
        if (customColorInput) customColorInput.oninput = applyBackgroundRemoval;

        const slider = document.getElementById('bgToleranceSlider');
        const sliderVal = document.getElementById('bgToleranceVal');
        if (slider && sliderVal) {
            slider.oninput = () => {
                sliderVal.textContent = slider.value + '%';
                applyBackgroundRemoval();
            };
        }

        const downloadBtn = document.getElementById('btnDownloadTransparentPng');
        if (downloadBtn) {
            downloadBtn.onclick = () => {
                if (!processedBlob || !currentFile) return;
                const outName = currentFile.name.replace(/\.[^/.]+$/, '') + '-transparent.png';
                saveAs(processedBlob, outName);
                if (typeof incrementFileCount === 'function') incrementFileCount();
                if (typeof showToast === 'function') showToast('success', 'Transparent PNG downloaded!');
            };
        }

        const resetBtn = document.getElementById('btnBgReset');
        if (resetBtn) resetBtn.addEventListener('click', render);
    }

    function loadImage(file) {
        if (!file || !file.type.startsWith('image/')) {
            if (typeof showToast === 'function') showToast('error', 'Please upload a valid image file.');
            return;
        }

        currentFile = file;
        const uploadArea = document.getElementById('bgUploadArea');
        const workspace = document.getElementById('bgWorkspace');
        const fileNameEl = document.getElementById('bgFileName');

        if (uploadArea) uploadArea.style.display = 'none';
        if (workspace) workspace.style.display = 'block';
        if (fileNameEl) {
            fileNameEl.textContent = 'Image: ' + file.name + ' (' + FileHelpers.formatFileSize(file.size) + ')';
        }

        originalImageEl = new Image();
        originalImageEl.onload = () => {
            applyBackgroundRemoval();
        };
        originalImageEl.src = URL.createObjectURL(file);
    }

    async function applyBackgroundRemoval() {
        if (!originalImageEl) return;

        const preset = document.getElementById('bgTargetPreset').value;
        const tolerance = parseInt(document.getElementById('bgToleranceSlider').value) || 35;
        let targetColor = [255, 255, 255];

        if (preset === 'black') {
            targetColor = [0, 0, 0];
        } else if (preset === 'custom') {
            const hex = document.getElementById('bgCustomColorInput').value;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            targetColor = [r, g, b];
        }

        try {
            processedBlob = await BgRemovalEngine.removeBackground(originalImageEl, {
                targetColor: targetColor,
                tolerance: tolerance,
                smooth: true
            });

            const previewImg = document.getElementById('bgOutputPreviewImg');
            if (previewImg) {
                previewImg.src = URL.createObjectURL(processedBlob);
            }
        } catch (err) {
            console.error('Background removal failed:', err);
        }
    }

    return {
        render: render
    };
})();
