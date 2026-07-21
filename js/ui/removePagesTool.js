/**
 * Remove Pages - UI Controller with Live Preview
 */

const RemovePagesToolController = (function() {
    'use strict';

    var currentFile = null;
    var totalPages = 0;
    var pagesToRemove = new Set();
    var pdfDocument = null;
    var processedPdfBytes = null;

    function render() {
        var container = document.getElementById('toolContent');
        if (!container) return;

        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-header">
                    <h2>🗑️ Remove Pages</h2>
                    <p>Select pages to remove from your PDF</p>
                </div>

                <div class="upload-area" id="removeUploadArea">
                    <input type="file" id="removeFileInput" accept=".pdf,application/pdf">
                    <div class="upload-icon material-symbols-outlined">upload_file</div>
                    <div class="upload-text">Drop a PDF here or click to browse</div>
                    <div class="upload-hint">Select pages to delete</div>
                </div>

                <div id="removeFileInfo" class="file-info" style="display: none;">
                    <span id="removeFileDetails"></span>
                </div>

                <div id="selectionControls" class="selection-controls" style="display: none;">
                    <button class="btn btn-sm btn-secondary" id="selectAllBtn">Select All</button>
                    <button class="btn btn-sm btn-secondary" id="deselectAllBtn">Deselect All</button>
                    <button class="btn btn-sm btn-secondary" id="invertBtn">Invert Selection</button>
                    <span class="selection-count" id="selectionCount">0 pages selected for removal</span>
                </div>

                <div id="pageGrid" class="remove-page-grid"></div>

                <button class="btn btn-primary btn-lg" id="removePagesBtn" disabled style="margin-top: 20px;">
                    <span class="material-symbols-outlined">delete</span> Remove Selected Pages
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
                            <p id="removeInfoText"></p>
                        </div>
                    </div>
                    <div class="result-actions">
                        <button class="btn btn-success" id="downloadRemoveBtn">
                            <span class="material-symbols-outlined">download</span> Download PDF
                        </button>
                        <button class="btn btn-secondary" id="removeAgainBtn">
                            <span class="material-symbols-outlined">refresh</span> Start Over
                        </button>
                    </div>
                </div>
            </div>
        `;

        attachEvents();
    }

    function attachEvents() {
        var fileInput = document.getElementById('removeFileInput');
        var uploadArea = document.getElementById('removeUploadArea');
        var removeBtn = document.getElementById('removePagesBtn');
        var selectAllBtn = document.getElementById('selectAllBtn');
        var deselectAllBtn = document.getElementById('deselectAllBtn');
        var invertBtn = document.getElementById('invertBtn');
        var downloadBtn = document.getElementById('downloadRemoveBtn');
        var removeAgainBtn = document.getElementById('removeAgainBtn');

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

        if (selectAllBtn) selectAllBtn.addEventListener('click', selectAll);
        if (deselectAllBtn) deselectAllBtn.addEventListener('click', deselectAll);
        if (invertBtn) invertBtn.addEventListener('click', invertSelection);
        if (removeBtn) removeBtn.addEventListener('click', removePages);
        if (downloadBtn) downloadBtn.addEventListener('click', downloadPdf);
        if (removeAgainBtn) {
            removeAgainBtn.addEventListener('click', function() {
                document.getElementById('removeResult').style.display = 'none';
                document.getElementById('pageGrid').innerHTML = '';
                document.getElementById('selectionControls').style.display = 'none';
                pagesToRemove.clear();
                processedPdfBytes = null;
                pdfDocument = null;
                currentFile = null;
            });
        }
    }

    async function handleFile(file) {
        currentFile = file;
        pagesToRemove.clear();
        processedPdfBytes = null;

        try {
            var arrayBuffer = await FileHelpers.readAsArrayBuffer(file);
            pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            totalPages = pdfDocument.numPages;

            var infoDiv = document.getElementById('removeFileInfo');
            var details = document.getElementById('removeFileDetails');
            if (infoDiv && details) {
                infoDiv.style.display = 'block';
                details.textContent = '📄 ' + file.name + ' (' + totalPages + ' pages, ' + FileHelpers.formatFileSize(file.size) + ')';
            }

            document.getElementById('selectionControls').style.display = 'flex';
            document.getElementById('removePagesBtn').disabled = false;
            document.getElementById('removeResult').style.display = 'none';

            await renderPageGrid();
            updateSelectionCount();
            showToast('success', 'Loaded PDF. Click pages to select them for removal.');

        } catch (error) {
            console.error('Error reading PDF:', error);
            showToast('error', 'Failed to read PDF: ' + error.message);
        }
    }

    async function renderPageGrid() {
        var grid = document.getElementById('pageGrid');
        if (!grid) return;

        var html = '';
        for (var i = 1; i <= totalPages; i++) {
            html += `
                <div class="remove-page-card" data-page="${i}" onclick="RemovePagesToolController.togglePage(${i})">
                    <div class="page-thumbnail-wrapper">
                        <canvas id="canvas-page-${i}" class="page-canvas"></canvas>
                        <div class="selection-overlay" id="overlay-page-${i}">
                            <span class="material-symbols-outlined">delete</span>
                        </div>
                    </div>
                    <div class="page-number-badge">Page ${i}</div>
                </div>
            `;
        }
        grid.innerHTML = html;

        // Render thumbnails
        for (var i = 1; i <= totalPages; i++) {
            await renderThumbnail(i);
        }
    }

    async function renderThumbnail(pageNum) {
        if (!pdfDocument) return;
        try {
            var page = await pdfDocument.getPage(pageNum);
            var canvas = document.getElementById('canvas-page-' + pageNum);
            if (!canvas) return;
            
            var ctx = canvas.getContext('2d');
            var viewport = page.getViewport({ scale: 0.4 });
            
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            await page.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise;
            
            page.cleanup();
        } catch (e) {
            console.error('Error rendering thumbnail for page ' + pageNum, e);
        }
    }

    function togglePage(pageNum) {
        if (pagesToRemove.has(pageNum)) {
            pagesToRemove.delete(pageNum);
        } else {
            pagesToRemove.add(pageNum);
        }
        updateCardUI(pageNum);
        updateSelectionCount();
    }

    function updateCardUI(pageNum) {
        var card = document.querySelector(`.remove-page-card[data-page="${pageNum}"]`);
        var overlay = document.getElementById('overlay-page-' + pageNum);
        if (!card || !overlay) return;

        if (pagesToRemove.has(pageNum)) {
            card.classList.add('selected');
            overlay.style.display = 'flex';
        } else {
            card.classList.remove('selected');
            overlay.style.display = 'none';
        }
    }

    function selectAll() {
        for (var i = 1; i <= totalPages; i++) {
            pagesToRemove.add(i);
            updateCardUI(i);
        }
        updateSelectionCount();
    }

    function deselectAll() {
        pagesToRemove.clear();
        for (var i = 1; i <= totalPages; i++) {
            updateCardUI(i);
        }
        updateSelectionCount();
    }

    function invertSelection() {
        for (var i = 1; i <= totalPages; i++) {
            if (pagesToRemove.has(i)) {
                pagesToRemove.delete(i);
            } else {
                pagesToRemove.add(i);
            }
            updateCardUI(i);
        }
        updateSelectionCount();
    }

    function updateSelectionCount() {
        var count = pagesToRemove.size;
        var countText = document.getElementById('selectionCount');
        if (countText) {
            countText.textContent = count + ' page' + (count !== 1 ? 's' : '') + ' selected for removal';
        }
        
        var removeBtn = document.getElementById('removePagesBtn');
        if (removeBtn) {
            removeBtn.disabled = (count === 0 || count === totalPages);
            if (count === totalPages) {
                removeBtn.title = 'Cannot remove all pages';
            }
        }
    }

    async function removePages() {
        if (!currentFile || pagesToRemove.size === 0) {
            showToast('warning', 'Please select at least one page to remove');
            return;
        }

        if (pagesToRemove.size === totalPages) {
            showToast('error', 'You cannot remove all pages from the PDF');
            return;
        }

        var removeBtn = document.getElementById('removePagesBtn');
        removeBtn.disabled = true;
        removeBtn.textContent = 'Processing...';

        try {
            var { PDFDocument } = window.PDFLib;
            var arrayBuffer = await FileHelpers.readAsArrayBuffer(currentFile);
            var pdf = await PDFDocument.load(arrayBuffer);
            var newPdf = await PDFDocument.create();

            var pagesToKeep = [];
            for (var i = 0; i < totalPages; i++) {
                if (!pagesToRemove.has(i + 1)) {
                    pagesToKeep.push(i);
                }
            }

            var copiedPages = await newPdf.copyPages(pdf, pagesToKeep);
            copiedPages.forEach(function(page) {
                newPdf.addPage(page);
            });

            processedPdfBytes = await newPdf.save();
            
            document.getElementById('removeResult').style.display = 'block';
            document.getElementById('removeInfoText').textContent = 
                'Removed ' + pagesToRemove.size + ' page(s). ' + pagesToKeep.length + ' page(s) remaining.';

            showToast('success', 'Pages removed successfully!');

        } catch (error) {
            console.error('Error removing pages:', error);
            showToast('error', 'Failed to process PDF: ' + error.message);
        } finally {
            removeBtn.disabled = false;
            removeBtn.textContent = 'Remove Selected Pages';
        }
    }

    function downloadPdf() {
        if (!processedPdfBytes) {
            showToast('warning', 'Please process the PDF first');
            return;
        }
        var blob = new Blob([processedPdfBytes], { type: 'application/pdf' });
        var filename = FileHelpers.getFileNameWithoutExtension(currentFile.name) + '_removed.pdf';
        DownloadHelpers.downloadBlob(blob, filename);
        showToast('success', 'PDF downloaded');
    }

    // Expose togglePage to global scope for inline onclick handlers
    return {
        render: render,
        togglePage: togglePage
    };

})();

window.RemovePagesToolController = RemovePagesToolController;