/**
 * Crop Tool - UI Controller
 */
const CropToolController = (function() {
    'use strict';

    let currentImage = null;
    let croppedCanvas = null;

    /**
     * Render the tool UI
     */
    function render() {
        const container = document.getElementById('toolContent');
        if (!container) return;

        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-header">
                    <h2>✂️ Crop Image</h2>
                    <p>Select an area to crop from your image</p>
                </div>

                <div class="upload-area" id="cropUploadArea">
                    <input type="file" id="cropFileInput" accept="image/*">
                    <div class="upload-icon material-symbols-outlined">upload_file</div>
                    <div class="upload-text">Drop an image here or click to browse</div>
                    <div class="upload-hint">Click and drag on the image to select crop area</div>
                </div>

                <div id="cropFileInfo" class="file-info" style="display: none;">
                    <span id="cropFileDetails"></span>
                </div>

                <div class="crop-workspace" style="display: none;">
                    <div class="canvas-wrapper">
                        <canvas id="cropCanvas"></canvas>
                    </div>
                </div>

                <div class="settings-group" id="cropSettings" style="display: none;">
                    <div class="settings-row">
                        <label class="setting-label">
                            <span class="material-symbols-outlined">tune</span> Crop Coordinates
                        </label>
                        <div class="coordinate-grid">
                            <div class="coord-input">
                                <span>X</span>
                                <input type="number" id="cropX" value="0" min="0">
                            </div>
                            <div class="coord-input">
                                <span>Y</span>
                                <input type="number" id="cropY" value="0" min="0">
                            </div>
                            <div class="coord-input">
                                <span>Width</span>
                                <input type="number" id="cropWidth" value="100" min="1">
                            </div>
                            <div class="coord-input">
                                <span>Height</span>
                                <input type="number" id="cropHeight" value="100" min="1">
                            </div>
                        </div>
                    </div>
                    <div class="settings-row" style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px;">
                        <label class="setting-checkbox">
                            <input type="checkbox" id="aspectLock">
                            <span class="material-symbols-outlined">lock</span> Lock Aspect Ratio
                        </label>
                        <label class="setting-checkbox">
                            <input type="checkbox" id="showGrid" checked>
                            <span class="material-symbols-outlined">grid_on</span> Show Grid
                        </label>
                    </div>
                </div>

                <div class="result-actions" id="cropActions" style="display: none; gap: 12px; flex-wrap: wrap; margin-top: 20px;">
                    <button class="btn btn-primary btn-lg" id="applyCropBtn" style="flex: 1; min-width: 150px;">
                        <span class="material-symbols-outlined">crop</span> Apply Crop
                    </button>
                    <button class="btn btn-secondary btn-lg" id="resetCropBtn" style="flex: 1; min-width: 150px;">
                        <span class="material-symbols-outlined">refresh</span> Reset
                    </button>
                    <button class="btn btn-success btn-lg" id="downloadCropBtn" disabled style="flex: 1; min-width: 150px;">
                        <span class="material-symbols-outlined">download</span> Download Cropped
                    </button>
                </div>

                <div id="cropInfo" class="crop-info" style="display: none;">
                    Click and drag on the image to select the crop area.
                </div>

                <div class="preview-area" id="cropPreview" style="display: none; margin-top: 32px;">
                    <h4 style="margin-bottom: 16px; font-weight: 600;">Cropped Result</h4>
                    <div id="cropResult" style="text-align: center; background: var(--md-sys-color-surface-container, #f9fafb); padding: 20px; border-radius: 12px; border: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);">
                    </div>
                </div>
            </div>
        `;

        attachEvents();
    }

    /**
     * Attach event listeners
     */
    function attachEvents() {
        const fileInput = document.getElementById('cropFileInput');
        const uploadArea = document.getElementById('cropUploadArea');
        const applyBtn = document.getElementById('applyCropBtn');
        const resetBtn = document.getElementById('resetCropBtn');
        const downloadBtn = document.getElementById('downloadCropBtn');
        const canvas = document.getElementById('cropCanvas');
        
        // Coordinate inputs
        const xInput = document.getElementById('cropX');
        const yInput = document.getElementById('cropY');
        const widthInput = document.getElementById('cropWidth');
        const heightInput = document.getElementById('cropHeight');
        const aspectLock = document.getElementById('aspectLock');
        const showGrid = document.getElementById('showGrid');

        // File input
        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                const file = this.files[0];
                if (file && Validators.isImage(file)) {
                    loadImage(file);
                } else {
                    showToast('error', 'Please upload a valid image');
                }
            });
        }

        // Drag and drop
        if (uploadArea) {
            uploadArea.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.classList.add('dragover');
            });
            uploadArea.addEventListener('dragleave', function(e) {
                e.preventDefault();
                this.classList.remove('dragover');
            });
            uploadArea.addEventListener('drop', function(e) {
                e.preventDefault();
                this.classList.remove('dragover');
                const file = e.dataTransfer.files[0];
                if (file && Validators.isImage(file)) {
                    loadImage(file);
                }
            });
        }

        // Apply crop
        if (applyBtn) {
            applyBtn.addEventListener('click', applyCrop);
        }

        // Reset crop
        if (resetBtn) {
            resetBtn.addEventListener('click', resetCrop);
        }

        // Download cropped
        if (downloadBtn) {
            downloadBtn.addEventListener('click', downloadCropped);
        }

        // Coordinate inputs
        if (xInput && yInput && widthInput && heightInput) {
            const updateCrop = function() {
                const x = parseInt(xInput.value) || 0;
                const y = parseInt(yInput.value) || 0;
                const w = parseInt(widthInput.value) || 100;
                const h = parseInt(heightInput.value) || 100;
                if (currentImage && canvas && typeof CropEngine.setCropFromCoordinates === 'function') {
                    CropEngine.setCropFromCoordinates(x, y, w, h);
                }
            };

            xInput.addEventListener('change', updateCrop);
            yInput.addEventListener('change', updateCrop);
            widthInput.addEventListener('change', function() {
                if (aspectLock && aspectLock.checked) {
                    // Maintain aspect ratio
                    const ratio = parseInt(widthInput.value) / parseInt(heightInput.value);
                    // This would need to be implemented
                }
                updateCrop();
            });
            heightInput.addEventListener('change', function() {
                if (aspectLock && aspectLock.checked) {
                    // Maintain aspect ratio
                }
                updateCrop();
            });
        }

        // Show grid
        if (showGrid) {
            showGrid.addEventListener('change', function() {
                if (this.checked) {
                    drawGrid();
                } else {
                    // Redraw without grid
                    if (currentImage) {
                        CropEngine.initCrop(canvas, currentImage);
                    }
                }
            });
        }
    }

    /**
     * Load image for cropping
     */
    async function loadImage(file) {
        try {
            currentImage = await FileHelpers.loadImage(file);
            const canvas = document.getElementById('cropCanvas');
            if (canvas) {
                CropEngine.initCrop(canvas, currentImage);
                
                // Show workspace and settings
                document.querySelector('.crop-workspace').style.display = 'block';
                document.getElementById('cropSettings').style.display = 'block';
                document.getElementById('cropActions').style.display = 'flex';
                document.getElementById('cropInfo').style.display = 'flex';
                
                // Update file info
                const infoDiv = document.getElementById('cropFileInfo');
                const details = document.getElementById('cropFileDetails');
                if (infoDiv && details) {
                    infoDiv.style.display = 'block';
                    details.textContent = '🖼️ ' + file.name + ' (' + FileHelpers.formatFileSize(file.size) + ')';
                }
                
                showToast('success', 'Image loaded. Click and drag to select crop area.');
            }
            
            document.getElementById('downloadCropBtn').disabled = true;
            document.getElementById('cropPreview').style.display = 'none';
        } catch (error) {
            console.error('Error loading image:', error);
            showToast('error', 'Failed to load image: ' + error.message);
        }
    }

    /**
     * Draw grid overlay
     */
    function drawGrid() {
        const canvas = document.getElementById('cropCanvas');
        if (!canvas || !currentImage) return;
        const ctx = canvas.getContext('2d');
        const rect = CropEngine.getCropCoordinates();
        if (rect) {
            const { x, y, width, height } = rect;
            const gridSize = 20;
            // Draw grid lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            for (let gx = x; gx < x + width; gx += gridSize) {
                ctx.beginPath();
                ctx.moveTo(gx, y);
                ctx.lineTo(gx, y + height);
                ctx.stroke();
            }
            for (let gy = y; gy < y + height; gy += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, gy);
                ctx.lineTo(x + width, gy);
                ctx.stroke();
            }
        }
    }

    /**
     * Apply crop
     */
    function applyCrop() {
        try {
            croppedCanvas = CropEngine.executeCrop();
            if (croppedCanvas) {
                // Show result
                const preview = document.getElementById('cropPreview');
                const result = document.getElementById('cropResult');
                if (preview && result) {
                    preview.style.display = 'block';
                    result.innerHTML = '';
                    const img = document.createElement('img');
                    img.src = croppedCanvas.toDataURL('image/png');
                    img.style.maxWidth = '100%';
                    img.style.maxHeight = '400px';
                    result.appendChild(img);
                }
                // Enable download
                document.getElementById('downloadCropBtn').disabled = false;
                showToast('success', 'Crop applied successfully');
            }
        } catch (error) {
            console.error('Crop error:', error);
            showToast('error', 'Crop failed: ' + error.message);
        }
    }

    /**
     * Reset crop
     */
    function resetCrop() {
        if (currentImage) {
            const canvas = document.getElementById('cropCanvas');
            CropEngine.initCrop(canvas, currentImage);
            document.getElementById('cropPreview').style.display = 'none';
            document.getElementById('downloadCropBtn').disabled = true;
            croppedCanvas = null;
            showToast('info', 'Crop selection reset');
        }
    }

    /**
     * Download cropped image
     */
    function downloadCropped() {
        if (!croppedCanvas) {
            showToast('warning', 'Please apply crop first');
            return;
        }
        const format = 'image/png';
        const quality = 0.92;
        const dataURL = croppedCanvas.toDataURL(format, quality);
        const link = document.createElement('a');
        link.download = 'cropped_' + Date.now() + '.png';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('success', 'Cropped image downloaded');
    }

    // Public API
    return {
        render: render
    };
})();

window.CropToolController = CropToolController;