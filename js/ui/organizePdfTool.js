/**
 * Organize PDF - UI Controller with Live Preview
 */

const OrganizePdfToolController = (function() {
    'use strict';

    var currentFile = null;
    var totalPages = 0;
    var pageOrder = [];
    var dragIndex = null;
    var pdfDocument = null;
    var pageThumbnails = [];

    function render() {
        var container = document.getElementById('toolContent');
        if (!container) return;

        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-header">
                    <h2>📋 Organize PDF</h2>
                    <p>Reorder, delete, or duplicate pages in your PDF</p>
                </div>

                <div class="upload-area" id="organizeUploadArea">
                    <input type="file" id="organizeFileInput" accept=".pdf,application/pdf">
                    <div class="upload-icon material-symbols-outlined">upload_file</div>
                    <div class="upload-text">Drop a PDF here or click to browse</div>
                    <div class="upload-hint">Organize your PDF pages</div>
                </div>

                <div id="organizeFileInfo" class="file-info" style="display: none;">
                    <span id="organizeFileDetails"></span>
                </div>

                <div class="settings-group">
                    <label>
                        <span class="material-symbols-outlined">reorder</span>
                        Page Order:
                        <span class="hint-text">Drag pages to reorder, click × to delete</span>
                    </label>
                </div>

                <div id="pageOrganizer" class="page-organizer"></div>

                <div class="settings-group">
                    <button class="btn btn-secondary" id="organizeDuplicateBtn">
                        <span class="material-symbols-outlined">content_copy</span> Duplicate Last
                    </button>
                    <button class="btn btn-secondary" id="organizeReverseBtn">
                        <span class="material-symbols-outlined">swap_vert</span> Reverse All
                    </button>
                    <button class="btn btn-secondary" id="organizeResetBtn">
                        <span class="material-symbols-outlined">refresh</span> Reset Order
                    </button>
                </div>

                <button class="btn btn-primary btn-lg" id="organizeApplyBtn" disabled>
                    <span class="material-symbols-outlined">save</span> Apply Changes
                </button>

                <div class="progress-container">
                    <div class="progress-bar"></div>
                    <div class="progress-text"></div>
                </div>

                <div id="organizeResult" class="result-section" style="display: none;">
                    <div class="result-card success">
                        <span class="material-symbols-outlined">check_circle</span>
                        <div>
                            <strong>PDF Organized Successfully!</strong>
                            <p id="organizeInfo"></p>
                        </div>
                    </div>
                    <div class="result-actions">
                        <button class="btn btn-success" id="organizeDownloadBtn">
                            <span class="material-symbols-outlined">download</span> Download Organized PDF
                        </button>
                        <button class="btn btn-secondary" id="organizeAgainBtn">
                            <span class="material-symbols-outlined">refresh</span> Organize Another PDF
                        </button>
                    </div>
                </div>
            </div>
        `;

        attachEvents();
    }

    function attachEvents() {
        var fileInput = document.getElementById('organizeFileInput');
        var uploadArea = document.getElementById('organizeUploadArea');
        var applyBtn = document.getElementById('organizeApplyBtn');
        var duplicateBtn = document.getElementById('organizeDuplicateBtn');
        var reverseBtn = document.getElementById('organizeReverseBtn');
        var resetBtn = document.getElementById('organizeResetBtn');
        var organizeAgainBtn = document.getElementById('organizeAgainBtn');

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

        if (applyBtn) applyBtn.addEventListener('click', applyChanges);
        if (duplicateBtn) duplicateBtn.addEventListener('click', duplicateSelected);
        if (reverseBtn) reverseBtn.addEventListener('click', reversePages);
        if (resetBtn) resetBtn.addEventListener('click', resetOrder);
        if (organizeAgainBtn) {
            organizeAgainBtn.addEventListener('click', function() {
                document.getElementById('organizeResult').style.display = 'none';
                document.getElementById('pageOrganizer').innerHTML = '';
                pageOrder = [];
                pageThumbnails = [];
                pdfDocument = null;
                currentFile = null;
            });
        }

        var downloadBtn = document.getElementById('organizeDownloadBtn');
        if (downloadBtn) downloadBtn.addEventListener('click', downloadOrganized);
    }

    async function handleFile(file) {
        currentFile = file;
        try {
            // Load PDF document
            var arrayBuffer = await FileHelpers.readAsArrayBuffer(file);
            pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            totalPages = pdfDocument.numPages;
            
            pageOrder = [];
            pageThumbnails = [];
            for (var i = 0; i < totalPages; i++) {
                pageOrder.push(i);
            }

            var infoDiv = document.getElementById('organizeFileInfo');
            var details = document.getElementById('organizeFileDetails');
            if (infoDiv && details) {
                infoDiv.style.display = 'block';
                details.textContent = ' ' + file.name + ' (' + totalPages + ' pages, ' + FileHelpers.formatFileSize(file.size) + ')';
            }

            document.getElementById('organizeApplyBtn').disabled = false;
            document.getElementById('organizeResult').style.display = 'none';

            await renderOrganizer();
            showToast('success', 'Loaded PDF with ' + totalPages + ' pages');
        } catch (error) {
            console.error('Error reading PDF:', error);
            showToast('error', 'Failed to read PDF: ' + error.message);
        }
    }

    async function renderOrganizer() {
        var container = document.getElementById('pageOrganizer');
        if (!container) return;

        var html = '<div class="organizer-grid">';
        for (var i = 0; i < pageOrder.length; i++) {
            var pageNum = pageOrder[i] + 1;
            html += `
                <div class="organizer-item" data-index="${i}" data-page="${pageOrder[i]}">
                    <div class="organizer-preview">
                        <canvas id="organizer-canvas-${i}" class="page-canvas"></canvas>
                        <div class="organizer-overlay">
                            <span class="organizer-number">${pageNum}</span>
                        </div>
                    </div>
                    <div class="organizer-actions">
                        <span class="organizer-handle material-symbols-outlined">drag_handle</span>
                        <button class="organizer-delete" data-index="${i}" title="Delete page">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>
            `;
        }
        html += '</div>';
        container.innerHTML = html;

        // Render page thumbnails
        for (var i = 0; i < pageOrder.length; i++) {
            await renderPageThumbnail(i, pageOrder[i]);
        }

        // Attach delete events
        container.querySelectorAll('.organizer-delete').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var index = parseInt(this.dataset.index);
                deletePage(index);
            });
        });

        // Attach drag events
        container.querySelectorAll('.organizer-item').forEach(function(item) {
            item.draggable = true;
            item.addEventListener('dragstart', dragStart);
            item.addEventListener('dragenter', dragEnter);
            item.addEventListener('dragover', dragOver);
            item.addEventListener('drop', drop);
            item.addEventListener('dragend', dragEnd);
        });
    }

    async function renderPageThumbnail(index, pageNum) {
        if (!pdfDocument) return;
        
        try {
            var canvas = document.getElementById('organizer-canvas-' + index);
            if (!canvas) return;
            
            var page = await pdfDocument.getPage(pageNum + 1);
            var ctx = canvas.getContext('2d');
            
            // Render at smaller scale for thumbnail
            var viewport = page.getViewport({ scale: 0.3 });
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            var renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            page.cleanup();
            
        } catch (error) {
            console.error('Error rendering thumbnail:', error);
        }
    }

    function deletePage(index) {
        if (pageOrder.length <= 1) {
            showToast('warning', 'Cannot delete the last page');
            return;
        }
        pageOrder.splice(index, 1);
        renderOrganizer();
        showToast('info', 'Page deleted. Click "Apply Changes" to save.');
    }

    function dragStart(e) {
        dragIndex = parseInt(this.dataset.index);
        this.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
    }

    function dragEnter(e) {
        e.preventDefault();
        this.style.borderColor = 'var(--md-sys-color-primary, #2563eb)';
    }

    function dragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    function drop(e) {
        e.preventDefault();
        var targetIndex = parseInt(this.dataset.index);
        if (dragIndex !== targetIndex) {
            var item = pageOrder.splice(dragIndex, 1)[0];
            pageOrder.splice(targetIndex, 0, item);
            renderOrganizer();
            showToast('info', 'Pages reordered. Click "Apply Changes" to save.');
        }
        this.style.borderColor = '';
        dragIndex = null;
    }

    function dragEnd(e) {
        this.style.opacity = '1';
        document.querySelectorAll('.organizer-item').forEach(function(el) {
            el.style.borderColor = '';
        });
    }

    function duplicateSelected() {
        if (pageOrder.length === 0) return;
        var last = pageOrder[pageOrder.length - 1];
        pageOrder.push(last);
        renderOrganizer();
        showToast('info', 'Page duplicated. Click "Apply Changes" to save.');
    }

    function reversePages() {
        pageOrder.reverse();
        renderOrganizer();
        showToast('info', 'Pages reversed. Click "Apply Changes" to save.');
    }

    function resetOrder() {
        pageOrder = [];
        for (var i = 0; i < totalPages; i++) {
            pageOrder.push(i);
        }
        renderOrganizer();
        showToast('info', 'Order reset to original');
    }

    async function applyChanges() {
        if (!currentFile) {
            showToast('warning', 'Please upload a PDF first');
            return;
        }

        var applyBtn = document.getElementById('organizeApplyBtn');
        applyBtn.disabled = true;
        applyBtn.textContent = 'Processing...';

        try {
            var { PDFDocument } = window.PDFLib;
            var arrayBuffer = await FileHelpers.readAsArrayBuffer(currentFile);
            var pdf = await PDFDocument.load(arrayBuffer);
            var newPdf = await PDFDocument.create();

            for (var i = 0; i < pageOrder.length; i++) {
                var [page] = await newPdf.copyPages(pdf, [pageOrder[i]]);
                newPdf.addPage(page);
                
                var progress = (i + 1) / pageOrder.length * 100;
                window.showProgress(true, progress, 'Processing page ' + (i + 1) + '/' + pageOrder.length);
            }

            window.showProgress(false);
            
            var pdfBytes = await newPdf.save();
            var blob = new Blob([pdfBytes], { type: 'application/pdf' });
            var filename = FileHelpers.getFileNameWithoutExtension(currentFile.name) + '_organized.pdf';

            window._organizedPdf = {
                blob: blob,
                filename: filename,
                pages: pageOrder.length,
                originalPages: totalPages
            };

            document.getElementById('organizeResult').style.display = 'block';
            document.getElementById('organizeInfo').textContent = 
                'Organized ' + pageOrder.length + ' pages (original: ' + totalPages + ' pages)';

            showToast('success', 'PDF organized successfully!');

        } catch (error) {
            console.error('Organization error:', error);
            showToast('error', 'Failed to organize PDF: ' + error.message);
        } finally {
            applyBtn.disabled = false;
            applyBtn.textContent = 'Apply Changes';
        }
    }

    function downloadOrganized() {
        if (!window._organizedPdf) {
            showToast('warning', 'Please organize the PDF first');
            return;
        }

        DownloadHelpers.downloadBlob(window._organizedPdf.blob, window._organizedPdf.filename);
        showToast('success', 'Organized PDF downloaded');
    }

    return {
        render: render
    };

})();

window.OrganizePdfToolController = OrganizePdfToolController;