/**
 * OCR Tool - UI Controller
 * Client-Side Text Extraction from PDFs and Images
 * Swiss Minimalist Design System Compliant
 */

const OcrToolController = (function() {
    'use strict';

    let currentFile = null;
    let isPdf = false;
    let totalPdfPages = 1;
    let extractedText = '';

    function render() {
        const container = document.getElementById('toolContent');
        if (!container) return;

        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-header">
                    <h2>🔍 Client-Side OCR</h2>
                    <p>Extract searchable text from scanned PDFs, receipts, and images using in-browser WebAssembly</p>
                </div>

                <div class="upload-area" id="ocrUploadArea">
                    <input type="file" id="ocrFileInput" accept=".pdf,image/png,image/jpeg,image/webp,image/bmp">
                    <div class="upload-icon material-symbols-outlined">document_scanner</div>
                    <div class="upload-text">Drop a PDF or Image here or click to browse</div>
                    <div class="upload-hint">100% Client-Side Text Extraction • Zero Cloud Uploads</div>
                </div>

                <div id="ocrWorkspace" style="display: none;">
                    <div class="file-info" id="ocrFileInfo">
                        <span id="ocrFileName"></span>
                    </div>

                    <!-- Settings & Options -->
                    <div class="settings-group" style="flex-direction: column; align-items: stretch;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--dp-color-ink); padding-bottom: 12px; margin-bottom: 16px;">
                            <strong style="text-transform: uppercase; letter-spacing: 0.08em; font-size: 14px;">OCR Recognition Settings</strong>
                            <span style="font-size: 11px; font-weight: 700; background: var(--dp-color-surface); border: 1px solid var(--dp-color-ink); padding: 2px 8px; text-transform: uppercase;">Wasm Worker</span>
                        </div>

                        <div style="display: flex; gap: 20px; flex-wrap: wrap; align-items: center;">
                            <div>
                                <label class="setting-label">Language Model:</label>
                                <select id="ocrLanguage" class="setting-select" style="min-width: 180px;">
                                    <option value="eng" selected>English (eng)</option>
                                    <option value="spa">Spanish (spa)</option>
                                    <option value="fra">French (fra)</option>
                                    <option value="deu">German (deu)</option>
                                    <option value="ita">Italian (ita)</option>
                                    <option value="por">Portuguese (por)</option>
                                </select>
                            </div>

                            <div id="ocrPageSelectGroup" style="display: none;">
                                <label class="setting-label">Target Page:</label>
                                <select id="ocrPageSelect" class="setting-select" style="min-width: 140px;"></select>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top: 24px; display: flex; gap: 14px; flex-wrap: wrap;">
                        <button type="button" class="btn btn-primary btn-lg" id="btnStartOcr">
                            <span class="material-symbols-outlined">psychology</span> Extract Text from Document
                        </button>
                        <button type="button" class="btn btn-secondary btn-lg" id="btnOcrReset">
                            <span class="material-symbols-outlined">refresh</span> Reset
                        </button>
                    </div>

                    <!-- Progress Indicator -->
                    <div class="progress-container" id="ocrProgress">
                        <div class="progress-bar" id="ocrProgressBar"></div>
                        <div class="progress-text" id="ocrProgressText">Initializing OCR WebAssembly engine...</div>
                    </div>

                    <!-- Extracted Text Result -->
                    <div id="ocrResultSection" class="result-section" style="display: none;">
                        <div class="result-card success" style="margin-bottom: 16px;">
                            <span class="material-symbols-outlined">check_circle</span>
                            <div style="flex: 1;">
                                <strong>Text Recognition Complete</strong>
                                <p id="ocrResultStats">Extracted 0 words.</p>
                            </div>
                        </div>

                        <div class="settings-group" style="flex-direction: column; align-items: stretch; padding: 20px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <strong style="text-transform: uppercase; font-size: 13px; letter-spacing: 0.05em;">Recognized Text</strong>
                                <span id="ocrConfidenceBadge" style="font-size: 11px; font-weight: 700; background: var(--dp-color-surface); border: 1px solid var(--dp-color-ink); padding: 2px 8px;">Confidence: 0%</span>
                            </div>

                            <textarea id="ocrOutputText" rows="12" style="width: 100%; border: 2px solid var(--dp-color-ink); padding: 14px; font-family: monospace; font-size: 14px; line-height: 1.6; background: var(--dp-color-ground); color: var(--dp-color-ink); resize: vertical;"></textarea>
                        </div>

                        <div class="result-actions" style="margin-top: 16px;">
                            <button type="button" class="btn btn-primary btn-lg" id="btnCopyOcrText">
                                <span class="material-symbols-outlined">content_copy</span> Copy Text
                            </button>
                            <button type="button" class="btn btn-secondary btn-lg" id="btnDownloadOcrTxt">
                                <span class="material-symbols-outlined">download</span> Download .TXT File
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        initEvents();
    }

    function initEvents() {
        const fileInput = document.getElementById('ocrFileInput');
        const uploadArea = document.getElementById('ocrUploadArea');

        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.borderStyle = 'solid';
            });
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.style.borderStyle = 'dashed';
            });
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.style.borderStyle = 'dashed';
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    loadFile(e.dataTransfer.files[0]);
                }
            });
            fileInput.addEventListener('change', function() {
                if (this.files && this.files[0]) {
                    loadFile(this.files[0]);
                }
            });
        }

        const btnStart = document.getElementById('btnStartOcr');
        if (btnStart) btnStart.addEventListener('click', executeOcr);

        const btnReset = document.getElementById('btnOcrReset');
        if (btnReset) btnReset.addEventListener('click', render);

        const btnCopy = document.getElementById('btnCopyOcrText');
        if (btnCopy) btnCopy.addEventListener('click', copyText);

        const btnDownloadTxt = document.getElementById('btnDownloadOcrTxt');
        if (btnDownloadTxt) btnDownloadTxt.addEventListener('click', downloadTxt);
    }

    async function loadFile(file) {
        if (!file) return;
        currentFile = file;

        const uploadArea = document.getElementById('ocrUploadArea');
        const workspace = document.getElementById('ocrWorkspace');
        const fileNameEl = document.getElementById('ocrFileName');

        if (uploadArea) uploadArea.style.display = 'none';
        if (workspace) workspace.style.display = 'block';
        if (fileNameEl) {
            fileNameEl.textContent = 'Document: ' + file.name + ' (' + FileHelpers.formatFileSize(file.size) + ')';
        }

        isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
        const pageGroup = document.getElementById('ocrPageSelectGroup');
        const pageSelect = document.getElementById('ocrPageSelect');

        if (isPdf) {
            try {
                const buffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
                totalPdfPages = pdf.numPages;

                if (pageGroup && pageSelect) {
                    pageGroup.style.display = 'block';
                    pageSelect.innerHTML = '';
                    for (let i = 1; i <= totalPdfPages; i++) {
                        const opt = document.createElement('option');
                        opt.value = i;
                        opt.textContent = 'Page ' + i + ' of ' + totalPdfPages;
                        pageSelect.appendChild(opt);
                    }
                }
            } catch (err) {
                console.error('Error reading PDF pages for OCR:', err);
            }
        } else {
            if (pageGroup) pageGroup.style.display = 'none';
        }
    }

    async function executeOcr() {
        if (!currentFile) return;

        const progress = document.getElementById('ocrProgress');
        const progressBar = document.getElementById('ocrProgressBar');
        const progressText = document.getElementById('ocrProgressText');
        const btnStart = document.getElementById('btnStartOcr');
        const lang = document.getElementById('ocrLanguage').value || 'eng';

        if (progress) progress.style.display = 'block';
        if (btnStart) btnStart.disabled = true;

        function updateProgress(m) {
            if (!m) return;
            const pct = Math.round((m.progress || 0) * 100);
            if (progressBar) progressBar.style.width = Math.max(15, pct) + '%';
            if (progressText) {
                const statusMsg = m.status ? m.status.replace(/_/g, ' ') : 'processing';
                progressText.textContent = statusMsg.toUpperCase() + ' (' + pct + '%)';
            }
        }

        try {
            let result;

            if (isPdf) {
                const pageNumber = parseInt(document.getElementById('ocrPageSelect').value) || 1;
                const buffer = await currentFile.arrayBuffer();
                result = await OcrEngine.recognizePdfPage(buffer, pageNumber, lang, updateProgress);
            } else {
                result = await OcrEngine.recognizeImage(currentFile, lang, updateProgress);
            }

            if (progressBar) progressBar.style.width = '100%';
            extractedText = result.text.trim();

            displayResult(extractedText, result.confidence);

            if (typeof incrementFileCount === 'function') incrementFileCount();
            if (typeof showToast === 'function') showToast('success', 'OCR extraction finished!');

        } catch (err) {
            console.error('OCR failed:', err);
            if (typeof showToast === 'function') showToast('error', 'OCR error: ' + err.message);
        } finally {
            if (btnStart) btnStart.disabled = false;
            setTimeout(() => {
                if (progress) progress.style.display = 'none';
            }, 600);
        }
    }

    function displayResult(text, confidence) {
        const resultSection = document.getElementById('ocrResultSection');
        const output = document.getElementById('ocrOutputText');
        const statsEl = document.getElementById('ocrResultStats');
        const confBadge = document.getElementById('ocrConfidenceBadge');

        if (output) output.value = text;
        if (confBadge) confBadge.textContent = 'Confidence: ' + confidence + '%';
        if (statsEl) {
            const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
            const charCount = text.length;
            statsEl.textContent = 'Recognized ' + wordCount + ' words (' + charCount + ' characters).';
        }

        if (resultSection) resultSection.style.display = 'block';
    }

    function copyText() {
        if (!extractedText) return;
        navigator.clipboard.writeText(extractedText).then(() => {
            if (typeof showToast === 'function') showToast('success', 'Text copied to clipboard!');
        }).catch(() => {
            const output = document.getElementById('ocrOutputText');
            if (output) {
                output.select();
                document.execCommand('copy');
                if (typeof showToast === 'function') showToast('success', 'Text copied to clipboard!');
            }
        });
    }

    function downloadTxt() {
        if (!extractedText) return;
        const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
        const outName = currentFile.name.replace(/\.[^/.]+$/, '') + '-extracted.txt';
        saveAs(blob, outName);
    }

    return {
        render: render
    };
})();
