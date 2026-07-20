/**
 * Photo Resizer Tool - UI Controller with Templates
 */

const PhotoResizerToolController = (function() {
    'use strict';

    let currentImage = null;
    let resizedCanvas = null;
    let originalFile = null;

    // ==================== TEMPLATE DATABASE ====================
    
    const TEMPLATES = {
        'photo-id': {
            category: 'Photo (ID/Govt)',
            icon: '🪪',
            templates: [
                { name: 'Passport', width: 413, height: 531, size: '100 KB', desc: 'Standard Passport' },
                { name: 'US Passport', width: 600, height: 600, size: '200 KB', desc: 'US Passport Photo' },
                { name: 'NEET/GATE', width: 300, height: 400, size: '100 KB', desc: 'Exam Photo' },
                { name: 'UPSC', width: 350, height: 450, size: '100 KB', desc: 'UPSC Exam' },
                { name: 'DSSSB', width: 300, height: 400, size: '50 KB', desc: 'DSSSB Exam' },
                { name: 'Driving Licence', width: 350, height: 450, size: '100 KB', desc: 'DL Photo' },
                { name: 'Aadhaar', width: 200, height: 230, size: '20 KB', desc: 'Aadhaar Card' },
                { name: 'PAN 3.5x2.5 cm', width: 413, height: 295, size: '20 KB', desc: 'PAN Card' },
                { name: 'Visa (square)', width: 300, height: 300, size: '50 KB', desc: 'Visa Photo' },
                { name: 'Exam/Govt', width: 480, height: 640, size: 'N/A', desc: 'Government Exam' },
                { name: 'College Form', width: 240, height: 320, size: 'N/A', desc: 'College Application' },
                { name: '3.5×4.5 cm', width: 207, height: 266, size: 'N/A', desc: 'Standard Size' },
                { name: '5×7 cm', width: 295, height: 414, size: 'N/A', desc: 'Standard Size' },
                { name: '150×200', width: 150, height: 200, size: 'N/A', desc: 'School/Form' },
                { name: 'UAE/Gulf Passport', width: 826, height: 1102, size: 'N/A', desc: 'Gulf Passport' },
                { name: 'Application 240×320', width: 240, height: 320, size: '50 KB', desc: 'Application Form' }
            ]
        },
        'signature': {
            category: 'Signature',
            icon: '✍️',
            templates: [
                { name: 'Signature 140×60', width: 140, height: 60, size: '20 KB', desc: 'Standard Signature' },
                { name: 'Signature 200×60', width: 200, height: 60, size: '20 KB', desc: 'Wide Signature' },
                { name: 'GATE Signature', width: 280, height: 80, size: '50 KB', desc: 'GATE Exam' },
                { name: 'UPSC Signature', width: 400, height: 200, size: '100 KB', desc: 'UPSC Exam' },
                { name: '3.5×1.5 cm', width: 207, height: 88, size: '20 KB', desc: 'Standard Size' },
                { name: 'Signature 300×100', width: 300, height: 100, size: '20 KB', desc: 'Common Size' },
                { name: 'Bank Form Signature', width: 400, height: 150, size: 'N/A', desc: 'Bank Forms' },
                { name: '5×2.25 cm', width: 302, height: 132, size: 'N/A', desc: 'Standard Size' },
                { name: '6×3 cm', width: 350, height: 175, size: 'N/A', desc: 'Standard Size' },
                { name: '150×100', width: 150, height: 100, size: 'N/A', desc: 'Exam Forms' }
            ]
        },
        'social-media': {
            category: 'Social Media',
            icon: '📱',
            templates: [
                { name: 'Instagram Story', width: 1080, height: 1920, size: 'N/A', desc: 'Full Story' },
                { name: 'Instagram Portrait', width: 1080, height: 1350, size: 'N/A', desc: 'Portrait Post' },
                { name: 'Instagram Post', width: 1080, height: 1080, size: 'N/A', desc: 'Square Post' },
                { name: 'Instagram Shop Product', width: 1350, height: 1350, size: 'N/A', desc: 'Shop Product' },
                { name: 'Instagram Landscape', width: 1080, height: 566, size: 'N/A', desc: 'Landscape Post' },
                { name: 'YouTube Thumbnail', width: 1280, height: 720, size: 'N/A', desc: 'Video Thumbnail' },
                { name: 'YouTube HD', width: 1920, height: 1080, size: 'N/A', desc: 'Full HD Video' },
                { name: 'YouTube Banner Safe', width: 2048, height: 1152, size: 'N/A', desc: 'Banner Safe Area' },
                { name: 'YouTube Channel Art', width: 2560, height: 1440, size: 'N/A', desc: 'Channel Banner' },
                { name: 'Facebook Link Post', width: 1200, height: 628, size: 'N/A', desc: 'Link Preview' },
                { name: 'Facebook Cover', width: 820, height: 312, size: 'N/A', desc: 'Cover Photo' },
                { name: 'Twitter/X Header', width: 1500, height: 500, size: 'N/A', desc: 'Profile Header' },
                { name: 'Twitter/X Profile', width: 400, height: 400, size: 'N/A', desc: 'Profile Photo' },
                { name: 'LinkedIn Cover', width: 1584, height: 396, size: 'N/A', desc: 'Company Cover' },
                { name: 'LinkedIn Profile', width: 400, height: 400, size: 'N/A', desc: 'Profile Photo' }
            ]
        },
        'ecommerce': {
            category: 'Ecommerce / Marketplace',
            icon: '🛍️',
            templates: [
                { name: 'Etsy/Shopify Product Square', width: 1080, height: 1080, size: 'N/A', desc: 'Product Square' },
                { name: 'High-Res Product', width: 1500, height: 1500, size: 'N/A', desc: 'High Quality' },
                { name: 'Amazon High-Res', width: 1500, height: 1500, size: 'N/A', desc: 'Amazon Standard' },
                { name: 'Amazon', width: 1000, height: 1000, size: 'N/A', desc: 'Amazon Square' },
                { name: 'Flipkart', width: 1600, height: 1600, size: 'N/A', desc: 'Flipkart Standard' },
                { name: 'Myntra Portrait', width: 1500, height: 2000, size: 'N/A', desc: 'Myntra Product' },
                { name: 'Shopify', width: 2048, height: 2048, size: 'N/A', desc: 'Shopify Standard' }
            ]
        },
        'google-ads': {
            category: 'Google Display Ads',
            icon: '📊',
            templates: [
                { name: 'Medium Rectangle', width: 300, height: 250, size: 'N/A', desc: 'Standard Ad' },
                { name: 'Leaderboard', width: 728, height: 90, size: 'N/A', desc: 'Top Banner' },
                { name: 'Billboard', width: 970, height: 250, size: 'N/A', desc: 'Large Display' },
                { name: 'Square', width: 250, height: 250, size: 'N/A', desc: 'Square Ad' },
                { name: 'Skyscraper', width: 160, height: 600, size: 'N/A', desc: 'Side Ad' },
                { name: 'Large Skyscraper', width: 300, height: 600, size: 'N/A', desc: 'Wide Side Ad' },
                { name: 'Large Rectangle', width: 336, height: 280, size: 'N/A', desc: 'Large Display' }
            ]
        },
        'print-sizes': {
            category: 'Print Sizes',
            icon: '🖨️',
            templates: [
                { name: 'A4 (300 DPI)', width: 2480, height: 3508, size: 'N/A', desc: 'A4 Print' },
                { name: 'A3 (300 DPI)', width: 3508, height: 4961, size: 'N/A', desc: 'A3 Print' },
                { name: 'Postcard', width: 1200, height: 1800, size: 'N/A', desc: 'Postcard Print' },
                { name: '6×9" Print', width: 1800, height: 2700, size: 'N/A', desc: '6x9 Inches' },
                { name: '8×10" Print', width: 2400, height: 3000, size: 'N/A', desc: '8x10 Inches' },
                { name: '12×18" Poster', width: 3600, height: 5400, size: 'N/A', desc: '12x18 Poster' }
            ]
        },
        'web': {
            category: 'Web / Blog / UI',
            icon: '🌐',
            templates: [
                { name: 'Web Banner', width: 1920, height: 1080, size: 'N/A', desc: 'Full Web Banner' },
                { name: 'Blog Featured', width: 1280, height: 720, size: 'N/A', desc: 'Blog Header' },
                { name: 'Inline Article', width: 800, height: 450, size: 'N/A', desc: 'Article Image' }
            ]
        }
    };

    function getTemplateCategories() {
        return Object.keys(TEMPLATES);
    }

    function getTemplatesByCategory(category) {
        return TEMPLATES[category]?.templates || [];
    }

    function getCategoryInfo(category) {
        return TEMPLATES[category] || null;
    }

    function render() {
        var container = document.getElementById('toolContent');
        if (!container) return;

        // ✅ REMOVED: <section class="page active"> wrapper
        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-header">
                    <h2>📐 Photo Resizer</h2>
                    <p>Resize images to standard sizes for ID, Social Media, Ecommerce & more</p>
                </div>

                <div class="upload-area" id="resizerUploadArea">
                    <input type="file" id="resizerFileInput" accept="image/*">
                    <div class="upload-icon material-symbols-outlined">upload_file</div>
                    <div class="upload-text">Drop an image here or click to browse</div>
                    <div class="upload-hint">Supports JPG, PNG, WebP, BMP, GIF</div>
                </div>

                <div id="resizerFileInfo" class="file-info" style="display: none;">
                    <span id="resizerFileDetails"></span>
                </div>

                <div style="margin: 16px 0;">
                    <label style="font-weight: 600; display: block; margin-bottom: 8px; color: var(--md-on-surface);">
                        📂 Select Template Category
                    </label>
                    <div id="categoryButtons" style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${Object.entries(TEMPLATES).map(function(entry) {
                            var key = entry[0];
                            var cat = entry[1];
                            return '<button class="category-btn btn btn-secondary btn-sm" data-category="' + key + '">' + cat.icon + ' ' + cat.category + '</button>';
                        }).join('')}
                    </div>
                </div>

                <div id="templatesGrid" style="display: none; margin: 16px 0;">
                    <label style="font-weight: 600; display: block; margin-bottom: 8px; color: var(--md-on-surface);">
                        📋 Select Template
                    </label>
                    <div id="templateButtons" style="display: flex; flex-wrap: wrap; gap: 8px;"></div>
                </div>

                <div class="settings-group" style="margin-top: 16px;">
                    <label style="font-weight: 600; width: 100%; margin-bottom: 8px; color: var(--md-on-surface);">
                        ✏️ Custom Size
                    </label>
                    <div style="display: flex; flex-wrap: wrap; gap: 12px; width: 100%; align-items: center;">
                        <label>
                            Width (px):
                            <input type="number" id="customWidth" value="800" min="1" max="10000" style="width:100px;">
                        </label>
                        <label>
                            Height (px):
                            <input type="number" id="customHeight" value="600" min="1" max="10000" style="width:100px;">
                        </label>
                        <label>
                            <input type="checkbox" id="maintainAspectResizer" checked> Maintain Aspect Ratio
                        </label>
                        <button class="btn btn-primary btn-sm" id="applyCustomSizeBtn">Apply Custom</button>
                    </div>
                </div>

                <div class="settings-group">
                    <label>
                        <span class="material-symbols-outlined">image</span>
                        Output Format:
                        <select id="resizerFormat">
                            <option value="image/jpeg">JPEG</option>
                            <option value="image/png">PNG</option>
                            <option value="image/webp">WebP</option>
                        </select>
                    </label>
                    <label>
                        <span class="material-symbols-outlined">high_quality</span>
                        Quality:
                        <input type="range" id="resizerQuality" min="10" max="100" value="92">
                        <span id="resizerQualityLabel">92%</span>
                    </label>
                    <label>
                        <input type="checkbox" id="autoDownload">
                        <span class="material-symbols-outlined">download</span> Auto-download after resize
                    </label>
                </div>

                <div class="result-actions" style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn btn-primary" id="applyResizerBtn" disabled>
                        <span class="material-symbols-outlined">aspect_ratio</span> Apply Resize
                    </button>
                    <button class="btn btn-success" id="downloadResizerBtn" disabled>
                        <span class="material-symbols-outlined">download</span> Download Resized
                    </button>
                </div>

                <div class="progress-container">
                    <div class="progress-bar"></div>
                    <div class="progress-text"></div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                    <div>
                        <h4 style="color: var(--md-on-surface);">Original</h4>
                        <div id="resizerOriginalPreview" style="border:1px solid var(--md-outline-variant);border-radius:var(--md-shape-medium);padding:10px;min-height:200px;display:flex;align-items:center;justify-content:center;background:var(--md-surface);">
                            <p style="color:var(--md-on-surface-variant);">No image loaded</p>
                        </div>
                        <p id="resizerOriginalDimensions" style="text-align:center;margin-top:5px;color:var(--md-on-surface-variant);"></p>
                    </div>
                    <div>
                        <h4 style="color: var(--md-on-surface);">Resized (Preview)</h4>
                        <div id="resizerResizedPreview" style="border:1px solid var(--md-outline-variant);border-radius:var(--md-shape-medium);padding:10px;min-height:200px;display:flex;align-items:center;justify-content:center;background:var(--md-surface);">
                            <p style="color:var(--md-on-surface-variant);">Resize preview will appear here</p>
                        </div>
                        <p id="resizerResizedDimensions" style="text-align:center;margin-top:5px;color:var(--md-on-surface-variant);"></p>
                        <p id="resizerFileSize" style="text-align:center;font-size:0.85rem;color:var(--md-on-surface-variant);"></p>
                    </div>
                </div>

                <div id="templateInfo" style="display: none; margin-top: 12px; padding: 12px 16px; background: var(--md-primary-container); border-radius: var(--md-shape-medium); color: var(--md-on-primary-container);">
                    <span id="templateInfoText"></span>
                </div>
            </div>
        `;

        attachEvents();
    }

    function attachEvents() {
        var fileInput = document.getElementById('resizerFileInput');
        var uploadArea = document.getElementById('resizerUploadArea');
        var applyBtn = document.getElementById('applyResizerBtn');
        var downloadBtn = document.getElementById('downloadResizerBtn');
        var qualityRange = document.getElementById('resizerQuality');
        var qualityLabel = document.getElementById('resizerQualityLabel');
        var customWidth = document.getElementById('customWidth');
        var customHeight = document.getElementById('customHeight');
        var applyCustomBtn = document.getElementById('applyCustomSizeBtn');
        var maintainAspect = document.getElementById('maintainAspectResizer');

        if (qualityRange && qualityLabel) {
            qualityRange.addEventListener('input', function() {
                qualityLabel.textContent = this.value + '%';
            });
        }

        document.querySelectorAll('.category-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var category = this.dataset.category;
                loadTemplates(category);
                document.querySelectorAll('.category-btn').forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');
            });
        });

        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                var file = this.files[0];
                if (file && Validators.isImage(file)) {
                    loadImage(file);
                } else {
                    showToast('error', 'Please upload a valid image');
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
                if (file && Validators.isImage(file)) {
                    loadImage(file);
                }
            });
        }

        if (applyBtn) applyBtn.addEventListener('click', applyResize);
        if (downloadBtn) downloadBtn.addEventListener('click', downloadResized);

        if (applyCustomBtn) {
            applyCustomBtn.addEventListener('click', function() {
                var width = parseInt(customWidth.value);
                var height = parseInt(customHeight.value);
                if (width > 0 && height > 0) {
                    applyCustomSize(width, height);
                } else {
                    showToast('error', 'Please enter valid dimensions');
                }
            });
        }

        if (maintainAspect) {
            maintainAspect.addEventListener('change', function() {
                if (this.checked && currentImage) {
                    var ratio = currentImage.height / currentImage.width;
                    customHeight.value = Math.round(parseInt(customWidth.value) * ratio);
                }
                updateResizePreview();
            });
        }

        if (customWidth && customHeight) {
            customWidth.addEventListener('change', function() {
                if (maintainAspect && maintainAspect.checked && currentImage) {
                    var ratio = currentImage.height / currentImage.width;
                    customHeight.value = Math.round(parseInt(this.value) * ratio);
                }
                updateResizePreview();
            });

            customHeight.addEventListener('change', function() {
                if (maintainAspect && maintainAspect.checked && currentImage) {
                    var ratio = currentImage.width / currentImage.height;
                    customWidth.value = Math.round(parseInt(this.value) * ratio);
                }
                updateResizePreview();
            });
        }
    }

    function loadTemplates(category) {
        var templates = getTemplatesByCategory(category);
        var grid = document.getElementById('templatesGrid');
        var container = document.getElementById('templateButtons');

        if (!grid || !container) return;

        if (templates.length === 0) {
            grid.style.display = 'none';
            return;
        }

        grid.style.display = 'block';
        container.innerHTML = '';

        templates.forEach(function(template) {
            var btn = document.createElement('button');
            btn.className = 'btn btn-secondary btn-sm';
            btn.innerHTML = template.name + ' <span style="font-size:0.7rem;opacity:0.7;">' + template.size + '</span>';
            btn.style.fontSize = '0.8rem';
            btn.title = template.desc;
            
            btn.addEventListener('click', function() {
                applyTemplate(template);
                container.querySelectorAll('button').forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');
            });
            
            container.appendChild(btn);
        });

        var categoryInfo = getCategoryInfo(category);
        if (categoryInfo) {
            var infoDiv = document.getElementById('templateInfo');
            var infoText = document.getElementById('templateInfoText');
            if (infoDiv && infoText) {
                infoDiv.style.display = 'block';
                infoText.textContent = categoryInfo.icon + ' ' + categoryInfo.category + ' - ' + templates.length + ' templates available';
            }
        }
    }

    function applyTemplate(template) {
        if (!currentImage) {
            showToast('warning', 'Please upload an image first');
            return;
        }

        document.getElementById('customWidth').value = template.width;
        document.getElementById('customHeight').value = template.height;

        var infoDiv = document.getElementById('templateInfo');
        var infoText = document.getElementById('templateInfoText');
        if (infoDiv && infoText) {
            infoDiv.style.display = 'block';
            infoText.textContent = '📐 ' + template.name + ' - ' + template.width + '×' + template.height + ' (' + template.size + ') - ' + template.desc;
            infoDiv.style.background = 'var(--md-tertiary-container)';
            infoDiv.style.color = 'var(--md-on-tertiary-container)';
        }

        updateResizePreview();
        showToast('info', 'Template applied: ' + template.name + ' (' + template.width + '×' + template.height + ')');
    }

    function applyCustomSize(width, height) {
        if (!currentImage) {
            showToast('warning', 'Please upload an image first');
            return;
        }

        var infoDiv = document.getElementById('templateInfo');
        var infoText = document.getElementById('templateInfoText');
        if (infoDiv && infoText) {
            infoDiv.style.display = 'block';
            infoText.textContent = '✏️ Custom Size - ' + width + '×' + height;
            infoDiv.style.background = 'var(--md-secondary-container)';
            infoDiv.style.color = 'var(--md-on-secondary-container)';
        }

        updateResizePreview();
        showToast('info', 'Custom size: ' + width + '×' + height);
    }

    async function loadImage(file) {
        try {
            originalFile = file;
            currentImage = await FileHelpers.loadImage(file);
            
            var infoDiv = document.getElementById('resizerFileInfo');
            var details = document.getElementById('resizerFileDetails');
            if (infoDiv && details) {
                infoDiv.style.display = 'block';
                details.textContent = '📷 ' + file.name + ' (' + currentImage.width + ' × ' + currentImage.height + ')';
            }

            document.getElementById('customWidth').value = currentImage.width;
            document.getElementById('customHeight').value = currentImage.height;

            var preview = document.getElementById('resizerOriginalPreview');
            if (preview) {
                preview.innerHTML = '<img src="' + currentImage.src + '" style="max-width:100%;max-height:400px;border-radius:var(--md-shape-small);">';
            }

            document.getElementById('resizerOriginalDimensions').textContent = 
                currentImage.width + ' × ' + currentImage.height;

            document.getElementById('applyResizerBtn').disabled = false;
            updateResizePreview();
            document.querySelectorAll('#templateButtons button').forEach(function(b) { b.classList.remove('active'); });

            showToast('success', 'Image loaded: ' + currentImage.width + '×' + currentImage.height);

        } catch (error) {
            console.error('Error loading image:', error);
            showToast('error', 'Failed to load image: ' + error.message);
        }
    }

    function updateResizePreview() {
        if (!currentImage) return;

        var width = parseInt(document.getElementById('customWidth').value) || currentImage.width;
        var height = parseInt(document.getElementById('customHeight').value) || currentImage.height;

        document.getElementById('resizerResizedDimensions').textContent = width + ' × ' + height;

        var preview = document.getElementById('resizerResizedPreview');
        if (preview) {
            var canvas = CanvasHelpers.resizeImage(currentImage, width, height, false);
            var format = document.getElementById('resizerFormat').value;
            var quality = parseInt(document.getElementById('resizerQuality').value) / 100;
            var dataURL = canvas.toDataURL(format, quality);
            preview.innerHTML = '<img src="' + dataURL + '" style="max-width:100%;max-height:400px;border-radius:var(--md-shape-small);">';
            
            var sizeInBytes = Math.round((dataURL.length * 3) / 4);
            document.getElementById('resizerFileSize').textContent = 'Est. Size: ' + FileHelpers.formatFileSize(sizeInBytes);
        }
    }

    function applyResize() {
        if (!currentImage) {
            showToast('warning', 'Please load an image first');
            return;
        }

        var width = parseInt(document.getElementById('customWidth').value);
        var height = parseInt(document.getElementById('customHeight').value);

        if (width < 1 || height < 1) {
            showToast('error', 'Invalid dimensions');
            return;
        }

        try {
            resizedCanvas = CanvasHelpers.resizeImage(currentImage, width, height, false);
            
            var preview = document.getElementById('resizerResizedPreview');
            if (preview) {
                var format = document.getElementById('resizerFormat').value;
                var quality = parseInt(document.getElementById('resizerQuality').value) / 100;
                var dataURL = resizedCanvas.toDataURL(format, quality);
                preview.innerHTML = '<img src="' + dataURL + '" style="max-width:100%;max-height:400px;border-radius:var(--md-shape-small);">';
            }

            document.getElementById('downloadResizerBtn').disabled = false;
            showToast('success', 'Image resized to ' + width + ' × ' + height);

            if (document.getElementById('autoDownload').checked) {
                downloadResized();
            }

        } catch (error) {
            console.error('Resize error:', error);
            showToast('error', 'Resize failed: ' + error.message);
        }
    }

    function downloadResized() {
        if (!resizedCanvas) {
            showToast('warning', 'Please apply resize first');
            return;
        }

        var format = document.getElementById('resizerFormat').value;
        var quality = parseInt(document.getElementById('resizerQuality').value) / 100;
        var extension = format.split('/')[1] || 'png';
        
        var dataURL = resizedCanvas.toDataURL(format, quality);
        var link = document.createElement('a');
        var name = originalFile ? FileHelpers.getFileNameWithoutExtension(originalFile.name) : 'image';
        link.download = name + '_resized.' + extension;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('success', 'Resized image downloaded');
    }

    return {
        render: render,
        getTemplateCategories: getTemplateCategories,
        getTemplatesByCategory: getTemplatesByCategory,
        getCategoryInfo: getCategoryInfo,
        TEMPLATES: TEMPLATES
    };

})();

window.PhotoResizerToolController = PhotoResizerToolController;