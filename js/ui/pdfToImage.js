/**
 * PDF to Image - UI Controller
 */

const PdfToImageController = (function() {
    'use strict';

    var currentFile = null;
    var resultImages = [];

    function render() {
        var container = document.getElementById('toolContent');
        if (!container) return;

        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-header">
                    <h2>🖼️ PDF → Images</h2>
                    <p>Convert PDF pages to high-quality images</p>
                </div>

                <div class="upload-area" id="pdfImageUploadArea">
                    <input type="file" id="pdfImageFileInput" accept=".pdf,application/pdf">
                    <div class="upload-icon material-symbols-outlined">photo</div>
                    <div class="upload-text">Drop your PDF here or click to browse</div>
                    <div class="upload-hint">Exports each page as an image</div>
                </div>

                <div id="pdfImageInfo" class="file-info" style="display: none;">
                    <span id="pdfImageFileDetails"></span>
                </div>

                <div class="settings-group">
                    <label>
                        <span class="material-symbols-outlined">photo_quality</span>
                        Quality:
                        <input type="range" id="imageQuality" min="10" max="100" value="85">
                        <span id="imageQualityValue">85%</span>
                    </label>
                    <label>
                        <span class="material-symbols-outlined">resolution</span>
                        DPI:
                        <select id="imageDpi">
                            <option value="72">72 (Web)</option>
                            <option value="150" selected>150 (Print)</option>
                            <option value="300">300 (High Quality)</option>
                        </select>
                    </label>
                </div>

                <button class="btn btn-primary" id="convertToImageBtn" disabled>
                    <span class="material-symbols-outlined">image_search</span> Convert to Images
                </button>

                <div class="progress-container">
                    <div class="progress-bar"></div>
                    <div class="progress-text"></div>
                </div>

                <div id="imageResult" class="result-section" style="display: none;">
                    <div class="result-card success">
                        <span class="material-symbols-outlined">check_circle</span>
                        <div>
                            <strong>Conversion Complete!</strong>
                            <p id="imageInfo"></p>
                        </div>
                    </div>
                    <div class="result-actions">
                        <button class="btn btn-success" id="downloadImageZip">
                            <span class="material-symbols-outlined">folder_zip</span> Download Selected as ZIP
                        </button>
                    </div>
                </div>

                <div id="imagePreview" class="preview-area" style="display: none;"></div>
            </div>
        `;

        attachEvents();
    }

    function attachEvents() {
        var fileInput = document.getElementById('pdfImageFileInput');
        var uploadArea = document.getElementById('pdfImageUploadArea');
        var convertBtn = document.getElementById('convertToImageBtn');
        var qualityRange = document.getElementById('imageQuality');
        var qualityLabel = document.getElementById('imageQualityValue');
        var downloadZipBtn = document.getElementById('downloadImageZip');

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
            convertBtn.addEventListener('click', convertToImages);
        }

        if (downloadZipBtn) {
            downloadZipBtn.addEventListener('click', downloadZip);
        }
    }

    async function handleFile(file) {
        currentFile = file;
        try {
            var info = await PDFProcessor.getPDFInfo(file);
            var infoDiv = document.getElementById('pdfImageInfo');
            var details = document.getElementById('pdfImageFileDetails');
            if (infoDiv && details) {
                infoDiv.style.display = 'block';
                details.textContent = '📄 ' + file.name + ' (' + info.totalPages + ' pages)';
            }
            document.getElementById('convertToImageBtn').disabled = false;
            document.getElementById('imageResult').style.display = 'none';
            document.getElementById('imagePreview').style.display = 'none';
            showToast('success', 'Loaded PDF with ' + info.totalPages + ' pages');
        } catch (error) {
            console.error('Error reading PDF:', error);
            showToast('error', 'Failed to read PDF: ' + error.message);
        }
    }

    async function convertToImages() {
        if (!currentFile) {
            showToast('warning', 'Please upload a PDF first');
            return;
        }

        var convertBtn = document.getElementById('convertToImageBtn');
        convertBtn.disabled = true;
        convertBtn.textContent = 'Converting...';

        try {
            var dpi = parseInt(document.getElementById('imageDpi').value);
            var quality = parseInt(document.getElementById('imageQuality').value) / 100;

            resultImages = await PDFProcessor.pdfToImages(currentFile, {
                dpi: dpi,
                format: 'image/jpeg',
                quality: quality
            });

            displayResults(resultImages);
            document.getElementById('imageResult').style.display = 'block';
            document.getElementById('imageInfo').textContent = resultImages.length + ' pages converted. Select pages and download as ZIP, or save individually.';
            showToast('success', 'Converted ' + resultImages.length + ' pages to images');

        } catch (error) {
            console.error('Conversion error:', error);
            showToast('error', 'Conversion failed: ' + error.message);
        } finally {
            convertBtn.disabled = false;
            convertBtn.textContent = 'Convert to Images';
        }
    }

    function displayResults(images) {
        var preview = document.getElementById('imagePreview');
        if (!preview) return;

        if (!images || images.length === 0) {
            preview.innerHTML = '<p class="preview-placeholder">No images extracted</p>';
            preview.style.display = 'block';
            return;
        }

        var html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; padding: 0 4px;">
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: 600; font-size: 16px;">
                    <input type="checkbox" id="selectAllImages" checked style="width: 20px; height: 20px; cursor: pointer; accent-color: var(--md-sys-color-primary, #2563eb);"> 
                    Select All
                </label>
                <span id="selectedCountText" style="font-size: 15px; color: var(--md-sys-color-on-surface-variant, #6b7280); font-weight: 500;">${images.length} of ${images.length} selected</span>
            </div>
            <div class="preview-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 20px;">
        `;
        
        for (var i = 0; i < images.length; i++) {
            var img = images[i];
            var thumbUrl = img.canvas.toDataURL('image/jpeg', 0.6);
            
            html += `
                <div class="preview-item" style="background: var(--md-sys-color-surface-container, #f9fafb); border-radius: 12px; padding: 16px; border: 2px solid var(--md-sys-color-outline-variant, #e5e7eb); display: flex; flex-direction: column; transition: border-color 0.2s;">
                    <div style="position: relative; margin-bottom: 12px;">
                        <input type="checkbox" class="img-select-checkbox" data-index="${i}" checked style="position: absolute; top: 10px; left: 10px; width: 20px; height: 20px; cursor: pointer; z-index: 10; accent-color: var(--md-sys-color-primary, #2563eb);">
                        <div style="width: 100%; aspect-ratio: 1/1.414; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer;" onclick="PdfToImageController.viewImage(${i})">
                            <img src="${thumbUrl}" alt="Page ${img.page}" style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                    </div>
                    <div style="font-size: 15px; font-weight: 600; color: var(--md-sys-color-on-surface, #1f2937); text-align: center; margin-bottom: 12px;">Page ${img.page}</div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary" onclick="PdfToImageController.viewImage(${i}); event.stopPropagation();" style="flex: 1; padding: 10px; font-size: 13px; margin: 0; border-radius: 8px;">
                            <span class="material-symbols-outlined" style="font-size: 18px; vertical-align: middle; margin-right: 4px;">visibility</span> View
                        </button>
                        <button class="btn btn-primary" onclick="PdfToImageController.saveImage(${i}); event.stopPropagation();" style="flex: 1; padding: 10px; font-size: 13px; margin: 0; border-radius: 8px;">
                            <span class="material-symbols-outlined" style="font-size: 18px; vertical-align: middle; margin-right: 4px;">download</span> Save
                        </button>
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        preview.innerHTML = html;
        preview.style.display = 'block';

        var selectAllCheckbox = document.getElementById('selectAllImages');
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
        
        var selectAllCheckbox = document.getElementById('selectAllImages');
        if (selectAllCheckbox) selectAllCheckbox.checked = (selected === total);
        
        var downloadZipBtn = document.getElementById('downloadImageZip');
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
        modal.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;";
        
        var fullUrl = imgObj.canvas.toDataURL('image/jpeg', 0.95);
        
        modal.innerHTML = `
            <div style="position: absolute; top: 20px; right: 20px; display: flex; gap: 12px;">
                <button id="modal-download-btn" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                    <span class="material-symbols-outlined">download</span> Download
                </button>
                <button id="close-img-modal" style="padding: 10px 20px; background: white; color: #000; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px;">Close</button>
            </div>
            <div style="color: white; font-size: 18px; font-weight: 600; margin-bottom: 20px; text-align: center;">Page ${imgObj.page}</div>
            <img src="${fullUrl}" style="max-width: 100%; max-height: 85vh; object-fit: contain; box-shadow: 0 8px 32px rgba(0,0,0,0.5); border-radius: 8px; background: white;" onclick="event.stopPropagation();">
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('close-img-modal').addEventListener('click', function() { modal.remove(); });
        document.getElementById('modal-download-btn').addEventListener('click', function() { saveImage(index); modal.remove(); });
        modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
        
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

window.PdfToImageController = PdfToImageController;