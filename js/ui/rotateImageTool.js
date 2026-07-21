/**
 * Rotate Image Tool - UI Controller
 */
const RotateImageToolController = (function() {
    'use strict';
    
    let currentImage = null;
    let currentRotation = 0;
    let flipH = 1;
    let flipV = 1;
    let originalImage = null;

    function render() {
        const container = document.getElementById('toolContent');
        if (!container) return;

        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-header">
                    <h2>🔄 Rotate Image</h2>
                    <p>Rotate and flip images in any direction</p>
                </div>

                <div class="upload-area" id="rotateImgUploadArea">
                    <input type="file" id="rotateImgFileInput" accept="image/*">
                    <div class="upload-icon material-symbols-outlined">image</div>
                    <div class="upload-text">Drop an image here or click to browse</div>
                    <div class="upload-hint">Supports JPG, PNG, WebP</div>
                </div>

                <div id="rotateImgInfo" class="file-info" style="display: none;">
                    <span id="rotateImgFileDetails"></span>
                </div>

                <div class="canvas-container" id="rotateImgCanvasContainer" style="display: none; margin: 24px 0; text-align: center; background: var(--md-surface-variant); padding: 20px; border-radius: 12px;">
                    <canvas id="rotateImgCanvas" style="max-width: 100%; max-height: 60vh; border: 1px solid var(--md-outline-variant); border-radius: 8px; background: white;"></canvas>
                </div>

                <div class="settings-group" id="rotateImgControls" style="display: none;">
                    <div class="result-actions" style="justify-content: center; gap: 12px; flex-wrap: wrap;">
                        <button class="btn btn-secondary" id="rotateLeftBtn">
                            <span class="material-symbols-outlined">rotate_left</span> Rotate Left
                        </button>
                        <button class="btn btn-secondary" id="rotateRightBtn">
                            <span class="material-symbols-outlined">rotate_right</span> Rotate Right
                        </button>
                        <button class="btn btn-secondary" id="flipHBtn">
                            <span class="material-symbols-outlined">flip</span> Flip Horizontal
                        </button>
                        <button class="btn btn-secondary" id="flipVBtn">
                            <span class="material-symbols-outlined">flip</span> Flip Vertical
                        </button>
                        <button class="btn btn-secondary" id="resetRotateBtn">
                            <span class="material-symbols-outlined">refresh</span> Reset
                        </button>
                    </div>
                </div>

                <div class="result-actions" id="rotateImgActions" style="display: none; margin-top: 20px; justify-content: center;">
                    <button class="btn btn-success btn-lg" id="downloadRotateImgBtn">
                        <span class="material-symbols-outlined">download</span> Download Rotated Image
                    </button>
                </div>
            </div>
        `;

        attachEvents();
    }

    function attachEvents() {
        const fileInput = document.getElementById('rotateImgFileInput');
        const uploadArea = document.getElementById('rotateImgUploadArea');

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

        document.getElementById('rotateLeftBtn').addEventListener('click', function() {
            currentRotation = (currentRotation - 90) % 360;
            draw();
        });

        document.getElementById('rotateRightBtn').addEventListener('click', function() {
            currentRotation = (currentRotation + 90) % 360;
            draw();
        });

        document.getElementById('flipHBtn').addEventListener('click', function() {
            flipH *= -1;
            draw();
        });

        document.getElementById('flipVBtn').addEventListener('click', function() {
            flipV *= -1;
            draw();
        });

        document.getElementById('resetRotateBtn').addEventListener('click', function() {
            currentRotation = 0;
            flipH = 1;
            flipV = 1;
            draw();
            showToast('info', 'Rotation reset');
        });

        document.getElementById('downloadRotateImgBtn').addEventListener('click', download);
    }

    function loadImage(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                currentImage = img;
                originalImage = img;
                currentRotation = 0;
                flipH = 1;
                flipV = 1;
                
                // Show UI elements
                document.getElementById('rotateImgCanvasContainer').style.display = 'block';
                document.getElementById('rotateImgControls').style.display = 'block';
                document.getElementById('rotateImgActions').style.display = 'flex';
                
                // Show file info
                const infoDiv = document.getElementById('rotateImgInfo');
                const details = document.getElementById('rotateImgFileDetails');
                if (infoDiv && details) {
                    infoDiv.style.display = 'block';
                    details.textContent = '🖼️ ' + file.name + ' (' + FileHelpers.formatFileSize(file.size) + ')';
                }
                
                // Hide upload area
                document.getElementById('rotateImgUploadArea').style.display = 'none';
                
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
        const canvas = document.getElementById('rotateImgCanvas');
        const ctx = canvas.getContext('2d');
        
        if (!currentImage) return;

        // Calculate canvas dimensions based on rotation
        const isVertical = Math.abs(currentRotation) % 180 === 90;
        
        if (isVertical) {
            canvas.width = currentImage.height;
            canvas.height = currentImage.width;
        } else {
            canvas.width = currentImage.width;
            canvas.height = currentImage.height;
        }

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Save context state
        ctx.save();
        
        // Move to center
        ctx.translate(canvas.width / 2, canvas.height / 2);
        
        // Rotate
        ctx.rotate(currentRotation * Math.PI / 180);
        
        // Flip
        ctx.scale(flipH, flipV);
        
        // Draw image centered
        ctx.drawImage(
            currentImage, 
            -currentImage.width / 2, 
            -currentImage.height / 2
        );
        
        // Restore context
        ctx.restore();
    }

    function download() {
        const canvas = document.getElementById('rotateImgCanvas');
        if (!canvas) {
            showToast('error', 'No image to download');
            return;
        }
        
        const link = document.createElement('a');
        link.download = 'rotated_image_' + Date.now() + '.png';
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

window.RotateImageToolController = RotateImageToolController;