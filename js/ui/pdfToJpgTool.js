/**
 * PDF to JPG - UI Controller
 */

const PdfToJpgController = (function() {
    'use strict';

    var currentFile = null;
    var resultImages = [];

    function render() {
        var container = document.getElementById('toolContent');
        if (!container) return;

        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-header">
                    <h2>🖼️ PDF → JPG</h2>
                    <p>Convert PDF pages to JPG images</p>
                </div>

                <div class="upload-area" id="pdfJpgUploadArea">
                    <input type="file" id="pdfJpgFileInput" accept=".pdf,application/pdf">
                    <div class="upload-icon material-symbols-outlined">photo</div>
                    <div class="upload-text">Drop your PDF here or click to browse</div>
                    <div class="upload-hint">Exports each page as a JPG image</div>
                </div>

                <div id="pdfJpgInfo" class="file-info" style="display: none;">
                    <span id="pdfJpgFileDetails"></span>
                </div>

                <div class="settings-group">
                    <label>
                        <span class="material-symbols-outlined">photo_quality</span>
                        Quality:
                        <input type="range" id="jpgQuality" min="10" max="100" value="85">
                        <span id="jpgQualityValue">85%</span>
                    </label>
                    <label>
                        <span class="material-symbols-outlined">resolution</span>
                        DPI:
                        <select id="jpgDpi">
                            <option value="72">72 (Web)</option>
                            <option value="150" selected>150 (Print)</option>
                            <option value="300">300 (High Quality)</option>
                        </select>
                    </label>
                </div>

                <button class="btn btn-primary" id="convertToJpgBtn" disabled>
                    <span class="material-symbols-outlined">image_search</span> Convert to JPG
                </button>

                <div class="progress-container">
                    <div class="progress-bar"></div>
                    <div class="progress-text"></div>
                </div>

                <div id="jpgResult" class="result-section" style="display: none;">
                    <div class="result-card success">
                        <span class="material-symbols-outlined">check_circle</span>
                        <div>
                            <strong>Conversion Complete!</strong>
                            <p id="jpgInfo"></p>
                        </div>
                    </div>
                    <div class="result-actions">
                        <button class="btn btn-success" id="downloadJpgAll">
                            <span class="material-symbols-outlined">download</span> Download All
                        </button>
                        <button class="btn btn-secondary" id="downloadJpgZip">
                            <span class="material-symbols-outlined">folder_zip</span> Download as ZIP
                        </button>
                    </div>
                </div>

                <div id="jpgPreview" class="preview-area" style="display: none;"></div>
            </div>
        `;

        attachEvents();
    }

    function attachEvents() {
        var fileInput = document.getElementById('pdfJpgFileInput');
        var uploadArea = document.getElementById('pdfJpgUploadArea');
        var convertBtn = document.getElementById('convertToJpgBtn');
        var qualityRange = document.getElementById('jpgQuality');
        var qualityLabel = document.getElementById('jpgQualityValue');

        if (qualityRange && qualityLabel) {
            qualityRange.addEventListener('input', function() {
                qualityLabel.textContent = this.value + '%';
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                var file = this.files[0];
                if (file && Validators.isPDF(file)) {
                    handleFile(file);
                } else {
                    showToast('error', 'Please upload a valid PDF');
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
                if (file && Validators.isPDF(file)) {
                    handleFile(file);
                }
            });
        }

        if (convertBtn) {
            convertBtn.addEventListener('click', convertToJpg);
        }

        document.getElementById('downloadJpgAll').addEventListener('click', downloadAll);
        document.getElementById('downloadJpgZip').addEventListener('click', downloadZip);
    }

    async function handleFile(file) {
        currentFile = file;
        
        try {
            var info = await PDFProcessor.getPDFInfo(file);
            
            var infoDiv = document.getElementById('pdfJpgInfo');
            var details = document.getElementById('pdfJpgFileDetails');
            if (infoDiv && details) {
                infoDiv.style.display = 'block';
                details.textContent = '📄 ' + file.name + ' (' + info.totalPages + ' pages)';
            }

            document.getElementById('convertToJpgBtn').disabled = false;
            document.getElementById('jpgResult').style.display = 'none';
            document.getElementById('jpgPreview').style.display = 'none';
            
            showToast('success', 'Loaded PDF with ' + info.totalPages + ' pages');

        } catch (error) {
            console.error('Error reading PDF:', error);
            showToast('error', 'Failed to read PDF: ' + error.message);
        }
    }

    async function convertToJpg() {
        if (!currentFile) {
            showToast('warning', 'Please upload a PDF first');
            return;
        }

        var convertBtn = document.getElementById('convertToJpgBtn');
        convertBtn.disabled = true;
        convertBtn.textContent = 'Converting...';

        try {
            var dpi = parseInt(document.getElementById('jpgDpi').value);
            var quality = parseInt(document.getElementById('jpgQuality').value) / 100;

            resultImages = await PDFProcessor.pdfToImages(currentFile, {
                dpi: dpi,
                format: 'image/jpeg',
                quality: quality
            });

            displayResults(resultImages);
            
            document.getElementById('jpgResult').style.display = 'block';
            document.getElementById('jpgInfo').textContent = resultImages.length + ' pages converted';

            showToast('success', 'Converted ' + resultImages.length + ' pages to JPG');

        } catch (error) {
            console.error('Conversion error:', error);
            showToast('error', 'Conversion failed: ' + error.message);
        } finally {
            convertBtn.disabled = false;
            convertBtn.textContent = 'Convert to JPG';
        }
    }

    function displayResults(images) {
        var preview = document.getElementById('jpgPreview');
        if (!preview) return;

        if (!images || images.length === 0) {
            preview.innerHTML = '<p class="preview-placeholder">No images extracted</p>';
            preview.style.display = 'block';
            return;
        }

        var html = '<div class="preview-grid">';
        
        for (var i = 0; i < Math.min(images.length, 12); i++) {
            var img = images[i];
            var dataURL = img.canvas.toDataURL('image/jpeg', 0.85);
            html += `
                <div class="preview-item">
                    <img src="${dataURL}" alt="Page ${img.page}">
                    <span class="page-number">Page ${img.page}</span>
                </div>
            `;
        }
        
        if (images.length > 12) {
            html += '<div class="preview-item more-item">+' + (images.length - 12) + ' more</div>';
        }
        
        html += '</div>';
        preview.innerHTML = html;
        preview.style.display = 'block';
    }

    function downloadAll() {
        if (resultImages.length === 0) {
            showToast('warning', 'No images to download');
            return;
        }

        for (var i = 0; i < resultImages.length; i++) {
            var img = resultImages[i];
            var dataURL = img.canvas.toDataURL('image/jpeg', 0.85);
            var link = document.createElement('a');
            link.download = 'page_' + img.page + '.jpg';
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
            showToast('info', 'Creating ZIP...');
            
            var files = [];
            for (var i = 0; i < resultImages.length; i++) {
                var img = resultImages[i];
                var blob = await FileHelpers.canvasToBlob(img.canvas, 'image/jpeg', 0.85);
                files.push({
                    filename: 'page_' + img.page + '.jpg',
                    data: blob
                });
            }
            
            var zip = await ZipHelpers.createZip(files);
            DownloadHelpers.downloadBlob(zip, 'pdf_pages.zip');
            
            showToast('success', 'ZIP file downloaded');
        } catch (error) {
            console.error('ZIP creation error:', error);
            showToast('error', 'Failed to create ZIP: ' + error.message);
        }
    }

    return {
        render: render
    };

})();

window.PdfToJpgController = PdfToJpgController;