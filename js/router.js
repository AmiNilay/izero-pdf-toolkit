/**
 * Router - Handles navigation between tools and pages
 */

const Router = (function() {
    'use strict';

    const routes = {
        'home': { title: 'Home', render: renderHome },

        // Core Tools
        'image-to-pdf': { title: 'Images → PDF', render: renderImageToPdf },
        'crop': { title: 'Crop Image', render: renderCropTool },
        'resize': { title: 'Resize Image', render: renderResizeTool },
        'photo-resizer': { title: 'Photo Resizer', render: renderPhotoResizer },
        'compress-image': { title: 'Compress Image', render: renderCompressTool }, // Added
        'rotate-image': { title: 'Rotate Image', render: renderRotateImageTool }, // Added
        'watermark': { title: 'Watermark Image', render: renderWatermarkTool },   // Added

        // PDF Manipulation
        'merge': { title: 'Merge PDF', render: renderMergeTool },
        'split': { title: 'Split PDF', render: renderSplitTool },
        'rotate': { title: 'Rotate PDF', render: renderRotateTool },
        'extract': { title: 'Extract Images', render: renderExtractTool },
        'organize-pdf': { title: 'Organize PDF', render: renderOrganizePdf },

        // Compression & Security
        'compress': { title: 'Compress', render: renderCompressTool },
        'lock': { title: 'Lock PDF', render: renderLockTool },
        'remove-pages': { title: 'Remove Pages', render: renderRemovePagesTool },

        // Conversion
        'pdf-to-jpg': { title: 'PDF to JPG', render: renderPdfToJpgTool },
        'image-converter': { title: 'Convert Images', render: renderImageConverter },

        // Image Editor
        'image-editor': { title: 'Image Editor', render: renderImageEditor }
    };

    const pageRoutes = {
        'privacy': '/privacy.html',
        'open-source': '/open-source.html',
        'github': '/github.html',
        'license': '/license.html',
        'support': '/support.html'
    };

    let currentRoute = 'home';

    function init() {
        console.log('Router initializing...');

        document.querySelectorAll('.nav-link[data-tool]').forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                var tool = this.dataset.tool;
                if (tool) navigate(tool);
            });
        });

        document.querySelectorAll('[data-tool="home"]').forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                navigate('home');
            });
        });

        document.querySelectorAll('.tool-card[data-tool]').forEach(function(card) {
            card.addEventListener('click', function() {
                var tool = this.dataset.tool;
                if (tool) navigate(tool);
            });
        });

        document.querySelectorAll('.footer-link[data-page]').forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                var page = this.dataset.page;
                if (page && pageRoutes[page]) {
                    window.location.href = pageRoutes[page];
                }
            });
        });

        window.addEventListener('popstate', function(e) {
            var state = e.state || {};
            var tool = state.tool || 'home';
            navigate(tool, true);
        });

        var params = new URLSearchParams(window.location.search);
        var initialTool = params.get('tool') || 'home';
        navigate(initialTool, true);

        console.log('Router initialized');
    }

    function navigate(tool, replaceState) {
        replaceState = replaceState || false;

        if (!routes[tool]) {
            console.warn('Route "' + tool + '" not found, redirecting to home');
            tool = 'home';
        }

        currentRoute = tool;

        var url = tool === 'home' ? '/' : '/?tool=' + tool;
        try {
            if (replaceState) {
                history.replaceState({ tool: tool }, '', url);
            } else {
                history.pushState({ tool: tool }, '', url);
            }
        } catch (e) {
            console.warn('History API error:', e);
        }

        document.querySelectorAll('.nav-link[data-tool]').forEach(function(link) {
            link.classList.toggle('active', link.dataset.tool === tool);
        });

        var route = routes[tool];
        if (route) {
            document.title = route.title + ' | iZeroPDF';
            try {
                route.render();
            } catch (e) {
                console.error('Error rendering ' + tool + ':', e);
                showError('Failed to load ' + route.title + ': ' + e.message);
            }
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });

        var menu = document.querySelector('.nav-menu');
        if (menu) menu.classList.remove('open');

        console.log('Navigated to: ' + tool);
    }

    function getCurrentRoute() {
        return currentRoute;
    }

    function isFooterPage() {
        var path = window.location.pathname;
        return path.includes('privacy') ||
               path.includes('open-source') ||
               path.includes('github') ||
               path.includes('license') ||
               path.includes('support');
    }

    function showPage(pageId) {
        var homePage = document.getElementById('page-home');
        var toolContent = document.getElementById('toolContent');
        var pageContentContainer = document.getElementById('page-content-container');

        if (homePage) homePage.style.display = 'none';
        if (toolContent) toolContent.style.display = 'none';
        if (pageContentContainer) pageContentContainer.style.display = 'none';

        if (pageId === 'home') {
            if (homePage) homePage.style.display = 'block';
        } else if (pageId === 'tool') {
            if (toolContent) {
                toolContent.style.display = 'block';
                toolContent.style.visibility = 'visible';
                toolContent.style.opacity = '1';
            }
        } else if (pageId === 'page') {
            if (pageContentContainer) pageContentContainer.style.display = 'block';
        }
    }

    function showError(message) {
        var container = document.getElementById('toolContent');
        if (container) {
            container.innerHTML = `
                <div style="text-align:center;padding:60px 20px;color:var(--md-error);">
                    <div style="font-size:64px;margin-bottom:16px;">️</div>
                    <h3 style="font-weight:700;margin-bottom:8px;color:var(--md-on-background);">${message}</h3>
                    <p style="color:var(--md-on-surface-variant);margin-bottom:16px;">Please check that all scripts are loaded correctly.</p>
                    <button onclick="Router.navigate('home')" class="btn btn-primary">🏠 Go to Home</button>
                </div>
            `;
            showPage('tool');
        }
        console.error('Router Error:', message);
    }

    // ==================== RENDER FUNCTIONS ====================

    function renderHome() { showPage('home'); }
    function renderImageToPdf() { showPage('tool'); if (typeof ImageToPdfController !== 'undefined') ImageToPdfController.render(); else showError('Images to PDF tool not loaded'); }
    function renderCropTool() { showPage('tool'); if (typeof CropToolController !== 'undefined') CropToolController.render(); else showError('Crop tool not loaded'); }
    function renderResizeTool() { showPage('tool'); if (typeof ResizeToolController !== 'undefined') ResizeToolController.render(); else showError('Resize tool not loaded'); }
    function renderPhotoResizer() { showPage('tool'); if (typeof PhotoResizerToolController !== 'undefined') PhotoResizerToolController.render(); else showError('Photo Resizer tool not loaded'); }
    function renderCompressTool() { showPage('tool'); if (typeof CompressToolController !== 'undefined') CompressToolController.render(); else showError('Compress tool not loaded'); }
    
    // New Render Functions
    function renderRotateImageTool() { showPage('tool'); if (typeof RotateImageToolController !== 'undefined') RotateImageToolController.render(); else showError('Rotate Image tool not loaded'); }
    function renderWatermarkTool() { showPage('tool'); if (typeof WatermarkToolController !== 'undefined') WatermarkToolController.render(); else showError('Watermark tool not loaded'); }

    function renderMergeTool() { showPage('tool'); if (typeof MergeToolController !== 'undefined') MergeToolController.render(); else showError('Merge tool not loaded'); }
    function renderSplitTool() { showPage('tool'); if (typeof SplitToolController !== 'undefined') SplitToolController.render(); else showError('Split tool not loaded'); }
    function renderRotateTool() { showPage('tool'); if (typeof RotateToolController !== 'undefined') RotateToolController.render(); else showError('Rotate tool not loaded'); }
    function renderExtractTool() { showPage('tool'); if (typeof ExtractToolController !== 'undefined') ExtractToolController.render(); else showError('Extract Images tool not loaded'); }
    function renderOrganizePdf() { showPage('tool'); if (typeof OrganizePdfToolController !== 'undefined') OrganizePdfToolController.render(); else showError('Organize PDF tool not loaded'); }
    function renderLockTool() { showPage('tool'); if (typeof LockToolController !== 'undefined') LockToolController.render(); else showError('Lock tool not loaded'); }
    function renderRemovePagesTool() { showPage('tool'); if (typeof RemovePagesToolController !== 'undefined') RemovePagesToolController.render(); else showError('Remove Pages tool not loaded'); }
    function renderPdfToJpgTool() { showPage('tool'); if (typeof PdfToJpgController !== 'undefined') PdfToJpgController.render(); else showError('PDF to JPG tool not loaded'); }
    function renderImageConverter() { showPage('tool'); if (typeof ImageConverterToolController !== 'undefined') ImageConverterToolController.render(); else showError('Image Converter tool not loaded'); }
    function renderImageEditor() { showPage('tool'); if (typeof ImageEditorToolController !== 'undefined') ImageEditorToolController.render(); else showError('Image Editor tool not loaded'); }

    return {
        init: init,
        navigate: navigate,
        getCurrentRoute: getCurrentRoute,
        routes: routes,
        pageRoutes: pageRoutes,
        isFooterPage: isFooterPage
    };

})();

window.Router = Router;