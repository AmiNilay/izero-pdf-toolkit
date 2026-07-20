/**
 * Image Converter - UI Controller
 */

const ImageConverterToolController = (function() {
    'use strict';

    let currentFiles = [];
    let convertedResults = [];

    function render() {
        var container = document.getElementById('toolContent');
        if (!container) return;

        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-header">
                    <h2>🔄 Convert Images</h2>
                    <p>Convert images between formats (HEIC, RAW, TIFF, JPG, PNG, WebP, and more)</p>
                </div>

                <div class="upload-area" id="converterUploadArea">
                    <input type="file" id="converterFileInput" accept="image/*" multiple>
                    <div class="upload-icon material-symbols-outlined">upload_file</div>
                    <div class="upload-text">Drop your images here or click to browse</div>
                    <div class="upload-hint">Supports 60+ formats including HEIC, RAW, TIFF, JPG, PNG, WebP</div>
                </div>

                <div id="converterFileList" class="file-list" style="display: none;"></div>

                <div class="settings-group">
                    <label>
                        <span class="material-symbols-outlined">image</span>
                        Convert to:
                        <select id="targetFormat">
                            <option value="jpg">JPG (JPEG)</option>
                            <option value="png">PNG</option>
                            <option value="webp">WebP</option>
                            <option value="bmp">BMP</option>
                            <option value="ico">ICO</option>
                        </select>
                    </label>
                    <label>
                        <span class="material-symbols-outlined">high_quality</span>
                        Quality:
                        <input type="range" id="converterQuality" min="10" max="100" value="92">
                        <span id="converterQualityLabel">92%</span>
                    </label>
                </div>

                <div class="settings-group">
                    <label>
                        <span class="material-symbols-outlined">fit_screen</span>
                        Max Width:
                        <input type="number" id="converterMaxWidth" value="0" min="0" max="10000" style="width:80px;">
                        <span class="hint-text">(0 = keep original)</span>
                    </label>
                    <label>
                        <span class="material-symbols-outlined">fit_screen</span>
                        Max Height:
                        <input type="number" id="converterMaxHeight" value="0" min="0" max="10000" style="width:80px;">
                        <span class="hint-text">(0 = keep original)</span>
                    </label>
                </div>

                <button class="btn btn-primary" id="converterConvertBtn" disabled>
                    <span class="material-symbols-outlined">swap_horiz</span> Convert Images
                </button>

                <div class="progress-container">
                    <div class="progress-bar"></div>
                    <div class="progress-text"></div>
                </div>

                <div id="converterResult" class="result-section" style="display: none;">
                    <div class="result-card success">
                        <span class="material-symbols-outlined">check_circle</span>
                        <div>
                            <strong>Conversion Complete!</strong>
                            <p id="converterInfo"></p>
                        </div>
                    </div>
                    <div class="result-actions">
                        <button class="btn btn-success" id="converterDownloadAll">
                            <span class="material-symbols-outlined">download</span> Download All
                        </button>
                        <button class="btn btn-secondary" id="converterDownloadZip">
                            <span class="material-symbols-outlined">folder_zip</span> Download as ZIP
                        </button>
                    </div>
                </div>

                <div id="converterPreview" class="preview-area" style="display: none;"></div>
            </div>
        `;

        attachEvents();
    }

    function attachEvents() {
        var fileInput = document.getElementById('converterFileInput');
        var uploadArea = document.getElementById('converterUploadArea');
        var convertBtn = document.getElementById('converterConvertBtn');
        var qualityRange = document.getElementById('converterQuality');
        var qualityLabel = document.getElementById('converterQualityLabel');

        if (qualityRange && qualityLabel) {
            qualityRange.addEventListener('input', function() {
                qualityLabel.textContent = this.value + '%';
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                var files = Array.from(this.files);
                if (files.length > 0) {
                    handleFiles(files);
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
                if (files.length > 0) {
                    handleFiles(files);
                }
            });
        }

        if (convertBtn) {
            convertBtn.addEventListener('click', convertFiles);
        }

        var downloadAllBtn = document.getElementById('converterDownloadAll');
        var downloadZipBtn = document.getElementById('converterDownloadZip');

        if (downloadAllBtn) {
            downloadAllBtn.addEventListener('click', downloadAll);
        }

        if (downloadZipBtn) {
            downloadZipBtn.addEventListener('click', downloadZip);
        }
    }

    function handleFiles(files) {
        var images = files.filter(function(f) {
            return Validators.isImage(f);
        });
        
        if (images.length === 0) {
            showToast('error', 'No valid image files found');
            return;
        }

        // Check if ImageConverter exists
        if (typeof ImageConverter === 'undefined') {
            showToast('error', 'Image Converter engine not loaded');
            return;
        }

        var unsupported = images.filter(function(f) {
            return !ImageConverter.isFormatSupported(f.type);
        });

        if (unsupported.length > 0) {
            var names = unsupported.map(function(f) { return f.name; }).join(', ');
            showToast('warning', 'Some formats may not be supported: ' + names);
        }

        currentFiles = images;
        updateFileList();

        var convertBtn = document.getElementById('converterConvertBtn');
        if (convertBtn) convertBtn.disabled = false;

        showToast('success', 'Loaded ' + images.length + ' images');
    }

    function updateFileList() {
        var list = document.getElementById('converterFileList');
        if (!list) return;

        if (currentFiles.length === 0) {
            list.style.display = 'none';
            list.innerHTML = '';
            return;
        }

        list.style.display = 'block';
        var html = '';
        
        for (var i = 0; i < currentFiles.length; i++) {
            var file = currentFiles[i];
            var format = file.type || 'unknown';
            var formatLabel = 'Unknown';
            
            if (typeof ImageConverter !== 'undefined' && ImageConverter.SUPPORTED_FORMATS) {
                var supported = ImageConverter.SUPPORTED_FORMATS[format];
                if (supported) {
                    formatLabel = supported.label || format;
                }
            }
            
            html += `
                <div class="file-item">
                    <span class="material-symbols-outlined">image</span>
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${FileHelpers.formatFileSize(file.size)}</span>
                    <span class="file-format">${formatLabel}</span>
                    <button class="remove-file-btn" data-index="${i}">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
            `;
        }
        
        list.innerHTML = html;

        list.querySelectorAll('.remove-file-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var index = parseInt(this.dataset.index);
                currentFiles.splice(index, 1);
                updateFileList();
                if (currentFiles.length === 0) {
                    document.getElementById('converterConvertBtn').disabled = true;
                    document.getElementById('converterResult').style.display = 'none';
                }
            });
        });
    }

    async function convertFiles() {
        if (currentFiles.length === 0) {
            showToast('warning', 'Please add images first');
            return;
        }

        if (typeof ImageConverter === 'undefined') {
            showToast('error', 'Image Converter engine not loaded');
            return;
        }

        var convertBtn = document.getElementById('converterConvertBtn');
        convertBtn.disabled = true;
        convertBtn.textContent = 'Converting...';

        try {
            var targetFormat = document.getElementById('targetFormat').value;
            var quality = parseInt(document.getElementById('converterQuality').value) / 100;
            var maxWidth = parseInt(document.getElementById('converterMaxWidth').value) || null;
            var maxHeight = parseInt(document.getElementById('converterMaxHeight').value) || null;

            var sameFormat = currentFiles.filter(function(f) {
                var ext = FileHelpers.getFileExtension(f.name);
                return ext === targetFormat;
            });

            if (sameFormat.length > 0) {
                var names = sameFormat.map(function(f) { return f.name; }).join(', ');
                if (sameFormat.length === currentFiles.length) {
                    showToast('info', 'All files are already in ' + targetFormat.toUpperCase() + ' format');
                    convertBtn.disabled = false;
                    convertBtn.textContent = 'Convert Images';
                    return;
                } else {
                    showToast('warning', 'Some files are already in ' + targetFormat.toUpperCase() + ' format: ' + names);
                }
            }

            convertedResults = await ImageConverter.batchConvert(currentFiles, targetFormat, {
                quality: quality,
                maxWidth: maxWidth,
                maxHeight: maxHeight
            });

            var resultDiv = document.getElementById('converterResult');
            if (resultDiv) {
                resultDiv.style.display = 'block';
            }

            var infoSpan = document.getElementById('converterInfo');
            if (infoSpan) {
                var converted = convertedResults.filter(function(r) { return !r.sameFormat; });
                var skipped = convertedResults.filter(function(r) { return r.sameFormat; });
                var msg = converted.length + ' files converted';
                if (skipped.length > 0) {
                    msg += ', ' + skipped.length + ' files skipped (already in target format)';
                }
                infoSpan.textContent = msg;
            }

            showPreview(convertedResults);
            showToast('success', 'Conversion complete!');

        } catch (error) {
            console.error('Conversion error:', error);
            showToast('error', 'Conversion failed: ' + error.message);
        } finally {
            convertBtn.disabled = false;
            convertBtn.textContent = 'Convert Images';
        }
    }

    function showPreview(results) {
        var preview = document.getElementById('converterPreview');
        if (!preview) return;

        var html = '<div class="preview-grid">';
        var count = 0;
        
        for (var i = 0; i < results.length; i++) {
            var result = results[i];
            if (result.sameFormat) continue;
            if (count >= 12) break;
            
            var dataURL = result.canvas.toDataURL('image/png');
            html += `
                <div class="preview-item">
                    <img src="${dataURL}" alt="Converted ${i + 1}">
                    <span class="page-number">${result.format.toUpperCase()}</span>
                </div>
            `;
            count++;
        }
        
        if (results.length > 12) {
            html += '<div class="preview-item more-item">+' + (results.length - 12) + ' more</div>';
        }
        
        html += '</div>';
        preview.innerHTML = html;
        preview.style.display = 'block';
    }

    function downloadAll() {
        if (convertedResults.length === 0) {
            showToast('warning', 'No files to download');
            return;
        }

        for (var i = 0; i < convertedResults.length; i++) {
            var result = convertedResults[i];
            if (result.sameFormat) continue;
            DownloadHelpers.downloadBlob(result.blob, result.file.name);
        }

        showToast('success', 'Downloaded ' + convertedResults.length + ' files');
    }

    async function downloadZip() {
        if (convertedResults.length === 0) {
            showToast('warning', 'No files to download');
            return;
        }

        try {
            showToast('info', 'Creating ZIP...');
            
            var files = [];
            for (var i = 0; i < convertedResults.length; i++) {
                var result = convertedResults[i];
                if (result.sameFormat) continue;
                files.push({
                    filename: result.file.name,
                    data: result.blob
                });
            }
            
            if (files.length === 0) {
                showToast('warning', 'No converted files to ZIP');
                return;
            }
            
            var zip = await ZipHelpers.createZip(files);
            DownloadHelpers.downloadBlob(zip, 'converted_images.zip');
            
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

window.ImageConverterToolController = ImageConverterToolController;