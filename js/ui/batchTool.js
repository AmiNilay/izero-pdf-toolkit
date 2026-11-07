/**
 * iZeroPDF - Batch Folder Processing Tool UI Controller
 * Swiss Minimalist Design System
 */

function renderBatchTool() {
    const container = document.getElementById('toolContent');
    const pageHome = document.getElementById('page-home') || document.getElementById('home');
    if (pageHome) pageHome.style.display = 'none';
    if (!container) return;
    container.style.display = 'block';
    container.style.visibility = 'visible';
    container.style.opacity = '1';

    let currentDirHandle = null;
    let scannedFiles = [];
    let batchResult = null;
    const isFsaSupported = BatchEngine.hasDirectoryPicker();

    container.innerHTML = `
        <div class="tool-workspace">
            <div class="tool-header">
                <button class="btn btn-secondary btn-sm" id="backToHomeBtn">
                    <span class="material-symbols-outlined">arrow_back</span> Back
                </button>
                <div class="tool-title-group">
                    <span class="tool-index">09 / WORKFLOW AUTOMATION</span>
                    <h2>Batch Folder Processing</h2>
                    <p>Process entire local folders of PDFs and images in-place using the modern File System Access API without individual download prompts.</p>
                </div>
            </div>

            <div class="tool-main-grid" style="display: grid; grid-template-columns: 1fr; gap: 24px; max-width: 960px; margin: 0 auto;">
                <!-- Mode Status Banner -->
                <div style="background: var(--dp-color-surface); padding: 12px 16px; border: 1px solid var(--dp-color-ink); display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="material-symbols-outlined" style="color: ${isFsaSupported ? '#16a34a' : 'var(--dp-color-ink)'};">
                            ${isFsaSupported ? 'check_circle' : 'folder_zip'}
                        </span>
                        <strong style="font-size: 13px;">
                            ${isFsaSupported ? 'File System Access API: Active (Direct In-Place Writing)' : 'Standard Batch Mode (ZIP Download Fallback)'}
                        </strong>
                    </div>
                    <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; opacity: 0.7;">100% Client-Side</span>
                </div>

                <!-- Folder Selector Dropzone -->
                <div class="upload-dropzone" id="batchDropzone" style="border: 2px dashed var(--dp-color-ink); padding: 48px 24px; text-align: center; cursor: pointer; background: var(--dp-color-surface);">
                    <span class="material-symbols-outlined" style="font-size: 48px; margin-bottom: 12px; display: block;">folder_open</span>
                    <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Select a Local Folder</h3>
                    <p style="font-size: 14px; opacity: 0.7; margin-bottom: 16px;">
                        ${isFsaSupported ? 'Pick a folder on your computer to process files directly inside it.' : 'Choose a folder or drop multiple files to batch process.'}
                    </p>
                    <button class="btn btn-primary" type="button" id="selectFolderBtn">
                        <span class="material-symbols-outlined">folder</span> Choose Folder
                    </button>
                    <input type="file" id="batchFallbackInput" webkitdirectory directory multiple style="display: none;">
                </div>

                <!-- Processing & Scanned Files Panel -->
                <div id="batchPanel" style="display: none; border: 2px solid var(--dp-color-ink); padding: 24px; background: var(--dp-color-ground);">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--dp-color-ink); padding-bottom: 16px; margin-bottom: 20px;">
                        <div>
                            <strong id="batchFolderTitle" style="font-size: 16px; display: block;">Local Folder</strong>
                            <span id="batchCountSummary" style="font-size: 13px; font-weight: 700; color: #16a34a;">0 files found</span>
                        </div>
                        <button class="btn btn-secondary btn-sm" id="changeFolderBtn">Change Folder</button>
                    </div>

                    <!-- Batch Operation Options -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 20px;">
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Batch Operation</label>
                            <select id="batchOperationSelect" style="width: 100%; padding: 10px; border: 2px solid var(--dp-color-ink); background: var(--dp-color-ground); font-weight: 700;">
                                <option value="scrub-metadata">Scrub Privacy Metadata & EXIF</option>
                                <option value="grayscale-pdf">Grayscale Print Optimizer (PDFs)</option>
                                <option value="flatten-pdf">Flatten Forms & Annotations (PDFs)</option>
                                <option value="convert-to-webp">Convert Images to WebP</option>
                            </select>
                        </div>
                    </div>

                    <!-- Scanned Files List -->
                    <div style="margin-bottom: 20px;">
                        <h4 style="font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Files to Process</h4>
                        <div style="max-height: 220px; overflow-y: auto; border: 1px solid var(--dp-color-ink);">
                            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                                <thead>
                                    <tr style="background: var(--dp-color-surface); border-bottom: 1px solid var(--dp-color-ink); text-align: left;">
                                        <th style="padding: 6px 12px;">File Name</th>
                                        <th style="padding: 6px 12px;">Size</th>
                                        <th style="padding: 6px 12px;">Type</th>
                                    </tr>
                                </thead>
                                <tbody id="batchFilesTable"></tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Progress Rail -->
                    <div id="batchProgressContainer" style="display: none; margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; margin-bottom: 6px;">
                            <span id="batchProgressStatus">Processing batch...</span>
                            <span id="batchProgressPercent">0%</span>
                        </div>
                        <div style="height: 8px; width: 100%; background: var(--dp-color-surface); border: 1px solid var(--dp-color-ink);">
                            <div id="batchProgressBar" style="height: 100%; width: 0%; background: var(--dp-color-ink); transition: width 0.1s ease;"></div>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 12px;">
                        <button class="btn btn-primary" id="startBatchBtn" style="min-width: 220px;">
                            <span class="material-symbols-outlined">play_arrow</span> Run Batch Processing
                        </button>
                    </div>

                    <!-- Result Panel -->
                    <div id="batchResultPanel" style="display: none; margin-top: 24px; padding: 16px; background: var(--dp-color-surface); border: 1px solid var(--dp-color-ink); justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                        <div>
                            <span style="font-size: 12px; text-transform: uppercase; font-weight: 700; color: #16a34a; display: block;">✔ Batch Finished</span>
                            <span id="batchResultDesc" style="font-size: 13px; opacity: 0.85;">All files processed successfully.</span>
                        </div>
                        <button class="btn btn-primary" id="downloadZipBtn" style="display: none;">
                            <span class="material-symbols-outlined">download</span> Download Processed ZIP
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Elements
    const backBtn = document.getElementById('backToHomeBtn');
    const dropzone = document.getElementById('batchDropzone');
    const selectFolderBtn = document.getElementById('selectFolderBtn');
    const fallbackInput = document.getElementById('batchFallbackInput');
    const panel = document.getElementById('batchPanel');
    const folderTitle = document.getElementById('batchFolderTitle');
    const countSummary = document.getElementById('batchCountSummary');
    const changeFolderBtn = document.getElementById('changeFolderBtn');
    const operationSelect = document.getElementById('batchOperationSelect');
    const filesTable = document.getElementById('batchFilesTable');
    const startBtn = document.getElementById('startBatchBtn');
    const progressContainer = document.getElementById('batchProgressContainer');
    const progressBar = document.getElementById('batchProgressBar');
    const progressStatus = document.getElementById('batchProgressStatus');
    const progressPercent = document.getElementById('batchProgressPercent');
    const resultPanel = document.getElementById('batchResultPanel');
    const resultDesc = document.getElementById('batchResultDesc');
    const downloadZipBtn = document.getElementById('downloadZipBtn');

    backBtn.addEventListener('click', () => {
        if (typeof Router !== 'undefined') Router.navigate('home');
    });

    selectFolderBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (isFsaSupported) {
            try {
                currentDirHandle = await BatchEngine.pickDirectory();
                folderTitle.textContent = 'Folder: ' + currentDirHandle.name;
                scannedFiles = await BatchEngine.scanDirectory(currentDirHandle);
                renderScannedFiles();
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.warn('FSA failed, falling back:', err);
                    fallbackInput.click();
                }
            }
        } else {
            fallbackInput.click();
        }
    });

    dropzone.addEventListener('click', () => {
        selectFolderBtn.click();
    });

    fallbackInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            currentDirHandle = null;
            folderTitle.textContent = 'Selected Folder (' + e.target.files.length + ' files)';
            scannedFiles = Array.from(e.target.files).map(f => ({
                file: f,
                name: f.name,
                size: f.size,
                type: f.type
            }));
            renderScannedFiles();
        }
    });

    changeFolderBtn.addEventListener('click', () => {
        scannedFiles = [];
        currentDirHandle = null;
        panel.style.display = 'none';
        dropzone.style.display = 'block';
        resultPanel.style.display = 'none';
    });

    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(2) + ' MB';
    }

    function renderScannedFiles() {
        if (scannedFiles.length === 0) {
            alert('No supported PDF or image files found in the selected folder.');
            return;
        }

        dropzone.style.display = 'none';
        panel.style.display = 'block';
        countSummary.textContent = `${scannedFiles.length} file(s) ready for batch processing`;

        filesTable.innerHTML = scannedFiles.map(f => `
            <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 6px 12px; font-weight: 700;">${f.name}</td>
                <td style="padding: 6px 12px; opacity: 0.8;">${formatBytes(f.size)}</td>
                <td style="padding: 6px 12px; font-family: monospace; font-size: 11px;">${f.name.split('.').pop().toUpperCase()}</td>
            </tr>
        `).join('');
    }

    startBtn.addEventListener('click', async () => {
        if (scannedFiles.length === 0) return;

        startBtn.disabled = true;
        progressContainer.style.display = 'block';
        resultPanel.style.display = 'none';

        const op = operationSelect.value;

        try {
            batchResult = await BatchEngine.processBatch(scannedFiles, op, {
                dirHandle: currentDirHandle
            }, (cur, tot, status) => {
                const pct = Math.round((cur / tot) * 100);
                progressBar.style.width = pct + '%';
                progressPercent.textContent = pct + '%';
                progressStatus.textContent = status;
            });

            resultPanel.style.display = 'flex';
            if (batchResult.savedInPlace) {
                resultDesc.textContent = `Successfully saved ${batchResult.results.length} files directly into the "iZero_Optimized" subfolder in your directory.`;
                downloadZipBtn.style.display = 'none';
            } else if (batchResult.zipBlob) {
                resultDesc.textContent = `Batch completed! ${batchResult.results.length} files ready in ZIP package.`;
                downloadZipBtn.style.display = 'inline-block';
            }

            if (typeof window.incrementFileCount === 'function') {
                for (let i = 0; i < batchResult.results.length; i++) {
                    window.incrementFileCount();
                }
            }
        } catch (err) {
            console.error('Batch error:', err);
            alert('Error running batch: ' + err.message);
        } finally {
            startBtn.disabled = false;
            progressContainer.style.display = 'none';
        }
    });

    downloadZipBtn.addEventListener('click', () => {
        if (batchResult && batchResult.zipBlob) {
            saveAs(batchResult.zipBlob, 'iZero_Batch_Optimized.zip');
        }
    });
}

if (typeof window !== 'undefined') {
    window.renderBatchTool = renderBatchTool;
}
