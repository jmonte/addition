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
            // Button colors
            buttonNormalFace: '#A0A0A0',
            buttonNormalTop: '#B8B8B8',
            buttonNormalEdge: '#707070',
            buttonNormalBottom: '#505050',
            buttonBlockerFace: '#3A3A3A',
            buttonBlockerTop: '#505050',
            buttonBlockerEdge: '#252525',
            buttonBlockerBottom: '#1A1A1A',
            buttonBoosterFace: '#8BC87B',
            buttonBoosterTop: '#A8E098',
            buttonBoosterEdge: '#6BA86B',
            buttonBoosterBottom: '#4A8A4A',
            buttonBoosterGlow: 'rgba(139, 200, 123, 0.4)',
            text: '#FFFFFF',
            textDark: '#3A3A3A',
            target: '#D4A84B',
            targetComplete: '#7EB86B',
            targetOver: '#C75050',
            ripple: 'rgba(126, 184, 201, 0.6)',
            shadow: 'rgba(0, 0, 0, 0.25)'
        };

        // Animation state
        this.ripples = [];
        this.floatingTexts = [];
        this.numberScales = {};
        this.completedRows = new Set();
        this.completedCols = new Set();
        this.winAnimation = null;
        this.hintAnimation = null;
        this.buttonPressOffsets = {};

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

        if (this.animationManager.hasAnimations() || this.ripples.length > 0 || this.floatingTexts.length > 0 || this.winAnimation || this.hintAnimation) {
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

        // Clear canvas with transparency (blends with page background)
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw column targets (top)
        this.drawColumnTargets();

        // Draw row targets (right)
        this.drawRowTargets();

        // Draw hint (before cells so it appears behind)
        this.drawHint();

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

        // Get press offset for this cell
        const cellKey = `${x},${y}`;
        const pressOffset = this.buttonPressOffsets[cellKey] || 0;

        // Button dimensions (larger to reduce gaps between cells)
        const buttonWidth = radius * 2.3;
        const buttonHeight = radius * 2.1;

        ctx.save();

        // Draw rectangular shadow (offset decreases during press)
        const shadowOffset = Math.max(3 - pressOffset * 0.5, 1);
        this.drawRoundedRect(
            ctx,
            centerX - buttonWidth / 2 + shadowOffset,
            centerY - buttonHeight / 2 + shadowOffset + pressOffset,
            buttonWidth,
            buttonHeight,
            6
        );
        ctx.fillStyle = this.colors.shadow;
        ctx.fill();

        // Draw button based on type
        this.drawButton(ctx, centerX, centerY, buttonWidth, buttonHeight, cell, pressOffset);

        // Draw tap limit indicator
        if (cell.type !== CellType.BLOCKER) {
            this.drawTapIndicator(ctx, centerX, centerY + pressOffset, radius, cell);
        }

        // Draw current value
        if (cell.type !== CellType.BLOCKER && cell.value > 0) {
            this.drawValue(ctx, centerX, centerY, cell, pressOffset);
        }

        // Draw "used up" overlay if cell can no longer be tapped
        if (cell.type !== CellType.BLOCKER && !cell.canTap() && cell.maxTaps > 0) {
            this.drawUsedOverlay(ctx, centerX, centerY, buttonWidth, buttonHeight, cell, pressOffset);
        }

        ctx.restore();
    }

    /**
     * Draw a rounded rectangle path
     */
    drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
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
    drawUsedOverlay(ctx, x, y, width, height, cell, pressOffset = 0) {
        this.drawRoundedRect(
            ctx,
            x - width / 2,
            y - height / 2 + pressOffset,
            width,
            height,
            6
        );
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
    }

    /**
     * Draw 3D button shape
     */
    drawButton(ctx, x, y, width, height, cell, pressOffset) {
        let faceColor, topColor, edgeColor, bottomColor;
        const cornerRadius = 6;
        const maxEdgeHeight = 6;
        const edgeHeight = Math.max(maxEdgeHeight - pressOffset, 1);

        // Apply press offset to Y position
        const buttonY = y + pressOffset;

        switch (cell.type) {
            case CellType.BLOCKER:
                faceColor = this.colors.buttonBlockerFace;
                topColor = this.colors.buttonBlockerTop;
                edgeColor = this.colors.buttonBlockerEdge;
                bottomColor = this.colors.buttonBlockerBottom;
                break;

            case CellType.BOOSTER:
                faceColor = this.colors.buttonBoosterFace;
                topColor = this.colors.buttonBoosterTop;
                edgeColor = this.colors.buttonBoosterEdge;
                bottomColor = this.colors.buttonBoosterBottom;

                // Draw glow effect behind button
                ctx.save();
                ctx.shadowColor = this.colors.buttonBoosterGlow;
                ctx.shadowBlur = 12;
                this.drawRoundedRect(ctx, x - width / 2, buttonY - height / 2, width, height, cornerRadius);
                ctx.fillStyle = this.colors.buttonBoosterGlow;
                ctx.fill();
                ctx.restore();
                break;

            default: // Normal
                faceColor = this.colors.buttonNormalFace;
                topColor = this.colors.buttonNormalTop;
                edgeColor = this.colors.buttonNormalEdge;
                bottomColor = this.colors.buttonNormalBottom;
        }

        // Draw bottom edge (3D depth)
        this.drawRoundedRect(
            ctx,
            x - width / 2,
            buttonY - height / 2 + edgeHeight,
            width,
            height,
            cornerRadius
        );
        ctx.fillStyle = bottomColor;
        ctx.fill();

        // Draw left/right edges
        this.drawRoundedRect(
            ctx,
            x - width / 2,
            buttonY - height / 2,
            width,
            height + edgeHeight,
            cornerRadius
        );
        ctx.fillStyle = edgeColor;
        ctx.fill();

        // Draw button face with gradient (top to bottom)
        const gradient = ctx.createLinearGradient(
            x, buttonY - height / 2,
            x, buttonY + height / 2
        );
        gradient.addColorStop(0, topColor);
        gradient.addColorStop(1, faceColor);

        this.drawRoundedRect(
            ctx,
            x - width / 2,
            buttonY - height / 2,
            width,
            height,
            cornerRadius
        );
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw top highlight line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - width / 2 + cornerRadius + 2, buttonY - height / 2 + 2);
        ctx.lineTo(x + width / 2 - cornerRadius - 2, buttonY - height / 2 + 2);
        ctx.stroke();
    }

    /**
     * Draw current value on cell
     */
    drawValue(ctx, x, y, cell, pressOffset = 0) {
        const cellKey = `${cell.x},${cell.y}`;
        const scale = this.numberScales[cellKey] || 1;

        ctx.save();
        // Apply press offset so number moves with button
        ctx.translate(x, y + pressOffset);
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
     * Add button press animation
     */
    addButtonPress(cellX, cellY) {
        const cellKey = `${cellX},${cellY}`;

        const anim = new ButtonPressAnimation(
            cellX,
            cellY,
            (pressOffset) => {
                this.buttonPressOffsets[cellKey] = pressOffset;
            },
            () => {
                // Clean up offset after animation completes
                delete this.buttonPressOffsets[cellKey];
            }
        );

        this.animationManager.add(anim);
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
     * Show hint animation on a cell
     */
    showHint(cellX, cellY) {
        // Clear any existing hint
        this.clearHint();

        const x = this.getGridStartX() + cellX * this.cellSize + this.cellSize / 2;
        const y = this.getGridStartY() + cellY * this.cellSize + this.cellSize / 2;

        this.hintAnimation = new HintPulseAnimation(x, y, this.cellSize, () => {});
        this.animationManager.add(this.hintAnimation);
    }

    /**
     * Clear hint animation
     */
    clearHint() {
        if (this.hintAnimation) {
            this.hintAnimation.stop();
            this.hintAnimation = null;
        }
    }

    /**
     * Draw hint animation
     */
    drawHint() {
        if (this.hintAnimation && !this.hintAnimation.isComplete()) {
            this.hintAnimation.draw(this.ctx);
        }
    }

    /**
     * Reset visual state
     */
    reset() {
        this.completedRows.clear();
        this.completedCols.clear();
        this.numberScales = {};
        this.buttonPressOffsets = {};
        this.ripples = [];
        this.floatingTexts = [];
        this.winAnimation = null;
        this.clearHint();
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
