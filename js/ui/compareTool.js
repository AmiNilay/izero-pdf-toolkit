/**
 * iZeroPDF - Visual PDF Diff & Contract Comparator Tool UI Controller
 * Swiss Minimalist Design System
 */

function renderCompareTool() {
    const container = document.getElementById('toolContent');
    const pageHome = document.getElementById('page-home') || document.getElementById('home');
    if (pageHome) pageHome.style.display = 'none';
    if (!container) return;
    container.style.display = 'block';
    container.style.visibility = 'visible';
    container.style.opacity = '1';

    let fileA = null;
    let fileB = null;
    let pdfDocA = null;
    let pdfDocB = null;
    let currentPage = 1;
    let maxPages = 1;
    let lastDiffCanvas = null;

    container.innerHTML = `
        <div class="tool-workspace">
            <div class="tool-header">
                <button class="btn btn-secondary btn-sm" id="backToHomeBtn">
                    <span class="material-symbols-outlined">arrow_back</span> Back
                </button>
                <div class="tool-title-group">
                    <span class="tool-index">08 / COMPARISON</span>
                    <h2>Visual PDF Diff & Contract Comparator</h2>
                    <p>Compare two versions of a contract, architectural drawing, or proposal. Deletions in red, additions in green.</p>
                </div>
            </div>

            <div class="tool-main-grid" style="display: grid; grid-template-columns: 1fr; gap: 24px; max-width: 1100px; margin: 0 auto;">
                <!-- Dual Upload Dropzones -->
                <div id="dualDropzoneContainer" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
                    <!-- Dropzone A -->
                    <div class="upload-dropzone" id="dropzoneA" style="border: 2px dashed var(--dp-color-ink); padding: 36px 20px; text-align: center; cursor: pointer; background: var(--dp-color-surface);">
                        <span class="material-symbols-outlined" style="font-size: 40px; margin-bottom: 8px; display: block;">description</span>
                        <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 4px;">Document A (Original)</h4>
                        <p id="labelA" style="font-size: 13px; opacity: 0.7; margin-bottom: 12px;">Drop original PDF here</p>
                        <button class="btn btn-secondary btn-sm" type="button" id="btnSelectA">Select File A</button>
                        <input type="file" id="inputA" accept=".pdf,application/pdf" style="display: none;">
                    </div>

                    <!-- Dropzone B -->
                    <div class="upload-dropzone" id="dropzoneB" style="border: 2px dashed var(--dp-color-ink); padding: 36px 20px; text-align: center; cursor: pointer; background: var(--dp-color-surface);">
                        <span class="material-symbols-outlined" style="font-size: 40px; margin-bottom: 8px; display: block;">edit_document</span>
                        <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 4px;">Document B (Revised)</h4>
                        <p id="labelB" style="font-size: 13px; opacity: 0.7; margin-bottom: 12px;">Drop revised PDF here</p>
                        <button class="btn btn-secondary btn-sm" type="button" id="btnSelectB">Select File B</button>
                        <input type="file" id="inputB" accept=".pdf,application/pdf" style="display: none;">
                    </div>
                </div>

                <!-- Comparison Workspace (Initially Hidden) -->
                <div id="compareWorkspace" style="display: none; border: 2px solid var(--dp-color-ink); padding: 20px; background: var(--dp-color-ground);">
                    <!-- Top Control Bar -->
                    <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--dp-color-ink); padding-bottom: 16px; margin-bottom: 16px; gap: 12px;">
                        <!-- Page Navigator -->
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <button class="btn btn-secondary btn-sm" id="prevPageBtn">
                                <span class="material-symbols-outlined">chevron_left</span>
                            </button>
                            <span style="font-size: 13px; font-weight: 700;">Page <span id="curPageNum">1</span> of <span id="totalPageNum">1</span></span>
                            <button class="btn btn-secondary btn-sm" id="nextPageBtn">
                                <span class="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>

                        <!-- Legend & Stats -->
                        <div style="display: flex; align-items: center; gap: 16px; font-size: 12px; font-weight: 700;">
                            <span style="display: flex; align-items: center; gap: 4px; color: #dc2626;">
                                <span style="width: 10px; height: 10px; background: #dc2626; display: inline-block;"></span> Deleted / Missing
                            </span>
                            <span style="display: flex; align-items: center; gap: 4px; color: #16a34a;">
                                <span style="width: 10px; height: 10px; background: #16a34a; display: inline-block;"></span> Added / New
                            </span>
                            <span id="diffSummaryBadge" style="background: var(--dp-color-ink); color: #fff; padding: 4px 8px;">
                                0% Difference
                            </span>
                        </div>

                        <!-- Actions -->
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-secondary btn-sm" id="downloadDiffImgBtn">
                                <span class="material-symbols-outlined">download</span> Export Diff Map
                            </button>
                            <button class="btn btn-secondary btn-sm" id="resetFilesBtn">Reset</button>
                        </div>
                    </div>

                    <!-- Canvases Viewport -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
                        <!-- Original A -->
                        <div style="border: 1px solid var(--dp-color-ink); padding: 8px; background: #fafafa; text-align: center;">
                            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 6px; opacity: 0.8;">Document A (Original)</span>
                            <div id="containerA" style="overflow: auto; max-height: 520px; display: flex; justify-content: center;"></div>
                        </div>

                        <!-- Diff Map -->
                        <div style="border: 2px solid var(--dp-color-ink); padding: 8px; background: #ffffff; text-align: center;">
                            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 6px; color: var(--dp-color-accent);">Visual Diff Highlight</span>
                            <div id="containerDiff" style="overflow: auto; max-height: 520px; display: flex; justify-content: center;"></div>
                        </div>

                        <!-- Revised B -->
                        <div style="border: 1px solid var(--dp-color-ink); padding: 8px; background: #fafafa; text-align: center;">
                            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 6px; opacity: 0.8;">Document B (Revised)</span>
                            <div id="containerB" style="overflow: auto; max-height: 520px; display: flex; justify-content: center;"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Elements
    const backBtn = document.getElementById('backToHomeBtn');
    const dropzoneA = document.getElementById('dropzoneA');
    const dropzoneB = document.getElementById('dropzoneB');
    const inputA = document.getElementById('inputA');
    const inputB = document.getElementById('inputB');
    const labelA = document.getElementById('labelA');
    const labelB = document.getElementById('labelB');
    const dualContainer = document.getElementById('dualDropzoneContainer');
    const workspace = document.getElementById('compareWorkspace');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const curPageNum = document.getElementById('curPageNum');
    const totalPageNum = document.getElementById('totalPageNum');
    const diffSummaryBadge = document.getElementById('diffSummaryBadge');
    const containerA = document.getElementById('containerA');
    const containerDiff = document.getElementById('containerDiff');
    const containerB = document.getElementById('containerB');
    const resetBtn = document.getElementById('resetFilesBtn');
    const downloadDiffImgBtn = document.getElementById('downloadDiffImgBtn');

    backBtn.addEventListener('click', () => {
        if (typeof Router !== 'undefined') Router.navigate('home');
    });

    const btnSelectA = document.getElementById('btnSelectA');
    const btnSelectB = document.getElementById('btnSelectB');

    if (btnSelectA) btnSelectA.addEventListener('click', (e) => { e.stopPropagation(); inputA.click(); });
    if (btnSelectB) btnSelectB.addEventListener('click', (e) => { e.stopPropagation(); inputB.click(); });
    dropzoneA.addEventListener('click', (e) => { if (e.target !== btnSelectA) inputA.click(); });
    dropzoneB.addEventListener('click', (e) => { if (e.target !== btnSelectB) inputB.click(); });

    inputA.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            fileA = e.target.files[0];
            labelA.textContent = fileA.name;
            checkBothFilesReady();
        }
    });

    inputB.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            fileB = e.target.files[0];
            labelB.textContent = fileB.name;
            checkBothFilesReady();
        }
    });

    // Drag-drop A
    dropzoneA.addEventListener('dragover', (e) => { e.preventDefault(); dropzoneA.style.background = '#e5e5e5'; });
    dropzoneA.addEventListener('dragleave', () => { dropzoneA.style.background = 'var(--dp-color-surface)'; });
    dropzoneA.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzoneA.style.background = 'var(--dp-color-surface)';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            fileA = e.dataTransfer.files[0];
            labelA.textContent = fileA.name;
            checkBothFilesReady();
        }
    });

    // Drag-drop B
    dropzoneB.addEventListener('dragover', (e) => { e.preventDefault(); dropzoneB.style.background = '#e5e5e5'; });
    dropzoneB.addEventListener('dragleave', () => { dropzoneB.style.background = 'var(--dp-color-surface)'; });
    dropzoneB.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzoneB.style.background = 'var(--dp-color-surface)';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            fileB = e.dataTransfer.files[0];
            labelB.textContent = fileB.name;
            checkBothFilesReady();
        }
    });

    resetBtn.addEventListener('click', () => {
        fileA = null; fileB = null;
        pdfDocA = null; pdfDocB = null;
        inputA.value = ''; inputB.value = '';
        labelA.textContent = 'Drop original PDF here';
        labelB.textContent = 'Drop revised PDF here';
        dualContainer.style.display = 'grid';
        workspace.style.display = 'none';
        containerA.innerHTML = '';
        containerDiff.innerHTML = '';
        containerB.innerHTML = '';
    });

    async function checkBothFilesReady() {
        if (fileA && fileB) {
            dualContainer.style.display = 'none';
            workspace.style.display = 'block';
            diffSummaryBadge.textContent = 'Loading comparison...';

            try {
                pdfDocA = await CompareEngine.loadPdfDocument(fileA);
                pdfDocB = await CompareEngine.loadPdfDocument(fileB);
                maxPages = Math.max(pdfDocA.numPages, pdfDocB.numPages);
                currentPage = 1;
                totalPageNum.textContent = maxPages;
                await renderCurrentComparison();
            } catch (err) {
                console.error('Diff error:', err);
                alert('Error loading documents for comparison: ' + err.message);
            }
        }
    }

    async function renderCurrentComparison() {
        curPageNum.textContent = currentPage;
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= maxPages;

        containerA.innerHTML = '<span style="font-size: 13px; opacity: 0.6; padding: 40px;">Rendering...</span>';
        containerDiff.innerHTML = '<span style="font-size: 13px; opacity: 0.6; padding: 40px;">Calculating pixel diff...</span>';
        containerB.innerHTML = '<span style="font-size: 13px; opacity: 0.6; padding: 40px;">Rendering...</span>';

        const canvasA = currentPage <= pdfDocA.numPages 
            ? await CompareEngine.renderPageToCanvas(pdfDocA, currentPage, 1.2)
            : createEmptyCanvas();

        const canvasB = currentPage <= pdfDocB.numPages
            ? await CompareEngine.renderPageToCanvas(pdfDocB, currentPage, 1.2)
            : createEmptyCanvas();

        // Perform visual diff
        const result = CompareEngine.diffCanvases(canvasA, canvasB, 25);
        lastDiffCanvas = result.diffCanvas;

        // Apply responsive styling
        [canvasA, result.diffCanvas, canvasB].forEach(c => {
            c.style.maxWidth = '100%';
            c.style.height = 'auto';
            c.style.border = '1px solid #ccc';
        });

        containerA.innerHTML = '';
        containerA.appendChild(canvasA);

        containerDiff.innerHTML = '';
        containerDiff.appendChild(result.diffCanvas);

        containerB.innerHTML = '';
        containerB.appendChild(canvasB);

        diffSummaryBadge.textContent = `${result.diffPercentage}% Changed (${result.diffCount.toLocaleString()} pixels)`;

        if (typeof window.incrementFileCount === 'function') {
            window.incrementFileCount();
        }
    }

    function createEmptyCanvas() {
        const c = document.createElement('canvas');
        c.width = 400; c.height = 550;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#f3f3f3';
        ctx.fillRect(0, 0, 400, 550);
        ctx.fillStyle = '#888';
        ctx.font = '14px sans-serif';
        ctx.fillText('(Page not in document)', 120, 275);
        return c;
    }

    prevPageBtn.addEventListener('click', async () => {
        if (currentPage > 1) {
            currentPage--;
            await renderCurrentComparison();
        }
    });

    nextPageBtn.addEventListener('click', async () => {
        if (currentPage < maxPages) {
            currentPage++;
            await renderCurrentComparison();
        }
    });

    downloadDiffImgBtn.addEventListener('click', () => {
        if (!lastDiffCanvas) return;
        lastDiffCanvas.toBlob((blob) => {
            saveAs(blob, `diff-page-${currentPage}.png`);
        });
    });
}

if (typeof window !== 'undefined') {
    window.renderCompareTool = renderCompareTool;
}
