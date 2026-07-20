/**
 * Lock PDF - UI Controller
 */

const LockToolController = (function() {
    'use strict';

    let currentFile = null;

    function render() {
        var container = document.getElementById('toolContent');
        if (!container) return;

        // ✅ REMOVED: <section class="page active"> wrapper
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

                <div class="settings-group" style="flex-direction: column; align-items: stretch;">
                    <label>
                        <span class="material-symbols-outlined">lock</span>
                        Password:
                        <input type="password" id="passwordInput" placeholder="Enter password">
                    </label>
                    <label>
                        <span class="material-symbols-outlined">lock</span>
                        Confirm Password:
                        <input type="password" id="confirmPasswordInput" placeholder="Confirm password">
                    </label>
                    <div>
                        <label>
                            <input type="checkbox" id="showPassword">
                            <span class="material-symbols-outlined">visibility</span> Show password
                        </label>
                    </div>
                </div>

                <div class="settings-group">
                    <label>
                        <span class="material-symbols-outlined">security</span>
                        Encryption Level:
                        <select id="encryptionLevel">
                            <option value="128">128-bit (Faster)</option>
                            <option value="256" selected>256-bit (Stronger)</option>
                        </select>
                    </label>
                </div>

                <button class="btn btn-primary" id="lockPdfBtn" disabled>
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
    }

    function handleFile(file) {
        currentFile = file;
        
        var infoDiv = document.getElementById('lockFileInfo');
        var details = document.getElementById('lockFileDetails');
        if (infoDiv && details) {
            infoDiv.style.display = 'block';
            details.textContent = '📄 ' + file.name + ' (' + FileHelpers.formatFileSize(file.size) + ')';
        }

        document.getElementById('lockPdfBtn').disabled = false;
        document.getElementById('lockResult').style.display = 'none';
        
        showToast('success', 'PDF loaded');
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

            var pdfBytes = await pdf.save();
            var blob = new Blob([pdfBytes], { type: 'application/pdf' });
            var filename = FileHelpers.getFileNameWithoutExtension(currentFile.name) + '_locked.pdf';
            
            window._lockedPdf = {
                blob: blob,
                filename: filename,
                password: password
            };

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
        if (!window._lockedPdf) {
            showToast('warning', 'Please lock a PDF first');
            return;
        }

        DownloadHelpers.downloadBlob(window._lockedPdf.blob, window._lockedPdf.filename);
        showToast('success', 'Locked PDF downloaded');
    }

    return { render: render };
})();

window.LockToolController = LockToolController;