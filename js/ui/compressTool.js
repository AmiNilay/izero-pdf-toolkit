/**
 * Compress Tool - UI Controller with Size Presets
 */

const CompressToolController = (function() {
    'use strict';

    let currentFile = null;
    let compressedResult = null;
    let currentFileType = null;
    let isCompressing = false;

    const SIZE_PRESETS = [
        { label: '10 KB', value: 10 },
        { label: '20 KB', value: 20 },
        { label: '30 KB', value: 30 },
        { label: '40 KB', value: 40 },
        { label: '50 KB', value: 50 },
        { label: '60 KB', value: 60 },
        { label: '70 KB', value: 70 },
        { label: '80 KB', value: 80 },
        { label: '90 KB', value: 90 },
        { label: '100 KB', value: 100 },
        { label: '200 KB', value: 200 },
        { label: '500 KB', value: 500 },
        { label: '1 MB', value: 1024 }
    ];

    function render() {
        var container = document.getElementById('toolContent');
        if (!container) return;

        // ✅ REMOVED: <section class="page active"> wrapper
        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-header">
                    <h2>📦 Compress Files</h2>
                    <p>Reduce file size for PDFs and images</p>
                </div>

                <div class="upload-area" id="compressUploadArea">
                    <input type="file" id="compressFileInput" accept=".pdf,application/pdf,image/*">
                    <div class="upload-icon material-symbols-outlined">upload_file</div>
                    <div class="upload-text">Drop a PDF or image here or click to browse</div>
                    <div class="upload-hint">Supports PDF, JPG, PNG, WebP</div>
                </div>

                <div id="compressFileInfo" class="file-info" style="display: none;">
                    <span id="compressFileDetails"></span>
                </div>

                <div class="settings-group">
                    <label class="settings-label">Compression Mode</label>
                    <div class="mode-toggle">
                        <button class="btn btn-primary btn-sm compression-mode active" data-mode="quality">
                            <span class="material-symbols-outlined">tune</span> Quality Based
                        </button>
                        <button class="btn btn-secondary btn-sm compression-mode" data-mode="size">
                            <span class="material-symbols-outlined">target</span> Target Size
                        </button>
                    </div>
                </div>

                <div id="qualitySettings" class="settings-group">
                    <label>
                        <span class="material-symbols-outlined">signal_cellular_alt</span>
                        Compression Level:
                        <select id="compressLevel">
                            <option value="lossless">Lossless (Best Quality)</option>
                            <option value="balanced" selected>Balanced (Recommended)</option>
                            <option value="maximum">Maximum (Smallest size)</option>
                        </select>
                    </label>
                    <label id="imageQualityLabel">
                        <span class="material-symbols-outlined">high_quality</span>
                        Quality:
                        <input type="range" id="compressQuality" min="10" max="100" value="80">
                        <span id="qualityValue">80%</span>
                    </label>
                </div>

                <div id="sizeSettings" class="settings-group" style="display: none;">
                    <label class="settings-label">Target File Size</label>
                    <div class="preset-buttons">
                        ${SIZE_PRESETS.map(function(preset) {
                            return `<button class="btn btn-secondary btn-sm size-preset-btn" data-size="${preset.value}">${preset.label}</button>`;
                        }).join('')}
                    </div>
                    <div class="custom-size-input">
                        <label>
                            Custom Size:
                            <input type="number" id="targetSizeInput" min="1" max="10240" value="50">
                            <select id="targetSizeUnit">
                                <option value="KB">KB</option>
                                <option value="MB">MB</option>
                            </select>
                        </label>
                        <button class="btn btn-primary btn-sm" id="applyTargetSizeBtn">Apply</button>
                    </div>
                    <div class="estimate-box">
                        <span id="sizeEstimateText">Select a preset or enter a custom target size</span>
                    </div>
                </div>

                <div class="settings-group">
                    <label>
                        <input type="checkbox" id="autoOptimize" checked>
                        <span class="material-symbols-outlined">auto_awesome</span> Auto-optimize
                    </label>
                    <label id="resizeLabel">
                        <input type="checkbox" id="resizeImages">
                        <span class="material-symbols-outlined">aspect_ratio</span> Resize large images
                    </label>
                </div>

                <div id="resizeOptions" class="resize-options" style="display: none;">
                    <label>Max Width: <input type="number" id="maxWidth" value="1920" min="100"></label>
                    <label>Max Height: <input type="number" id="maxHeight" value="1080" min="100"></label>
                </div>

                <button class="btn btn-primary" id="compressBtn" disabled>
                    <span class="material-symbols-outlined">compress</span> Compress
                </button>

                <div class="progress-container">
                    <div class="progress-bar"></div>
                    <div class="progress-text"></div>
                </div>

                <div id="compressResult" class="result-section" style="display: none;">
                    <div class="result-grid">
                        <div class="result-card original">
                            <strong>Original</strong>
                            <p id="originalSizeDisplay"></p>
                            <span id="originalDimensions"></span>
                        </div>
                        <div class="result-card compressed">
                            <strong>Compressed</strong>
                            <p id="compressedSizeDisplay"></p>
                            <span id="compressionReduction"></span>
                        </div>
                    </div>
                    <div class="comparison-bar">
                        <div id="sizeComparisonBar" style="width: 100%;"></div>
                        <span id="sizeComparisonText">100%</span>
                    </div>
                    <div class="result-actions">
                        <button class="btn btn-success" id="downloadCompressedBtn">
                            <span class="material-symbols-outlined">download</span> Download Compressed
                        </button>
                        <button class="btn btn-secondary" id="compressAgainBtn">
                            <span class="material-symbols-outlined">refresh</span> Compress Again
                        </button>
                    </div>
                </div>

                <div id="compressPreview" class="preview-section" style="display: none;">
                    <h4>Preview</h4>
                    <div class="preview-grid">
                        <div>
                            <p>Original</p>
                            <div id="originalPreview" class="preview-box">
                                <p>No preview</p>
                            </div>
                        </div>
                        <div>
                            <p>Compressed</p>
                            <div id="compressedPreview" class="preview-box">
                                <p>No preview</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        attachEvents();
    }

    function attachEvents() {
        var fileInput = document.getElementById('compressFileInput');
        var uploadArea = document.getElementById('compressUploadArea');
        var compressBtn = document.getElementById('compressBtn');
        var downloadBtn = document.getElementById('downloadCompressedBtn');
        var compressAgainBtn = document.getElementById('compressAgainBtn');
        var qualityRange = document.getElementById('compressQuality');
        var qualityLabel = document.getElementById('qualityValue');
        var resizeCheck = document.getElementById('resizeImages');
        var resizeOptions = document.getElementById('resizeOptions');
        var targetSizeInput = document.getElementById('targetSizeInput');
        var applyTargetSizeBtn = document.getElementById('applyTargetSizeBtn');

        document.querySelectorAll('.compression-mode').forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.compression-mode').forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');
                var mode = this.dataset.mode;
                document.getElementById('qualitySettings').style.display = mode === 'quality' ? 'flex' : 'none';
                document.getElementById('sizeSettings').style.display = mode === 'size' ? 'flex' : 'none';
            });
        });

        document.querySelectorAll('.size-preset-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var size = parseInt(this.dataset.size);
                document.querySelectorAll('.size-preset-btn').forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');
                targetSizeInput.value = size;
                document.getElementById('targetSizeUnit').value = 'KB';
                updateSizeEstimate(size, 'KB');
                showToast('info', 'Target size set to ' + size + ' KB');
            });
        });

        if (applyTargetSizeBtn) {
            applyTargetSizeBtn.addEventListener('click', function() {
                var size = parseInt(targetSizeInput.value);
                var unit = document.getElementById('targetSizeUnit').value;
                if (isNaN(size) || size < 1) {
                    showToast('error', 'Please enter a valid size');
                    return;
                }
                document.querySelectorAll('.size-preset-btn').forEach(function(b) { b.classList.remove('active'); });
                updateSizeEstimate(size, unit);
                showToast('info', 'Target size set to ' + size + ' ' + unit);
            });
        }

        if (qualityRange && qualityLabel) {
            qualityRange.addEventListener('input', function() {
                qualityLabel.textContent = this.value + '%';
            });
        }

        if (resizeCheck && resizeOptions) {
            resizeCheck.addEventListener('change', function() {
                resizeOptions.style.display = this.checked ? 'block' : 'none';
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
                var file = e.dataTransfer.files[0];
                if (file) handleFile(file);
            });
        }

        if (compressBtn) compressBtn.addEventListener('click', compressFile);
        if (downloadBtn) downloadBtn.addEventListener('click', downloadCompressed);
        if (compressAgainBtn) {
            compressAgainBtn.addEventListener('click', function() {
                document.getElementById('compressResult').style.display = 'none';
                document.getElementById('compressPreview').style.display = 'none';
                compressedResult = null;
                document.getElementById('compressBtn').disabled = false;
                showToast('info', 'Ready to compress again');
            });
        }
    }

    function updateSizeEstimate(size, unit) {
        var text = document.getElementById('sizeEstimateText');
        if (!text) return;
        var sizeInKB = unit === 'MB' ? size * 1024 : size;
        text.textContent = 'Target: ' + size + ' ' + unit + ' (' + sizeInKB + ' KB)';
    }

    function handleFile(file) {
        var isPDF = Validators.isPDF(file);
        var isImage = Validators.isImage(file);
        if (!isPDF && !isImage) {
            showToast('error', 'Please upload a PDF or image file');
            return;
        }
        if (!Validators.checkFileSize(file, 100)) {
            showToast('error', 'File is too large. Maximum size is 100MB');
            return;
        }
        currentFile = file;
        currentFileType = isPDF ? 'pdf' : 'image';
        document.getElementById('compressBtn').disabled = false;
        var infoDiv = document.getElementById('compressFileInfo');
        var details = document.getElementById('compressFileDetails');
        if (infoDiv && details) {
            infoDiv.style.display = 'block';
            var typeIcon = isPDF ? '📄' : '🖼️';
            details.textContent = typeIcon + ' ' + file.name + ' (' + FileHelpers.formatFileSize(file.size) + ')';
        }
        document.getElementById('compressResult').style.display = 'none';
        compressedResult = null;
        showToast('success', 'Loaded ' + file.name);
    }

    async function compressFile() {
        if (!currentFile || isCompressing) return;
        isCompressing = true;
        var compressBtn = document.getElementById('compressBtn');
        compressBtn.disabled = true;
        compressBtn.textContent = 'Compressing...';

        try {
            var activeMode = document.querySelector('.compression-mode.active');
            var mode = activeMode ? activeMode.dataset.mode : 'quality';
            var level = document.getElementById('compressLevel').value;
            var quality = parseInt(document.getElementById('compressQuality').value);
            var autoOptimize = document.getElementById('autoOptimize').checked;
            var resize = document.getElementById('resizeImages').checked;
            var result;

            if (currentFileType === 'pdf') {
                var strategy = level === 'lossless' ? 'lossless' : level === 'balanced' ? 'balanced' : 'maximum';
                var compressionResult = await CompressEngine.compressPDF(currentFile, {
                    strategy: strategy,
                    imageQuality: quality,
                    removeMetadata: !autoOptimize,
                    optimizeImages: autoOptimize
                });
                var blob = new Blob([compressionResult.pdfBytes], { type: 'application/pdf' });
                result = {
                    file: new File([blob], FileHelpers.getFileNameWithoutExtension(currentFile.name) + '_compressed.pdf', { type: 'application/pdf' }),
                    blob: blob,
                    originalSize: compressionResult.originalSize,
                    compressedSize: compressionResult.compressedSize,
                    reduction: compressionResult.reduction,
                    isPDF: true
                };
            } else {
                var maxWidth = resize ? parseInt(document.getElementById('maxWidth').value) : null;
                var maxHeight = resize ? parseInt(document.getElementById('maxHeight').value) : null;
                var compressionResult = await CompressEngine.compressImage(currentFile, {
                    quality: quality,
                    format: 'auto',
                    maxWidth: maxWidth,
                    maxHeight: maxHeight
                });
                result = {
                    file: compressionResult.file,
                    blob: compressionResult.blob,
                    originalSize: compressionResult.originalSize,
                    compressedSize: compressionResult.compressedSize,
                    reduction: compressionResult.reduction,
                    isPDF: false,
                    canvas: compressionResult.canvas
                };
            }

            compressedResult = result;
            document.getElementById('compressResult').style.display = 'block';
            document.getElementById('originalSizeDisplay').textContent = FileHelpers.formatFileSize(result.originalSize);
            document.getElementById('compressedSizeDisplay').textContent = FileHelpers.formatFileSize(result.compressedSize);
            document.getElementById('compressionReduction').textContent = 'Saved ' + result.reduction.toFixed(1) + '%';
            var ratio = result.originalSize > 0 ? (result.compressedSize / result.originalSize) * 100 : 100;
            document.getElementById('sizeComparisonBar').style.width = Math.min(100, ratio) + '%';
            document.getElementById('sizeComparisonText').textContent = Math.round(100 - result.reduction) + '% of original';

            if (!result.isPDF && result.canvas) {
                var preview = document.getElementById('compressedPreview');
                if (preview) {
                    preview.innerHTML = '<img src="' + result.canvas.toDataURL('image/png') + '" style="max-width:100%;max-height:200px;border-radius:var(--md-shape-small);">';
                }
                document.getElementById('compressPreview').style.display = 'block';
            }
            showToast('success', 'Compressed! Saved ' + result.reduction.toFixed(1) + '%');
        } catch (error) {
            console.error('Compression error:', error);
            showToast('error', 'Compression failed: ' + error.message);
        } finally {
            isCompressing = false;
            compressBtn.disabled = false;
            compressBtn.textContent = 'Compress';
        }
    }

    function downloadCompressed() {
        if (!compressedResult) {
            showToast('warning', 'Please compress a file first');
            return;
        }
        DownloadHelpers.downloadBlob(compressedResult.blob, compressedResult.file.name);
        showToast('success', 'Downloaded compressed file');
    }

    return { render: render };
})();

window.CompressToolController = CompressToolController;