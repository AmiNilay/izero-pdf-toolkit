/**
 * iZeroPDF - Form & Annotation Flattening Tool UI Controller
 * Swiss Minimalist Design System
 */

function renderFlattenTool() {
    const container = document.getElementById('toolContent');
    const pageHome = document.getElementById('page-home') || document.getElementById('home');
    if (pageHome) pageHome.style.display = 'none';
    if (!container) return;
    container.style.display = 'block';
    container.style.visibility = 'visible';
    container.style.opacity = '1';

    let currentFile = null;
    let flattenedPdfBytes = null;

    container.innerHTML = `
        <div class="tool-workspace">
            <div class="tool-header">
                <button class="btn btn-secondary btn-sm" id="backToHomeBtn">
                    <span class="material-symbols-outlined">arrow_back</span> Back
                </button>
                <div class="tool-title-group">
                    <span class="tool-index">05 / LEGAL & COMPLIANCE</span>
                    <h2>Flatten PDF Forms & Annotations</h2>
                    <p>Lock interactive form fields, checkboxes, and notes into permanent static vectors for visa, tax, and court submissions.</p>
                </div>
            </div>

            <div class="tool-main-grid" style="display: grid; grid-template-columns: 1fr; gap: 24px; max-width: 960px; margin: 0 auto;">
                <!-- Upload Dropzone -->
                <div class="upload-dropzone" id="flattenDropzone" style="border: 2px dashed var(--dp-color-ink); padding: 48px 24px; text-align: center; cursor: pointer; background: var(--dp-color-surface);">
                    <span class="material-symbols-outlined" style="font-size: 48px; margin-bottom: 12px; display: block;">assignment_turned_in</span>
                    <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Select PDF with Interactive Forms or Annotations</h3>
                    <p style="font-size: 14px; opacity: 0.7; margin-bottom: 16px;">100% private. Form values are locked in local browser memory without uploading.</p>
                    <button class="btn btn-primary" type="button" id="browseBtn">Browse Files</button>
                    <input type="file" id="flattenFileInput" accept=".pdf,application/pdf" style="display: none;">
                </div>

                <!-- Inspection & Action Panel -->
                <div id="flattenPanel" style="display: none; border: 2px solid var(--dp-color-ink); padding: 24px; background: var(--dp-color-ground);">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--dp-color-ink); padding-bottom: 16px; margin-bottom: 20px;">
                        <div>
                            <strong id="pdfFileName" style="font-size: 16px; display: block;">document.pdf</strong>
                            <span id="formAuditSummary" style="font-size: 13px; font-weight: 700; color: #15803d;">Inspecting document structure...</span>
                        </div>
                        <button class="btn btn-secondary btn-sm" id="changeFileBtn">Change File</button>
                    </div>

                    <!-- Fields Matrix -->
                    <div id="fieldsContainer" style="margin-bottom: 24px;">
                        <h4 style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">Detected Interactive Fields</h4>
                        <div id="fieldsTableWrapper" style="max-height: 280px; overflow-y: auto; border: 1px solid var(--dp-color-ink);">
                            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                                <thead>
                                    <tr style="background: var(--dp-color-surface); border-bottom: 1px solid var(--dp-color-ink); text-align: left;">
                                        <th style="padding: 8px 12px; font-weight: 700;">Field Name</th>
                                        <th style="padding: 8px 12px; font-weight: 700;">Type</th>
                                        <th style="padding: 8px 12px; font-weight: 700;">Current Value</th>
                                    </tr>
                                </thead>
                                <tbody id="fieldsTableBody"></tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Action Bar -->
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 2px solid var(--dp-color-ink); padding-top: 20px;">
                        <p style="font-size: 13px; opacity: 0.8; max-width: 500px; margin: 0;">
                            Flattening permanently bakes all entered text, ticks, and signatures into the background layer. Form fields cannot be edited or cleared afterwards.
                        </p>
                        <button class="btn btn-primary" id="executeFlattenBtn" style="min-width: 200px;">
                            <span class="material-symbols-outlined">lock</span> Flatten & Lock PDF
                        </button>
                    </div>

                    <!-- Result Panel -->
                    <div id="flattenResultPanel" style="display: none; margin-top: 24px; padding: 16px; background: var(--dp-color-surface); border: 1px solid var(--dp-color-ink); display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span style="font-size: 12px; text-transform: uppercase; font-weight: 700; color: #15803d; display: block;">✔ PDF Immutable & Flattened</span>
                            <span style="font-size: 13px; opacity: 0.85;">All AcroForms and interactive widgets successfully frozen.</span>
                        </div>
                        <button class="btn btn-primary" id="downloadFlattenedBtn">
                            <span class="material-symbols-outlined">download</span> Download Flattened PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Elements
    const backBtn = document.getElementById('backToHomeBtn');
    const dropzone = document.getElementById('flattenDropzone');
    const fileInput = document.getElementById('flattenFileInput');
    const browseBtn = document.getElementById('browseBtn');
    const panel = document.getElementById('flattenPanel');
    const changeFileBtn = document.getElementById('changeFileBtn');
    const auditSummary = document.getElementById('formAuditSummary');
    const fieldsTableBody = document.getElementById('fieldsTableBody');
    const executeBtn = document.getElementById('executeFlattenBtn');
    const resultPanel = document.getElementById('flattenResultPanel');
    const downloadBtn = document.getElementById('downloadFlattenedBtn');

    // Navigation
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
        flattenedPdfBytes = null;
        fileInput.value = '';
        panel.style.display = 'none';
        dropzone.style.display = 'block';
        resultPanel.style.display = 'none';
    });

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    async function handleFileSelect(file) {
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            alert('Please select a valid PDF document.');
            return;
        }

        currentFile = file;
        document.getElementById('pdfFileName').textContent = file.name;
        dropzone.style.display = 'none';
        panel.style.display = 'block';
        resultPanel.style.display = 'none';
        auditSummary.textContent = 'Inspecting form fields...';

        try {
            const audit = await FlattenEngine.inspectPdfForms(file);
            if (audit.hasForm) {
                auditSummary.textContent = `Found ${audit.fieldCount} interactive form field(s) across ${audit.pageCount} page(s).`;
                fieldsTableBody.innerHTML = audit.fields.map(f => `
                    <tr style="border-bottom: 1px solid #e0e0e0;">
                        <td style="padding: 8px 12px; font-weight: 700;">${escapeHtml(f.name)}</td>
                        <td style="padding: 8px 12px; opacity: 0.8;">${escapeHtml(f.type)}</td>
                        <td style="padding: 8px 12px; font-family: monospace;">${escapeHtml(f.value || '—')}</td>
                    </tr>
                `).join('');
            } else {
                auditSummary.textContent = `Document has ${audit.pageCount} page(s). No AcroForm fields found (annotations & comments will be flattened).`;
                fieldsTableBody.innerHTML = `
                    <tr>
                        <td colspan="3" style="padding: 16px; text-align: center; opacity: 0.7;">No interactive AcroForm fields detected.</td>
                    </tr>
                `;
            }
        } catch (e) {
            console.error('Audit failed:', e);
            auditSummary.textContent = 'Document ready for flattening.';
        }
    }

    executeBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        executeBtn.disabled = true;
        executeBtn.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Flattening...';

        try {
            flattenedPdfBytes = await FlattenEngine.flattenPdf(currentFile);
            resultPanel.style.display = 'flex';
            if (typeof window.incrementFileCount === 'function') {
                window.incrementFileCount();
            }
        } catch (err) {
            console.error('Flatten error:', err);
            alert('Error flattening document: ' + err.message);
        } finally {
            executeBtn.disabled = false;
            executeBtn.innerHTML = '<span class="material-symbols-outlined">lock</span> Flatten & Lock PDF';
        }
    });

    downloadBtn.addEventListener('click', () => {
        if (!flattenedPdfBytes) return;
        const blob = new Blob([flattenedPdfBytes], { type: 'application/pdf' });
        const originalName = currentFile ? currentFile.name.replace(/\.pdf$/i, '') : 'document';
        saveAs(blob, `${originalName}-flattened.pdf`);
    });
}

if (typeof window !== 'undefined') {
    window.renderFlattenTool = renderFlattenTool;
}
