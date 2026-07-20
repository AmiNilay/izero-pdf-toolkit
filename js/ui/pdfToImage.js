/**
 * PDF to Images - UI Controller
 */

const PdfToImageController = (function() {
    'use strict';

    var currentFile = null;
    var resultImages = [];

    function render() {
        var container = document.getElementById('toolContent');
        if (!container) return;

        // ✅ REMOVED: <section class="page active"> wrapper
        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-header">
                    <h2>📄 PDF → Images</h2>
                    <p>Extract all pages from a PDF as individual images</p>
                </div>

                <div class="upload-area" id="pdfUploadArea">
                    <input type="file" id="pdfFileInput" accept=".pdf,application/pdf">
                    <div class="upload-icon material-symbols-outlined">picture_as_pdf</div>
                    <div class="upload-text">Drop your PDF here or click to browse</div>
                    <div class="upload-hint">Supports up to 100MB</div>
                </div>

                <div id="pdfInfo" class="file-info" style="display: none;">
                    <span id="fileInfo"></span>
                </div>

                <div class="settings-group">
                    <label>
                        <span class="material-symbols-outlined">density_medium</span>
                        DPI:
                        <select id="dpiSelect">
                            <option value="72">72 (Web)</option>
                            <option value="150" selected>150 (Print)</option>
                            <option value="300">300 (High)</option>
                            <option value="600">600 (Ultra)</option>
                        </select>
                    </label>
                    <label>
                        <span class="material-symbols-outlined">image_search</span>
                        Format:
                        <select id="imageFormatSelect">
                            <option value="image/png" selected>PNG</option>
                            <option value="image/jpeg">JPEG</option>
                            <option value="image/webp">WebP</option>
                        </select>
                    </label>
                    <label>
                        <span class="material-symbols-outlined">high_quality</span>
                        Quality:
                        <input type="range" id="qualityRange" min="1" max="100" value="92">
                        <span id="qualityLabel">92%</span>
                    </label>
                </div>

                <button class="btn btn-primary" id="convertPdfBtn" disabled>
                    <span class="material-symbols-outlined">transform</span> Convert to Images
                </button>

                <div class="progress-container">
                    <div class="progress-bar"></div>
                    <div class="progress-text"></div>
                </div>

                <div class="preview-area" id="pdfPreview">
                    <p class="preview-placeholder">Upload a PDF to see preview</p>
                </div>

                <div id="downloadSection" class="result-section" style="display: none;">
                    <div class="result-actions">
                        <button class="btn btn-success" id="downloadAllBtn">
                            <span class="material-symbols-outlined">download</span> Download All
                        </button>
                        <button class="btn btn-secondary" id="downloadZipBtn">
                            <span class="material-symbols-outlined">folder_zip</span> Download as ZIP
                        </button>
                    </div>
                </div>
            </div>
        `;

        attachEvents();
    }

    function attachEvents() {
        var fileInput = document.getElementById('pdfFileInput');
        var uploadArea = document.getElementById('pdfUploadArea');
        var convertBtn = document.getElementById('convertPdfBtn');
        var qualityRange = document.getElementById('qualityRange');
        var qualityLabel = document.getElementById('qualityLabel');
        var downloadAllBtn = document.getElementById('downloadAllBtn');
        var downloadZipBtn = document.getElementById('downloadZipBtn');

        if (qualityRange && qualityLabel) {
            qualityRange.addEventListener('input', function() {
                qualityLabel.textContent = this.value + '%';
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                var file = this.files[0];
                if (file) handleFile(file);
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
                var files = e.dataTransfer.files;
                if (files.length > 0) handleFile(files[0]);
            });
        }

        if (convertBtn) {
            convertBtn.addEventListener('click', function() {
                var dpi = parseInt(document.getElementById('dpiSelect').value);
                var format = document.getElementById('imageFormatSelect').value;
                var quality = parseInt(document.getElementById('qualityRange').value) / 100;
                convertPdf(dpi, format, quality);
            });
        }

        if (downloadAllBtn) downloadAllBtn.addEventListener('click', downloadAll);
        if (downloadZipBtn) downloadZipBtn.addEventListener('click', downloadZip);
    }

    function handleFile(file) {
        if (!Validators.isPDF(file)) {
            showToast('error', 'Please upload a valid PDF file');
            return;
        }
        if (!Validators.checkFileSize(file, 100)) {
            showToast('error', 'File is too large. Maximum size is 100MB');
            return;
        }
        currentFile = file;
        document.getElementById('convertPdfBtn').disabled = false;
        var infoDiv = document.getElementById('pdfInfo');
        var fileInfo = document.getElementById('fileInfo');
        if (infoDiv && fileInfo) {
            infoDiv.style.display = 'block';
            fileInfo.textContent = '📄 ' + file.name + ' (' + FileHelpers.formatFileSize(file.size) + ')';
        }
        resultImages = [];
        document.getElementById('pdfPreview').innerHTML = '<p class="preview-ready">Ready to convert: ' + file.name + '</p>';
        document.getElementById('downloadSection').style.display = 'none';
    }

    async function convertPdf(dpi, format, quality) {
        if (!currentFile) {
            showToast('error', 'Please upload a PDF file first');
            return;
        }
        var convertBtn = document.getElementById('convertPdfBtn');
        convertBtn.disabled = true;
        convertBtn.textContent = 'Processing...';
        try {
            resultImages = await PDFProcessor.pdfToImages(currentFile, { dpi: dpi, format: format, quality: quality });
            displayResults(resultImages);
            showToast('success', 'Successfully extracted ' + resultImages.length + ' pages');
            document.getElementById('downloadSection').style.display = 'block';
        } catch (error) {
            console.error('Conversion error:', error);
            showToast('error', 'Conversion failed: ' + error.message);
        } finally {
            convertBtn.disabled = false;
            convertBtn.textContent = 'Convert to Images';
        }
    }

    function displayResults(images) {
        var preview = document.getElementById('pdfPreview');
        if (!preview) return;
        if (!images || images.length === 0) {
            preview.innerHTML = '<p class="preview-placeholder">No images extracted</p>';
            return;
        }
        var html = '<div class="preview-grid">';
        for (var i = 0; i < images.length; i++) {
            var img = images[i];
            var dataURL = img.canvas.toDataURL('image/png');
            html += `<div class="preview-item"><img src="${dataURL}" alt="Page ${img.page}"><span class="page-number">Page ${img.page}</span></div>`;
        }
        html += '</div>';
        preview.innerHTML = html;
    }

    function downloadAll() {
        if (resultImages.length === 0) {
            showToast('warning', 'No images to download');
            return;
        }
        for (var i = 0; i < resultImages.length; i++) {
            var img = resultImages[i];
            var dataURL = img.canvas.toDataURL('image/png');
            var link = document.createElement('a');
            link.download = 'page_' + img.page + '.png';
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        showToast('success', 'Downloaded ' + resultImages.length + ' images');
    }

    async function downloadZip() {
        if (resultImages.length === 0) {
            showToast('warning', 'No images to download');
            return;
        }
        try {
            showToast('info', 'Creating ZIP file...');
            var files = [];
            for (var i = 0; i < resultImages.length; i++) {
                var img = resultImages[i];
                var blob = await FileHelpers.canvasToBlob(img.canvas, 'image/png');
                files.push({ filename: 'page_' + img.page + '.png', data: blob });
            }
            var zip = await ZipHelpers.createZip(files);
            DownloadHelpers.downloadBlob(zip, 'pdf_images.zip');
            showToast('success', 'ZIP file downloaded');
        } catch (error) {
            console.error('ZIP creation error:', error);
            showToast('error', 'Failed to create ZIP: ' + error.message);
        }
    }

    return { render: render };
})();

window.PdfToImageController = PdfToImageController;