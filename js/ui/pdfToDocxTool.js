/**
 * iZeroPDF - PDF to Editable Word (.docx) Tool UI Controller
 * Swiss Minimalist Design System
 */

function renderPdfToDocxTool() {
    const container = document.getElementById('toolContent');
    const home = document.getElementById('home');
    if (home) home.style.display = 'none';
    if (!container) return;
    container.style.display = 'block';

    let currentFile = null;
    let docxBlob = null;

    container.innerHTML = `
        <div class="tool-workspace">
            <div class="tool-header">
                <button class="btn btn-secondary btn-sm" id="backToHomeBtn">
                    <span class="material-symbols-outlined">arrow_back</span> Back
                </button>
                <div class="tool-title-group">
                    <span class="tool-index">06 / CONVERT</span>
                    <h2>PDF to Editable Word (.docx)</h2>
                    <p>Reconstruct PDF documents into native, editable Microsoft Word files 100% in your browser without cloud uploads.</p>
                </div>
            </div>

            <div class="tool-main-grid" style="display: grid; grid-template-columns: 1fr; gap: 24px; max-width: 960px; margin: 0 auto;">
                <!-- Upload Dropzone -->
                <div class="upload-dropzone" id="docxDropzone" style="border: 2px dashed var(--dp-color-ink); padding: 48px 24px; text-align: center; cursor: pointer; background: var(--dp-color-surface);">
                    <span class="material-symbols-outlined" style="font-size: 48px; margin-bottom: 12px; display: block;">article</span>
                    <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Select PDF to Convert to Word</h3>
                    <p style="font-size: 14px; opacity: 0.7; margin-bottom: 16px;">Zero server conversion. Native OpenXML reconstruction inside browser memory.</p>
                    <button class="btn btn-primary" type="button" id="browseBtn">Browse Files</button>
                    <input type="file" id="docxFileInput" accept="application/pdf" style="display: none;">
                </div>

                <!-- Processing Panel -->
                <div id="docxPanel" style="display: none; border: 2px solid var(--dp-color-ink); padding: 24px; background: var(--dp-color-ground);">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--dp-color-ink); padding-bottom: 16px; margin-bottom: 20px;">
                        <div>
                            <strong id="pdfFileName" style="font-size: 16px; display: block;">document.pdf</strong>
                            <span id="pdfFileMeta" style="font-size: 13px; opacity: 0.7;">Ready for conversion</span>
                        </div>
                        <button class="btn btn-secondary btn-sm" id="changeFileBtn">Change File</button>
                    </div>

                    <div style="background: var(--dp-color-surface); padding: 16px; border: 1px solid var(--dp-color-ink); margin-bottom: 24px;">
                        <h4 style="font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Conversion Features</h4>
                        <ul style="font-size: 13px; opacity: 0.85; margin: 0; padding-left: 20px; line-height: 1.6;">
                            <li>Preserves multi-page flow and paragraph line heights.</li>
                            <li>Detects bold titles and headings automatically.</li>
                            <li>Compatible with Microsoft Word 2013+, Google Docs, Apple Pages, and LibreOffice.</li>
                        </ul>
                    </div>

                    <!-- Progress Rail -->
                    <div id="docxProgressContainer" style="display: none; margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; margin-bottom: 6px;">
                            <span id="docxProgressStatus">Extracting text...</span>
                            <span id="docxProgressPercent">0%</span>
                        </div>
                        <div style="height: 8px; width: 100%; background: var(--dp-color-surface); border: 1px solid var(--dp-color-ink);">
                            <div id="docxProgressBar" style="height: 100%; width: 0%; background: var(--dp-color-ink); transition: width 0.15s ease;"></div>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 12px;">
                        <button class="btn btn-primary" id="startDocxBtn" style="min-width: 220px;">
                            <span class="material-symbols-outlined">description</span> Convert to Word (.docx)
                        </button>
                    </div>

                    <!-- Result Panel -->
                    <div id="docxResultPanel" style="display: none; margin-top: 24px; padding: 16px; background: var(--dp-color-surface); border: 1px solid var(--dp-color-ink); display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span style="font-size: 12px; text-transform: uppercase; font-weight: 700; color: #15803d; display: block;">✔ Conversion Complete</span>
                            <span style="font-size: 13px; opacity: 0.85;">Your editable .docx file is ready for download.</span>
                        </div>
                        <button class="btn btn-primary" id="downloadDocxBtn">
                            <span class="material-symbols-outlined">download</span> Download Word File
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Elements
    const backBtn = document.getElementById('backToHomeBtn');
    const dropzone = document.getElementById('docxDropzone');
    const fileInput = document.getElementById('docxFileInput');
    const browseBtn = document.getElementById('browseBtn');
    const panel = document.getElementById('docxPanel');
    const changeFileBtn = document.getElementById('changeFileBtn');
    const startBtn = document.getElementById('startDocxBtn');
    const progressContainer = document.getElementById('docxProgressContainer');
    const progressBar = document.getElementById('docxProgressBar');
    const progressStatus = document.getElementById('docxProgressStatus');
    const progressPercent = document.getElementById('docxProgressPercent');
    const resultPanel = document.getElementById('docxResultPanel');
    const downloadBtn = document.getElementById('downloadDocxBtn');

    backBtn.addEventListener('click', () => {
        if (typeof Router !== 'undefined') Router.navigate('home');
    });

    browseBtn.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('click', (e) => {
        if (e.target !== browseBtn) fileInput.click();
    });

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.background = '#e5e5e5';
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.style.background = 'var(--dp-color-surface)';
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.background = 'var(--dp-color-surface)';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    });

    changeFileBtn.addEventListener('click', () => {
        currentFile = null;
        docxBlob = null;
        fileInput.value = '';
        panel.style.display = 'none';
        dropzone.style.display = 'block';
        resultPanel.style.display = 'none';
    });

    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(2) + ' MB';
    }

    function handleFileSelect(file) {
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            alert('Please select a valid PDF document.');
            return;
        }

        currentFile = file;
        document.getElementById('pdfFileName').textContent = file.name;
        document.getElementById('pdfFileMeta').textContent = formatBytes(file.size);

        dropzone.style.display = 'none';
        panel.style.display = 'block';
        resultPanel.style.display = 'none';
    }

    startBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        startBtn.disabled = true;
        progressContainer.style.display = 'block';
        resultPanel.style.display = 'none';

        try {
            docxBlob = await DocxEngine.convertPdfToDocx(currentFile, {
                onProgress: (current, total, statusText) => {
                    const pct = Math.round((current / total) * 100);
                    progressBar.style.width = pct + '%';
                    progressPercent.textContent = pct + '%';
                    progressStatus.textContent = statusText;
                }
            });

            resultPanel.style.display = 'flex';
            if (typeof window.incrementFileCount === 'function') {
                window.incrementFileCount();
            }
        } catch (err) {
            console.error('Docx conversion error:', err);
            alert('Error converting to Word: ' + err.message);
        } finally {
            startBtn.disabled = false;
            progressContainer.style.display = 'none';
        }
    });

    downloadBtn.addEventListener('click', () => {
        if (!docxBlob) return;
        const originalName = currentFile ? currentFile.name.replace(/\.pdf$/i, '') : 'document';
        saveAs(docxBlob, `${originalName}.docx`);
    });
}

if (typeof window !== 'undefined') {
    window.renderPdfToDocxTool = renderPdfToDocxTool;
}
