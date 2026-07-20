/**
 * Remove Pages - UI Controller
 */

const RemovePagesToolController = (function() {
    'use strict';

    let currentFile = null;
    let totalPages = 0;

    function render() {
        var container = document.getElementById('toolContent');
        if (!container) return;

        // ✅ REMOVED: <section class="page active"> wrapper
        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-header">
                    <h2>🗑️ Remove Pages from PDF</h2>
                    <p>Delete specific pages from your PDF document</p>
                </div>

                <div class="upload-area" id="removeUploadArea">
                    <input type="file" id="removeFileInput" accept=".pdf,application/pdf">
                    <div class="upload-icon material-symbols-outlined">upload_file</div>
                    <div class="upload-text">Drop a PDF here or click to browse</div>
                    <div class="upload-hint">Remove unwanted pages</div>
                </div>

                <div id="removeFileInfo" class="file-info" style="display: none;">
                    <span id="removeFileDetails"></span>
                </div>

                <div class="settings-group">
                    <label>
                        <span class="material-symbols-outlined">numbers</span>
                        Pages to Remove:
                        <input type="text" id="removePages" placeholder="e.g., 1,3,5-8">
                    </label>
                    <div class="hint-text">Enter page numbers or ranges separated by commas</div>
                </div>

                <div class="settings-group">
                    <label>
                        <input type="checkbox" id="reverseSelection">
                        <span class="material-symbols-outlined">flip</span> Reverse Selection (keep selected, remove rest)
                    </label>
                </div>

                <button class="btn btn-danger" id="removePagesBtn" disabled>
                    <span class="material-symbols-outlined">delete</span> Remove Pages
                </button>

                <div class="progress-container">
                    <div class="progress-bar"></div>
                    <div class="progress-text"></div>
                </div>

                <div id="removeResult" class="result-section" style="display: none;">
                    <div class="result-card success">
                        <span class="material-symbols-outlined">check_circle</span>
                        <div>
                            <strong>Pages Removed Successfully!</strong>
                            <p id="removedInfo"></p>
                        </div>
                    </div>
                    <div class="result-actions">
                        <button class="btn btn-success" id="downloadRemovedBtn">
                            <span class="material-symbols-outlined">download</span> Download PDF
                        </button>
                    </div>
                </div>

                <div id="pageList" class="page-list"></div>
            </div>
        `;

        attachEvents();
    }

    function attachEvents() {
        var fileInput = document.getElementById('removeFileInput');
        var uploadArea = document.getElementById('removeUploadArea');
        var removeBtn = document.getElementById('removePagesBtn');
        var downloadBtn = document.getElementById('downloadRemovedBtn');

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

        if (removeBtn) removeBtn.addEventListener('click', removePages);
        if (downloadBtn) downloadBtn.addEventListener('click', downloadRemoved);
    }

    async function handleFile(file) {
        currentFile = file;
        
        try {
            totalPages = await PDFProcessor.getPDFPageCount(file);
            
            var infoDiv = document.getElementById('removeFileInfo');
            var details = document.getElementById('removeFileDetails');
            if (infoDiv && details) {
                infoDiv.style.display = 'block';
                details.textContent = '📄 ' + file.name + ' (' + totalPages + ' pages, ' + FileHelpers.formatFileSize(file.size) + ')';
            }

            document.getElementById('removePagesBtn').disabled = false;
            document.getElementById('removeResult').style.display = 'none';
            
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

        var html = '<h4>Select pages to remove:</h4><div class="page-checkbox-grid">';
        
        for (var i = 1; i <= totalPages; i++) {
            html += `
                <div class="page-checkbox-item">
                    <input type="checkbox" class="page-checkbox" data-page="${i}" id="page_${i}">
                    <label for="page_${i}">Page ${i}</label>
                </div>
            `;
        }
        
        html += '</div>';
        list.innerHTML = html;

        var container = document.createElement('div');
        container.style.marginTop = '8px';
        container.innerHTML = `
            <button class="btn btn-secondary btn-sm" id="selectAllPages">Select All</button>
            <button class="btn btn-secondary btn-sm" id="deselectAllPages">Deselect All</button>
        `;
        list.appendChild(container);

        document.getElementById('selectAllPages').addEventListener('click', function() {
            document.querySelectorAll('.page-checkbox').forEach(function(cb) { cb.checked = true; });
        });

        document.getElementById('deselectAllPages').addEventListener('click', function() {
            document.querySelectorAll('.page-checkbox').forEach(function(cb) { cb.checked = false; });
        });
    }

    async function removePages() {
        if (!currentFile) {
            showToast('warning', 'Please upload a PDF first');
            return;
        }

        var removeBtn = document.getElementById('removePagesBtn');
        removeBtn.disabled = true;
        removeBtn.textContent = 'Processing...';

        try {
            var checkboxes = document.querySelectorAll('.page-checkbox:checked');
            var pagesToRemove = Array.from(checkboxes).map(function(cb) { return parseInt(cb.dataset.page); });
            
            var pagesInput = document.getElementById('removePages').value;
            if (pagesInput.trim()) {
                var result = Validators.validatePageRange(pagesInput, totalPages);
                if (result.valid) {
                    pagesToRemove = result.pages;
                } else {
                    throw new Error(result.error);
                }
            }

            if (pagesToRemove.length === 0) {
                showToast('warning', 'Please select pages to remove');
                removeBtn.disabled = false;
                removeBtn.textContent = 'Remove Pages';
                return;
            }

            var reverse = document.getElementById('reverseSelection').checked;
            if (reverse) {
                var allPages = [];
                for (var i = 1; i <= totalPages; i++) {
                    allPages.push(i);
                }
                pagesToRemove = allPages.filter(function(p) { return !pagesToRemove.includes(p); });
            }

            var { PDFDocument } = window.PDFLib;
            var arrayBuffer = await FileHelpers.readAsArrayBuffer(currentFile);
            var pdf = await PDFDocument.load(arrayBuffer);
            
            var keepPages = [];
            for (var i = 0; i < totalPages; i++) {
                if (!pagesToRemove.includes(i + 1)) {
                    keepPages.push(i);
                }
            }

            if (keepPages.length === 0) {
                throw new Error('Cannot remove all pages');
            }

            var newPdf = await PDFDocument.create();
            var pages = await newPdf.copyPages(pdf, keepPages);
            for (var p = 0; p < pages.length; p++) {
                newPdf.addPage(pages[p]);
            }

            var pdfBytes = await newPdf.save();
            var blob = new Blob([pdfBytes], { type: 'application/pdf' });
            var filename = FileHelpers.getFileNameWithoutExtension(currentFile.name) + '_modified.pdf';
            
            window._removedPdf = {
                blob: blob,
                filename: filename,
                removed: pagesToRemove.length,
                remaining: keepPages.length
            };

            document.getElementById('removeResult').style.display = 'block';
            document.getElementById('removedInfo').textContent = 
                'Removed ' + pagesToRemove.length + ' pages, ' + keepPages.length + ' pages remaining';

            showToast('success', 'Removed ' + pagesToRemove.length + ' pages');

        } catch (error) {
            console.error('Remove pages error:', error);
            showToast('error', 'Failed to remove pages: ' + error.message);
        } finally {
            removeBtn.disabled = false;
            removeBtn.textContent = 'Remove Pages';
        }
    }

    function downloadRemoved() {
        if (!window._removedPdf) {
            showToast('warning', 'Please remove pages first');
            return;
        }

        DownloadHelpers.downloadBlob(window._removedPdf.blob, window._removedPdf.filename);
        showToast('success', 'PDF downloaded');
    }

    return { render: render };
})();

window.RemovePagesToolController = RemovePagesToolController;