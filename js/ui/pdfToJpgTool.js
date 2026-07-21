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
                    <div class="result-actions" style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px;">
                        <button class="btn btn-success" id="downloadJpgAll" style="flex: 1; min-width: 140px;">
                            <span class="material-symbols-outlined">download</span> Download Selected
                        </button>
                        <button class="btn btn-secondary" id="downloadJpgZip" style="flex: 1; min-width: 140px;">
                            <span class="material-symbols-outlined">folder_zip</span> Download ZIP
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
            document.getElementById('jpgInfo').textContent = resultImages.length + ' pages converted. Select the ones you want to download.';

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
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 500;">
                    <input type="checkbox" id="selectAllJpg" checked style="width: 18px; height: 18px; cursor: pointer;"> 
                    Select All (${images.length} pages)
                </label>
                <span id="selectedCountText" style="font-size: 14px; color: var(--md-sys-color-on-surface-variant, #6b7280);">${images.length} of ${images.length} selected</span>
            </div>
            <div class="preview-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px;">
        `;
        
        for (var i = 0; i < images.length; i++) {
            var img = images[i];
            // Use lower quality for grid thumbnails to save memory and improve load speed
            var thumbUrl = img.canvas.toDataURL('image/jpeg', 0.5); 
            html += `
                <div class="preview-item" style="position: relative; background: var(--md-sys-color-surface-container, #f9fafb); border-radius: 12px; padding: 12px; border: 1px solid var(--md-sys-color-outline-variant, #e5e7eb); display: flex; flex-direction: column;">
                    <div style="position: absolute; top: 16px; left: 16px; z-index: 2;">
                        <input type="checkbox" class="img-select-checkbox" data-index="${i}" checked style="width: 18px; height: 18px; cursor: pointer;">
                    </div>
                    <div style="width: 100%; aspect-ratio: 1/1.414; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; margin-bottom: 12px; margin-top: 8px;">
                        <img src="${thumbUrl}" alt="Page ${img.page}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                    </div>
                    <div style="font-size: 14px; font-weight: 500; color: var(--md-sys-color-on-surface, #1f2937); text-align: center; margin-bottom: 12px;">Page ${img.page}</div>
                    <div style="display: flex; gap: 8px; margin-top: auto;">
                        <button class="btn btn-secondary view-img-btn" data-index="${i}" style="flex: 1; padding: 8px; font-size: 12px; margin: 0;">
                            <span class="material-symbols-outlined" style="font-size: 16px; vertical-align: middle;">visibility</span> View
                        </button>
                        <button class="btn btn-primary download-single-btn" data-index="${i}" style="flex: 1; padding: 8px; font-size: 12px; margin: 0;">
                            <span class="material-symbols-outlined" style="font-size: 16px; vertical-align: middle;">download</span> Save
                        </button>
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        preview.innerHTML = html;
        preview.style.display = 'block';

        // Attach selection events
        document.getElementById('selectAllJpg').addEventListener('change', toggleSelectAll);
        document.querySelectorAll('.img-select-checkbox').forEach(function(cb) {
            cb.addEventListener('change', updateSelectedCount);
        });

        // Attach view events
        document.querySelectorAll('.view-img-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var idx = parseInt(this.getAttribute('data-index'));
                showImageModal(images[idx]);
            });
        });

        // Attach single download events
        document.querySelectorAll('.download-single-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var idx = parseInt(this.getAttribute('data-index'));
                downloadSingleImage(images[idx]);
            });
        });
    }

    function getSelectedIndices() {
        var indices = [];
        document.querySelectorAll('.img-select-checkbox').forEach(function(cb) {
            if (cb.checked) {
                indices.push(parseInt(cb.getAttribute('data-index')));
            }
        });
        return indices;
    }

    function toggleSelectAll() {
        var isChecked = document.getElementById('selectAllJpg').checked;
        document.querySelectorAll('.img-select-checkbox').forEach(function(cb) {
            cb.checked = isChecked;
        });
        updateSelectedCount();
    }

    function updateSelectedCount() {
        var total = document.querySelectorAll('.img-select-checkbox').length;
        var selected = document.querySelectorAll('.img-select-checkbox:checked').length;
        document.getElementById('selectedCountText').textContent = selected + ' of ' + total + ' selected';
        document.getElementById('selectAllJpg').checked = (selected === total);
        
        // Disable bulk buttons if nothing is selected
        var downloadAllBtn = document.getElementById('downloadJpgAll');
        var downloadZipBtn = document.getElementById('downloadJpgZip');
        if (selected === 0) {
            downloadAllBtn.disabled = true;
            downloadZipBtn.disabled = true;
        } else {
            downloadAllBtn.disabled = false;
            downloadZipBtn.disabled = false;
        }
    }

    function showImageModal(imgObj) {
        var modal = document.getElementById('img-preview-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'img-preview-modal';
            modal.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; backdrop-filter: blur(4px);";
            
            modal.innerHTML = `
                <div style="width: 100%; max-width: 900px; display: flex; justify-content: space-between; align-items: center; color: white; margin-bottom: 20px; padding: 0 10px;">
                    <h3 style="margin: 0; font-size: 18px;">Page ${imgObj.page}</h3>
                    <button id="close-img-modal" style="padding: 8px 16px; background: #fff; color: #000; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Close</button>
                </div>
                <div id="modal-img-container" style="display: flex; align-items: center; justify-content: center; width: 100%; max-width: 900px; max-height: 80vh; overflow: auto;"></div>
            `;
            document.body.appendChild(modal);
            
            document.getElementById('close-img-modal').addEventListener('click', function() {
                modal.remove();
            });
        } else {
            modal.querySelector('h3').textContent = 'Page ' + imgObj.page;
            modal.style.display = 'flex';
        }

        var container = document.getElementById('modal-img-container');
        container.innerHTML = '';
        // Use higher quality for the full-screen modal view
        var fullUrl = imgObj.canvas.toDataURL('image/jpeg', 0.9);
        var imgEl = document.createElement('img');
        imgEl.src = fullUrl;
        imgEl.style.cssText = 'max-width: 100%; max-height: 80vh; object-fit: contain; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border-radius: 4px; background: white;';
        container.appendChild(imgEl);
    }

    function downloadSingleImage(imgObj) {
        var dataURL = imgObj.canvas.toDataURL('image/jpeg', 0.9);
        var link = document.createElement('a');
        link.download = 'page_' + imgObj.page + '.jpg';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('success', 'Downloaded page ' + imgObj.page);
    }

    function downloadAll() {
        var indices = getSelectedIndices();
        if (indices.length === 0) {
            showToast('warning', 'Please select at least one image');
            return;
        }

        for (var i = 0; i < indices.length; i++) {
            var img = resultImages[indices[i]];
            var dataURL = img.canvas.toDataURL('image/jpeg', 0.9);
            var link = document.createElement('a');
            link.download = 'page_' + img.page + '.jpg';
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        showToast('success', 'Downloaded ' + indices.length + ' images');
    }

    async function downloadZip() {
        var indices = getSelectedIndices();
        if (indices.length === 0) {
            showToast('warning', 'Please select at least one image');
            return;
        }

        try {
            showToast('info', 'Creating ZIP...');
            
            var files = [];
            for (var i = 0; i < indices.length; i++) {
                var img = resultImages[indices[i]];
                var blob = await FileHelpers.canvasToBlob(img.canvas, 'image/jpeg', 0.9);
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