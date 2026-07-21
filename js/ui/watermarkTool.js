/**
 * Watermark Tool - UI Controller
 */
const WatermarkToolController = (function() {
    'use strict';
    
    let currentImage = null;

    function render() {
        const container = document.getElementById('toolContent');
        if (!container) return;

        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-header">
                    <h2>💧 Watermark Image</h2>
                    <p>Add text watermarks to your images</p>
                </div>

                <div class="upload-area" id="wmUploadArea">
                    <input type="file" id="wmFileInput" accept="image/*">
                    <div class="upload-icon material-symbols-outlined">image</div>
                    <div class="upload-text">Drop an image here or click to browse</div>
                    <div class="upload-hint">Supports JPG, PNG, WebP</div>
                </div>

                <div id="wmInfo" class="file-info" style="display: none;">
                    <span id="wmFileDetails"></span>
                </div>

                <div class="canvas-container" id="wmCanvasContainer" style="display: none; margin: 24px 0; text-align: center; background: var(--md-surface-variant); padding: 20px; border-radius: 12px; overflow: auto; max-height: 60vh;">
                    <canvas id="wmCanvas" style="max-width: 100%; max-height: 100%; border: 1px solid var(--md-outline-variant); border-radius: 8px; background: white;"></canvas>
                </div>

                <div class="settings-group" id="wmSettings" style="display: none;">
                    <div class="settings-row">
                        <label class="setting-label">
                            <span class="material-symbols-outlined">text_fields</span> Watermark Text
                        </label>
                        <input type="text" id="wmText" value="iZeroPDF" class="text-input">
                    </div>
                    <div class="settings-row">
                        <label class="setting-label">
                            <span class="material-symbols-outlined">format_size</span> Font Size
                        </label>
                        <div class="quality-slider">
                            <input type="range" id="wmSize" min="20" max="200" value="60" class="slider">
                            <span id="wmSizeValue" class="quality-value">60px</span>
                        </div>
                    </div>
                    <div class="settings-row">
                        <label class="setting-label">
                            <span class="material-symbols-outlined">opacity</span> Opacity
                        </label>
                        <div class="quality-slider">
                            <input type="range" id="wmOpacity" min="0.1" max="1" step="0.1" value="0.5" class="slider">
                            <span id="wmOpacityValue" class="quality-value">0.5</span>
                        </div>
                    </div>
                    <div class="settings-row">
                        <label class="setting-label">
                            <span class="material-symbols-outlined">palette</span> Color
                        </label>
                        <input type="color" id="wmColor" value="#ffffff" class="color-input">
                    </div>
                </div>

                <div class="result-actions" id="wmActions" style="display: none; margin-top: 20px; justify-content: center; gap: 12px; flex-wrap: wrap;">
                    <button class="btn btn-success btn-lg" id="downloadWmBtn">
                        <span class="material-symbols-outlined">download</span> Download Watermarked Image
                    </button>
                </div>
            </div>
        `;

        attachEvents();
    }

    function attachEvents() {
        const fileInput = document.getElementById('wmFileInput');
        const uploadArea = document.getElementById('wmUploadArea');

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

        // Settings event listeners
        const wmText = document.getElementById('wmText');
        const wmSize = document.getElementById('wmSize');
        const wmSizeValue = document.getElementById('wmSizeValue');
        const wmOpacity = document.getElementById('wmOpacity');
        const wmOpacityValue = document.getElementById('wmOpacityValue');
        const wmColor = document.getElementById('wmColor');

        if (wmText) wmText.addEventListener('input', draw);
        if (wmSize) {
            wmSize.addEventListener('input', function() {
                if (wmSizeValue) wmSizeValue.textContent = this.value + 'px';
                draw();
            });
        }
        if (wmOpacity) {
            wmOpacity.addEventListener('input', function() {
                if (wmOpacityValue) wmOpacityValue.textContent = this.value;
                draw();
            });
        }
        if (wmColor) wmColor.addEventListener('input', draw);

        document.getElementById('downloadWmBtn').addEventListener('click', download);
    }

    function loadImage(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                currentImage = img;
                
                // Show UI elements
                document.getElementById('wmCanvasContainer').style.display = 'block';
                document.getElementById('wmSettings').style.display = 'block';
                document.getElementById('wmActions').style.display = 'flex';
                
                // Show file info
                const infoDiv = document.getElementById('wmInfo');
                const details = document.getElementById('wmFileDetails');
                if (infoDiv && details) {
                    infoDiv.style.display = 'block';
                    details.textContent = '🖼️ ' + file.name + ' (' + FileHelpers.formatFileSize(file.size) + ')';
                }
                
                // Hide upload area
                document.getElementById('wmUploadArea').style.display = 'none';
                
                draw();
                showToast('success', 'Image loaded successfully');
            };
            img.onerror = function() {
                showToast('error', 'Failed to load image');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function draw() {
        const canvas = document.getElementById('wmCanvas');
        const ctx = canvas.getContext('2d');
        if (!currentImage || !canvas) return;

        canvas.width = currentImage.width;
        canvas.height = currentImage.height;
        
        // Draw original image
        ctx.drawImage(currentImage, 0, 0);

        const text = document.getElementById('wmText').value;
        const size = document.getElementById('wmSize').value;
        const opacity = document.getElementById('wmOpacity').value;
        const color = document.getElementById('wmColor').value;

        if (!text) return;

        ctx.font = `bold ${size}px Arial, sans-serif`;
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw diagonal watermark repeatedly across the image
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 6);
        
        const spacing = parseInt(size) * 4;
        for (let x = -canvas.width; x < canvas.width; x += spacing) {
            for (let y = -canvas.height; y < canvas.height; y += spacing) {
                ctx.fillText(text, x, y);
            }
        }
        
        ctx.restore();
        ctx.globalAlpha = 1.0;
    }

    function download() {
        const canvas = document.getElementById('wmCanvas');
        if (!canvas) {
            showToast('error', 'No image to download');
            return;
        }
        
        const link = document.createElement('a');
        link.download = 'watermarked_image_' + Date.now() + '.png';
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('success', 'Image downloaded successfully');
    }

    return { 
        render: render 
    };
})();

window.WatermarkToolController = WatermarkToolController;