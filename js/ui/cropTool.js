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

        // ✅ REMOVED: <section class="page active"> wrapper
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

                <div style="margin: 15px 0; position: relative;">
                    <canvas id="cropCanvas" style="width:100%;max-width:800px;cursor:crosshair;border:1px solid #ddd;border-radius:8px;"></canvas>
                </div>

                <div class="settings-group">
                    <label>
                        <span class="material-symbols-outlined">horizontal_rule</span>
                        X: <input type="number" id="cropX" value="0" style="width:70px;">
                    </label>
                    <label>
                        <span class="material-symbols-outlined">vertical_align_bottom</span>
                        Y: <input type="number" id="cropY" value="0" style="width:70px;">
                    </label>
                    <label>
                        <span class="material-symbols-outlined">width</span>
                        Width: <input type="number" id="cropWidth" value="100" style="width:70px;">
                    </label>
                    <label>
                        <span class="material-symbols-outlined">height</span>
                        Height: <input type="number" id="cropHeight" value="100" style="width:70px;">
                    </label>
                    <label>
                        <input type="checkbox" id="aspectLock">
                        <span class="material-symbols-outlined">lock</span> Lock Aspect
                    </label>
                    <label>
                        <input type="checkbox" id="showGrid">
                        <span class="material-symbols-outlined">grid_on</span> Show Grid
                    </label>
                </div>

                <div class="result-actions" style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn btn-primary" id="applyCropBtn">
                        <span class="material-symbols-outlined">crop</span> Apply Crop
                    </button>
                    <button class="btn btn-secondary" id="resetCropBtn">
                        <span class="material-symbols-outlined">refresh</span> Reset
                    </button>
                    <button class="btn btn-success" id="downloadCropBtn" disabled>
                        <span class="material-symbols-outlined">download</span> Download Cropped
                    </button>
                </div>

                <div id="cropInfo" class="crop-info">
                    No selection made. Click and drag on the image to select crop area.
                </div>

                <div class="preview-area" id="cropPreview" style="display: none;">
                    <h4>Cropped Result</h4>
                    <div id="cropResult"></div>
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
                
                if (currentImage && canvas) {
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
                showToast('success', 'Image loaded. Click and drag to select crop area.');
            }

            // Enable download button (will be enabled after crop)
            document.getElementById('downloadCropBtn').disabled = true;
            
            // Hide previous result
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