/**
 * Game - core game logic and state management
 */
class Game {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.grid = null;
        this.puzzle = null;

        // Game state
        this.taps = [];
        this.history = []; // For undo functionality
        this.isComplete = false;
        this.isPlaying = false;

        // Callbacks
        this.onTap = options.onTap || null;
        this.onWin = options.onWin || null;
        this.onReset = options.onReset || null;

        // Bind event handlers
        this.handleClick = this.handleClick.bind(this);
        this.handleTouch = this.handleTouch.bind(this);

        this.setupEventListeners();
    }

    /**
     * Setup event listeners for canvas interaction
     */
    setupEventListeners() {
        this.canvas.addEventListener('click', this.handleClick);
        this.canvas.addEventListener('touchstart', this.handleTouch, { passive: false });
    }

    /**
     * Remove event listeners
     */
    removeEventListeners() {
        this.canvas.removeEventListener('click', this.handleClick);
        this.canvas.removeEventListener('touchstart', this.handleTouch);
    }

    /**
     * Handle click events
     */
    handleClick(event) {
        if (!this.isPlaying || this.isComplete) return;

        const canvasPos = this.renderer.pageToCanvas(event.clientX, event.clientY);
        const cell = this.renderer.getCellFromPosition(canvasPos.x, canvasPos.y);

        if (cell) {
            this.tapCell(cell.x, cell.y);
        }
    }

    /**
     * Handle touch events
     */
    handleTouch(event) {
        if (!this.isPlaying || this.isComplete) return;
        event.preventDefault();

        const touch = event.touches[0];
        const canvasPos = this.renderer.pageToCanvas(touch.clientX, touch.clientY);
        const cell = this.renderer.getCellFromPosition(canvasPos.x, canvasPos.y);

        if (cell) {
            this.tapCell(cell.x, cell.y);
        }
    }

    /**
     * Load a puzzle
     */
    loadPuzzle(puzzle) {
        this.puzzle = puzzle;
        this.grid = Grid.fromPuzzle(puzzle);
        this.renderer.init(this.grid);
        this.reset();
        this.isPlaying = true;
    }

    /**
     * Tap a cell at position
     */
    tapCell(x, y) {
        const cell = this.grid.getCell(x, y);
        if (!cell || !cell.canTap()) return;

        // Save state for undo (values and tap counts)
        this.history.push({
            values: this.grid.getValues(),
            tapCounts: this.grid.getTapCounts()
        });

        // Perform tap
        const affected = this.grid.tap(x, y);

        if (affected) {
            // Record tap
            this.taps.push({ x, y });

            // Trigger animations
            this.renderer.addRipple(x, y);

            for (const { cell, addedValue } of affected) {
                this.renderer.addNumberPop(cell.x, cell.y, addedValue);
            }

            // Check for win
            if (this.grid.isComplete()) {
                this.handleWin();
            }

            // Callback
            if (this.onTap) {
                this.onTap(this.taps.length);
            }
        }
    }

    /**
     * Handle winning the puzzle
     */
    handleWin() {
        this.isComplete = true;
        this.renderer.startWinCelebration();

        // Delay callback to allow animations
        setTimeout(() => {
            if (this.onWin) {
                this.onWin(this.taps.length, this.puzzle);
            }
        }, 800);
    }

    /**
     * Undo last tap
     */
    undo() {
        if (this.history.length === 0 || this.isComplete) return false;

        const previousState = this.history.pop();
        this.grid.setValues(previousState.values);
        this.grid.setTapCounts(previousState.tapCounts);
        this.taps.pop();

        if (this.onTap) {
            this.onTap(this.taps.length);
        }

        return true;
    }

    /**
     * Reset puzzle to initial state
     */
    reset() {
        this.grid.reset();
        this.taps = [];
        this.history = [];
        this.isComplete = false;
        this.renderer.reset();

        if (this.onReset) {
            this.onReset();
        }

        if (this.onTap) {
            this.onTap(0);
        }
    }

    /**
     * Get current tap count
     */
    getTapCount() {
        return this.taps.length;
    }

    /**
     * Check if undo is available
     */
    canUndo() {
        return this.history.length > 0 && !this.isComplete;
    }

    /**
     * Get current game state
     */
    getState() {
        return {
            puzzleId: this.puzzle ? this.puzzle.id : null,
            values: this.grid ? this.grid.getValues() : null,
            taps: [...this.taps],
            isComplete: this.isComplete
        };
    }

    /**
     * Restore game state
     */
    restoreState(state) {
        if (!state || !this.grid) return;

        if (state.values) {
            this.grid.setValues(state.values);
        }
        if (state.taps) {
            this.taps = [...state.taps];
        }
        this.isComplete = state.isComplete || false;

        // Restore completed cells visual state
        this.renderer.completedCells.clear();
        for (let y = 0; y < this.grid.size; y++) {
            for (let x = 0; x < this.grid.size; x++) {
                const cell = this.grid.getCell(x, y);
                if (cell.isComplete() && cell.type !== CellType.BLOCKER && cell.target > 0) {
                    this.renderer.completedCells.add(`${x},${y}`);
                }
            }
        }
    }

    /**
     * Resize the game (call on window resize)
     */
    resize() {
        if (this.renderer && this.grid) {
            this.renderer.resize();
        }
    }

    /**
     * Generate share text for completed puzzle
     */
    generateShareText(puzzleNumber) {
        if (!this.isComplete) return '';

        const taps = this.taps.length;
        const optimal = this.puzzle.solution ? this.puzzle.solution.length : taps;
        const isOptimal = taps <= optimal;

        let stones = '';
        for (let i = 0; i < taps && i < 5; i++) {
            stones += i === 0 ? '\u{1FAA8}' : '\u{2B55}';
        }
        if (taps > 5) stones += '...';

        return `Ripple Add #${puzzleNumber} ${stones} ${taps} tap${taps !== 1 ? 's' : ''}${isOptimal ? ' \u{2728}' : ''}\n\nPlay at: [URL]`;
    }

    /**
     * Cleanup
     */
    destroy() {
        this.removeEventListeners();
        this.renderer.stopRenderLoop();
        this.isPlaying = false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Game };
}
