/**
 * iZeroPDF - Main Application
 * Premium Offline PDF & Image Toolkit
 */

(function() {
    'use strict';

    // ============================================
    // APPLICATION CONFIG
    // ============================================
    const APP = {
        name: 'iZeroPDF',
        version: '2.0.0',
        tagline: 'Your PDF & Image Toolkit',
        cacheKey: 'izero-pdf-cache-consent'
    };

    // ============================================
    // DOM READY
    // ============================================
    document.addEventListener('DOMContentLoaded', function() {
        console.log(APP.name + ' v' + APP.version + ' - ' + APP.tagline);
        console.log('100% Private - All processing runs locally in your browser');
        
        // Check cache consent first
        checkCacheConsent();
    });

    // ============================================
    // CACHE CONSENT SYSTEM
    // ============================================
    function checkCacheConsent() {
        const consent = localStorage.getItem(APP.cacheKey);
        
        if (consent === 'accepted') {
            initializeApp(true);
        } else if (consent === 'declined') {
            initializeApp(false);
        } else {
            showCacheDialog();
        }
    }

    function showCacheDialog() {
        const dialog = document.getElementById('cacheConsentDialog');
        if (!dialog) return;
        
        // Show dialog
        dialog.style.display = 'flex';
        dialog.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Get buttons
        const acceptBtn = document.getElementById('acceptCacheBtn');
        const declineBtn = document.getElementById('declineCacheBtn');
        
        // Remove old listeners by cloning
        const newAcceptBtn = acceptBtn.cloneNode(true);
        const newDeclineBtn = declineBtn.cloneNode(true);
        acceptBtn.parentNode.replaceChild(newAcceptBtn, acceptBtn);
        declineBtn.parentNode.replaceChild(newDeclineBtn, declineBtn);
        
        // Accept handler
        newAcceptBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            localStorage.setItem(APP.cacheKey, 'accepted');
            
            // Hide dialog
            dialog.style.display = 'none';
            dialog.classList.remove('active');
            document.body.style.overflow = '';
            
            initializeApp(true);
            showToast('success', 'Cache enabled. Your conversions will be saved.');
        });
        
        // Decline handler
        newDeclineBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            localStorage.setItem(APP.cacheKey, 'declined');
            
            // Hide dialog
            dialog.style.display = 'none';
            dialog.classList.remove('active');
            document.body.style.overflow = '';
            
            initializeApp(false);
            showToast('info', 'Cache declined. Some features may be limited.');
        });
        
        // Close on overlay click
        dialog.addEventListener('click', function(e) {
            if (e.target === this) {
                // Don't close on overlay click - force user to choose
                return;
            }
        });
    }

    // ============================================
    // APP INITIALIZATION
    // ============================================
    function initializeApp(cacheEnabled) {
        // Initialize Router
        if (typeof Router !== 'undefined') {
            Router.init();
        }
        
        // Initialize Theme Manager
        ThemeManager.init();
        
        // Initialize Service Worker (only if cache accepted)
        if (cacheEnabled) {
            registerServiceWorker();
        }
        
        // Initialize Live Clock
        initLiveClock();
        
        // Initialize Stats
        initStats(cacheEnabled);
        
        // Initialize Tool Cards
        initToolCards();
        
        // Check Browser Compatibility
        checkBrowserSupport();
        
        // Log System Info
        logSystemInfo();
        
        // Update page title
        document.title = APP.name + ' - ' + APP.tagline;
        
        console.log('Cache enabled: ' + cacheEnabled);
    }

    // ============================================
    // LIVE CLOCK
    // ============================================
    function initLiveClock() {
        const clockDisplay = document.getElementById('clockDisplay');
        if (!clockDisplay) return;
        
        function updateClock() {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            clockDisplay.textContent = hours + ':' + minutes + ':' + seconds;
        }
        
        updateClock();
        setInterval(updateClock, 1000);
    }

    // ============================================
    // STATS SYSTEM
    // ============================================
    function initStats(cacheEnabled) {
        const visitCountEl = document.getElementById('visitCount');
        const fileCountEl = document.getElementById('fileCount');
        
        if (!visitCountEl || !fileCountEl) return;
        
        if (cacheEnabled) {
            let visits = parseInt(localStorage.getItem('izero-pdf-visits')) || 0;
            visits++;
            localStorage.setItem('izero-pdf-visits', visits);
            visitCountEl.textContent = visits;
            
            let files = parseInt(localStorage.getItem('izero-pdf-files-converted')) || 0;
            fileCountEl.textContent = files;
            
            document.addEventListener('fileConverted', function(e) {
                const count = parseInt(localStorage.getItem('izero-pdf-files-converted')) || 0;
                const newCount = count + 1;
                localStorage.setItem('izero-pdf-files-converted', newCount);
                fileCountEl.textContent = newCount;
            });
        } else {
            visitCountEl.textContent = '—';
            fileCountEl.textContent = '—';
        }
    }

    window.incrementFileCount = function() {
        const event = new CustomEvent('fileConverted');
        document.dispatchEvent(event);
    };

    // ============================================
    // REGISTER SERVICE WORKER - FIXED!
    // ============================================
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            // ✅ FIXED: Use the correct path based on current location
            const currentPath = window.location.pathname;
            let swPath = '/sw.js';
            
            // If we're in a subfolder, use the subfolder path
            if (currentPath.includes('/i-Zero-PDF/')) {
                swPath = '/i-Zero-PDF/sw.js';
            } else if (currentPath.includes('/izero-pdf-toolkit/')) {
                swPath = '/izero-pdf-toolkit/sw.js';
            } else if (currentPath.includes('/izero/')) {
                swPath = '/izero/sw.js';
            }
            
            console.log('Registering Service Worker at:', swPath);
            
            navigator.serviceWorker
                .register(swPath)
                .then(function(registration) {
                    console.log('Service Worker registered successfully from:', swPath);
                })
                .catch(function(err) {
                    console.warn('Service Worker registration failed:', err);
                    // Don't redirect on failure - just log it
                });
        }
    }

    // ============================================
    // TOOL CARDS
    // ============================================
    function initToolCards() {
        const cards = document.querySelectorAll('.tool-card[data-tool]');
        cards.forEach(function(card) {
            card.addEventListener('click', function() {
                const tool = this.dataset.tool;
                if (tool && typeof Router !== 'undefined') {
                    Router.navigate(tool);
                }
            });
        });
    }

    // ============================================
    // BROWSER COMPATIBILITY
    // ============================================
    function checkBrowserSupport() {
        const requirements = {
            'File API': 'File' in window,
            'Blob': 'Blob' in window,
            'URL API': 'URL' in window && 'createObjectURL' in URL,
            'Canvas': 'HTMLCanvasElement' in window,
            'WebAssembly': 'WebAssembly' in window,
            'ES6': typeof Promise !== 'undefined'
        };
        
        const missing = Object.entries(requirements)
            .filter(function(item) { return !item[1]; })
            .map(function(item) { return item[0]; });
        
        if (missing.length > 0) {
            console.warn('Missing browser features:', missing);
        } else {
            console.log('All required features supported');
        }
    }

    // ============================================
    // SYSTEM INFO
    // ============================================
    function logSystemInfo() {
        const info = {
            app: APP.name,
            version: APP.version,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            onLine: navigator.onLine,
            hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
            deviceMemory: navigator.deviceMemory || 'unknown',
            touchSupport: 'ontouchstart' in window,
            screenSize: screen.width + 'x' + screen.height
        };
        
        console.log('System Info:', info);
    }

    // ============================================
    // THEME MANAGER
    // ============================================
    window.ThemeManager = {
        init: function() {
            const saved = localStorage.getItem('izero-pdf-theme') || 'light';
            this.setTheme(saved);
            
            const toggle = document.getElementById('themeToggle');
            if (toggle) {
                toggle.addEventListener('click', function() {
                    const current = ThemeManager.getCurrentTheme();
                    const next = current === 'light' ? 'dark' : 'light';
                    ThemeManager.setTheme(next);
                });
            }
        },
        
        getCurrentTheme: function() {
            return document.documentElement.getAttribute('data-theme') || 'light';
        },
        
        setTheme: function(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            
            const link = document.getElementById('themeStyles');
            if (link) {
                link.href = 'css/theme-' + theme + '.css';
            }
            
            localStorage.setItem('izero-pdf-theme', theme);
            
            const toggle = document.getElementById('themeToggle');
            if (toggle) {
                const icon = toggle.querySelector('.material-symbols-outlined');
                if (icon) {
                    icon.textContent = theme === 'light' ? 'dark_mode' : 'light_mode';
                }
            }
            
            const metaTheme = document.querySelector('meta[name="theme-color"]');
            if (metaTheme) {
                metaTheme.content = theme === 'light' ? '#1a73e8' : '#1e2022';
            }
            
            console.log('Theme set to: ' + theme);
        }
    };

    // ============================================
    // TOAST SYSTEM
    // ============================================
    window.showToast = function(type, message, duration) {
        duration = duration || 4000;
        
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = 'toast ' + type;
        
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(function() {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(function() {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, duration);
    };

    // ============================================
    // PROGRESS SYSTEM
    // ============================================
    window.showProgress = function(show, percentage, text) {
        percentage = percentage || 0;
        text = text || '';
        
        const container = document.querySelector('.progress-container');
        const bar = document.querySelector('.progress-bar');
        const textEl = document.querySelector('.progress-text');
        
        if (!container) {
            const main = document.querySelector('main');
            if (main) {
                const newContainer = document.createElement('div');
                newContainer.className = 'progress-container';
                newContainer.innerHTML = '<div class="progress-bar"></div><div class="progress-text"></div>';
                main.appendChild(newContainer);
                return window.showProgress(show, percentage, text);
            }
            return;
        }
        
        if (show) {
            container.classList.add('active');
            if (bar) bar.style.width = Math.min(100, percentage) + '%';
            if (textEl) textEl.textContent = text || Math.round(percentage) + '%';
        } else {
            container.classList.remove('active');
            if (bar) bar.style.width = '0%';
            if (textEl) textEl.textContent = '';
        }
    };

    window.handleError = function(error, context) {
        context = context || '';
        console.error('Error in ' + context + ':', error);
        showToast('error', context + ': ' + error.message);
    };

    window.App = {
        version: APP.version,
        name: APP.name,
        ThemeManager: window.ThemeManager,
        incrementFileCount: window.incrementFileCount
    };

    console.log(APP.name + ' v' + APP.version + ' ready!');
})();