/**
 * Resize Tool - UI Controller
 */

const ResizeToolController = (function() {
    'use strict';

    let currentImage = null;
    let resizedCanvas = null;

    function render() {
        var container = document.getElementById('toolContent');
        if (!container) return;

        // ✅ REMOVED: <section class="page active"> wrapper
        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-header">
                    <h2>📐 Resize Image</h2>
                    <p>Change the dimensions of your image</p>
                </div>

                <div class="upload-area" id="resizeUploadArea">
                    <input type="file" id="resizeFileInput" accept="image/*">
                    <div class="upload-icon material-symbols-outlined">upload_file</div>
                    <div class="upload-text">Drop an image here or click to browse</div>
                    <div class="upload-hint">Resize images precisely</div>
                </div>

                <div id="originalInfo" class="file-info" style="display: none;">
                    <span id="originalSizeInfo"></span>
                </div>

                <div class="settings-group">
                    <label>
                        <span class="material-symbols-outlined">width</span>
                        Width (px):
                        <input type="number" id="resizeWidth" value="800" min="1" max="10000">
                    </label>
                    <label>
                        <span class="material-symbols-outlined">height</span>
                        Height (px):
                        <input type="number" id="resizeHeight" value="600" min="1" max="10000">
                    </label>
                    <label>
                        <input type="checkbox" id="maintainAspect" checked>
                        <span class="material-symbols-outlined">lock</span> Maintain Aspect Ratio
                    </label>
                    <label>
                        <span class="material-symbols-outlined">tune</span>
                        Method:
                        <select id="resizeMethod">
                            <option value="bicubic">Bicubic (Best)</option>
                            <option value="bilinear">Bilinear</option>
                            <option value="nearest">Nearest (Fastest)</option>
                        </select>
                    </label>
                </div>

                <div class="settings-group">
                    <label>
                        <span class="material-symbols-outlined">percent</span>
                        Resize by Percentage:
                        <input type="range" id="resizePercent" min="10" max="200" value="100" style="width:200px;">
                        <span id="percentLabel">100%</span>
                    </label>
                </div>

                <div class="result-actions" style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn btn-primary" id="applyResizeBtn" disabled>
                        <span class="material-symbols-outlined">aspect_ratio</span> Apply Resize
                    </button>
                    <button class="btn btn-success" id="downloadResizeBtn" disabled>
                        <span class="material-symbols-outlined">download</span> Download Resized
                    </button>
                </div>

                <div class="progress-container">
                    <div class="progress-bar"></div>
                    <div class="progress-text"></div>
                </div>

                <div class="preview-comparison">
                    <div>
                        <h4>Original</h4>
                        <div id="originalPreview" class="preview-box">
                            <p>No image loaded</p>
                        </div>
                        <p id="originalDimensions" class="preview-dimensions"></p>
                    </div>
                    <div>
                        <h4>Resized (Preview)</h4>
                        <div id="resizedPreview" class="preview-box">
                            <p>Resize preview will appear here</p>
                        </div>
                        <p id="resizedDimensions" class="preview-dimensions"></p>
                    </div>
                </div>
            </div>
        `;

        attachEvents();
    }

    function attachEvents() {
        var fileInput = document.getElementById('resizeFileInput');
        var uploadArea = document.getElementById('resizeUploadArea');
        var applyBtn = document.getElementById('applyResizeBtn');
        var downloadBtn = document.getElementById('downloadResizeBtn');
        var widthInput = document.getElementById('resizeWidth');
        var heightInput = document.getElementById('resizeHeight');
        var percentSlider = document.getElementById('resizePercent');
        var percentLabel = document.getElementById('percentLabel');
        var maintainAspect = document.getElementById('maintainAspect');

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

        if (widthInput && heightInput) {
            widthInput.addEventListener('change', function() {
                if (maintainAspect && maintainAspect.checked && currentImage) {
                    var ratio = currentImage.height / currentImage.width;
                    var newHeight = Math.round(parseInt(this.value) * ratio);
                    heightInput.value = newHeight;
                }
                updatePreview();
            });

            heightInput.addEventListener('change', function() {
                if (maintainAspect && maintainAspect.checked && currentImage) {
                    var ratio = currentImage.width / currentImage.height;
                    var newWidth = Math.round(parseInt(this.value) * ratio);
                    widthInput.value = newWidth;
                }
                updatePreview();
            });
        }

        if (percentSlider && percentLabel) {
            percentSlider.addEventListener('input', function() {
                var percent = parseInt(this.value);
                percentLabel.textContent = percent + '%';
                
                if (currentImage) {
                    var newWidth = Math.round(currentImage.width * percent / 100);
                    var newHeight = Math.round(currentImage.height * percent / 100);
                    widthInput.value = newWidth;
                    heightInput.value = newHeight;
                    updatePreview();
                }
            });
        }

        if (applyBtn) applyBtn.addEventListener('click', applyResize);
        if (downloadBtn) downloadBtn.addEventListener('click', downloadResized);
    }

    async function loadImage(file) {
        try {
            currentImage = await FileHelpers.loadImage(file);
            
            var infoDiv = document.getElementById('originalInfo');
            var infoSpan = document.getElementById('originalSizeInfo');
            if (infoDiv && infoSpan) {
                infoDiv.style.display = 'block';
                infoSpan.textContent = '📷 ' + file.name + ' (' + currentImage.width + ' × ' + currentImage.height + ')';
            }

            document.getElementById('resizeWidth').value = currentImage.width;
            document.getElementById('resizeHeight').value = currentImage.height;

            var preview = document.getElementById('originalPreview');
            if (preview) {
                preview.innerHTML = '<img src="' + currentImage.src + '" style="max-width:100%;max-height:300px;border-radius:var(--md-shape-small);">';
            }

            document.getElementById('originalDimensions').textContent = 
                currentImage.width + ' × ' + currentImage.height;

            document.getElementById('applyResizeBtn').disabled = false;
            updatePreview();

            showToast('success', 'Image loaded');

        } catch (error) {
            console.error('Error loading image:', error);
            showToast('error', 'Failed to load image: ' + error.message);
        }
    }

    function updatePreview() {
        if (!currentImage) return;

        var width = parseInt(document.getElementById('resizeWidth').value) || currentImage.width;
        var height = parseInt(document.getElementById('resizeHeight').value) || currentImage.height;

        document.getElementById('resizedDimensions').textContent = width + ' × ' + height;

        var preview = document.getElementById('resizedPreview');
        if (preview) {
            var canvas = CanvasHelpers.resizeImage(currentImage, width, height, false);
            preview.innerHTML = '<img src="' + canvas.toDataURL('image/png') + '" style="max-width:100%;max-height:300px;border-radius:var(--md-shape-small);">';
        }
    }

    function applyResize() {
        if (!currentImage) {
            showToast('warning', 'Please load an image first');
            return;
        }

        var width = parseInt(document.getElementById('resizeWidth').value);
        var height = parseInt(document.getElementById('resizeHeight').value);

        if (width < 1 || height < 1) {
            showToast('error', 'Invalid dimensions');
            return;
        }

        try {
            resizedCanvas = CanvasHelpers.resizeImage(currentImage, width, height, false);
            
            var preview = document.getElementById('resizedPreview');
            if (preview) {
                preview.innerHTML = '<img src="' + resizedCanvas.toDataURL('image/png') + '" style="max-width:100%;max-height:300px;border-radius:var(--md-shape-small);">';
            }

            document.getElementById('downloadResizeBtn').disabled = false;
            showToast('success', 'Image resized to ' + width + ' × ' + height);

        } catch (error) {
            console.error('Resize error:', error);
            showToast('error', 'Resize failed: ' + error.message);
        }
    }

    function downloadResized() {
        if (!resizedCanvas) {
            showToast('warning', 'Please apply resize first');
            return;
        }

        var dataURL = resizedCanvas.toDataURL('image/png', 0.92);
        var link = document.createElement('a');
        link.download = 'resized_' + Date.now() + '.png';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('success', 'Resized image downloaded');
    }

    return { render: render };
})();

window.ResizeToolController = ResizeToolController;