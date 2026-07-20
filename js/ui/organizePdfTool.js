/**
 * Organize PDF - UI Controller
 */

const OrganizePdfToolController = (function() {
    'use strict';

    var currentFile = null;
    var totalPages = 0;
    var pageOrder = [];
    var dragIndex = null;

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
                        <span class="material-symbols-outlined">content_copy</span> Duplicate Selected
                    </button>
                    <button class="btn btn-secondary" id="organizeReverseBtn">
                        <span class="material-symbols-outlined">swap_vert</span> Reverse All
                    </button>
                    <button class="btn btn-secondary" id="organizeResetBtn">
                        <span class="material-symbols-outlined">refresh</span> Reset Order
                    </button>
                </div>

                <button class="btn btn-primary" id="organizeApplyBtn" disabled>
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

        var downloadBtn = document.getElementById('organizeDownloadBtn');
        if (downloadBtn) downloadBtn.addEventListener('click', downloadOrganized);
    }

    async function handleFile(file) {
        currentFile = file;
        try {
            totalPages = await PDFProcessor.getPDFPageCount(file);
            pageOrder = [];
            for (var i = 0; i < totalPages; i++) {
                pageOrder.push(i);
            }

            var infoDiv = document.getElementById('organizeFileInfo');
            var details = document.getElementById('organizeFileDetails');
            if (infoDiv && details) {
                infoDiv.style.display = 'block';
                details.textContent = '📄 ' + file.name + ' (' + totalPages + ' pages, ' + FileHelpers.formatFileSize(file.size) + ')';
            }

            document.getElementById('organizeApplyBtn').disabled = false;
            document.getElementById('organizeResult').style.display = 'none';

            renderOrganizer();
            showToast('success', 'Loaded PDF with ' + totalPages + ' pages');
        } catch (error) {
            console.error('Error reading PDF:', error);
            showToast('error', 'Failed to read PDF: ' + error.message);
        }
    }

    function renderOrganizer() {
        var container = document.getElementById('pageOrganizer');
        if (!container) return;

        var html = '<div class="organizer-grid">';
        for (var i = 0; i < pageOrder.length; i++) {
            var pageNum = pageOrder[i] + 1;
            html += `
                <div class="organizer-item" data-index="${i}" data-page="${pageOrder[i]}">
                    <span class="organizer-number">${pageNum}</span>
                    <span class="organizer-handle material-symbols-outlined">drag_handle</span>
                    <button class="organizer-delete" data-index="${i}">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
            `;
        }
        html += '</div>';
        container.innerHTML = html;

        container.querySelectorAll('.organizer-delete').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var index = parseInt(this.dataset.index);
                deletePage(index);
            });
        });

        container.querySelectorAll('.organizer-item').forEach(function(item) {
            item.draggable = true;
            item.addEventListener('dragstart', dragStart);
            item.addEventListener('dragenter', dragEnter);
            item.addEventListener('dragover', dragOver);
            item.addEventListener('drop', drop);
            item.addEventListener('dragend', dragEnd);
        });
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
        this.style.borderColor = 'var(--md-primary)';
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
            }

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