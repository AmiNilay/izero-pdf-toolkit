/**
 * Rotate PDF - UI Controller
 */

const RotateToolController = (function() {
    'use strict';

    let currentFile = null;
    let totalPages = 0;
    let pageRotations = {};
    let rotatedPdfBytes = null;

    function render() {
        var container = document.getElementById('toolContent');
        if (!container) return;

        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-header">
                    <h2>🔄 Rotate PDF</h2>
                    <p>Rotate individual pages or the entire PDF</p>
                </div>

                <div class="upload-area" id="rotateUploadArea">
                    <input type="file" id="rotateFileInput" accept=".pdf,application/pdf">
                    <div class="upload-icon material-symbols-outlined">upload_file</div>
                    <div class="upload-text">Drop a PDF here or click to browse</div>
                    <div class="upload-hint">Rotate PDF pages</div>
                </div>

                <div id="rotateInfo" class="file-info" style="display: none;">
                    <span id="rotateFileInfo"></span>
                </div>

                <div class="settings-group">
                    <div class="settings-row">
                        <label class="setting-label">
                            <span class="material-symbols-outlined">rotate_right</span>
                            Rotation Angle
                        </label>
                        <select id="rotationAngle" class="setting-select">
                            <option value="90">90° Clockwise</option>
                            <option value="180">180°</option>
                            <option value="270">270° Clockwise (90° Counter)</option>
                        </select>
                    </div>
                    <div class="settings-row">
                        <label class="setting-label">
                            <span class="material-symbols-outlined">select_all</span>
                            Apply to
                        </label>
                        <select id="rotationScope" class="setting-select">
                            <option value="all">All Pages</option>
                            <option value="specific">Specific Pages</option>
                        </select>
                    </div>
                </div>

                <div id="specificPagesDiv" class="settings-group" style="display: none;">
                    <div class="settings-row">
                        <label class="setting-label">
                            <span class="material-symbols-outlined">numbers</span>
                            Page Numbers
                        </label>
                        <input type="text" id="rotatePages" class="text-input" placeholder="1,3,5-8">
                        <div class="hint-text">Enter page numbers separated by commas or ranges (e.g., "1,3,5-8")</div>
                    </div>
                </div>

                <button class="btn btn-primary btn-lg" id="rotatePdfBtn" disabled>
                    <span class="material-symbols-outlined">rotate_right</span> Rotate PDF
                </button>

                <div class="progress-container">
                    <div class="progress-bar"></div>
                    <div class="progress-text"></div>
                </div>

                <div id="rotateResult" class="result-section" style="display: none;">
                    <div class="result-card success">
                        <span class="material-symbols-outlined">check_circle</span>
                        <div>
                            <strong>Rotation Complete!</strong>
                            <p id="rotateInfoText"></p>
                        </div>
                    </div>
                    <div class="result-actions">
                        <button class="btn btn-success" id="downloadRotateBtn">
                            <span class="material-symbols-outlined">download</span> Download Rotated PDF
                        </button>
                        <button class="btn btn-secondary" id="rotateAgainBtn">
                            <span class="material-symbols-outlined">refresh</span> Rotate Another PDF
                        </button>
                    </div>
                </div>

                <div id="pageList" class="page-list"></div>
            </div>
        `;

        attachEvents();
    }

    function attachEvents() {
        var fileInput = document.getElementById('rotateFileInput');
        var uploadArea = document.getElementById('rotateUploadArea');
        var rotateBtn = document.getElementById('rotatePdfBtn');
        var scopeSelect = document.getElementById('rotationScope');
        var downloadBtn = document.getElementById('downloadRotateBtn');
        var rotateAgainBtn = document.getElementById('rotateAgainBtn');

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

        if (scopeSelect) {
            scopeSelect.addEventListener('change', function() {
                document.getElementById('specificPagesDiv').style.display = 
                    this.value === 'specific' ? 'block' : 'none';
            });
        }

        if (rotateBtn) rotateBtn.addEventListener('click', rotatePDF);
        if (downloadBtn) downloadBtn.addEventListener('click', downloadRotated);
        if (rotateAgainBtn) {
            rotateAgainBtn.addEventListener('click', function() {
                document.getElementById('rotateResult').style.display = 'none';
                document.getElementById('pageList').innerHTML = '';
                rotatedPdfBytes = null;
                pageRotations = {};
            });
        }
    }

    async function handleFile(file) {
        currentFile = file;
        
        try {
            totalPages = await PDFProcessor.getPDFPageCount(file);
            
            var infoDiv = document.getElementById('rotateInfo');
            var infoSpan = document.getElementById('rotateFileInfo');
            if (infoDiv && infoSpan) {
                infoDiv.style.display = 'block';
                infoSpan.textContent = '📄 ' + file.name + ' (' + totalPages + ' pages, ' + FileHelpers.formatFileSize(file.size) + ')';
            }

            document.getElementById('rotatePdfBtn').disabled = false;
            document.getElementById('rotateResult').style.display = 'none';
            
            pageRotations = {};
            for (var i = 1; i <= totalPages; i++) {
                pageRotations[i] = 0;
            }
            
            renderPageList();
            
            showToast('success', 'Loaded PDF with ' + totalPages + ' pages');

        } catch (error) {
            console.error('Error reading PDF:', error);
            showToast('error', 'Failed to read PDF: ' + error.message);
        }
    }

    function renderPageList() {
        var list = document.getElementById('pageList');
        if (!list) return;

        var html = '<div class="page-section-header"><h4>Pages</h4><span class="hint-text">Click buttons to rotate individual pages</span></div><div class="page-grid">';
        
        for (var i = 1; i <= Math.min(totalPages, 20); i++) {
            var rotation = pageRotations[i] || 0;
            var rotationLabel = rotation === 0 ? '0°' : rotation + '°';
            html += `
                <div class="page-item">
                    <div class="page-info">
                        <div class="page-number">Page ${i}</div>
                        <div class="page-rotation">${rotationLabel}</div>
                    </div>
                    <div class="page-actions">
                        <button class="btn-icon" data-page="${i}" data-angle="90" title="Rotate 90° CW">↻</button>
                        <button class="btn-icon" data-page="${i}" data-angle="-90" title="Rotate 90° CCW">↺</button>
                        <button class="btn-icon btn-reset" data-page="${i}" title="Reset">✕</button>
                    </div>
                </div>
            `;
        }
        
        if (totalPages > 20) {
            html += `<div class="page-more">... and ${totalPages - 20} more pages</div>`;
        }
        
        html += '</div>';
        list.innerHTML = html;

        list.querySelectorAll('.rotate-page-btn, .btn-icon').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var page = parseInt(this.dataset.page);
                var angle = parseInt(this.dataset.angle);
                var current = pageRotations[page] || 0;
                pageRotations[page] = (current + angle) % 360;
                if (pageRotations[page] < 0) pageRotations[page] += 360;
                renderPageList();
            });
        });

        list.querySelectorAll('.reset-page-btn, .btn-reset').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var page = parseInt(this.dataset.page);
                pageRotations[page] = 0;
                renderPageList();
            });
        });
    }

    async function rotatePDF() {
        if (!currentFile) {
            showToast('warning', 'Please upload a PDF first');
            return;
        }

        var rotateBtn = document.getElementById('rotatePdfBtn');
        rotateBtn.disabled = true;
        rotateBtn.textContent = 'Rotating...';

        try {
            var angle = parseInt(document.getElementById('rotationAngle').value);
            var scope = document.getElementById('rotationScope').value;
            
            var pagesToRotate = [];
            
            if (scope === 'all') {
                for (var i = 1; i <= totalPages; i++) {
                    pagesToRotate.push(i);
                }
            } else {
                var pagesStr = document.getElementById('rotatePages').value;
                if (!pagesStr) {
                    throw new Error('Please specify pages to rotate');
                }
                var result = Validators.validatePageRange(pagesStr, totalPages);
                if (!result.valid) {
                    throw new Error(result.error);
                }
                pagesToRotate = result.pages;
            }

            // Update page rotations
            for (var p = 0; p < pagesToRotate.length; p++) {
                var pageNum = pagesToRotate[p];
                var current = pageRotations[pageNum] || 0;
                pageRotations[pageNum] = (current + angle) % 360;
            }

            // Load PDF
            var { PDFDocument, degrees } = window.PDFLib;
            var arrayBuffer = await FileHelpers.readAsArrayBuffer(currentFile);
            var pdf = await PDFDocument.load(arrayBuffer);
            var newPdf = await PDFDocument.create();
            
            var total = pdf.getPageCount();
            
            for (var i = 0; i < total; i++) {
                var [page] = await newPdf.copyPages(pdf, [i]);
                var rotation = pageRotations[i + 1] || 0;
                
                if (rotation > 0) {
                    // Use PDFLib's degrees function to create proper rotation
                    page.setRotation(degrees(rotation));
                }
                
                newPdf.addPage(page);
                
                var progress = (i + 1) / total * 100;
                window.showProgress(true, progress, 'Processing page ' + (i + 1) + '/' + total);
            }

            window.showProgress(false);
            
            var pdfBytes = await newPdf.save();
            rotatedPdfBytes = pdfBytes;

            document.getElementById('rotateResult').style.display = 'block';
            document.getElementById('rotateInfoText').textContent = 'Size: ' + FileHelpers.formatFileSize(pdfBytes.byteLength);

            showToast('success', 'PDF rotated successfully');

        } catch (error) {
            console.error('Rotation error:', error);
            showToast('error', 'Rotation failed: ' + error.message);
        } finally {
            rotateBtn.disabled = false;
            rotateBtn.textContent = 'Rotate PDF';
        }
    }

    function downloadRotated() {
        if (!rotatedPdfBytes) {
            showToast('warning', 'Please rotate the PDF first');
            return;
        }

        var blob = new Blob([rotatedPdfBytes], { type: 'application/pdf' });
        DownloadHelpers.downloadBlob(blob, 'rotated.pdf');
        showToast('success', 'Rotated PDF downloaded');
    }

    return { render: render };
})();

window.RotateToolController = RotateToolController;