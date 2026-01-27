/**
 * Renderer - handles all canvas drawing for the game
 * Displays row/column sum targets on the edges
 */
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.grid = null;
        this.cellSize = 0;
        this.padding = 20;
        this.targetAreaSize = 40; // Space for row/column targets
        this.animationManager = new AnimationManager();

        // Visual settings
        this.colors = {
            background: '#E8DCC4',
            gridLines: '#D4C8B0',
            stoneNormal: '#7A7A7A',
            stoneNormalGradientLight: '#9A9A9A',
            stoneNormalGradientDark: '#5A5A5A',
            stoneMoss: '#5D6B5D',
            stoneBlocker: '#2D2D2D',
            stoneBooster: '#8BA87B',
            stoneBoosterGlow: '#B8D4A8',
            text: '#FFFFFF',
            textDark: '#3A3A3A',
            target: '#D4A84B',
            targetComplete: '#7EB86B',
            targetOver: '#C75050',
            ripple: 'rgba(126, 184, 201, 0.6)',
            shadow: 'rgba(0, 0, 0, 0.2)'
        };

        // Animation state
        this.ripples = [];
        this.floatingTexts = [];
        this.numberScales = {};
        this.completedRows = new Set();
        this.completedCols = new Set();
        this.winAnimation = null;

        // Bind the render loop
        this.boundRenderLoop = this.renderLoop.bind(this);
    }

    /**
     * Initialize the canvas for a grid
     */
    init(grid) {
        this.grid = grid;
        this.resize();
        this.completedRows.clear();
        this.completedCols.clear();
        this.numberScales = {};
        this.startRenderLoop();
    }

    /**
     * Resize canvas to fit the grid
     */
    resize() {
        if (!this.grid) return;

        const container = this.canvas.parentElement;
        let containerWidth = container.clientWidth - this.padding * 2;
        let containerHeight = container.clientHeight - this.padding * 2;

        // Fallback if container isn't visible yet
        if (containerWidth <= 0 || containerHeight <= 0) {
            containerWidth = window.innerWidth - this.padding * 2 - 40;
            containerHeight = window.innerHeight - 200;
        }

        // Account for target areas
        const availableWidth = containerWidth - this.targetAreaSize;
        const availableHeight = containerHeight - this.targetAreaSize;

        // Calculate cell size to fit grid
        const maxCellSize = Math.min(
            availableWidth / this.grid.size,
            availableHeight / this.grid.size,
            70 // Maximum cell size
        );

        this.cellSize = Math.max(Math.floor(maxCellSize), 30); // Minimum 30px cells
        const gridSize = this.cellSize * this.grid.size;

        // Set canvas size (grid + target areas + padding)
        this.canvas.width = gridSize + this.targetAreaSize + this.padding * 2;
        this.canvas.height = gridSize + this.targetAreaSize + this.padding * 2;

        // Set CSS size for proper display
        this.canvas.style.width = `${this.canvas.width}px`;
        this.canvas.style.height = `${this.canvas.height}px`;
    }

    /**
     * Start the render loop
     */
    startRenderLoop() {
        this.isRendering = true;
        this.renderLoop();
    }

    /**
     * Stop the render loop
     */
    stopRenderLoop() {
        this.isRendering = false;
    }

    /**
     * Main render loop
     */
    renderLoop() {
        if (!this.isRendering) return;

        this.render();

        if (this.animationManager.hasAnimations() || this.ripples.length > 0 || this.floatingTexts.length > 0 || this.winAnimation) {
            requestAnimationFrame(this.boundRenderLoop);
        } else {
            setTimeout(() => requestAnimationFrame(this.boundRenderLoop), 100);
        }
    }

    /**
     * Main render function
     */
    render() {
        const ctx = this.ctx;

        // Clear canvas
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw sand pattern
        this.drawSandPattern();

        // Draw column targets (top)
        this.drawColumnTargets();

        // Draw row targets (right)
        this.drawRowTargets();

        // Draw cells
        for (let y = 0; y < this.grid.size; y++) {
            for (let x = 0; x < this.grid.size; x++) {
                this.drawCell(x, y);
            }
        }

        // Draw ripples
        this.drawRipples();

        // Draw floating texts
        this.drawFloatingTexts();

        // Draw win animation
        if (this.winAnimation) {
            this.winAnimation.draw(ctx);
        }
    }

    /**
     * Draw sand pattern background
     */
    drawSandPattern() {
        const ctx = this.ctx;
        ctx.save();

        ctx.strokeStyle = this.colors.gridLines;
        ctx.lineWidth = 1;

        const spacing = 12;
        for (let i = 0; i < this.canvas.width; i += spacing) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            for (let y = 0; y < this.canvas.height; y += 20) {
                const offset = Math.sin(y / 40 + i / 100) * 2;
                ctx.lineTo(i + offset, y);
            }
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * Get the starting X position for the grid (after column for row targets)
     */
    getGridStartX() {
        return this.padding;
    }

    /**
     * Get the starting Y position for the grid (after row for column targets)
     */
    getGridStartY() {
        return this.padding + this.targetAreaSize;
    }

    /**
     * Draw column targets at the top
     */
    drawColumnTargets() {
        const ctx = this.ctx;
        const startX = this.getGridStartX();
        const y = this.padding + this.targetAreaSize / 2;

        for (let col = 0; col < this.grid.size; col++) {
            const x = startX + col * this.cellSize + this.cellSize / 2;
            const target = this.grid.colTargets[col];
            const current = this.grid.getColSum(col);
            const isComplete = current === target;
            const isOver = current > target;

            // Draw background circle
            ctx.beginPath();
            ctx.arc(x, y, 16, 0, Math.PI * 2);
            if (isComplete) {
                ctx.fillStyle = this.colors.targetComplete;
            } else if (isOver) {
                ctx.fillStyle = this.colors.targetOver;
            } else {
                ctx.fillStyle = this.colors.target;
            }
            ctx.fill();

            // Draw target number
            ctx.font = 'bold 14px sans-serif';
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(target.toString(), x, y);

            // Draw current sum below if not zero
            if (current > 0 && !isComplete) {
                ctx.font = '11px sans-serif';
                ctx.fillStyle = isOver ? this.colors.targetOver : this.colors.textDark;
                ctx.fillText(current.toString(), x, y + 22);
            }
        }
    }

    /**
     * Draw row targets on the right
     */
    drawRowTargets() {
        const ctx = this.ctx;
        const startY = this.getGridStartY();
        const x = this.getGridStartX() + this.grid.size * this.cellSize + this.targetAreaSize / 2;

        for (let row = 0; row < this.grid.size; row++) {
            const y = startY + row * this.cellSize + this.cellSize / 2;
            const target = this.grid.rowTargets[row];
            const current = this.grid.getRowSum(row);
            const isComplete = current === target;
            const isOver = current > target;

            // Draw background circle
            ctx.beginPath();
            ctx.arc(x, y, 16, 0, Math.PI * 2);
            if (isComplete) {
                ctx.fillStyle = this.colors.targetComplete;
            } else if (isOver) {
                ctx.fillStyle = this.colors.targetOver;
            } else {
                ctx.fillStyle = this.colors.target;
            }
            ctx.fill();

            // Draw target number
            ctx.font = 'bold 14px sans-serif';
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(target.toString(), x, y);

            // Draw current sum below if not zero
            if (current > 0 && !isComplete) {
                ctx.font = '11px sans-serif';
                ctx.fillStyle = isOver ? this.colors.targetOver : this.colors.textDark;
                ctx.fillText(current.toString(), x, y + 22);
            }
        }
    }

    /**
     * Draw a single cell
     */
    drawCell(x, y) {
        const ctx = this.ctx;
        const cell = this.grid.getCell(x, y);
        if (!cell) return;

        const centerX = this.getGridStartX() + x * this.cellSize + this.cellSize / 2;
        const centerY = this.getGridStartY() + y * this.cellSize + this.cellSize / 2;
        const radius = this.cellSize * 0.4;

        ctx.save();

        // Draw shadow
        ctx.beginPath();
        ctx.arc(centerX + 3, centerY + 3, radius, 0, Math.PI * 2);
        ctx.fillStyle = this.colors.shadow;
        ctx.fill();

        // Draw stone based on type
        this.drawStone(ctx, centerX, centerY, radius, cell);

        // Draw tap limit indicator
        if (cell.type !== CellType.BLOCKER) {
            this.drawTapIndicator(ctx, centerX, centerY, radius, cell);
        }

        // Draw current value
        if (cell.type !== CellType.BLOCKER && cell.value > 0) {
            this.drawValue(ctx, centerX, centerY, cell);
        }

        // Draw "used up" overlay if cell can no longer be tapped
        if (cell.type !== CellType.BLOCKER && !cell.canTap() && cell.maxTaps > 0) {
            this.drawUsedOverlay(ctx, centerX, centerY, radius);
        }

        ctx.restore();
    }

    /**
     * Draw tap limit indicator (dots showing remaining taps)
     */
    drawTapIndicator(ctx, x, y, radius, cell) {
        if (cell.maxTaps <= 0) return;

        const remainingTaps = cell.maxTaps - cell.tapCount;
        const dotRadius = 4;
        const dotY = y - radius - 8;

        const dotsToShow = Math.min(remainingTaps, 3);
        const totalWidth = dotsToShow * dotRadius * 2 + (dotsToShow - 1) * 4;
        let startX = x - totalWidth / 2 + dotRadius;

        for (let i = 0; i < dotsToShow; i++) {
            ctx.beginPath();
            ctx.arc(startX + i * (dotRadius * 2 + 4), dotY, dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#7EB8C9';
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    /**
     * Draw overlay for cells that can no longer be tapped
     */
    drawUsedOverlay(ctx, x, y, radius) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
    }

    /**
     * Draw stone shape
     */
    drawStone(ctx, x, y, radius, cell) {
        let gradient;
        let strokeColor;

        switch (cell.type) {
            case CellType.BLOCKER:
                gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
                gradient.addColorStop(0, '#4A4A4A');
                gradient.addColorStop(1, this.colors.stoneBlocker);
                strokeColor = '#1A1A1A';
                break;

            case CellType.BOOSTER:
                gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
                gradient.addColorStop(0, this.colors.stoneBoosterGlow);
                gradient.addColorStop(1, this.colors.stoneBooster);
                strokeColor = '#6B8B6B';

                // Draw glow effect
                ctx.beginPath();
                ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(184, 212, 168, 0.3)';
                ctx.fill();
                break;

            default: // Normal
                gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
                gradient.addColorStop(0, this.colors.stoneNormalGradientLight);
                gradient.addColorStop(1, this.colors.stoneNormalGradientDark);
                strokeColor = '#4A4A4A';
        }

        // Draw stone body
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw stone outline
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw highlight
        ctx.beginPath();
        ctx.arc(x - radius * 0.25, y - radius * 0.25, radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
    }

    /**
     * Draw current value on cell
     */
    drawValue(ctx, x, y, cell) {
        const cellKey = `${cell.x},${cell.y}`;
        const scale = this.numberScales[cellKey] || 1;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        const fontSize = Math.floor(this.cellSize * 0.4);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw text shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillText(cell.value.toString(), 1, 1);

        // Draw text
        ctx.fillStyle = this.colors.text;
        ctx.fillText(cell.value.toString(), 0, 0);

        ctx.restore();
    }

    /**
     * Add ripple animation at cell position
     */
    addRipple(cellX, cellY) {
        const x = this.getGridStartX() + cellX * this.cellSize + this.cellSize / 2;
        const y = this.getGridStartY() + cellY * this.cellSize + this.cellSize / 2;

        const ripple = new RippleAnimation(x, y, this.cellSize, this.cellSize * 1.5, this.colors.ripple);
        this.ripples.push(ripple);
        this.animationManager.add(ripple);
    }

    /**
     * Draw all ripples
     */
    drawRipples() {
        this.ripples = this.ripples.filter(ripple => !ripple.isComplete());
        for (const ripple of this.ripples) {
            ripple.draw(this.ctx);
        }
    }

    /**
     * Add number pop animation
     */
    addNumberPop(cellX, cellY, addedValue) {
        const cellKey = `${cellX},${cellY}`;

        const anim = new NumberPopAnimation(cellX, cellY, addedValue, () => {
            this.numberScales[cellKey] = anim.scale;
        });

        this.animationManager.add(anim);

        // Add floating +N text
        const x = this.getGridStartX() + cellX * this.cellSize + this.cellSize / 2;
        const y = this.getGridStartY() + cellY * this.cellSize + this.cellSize / 2 - 20;

        const floatAnim = new FloatingPlusAnimation(x, y, addedValue);
        this.floatingTexts.push(floatAnim);
        this.animationManager.add(floatAnim);
    }

    /**
     * Draw floating texts
     */
    drawFloatingTexts() {
        this.floatingTexts = this.floatingTexts.filter(text => !text.isComplete());
        for (const text of this.floatingTexts) {
            text.draw(this.ctx);
        }
    }

    /**
     * Start win celebration
     */
    startWinCelebration() {
        this.winAnimation = new WinCelebrationAnimation(
            this.canvas.width,
            this.canvas.height,
            () => this.render()
        );
        this.animationManager.add(this.winAnimation);

        setTimeout(() => {
            this.winAnimation = null;
        }, 2000);
    }

    /**
     * Reset visual state
     */
    reset() {
        this.completedRows.clear();
        this.completedCols.clear();
        this.numberScales = {};
        this.ripples = [];
        this.floatingTexts = [];
        this.winAnimation = null;
        this.animationManager.clear();
    }

    /**
     * Get cell coordinates from canvas position
     */
    getCellFromPosition(canvasX, canvasY) {
        const gridStartX = this.getGridStartX();
        const gridStartY = this.getGridStartY();

        const x = Math.floor((canvasX - gridStartX) / this.cellSize);
        const y = Math.floor((canvasY - gridStartY) / this.cellSize);

        if (x >= 0 && x < this.grid.size && y >= 0 && y < this.grid.size) {
            return { x, y };
        }
        return null;
    }

    /**
     * Convert page coordinates to canvas coordinates
     */
    pageToCanvas(pageX, pageY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        return {
            x: (pageX - rect.left) * scaleX,
            y: (pageY - rect.top) * scaleY
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Renderer };
}
