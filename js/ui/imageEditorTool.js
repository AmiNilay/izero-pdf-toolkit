/**
 * Image Editor - UI Controller
 * Features: Circle Crop, Square Crop, Round Corners, Rotate, Flip, Watermark
 */

const ImageEditorToolController = (function() {
    'use strict';

    let currentImage = null;
    let originalImage = null;
    let editedCanvas = null;
    let originalFile = null;

    // Watermark settings
    let watermarkText = 'iZeroPDF';
    let watermarkPosition = 'center';

    function render() {
        var container = document.getElementById('toolContent');
        if (!container) return;

        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-header">
                    <h2>🎨 Image Editor</h2>
                    <p>Circle Crop, Square Crop, Round Corners, Rotate, Flip, Watermark</p>
                </div>

                <div class="upload-area" id="editorUploadArea">
                    <input type="file" id="editorFileInput" accept="image/*">
                    <div class="upload-icon material-symbols-outlined">upload_file</div>
                    <div class="upload-text">Drop an image here or click to browse</div>
                    <div class="upload-hint">Supports JPG, PNG, WebP, BMP, GIF</div>
                </div>

                <div id="editorFileInfo" class="file-info" style="display: none;">
                    <span id="editorFileDetails"></span>
                </div>

                <!-- Image Preview -->
                <div class="preview-area" id="editorPreview">
                    <p class="preview-placeholder">Upload an image to start editing</p>
                </div>

                <!-- Crop Tools -->
                <div class="settings-group">
                    <label class="settings-label">✂️ Crop Tools</label>
                    <div class="editor-buttons">
                        <button class="btn btn-secondary btn-sm" id="cropCircleBtn">
                            <span class="material-symbols-outlined">circle</span> Circle
                        </button>
                        <button class="btn btn-secondary btn-sm" id="cropSquareBtn">
                            <span class="material-symbols-outlined">crop_square</span> Square
                        </button>
                        <button class="btn btn-secondary btn-sm" id="cropRoundBtn">
                            <span class="material-symbols-outlined">rounded_corner</span> Round Corners
                        </button>
                    </div>
                    <label>
                        Corner Radius:
                        <input type="range" id="cornerRadius" min="0" max="100" value="30">
                        <span id="cornerRadiusLabel">30px</span>
                    </label>
                </div>

                <!-- Transform Tools -->
                <div class="settings-group">
                    <label class="settings-label">🔄 Transform Tools</label>
                    <div class="editor-buttons">
                        <button class="btn btn-secondary btn-sm" id="rotateLeftBtn">
                            <span class="material-symbols-outlined">rotate_left</span> Rotate Left
                        </button>
                        <button class="btn btn-secondary btn-sm" id="rotateRightBtn">
                            <span class="material-symbols-outlined">rotate_right</span> Rotate Right
                        </button>
                        <button class="btn btn-secondary btn-sm" id="flipHorizontalBtn">
                            <span class="material-symbols-outlined">flip</span> Flip Horizontal
                        </button>
                        <button class="btn btn-secondary btn-sm" id="flipVerticalBtn">
                            <span class="material-symbols-outlined">flip</span> Flip Vertical
                        </button>
                    </div>
                </div>

                <!-- Watermark Tools -->
                <div class="settings-group">
                    <label class="settings-label">💧 Watermark</label>
                    <div style="display: flex; flex-wrap: wrap; gap: 12px; width: 100%;">
                        <label>
                            Text:
                            <input type="text" id="watermarkText" value="iZeroPDF" style="width:150px;">
                        </label>
                        <label>
                            Position:
                            <select id="watermarkPosition">
                                <option value="top-left">Top Left</option>
                                <option value="top-center">Top Center</option>
                                <option value="top-right">Top Right</option>
                                <option value="center" selected>Center</option>
                                <option value="bottom-left">Bottom Left</option>
                                <option value="bottom-center">Bottom Center</option>
                                <option value="bottom-right">Bottom Right</option>
                            </select>
                        </label>
                        <label>
                            Opacity:
                            <input type="range" id="watermarkOpacity" min="10" max="100" value="50">
                            <span id="watermarkOpacityLabel">50%</span>
                        </label>
                        <button class="btn btn-primary btn-sm" id="applyWatermarkBtn">
                            <span class="material-symbols-outlined">branding_watermark</span> Apply Watermark
                        </button>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="result-actions">
                    <button class="btn btn-success" id="downloadEditorBtn" disabled>
                        <span class="material-symbols-outlined">download</span> Download Edited Image
                    </button>
                    <button class="btn btn-secondary" id="resetEditorBtn">
                        <span class="material-symbols-outlined">refresh</span> Reset
                    </button>
                </div>

                <div class="progress-container">
                    <div class="progress-bar"></div>
                    <div class="progress-text"></div>
                </div>
            </div>
        `;

        attachEvents();
    }

    function attachEvents() {
        var fileInput = document.getElementById('editorFileInput');
        var uploadArea = document.getElementById('editorUploadArea');
        var downloadBtn = document.getElementById('downloadEditorBtn');
        var resetBtn = document.getElementById('resetEditorBtn');

        // File input
        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                var file = this.files[0];
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
                var file = e.dataTransfer.files[0];
                if (file && Validators.isImage(file)) {
                    loadImage(file);
                }
            });
        }

        // Crop buttons
        document.getElementById('cropCircleBtn').addEventListener('click', function() {
            applyCrop('circle');
        });
        document.getElementById('cropSquareBtn').addEventListener('click', function() {
            applyCrop('square');
        });
        document.getElementById('cropRoundBtn').addEventListener('click', function() {
            applyCrop('round');
        });

        // Rotate buttons
        document.getElementById('rotateLeftBtn').addEventListener('click', function() {
            applyRotate(-90);
        });
        document.getElementById('rotateRightBtn').addEventListener('click', function() {
            applyRotate(90);
        });

        // Flip buttons
        document.getElementById('flipHorizontalBtn').addEventListener('click', function() {
            applyFlip('horizontal');
        });
        document.getElementById('flipVerticalBtn').addEventListener('click', function() {
            applyFlip('vertical');
        });

        // Watermark
        document.getElementById('applyWatermarkBtn').addEventListener('click', applyWatermark);

        // Corner radius slider
        var radiusSlider = document.getElementById('cornerRadius');
        var radiusLabel = document.getElementById('cornerRadiusLabel');
        if (radiusSlider && radiusLabel) {
            radiusSlider.addEventListener('input', function() {
                radiusLabel.textContent = this.value + 'px';
            });
        }

        // Watermark opacity slider
        var opacitySlider = document.getElementById('watermarkOpacity');
        var opacityLabel = document.getElementById('watermarkOpacityLabel');
        if (opacitySlider && opacityLabel) {
            opacitySlider.addEventListener('input', function() {
                opacityLabel.textContent = this.value + '%';
            });
        }

        // Download and Reset
        if (downloadBtn) {
            downloadBtn.addEventListener('click', downloadEdited);
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', resetImage);
        }
    }

    async function loadImage(file) {
        try {
            originalFile = file;
            originalImage = await FileHelpers.loadImage(file);
            currentImage = originalImage;

            // Show file info
            var infoDiv = document.getElementById('editorFileInfo');
            var details = document.getElementById('editorFileDetails');
            if (infoDiv && details) {
                infoDiv.style.display = 'block';
                details.textContent = '📷 ' + file.name + ' (' + currentImage.width + ' × ' + currentImage.height + ')';
            }

            // Show preview
            var preview = document.getElementById('editorPreview');
            if (preview) {
                var canvas = CanvasHelpers.imageToCanvas(currentImage);
                preview.innerHTML = '<img src="' + canvas.toDataURL('image/png') + '" style="max-width:100%;max-height:400px;border-radius:var(--md-shape-small);">';
                editedCanvas = canvas;
            }

            document.getElementById('downloadEditorBtn').disabled = false;
            showToast('success', 'Image loaded: ' + currentImage.width + '×' + currentImage.height);

        } catch (error) {
            console.error('Error loading image:', error);
            showToast('error', 'Failed to load image: ' + error.message);
        }
    }

    function updatePreview(canvas) {
        var preview = document.getElementById('editorPreview');
        if (!preview || !canvas) return;

        editedCanvas = canvas;
        preview.innerHTML = '<img src="' + canvas.toDataURL('image/png') + '" style="max-width:100%;max-height:400px;border-radius:var(--md-shape-small);">';
        document.getElementById('downloadEditorBtn').disabled = false;
    }

    function applyCrop(type) {
        if (!currentImage) {
            showToast('warning', 'Please load an image first');
            return;
        }

        var canvas = CanvasHelpers.imageToCanvas(currentImage);
        var ctx = canvas.getContext('2d');
        var width = canvas.width;
        var height = canvas.height;

        // Calculate crop size
        var size = Math.min(width, height);
        var x = (width - size) / 2;
        var y = (height - size) / 2;

        // Create new canvas for cropped image
        var cropCanvas = document.createElement('canvas');
        var cropCtx = cropCanvas.getContext('2d');

        if (type === 'square') {
            // Square crop
            cropCanvas.width = size;
            cropCanvas.height = size;
            cropCtx.drawImage(canvas, x, y, size, size, 0, 0, size, size);

        } else if (type === 'circle') {
            // Circle crop
            cropCanvas.width = size;
            cropCanvas.height = size;
            
            // Draw circle clip
            cropCtx.beginPath();
            cropCtx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
            cropCtx.closePath();
            cropCtx.clip();

            // Draw image
            cropCtx.drawImage(canvas, x, y, size, size, 0, 0, size, size);

            // Add border
            cropCtx.strokeStyle = '#1a73e8';
            cropCtx.lineWidth = 3;
            cropCtx.beginPath();
            cropCtx.arc(size/2, size/2, size/2 - 1, 0, Math.PI * 2);
            cropCtx.stroke();

        } else if (type === 'round') {
            // Round corners
            var radius = parseInt(document.getElementById('cornerRadius').value) || 30;
            cropCanvas.width = width;
            cropCanvas.height = height;

            // Draw rounded rectangle
            cropCtx.beginPath();
            cropCtx.moveTo(radius, 0);
            cropCtx.lineTo(width - radius, 0);
            cropCtx.quadraticCurveTo(width, 0, width, radius);
            cropCtx.lineTo(width, height - radius);
            cropCtx.quadraticCurveTo(width, height, width - radius, height);
            cropCtx.lineTo(radius, height);
            cropCtx.quadraticCurveTo(0, height, 0, height - radius);
            cropCtx.lineTo(0, radius);
            cropCtx.quadraticCurveTo(0, 0, radius, 0);
            cropCtx.closePath();
            cropCtx.clip();

            cropCtx.drawImage(canvas, 0, 0);
        }

        currentImage = cropCanvas;
        updatePreview(cropCanvas);
        showToast('success', 'Applied ' + type + ' crop');
    }

    function applyRotate(degrees) {
        if (!currentImage) {
            showToast('warning', 'Please load an image first');
            return;
        }

        var canvas = CanvasHelpers.rotateImage(currentImage, degrees);
        currentImage = canvas;
        updatePreview(canvas);
        showToast('success', 'Rotated ' + degrees + '°');
    }

    function applyFlip(type) {
        if (!currentImage) {
            showToast('warning', 'Please load an image first');
            return;
        }

        var canvas = CanvasHelpers.imageToCanvas(currentImage);
        var ctx = canvas.getContext('2d');

        if (type === 'horizontal') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        } else if (type === 'vertical') {
            ctx.translate(0, canvas.height);
            ctx.scale(1, -1);
        }

        ctx.drawImage(currentImage, 0, 0);
        currentImage = canvas;
        updatePreview(canvas);
        showToast('success', 'Flipped ' + type);
    }

    function applyWatermark() {
        if (!currentImage) {
            showToast('warning', 'Please load an image first');
            return;
        }

        var text = document.getElementById('watermarkText').value || 'iZeroPDF';
        var position = document.getElementById('watermarkPosition').value;
        var opacity = parseInt(document.getElementById('watermarkOpacity').value) / 100;

        var canvas = CanvasHelpers.imageToCanvas(currentImage);
        var ctx = canvas.getContext('2d');

        // Watermark settings
        var fontSize = Math.min(canvas.width, canvas.height) / 12;
        ctx.font = 'bold ' + fontSize + 'px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Calculate position
        var x = canvas.width / 2;
        var y = canvas.height / 2;

        switch(position) {
            case 'top-left':
                x = fontSize * 2;
                y = fontSize * 2;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                break;
            case 'top-center':
                x = canvas.width / 2;
                y = fontSize * 2;
                ctx.textBaseline = 'top';
                break;
            case 'top-right':
                x = canvas.width - fontSize * 2;
                y = fontSize * 2;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'top';
                break;
            case 'bottom-left':
                x = fontSize * 2;
                y = canvas.height - fontSize * 2;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'bottom';
                break;
            case 'bottom-center':
                x = canvas.width / 2;
                y = canvas.height - fontSize * 2;
                ctx.textBaseline = 'bottom';
                break;
            case 'bottom-right':
                x = canvas.width - fontSize * 2;
                y = canvas.height - fontSize * 2;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'bottom';
                break;
            default: // center
                break;
        }

        // Draw watermark with shadow
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        ctx.fillStyle = 'rgba(255, 255, 255, ' + opacity + ')';
        ctx.fillText(text, x, y);

        // Draw outline for better visibility
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeText(text, x, y);

        // Draw again on top
        ctx.fillStyle = 'rgba(255, 255, 255, ' + opacity + ')';
        ctx.fillText(text, x, y);

        currentImage = canvas;
        updatePreview(canvas);
        showToast('success', 'Watermark applied');
    }

    function resetImage() {
        if (originalImage) {
            currentImage = originalImage;
            var canvas = CanvasHelpers.imageToCanvas(currentImage);
            updatePreview(canvas);
            showToast('info', 'Image reset to original');
        } else {
            showToast('warning', 'No image to reset');
        }
    }

    function downloadEdited() {
        if (!editedCanvas) {
            showToast('warning', 'Please edit an image first');
            return;
        }

        var dataURL = editedCanvas.toDataURL('image/png', 0.92);
        var link = document.createElement('a');
        var name = originalFile ? FileHelpers.getFileNameWithoutExtension(originalFile.name) : 'image';
        link.download = name + '_edited.png';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('success', 'Edited image downloaded');
    }

    return {
        render: render
    };

})();

window.ImageEditorToolController = ImageEditorToolController;