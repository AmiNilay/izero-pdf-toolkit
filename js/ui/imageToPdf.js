/**
 * Images to PDF - UI Controller
 */

const ImageToPdfController = (function() {
    'use strict';

    var uploadedImages = [];
    var resultPdf = null;

    function render() {
        var container = document.getElementById('toolContent');
        if (!container) return;

        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-header">
                    <h2>🖼️ Images → PDF</h2>
                    <p>Convert multiple images into a single PDF document</p>
                </div>

                <div class="upload-area" id="imageUploadArea">
                    <input type="file" id="imageFileInput" accept="image/*" multiple>
                    <div class="upload-icon material-symbols-outlined">image</div>
                    <div class="upload-text">Drop your images here or click to browse</div>
                    <div class="upload-hint">Supports JPG, PNG, WebP, BMP, GIF</div>
                </div>

                <div id="imageList" class="file-list"></div>

                <div class="settings-group">
                    <label>
                        <span class="material-symbols-outlined">description</span>
                        Page Size:
                        <select id="pageSizeSelect">
                            <option value="a4" selected>A4</option>
                            <option value="letter">Letter</option>
                            <option value="legal">Legal</option>
                            <option value="a3">A3</option>
                            <option value="a5">A5</option>
                        </select>
                    </label>
                    <label>
                        <span class="material-symbols-outlined">crop_rotate</span>
                        Orientation:
                        <select id="orientationSelect">
                            <option value="portrait" selected>Portrait</option>
                            <option value="landscape">Landscape</option>
                        </select>
                    </label>
                    <label>
                        <span class="material-symbols-outlined">fit_screen</span>
                        Image Fit:
                        <select id="fitSelect">
                            <option value="contain" selected>Contain</option>
                            <option value="cover">Cover</option>
                            <option value="fill">Fill</option>
                        </select>
                    </label>
                    <label>
                        <span class="material-symbols-outlined">high_quality</span>
                        Quality:
                        <input type="range" id="pdfQualityRange" min="1" max="100" value="92">
                        <span id="pdfQualityLabel">92%</span>
                    </label>
                </div>

                <button class="btn btn-primary" id="createPdfBtn" disabled>
                    <span class="material-symbols-outlined">picture_as_pdf</span> Create PDF
                </button>

                <div class="progress-container">
                    <div class="progress-bar"></div>
                    <div class="progress-text"></div>
                </div>

                <div class="preview-area" id="imagesPreview">
                    <p class="preview-placeholder">Upload images to see preview</p>
                </div>

                <div id="pdfDownloadSection" class="result-section" style="display: none;">
                    <div class="result-card success">
                        <span class="material-symbols-outlined">check_circle</span>
                        <div>
                            <strong>PDF Created!</strong>
                            <p id="pdfSizeInfo"></p>
                        </div>
                    </div>
                    <div class="result-actions">
                        <button class="btn btn-success" id="downloadPdfBtn">
                            <span class="material-symbols-outlined">download</span> Download PDF
                        </button>
                    </div>
                </div>
            </div>
        `;

        attachEvents();
    }

    function attachEvents() {
        var fileInput = document.getElementById('imageFileInput');
        var uploadArea = document.getElementById('imageUploadArea');
        var createBtn = document.getElementById('createPdfBtn');
        var qualityRange = document.getElementById('pdfQualityRange');
        var qualityLabel = document.getElementById('pdfQualityLabel');
        var downloadBtn = document.getElementById('downloadPdfBtn');

        if (qualityRange && qualityLabel) {
            qualityRange.addEventListener('input', function() {
                qualityLabel.textContent = this.value + '%';
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                var files = Array.from(this.files);
                if (files.length > 0) {
                    addImages(files);
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
                var files = Array.from(e.dataTransfer.files);
                addImages(files);
            });
        }

        if (createBtn) {
            createBtn.addEventListener('click', createPdf);
        }

        if (downloadBtn) {
            downloadBtn.addEventListener('click', downloadPdf);
        }
    }

    function addImages(files) {
        var validImages = files.filter(function(f) {
            return Validators.isImage(f);
        });
        
        if (validImages.length === 0) {
            showToast('warning', 'No valid image files found');
            return;
        }

        uploadedImages = uploadedImages.concat(validImages);
        updateImageList();
        updatePreview();
        
        var createBtn = document.getElementById('createPdfBtn');
        if (createBtn) createBtn.disabled = false;

        showToast('success', 'Added ' + validImages.length + ' images');
    }

    function updateImageList() {
        var list = document.getElementById('imageList');
        if (!list) return;

        if (uploadedImages.length === 0) {
            list.innerHTML = '';
            list.style.display = 'none';
            return;
        }

        list.style.display = 'block';
        var html = '<div class="file-list">';
        
        for (var i = 0; i < uploadedImages.length; i++) {
            var img = uploadedImages[i];
            html += `
                <div class="file-item">
                    <span class="material-symbols-outlined">image</span>
                    <span class="file-name">${img.name}</span>
                    <span class="file-size">${FileHelpers.formatFileSize(img.size)}</span>
                    <button class="remove-file-btn" data-index="${i}">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
            `;
        }
        
        html += '</div>';
        list.innerHTML = html;

        list.querySelectorAll('.remove-file-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var index = parseInt(this.dataset.index);
                uploadedImages.splice(index, 1);
                updateImageList();
                updatePreview();
                if (uploadedImages.length === 0) {
                    document.getElementById('createPdfBtn').disabled = true;
                }
            });
        });
    }

    function updatePreview() {
        var preview = document.getElementById('imagesPreview');
        if (!preview) return;

        if (uploadedImages.length === 0) {
            preview.innerHTML = '<p class="preview-placeholder">Upload images to see preview</p>';
            return;
        }

        var html = '<div class="preview-grid">';
        
        for (var i = 0; i < Math.min(uploadedImages.length, 12); i++) {
            var img = uploadedImages[i];
            var url = URL.createObjectURL(img);
            html += `
                <div class="preview-item">
                    <img src="${url}" alt="${img.name}">
                    <span class="page-number">${i + 1}</span>
                </div>
            `;
            setTimeout(function() { URL.revokeObjectURL(url); }, 10000);
        }
        
        if (uploadedImages.length > 12) {
            html += '<div class="preview-item more-item">+' + (uploadedImages.length - 12) + ' more</div>';
        }
        
        html += '</div>';
        preview.innerHTML = html;
    }

    async function createPdf() {
        if (uploadedImages.length === 0) {
            showToast('warning', 'Please add at least one image');
            return;
        }

        var createBtn = document.getElementById('createPdfBtn');
        createBtn.disabled = true;
        createBtn.textContent = 'Creating...';

        try {
            var pageSize = document.getElementById('pageSizeSelect').value;
            var orientation = document.getElementById('orientationSelect').value;
            var fit = document.getElementById('fitSelect').value;
            var quality = parseInt(document.getElementById('pdfQualityRange').value) / 100;

            var pdf = await ImageProcessor.imagesToPDF(uploadedImages, {
                pageSize: pageSize,
                orientation: orientation,
                fit: fit,
                quality: quality,
                margin: 10
            });

            resultPdf = pdf;
            
            var downloadSection = document.getElementById('pdfDownloadSection');
            if (downloadSection) {
                downloadSection.style.display = 'block';
            }

            var pdfBytes = pdf.output('arraybuffer');
            var sizeInfo = document.getElementById('pdfSizeInfo');
            if (sizeInfo) {
                sizeInfo.textContent = 'PDF Size: ' + FileHelpers.formatFileSize(pdfBytes.byteLength);
            }

            showToast('success', 'PDF created with ' + uploadedImages.length + ' pages');

        } catch (error) {
            console.error('PDF creation error:', error);
            showToast('error', 'Failed to create PDF: ' + error.message);
        } finally {
            createBtn.disabled = false;
            createBtn.textContent = 'Create PDF';
        }
    }

    function downloadPdf() {
        if (!resultPdf) {
            showToast('warning', 'Please create a PDF first');
            return;
        }

        try {
            var pdfBlob = resultPdf.output('blob');
            DownloadHelpers.downloadBlob(pdfBlob, 'converted.pdf');
            showToast('success', 'PDF downloaded');
        } catch (error) {
            console.error('Download error:', error);
            showToast('error', 'Download failed: ' + error.message);
        }
    }

    return {
        render: render
    };

})();

window.ImageToPdfController = ImageToPdfController;