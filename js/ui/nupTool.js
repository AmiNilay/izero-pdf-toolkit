/**
 * iZeroPDF - N-Up Multi-Page Imposition Tool UI Controller
 * Swiss Minimalist Design System
 */

function renderNupTool() {
    const container = document.getElementById('toolContent');
    const home = document.getElementById('home');
    if (home) home.style.display = 'none';
    if (!container) return;
    container.style.display = 'block';

    let currentFile = null;
    let pageCount = 0;
    let imposedPdfBytes = null;

    container.innerHTML = `
        <div class="tool-workspace">
            <div class="tool-header">
                <button class="btn btn-secondary btn-sm" id="backToHomeBtn">
                    <span class="material-symbols-outlined">arrow_back</span> Back
                </button>
                <div class="tool-title-group">
                    <span class="tool-index">07 / IMPOSITION</span>
                    <h2>N-Up Multi-Page Imposition</h2>
                    <p>Combine multiple PDF pages onto a single sheet of paper for compact printing, handouts, and cheat sheets.</p>
                </div>
            </div>

            <div class="tool-main-grid" style="display: grid; grid-template-columns: 1fr; gap: 24px; max-width: 960px; margin: 0 auto;">
                <!-- Upload Dropzone -->
                <div class="upload-dropzone" id="nupDropzone" style="border: 2px dashed var(--dp-color-ink); padding: 48px 24px; text-align: center; cursor: pointer; background: var(--dp-color-surface);">
                    <span class="material-symbols-outlined" style="font-size: 48px; margin-bottom: 12px; display: block;">grid_view</span>
                    <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Select PDF for Multi-Page Imposition</h3>
                    <p style="font-size: 14px; opacity: 0.7; margin-bottom: 16px;">Fast, private, in-browser layout generation without cloud servers.</p>
                    <button class="btn btn-primary" type="button" id="browseBtn">Browse Files</button>
                    <input type="file" id="nupFileInput" accept="application/pdf" style="display: none;">
                </div>

                <!-- Imposition Settings Panel -->
                <div id="nupPanel" style="display: none; border: 2px solid var(--dp-color-ink); padding: 24px; background: var(--dp-color-ground);">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--dp-color-ink); padding-bottom: 16px; margin-bottom: 20px;">
                        <div>
                            <strong id="pdfFileName" style="font-size: 16px; display: block;">document.pdf</strong>
                            <span id="pdfFileSummary" style="font-size: 13px; opacity: 0.7;">0 pages detected</span>
                        </div>
                        <button class="btn btn-secondary btn-sm" id="changeFileBtn">Change File</button>
                    </div>

                    <!-- Configuration Grid -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 24px;">
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Pages Per Sheet</label>
                            <select id="nupSelect" style="width: 100%; padding: 10px; border: 2px solid var(--dp-color-ink); background: var(--dp-color-ground); font-weight: 700;">
                                <option value="2">2 Pages Per Sheet (2-Up)</option>
                                <option value="4" selected>4 Pages Per Sheet (4-Up)</option>
                                <option value="6">6 Pages Per Sheet (6-Up)</option>
                                <option value="8">8 Pages Per Sheet (8-Up)</option>
                            </select>
                        </div>

                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Sheet Orientation</label>
                            <select id="orientationSelect" style="width: 100%; padding: 10px; border: 2px solid var(--dp-color-ink); background: var(--dp-color-ground); font-weight: 700;">
                                <option value="landscape" selected>Landscape (Recommended)</option>
                                <option value="portrait">Portrait</option>
                            </select>
                        </div>

                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Target Paper Size</label>
                            <select id="paperSizeSelect" style="width: 100%; padding: 10px; border: 2px solid var(--dp-color-ink); background: var(--dp-color-ground); font-weight: 700;">
                                <option value="A4" selected>A4 (210 x 297 mm)</option>
                                <option value="Letter">US Letter (8.5 x 11 in)</option>
                                <option value="Legal">US Legal (8.5 x 14 in)</option>
                            </select>
                        </div>
                    </div>

                    <!-- Options Checkbox -->
                    <div style="background: var(--dp-color-surface); padding: 14px 18px; border: 1px solid var(--dp-color-ink); margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;">
                        <label style="display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; cursor: pointer;">
                            <input type="checkbox" id="drawBordersCheckbox" checked style="width: 16px; height: 16px;">
                            <span>Draw subtle outline borders around each sub-page</span>
                        </label>
                        <span id="calculatedSheetsBadge" style="font-size: 12px; font-weight: 700; background: var(--dp-color-ink); color: #fff; padding: 4px 8px;">
                            Yields 1 Sheet
                        </span>
                    </div>

                    <!-- Progress Rail -->
                    <div id="nupProgressContainer" style="display: none; margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; margin-bottom: 6px;">
                            <span id="nupProgressStatus">Imposing pages...</span>
                            <span id="nupProgressPercent">0%</span>
                        </div>
                        <div style="height: 8px; width: 100%; background: var(--dp-color-surface); border: 1px solid var(--dp-color-ink);">
                            <div id="nupProgressBar" style="height: 100%; width: 0%; background: var(--dp-color-ink); transition: width 0.15s ease;"></div>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 12px;">
                        <button class="btn btn-primary" id="startNupBtn" style="min-width: 200px;">
                            <span class="material-symbols-outlined">dashboard</span> Generate Imposed PDF
                        </button>
                    </div>

                    <!-- Result Panel -->
                    <div id="nupResultPanel" style="display: none; margin-top: 24px; padding: 16px; background: var(--dp-color-surface); border: 1px solid var(--dp-color-ink); display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span style="font-size: 12px; text-transform: uppercase; font-weight: 700; color: #15803d; display: block;">✔ Imposition Complete</span>
                            <span id="resultSummaryText" style="font-size: 13px; opacity: 0.85;">Multi-page document ready.</span>
                        </div>
                        <button class="btn btn-primary" id="downloadNupBtn">
                            <span class="material-symbols-outlined">download</span> Download Imposed PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Elements
    const backBtn = document.getElementById('backToHomeBtn');
    const dropzone = document.getElementById('nupDropzone');
    const fileInput = document.getElementById('nupFileInput');
    const browseBtn = document.getElementById('browseBtn');
    const panel = document.getElementById('nupPanel');
    const changeFileBtn = document.getElementById('changeFileBtn');
    const nupSelect = document.getElementById('nupSelect');
    const orientationSelect = document.getElementById('orientationSelect');
    const paperSizeSelect = document.getElementById('paperSizeSelect');
    const drawBordersCheckbox = document.getElementById('drawBordersCheckbox');
    const calculatedSheetsBadge = document.getElementById('calculatedSheetsBadge');
    const startBtn = document.getElementById('startNupBtn');
    const progressContainer = document.getElementById('nupProgressContainer');
    const progressBar = document.getElementById('nupProgressBar');
    const progressStatus = document.getElementById('nupProgressStatus');
    const progressPercent = document.getElementById('nupProgressPercent');
    const resultPanel = document.getElementById('nupResultPanel');
    const resultSummaryText = document.getElementById('resultSummaryText');
    const downloadBtn = document.getElementById('downloadNupBtn');

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
        imposedPdfBytes = null;
        fileInput.value = '';
        panel.style.display = 'none';
        dropzone.style.display = 'block';
        resultPanel.style.display = 'none';
    });

    function updateYieldBadge() {
        const n = parseInt(nupSelect.value, 10);
        const sheets = Math.ceil(pageCount / n) || 1;
        calculatedSheetsBadge.textContent = `${pageCount} Pages → ${sheets} Sheet${sheets === 1 ? '' : 's'}`;
    }

    nupSelect.addEventListener('change', () => {
        const n = parseInt(nupSelect.value, 10);
        if (n === 2 || n === 6) {
            orientationSelect.value = 'landscape';
        }
        updateYieldBadge();
    });

    async function handleFileSelect(file) {
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            alert('Please select a valid PDF document.');
            return;
        }

        currentFile = file;
        document.getElementById('pdfFileName').textContent = file.name;

        try {
            const buf = await file.arrayBuffer();
            const doc = await PDFLib.PDFDocument.load(buf, { ignoreEncryption: true });
            pageCount = doc.getPageCount();
            document.getElementById('pdfFileSummary').textContent = `${pageCount} pages detected`;
            updateYieldBadge();
        } catch (e) {
            pageCount = 1;
        }

        dropzone.style.display = 'none';
        panel.style.display = 'block';
        resultPanel.style.display = 'none';
    }

    startBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        startBtn.disabled = true;
        progressContainer.style.display = 'block';
        resultPanel.style.display = 'none';

        const nup = parseInt(nupSelect.value, 10);
        const orientation = orientationSelect.value;
        const paperSize = paperSizeSelect.value;
        const drawBorders = drawBordersCheckbox.checked;

        try {
            imposedPdfBytes = await NupEngine.imposePdf(currentFile, {
                nup: nup,
                orientation: orientation,
                paperSize: paperSize,
                drawBorders: drawBorders,
                onProgress: (current, total, statusText) => {
                    const pct = Math.round((current / total) * 100);
                    progressBar.style.width = pct + '%';
                    progressPercent.textContent = pct + '%';
                    progressStatus.textContent = statusText;
                }
            });

            const sheets = Math.ceil(pageCount / nup);
            resultSummaryText.textContent = `Generated ${sheets} sheet${sheets === 1 ? '' : 's'} (${nup}-Up) ready for printing.`;
            resultPanel.style.display = 'flex';
            if (typeof window.incrementFileCount === 'function') {
                window.incrementFileCount();
            }
        } catch (err) {
            console.error('N-Up error:', err);
            alert('Error generating imposed PDF: ' + err.message);
        } finally {
            startBtn.disabled = false;
            progressContainer.style.display = 'none';
        }
    });

    downloadBtn.addEventListener('click', () => {
        if (!imposedPdfBytes) return;
        const blob = new Blob([imposedPdfBytes], { type: 'application/pdf' });
        const originalName = currentFile ? currentFile.name.replace(/\.pdf$/i, '') : 'document';
        saveAs(blob, `${originalName}-${nupSelect.value}up.pdf`);
    });
}

if (typeof window !== 'undefined') {
    window.renderNupTool = renderNupTool;
}
