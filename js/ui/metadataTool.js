/**
 * Metadata Scrubber - UI Controller
 * Inspects and scrubs tracking tags, author identities, and EXIF/GPS metadata
 * Swiss Minimalist Design System Compliant
 */

const MetadataToolController = (function() {
    'use strict';

    let currentFile = null;
    let isPdf = false;
    let originalMetadata = null;
    let cleanedBlob = null;

    function render() {
        const container = document.getElementById('toolContent');
        if (!container) return;

        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-header">
                    <h2>🕵️ Privacy Metadata Scrubber</h2>
                    <p>Inspect and remove hidden tracking metadata, author names, GPS tags, and device info</p>
                </div>

                <div class="upload-area" id="metaUploadArea">
                    <input type="file" id="metaFileInput" accept=".pdf,image/png,image/jpeg,image/webp">
                    <div class="upload-icon material-symbols-outlined">shield_person</div>
                    <div class="upload-text">Drop a PDF or Image here or click to browse</div>
                    <div class="upload-hint">Sanitize PDF metadata or strip EXIF/GPS tags from photos</div>
                </div>

                <div id="metaWorkspace" style="display: none;">
                    <div class="file-info" id="metaFileInfo">
                        <span id="metaFileName"></span>
                    </div>

                    <!-- PDF Inspection & Scrub Section -->
                    <div id="pdfMetaSection" style="display: none;">
                        <div class="settings-group" style="flex-direction: column; align-items: stretch;">
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--dp-color-ink); padding-bottom: 12px; margin-bottom: 16px;">
                                <strong style="text-transform: uppercase; letter-spacing: 0.08em; font-size: 14px;">Detected Metadata Fields</strong>
                                <span style="font-size: 11px; font-weight: 700; background: var(--dp-color-accent); color: #ffffff; padding: 2px 8px; text-transform: uppercase;">Tracking Risk</span>
                            </div>

                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;" id="metaFieldGrid">
                                <div>
                                    <label class="setting-label">Title</label>
                                    <input type="text" id="metaInputTitle" class="text-input" placeholder="(Empty)">
                                </div>
                                <div>
                                    <label class="setting-label">Author / Creator Name</label>
                                    <input type="text" id="metaInputAuthor" class="text-input" placeholder="(Empty)">
                                </div>
                                <div>
                                    <label class="setting-label">Subject</label>
                                    <input type="text" id="metaInputSubject" class="text-input" placeholder="(Empty)">
                                </div>
                                <div>
                                    <label class="setting-label">Keywords</label>
                                    <input type="text" id="metaInputKeywords" class="text-input" placeholder="(Empty)">
                                </div>
                                <div>
                                    <label class="setting-label">Creator Application</label>
                                    <input type="text" id="metaInputCreator" class="text-input" placeholder="(Empty)">
                                </div>
                                <div>
                                    <label class="setting-label">PDF Producer Library</label>
                                    <input type="text" id="metaInputProducer" class="text-input" placeholder="(Empty)">
                                </div>
                            </div>

                            <div style="margin-top: 16px; padding: 12px; background: var(--dp-color-ground); border: 1px solid var(--dp-color-ink); font-family: monospace; font-size: 12px;">
                                <div id="metaCreationDate">Creation Date: —</div>
                                <div id="metaModDate" style="margin-top: 4px;">Modification Date: —</div>
                            </div>
                        </div>

                        <div style="margin-top: 24px; display: flex; gap: 14px; flex-wrap: wrap;">
                            <button type="button" class="btn btn-danger btn-lg" id="btnScrubAll">
                                <span class="material-symbols-outlined">delete_sweep</span> Scrub All Metadata (1-Click Wipe)
                            </button>
                            <button type="button" class="btn btn-primary btn-lg" id="btnApplyCustomMeta">
                                <span class="material-symbols-outlined">save</span> Apply Custom Fields & Export
                            </button>
                            <button type="button" class="btn btn-secondary btn-lg" id="btnMetaReset">
                                <span class="material-symbols-outlined">refresh</span> Reset
                            </button>
                        </div>
                    </div>

                    <!-- Image EXIF Inspection & Scrub Section -->
                    <div id="imageMetaSection" style="display: none;">
                        <div class="settings-group" style="flex-direction: column; align-items: stretch;">
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--dp-color-ink); padding-bottom: 12px; margin-bottom: 16px;">
                                <strong style="text-transform: uppercase; letter-spacing: 0.08em; font-size: 14px;">Image EXIF & GPS Tracking Purge</strong>
                                <span style="font-size: 11px; font-weight: 700; background: var(--dp-color-accent); color: #ffffff; padding: 2px 8px; text-transform: uppercase;">Privacy Protection</span>
                            </div>

                            <p style="font-size: 14px; line-height: 1.5; margin-bottom: 16px;">
                                Photos taken with smartphones and digital cameras frequently embed sensitive metadata: exact GPS coordinates of your home/location, camera model, lens serial number, and timestamp.
                            </p>

                            <div style="text-align: center; margin-bottom: 16px;">
                                <img id="imagePreviewEl" style="max-width: 100%; max-height: 350px; border: 2px solid var(--dp-color-ink); background: #ffffff; display: inline-block;">
                            </div>

                            <div class="cache-privacy-note" style="border-left: 6px solid var(--dp-color-accent);">
                                <span class="material-symbols-outlined">verified</span>
                                <div>
                                    <strong>100% Client-Side Purge:</strong> Re-encodes the pixel matrix onto a fresh canvas buffer, permanently stripping all EXIF headers, GPS tags, device signatures, and thumbnail caches.
                                </div>
                            </div>
                        </div>

                        <div style="margin-top: 24px; display: flex; gap: 14px; flex-wrap: wrap;">
                            <button type="button" class="btn btn-danger btn-lg" id="btnScrubImageExif">
                                <span class="material-symbols-outlined">cleaning_services</span> Purge EXIF & GPS Tags
                            </button>
                            <button type="button" class="btn btn-secondary btn-lg" id="btnImageReset">
                                <span class="material-symbols-outlined">refresh</span> Reset
                            </button>
                        </div>
                    </div>

                    <!-- Progress and Download -->
                    <div class="progress-container" id="metaProgress">
                        <div class="progress-bar" id="metaProgressBar"></div>
                        <div class="progress-text" id="metaProgressText">Scrubbing metadata...</div>
                    </div>

                    <div id="metaResultSection" class="result-section" style="display: none;">
                        <div class="result-card success">
                            <span class="material-symbols-outlined">verified_user</span>
                            <div>
                                <strong>Metadata Successfully Scrubbed!</strong>
                                <p id="metaResultDetails">All identifiable tracking tags and timestamps have been purged.</p>
                            </div>
                        </div>
                        <div class="result-actions">
                            <button type="button" class="btn btn-primary btn-lg" id="btnDownloadScrubbed">
                                <span class="material-symbols-outlined">download</span> Download Sanitized File
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        initEvents();
    }

    function initEvents() {
        const fileInput = document.getElementById('metaFileInput');
        const uploadArea = document.getElementById('metaUploadArea');

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

        // PDF Actions
        const btnScrubAll = document.getElementById('btnScrubAll');
        if (btnScrubAll) btnScrubAll.addEventListener('click', () => executePdfScrub(null));

        const btnApplyCustom = document.getElementById('btnApplyCustomMeta');
        if (btnApplyCustom) {
            btnApplyCustom.addEventListener('click', () => {
                const custom = {
                    title: document.getElementById('metaInputTitle').value.trim(),
                    author: document.getElementById('metaInputAuthor').value.trim(),
                    subject: document.getElementById('metaInputSubject').value.trim(),
                    keywords: document.getElementById('metaInputKeywords').value.trim(),
                    creator: document.getElementById('metaInputCreator').value.trim(),
                    producer: document.getElementById('metaInputProducer').value.trim()
                };
                executePdfScrub(custom);
            });
        }

        const btnReset = document.getElementById('btnMetaReset');
        if (btnReset) btnReset.addEventListener('click', render);

        // Image Actions
        const btnScrubImage = document.getElementById('btnScrubImageExif');
        if (btnScrubImage) btnScrubImage.addEventListener('click', executeImageScrub);

        const btnImgReset = document.getElementById('btnImageReset');
        if (btnImgReset) btnImgReset.addEventListener('click', render);
    }

    async function loadFile(file) {
        if (!file) return;
        currentFile = file;

        const uploadArea = document.getElementById('metaUploadArea');
        const workspace = document.getElementById('metaWorkspace');
        const fileNameEl = document.getElementById('metaFileName');

        if (uploadArea) uploadArea.style.display = 'none';
        if (workspace) workspace.style.display = 'block';
        if (fileNameEl) {
            fileNameEl.textContent = 'Inspecting: ' + file.name + ' (' + FileHelpers.formatFileSize(file.size) + ')';
        }

        isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

        const pdfSection = document.getElementById('pdfMetaSection');
        const imgSection = document.getElementById('imageMetaSection');

        if (isPdf) {
            if (pdfSection) pdfSection.style.display = 'block';
            if (imgSection) imgSection.style.display = 'none';
            await inspectPdf(file);
        } else {
            if (pdfSection) pdfSection.style.display = 'none';
            if (imgSection) imgSection.style.display = 'block';
            inspectImage(file);
        }
    }

    async function inspectPdf(file) {
        try {
            const buffer = await file.arrayBuffer();
            originalMetadata = await MetadataEngine.readPdfMetadata(buffer);

            document.getElementById('metaInputTitle').value = originalMetadata.title;
            document.getElementById('metaInputAuthor').value = originalMetadata.author;
            document.getElementById('metaInputSubject').value = originalMetadata.subject;
            document.getElementById('metaInputKeywords').value = Array.isArray(originalMetadata.keywords) 
                ? originalMetadata.keywords.join(', ') 
                : originalMetadata.keywords;
            document.getElementById('metaInputCreator').value = originalMetadata.creator;
            document.getElementById('metaInputProducer').value = originalMetadata.producer;

            const creationEl = document.getElementById('metaCreationDate');
            const modEl = document.getElementById('metaModDate');

            if (creationEl) creationEl.textContent = 'Embedded Creation Date: ' + (originalMetadata.creationDate || 'Not specified');
            if (modEl) modEl.textContent = 'Embedded Modification Date: ' + (originalMetadata.modificationDate || 'Not specified');

        } catch (err) {
            console.error('Failed to read PDF metadata:', err);
            if (typeof showToast === 'function') showToast('error', 'Error inspecting PDF: ' + err.message);
        }
    }

    function inspectImage(file) {
        const previewEl = document.getElementById('imagePreviewEl');
        if (previewEl) {
            previewEl.src = URL.createObjectURL(file);
        }
    }

    async function executePdfScrub(customMetadata = null) {
        if (!currentFile) return;

        const progress = document.getElementById('metaProgress');
        const progressBar = document.getElementById('metaProgressBar');

        if (progress) progress.style.display = 'block';
        if (progressBar) progressBar.style.width = '45%';

        try {
            const buffer = await currentFile.arrayBuffer();
            if (progressBar) progressBar.style.width = '80%';

            const scrubbedBytes = await MetadataEngine.scrubPdfMetadata(buffer, customMetadata);
            if (progressBar) progressBar.style.width = '100%';

            cleanedBlob = new Blob([scrubbedBytes], { type: 'application/pdf' });
            const outName = currentFile.name.replace(/\.[^/.]+$/, '') + '-anonymized.pdf';

            showResult(cleanedBlob, outName, customMetadata ? 'Custom metadata applied & timestamps neutralized.' : 'All metadata fields and timestamps wiped clean.');

            // Trigger immediate download
            saveAs(cleanedBlob, outName);
            if (typeof incrementFileCount === 'function') incrementFileCount();
            if (typeof showToast === 'function') showToast('success', 'PDF metadata scrubbed successfully!');

        } catch (err) {
            console.error('Scrubbing failed:', err);
            if (typeof showToast === 'function') showToast('error', 'Scrubbing failed: ' + err.message);
        } finally {
            setTimeout(() => {
                if (progress) progress.style.display = 'none';
            }, 500);
        }
    }

    async function executeImageScrub() {
        if (!currentFile) return;

        const progress = document.getElementById('metaProgress');
        const progressBar = document.getElementById('metaProgressBar');

        if (progress) progress.style.display = 'block';
        if (progressBar) progressBar.style.width = '50%';

        try {
            const format = currentFile.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
            cleanedBlob = await MetadataEngine.scrubImageMetadata(currentFile, format, 0.95);
            if (progressBar) progressBar.style.width = '100%';

            const ext = format === 'image/jpeg' ? '.jpg' : '.png';
            const outName = currentFile.name.replace(/\.[^/.]+$/, '') + '-clean' + ext;

            showResult(cleanedBlob, outName, '100% of EXIF, GPS location tags, and camera metadata stripped.');

            saveAs(cleanedBlob, outName);
            if (typeof incrementFileCount === 'function') incrementFileCount();
            if (typeof showToast === 'function') showToast('success', 'EXIF & GPS metadata stripped successfully!');

        } catch (err) {
            console.error('Image EXIF scrub failed:', err);
            if (typeof showToast === 'function') showToast('error', 'Failed: ' + err.message);
        } finally {
            setTimeout(() => {
                if (progress) progress.style.display = 'none';
            }, 500);
        }
    }

    function showResult(blob, filename, detailsText) {
        const resultSection = document.getElementById('metaResultSection');
        const downloadBtn = document.getElementById('btnDownloadScrubbed');
        const detailsEl = document.getElementById('metaResultDetails');

        if (detailsEl) {
            detailsEl.textContent = detailsText + ' (' + FileHelpers.formatFileSize(blob.size) + ')';
        }
        if (resultSection) resultSection.style.display = 'block';

        if (downloadBtn) {
            downloadBtn.onclick = () => saveAs(blob, filename);
        }
    }

    return {
        render: render
    };
})();
