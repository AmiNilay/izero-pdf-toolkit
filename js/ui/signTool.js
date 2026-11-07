/**
 * Sign PDF - UI Controller
 * Interactive Signature Creation, Positioning, and Stamping
 * Swiss Minimalist Design System Compliant
 */

const SignToolController = (function() {
    'use strict';

    let currentFile = null;
    let pdfDoc = null;
    let currentPage = 1;
    let totalPages = 1;
    let renderedViewport = null;

    let signatureImage = null; // Data URL of the signature
    let sigBox = {
        active: false,
        x: 50, // pixels relative to page canvas display
        y: 50,
        width: 160,
        height: 60
    };

    let isDrawing = false;
    let drawPoints = [];
    let isDraggingBox = false;
    let isResizingBox = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let initialBox = null;

    function render() {
        const container = document.getElementById('toolContent');
        if (!container) return;

        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-header">
                    <h2>✍️ Sign PDF</h2>
                    <p>Create your signature and place it anywhere on your PDF document</p>
                </div>

                <div class="upload-area" id="signUploadArea">
                    <input type="file" id="signFileInput" accept=".pdf,application/pdf">
                    <div class="upload-icon material-symbols-outlined">draw</div>
                    <div class="upload-text">Drop your PDF here or click to browse</div>
                    <div class="upload-hint">Upload a PDF document to sign</div>
                </div>

                <div id="signWorkspace" style="display: none;">
                    <div class="file-info" id="signFileInfo">
                        <span id="signFileName"></span>
                    </div>

                    <!-- Step 1: Signature Creation -->
                    <div class="settings-group" style="flex-direction: column; align-items: stretch;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--dp-color-ink); padding-bottom: 12px; margin-bottom: 16px;">
                            <strong style="text-transform: uppercase; letter-spacing: 0.08em; font-size: 14px;">1. Create Signature</strong>
                            <div style="display: flex; gap: 8px;">
                                <button type="button" class="btn btn-sm btn-primary" id="sigTabDraw">Draw</button>
                                <button type="button" class="btn btn-sm btn-secondary" id="sigTabType">Type</button>
                                <button type="button" class="btn btn-sm btn-secondary" id="sigTabUpload">Upload Image</button>
                            </div>
                        </div>

                        <!-- Panel: Draw -->
                        <div id="sigPanelDraw" style="display: flex; flex-direction: column; gap: 12px;">
                            <canvas id="sigPadCanvas" width="500" height="150" style="background: #ffffff; border: 2px solid var(--dp-color-ink); cursor: crosshair; touch-action: none; width: 100%; max-width: 500px; height: 150px; display: block;"></canvas>
                            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                <button type="button" class="btn btn-sm btn-secondary" id="sigClearBtn">
                                    <span class="material-symbols-outlined">refresh</span> Clear
                                </button>
                                <button type="button" class="btn btn-sm btn-primary" id="sigUseDrawnBtn">
                                    <span class="material-symbols-outlined">check</span> Use This Signature
                                </button>
                            </div>
                        </div>

                        <!-- Panel: Type -->
                        <div id="sigPanelType" style="display: none; flex-direction: column; gap: 12px;">
                            <input type="text" id="sigTextInput" class="text-input" placeholder="Type your full name..." style="max-width: 400px;">
                            <canvas id="sigTypeCanvas" width="500" height="120" style="background: #ffffff; border: 2px solid var(--dp-color-ink); width: 100%; max-width: 500px; height: 120px; display: block;"></canvas>
                            <div>
                                <button type="button" class="btn btn-sm btn-primary" id="sigUseTypedBtn">
                                    <span class="material-symbols-outlined">check</span> Use This Signature
                                </button>
                            </div>
                        </div>

                        <!-- Panel: Upload -->
                        <div id="sigPanelUpload" style="display: none; flex-direction: column; gap: 12px;">
                            <input type="file" id="sigImageUploadInput" accept="image/png,image/jpeg,image/webp">
                            <div id="sigUploadPreviewContainer" style="display: none;">
                                <img id="sigUploadedImg" style="max-width: 250px; max-height: 100px; border: 2px solid var(--dp-color-ink); background: #ffffff; padding: 4px; display: block;">
                            </div>
                            <div>
                                <button type="button" class="btn btn-sm btn-primary" id="sigUseUploadedBtn" disabled>
                                    <span class="material-symbols-outlined">check</span> Use This Signature
                                </button>
                            </div>
                        </div>

                        <div id="sigConfirmedNotice" style="display: none; margin-top: 10px; padding: 10px 14px; background: var(--dp-color-surface); border: 2px solid var(--dp-color-accent); font-weight: 700; font-size: 13px; text-transform: uppercase;">
                            <span class="material-symbols-outlined" style="vertical-align: middle; color: var(--dp-color-accent); margin-right: 6px;">verified</span>
                            Signature selected! Now place it on the document below.
                        </div>
                    </div>

                    <!-- Step 2: Placement on Document -->
                    <div class="settings-group" style="flex-direction: column; align-items: stretch;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--dp-color-ink); padding-bottom: 12px; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
                            <strong style="text-transform: uppercase; letter-spacing: 0.08em; font-size: 14px;">2. Position on Document</strong>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <button type="button" class="btn btn-sm btn-secondary" id="sigPrevPageBtn">
                                    <span class="material-symbols-outlined">arrow_back</span>
                                </button>
                                <span id="sigPageIndicator" style="font-family: monospace; font-size: 13px; font-weight: 700;">Page 1 / 1</span>
                                <button type="button" class="btn btn-sm btn-secondary" id="sigNextPageBtn">
                                    <span class="material-symbols-outlined">arrow_forward</span>
                                </button>
                            </div>
                        </div>

                        <!-- PDF Page Viewport with Overlay Container -->
                        <div style="overflow: auto; max-height: 70vh; background: var(--dp-color-surface); border: 2px solid var(--dp-color-ink); padding: 20px; display: flex; justify-content: center;">
                            <div id="pdfViewportWrapper" style="position: relative; display: inline-block; background: #ffffff; box-shadow: 0 4px 16px rgba(0,0,0,0.15);">
                                <canvas id="pdfRenderCanvas" style="display: block;"></canvas>
                                
                                <!-- Draggable & Resizable Signature Overlay Box -->
                                <div id="sigOverlayBox" style="display: none; position: absolute; border: 2px dashed var(--dp-color-accent); background: rgba(201, 0, 0, 0.08); cursor: move; user-select: none;">
                                    <img id="sigOverlayImg" style="width: 100%; height: 100%; object-fit: contain; pointer-events: none; display: block;">
                                    <div id="sigResizeHandle" style="position: absolute; width: 14px; height: 14px; right: -7px; bottom: -7px; background: var(--dp-color-accent); cursor: se-resize; border: 1px solid #ffffff;"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Step 3: Finish & Download -->
                    <div style="margin-top: 24px; display: flex; gap: 16px; flex-wrap: wrap;">
                        <button type="button" class="btn btn-primary btn-lg" id="stampAndDownloadBtn" disabled>
                            <span class="material-symbols-outlined">verified</span> Stamp & Download Signed PDF
                        </button>
                        <button type="button" class="btn btn-secondary btn-lg" id="sigResetBtn">
                            <span class="material-symbols-outlined">refresh</span> Reset
                        </button>
                    </div>

                    <div class="progress-container" id="sigProgress">
                        <div class="progress-bar" id="sigProgressBar"></div>
                        <div class="progress-text" id="sigProgressText">Stamping signature...</div>
                    </div>

                    <div id="sigResultSection" class="result-section" style="display: none;">
                        <div class="result-card success">
                            <span class="material-symbols-outlined">check_circle</span>
                            <div>
                                <strong>Document Successfully Signed!</strong>
                                <p id="sigResultDetails">Signature embedded onto page.</p>
                            </div>
                        </div>
                        <div class="result-actions">
                            <button type="button" class="btn btn-primary btn-lg" id="downloadSignedPdfBtn">
                                <span class="material-symbols-outlined">download</span> Download Signed PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        initEvents();
    }

    function initEvents() {
        const fileInput = document.getElementById('signFileInput');
        const uploadArea = document.getElementById('signUploadArea');

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

        initDrawingPad();
        initTypePad();
        initUploadPad();
        initOverlayInteraction();

        // Stamping
        const stampBtn = document.getElementById('stampAndDownloadBtn');
        if (stampBtn) {
            stampBtn.addEventListener('click', stampAndDownload);
        }

        const resetBtn = document.getElementById('sigResetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', render);
        }
    }

    // ==========================================
    // PDF Loading & Rendering
    // ==========================================
    async function loadPdf(file) {
        if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
            if (typeof showToast === 'function') showToast('error', 'Please upload a valid PDF file.');
            return;
        }

        currentFile = file;
        const uploadArea = document.getElementById('signUploadArea');
        const workspace = document.getElementById('signWorkspace');
        const fileNameEl = document.getElementById('signFileName');

        if (uploadArea) uploadArea.style.display = 'none';
        if (workspace) workspace.style.display = 'block';
        if (fileNameEl) {
            fileNameEl.textContent = 'Document: ' + file.name + ' (' + FileHelpers.formatFileSize(file.size) + ')';
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            pdfDoc = await loadingTask.promise;
            totalPages = pdfDoc.numPages;
            currentPage = 1;

            updatePageControls();
            await renderCurrentPage();
        } catch (err) {
            console.error('Failed to load PDF for signing:', err);
            if (typeof showToast === 'function') showToast('error', 'Error reading PDF: ' + err.message);
        }
    }

    async function renderCurrentPage() {
        if (!pdfDoc) return;
        const page = await pdfDoc.getPage(currentPage);
        const canvas = document.getElementById('pdfRenderCanvas');
        if (!canvas) return;

        // Target rendering width ~750px for clean sharpness
        const baseViewport = page.getViewport({ scale: 1.0 });
        const scale = Math.min(750 / baseViewport.width, 1.5);
        renderedViewport = page.getViewport({ scale: scale });

        canvas.width = renderedViewport.width;
        canvas.height = renderedViewport.height;

        const ctx = canvas.getContext('2d');
        const renderContext = {
            canvasContext: ctx,
            viewport: renderedViewport
        };

        await page.render(renderContext).promise;
        updateOverlayBoxDisplay();
    }

    function updatePageControls() {
        const ind = document.getElementById('sigPageIndicator');
        const prev = document.getElementById('sigPrevPageBtn');
        const next = document.getElementById('sigNextPageBtn');

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

    // ==========================================
    // Signature Pad Modes (Draw / Type / Upload)
    // ==========================================
    function initDrawingPad() {
        const tabDraw = document.getElementById('sigTabDraw');
        const tabType = document.getElementById('sigTabType');
        const tabUpload = document.getElementById('sigTabUpload');

        const pDraw = document.getElementById('sigPanelDraw');
        const pType = document.getElementById('sigPanelType');
        const pUpload = document.getElementById('sigPanelUpload');

        if (tabDraw) {
            tabDraw.onclick = () => {
                tabDraw.className = 'btn btn-sm btn-primary';
                tabType.className = 'btn btn-sm btn-secondary';
                tabUpload.className = 'btn btn-sm btn-secondary';
                pDraw.style.display = 'flex';
                pType.style.display = 'none';
                pUpload.style.display = 'none';
            };
        }
        if (tabType) {
            tabType.onclick = () => {
                tabDraw.className = 'btn btn-sm btn-secondary';
                tabType.className = 'btn btn-sm btn-primary';
                tabUpload.className = 'btn btn-sm btn-secondary';
                pDraw.style.display = 'none';
                pType.style.display = 'flex';
                pUpload.style.display = 'none';
            };
        }
        if (tabUpload) {
            tabUpload.onclick = () => {
                tabDraw.className = 'btn btn-sm btn-secondary';
                tabType.className = 'btn btn-sm btn-secondary';
                tabUpload.className = 'btn btn-sm btn-primary';
                pDraw.style.display = 'none';
                pType.style.display = 'none';
                pUpload.style.display = 'flex';
            };
        }

        const canvas = document.getElementById('sigPadCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: (clientX - rect.left) * (canvas.width / rect.width),
                y: (clientY - rect.top) * (canvas.height / rect.height)
            };
        }

        function start(e) {
            e.preventDefault();
            isDrawing = true;
            const p = getPos(e);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            drawPoints.push(p);
        }

        function move(e) {
            if (!isDrawing) return;
            e.preventDefault();
            const p = getPos(e);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            drawPoints.push(p);
        }

        function end() {
            isDrawing = false;
        }

        canvas.addEventListener('mousedown', start);
        canvas.addEventListener('mousemove', move);
        window.addEventListener('mouseup', end);

        canvas.addEventListener('touchstart', start, { passive: false });
        canvas.addEventListener('touchmove', move, { passive: false });
        window.addEventListener('touchend', end);

        const clearBtn = document.getElementById('sigClearBtn');
        if (clearBtn) {
            clearBtn.onclick = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawPoints = [];
            };
        }

        const useDrawnBtn = document.getElementById('sigUseDrawnBtn');
        if (useDrawnBtn) {
            useDrawnBtn.onclick = () => {
                if (drawPoints.length === 0) {
                    if (typeof showToast === 'function') showToast('info', 'Please draw a signature first.');
                    return;
                }
                const dataUrl = canvas.toDataURL('image/png');
                setSignature(dataUrl);
            };
        }
    }

    function initTypePad() {
        const input = document.getElementById('sigTextInput');
        const canvas = document.getElementById('sigTypeCanvas');
        const useBtn = document.getElementById('sigUseTypedBtn');
        if (!input || !canvas) return;

        const ctx = canvas.getContext('2d');

        function updateTypeCanvas() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const text = input.value.trim();
            if (!text) return;

            ctx.font = 'italic bold 44px "Brush Script MT", "Caveat", "Segoe Script", cursive, sans-serif';
            ctx.fillStyle = '#000000';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 24, canvas.height / 2);
        }

        input.addEventListener('input', updateTypeCanvas);

        if (useBtn) {
            useBtn.onclick = () => {
                if (!input.value.trim()) {
                    if (typeof showToast === 'function') showToast('info', 'Please type a name.');
                    return;
                }
                setSignature(canvas.toDataURL('image/png'));
            };
        }
    }

    function initUploadPad() {
        const fileInput = document.getElementById('sigImageUploadInput');
        const previewImg = document.getElementById('sigUploadedImg');
        const container = document.getElementById('sigUploadPreviewContainer');
        const useBtn = document.getElementById('sigUseUploadedBtn');

        if (!fileInput) return;

        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImg.src = e.target.result;
                    container.style.display = 'block';
                    useBtn.disabled = false;
                };
                reader.readAsDataURL(this.files[0]);
            }
        });

        if (useBtn) {
            useBtn.onclick = () => {
                if (previewImg.src) {
                    setSignature(previewImg.src);
                }
            };
        }
    }

    function setSignature(dataUrl) {
        signatureImage = dataUrl;
        sigBox.active = true;

        const notice = document.getElementById('sigConfirmedNotice');
        const overlayImg = document.getElementById('sigOverlayImg');
        const stampBtn = document.getElementById('stampAndDownloadBtn');

        if (notice) notice.style.display = 'block';
        if (overlayImg) overlayImg.src = dataUrl;
        if (stampBtn) stampBtn.disabled = false;

        updateOverlayBoxDisplay();

        if (typeof showToast === 'function') {
            showToast('success', 'Signature ready! Drag and position it on the document.');
        }
    }

    // ==========================================
    // Interactive Overlay Box Interaction
    // ==========================================
    function initOverlayInteraction() {
        const box = document.getElementById('sigOverlayBox');
        const handle = document.getElementById('sigResizeHandle');
        const wrapper = document.getElementById('pdfViewportWrapper');

        if (!box || !handle || !wrapper) return;

        // Dragging Box
        box.addEventListener('mousedown', (e) => {
            if (e.target === handle) return; // Resize handles separately
            e.preventDefault();
            isDraggingBox = true;
            dragStartX = e.clientX - sigBox.x;
            dragStartY = e.clientY - sigBox.y;
        });

        // Resizing Box
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isResizingBox = true;
            initialBox = {
                startX: e.clientX,
                startY: e.clientY,
                width: sigBox.width,
                height: sigBox.height
            };
        });

        window.addEventListener('mousemove', (e) => {
            if (isDraggingBox) {
                const canvas = document.getElementById('pdfRenderCanvas');
                if (!canvas) return;

                let newX = e.clientX - dragStartX;
                let newY = e.clientY - dragStartY;

                newX = Math.max(0, Math.min(newX, canvas.width - sigBox.width));
                newY = Math.max(0, Math.min(newY, canvas.height - sigBox.height));

                sigBox.x = newX;
                sigBox.y = newY;
                updateOverlayBoxDisplay();
            } else if (isResizingBox && initialBox) {
                const deltaX = e.clientX - initialBox.startX;
                const newWidth = Math.max(60, initialBox.width + deltaX);
                // Keep aspect ratio
                const aspectRatio = initialBox.height / initialBox.width;
                const newHeight = Math.max(25, newWidth * aspectRatio);

                sigBox.width = newWidth;
                sigBox.height = newHeight;
                updateOverlayBoxDisplay();
            }
        });

        window.addEventListener('mouseup', () => {
            isDraggingBox = false;
            isResizingBox = false;
            initialBox = null;
        });
    }

    function updateOverlayBoxDisplay() {
        const box = document.getElementById('sigOverlayBox');
        if (!box) return;

        if (!sigBox.active) {
            box.style.display = 'none';
            return;
        }

        box.style.display = 'block';
        box.style.left = sigBox.x + 'px';
        box.style.top = sigBox.y + 'px';
        box.style.width = sigBox.width + 'px';
        box.style.height = sigBox.height + 'px';
    }

    // ==========================================
    // Stamping & Downloading
    // ==========================================
    async function stampAndDownload() {
        if (!currentFile || !signatureImage) return;

        const canvas = document.getElementById('pdfRenderCanvas');
        if (!canvas) return;

        const progress = document.getElementById('sigProgress');
        const progressBar = document.getElementById('sigProgressBar');
        const stampBtn = document.getElementById('stampAndDownloadBtn');

        if (progress) progress.style.display = 'block';
        if (progressBar) progressBar.style.width = '40%';
        if (stampBtn) stampBtn.disabled = true;

        try {
            // Normalized coordinates (0 to 1) relative to rendered canvas
            const xRatio = sigBox.x / canvas.width;
            const yRatio = sigBox.y / canvas.height;
            const widthRatio = sigBox.width / canvas.width;
            const heightRatio = sigBox.height / canvas.height;

            const arrayBuffer = await currentFile.arrayBuffer();

            if (progressBar) progressBar.style.width = '75%';

            const signedPdfBytes = await SignEngine.signPdf(arrayBuffer, signatureImage, {
                pageNumber: currentPage,
                xRatio: xRatio,
                yRatio: yRatio,
                widthRatio: widthRatio,
                heightRatio: heightRatio
            });

            if (progressBar) progressBar.style.width = '100%';

            // Setup download
            const blob = new Blob([signedPdfBytes], { type: 'application/pdf' });
            const outName = currentFile.name.replace(/\.[^/.]+$/, '') + '-signed.pdf';

            const resultSection = document.getElementById('sigResultSection');
            const downloadBtn = document.getElementById('downloadSignedPdfBtn');
            const detailsEl = document.getElementById('sigResultDetails');

            if (detailsEl) {
                detailsEl.textContent = 'Signature permanently stamped onto Page ' + currentPage + ' (' + FileHelpers.formatFileSize(blob.size) + ').';
            }
            if (resultSection) resultSection.style.display = 'block';

            if (downloadBtn) {
                downloadBtn.onclick = () => {
                    saveAs(blob, outName);
                };
            }

            // Trigger immediate download
            saveAs(blob, outName);

            if (typeof incrementFileCount === 'function') incrementFileCount();
            if (typeof showToast === 'function') showToast('success', 'Document signed and downloaded!');

        } catch (err) {
            console.error('Failed to stamp signature:', err);
            if (typeof showToast === 'function') showToast('error', 'Signing failed: ' + err.message);
        } finally {
            if (stampBtn) stampBtn.disabled = false;
            setTimeout(() => {
                if (progress) progress.style.display = 'none';
            }, 500);
        }
    }

    return {
        render: render
    };
})();
