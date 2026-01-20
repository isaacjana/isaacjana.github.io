/**
 * CanvasEngine handles the drawing of Hanzi and stroke validation.
 */
class CanvasEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.strokes = [];
        this.setupEventListeners();
        this.clear();
    }

    setupEventListeners() {
        // PC
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseleave', () => this.stopDrawing());

        // Mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        }, { passive: false });
    }

    getPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }

    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getPos(e);
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        this.currentStroke = [{ x: pos.x, y: pos.y }];
    }

    draw(e) {
        if (!this.isDrawing) return;
        const pos = this.getPos(e);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.lineWidth = 10;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = '#2D5A27'; // Dark Jade
        this.ctx.stroke();
        this.currentStroke.push({ x: pos.x, y: pos.y });
    }

    stopDrawing() {
        if (this.isDrawing) {
            this.strokes.push(this.currentStroke);
            this.isDrawing = false;
        }
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        this.strokes = [];
    }

    drawGrid() {
        this.ctx.strokeStyle = '#E2E8F0';
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height / 2);
        this.ctx.lineTo(this.canvas.width, this.canvas.height / 2);
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    /**
     * Mock predict function for TensorFlow.js validation.
     * In a real app, this would use a loaded model.
     */
    async predict() {
        // Create 64x64 greyscale data as requested
        const offscreen = document.createElement('canvas');
        offscreen.width = 64;
        offscreen.height = 64;
        const oCtx = offscreen.getContext('2d');

        // Fill white background (AI models often expect white background / black strokes or vice versa)
        oCtx.fillStyle = '#ffffff';
        oCtx.fillRect(0, 0, 64, 64);

        // Draw the current canvas content onto the 64x64 one
        oCtx.drawImage(this.canvas, 0, 0, 64, 64);

        // Get image data for "processing"
        const imageData = oCtx.getImageData(0, 0, 64, 64);
        const data = imageData.data;

        // Mock processing: check if there's enough "ink" in the canvas
        let inkCount = 0;
        for (let i = 0; i < data.length; i += 4) {
            // Check if pixel is not white (simplistic ink detection)
            if (data[i] < 200) inkCount++;
        }

        return new Promise((resolve) => {
            setTimeout(() => {
                // If they drew something, we'll give them a match for this demo
                // In a real app, this would be `model.predict(tensor)`
                const hasDrawnEnough = inkCount > 50;
                resolve({
                    match: hasDrawnEnough,
                    confidence: hasDrawnEnough ? 0.92 : 0.15
                });
            }, 600);
        });
    }

    /**
     * Shows a ghost character to trace
     */
    drawGhost(char) {
        this.ctx.font = `${this.canvas.width * 0.8}px 'ZCOOL KuaiLe', sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = 'rgba(45, 90, 39, 0.1)';
        this.ctx.fillText(char, this.canvas.width / 2, this.canvas.height * 0.55);
    }
}

export default CanvasEngine;
