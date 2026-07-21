/**
 * Lock PDF - UI Controller with Live Preview
 */

const LockToolController = (function() {
    'use strict';

    let currentFile = null;
    let pdfDocument = null;
    let totalPages = 0;
    let processedPdfBytes = null;

    function render() {
        var container = document.getElementById('toolContent');
        if (!container) return;

        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-header">
                    <h2>🔒 Lock PDF</h2>
                    <p>Password protect your PDF documents</p>
                </div>

                <div class="upload-area" id="lockUploadArea">
                    <input type="file" id="lockFileInput" accept=".pdf,application/pdf">
                    <div class="upload-icon material-symbols-outlined">upload_file</div>
                    <div class="upload-text">Drop a PDF here or click to browse</div>
                    <div class="upload-hint">Password protect your PDF</div>
                </div>

                <div id="lockFileInfo" class="file-info" style="display: none;">
                    <span id="lockFileDetails"></span>
                </div>

                <div id="previewContainer" class="preview-container" style="display: none;">
                    <h4>Document Preview</h4>
                    <div id="pageGrid" class="lock-page-grid"></div>
                </div>

                <div class="settings-group" style="flex-direction: column; align-items: stretch; margin-top: 20px;">
                    <label>
                        <span class="material-symbols-outlined">lock</span>
                        Password:
                        <input type="password" id="passwordInput" class="text-input" placeholder="Enter password (min 4 chars)">
                    </label>
                    <label>
                        <span class="material-symbols-outlined">lock</span>
                        Confirm Password:
                        <input type="password" id="confirmPasswordInput" class="text-input" placeholder="Confirm password">
                    </label>
                    <div style="margin-top: 8px;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="showPassword">
                            <span class="material-symbols-outlined" style="font-size: 18px;">visibility</span> Show password
                        </label>
                    </div>
                </div>

                <div class="settings-group">
                    <label>
                        <span class="material-symbols-outlined">security</span>
                        Encryption Level:
                        <select id="encryptionLevel" class="setting-select">
                            <option value="128">128-bit (Faster)</option>
                            <option value="256" selected>256-bit (Stronger)</option>
                        </select>
                    </label>
                </div>

                <button class="btn btn-primary btn-lg" id="lockPdfBtn" disabled>
                    <span class="material-symbols-outlined">lock</span> Lock PDF
                </button>

                <div class="progress-container">
                    <div class="progress-bar"></div>
                    <div class="progress-text"></div>
                </div>

                <div id="lockResult" class="result-section" style="display: none;">
                    <div class="result-card success">
                        <span class="material-symbols-outlined">check_circle</span>
                        <div>
                            <strong>PDF Locked Successfully!</strong>
                            <p>Password: <strong id="displayPassword"></strong></p>
                        </div>
                    </div>
                    <div class="result-actions">
                        <button class="btn btn-success" id="downloadLockedBtn">
                            <span class="material-symbols-outlined">download</span> Download Locked PDF
                        </button>
                        <button class="btn btn-secondary" id="lockAgainBtn">
                            <span class="material-symbols-outlined">refresh</span> Lock Another PDF
                        </button>
                    </div>
                </div>
            </div>
        `;

        attachEvents();
    }

    function attachEvents() {
        var fileInput = document.getElementById('lockFileInput');
        var uploadArea = document.getElementById('lockUploadArea');
        var lockBtn = document.getElementById('lockPdfBtn');
        var downloadBtn = document.getElementById('downloadLockedBtn');
        var lockAgainBtn = document.getElementById('lockAgainBtn');
        var passwordInput = document.getElementById('passwordInput');
        var confirmInput = document.getElementById('confirmPasswordInput');
        var showPassword = document.getElementById('showPassword');

        if (showPassword) {
            showPassword.addEventListener('change', function() {
                var type = this.checked ? 'text' : 'password';
                document.getElementById('passwordInput').type = type;
                document.getElementById('confirmPasswordInput').type = type;
            });
        }

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

        if (lockBtn) lockBtn.addEventListener('click', lockPDF);
        if (downloadBtn) downloadBtn.addEventListener('click', downloadLocked);
        if (lockAgainBtn) {
            lockAgainBtn.addEventListener('click', function() {
                document.getElementById('lockResult').style.display = 'none';
                document.getElementById('previewContainer').style.display = 'none';
                document.getElementById('pageGrid').innerHTML = '';
                document.getElementById('passwordInput').value = '';
                document.getElementById('confirmPasswordInput').value = '';
                processedPdfBytes = null;
                pdfDocument = null;
                currentFile = null;
            });
        }
    }

    async function handleFile(file) {
        currentFile = file;
        processedPdfBytes = null;
        
        try {
            var arrayBuffer = await FileHelpers.readAsArrayBuffer(file);
            pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            totalPages = pdfDocument.numPages;
            
            var infoDiv = document.getElementById('lockFileInfo');
            var details = document.getElementById('lockFileDetails');
            if (infoDiv && details) {
                infoDiv.style.display = 'block';
                details.textContent = '📄 ' + file.name + ' (' + totalPages + ' pages, ' + FileHelpers.formatFileSize(file.size) + ')';
            }

            document.getElementById('lockPdfBtn').disabled = false;
            document.getElementById('lockResult').style.display = 'none';
            document.getElementById('previewContainer').style.display = 'block';
            
            await renderPreview();
            showToast('success', 'PDF loaded');
        } catch (error) {
            console.error('Error reading PDF:', error);
            showToast('error', 'Failed to read PDF: ' + error.message);
        }
    }

    async function renderPreview() {
        if (!pdfDocument) return;
        var grid = document.getElementById('pageGrid');
        if (!grid) return;

        var html = '';
        var maxPreview = Math.min(totalPages, 3);
        for (var i = 1; i <= maxPreview; i++) {
            html += `
                <div class="lock-page-card">
                    <div class="page-thumbnail-wrapper">
                        <canvas id="lock-canvas-${i}" class="page-canvas"></canvas>
                    </div>
                    <div class="page-number-badge">Page ${i}</div>
                </div>
            `;
        }
        if (totalPages > 3) {
            html += `<div class="lock-page-card more-pages">+${totalPages - 3} more pages</div>`;
        }
        grid.innerHTML = html;

        for (var i = 1; i <= maxPreview; i++) {
            await renderThumbnail(i);
        }
    }

    async function renderThumbnail(pageNum) {
        try {
            var page = await pdfDocument.getPage(pageNum);
            var canvas = document.getElementById('lock-canvas-' + pageNum);
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

    async function lockPDF() {
        if (!currentFile) {
            showToast('warning', 'Please upload a PDF first');
            return;
        }

        var password = document.getElementById('passwordInput').value;
        var confirm = document.getElementById('confirmPasswordInput').value;

        if (!password) {
            showToast('warning', 'Please enter a password');
            return;
        }

        if (password !== confirm) {
            showToast('error', 'Passwords do not match');
            return;
        }

        if (password.length < 4) {
            showToast('error', 'Password must be at least 4 characters');
            return;
        }

        var lockBtn = document.getElementById('lockPdfBtn');
        lockBtn.disabled = true;
        lockBtn.textContent = 'Encrypting...';

        try {
            var { PDFDocument } = window.PDFLib;
            var arrayBuffer = await FileHelpers.readAsArrayBuffer(currentFile);
            var pdf = await PDFDocument.load(arrayBuffer);
            
            var encryptionLevel = parseInt(document.getElementById('encryptionLevel').value);
            
            // This now works because we are using pdf-lib-with-encrypt
            await pdf.encrypt({
                userPassword: password,
                ownerPassword: password,
                permissions: {
                    printing: 'highResolution',
                    modifying: false,
                    copying: false,
                    annotating: false,
                    fillingForms: false,
                    contentExtraction: false,
                    documentAssembly: false,
                    printingLowQuality: false
                },
                encryptionAlgorithm: encryptionLevel === 256 ? 'aes256' : 'aes128'
            });

            processedPdfBytes = await pdf.save();
            
            document.getElementById('lockResult').style.display = 'block';
            document.getElementById('displayPassword').textContent = password;

            showToast('success', 'PDF locked successfully!');

        } catch (error) {
            console.error('Lock error:', error);
            showToast('error', 'Encryption failed: ' + error.message);
        } finally {
            lockBtn.disabled = false;
            lockBtn.textContent = 'Lock PDF';
        }
    }

    function downloadLocked() {
        if (!processedPdfBytes) {
            showToast('warning', 'Please lock a PDF first');
            return;
        }

        var blob = new Blob([processedPdfBytes], { type: 'application/pdf' });
        var filename = FileHelpers.getFileNameWithoutExtension(currentFile.name) + '_locked.pdf';
        DownloadHelpers.downloadBlob(blob, filename);
        showToast('success', 'Locked PDF downloaded');
    }

    return { render: render };
})();

window.LockToolController = LockToolController;