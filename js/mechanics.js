/**
 * MechanicsController - manages the mechanics reference page
 */
class MechanicsController {
    constructor() {
        this.container = null;
        this.canvases = [];
        this.renderers = [];
        this.grids = [];
        this.animationIntervals = [];

        // Mechanic definitions
        this.mechanics = [
            {
                id: 'basic',
                name: 'Basic Ripple',
                icon: '🪨',
                description: 'Tap a stone to add +1 to it and all orthogonal neighbors (up, down, left, right).',
                unlockCondition: 'always',
                demo: {
                    grid: 3,
                    rowTargets: [0, 0, 0],
                    colTargets: [0, 0, 0],
                    cells: [],
                    autoTap: { x: 1, y: 1 }
                }
            },
            {
                id: 'blocker',
                name: 'Blockers',
                icon: '⬛',
                description: 'Dark stones cannot be tapped and block ripples from passing through.',
                unlockCondition: 'chapter-2',
                unlockText: 'Unlocks in Chapter 2',
                demo: {
                    grid: 3,
                    rowTargets: [0, 0, 0],
                    colTargets: [0, 0, 0],
                    cells: [{ x: 1, y: 0, type: 'blocker' }],
                    autoTap: { x: 1, y: 1 }
                }
            },
            {
                id: 'booster',
                name: 'Boosters',
                icon: '✨',
                description: 'Golden stones add +2 instead of +1 when tapped, creating stronger ripples.',
                unlockCondition: 'chapter-3',
                unlockText: 'Unlocks in Chapter 3',
                demo: {
                    grid: 3,
                    rowTargets: [0, 0, 0],
                    colTargets: [0, 0, 0],
                    cells: [{ x: 1, y: 1, type: 'booster' }],
                    autoTap: { x: 1, y: 1 }
                }
            },
            {
                id: 'tapLimit',
                name: 'Tap Limits',
                icon: '🔵',
                description: 'Some stones can only be tapped a limited number of times. Blue dots show remaining taps.',
                unlockCondition: 'chapter-4',
                unlockText: 'Unlocks in Chapter 4',
                demo: {
                    grid: 3,
                    rowTargets: [0, 0, 0],
                    colTargets: [0, 0, 0],
                    cells: [{ x: 1, y: 1, maxTaps: 2 }],
                    autoTap: { x: 1, y: 1 }
                }
            },
            {
                id: 'winCondition',
                name: 'Win Condition',
                icon: '🎯',
                description: 'Match all row and column sums to their targets. Targets turn green when complete.',
                unlockCondition: 'always',
                demo: {
                    grid: 3,
                    rowTargets: [2, 3, 2],
                    colTargets: [2, 3, 2],
                    cells: [],
                    autoTap: { x: 1, y: 1 }
                }
            }
        ];
    }

    /**
     * Initialize the mechanics page
     */
    init(levelManager) {
        this.levelManager = levelManager;
        this.container = document.querySelector('.mechanics-container');
        this.render();
    }

    /**
     * Get unlock status for all mechanics
     */
    getUnlockStatus() {
        const chapters = this.levelManager.getChapters();
        return {
            basic: true,
            blocker: storage.isChapterUnlocked('chapter-2', chapters),
            booster: storage.isChapterUnlocked('chapter-3', chapters),
            tapLimit: storage.isChapterUnlocked('chapter-4', chapters),
            winCondition: true
        };
    }

    /**
     * Render all mechanic cards
     */
    render() {
        this.cleanup();
        this.container.innerHTML = '';

        const unlockStatus = this.getUnlockStatus();

        this.mechanics.forEach((mechanic, index) => {
            const isUnlocked = unlockStatus[mechanic.id];
            const card = this.createMechanicCard(mechanic, isUnlocked, index);
            this.container.appendChild(card);
        });
    }

    /**
     * Create a mechanic card element
     */
    createMechanicCard(mechanic, isUnlocked, index) {
        const card = document.createElement('div');
        card.className = `mechanic-card ${isUnlocked ? '' : 'locked'}`;

        // Demo canvas area
        const demoArea = document.createElement('div');
        demoArea.className = 'mechanic-card-demo';

        const canvas = document.createElement('canvas');
        canvas.id = `mechanic-canvas-${index}`;
        canvas.width = 120;
        canvas.height = 120;
        demoArea.appendChild(canvas);

        // Content area
        const content = document.createElement('div');
        content.className = 'mechanic-card-content';

        const header = document.createElement('div');
        header.className = 'mechanic-card-header';
        header.innerHTML = `
            <span class="mechanic-icon">${isUnlocked ? mechanic.icon : '🔒'}</span>
            <h3>${mechanic.name}</h3>
        `;

        const description = document.createElement('p');
        description.textContent = isUnlocked ? mechanic.description : 'This mechanic is locked.';

        content.appendChild(header);
        content.appendChild(description);

        if (!isUnlocked && mechanic.unlockText) {
            const lockInfo = document.createElement('div');
            lockInfo.className = 'mechanic-lock-info';
            lockInfo.textContent = mechanic.unlockText;
            content.appendChild(lockInfo);
        }

        card.appendChild(demoArea);
        card.appendChild(content);

        // Setup demo if unlocked
        if (isUnlocked && mechanic.demo) {
            // Use setTimeout to ensure canvas is in DOM
            setTimeout(() => {
                this.setupDemoCanvas(canvas, mechanic.demo, index);
            }, 100);
        } else {
            // Draw locked state
            this.drawLockedDemo(canvas);
        }

        return card;
    }

    /**
     * Setup a mini demo canvas
     */
    setupDemoCanvas(canvas, demo, index) {
        const grid = Grid.fromPuzzle(demo);
        this.grids[index] = grid;

        // Create a mini renderer
        const renderer = new MiniRenderer(canvas, grid);
        this.renderers[index] = renderer;
        this.canvases[index] = canvas;

        // Initial render
        renderer.render();

        // Setup auto-animation
        if (demo.autoTap) {
            this.setupAutoAnimation(index, demo.autoTap);
        }
    }

    /**
     * Setup auto-tap animation for demo
     */
    setupAutoAnimation(index, tapPos) {
        const animate = () => {
            const grid = this.grids[index];
            const renderer = this.renderers[index];
            if (!grid || !renderer) return;

            // Reset grid
            grid.reset();
            renderer.render();

            // Animate tap after a delay
            setTimeout(() => {
                if (!this.grids[index]) return;

                const affected = grid.tap(tapPos.x, tapPos.y);
                if (affected) {
                    renderer.animateTap(tapPos.x, tapPos.y, affected);
                }
            }, 500);
        };

        // Run immediately
        animate();

        // Repeat every 3 seconds
        const interval = setInterval(animate, 3000);
        this.animationIntervals[index] = interval;
    }

    /**
     * Draw locked demo state
     */
    drawLockedDemo(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#D4C8B0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = '40px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔒', canvas.width / 2, canvas.height / 2);
    }

    /**
     * Cleanup renderers and intervals
     */
    cleanup() {
        this.animationIntervals.forEach(interval => {
            if (interval) clearInterval(interval);
        });
        this.animationIntervals = [];
        this.renderers = [];
        this.grids = [];
        this.canvases = [];
    }

    /**
     * Destroy controller
     */
    destroy() {
        this.cleanup();
    }
}

/**
 * MiniRenderer - simplified renderer for mechanic demos
 */
class MiniRenderer {
    constructor(canvas, grid) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.grid = grid;
        this.cellSize = Math.floor(canvas.width / (grid.size + 1));
        this.padding = this.cellSize / 2;
        this.targetSize = this.cellSize * 0.4;

        this.colors = {
            background: '#E8DCC4',
            gridLines: '#D4C8B0',
            stoneNormal: '#7A7A7A',
            stoneBlocker: '#2D2D2D',
            stoneBooster: '#8BA87B',
            text: '#FFFFFF',
            target: '#D4A84B',
            targetComplete: '#7EB86B',
            ripple: 'rgba(126, 184, 201, 0.6)'
        };
    }

    /**
     * Render the grid
     */
    render() {
        const ctx = this.ctx;

        // Clear
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw targets
        this.drawTargets();

        // Draw cells
        for (let y = 0; y < this.grid.size; y++) {
            for (let x = 0; x < this.grid.size; x++) {
                this.drawCell(x, y);
            }
        }
    }

    /**
     * Draw row and column targets
     */
    drawTargets() {
        const ctx = this.ctx;

        // Column targets (top)
        for (let x = 0; x < this.grid.size; x++) {
            const target = this.grid.colTargets[x];
            if (target === 0) continue;

            const posX = this.padding + x * this.cellSize + this.cellSize / 2;
            const posY = this.targetSize / 2 + 2;
            const current = this.grid.getColSum(x);
            const isComplete = current === target;

            ctx.beginPath();
            ctx.arc(posX, posY, this.targetSize / 2, 0, Math.PI * 2);
            ctx.fillStyle = isComplete ? this.colors.targetComplete : this.colors.target;
            ctx.fill();

            ctx.font = `bold ${Math.floor(this.targetSize * 0.7)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(target.toString(), posX, posY);
        }

        // Row targets (right)
        for (let y = 0; y < this.grid.size; y++) {
            const target = this.grid.rowTargets[y];
            if (target === 0) continue;

            const posX = this.canvas.width - this.targetSize / 2 - 2;
            const posY = this.padding + y * this.cellSize + this.cellSize / 2;
            const current = this.grid.getRowSum(y);
            const isComplete = current === target;

            ctx.beginPath();
            ctx.arc(posX, posY, this.targetSize / 2, 0, Math.PI * 2);
            ctx.fillStyle = isComplete ? this.colors.targetComplete : this.colors.target;
            ctx.fill();

            ctx.font = `bold ${Math.floor(this.targetSize * 0.7)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(target.toString(), posX, posY);
        }
    }

    /**
     * Draw a single cell
     */
    drawCell(x, y) {
        const ctx = this.ctx;
        const cell = this.grid.getCell(x, y);
        if (!cell) return;

        const centerX = this.padding + x * this.cellSize + this.cellSize / 2;
        const centerY = this.padding + y * this.cellSize + this.cellSize / 2;
        const radius = this.cellSize * 0.35;

        // Draw shadow
        ctx.beginPath();
        ctx.arc(centerX + 2, centerY + 2, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fill();

        // Draw stone
        let stoneColor = this.colors.stoneNormal;
        if (cell.type === CellType.BLOCKER) {
            stoneColor = this.colors.stoneBlocker;
        } else if (cell.type === CellType.BOOSTER) {
            stoneColor = this.colors.stoneBooster;
        }

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = stoneColor;
        ctx.fill();

        // Draw tap limit indicator
        if (cell.maxTaps > 0) {
            const remaining = cell.maxTaps - cell.tapCount;
            const dotRadius = 3;
            const dotY = centerY - radius - 5;

            for (let i = 0; i < Math.min(remaining, 3); i++) {
                const dotX = centerX + (i - 1) * 8;
                ctx.beginPath();
                ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
                ctx.fillStyle = '#7EB8C9';
                ctx.fill();
            }
        }

        // Draw value
        if (cell.type !== CellType.BLOCKER && cell.value > 0) {
            ctx.font = `bold ${Math.floor(this.cellSize * 0.35)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = this.colors.text;
            ctx.fillText(cell.value.toString(), centerX, centerY);
        }
    }

    /**
     * Animate a tap with ripple effect
     */
    animateTap(x, y, affected) {
        const centerX = this.padding + x * this.cellSize + this.cellSize / 2;
        const centerY = this.padding + y * this.cellSize + this.cellSize / 2;

        let frame = 0;
        const totalFrames = 20;

        const animate = () => {
            frame++;

            // Render base grid
            this.render();

            // Draw ripple
            const progress = frame / totalFrames;
            const radius = progress * this.cellSize * 1.5;
            const alpha = 1 - progress;

            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(126, 184, 201, ${alpha * 0.6})`;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            if (frame < totalFrames) {
                requestAnimationFrame(animate);
            } else {
                // Final render
                this.render();
            }
        };

        animate();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MechanicsController, MiniRenderer };
}
