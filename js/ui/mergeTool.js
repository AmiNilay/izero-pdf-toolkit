/**
 * Merge PDF - UI Controller
 */

const MergeToolController = (function() {
    'use strict';

    let uploadedPDFs = [];

    function render() {
        var container = document.getElementById('toolContent');
        if (!container) return;

        // ✅ REMOVED: <section class="page active"> wrapper
        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-header">
                    <h2>📑 Merge PDF</h2>
                    <p>Combine multiple PDF files into a single document</p>
                </div>

                <div class="upload-area" id="mergeUploadArea">
                    <input type="file" id="mergeFileInput" accept=".pdf,application/pdf" multiple>
                    <div class="upload-icon material-symbols-outlined">upload_file</div>
                    <div class="upload-text">Drop your PDFs here or click to browse</div>
                    <div class="upload-hint">Select multiple PDF files to merge</div>
                </div>

                <div id="pdfList" class="file-list"></div>

                <div class="settings-group">
                    <label>
                        <span class="material-symbols-outlined">description</span>
                        Page Size:
                        <select id="mergePageSize">
                            <option value="">Auto (Use first PDF)</option>
                            <option value="a4">A4</option>
                            <option value="letter">Letter</option>
                            <option value="legal">Legal</option>
                            <option value="a3">A3</option>
                        </select>
                    </label>
                    <label>
                        <input type="checkbox" id="addPageNumbers">
                        <span class="material-symbols-outlined">numbers</span>
                        Add Page Numbers
                    </label>
                    <label>
                        <span class="material-symbols-outlined">format_align_center</span>
                        Page Number Position:
                        <select id="pageNumberPosition">
                            <option value="bottom-center">Bottom Center</option>
                            <option value="bottom-left">Bottom Left</option>
                            <option value="bottom-right">Bottom Right</option>
                            <option value="top-center">Top Center</option>
                            <option value="top-left">Top Left</option>
                            <option value="top-right">Top Right</option>
                        </select>
                    </label>
                </div>

                <button class="btn btn-primary" id="mergePdfBtn" disabled>
                    <span class="material-symbols-outlined">merge</span> Merge PDFs
                </button>

                <div class="progress-container">
                    <div class="progress-bar"></div>
                    <div class="progress-text"></div>
                </div>

                <div id="mergeResult" class="result-section" style="display: none;">
                    <div class="result-card success">
                        <span class="material-symbols-outlined">check_circle</span>
                        <div>
                            <strong>Merge Complete!</strong>
                            <p id="mergeInfo"></p>
                        </div>
                    </div>
                    <div class="result-actions">
                        <button class="btn btn-success" id="downloadMergedBtn">
                            <span class="material-symbols-outlined">download</span> Download Merged PDF
                        </button>
                    </div>
                </div>
            </div>
        `;

        attachEvents();
    }

    function attachEvents() {
        var fileInput = document.getElementById('mergeFileInput');
        var uploadArea = document.getElementById('mergeUploadArea');
        var mergeBtn = document.getElementById('mergePdfBtn');
        var downloadBtn = document.getElementById('downloadMergedBtn');

        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                var files = Array.from(this.files);
                if (files.length > 0) {
                    addPDFs(files);
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
                addPDFs(files);
            });
        }

        if (mergeBtn) mergeBtn.addEventListener('click', mergePDFs);
        if (downloadBtn) downloadBtn.addEventListener('click', downloadMerged);
    }

    function addPDFs(files) {
        var validPDFs = files.filter(function(f) { return Validators.isPDF(f); });
        if (validPDFs.length === 0) {
            showToast('error', 'No valid PDF files found');
            return;
        }
        uploadedPDFs = uploadedPDFs.concat(validPDFs);
        updatePDFList();
        document.getElementById('mergePdfBtn').disabled = false;
        showToast('success', 'Added ' + validPDFs.length + ' PDFs');
    }

    function updatePDFList() {
        var list = document.getElementById('pdfList');
        if (!list) return;
        if (uploadedPDFs.length === 0) {
            list.innerHTML = '';
            list.style.display = 'none';
            return;
        }
        list.style.display = 'block';
        var html = '<div class="file-list">';
        for (var i = 0; i < uploadedPDFs.length; i++) {
            var pdf = uploadedPDFs[i];
            html += `
                <div class="file-item">
                    <span class="material-symbols-outlined">description</span>
                    <span class="file-name">${pdf.name}</span>
                    <span class="file-size">${FileHelpers.formatFileSize(pdf.size)}</span>
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
                uploadedPDFs.splice(index, 1);
                updatePDFList();
                if (uploadedPDFs.length === 0) {
                    document.getElementById('mergePdfBtn').disabled = true;
                }
            });
        });
    }

    async function mergePDFs() {
        if (uploadedPDFs.length < 2) {
            showToast('warning', 'Please add at least 2 PDF files');
            return;
        }
        var mergeBtn = document.getElementById('mergePdfBtn');
        mergeBtn.disabled = true;
        mergeBtn.textContent = 'Merging...';
        try {
            var pageSize = document.getElementById('mergePageSize').value;
            var addPageNumbers = document.getElementById('addPageNumbers').checked;
            var pageNumberPosition = document.getElementById('pageNumberPosition').value;
            var pdfBytes = await MergeEngine.mergePDFs(uploadedPDFs, {
                pageSize: pageSize || null,
                addPageNumbers: addPageNumbers,
                pageNumberPosition: pageNumberPosition
            });
            window._mergedPdfBytes = pdfBytes;
            document.getElementById('mergeResult').style.display = 'block';
            document.getElementById('mergeInfo').textContent = 'Size: ' + FileHelpers.formatFileSize(pdfBytes.byteLength);
            showToast('success', 'Successfully merged ' + uploadedPDFs.length + ' PDFs');
        } catch (error) {
            console.error('Merge error:', error);
            showToast('error', 'Merge failed: ' + error.message);
        } finally {
            mergeBtn.disabled = false;
            mergeBtn.textContent = 'Merge PDFs';
        }
    }

    function downloadMerged() {
        if (!window._mergedPdfBytes) {
            showToast('warning', 'Please merge PDFs first');
            return;
        }
        var blob = new Blob([window._mergedPdfBytes], { type: 'application/pdf' });
        DownloadHelpers.downloadBlob(blob, 'merged.pdf');
        showToast('success', 'Merged PDF downloaded');
    }

    return { render: render };
})();

window.MergeToolController = MergeToolController;