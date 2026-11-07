/**
 * Redact PDF - UI Controller
 * Interactive Click-and-Drag Blackout Redaction
 * Swiss Minimalist Design System Compliant
 */

const RedactToolController = (function() {
    'use strict';

    let currentFile = null;
    let pdfDoc = null;
    let currentPage = 1;
    let totalPages = 1;
    let renderedViewport = null;

    let redactionBoxes = []; // Array of { x, y, width, height } in canvas pixels
    let isDrawingBox = false;
    let boxStartX = 0;
    let boxStartY = 0;

    function render() {
        const container = document.getElementById('toolContent');
        if (!container) return;

        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-header">
                    <h2>🛡️ Redact PDF</h2>
                    <p>Permanently blackout and purge confidential text, account numbers, and personal info</p>
                </div>

                <div class="upload-area" id="redactUploadArea">
                    <input type="file" id="redactFileInput" accept=".pdf,application/pdf">
                    <div class="upload-icon material-symbols-outlined">ink_eraser</div>
                    <div class="upload-text">Drop a PDF here or click to browse</div>
                    <div class="upload-hint">True Stream Redaction • Irreversible Client-Side Purge</div>
                </div>

                <div id="redactWorkspace" style="display: none;">
                    <div class="file-info" id="redactFileInfo">
                        <span id="redactFileName"></span>
                    </div>

                    <!-- Redaction Controls & Canvas -->
                    <div class="settings-group" style="flex-direction: column; align-items: stretch;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--dp-color-ink); padding-bottom: 12px; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <strong style="text-transform: uppercase; font-size: 14px; letter-spacing: 0.05em;">Redaction Canvas</strong>
                                <span id="redactCountBadge" style="font-size: 11px; font-weight: 700; background: var(--dp-color-accent); color: #ffffff; padding: 2px 8px;">0 Blackouts</span>
                            </div>

                            <div style="display: flex; gap: 8px; align-items: center;">
                                <button type="button" class="btn btn-sm btn-secondary" id="redactPrevPageBtn">
                                    <span class="material-symbols-outlined">arrow_back</span>
                                </button>
                                <span id="redactPageIndicator" style="font-family: monospace; font-size: 13px; font-weight: 700;">Page 1 / 1</span>
                                <button type="button" class="btn btn-sm btn-secondary" id="redactNextPageBtn">
                                    <span class="material-symbols-outlined">arrow_forward</span>
                                </button>

                                <button type="button" class="btn btn-sm btn-secondary" id="btnUndoRedact" style="margin-left: 8px;">
                                    <span class="material-symbols-outlined">undo</span> Undo
                                </button>
                                <button type="button" class="btn btn-sm btn-secondary" id="btnClearRedact">
                                    <span class="material-symbols-outlined">delete</span> Clear
                                </button>
                            </div>
                        </div>

                        <p style="font-size: 13px; opacity: 0.8; margin-bottom: 14px;">
                            Click and drag your mouse across any sensitive names, numbers, or sections to draw blackout redaction boxes.
                        </p>

                        <!-- Interactive PDF Viewer with Drawing Layer -->
                        <div style="overflow: auto; max-height: 70vh; background: var(--dp-color-surface); border: 2px solid var(--dp-color-ink); padding: 20px; display: flex; justify-content: center;">
                            <div id="redactViewportWrapper" style="position: relative; display: inline-block; background: #ffffff; box-shadow: 0 4px 16px rgba(0,0,0,0.15);">
                                <canvas id="redactBaseCanvas" style="display: block;"></canvas>
                                <canvas id="redactDrawCanvas" style="position: absolute; top: 0; left: 0; cursor: crosshair; touch-action: none; display: block;"></canvas>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top: 24px; display: flex; gap: 14px; flex-wrap: wrap;">
                        <button type="button" class="btn btn-danger btn-lg" id="btnBurnRedaction">
                            <span class="material-symbols-outlined">verified</span> Burn Redactions & Export PDF
                        </button>
                        <button type="button" class="btn btn-secondary btn-lg" id="btnRedactReset">
                            <span class="material-symbols-outlined">refresh</span> Reset
                        </button>
                    </div>

                    <div class="progress-container" id="redactProgress">
                        <div class="progress-bar" id="redactProgressBar"></div>
                        <div class="progress-text" id="redactProgressText">Sanitizing and burning redactions...</div>
                    </div>

                    <div id="redactResultSection" class="result-section" style="display: none;">
                        <div class="result-card success">
                            <span class="material-symbols-outlined">verified_user</span>
                            <div>
                                <strong>Redaction Successfully Burned!</strong>
                                <p id="redactResultDetails">Underlying text strings and vectors have been purged.</p>
                            </div>
                        </div>
                        <div class="result-actions">
                            <button type="button" class="btn btn-primary btn-lg" id="btnDownloadRedacted">
                                <span class="material-symbols-outlined">download</span> Download Redacted PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        initEvents();
    }

    function initEvents() {
        const fileInput = document.getElementById('redactFileInput');
        const uploadArea = document.getElementById('redactUploadArea');

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
                    loadPdf(e.dataTransfer.files[0]);
                }
            });
            fileInput.addEventListener('change', function() {
                if (this.files && this.files[0]) {
                    loadPdf(this.files[0]);
                }
            });
        }

        const undoBtn = document.getElementById('btnUndoRedact');
        if (undoBtn) {
            undoBtn.onclick = () => {
                redactionBoxes.pop();
                redrawBoxes();
            };
        }

        const clearBtn = document.getElementById('btnClearRedact');
        if (clearBtn) {
            clearBtn.onclick = () => {
                redactionBoxes = [];
                redrawBoxes();
            };
        }

        const burnBtn = document.getElementById('btnBurnRedaction');
        if (burnBtn) burnBtn.addEventListener('click', executeBurnRedaction);

        const resetBtn = document.getElementById('btnRedactReset');
        if (resetBtn) resetBtn.addEventListener('click', render);
    }

    async function loadPdf(file) {
        if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
            if (typeof showToast === 'function') showToast('error', 'Please upload a valid PDF document.');
            return;
        }

        currentFile = file;
        const uploadArea = document.getElementById('redactUploadArea');
        const workspace = document.getElementById('redactWorkspace');
        const fileNameEl = document.getElementById('redactFileName');

        if (uploadArea) uploadArea.style.display = 'none';
        if (workspace) workspace.style.display = 'block';
        if (fileNameEl) {
            fileNameEl.textContent = 'Document: ' + file.name + ' (' + FileHelpers.formatFileSize(file.size) + ')';
        }

        try {
            const buffer = await file.arrayBuffer();
            pdfDoc = await pdfjsLib.getDocument({ data: buffer }).promise;
            totalPages = pdfDoc.numPages;
            currentPage = 1;
            redactionBoxes = [];

            updatePageControls();
            await renderCurrentPage();
            initDrawingLayer();
        } catch (err) {
            console.error('Failed to load PDF for redaction:', err);
            if (typeof showToast === 'function') showToast('error', 'Failed to load PDF: ' + err.message);
        }
    }

    async function renderCurrentPage() {
        if (!pdfDoc) return;
        const page = await pdfDoc.getPage(currentPage);
        const baseCanvas = document.getElementById('redactBaseCanvas');
        const drawCanvas = document.getElementById('redactDrawCanvas');
        if (!baseCanvas || !drawCanvas) return;

        const baseViewport = page.getViewport({ scale: 1.0 });
        const scale = Math.min(800 / baseViewport.width, 1.5);
        renderedViewport = page.getViewport({ scale: scale });

        baseCanvas.width = renderedViewport.width;
        baseCanvas.height = renderedViewport.height;

        drawCanvas.width = renderedViewport.width;
        drawCanvas.height = renderedViewport.height;

        const ctx = baseCanvas.getContext('2d');
        await page.render({
            canvasContext: ctx,
            viewport: renderedViewport
        }).promise;

        redrawBoxes();
    }

    function initDrawingLayer() {
        const drawCanvas = document.getElementById('redactDrawCanvas');
        if (!drawCanvas) return;

        function getPos(e) {
            const rect = drawCanvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: (clientX - rect.left) * (drawCanvas.width / rect.width),
                y: (clientY - rect.top) * (drawCanvas.height / rect.height)
            };
        }

        drawCanvas.onmousedown = (e) => {
            e.preventDefault();
            const p = getPos(e);
            isDrawingBox = true;
            boxStartX = p.x;
            boxStartY = p.y;
        };

        drawCanvas.onmousemove = (e) => {
            if (!isDrawingBox) return;
            const p = getPos(e);
            redrawBoxes();

            const ctx = drawCanvas.getContext('2d');
            const bx = Math.min(boxStartX, p.x);
            const by = Math.min(boxStartY, p.y);
            const bw = Math.abs(p.x - boxStartX);
            const bh = Math.abs(p.y - boxStartY);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(bx, by, bw, bh);
            ctx.strokeStyle = 'var(--dp-color-accent, #c90000)';
            ctx.lineWidth = 2;
            ctx.strokeRect(bx, by, bw, bh);
        };

        const finishBox = (e) => {
            if (!isDrawingBox) return;
            isDrawingBox = false;
            const p = getPos(e);

            const bx = Math.min(boxStartX, p.x);
            const by = Math.min(boxStartY, p.y);
            const bw = Math.abs(p.x - boxStartX);
            const bh = Math.abs(p.y - boxStartY);

            if (bw > 4 && bh > 4) {
                redactionBoxes.push({ x: bx, y: by, width: bw, height: bh });
            }
            redrawBoxes();
        };

        drawCanvas.onmouseup = finishBox;
        drawCanvas.onmouseleave = finishBox;
    }

    function redrawBoxes() {
        const drawCanvas = document.getElementById('redactDrawCanvas');
        const badge = document.getElementById('redactCountBadge');
        if (!drawCanvas) return;

        const ctx = drawCanvas.getContext('2d');
        ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

        ctx.fillStyle = '#000000';
        for (const box of redactionBoxes) {
            ctx.fillRect(box.x, box.y, box.width, box.height);
        }

        if (badge) {
            badge.textContent = redactionBoxes.length + ' Blackouts';
        }
    }

    function updatePageControls() {
        const ind = document.getElementById('redactPageIndicator');
        const prev = document.getElementById('redactPrevPageBtn');
        const next = document.getElementById('redactNextPageBtn');

        if (ind) ind.textContent = 'Page ' + currentPage + ' / ' + totalPages;
        if (prev) {
            prev.disabled = currentPage <= 1;
            prev.onclick = async () => {
                if (currentPage > 1) {
                    currentPage--;
                    updatePageControls();
                    await renderCurrentPage();
                }
            };
        }
        if (next) {
            next.disabled = currentPage >= totalPages;
            next.onclick = async () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    updatePageControls();
                    await renderCurrentPage();
                }
            };
        }
    }

    async function executeBurnRedaction() {
        if (!currentFile || redactionBoxes.length === 0) {
            if (typeof showToast === 'function') showToast('info', 'Please draw at least one redaction box first.');
            return;
        }

        const baseCanvas = document.getElementById('redactBaseCanvas');
        const progress = document.getElementById('redactProgress');
        const progressBar = document.getElementById('redactProgressBar');
        const burnBtn = document.getElementById('btnBurnRedaction');

        if (!baseCanvas) return;
        if (progress) progress.style.display = 'block';
        if (progressBar) progressBar.style.width = '35%';
        if (burnBtn) burnBtn.disabled = true;

        try {
            // Normalized box coordinates
            const normalizedBoxes = redactionBoxes.map(b => ({
                xRatio: b.x / baseCanvas.width,
                yRatio: b.y / baseCanvas.height,
                widthRatio: b.width / baseCanvas.width,
                heightRatio: b.height / baseCanvas.height
            }));

            const buffer = await currentFile.arrayBuffer();
            if (progressBar) progressBar.style.width = '70%';

            const redactedBytes = await RedactEngine.redactPage(buffer, currentPage, normalizedBoxes);
            if (progressBar) progressBar.style.width = '100%';

            const blob = new Blob([redactedBytes], { type: 'application/pdf' });
            const outName = currentFile.name.replace(/\.[^/.]+$/, '') + '-redacted.pdf';

            const resultSection = document.getElementById('redactResultSection');
            const downloadBtn = document.getElementById('btnDownloadRedacted');
            const detailsEl = document.getElementById('redactResultDetails');

            if (detailsEl) {
                detailsEl.textContent = 'Applied ' + redactionBoxes.length + ' irreversible redactions on Page ' + currentPage + ' (' + FileHelpers.formatFileSize(blob.size) + ').';
            }
            if (resultSection) resultSection.style.display = 'block';

            if (downloadBtn) {
                downloadBtn.onclick = () => saveAs(blob, outName);
            }

            saveAs(blob, outName);
            if (typeof incrementFileCount === 'function') incrementFileCount();
            if (typeof showToast === 'function') showToast('success', 'PDF redactions permanently burned!');

        } catch (err) {
            console.error('Redaction burn failed:', err);
            if (typeof showToast === 'function') showToast('error', 'Redaction error: ' + err.message);
        } finally {
            if (burnBtn) burnBtn.disabled = false;
            setTimeout(() => {
                if (progress) progress.style.display = 'none';
            }, 500);
        }
    }

    return {
        render: render
    };
})();
