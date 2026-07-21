/**
 * PDF to JPG - UI Controller
 *
 * Features:
 * - Upload PDF and convert each page to JPG
 * - Select individual pages via checkboxes
 * - "Select All" toggles all checkboxes with live counter
 * - View high-quality image in full-screen modal (click thumbnail or "View" button)
 * - Individual "Save" button per image for single-page downloads
 * - Single "Download Selected as ZIP" button for bulk export
 * - Mobile responsive grid with stacked buttons on small screens
 */

const PdfToJpgController = (function() {
    'use strict';

    let currentFile = null;
    let resultImages = [];

    function render() {
        const container = document.getElementById('toolContent');
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
        const fileInput = document.getElementById('pdfJpgFileInput');
        const uploadArea = document.getElementById('pdfJpgUploadArea');
        const convertBtn = document.getElementById('convertToJpgBtn');
        const qualityRange = document.getElementById('jpgQuality');
        const qualityLabel = document.getElementById('jpgQualityValue');
        const downloadZipBtn = document.getElementById('downloadJpgZip');

        if (qualityRange && qualityLabel) {
            qualityRange.addEventListener('input', function() {
                qualityLabel.textContent = this.value + '%';
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                const file = this.files[0];
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
                const file = e.dataTransfer.files[0];
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
            const info = await PDFProcessor.getPDFInfo(file);

            const infoDiv = document.getElementById('pdfJpgInfo');
            const details = document.getElementById('pdfJpgFileDetails');
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

        const convertBtn = document.getElementById('convertToJpgBtn');
        convertBtn.disabled = true;
        convertBtn.textContent = 'Converting...';

        try {
            const dpi = parseInt(document.getElementById('jpgDpi').value);
            const quality = parseInt(document.getElementById('jpgQuality').value) / 100;

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
        const preview = document.getElementById('jpgPreview');
        if (!preview) return;

        if (!images || images.length === 0) {
            preview.innerHTML = '<p class="preview-placeholder">No images extracted</p>';
            preview.style.display = 'block';
            return;
        }

        let html = `
            <div class="preview-toolbar">
                <label class="select-all-label">
                    <input type="checkbox" id="selectAllJpg" checked>
                    Select All
                </label>
                <span id="selectedCountText">${images.length} of ${images.length} selected</span>
            </div>
            <div class="preview-grid">
        `;

        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            const thumbUrl = img.canvas.toDataURL('image/jpeg', 0.6);

            html += `
                <div class="preview-item" data-index="${i}">
                    <div class="preview-thumb-wrapper">
                        <input type="checkbox" class="img-select-checkbox" data-index="${i}" checked>
                        <div class="preview-thumb" onclick="PdfToJpgController.viewImage(${i})">
                            <img src="${thumbUrl}" alt="Page ${img.page}" loading="lazy">
                        </div>
                    </div>
                    <div class="preview-item-info">
                        <span class="preview-page-label">Page ${img.page}</span>
                    </div>
                    <div class="preview-item-actions">
                        <button class="btn btn-secondary btn-sm" onclick="PdfToJpgController.viewImage(${i}); event.stopPropagation();">
                            <span class="material-symbols-outlined">visibility</span> View
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="PdfToJpgController.saveImage(${i}); event.stopPropagation();">
                            <span class="material-symbols-outlined">download</span> Save
                        </button>
                    </div>
                </div>
            `;
        }

        html += '</div>';
        preview.innerHTML = html;
        preview.style.display = 'block';

        // Attach selection events
        const selectAllCheckbox = document.getElementById('selectAllJpg');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', function() {
                const isChecked = this.checked;
                document.querySelectorAll('.img-select-checkbox').forEach(cb => {
                    cb.checked = isChecked;
                });
                updateSelectedCount();
            });
        }

        document.querySelectorAll('.img-select-checkbox').forEach(cb => {
            cb.addEventListener('change', updateSelectedCount);
        });

        updateSelectedCount();
    }

    function updateSelectedCount() {
        const checkboxes = document.querySelectorAll('.img-select-checkbox');
        const checkedBoxes = document.querySelectorAll('.img-select-checkbox:checked');
        const total = checkboxes.length;
        const selected = checkedBoxes.length;

        const countText = document.getElementById('selectedCountText');
        if (countText) {
            countText.textContent = selected + ' of ' + total + ' selected';
        }

        const selectAllCheckbox = document.getElementById('selectAllJpg');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = (selected === total && total > 0);
        }

        const downloadZipBtn = document.getElementById('downloadJpgZip');
        if (downloadZipBtn) {
            downloadZipBtn.disabled = (selected === 0);
            downloadZipBtn.style.opacity = (selected === 0) ? '0.5' : '1';
        }
    }

    function viewImage(index) {
        if (!resultImages[index]) return;

        const imgObj = resultImages[index];
        let modal = document.getElementById('img-preview-modal');

        if (modal) {
            modal.remove();
        }

        modal = document.createElement('div');
        modal.id = 'img-preview-modal';
        modal.className = 'img-preview-modal';

        const fullUrl = imgObj.canvas.toDataURL('image/jpeg', 0.95);

        modal.innerHTML = `
            <div class="img-modal-overlay" onclick="document.getElementById('img-preview-modal').remove();"></div>
            <div class="img-modal-content">
                <div class="img-modal-header">
                    <span class="img-modal-title">Page ${imgObj.page}</span>
                    <button id="close-img-modal" class="img-modal-close-btn">✕ Close</button>
                </div>
                <div class="img-modal-body">
                    <img src="${fullUrl}" alt="Page ${imgObj.page}" class="img-modal-image">
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close button
        document.getElementById('close-img-modal').addEventListener('click', function() {
            modal.remove();
        });

        // Close on Escape key
        function closeOnEscape(e) {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', closeOnEscape);
            }
        }
        document.addEventListener('keydown', closeOnEscape);
    }

    function saveImage(index) {
        if (!resultImages[index]) return;

        const imgObj = resultImages[index];
        const dataURL = imgObj.canvas.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.download = 'page_' + imgObj.page + '.jpg';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('success', 'Downloaded page ' + imgObj.page);
    }

    async function downloadZip() {
        const checkboxes = document.querySelectorAll('.img-select-checkbox:checked');
        const indices = [];
        checkboxes.forEach(cb => {
            indices.push(parseInt(cb.getAttribute('data-index')));
        });

        if (indices.length === 0) {
            showToast('warning', 'Please select at least one image');
            return;
        }

        try {
            showToast('info', 'Creating ZIP with ' + indices.length + ' images...');

            const files = [];
            for (let i = 0; i < indices.length; i++) {
                const img = resultImages[indices[i]];
                const blob = await FileHelpers.canvasToBlob(img.canvas, 'image/jpeg', 0.95);
                files.push({
                    filename: 'page_' + img.page + '.jpg',
                    data: blob
                });
            }

            const zip = await ZipHelpers.createZip(files);
            DownloadHelpers.downloadBlob(zip, 'pdf_pages.zip');

            showToast('success', 'Downloaded ' + indices.length + ' images as ZIP');
        } catch (error) {
            console.error('ZIP creation error:', error);
            showToast('error', 'Failed to create ZIP: ' + error.message);
        }
    }

    // Expose public methods
    return {
        render: render,
        viewImage: viewImage,
        saveImage: saveImage
    };

})();

window.PdfToJpgController = PdfToJpgController;