/**
 * Image Editor Engine - Core editing functions
 */

const ImageEditorEngine = (function() {
    'use strict';

    /**
     * Apply circle crop
     */
    function circleCrop(image) {
        var canvas = document.createElement('canvas');
        var size = Math.min(image.width, image.height);
        canvas.width = size;
        canvas.height = size;
        var ctx = canvas.getContext('2d');
        
        var x = (image.width - size) / 2;
        var y = (image.height - size) / 2;

        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(image, x, y, size, size, 0, 0, size, size);

        return canvas;
    }

    /**
     * Apply square crop
     */
    function squareCrop(image) {
        var canvas = document.createElement('canvas');
        var size = Math.min(image.width, image.height);
        canvas.width = size;
        canvas.height = size;
        var ctx = canvas.getContext('2d');
        
        var x = (image.width - size) / 2;
        var y = (image.height - size) / 2;

        ctx.drawImage(image, x, y, size, size, 0, 0, size, size);

        return canvas;
    }

    /**
     * Apply rounded corners
     */
    function roundCorners(image, radius) {
        var canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        var ctx = canvas.getContext('2d');

        var w = canvas.width;
        var h = canvas.height;
        var r = Math.min(radius || 30, Math.min(w, h) / 2);

        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(w - r, 0);
        ctx.quadraticCurveTo(w, 0, w, r);
        ctx.lineTo(w, h - r);
        ctx.quadraticCurveTo(w, h, w - r, h);
        ctx.lineTo(r, h);
        ctx.quadraticCurveTo(0, h, 0, h - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(image, 0, 0);

        return canvas;
    }

    /**
     * Add watermark
     */
    function addWatermark(image, text, position, opacity) {
        var canvas = CanvasHelpers.imageToCanvas(image);
        var ctx = canvas.getContext('2d');

        var fontSize = Math.min(canvas.width, canvas.height) / 12;
        ctx.font = 'bold ' + fontSize + 'px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        var x = canvas.width / 2;
        var y = canvas.height / 2;

        switch(position) {
            case 'top-left':
                x = fontSize * 2;
                y = fontSize * 2;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                break;
            case 'top-center':
                x = canvas.width / 2;
                y = fontSize * 2;
                ctx.textBaseline = 'top';
                break;
            case 'top-right':
                x = canvas.width - fontSize * 2;
                y = fontSize * 2;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'top';
                break;
            case 'bottom-left':
                x = fontSize * 2;
                y = canvas.height - fontSize * 2;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'bottom';
                break;
            case 'bottom-center':
                x = canvas.width / 2;
                y = canvas.height - fontSize * 2;
                ctx.textBaseline = 'bottom';
                break;
            case 'bottom-right':
                x = canvas.width - fontSize * 2;
                y = canvas.height - fontSize * 2;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'bottom';
                break;
            default: // center
                break;
        }

        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        ctx.fillStyle = 'rgba(255, 255, 255, ' + (opacity || 0.5) + ')';
        ctx.fillText(text, x, y);

        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeText(text, x, y);

        ctx.fillStyle = 'rgba(255, 255, 255, ' + (opacity || 0.5) + ')';
        ctx.fillText(text, x, y);

        return canvas;
    }

    /**
     * Flip image horizontally or vertically
     */
    function flipImage(image, direction) {
        var canvas = CanvasHelpers.imageToCanvas(image);
        var ctx = canvas.getContext('2d');

        if (direction === 'horizontal') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        } else if (direction === 'vertical') {
            ctx.translate(0, canvas.height);
            ctx.scale(1, -1);
        }

        ctx.drawImage(image, 0, 0);

        return canvas;
    }

    return {
        circleCrop: circleCrop,
        squareCrop: squareCrop,
        roundCorners: roundCorners,
        addWatermark: addWatermark,
        flipImage: flipImage
    };

})();

window.ImageEditorEngine = ImageEditorEngine;