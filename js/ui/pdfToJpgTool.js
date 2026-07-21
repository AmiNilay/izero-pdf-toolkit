/**
 * PDF to Images - UI Controller
 * Supports PNG / JPG, DPI, quality, selection & ZIP download
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
                    <h2>🖼️ PDF → Images</h2>
                    <p>Extract all pages from a PDF as individual images</p>
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
                    <label>
                        <span class="material-symbols-outlined">resolution</span>
                        DPI:
                        <select id="jpgDpi">
                            <option value="72">72 (Web)</option>
                            <option value="150" selected>150 (Print)</option>
                            <option value="300">300 (High Quality)</option>
                        </select>
                    </label>
                    <label>
                        <span class="material-symbols-outlined">format_paint</span>
                        Format:
                        <select id="imageFormat">
                            <option value="image/png">PNG</option>
                            <option value="image/jpeg" selected>JPG</option>
                        </select>
                    </label>
                    <label>
                        <span class="material-symbols-outlined">photo_quality</span>
                        Quality:
                        <input type="range" id="jpgQuality" min="10" max="100" value="92">
                        <span id="jpgQualityValue">92%</span>
                    </label>
                </div>

                <button class="btn btn-primary" id="convertToJpgBtn" disabled>
                    <span class="material-symbols-outlined">image_search</span> Convert to Images
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
                    <div class="result-actions" style="margin-top: 16px;">
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
            convertBtn.addEventListener('click', convertToImages);
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

    async function convertToImages() {
        if (!currentFile) {
            showToast('warning', 'Please upload a PDF first');
            return;
        }

        const convertBtn = document.getElementById('convertToJpgBtn');
        convertBtn.disabled = true;
        convertBtn.textContent = 'Converting...';

        try {
            const dpi = parseInt(document.getElementById('jpgDpi').value);
            const format = document.getElementById('imageFormat').value;
            const quality = parseInt(document.getElementById('jpgQuality').value) / 100;

            // Use the existing PDFProcessor.pdfToImages with format & quality
            resultImages = await PDFProcessor.pdfToImages(currentFile, {
                dpi: dpi,
                format: format,
                quality: quality
            });

            displayResults(resultImages);

            document.getElementById('jpgResult').style.display = 'block';
            document.getElementById('jpgInfo').textContent = resultImages.length + ' pages converted. Select pages and download as ZIP, or save individually.';

            showToast('success', 'Converted ' + resultImages.length + ' pages');

        } catch (error) {
            console.error('Conversion error:', error);
            showToast('error', 'Conversion failed: ' + error.message);
        } finally {
            convertBtn.disabled = false;
            convertBtn.textContent = 'Convert to Images';
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

        // Build the grid with checkboxes and controls
        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; padding: 0 4px;">
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: 600; font-size: 16px;">
                    <input type="checkbox" id="selectAllJpg" checked style="width: 20px; height: 20px; cursor: pointer; accent-color: #2563eb;"> 
                    Select All
                </label>
                <span id="selectedCountText" style="font-size: 15px; color: #6b7280; font-weight: 500;">${images.length} of ${images.length} selected</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 20px;">
        `;

        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            const thumbUrl = img.canvas.toDataURL('image/jpeg', 0.6);

            html += `
                <div style="background: #f9fafb; border-radius: 12px; padding: 16px; border: 2px solid #e5e7eb; display: flex; flex-direction: column; transition: border-color 0.2s;">
                    <div style="position: relative; margin-bottom: 12px;">
                        <input type="checkbox" class="img-select-checkbox" data-index="${i}" checked style="position: absolute; top: 10px; left: 10px; width: 20px; height: 20px; cursor: pointer; z-index: 10; accent-color: #2563eb;">
                        <div style="width: 100%; aspect-ratio: 1/1.414; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer;" onclick="PdfToJpgController.viewImage(${i})">
                            <img src="${thumbUrl}" alt="Page ${img.page}" style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                    </div>
                    <div style="font-size: 15px; font-weight: 600; color: #1f2937; text-align: center; margin-bottom: 12px;">Page ${img.page}</div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="btn btn-secondary" onclick="PdfToJpgController.viewImage(${i}); event.stopPropagation();" style="flex: 1; padding: 10px; font-size: 13px; margin: 0; border-radius: 8px; min-width: 70px;">
                            <span class="material-symbols-outlined" style="font-size: 18px; vertical-align: middle; margin-right: 4px;">visibility</span> View
                        </button>
                        <button class="btn btn-primary" onclick="PdfToJpgController.saveImage(${i}); event.stopPropagation();" style="flex: 1; padding: 10px; font-size: 13px; margin: 0; border-radius: 8px; min-width: 70px;">
                            <span class="material-symbols-outlined" style="font-size: 18px; vertical-align: middle; margin-right: 4px;">download</span> Save
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

        const selectAll = document.getElementById('selectAllJpg');
        if (selectAll) {
            selectAll.checked = (selected === total && total > 0);
        }

        const downloadBtn = document.getElementById('downloadJpgZip');
        if (downloadBtn) {
            downloadBtn.disabled = (selected === 0);
            downloadBtn.style.opacity = (selected === 0) ? '0.5' : '1';
        }
    }

    // View image in full-screen modal
    function viewImage(index) {
        if (!resultImages[index]) return;

        const imgObj = resultImages[index];
        let modal = document.getElementById('img-preview-modal');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = 'img-preview-modal';
        modal.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;";

        const fullUrl = imgObj.canvas.toDataURL('image/jpeg', 0.95);

        modal.innerHTML = `
            <div style="position: absolute; top: 20px; right: 20px; display: flex; gap: 12px; flex-wrap: wrap; justify-content: flex-end;">
                <button onclick="PdfToJpgController.saveImage(${index}); document.getElementById('img-preview-modal').remove();" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                    <span class="material-symbols-outlined">download</span> Download
                </button>
                <button id="close-img-modal" style="padding: 10px 20px; background: white; color: #000; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px;">
                     ✕ Close
                </button>
            </div>
            <div style="color: white; font-size: 18px; font-weight: 600; margin-bottom: 20px; text-align: center;">Page ${imgObj.page}</div>
            <img src="${fullUrl}" style="max-width: 100%; max-height: 85vh; object-fit: contain; box-shadow: 0 8px 32px rgba(0,0,0,0.5); border-radius: 8px; background: white;" onclick="event.stopPropagation();">
        `;

        document.body.appendChild(modal);

        document.getElementById('close-img-modal').addEventListener('click', function() {
            modal.remove();
        });
        modal.addEventListener('click', function(e) {
            if (e.target === modal) modal.remove();
        });
        document.addEventListener('keydown', function closeOnEscape(e) {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', closeOnEscape);
            }
        });
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