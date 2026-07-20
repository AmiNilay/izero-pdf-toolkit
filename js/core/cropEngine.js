/**
 * CropEngine - Image cropping engine with interactive preview
 */

const CropEngine = (function() {
    'use strict';

    let cropState = {
        image: null,
        canvas: null,
        ctx: null,
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
        isDragging: false,
        isDrawing: false,
        cropRect: null,
        originalImage: null
    };

    /**
     * Initialize crop tool
     */
    function initCrop(canvas, image) {
        const ctx = canvas.getContext('2d');
        
        cropState.image = image;
        cropState.canvas = canvas;
        cropState.ctx = ctx;
        cropState.originalImage = image;
        
        // Set canvas size to image dimensions or fit in container
        const containerWidth = canvas.parentElement.clientWidth - 20;
        const containerHeight = 500;
        const ratio = Math.min(containerWidth / image.width, containerHeight / image.height);
        const displayWidth = Math.min(image.width, containerWidth);
        const displayHeight = Math.min(image.height, containerHeight);
        
        canvas.width = image.width;
        canvas.height = image.height;
        canvas.style.maxWidth = '100%';
        canvas.style.height = 'auto';
        
        // Draw image
        drawImage();
        
        // Add event listeners
        setupEventListeners(canvas);
        
        // Reset crop state
        cropState.cropRect = null;
        cropState.isDragging = false;
        cropState.isDrawing = false;
        
        return {
            canvas,
            width: image.width,
            height: image.height
        };
    }

    /**
     * Set up event listeners for cropping
     */
    function setupEventListeners(canvas) {
        // Remove old listeners
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('mouseup', onMouseUp);
        canvas.removeEventListener('mouseleave', onMouseUp);
        
        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mouseup', onMouseUp);
        canvas.addEventListener('mouseleave', onMouseUp);
        
        // Touch events for mobile
        canvas.removeEventListener('touchstart', onTouchStart);
        canvas.removeEventListener('touchmove', onTouchMove);
        canvas.removeEventListener('touchend', onTouchEnd);
        
        canvas.addEventListener('touchstart', onTouchStart, { passive: false });
        canvas.addEventListener('touchmove', onTouchMove, { passive: false });
        canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    }

    /**
     * Mouse events
     */
    function onMouseDown(e) {
        const rect = cropState.canvas.getBoundingClientRect();
        const scaleX = cropState.canvas.width / rect.width;
        const scaleY = cropState.canvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        cropState.isDragging = true;
        cropState.isDrawing = true;
        cropState.startX = Math.max(0, Math.min(x, cropState.canvas.width));
        cropState.startY = Math.max(0, Math.min(y, cropState.canvas.height));
        cropState.endX = cropState.startX;
        cropState.endY = cropState.startY;
        cropState.cropRect = null;
    }

    function onMouseMove(e) {
        if (!cropState.isDragging) return;
        
        const rect = cropState.canvas.getBoundingClientRect();
        const scaleX = cropState.canvas.width / rect.width;
        const scaleY = cropState.canvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        cropState.endX = Math.max(0, Math.min(x, cropState.canvas.width));
        cropState.endY = Math.max(0, Math.min(y, cropState.canvas.height));
        
        drawCropSelection();
    }

    function onMouseUp(e) {
        if (cropState.isDragging) {
            cropState.isDragging = false;
            cropState.isDrawing = false;
            
            // Store final crop rectangle
            const x = Math.min(cropState.startX, cropState.endX);
            const y = Math.min(cropState.startY, cropState.endY);
            const width = Math.abs(cropState.endX - cropState.startX);
            const height = Math.abs(cropState.endY - cropState.startY);
            
            if (width > 5 && height > 5) {
                cropState.cropRect = { x, y, width, height };
                updateCropInfo(x, y, width, height);
            }
        }
    }

    /**
     * Touch events for mobile
     */
    function onTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        onMouseDown(mouseEvent);
    }

    function onTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        onMouseMove(mouseEvent);
    }

    function onTouchEnd(e) {
        e.preventDefault();
        onMouseUp(e);
    }

    /**
     * Draw the image and crop selection
     */
    function drawImage() {
        const ctx = cropState.ctx;
        ctx.clearRect(0, 0, cropState.canvas.width, cropState.canvas.height);
        ctx.drawImage(cropState.image, 0, 0);
    }

    function drawCropSelection() {
        const ctx = cropState.ctx;
        const canvas = cropState.canvas;
        
        // Redraw image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(cropState.image, 0, 0);
        
        // Draw selection rectangle
        const x = Math.min(cropState.startX, cropState.endX);
        const y = Math.min(cropState.startY, cropState.endY);
        const width = Math.abs(cropState.endX - cropState.startX);
        const height = Math.abs(cropState.endY - cropState.startY);
        
        if (width > 1 && height > 1) {
            // Semi-transparent overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(0, 0, canvas.width, y);
            ctx.fillRect(0, y + height, canvas.width, canvas.height - y - height);
            ctx.fillRect(0, y, x, height);
            ctx.fillRect(x + width, y, canvas.width - x - width, height);
            
            // Border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(x, y, width, height);
            ctx.setLineDash([]);
            
            // Corner handles
            const handleSize = 8;
            ctx.fillStyle = '#fff';
            const corners = [
                [x, y], [x + width, y],
                [x, y + height], [x + width, y + height]
            ];
            for (const [cx, cy] of corners) {
                ctx.fillRect(cx - handleSize/2, cy - handleSize/2, handleSize, handleSize);
            }
            
            // Dimensions display
            ctx.fillStyle = '#fff';
            ctx.font = '14px sans-serif';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 4;
            ctx.fillText(`${Math.round(width)} × ${Math.round(height)}`, x + 10, y - 10);
            ctx.shadowBlur = 0;
        }
    }

    /**
     * Update crop info display
     */
    function updateCropInfo(x, y, width, height) {
        const infoEl = document.getElementById('cropInfo');
        if (infoEl) {
            infoEl.innerHTML = `
                <strong>Crop Selection:</strong><br>
                X: ${Math.round(x)}px &nbsp;|&nbsp; Y: ${Math.round(y)}px<br>
                Width: ${Math.round(width)}px &nbsp;|&nbsp; Height: ${Math.round(height)}px<br>
                Aspect Ratio: ${(width/height).toFixed(2)}
            `;
        }
    }

    /**
     * Execute crop
     */
    function executeCrop() {
        if (!cropState.cropRect) {
            throw new Error('No crop selection made');
        }
        
        const { x, y, width, height } = cropState.cropRect;
        const canvas = CanvasHelpers.cropImage(cropState.originalImage, x, y, width, height);
        
        return canvas;
    }

    /**
     * Reset crop
     */
    function resetCrop() {
        cropState.cropRect = null;
        cropState.isDragging = false;
        cropState.isDrawing = false;
        drawImage();
        
        const infoEl = document.getElementById('cropInfo');
        if (infoEl) {
            infoEl.innerHTML = 'No selection made. Click and drag on the image to select crop area.';
        }
    }

    /**
     * Get crop coordinates
     */
    function getCropCoordinates() {
        if (!cropState.cropRect) return null;
        return cropState.cropRect;
    }

    /**
     * Set crop from coordinates
     */
    function setCropFromCoordinates(x, y, width, height) {
        cropState.startX = x;
        cropState.startY = y;
        cropState.endX = x + width;
        cropState.endY = y + height;
        cropState.cropRect = { x, y, width, height };
        drawCropSelection();
        updateCropInfo(x, y, width, height);
    }

    // Public API
    return {
        initCrop,
        executeCrop,
        resetCrop,
        getCropCoordinates,
        setCropFromCoordinates
    };

})();

// Make CropEngine globally available
window.CropEngine = CropEngine;