/**
 * State Management - Central application state
 */

const AppState = (function() {
    'use strict';

    // Private state
    const state = {
        // File states
        files: {
            pdf: null,          // Current PDF file
            images: [],         // Current image files
            cropImage: null,    // Image for cropping
            resizeImage: null,  // Image for resizing
            mergeFiles: [],     // PDFs to merge
            splitFile: null,    // PDF to split
            rotateFile: null,   // PDF to rotate
            extractFile: null   // PDF to extract images from
        },
        
        // Processing states
        processing: {
            isProcessing: false,
            progress: 0,
            status: 'idle'  // idle, processing, complete, error
        },
        
        // Results
        results: {
            pdfToImage: [],
            imageToPdf: null,
            croppedImage: null,
            resizedImage: null,
            mergedPdf: null,
            splitPdfs: [],
            rotatedPdf: null,
            extractedImages: []
        },
        
        // User preferences
        preferences: {
            theme: 'light',
            lastTool: 'home',
            recentFiles: []  // max 10
        }
    };

    // Observers
    const observers = [];

    /**
     * Subscribe to state changes
     */
    function subscribe(observer) {
        observers.push(observer);
        return () => {
            const index = observers.indexOf(observer);
            if (index > -1) observers.splice(index, 1);
        };
    }

    /**
     * Notify all observers
     */
    function notify(changes) {
        observers.forEach(observer => {
            try {
                observer(changes);
            } catch (e) {
                console.error('Observer error:', e);
            }
        });
    }

    /**
     * Get entire state or specific key
     */
    function getState(key) {
        if (key) {
            return state[key];
        }
        return state;
    }

    /**
     * Update state
     */
    function setState(updates) {
        const changes = {};
        for (const [key, value] of Object.entries(updates)) {
            if (state[key] !== value) {
                state[key] = value;
                changes[key] = value;
            }
        }
        if (Object.keys(changes).length > 0) {
            notify(changes);
        }
        return changes;
    }

    /**
     * Set a file in state
     */
    function setFile(type, file) {
        const validTypes = ['pdf', 'images', 'cropImage', 'resizeImage', 'mergeFiles', 'splitFile', 'rotateFile', 'extractFile'];
        if (!validTypes.includes(type)) {
            console.error(`Invalid file type: ${type}`);
            return false;
        }
        
        state.files[type] = file;
        
        // Add to recent files if it's a valid file
        if (file && file.name) {
            addRecentFile(file.name);
        }
        
        return true;
    }

    /**
     * Get a file from state
     */
    function getFile(type) {
        return state.files[type] || null;
    }

    /**
     * Clear a file from state
     */
    function clearFile(type) {
        if (state.files[type]) {
            state.files[type] = null;
            return true;
        }
        return false;
    }

    /**
     * Clear all files
     */
    function clearAllFiles() {
        state.files = {
            pdf: null,
            images: [],
            cropImage: null,
            resizeImage: null,
            mergeFiles: [],
            splitFile: null,
            rotateFile: null,
            extractFile: null
        };
        return true;
    }

    /**
     * Set processing state
     */
    function setProcessing(isProcessing, progress = 0, status = 'idle') {
        state.processing.isProcessing = isProcessing;
        state.processing.progress = progress;
        state.processing.status = status;
        return true;
    }

    /**
     * Get processing state
     */
    function getProcessing() {
        return state.processing;
    }

    /**
     * Set result
     */
    function setResult(type, data) {
        state.results[type] = data;
        return true;
    }

    /**
     * Get result
     */
    function getResult(type) {
        return state.results[type] || null;
    }

    /**
     * Clear all results
     */
    function clearResults() {
        state.results = {
            pdfToImage: [],
            imageToPdf: null,
            croppedImage: null,
            resizedImage: null,
            mergedPdf: null,
            splitPdfs: [],
            rotatedPdf: null,
            extractedImages: []
        };
        return true;
    }

    /**
     * Add a file to recent files
     */
    function addRecentFile(filename) {
        const recent = state.preferences.recentFiles;
        // Remove if exists
        const index = recent.indexOf(filename);
        if (index > -1) {
            recent.splice(index, 1);
        }
        // Add to front
        recent.unshift(filename);
        // Keep only last 10
        if (recent.length > 10) {
            recent.pop();
        }
        return true;
    }

    /**
     * Get recent files
     */
    function getRecentFiles() {
        return state.preferences.recentFiles;
    }

    /**
     * Save preferences to localStorage
     */
    function savePreferences() {
        try {
            localStorage.setItem('pdf-toolkit-preferences', JSON.stringify(state.preferences));
        } catch (e) {
            console.warn('Could not save preferences:', e);
        }
    }

    /**
     * Load preferences from localStorage
     */
    function loadPreferences() {
        try {
            const saved = localStorage.getItem('pdf-toolkit-preferences');
            if (saved) {
                const parsed = JSON.parse(saved);
                state.preferences = { ...state.preferences, ...parsed };
            }
        } catch (e) {
            console.warn('Could not load preferences:', e);
        }
    }

    /**
     * Reset state to defaults
     */
    function reset() {
        state.files = {
            pdf: null,
            images: [],
            cropImage: null,
            resizeImage: null,
            mergeFiles: [],
            splitFile: null,
            rotateFile: null,
            extractFile: null
        };
        state.processing = {
            isProcessing: false,
            progress: 0,
            status: 'idle'
        };
        state.results = {
            pdfToImage: [],
            imageToPdf: null,
            croppedImage: null,
            resizedImage: null,
            mergedPdf: null,
            splitPdfs: [],
            rotatedPdf: null,
            extractedImages: []
        };
        notify({ reset: true });
        return true;
    }

    // Load preferences on init
    loadPreferences();

    // Public API
    return {
        getState,
        setState,
        subscribe,
        setFile,
        getFile,
        clearFile,
        clearAllFiles,
        setProcessing,
        getProcessing,
        setResult,
        getResult,
        clearResults,
        getRecentFiles,
        savePreferences,
        loadPreferences,
        reset
    };

})();

// Make AppState globally available
window.AppState = AppState;