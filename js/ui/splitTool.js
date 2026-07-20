/**
 * Split PDF - UI Controller
 */

const SplitToolController = (function() {
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
                    <h2>✂️ Split PDF</h2>
                    <p>Split a PDF into multiple documents</p>
                </div>

                <div class="upload-area" id="splitUploadArea">
                    <input type="file" id="splitFileInput" accept=".pdf,application/pdf">
                    <div class="upload-icon material-symbols-outlined">upload_file</div>
                    <div class="upload-text">Drop a PDF here or click to browse</div>
                    <div class="upload-hint">Split PDF into parts</div>
                </div>

                <div id="splitFileInfoContainer" class="file-info" style="display: none;">
                    <span id="splitFileInfo"></span>
                </div>

                <div class="settings-group">
                    <label>
                        <span class="material-symbols-outlined">content_cut</span>
                        Split Method:
                        <select id="splitMethod">
                            <option value="ranges">By Page Ranges</option>
                            <option value="count">Every N Pages</option>
                            <option value="pages">Extract Specific Pages</option>
                            <option value="at">Split at Pages</option>
                        </select>
                    </label>
                </div>

                <div id="splitSettings" class="settings-group">
                    <div id="rangesSettings" style="width: 100%;">
                        <label>
                            <span class="material-symbols-outlined">tag</span>
                            Page Ranges (e.g., "1-3,5,7-9"):
                            <input type="text" id="pageRanges" placeholder="1-3,5,7-9">
                        </label>
                        <div class="hint-text" style="margin-left: 32px; margin-top: 4px; font-size: 12px; color: var(--md-sys-color-outline, #666);">Separate ranges with commas. Use hyphens for ranges.</div>
                    </div>
                    <div id="countSettings" style="display:none; width: 100%;">
                        <label>
                            <span class="material-symbols-outlined">description</span>
                            Pages per file:
                            <input type="number" id="pagesPerFile" value="5" min="1">
                        </label>
                    </div>
                    <div id="pagesSettings" style="display:none; width: 100%;">
                        <label>
                            <span class="material-symbols-outlined">tag</span>
                            Page numbers to extract (e.g., "1,3,5"):
                            <input type="text" id="extractPages" placeholder="1,3,5">
                        </label>
                    </div>
                    <div id="atSettings" style="display:none; width: 100%;">
                        <label>
                            <span class="material-symbols-outlined">tag</span>
                            Split at page numbers (e.g., "3,7,10"):
                            <input type="text" id="splitAtPages" placeholder="3,7,10">
                        </label>
                        <div class="hint-text" style="margin-left: 32px; margin-top: 4px; font-size: 12px; color: var(--md-sys-color-outline, #666);">Split will occur before each specified page number</div>
                    </div>
                </div>

                <button class="btn btn-primary" id="splitPdfBtn" disabled>
                    <span class="material-symbols-outlined">content_cut</span> Split PDF
                </button>

                <div class="progress-container">
                    <div class="progress-bar"></div>
                    <div class="progress-text"></div>
                </div>

                <div id="splitResult" class="result-section" style="display: none;">
                    <div class="result-card success">
                        <span class="material-symbols-outlined">check_circle</span>
                        <div>
                            <strong>Split Complete!</strong>
                            <p id="splitResultInfo"></p>
                        </div>
                    </div>
                    <div class="result-actions">
                        <button class="btn btn-success" id="downloadSplitBtn">
                            <span class="material-symbols-outlined">download</span> Download All
                        </button>
                        <button class="btn btn-secondary" id="downloadSplitZipBtn">
                            <span class="material-symbols-outlined">folder_zip</span> Download as ZIP
                        </button>
                    </div>
                </div>

                <div id="splitPreview" class="preview-area" style="display: none;"></div>
            </div>
        `;

        attachEvents();
    }

    function attachEvents() {
        var fileInput = document.getElementById('splitFileInput');
        var uploadArea = document.getElementById('splitUploadArea');
        var splitBtn = document.getElementById('splitPdfBtn');
        var methodSelect = document.getElementById('splitMethod');

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

        if (methodSelect) {
            methodSelect.addEventListener('change', function() {
                var method = this.value;
                document.getElementById('rangesSettings').style.display = method === 'ranges' ? 'block' : 'none';
                document.getElementById('countSettings').style.display = method === 'count' ? 'block' : 'none';
                document.getElementById('pagesSettings').style.display = method === 'pages' ? 'block' : 'none';
                document.getElementById('atSettings').style.display = method === 'at' ? 'block' : 'none';
            });
        }

        if (splitBtn) splitBtn.addEventListener('click', splitPDF);
        document.getElementById('downloadSplitBtn').addEventListener('click', downloadAll);
        document.getElementById('downloadSplitZipBtn').addEventListener('click', downloadZip);
    }

    async function handleFile(file) {
        currentFile = file;
        
        try {
            totalPages = await PDFProcessor.getPDFPageCount(file);
            
            var infoDiv = document.getElementById('splitFileInfoContainer');
            var infoSpan = document.getElementById('splitFileInfo');
            if (infoDiv && infoSpan) {
                infoDiv.style.display = 'block';
                infoSpan.textContent = '📄 ' + file.name + ' (' + totalPages + ' pages, ' + FileHelpers.formatFileSize(file.size) + ')';
            }

            document.getElementById('splitPdfBtn').disabled = false;
            document.getElementById('splitResult').style.display = 'none';
            
            showToast('success', 'Loaded PDF with ' + totalPages + ' pages');

        } catch (error) {
            console.error('Error reading PDF:', error);
            showToast('error', 'Failed to read PDF: ' + error.message);
        }
    }

    async function splitPDF() {
        if (!currentFile) {
            showToast('warning', 'Please upload a PDF first');
            return;
        }

        var splitBtn = document.getElementById('splitPdfBtn');
        splitBtn.disabled = true;
        splitBtn.textContent = 'Splitting...';

        try {
            var method = document.getElementById('splitMethod').value;
            var results = [];

            switch (method) {
                case 'ranges':
                    var rangesStr = document.getElementById('pageRanges').value;
                    if (!rangesStr) {
                        throw new Error('Please specify page ranges');
                    }
                    var ranges = rangesStr.split(',').map(function(s) { return s.trim(); });
                    results = await SplitEngine.splitByRanges(currentFile, ranges);
                    break;

                case 'count':
                    var perFile = parseInt(document.getElementById('pagesPerFile').value);
                    if (perFile < 1) throw new Error('Invalid pages per file');
                    results = await SplitEngine.splitByPageCount(currentFile, perFile);
                    break;

                case 'pages':
                    var pagesStr = document.getElementById('extractPages').value;
                    if (!pagesStr) throw new Error('Please specify pages to extract');
                    var pages = pagesStr.split(',').map(function(s) { return parseInt(s.trim()); }).filter(function(n) { return !isNaN(n); });
                    results = await SplitEngine.extractPages(currentFile, pages);
                    break;

                case 'at':
                    var atStr = document.getElementById('splitAtPages').value;
                    if (!atStr) throw new Error('Please specify split points');
                    var atPages = atStr.split(',').map(function(s) { return parseInt(s.trim()); }).filter(function(n) { return !isNaN(n); });
                    results = await SplitEngine.splitAtPages(currentFile, atPages);
                    break;

                default:
                    throw new Error('Unknown split method');
            }

            if (results.length === 0) {
                throw new Error('No parts created');
            }

            window._splitResults = results;

            document.getElementById('splitResult').style.display = 'block';
            document.getElementById('splitResultInfo').textContent = results.length + ' parts created';

            var preview = document.getElementById('splitPreview');
            if (preview) {
                preview.style.display = 'block';
                renderPreviewGrid(results);
            }

            showToast('success', 'Split into ' + results.length + ' parts');

        } catch (error) {
            console.error('Split error:', error);
            showToast('error', 'Split failed: ' + error.message);
        } finally {
            splitBtn.disabled = false;
            splitBtn.textContent = 'Split PDF';
        }
    }

    function renderPreviewGrid(results) {
        var preview = document.getElementById('splitPreview');
        var html = '<div class="preview-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; margin-top: 20px;">';
        for (var i = 0; i < Math.min(results.length, 12); i++) {
            var result = results[i];
            html += `
                <div class="preview-item" id="preview-item-${i}" style="background: var(--md-sys-color-surface-container, #f9fafb); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: transform 0.2s, box-shadow 0.2s; border: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);">
                    <div style="width: 100%; aspect-ratio: 1/1.414; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; margin-bottom: 12px; position: relative;">
                        <canvas id="preview-canvas-${i}" style="max-width: 100%; max-height: 100%; display: block;"></canvas>
                        <div id="preview-fallback-${i}" style="font-size:48px; display: none;">📄</div>
                    </div>
                    <div style="font-size:14px; font-weight: 500; color: var(--md-sys-color-on-surface, #1f2937); text-align: center; margin-bottom: 4px; word-break: break-all; max-width: 100%;">${result.filename}</div>
                    <div style="font-size:12px; color: var(--md-sys-color-on-surface-variant, #6b7280); margin-bottom: 12px;">${result.pageCount || (result.pages ? result.pages.length : 0)} pages</div>
                    <div style="display: flex; gap: 8px; width: 100%;">
                        <button class="btn btn-secondary preview-view-btn" data-index="${i}" style="flex: 1; padding: 8px; font-size: 13px; margin: 0; display: flex; align-items: center; justify-content: center; gap: 4px;">
                            <span class="material-symbols-outlined" style="font-size: 16px;">visibility</span> View
                        </button>
                        <button class="btn btn-primary preview-download-btn" data-index="${i}" style="flex: 1; padding: 8px; font-size: 13px; margin: 0; display: flex; align-items: center; justify-content: center; gap: 4px;">
                            <span class="material-symbols-outlined" style="font-size: 16px;">download</span> Save
                        </button>
                    </div>
                </div>
            `;
        }
        if (results.length > 12) {
            html += '<div class="preview-item more-item" style="grid-column: span 2; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 500; color: var(--md-sys-color-primary, #2563eb); padding: 40px; border: 2px dashed var(--md-sys-color-outline, #d1d5db); border-radius: 12px;">+' + (results.length - 12) + ' more files...</div>';
        }
        html += '</div>';
        preview.innerHTML = html;

        document.querySelectorAll('.preview-view-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var idx = parseInt(this.getAttribute('data-index'));
                var r = window._splitResults[idx];
                r.blob.arrayBuffer().then(function(ab) {
                    showPreviewModal(new Uint8Array(ab), r.filename);
                });
            });
        });

        document.querySelectorAll('.preview-download-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var idx = parseInt(this.getAttribute('data-index'));
                var r = window._splitResults[idx];
                DownloadHelpers.downloadBlob(r.blob, r.filename);
                showToast('success', 'Downloaded ' + r.filename);
            });
        });

        generateThumbnails(results);
    }

    function showPreviewModal(pdfData, filename) {
        var modal = document.getElementById('pdf-preview-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'pdf-preview-modal';
            modal.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding: 20px; box-sizing: border-box; overflow-y: auto; backdrop-filter: blur(4px);";
            
            modal.innerHTML = `
                <div style="width: 100%; max-width: 800px; display: flex; justify-content: space-between; align-items: center; color: white; margin-bottom: 20px; padding: 0 10px;">
                    <h3 style="margin: 0; font-size: 18px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80%;">${filename}</h3>
                    <button id="close-preview-modal" style="padding: 8px 16px; background: #fff; color: #000; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Close</button>
                </div>
                <div id="modal-pdf-pages" style="display: flex; flex-direction: column; align-items: center; gap: 20px; width: 100%; max-width: 800px;"></div>
            `;
            document.body.appendChild(modal);
            
            document.getElementById('close-preview-modal').addEventListener('click', function() {
                modal.remove();
            });
        } else {
            modal.querySelector('h3').textContent = filename;
            modal.style.display = 'flex';
            document.getElementById('modal-pdf-pages').innerHTML = '';
        }

        renderModalPages(pdfData);
    }

    async function renderModalPages(pdfData) {
        var container = document.getElementById('modal-pdf-pages');
        container.innerHTML = '<div style="color: white; padding: 40px; font-size: 16px;">Loading preview...</div>';
        
        try {
            if (typeof pdfjsLib === 'undefined') {
                throw new Error('pdfjsLib not loaded');
            }
            var loadingTask = pdfjsLib.getDocument({ data: pdfData });
            var pdf = await loadingTask.promise;
            container.innerHTML = ''; 
            
            for (var i = 1; i <= pdf.numPages; i++) {
                var page = await pdf.getPage(i);
                var viewport = page.getViewport({ scale: 1.5 });
                
                var canvas = document.createElement('canvas');
                canvas.style.cssText = 'max-width: 100%; height: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border-radius: 4px; background: white;';
                var context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                container.appendChild(canvas);
                
                await page.render({ canvasContext: context, viewport: viewport }).promise;
            }
        } catch (err) {
            console.error("Error rendering modal PDF", err);
            container.innerHTML = '<div style="color: #fca5a5; padding: 40px; font-size: 16px;">Failed to load preview.</div>';
        }
    }

    async function generateThumbnails(results) {
        if (typeof pdfjsLib === 'undefined') {
            console.warn('pdfjsLib not found, skipping thumbnail generation');
            return;
        }

        for (var i = 0; i < Math.min(results.length, 12); i++) {
            var result = results[i];
            try {
                var arrayBuffer = await result.blob.arrayBuffer();
                var loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                var pdf = await loadingTask.promise;
                var page = await pdf.getPage(1);
                
                var viewport = page.getViewport({ scale: 0.5 });
                var canvas = document.getElementById('preview-canvas-' + i);
                if (!canvas) continue;
                
                var context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                var renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                await page.render(renderContext).promise;
            } catch (err) {
                console.error('Error generating thumbnail for', result.filename, err);
                var canvas = document.getElementById('preview-canvas-' + i);
                if (canvas) canvas.style.display = 'none';
                var fallback = document.getElementById('preview-fallback-' + i);
                if (fallback) fallback.style.display = 'flex';
            }
        }
    }

    function downloadAll() {
        var results = window._splitResults;
        if (!results || results.length === 0) {
            showToast('warning', 'No parts to download');
            return;
        }

        for (var i = 0; i < results.length; i++) {
            var result = results[i];
            DownloadHelpers.downloadBlob(result.blob, result.filename);
        }

        showToast('success', 'Downloaded ' + results.length + ' parts');
    }

    async function downloadZip() {
        var results = window._splitResults;
        if (!results || results.length === 0) {
            showToast('warning', 'No parts to download');
            return;
        }

        try {
            showToast('info', 'Creating ZIP...');
            
            var files = results.map(function(r) {
                return { filename: r.filename, data: r.blob };
            });
            
            var zip = await ZipHelpers.createZip(files);
            DownloadHelpers.downloadBlob(zip, 'split_parts.zip');
            
            showToast('success', 'ZIP file downloaded');
        } catch (error) {
            console.error('ZIP creation error:', error);
            showToast('error', 'Failed to create ZIP: ' + error.message);
        }
    }

    return { render: render };
})();

window.SplitToolController = SplitToolController;