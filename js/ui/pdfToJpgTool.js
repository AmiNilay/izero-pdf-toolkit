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
                    <p>Convert PDF pages to high-quality JPG images</p>
                </div>

                <div class="upload-area" id="pdfJpgUploadArea">
                    <input type="file" id="pdfJpgFileInput" accept=".pdf,application/pdf">
                    <div class="upload-icon material-symbols-outlined">photo</div>
                    <div class="upload-text">Drop your PDF here or click to browse</div>
                    <div class="upload-hint">Supports up to 100MB</div>
                </div>

                <div id="pdfJpgInfo" class="file-info" style="display: none;">
                    <span id="pdfJpgFileDetails"></span>
                </div>

                <div class="settings-group">
                    <div class="settings-row">
                        <label class="setting-label">
                            Resolution (DPI)
                        </label>
                        <select id="jpgDpi" class="setting-select">
                            <option value="72">72 DPI (Web)</option>
                            <option value="150" selected>150 DPI (Print)</option>
                            <option value="300">300 DPI (High Quality)</option>
                        </select>
                    </div>

                    <div class="settings-row">
                        <label class="setting-label">
                            Quality
                        </label>
                        <div class="quality-slider">
                            <input type="range" id="jpgQuality" min="10" max="100" value="85" class="slider">
                            <span id="jpgQualityValue" class="quality-value">85%</span>
                        </div>
                    </div>
                </div>

                <button class="btn btn-primary btn-lg" id="convertToJpgBtn" disabled>
                    <span class="material-symbols-outlined">photo_camera</span> Convert to JPG
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
                        <button class="btn btn-success" id="downloadJpgZip">
                            <span class="material-symbols-outlined">folder_zip</span> Download Selected as ZIP
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
        var downloadZipBtn = document.getElementById('downloadJpgZip');

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

        if (downloadZipBtn) {
            downloadZipBtn.addEventListener('click', downloadZip);
        }
    }

    async function handleFile(file) {
        currentFile = file;
        
        try {
            var info = await PDFProcessor.getPDFInfo(file);
            
            var infoDiv = document.getElementById('pdfJpgInfo');
            var details = document.getElementById('pdfJpgFileDetails');
            if (infoDiv && details) {
                infoDiv.style.display = 'block';
                details.textContent = '📄 ' + file.name + ' (' + info.totalPages + ' pages, ' + FileHelpers.formatFileSize(file.size) + ')';
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
            document.getElementById('jpgInfo').textContent = resultImages.length + ' pages converted. Select pages and download as ZIP, or save individually.';

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

        var html = `
            <div class="preview-header">
                <label class="select-all-label">
                    <input type="checkbox" id="selectAllJpg" checked class="checkbox"> 
                    <span>Select All (${images.length} pages)</span>
                </label>
                <span id="selectedCountText" class="selected-count">${images.length} of ${images.length} selected</span>
            </div>
            <div class="preview-grid">
        `;
        
        for (var i = 0; i < images.length; i++) {
            var img = images[i];
            var thumbUrl = img.canvas.toDataURL('image/jpeg', 0.6);
            
            html += `
                <div class="preview-card">
                    <div class="card-header">
                        <input type="checkbox" class="img-select-checkbox" data-index="${i}" checked>
                        <span class="page-badge">Page ${img.page}</span>
                    </div>
                    <div class="card-image" onclick="PdfToJpgController.viewImage(${i})">
                        <img src="${thumbUrl}" alt="Page ${img.page}">
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-sm btn-secondary" onclick="PdfToJpgController.viewImage(${i}); event.stopPropagation();">
                            <span class="material-symbols-outlined">visibility</span> View
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="PdfToJpgController.saveImage(${i}); event.stopPropagation();">
                            <span class="material-symbols-outlined">download</span> Save
                        </button>
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        preview.innerHTML = html;
        preview.style.display = 'block';

        var selectAllCheckbox = document.getElementById('selectAllJpg');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', function() {
                var isChecked = this.checked;
                document.querySelectorAll('.img-select-checkbox').forEach(function(cb) {
                    cb.checked = isChecked;
                });
                updateSelectedCount();
            });
        }

        document.querySelectorAll('.img-select-checkbox').forEach(function(cb) {
            cb.addEventListener('change', updateSelectedCount);
        });

        updateSelectedCount();
    }

    function updateSelectedCount() {
        var checkboxes = document.querySelectorAll('.img-select-checkbox');
        var checkedBoxes = document.querySelectorAll('.img-select-checkbox:checked');
        var total = checkboxes.length;
        var selected = checkedBoxes.length;
        
        var countText = document.getElementById('selectedCountText');
        if (countText) countText.textContent = selected + ' of ' + total + ' selected';
        
        var selectAllCheckbox = document.getElementById('selectAllJpg');
        if (selectAllCheckbox) selectAllCheckbox.checked = (selected === total);
        
        var downloadZipBtn = document.getElementById('downloadJpgZip');
        if (downloadZipBtn) {
            downloadZipBtn.disabled = (selected === 0);
            downloadZipBtn.style.opacity = (selected === 0) ? '0.5' : '1';
        }
    }

    function viewImage(index) {
        if (!resultImages[index]) return;
        var imgObj = resultImages[index];
        var modal = document.getElementById('img-preview-modal');
        if (modal) modal.remove();
        
        modal = document.createElement('div');
        modal.id = 'img-preview-modal';
        modal.className = 'image-modal';
        
        var fullUrl = imgObj.canvas.toDataURL('image/jpeg', 0.95);
        
        modal.innerHTML = `
            <div class="modal-header">
                <h3>Page ${imgObj.page}</h3>
                <div class="modal-actions">
                    <button id="modal-download-btn" class="btn btn-primary">
                        <span class="material-symbols-outlined">download</span> Download
                    </button>
                    <button id="close-img-modal" class="btn btn-secondary">
                        <span class="material-symbols-outlined">close</span> Close
                    </button>
                </div>
            </div>
            <div class="modal-content">
                <img src="${fullUrl}" alt="Page ${imgObj.page}">
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('close-img-modal').addEventListener('click', function() { modal.remove(); });
        document.getElementById('modal-download-btn').addEventListener('click', function() { saveImage(index); modal.remove(); });
        modal.querySelector('.modal-content').addEventListener('click', function(e) { if (e.target === this) modal.remove(); });
        
        function closeOnEscape(e) {
            if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', closeOnEscape); }
        }
        document.addEventListener('keydown', closeOnEscape);
    }

    function saveImage(index) {
        if (!resultImages[index]) return;
        var imgObj = resultImages[index];
        var dataURL = imgObj.canvas.toDataURL('image/jpeg', 0.95);
        var link = document.createElement('a');
        link.download = 'page_' + imgObj.page + '.jpg';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('success', 'Downloaded page ' + imgObj.page);
    }

    async function downloadZip() {
        var checkboxes = document.querySelectorAll('.img-select-checkbox:checked');
        var indices = [];
        checkboxes.forEach(function(cb) { indices.push(parseInt(cb.getAttribute('data-index'))); });
        
        if (indices.length === 0) {
            showToast('warning', 'Please select at least one image');
            return;
        }

        try {
            showToast('info', 'Creating ZIP with ' + indices.length + ' images...');
            var files = [];
            for (var i = 0; i < indices.length; i++) {
                var img = resultImages[indices[i]];
                var blob = await FileHelpers.canvasToBlob(img.canvas, 'image/jpeg', 0.95);
                files.push({ filename: 'page_' + img.page + '.jpg', data: blob });
            }
            var zip = await ZipHelpers.createZip(files);
            DownloadHelpers.downloadBlob(zip, 'pdf_pages.zip');
            showToast('success', 'Downloaded ' + indices.length + ' images as ZIP');
        } catch (error) {
            console.error('ZIP creation error:', error);
            showToast('error', 'Failed to create ZIP: ' + error.message);
        }
    }

    return {
        render: render,
        viewImage: viewImage,
        saveImage: saveImage
    };
})();

window.PdfToJpgController = PdfToJpgController;