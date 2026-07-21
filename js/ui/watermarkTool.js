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
                </div>
                <div class="settings-group" id="wmSettings" style="display:none;">
                    <label>Watermark Text: <input type="text" id="wmText" value="iZeroPDF" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;"></label>
                    <label>Font Size: <input type="range" id="wmSize" min="20" max="200" value="60"></label>
                    <label>Opacity: <input type="range" id="wmOpacity" min="0.1" max="1" step="0.1" value="0.5"></label>
                    <label>Color: <input type="color" id="wmColor" value="#ffffff"></label>
                </div>
                <div id="wmPreview" style="display:none; text-align:center; margin: 20px 0;">
                    <canvas id="wmCanvas" style="max-width:100%; max-height:60vh; border:1px solid var(--md-outline-variant); border-radius:8px;"></canvas>
                </div>
                <div class="result-actions" id="wmActions" style="display:none; gap:12px; flex-wrap:wrap; justify-content:center; margin-top: 20px;">
                    <button class="btn btn-primary" id="applyWmBtn"><span class="material-symbols-outlined">check</span> Apply Watermark</button>
                    <button class="btn btn-success" id="downloadWmBtn"><span class="material-symbols-outlined">download</span> Download</button>
                </div>
            </div>
        `;
        attachEvents();
    }

    function attachEvents() {
        const fileInput = document.getElementById('wmFileInput');
        const uploadArea = document.getElementById('wmUploadArea');

        fileInput.addEventListener('change', (e) => loadImage(e.files[0]));
        uploadArea.addEventListener('drop', (e) => { e.preventDefault(); loadImage(e.dataTransfer.files[0]); });
        uploadArea.addEventListener('dragover', (e) => e.preventDefault());

        ['wmText', 'wmSize', 'wmOpacity', 'wmColor'].forEach(id => {
            document.getElementById(id).addEventListener('input', draw);
        });

        document.getElementById('applyWmBtn').addEventListener('click', () => showToast('success', 'Watermark applied'));
        document.getElementById('downloadWmBtn').addEventListener('click', download);
    }

    function loadImage(file) {
        if (!file || !Validators.isImage(file)) return showToast('error', 'Invalid image');
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                currentImage = img;
                document.getElementById('wmSettings').style.display = 'block';
                document.getElementById('wmPreview').style.display = 'block';
                document.getElementById('wmActions').style.display = 'flex';
                draw();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function draw() {
        const canvas = document.getElementById('wmCanvas');
        const ctx = canvas.getContext('2d');
        if (!currentImage) return;

        canvas.width = currentImage.width;
        canvas.height = currentImage.height;
        ctx.drawImage(currentImage, 0, 0);

        const text = document.getElementById('wmText').value;
        const size = document.getElementById('wmSize').value;
        const opacity = document.getElementById('wmOpacity').value;
        const color = document.getElementById('wmColor').value;

        ctx.font = `bold ${size}px Arial`;
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw diagonal watermark
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 6);
        ctx.fillText(text, 0, 0);
        ctx.restore();
        
        ctx.globalAlpha = 1.0;
    }

    function download() {
        const canvas = document.getElementById('wmCanvas');
        const link = document.createElement('a');
        link.download = 'watermarked_image.png';
        link.href = canvas.toDataURL();
        link.click();
        showToast('success', 'Image downloaded');
    }

    return { render };
})();
window.WatermarkToolController = WatermarkToolController;