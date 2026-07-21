/**
 * Rotate Image Tool - UI Controller
 */
const RotateImageToolController = (function() {
    'use strict';
    let currentImage = null;
    let currentRotation = 0;
    let flipH = 1;
    let flipV = 1;

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
                </div>
                <div id="rotateImgPreview" style="display:none; text-align:center; margin: 20px 0;">
                    <canvas id="rotateImgCanvas" style="max-width:100%; max-height:60vh; border:1px solid var(--md-outline-variant); border-radius:8px; background: white;"></canvas>
                </div>
                <div class="result-actions" id="rotateImgActions" style="display:none; gap:12px; flex-wrap:wrap; justify-content:center; margin-top: 20px;">
                    <button class="btn btn-secondary" id="rotateLeftBtn"><span class="material-symbols-outlined">rotate_left</span> Left</button>
                    <button class="btn btn-secondary" id="rotateRightBtn"><span class="material-symbols-outlined">rotate_right</span> Right</button>
                    <button class="btn btn-secondary" id="flipHBtn"><span class="material-symbols-outlined">flip</span> Flip H</button>
                    <button class="btn btn-secondary" id="flipVBtn"><span class="material-symbols-outlined">flip</span> Flip V</button>
                    <button class="btn btn-success" id="downloadRotateImgBtn"><span class="material-symbols-outlined">download</span> Download</button>
                </div>
            </div>
        `;
        attachEvents();
    }

    function attachEvents() {
        const fileInput = document.getElementById('rotateImgFileInput');
        const uploadArea = document.getElementById('rotateImgUploadArea');

        fileInput.addEventListener('change', (e) => loadImage(e.files[0]));
        uploadArea.addEventListener('drop', (e) => { e.preventDefault(); loadImage(e.dataTransfer.files[0]); });
        uploadArea.addEventListener('dragover', (e) => e.preventDefault());

        document.getElementById('rotateLeftBtn').addEventListener('click', () => { currentRotation = (currentRotation - 90) % 360; draw(); });
        document.getElementById('rotateRightBtn').addEventListener('click', () => { currentRotation = (currentRotation + 90) % 360; draw(); });
        document.getElementById('flipHBtn').addEventListener('click', () => { flipH *= -1; draw(); });
        document.getElementById('flipVBtn').addEventListener('click', () => { flipV *= -1; draw(); });
        document.getElementById('downloadRotateImgBtn').addEventListener('click', download);
    }

    function loadImage(file) {
        if (!file || !Validators.isImage(file)) return showToast('error', 'Invalid image');
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                currentImage = img;
                currentRotation = 0; flipH = 1; flipV = 1;
                document.getElementById('rotateImgPreview').style.display = 'block';
                document.getElementById('rotateImgActions').style.display = 'flex';
                draw();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function draw() {
        const canvas = document.getElementById('rotateImgCanvas');
        const ctx = canvas.getContext('2d');
        if (!currentImage) return;

        const isVertical = Math.abs(currentRotation) % 180 === 90;
        canvas.width = isVertical ? currentImage.height : currentImage.width;
        canvas.height = isVertical ? currentImage.width : currentImage.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(currentRotation * Math.PI / 180);
        ctx.scale(flipH, flipV);
        ctx.drawImage(currentImage, -currentImage.width / 2, -currentImage.height / 2);
        ctx.restore();
    }

    function download() {
        const canvas = document.getElementById('rotateImgCanvas');
        const link = document.createElement('a');
        link.download = 'rotated_image.png';
        link.href = canvas.toDataURL();
        link.click();
        showToast('success', 'Image downloaded');
    }

    return { render };
})();
window.RotateImageToolController = RotateImageToolController;