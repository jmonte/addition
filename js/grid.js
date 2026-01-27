/**
 * Cell Types
 */
const CellType = {
    NORMAL: 'normal',
    BLOCKER: 'blocker',
    BOOSTER: 'booster'
};

/**
 * Cell class - represents a single cell in the grid
 */
class Cell {
    constructor(x, y, type = CellType.NORMAL) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.value = 0;
        this.maxTaps = -1; // -1 = unlimited, 0 = not tappable, 1+ = limited taps
        this.tapCount = 0;
    }

    /**
     * Check if cell can be tapped
     */
    canTap() {
        if (this.type === CellType.BLOCKER) return false;
        if (this.maxTaps === 0) return false;
        if (this.maxTaps > 0 && this.tapCount >= this.maxTaps) return false;
        return true;
    }

    /**
     * Record a tap on this cell
     */
    recordTap() {
        this.tapCount++;
    }

    /**
     * Check if cell has remaining taps
     */
    hasRemainingTaps() {
        if (this.maxTaps === -1) return true;
        return this.tapCount < this.maxTaps;
    }

    /**
     * Check if cell can receive ripples
     */
    canReceiveRipple() {
        return this.type !== CellType.BLOCKER;
    }

    /**
     * Get the ripple value this cell produces when tapped
     */
    getRippleValue() {
        return this.type === CellType.BOOSTER ? 2 : 1;
    }

    /**
     * Add value to cell
     */
    addValue(amount) {
        if (this.type !== CellType.BLOCKER) {
            this.value += amount;
        }
    }

    /**
     * Reset cell value to 0
     */
    reset() {
        this.value = 0;
        this.tapCount = 0;
    }

    /**
     * Clone the cell
     */
    clone() {
        const cell = new Cell(this.x, this.y, this.type);
        cell.value = this.value;
        cell.maxTaps = this.maxTaps;
        cell.tapCount = this.tapCount;
        return cell;
    }
}

/**
 * Grid class - manages the puzzle grid with row/column sum targets
 */
class Grid {
    constructor(size) {
        this.size = size;
        this.cells = [];
        this.rowTargets = []; // Target sum for each row
        this.colTargets = []; // Target sum for each column
        this.initializeCells();
    }

    /**
     * Initialize grid with empty normal cells
     */
    initializeCells() {
        this.cells = [];
        for (let y = 0; y < this.size; y++) {
            const row = [];
            for (let x = 0; x < this.size; x++) {
                row.push(new Cell(x, y, CellType.NORMAL));
            }
            this.cells.push(row);
        }
        // Initialize targets to 0
        this.rowTargets = new Array(this.size).fill(0);
        this.colTargets = new Array(this.size).fill(0);
    }

    /**
     * Get cell at position
     */
    getCell(x, y) {
        if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
            return null;
        }
        return this.cells[y][x];
    }

    /**
     * Get orthogonal neighbors (up, down, left, right)
     */
    getNeighbors(x, y) {
        const neighbors = [];
        const directions = [
            { dx: 0, dy: -1 },  // up
            { dx: 0, dy: 1 },   // down
            { dx: -1, dy: 0 },  // left
            { dx: 1, dy: 0 }    // right
        ];

        for (const dir of directions) {
            const cell = this.getCell(x + dir.dx, y + dir.dy);
            if (cell) {
                neighbors.push(cell);
            }
        }

        return neighbors;
    }

    /**
     * Perform a tap at position
     * Returns affected cells for animation
     */
    tap(x, y) {
        const tappedCell = this.getCell(x, y);
        if (!tappedCell || !tappedCell.canTap()) {
            return null;
        }

        const affectedCells = [];
        const rippleValue = tappedCell.getRippleValue();

        // Record the tap
        tappedCell.recordTap();

        // Add to tapped cell
        tappedCell.addValue(rippleValue);
        affectedCells.push({
            cell: tappedCell,
            addedValue: rippleValue,
            isTapOrigin: true
        });

        // Add to neighbors
        const neighbors = this.getNeighbors(x, y);
        for (const neighbor of neighbors) {
            if (neighbor.canReceiveRipple()) {
                neighbor.addValue(rippleValue);
                affectedCells.push({
                    cell: neighbor,
                    addedValue: rippleValue,
                    isTapOrigin: false
                });
            }
        }

        return affectedCells;
    }

    /**
     * Get current sum of a row
     */
    getRowSum(rowIndex) {
        let sum = 0;
        for (let x = 0; x < this.size; x++) {
            const cell = this.cells[rowIndex][x];
            if (cell.type !== CellType.BLOCKER) {
                sum += cell.value;
            }
        }
        return sum;
    }

    /**
     * Get current sum of a column
     */
    getColSum(colIndex) {
        let sum = 0;
        for (let y = 0; y < this.size; y++) {
            const cell = this.cells[y][colIndex];
            if (cell.type !== CellType.BLOCKER) {
                sum += cell.value;
            }
        }
        return sum;
    }

    /**
     * Check if a row has reached its target
     */
    isRowComplete(rowIndex) {
        return this.getRowSum(rowIndex) === this.rowTargets[rowIndex];
    }

    /**
     * Check if a column has reached its target
     */
    isColComplete(colIndex) {
        return this.getColSum(colIndex) === this.colTargets[colIndex];
    }

    /**
     * Check if puzzle is complete (all row and column sums match targets)
     */
    isComplete() {
        // Check all rows
        for (let y = 0; y < this.size; y++) {
            if (!this.isRowComplete(y)) {
                return false;
            }
        }
        // Check all columns
        for (let x = 0; x < this.size; x++) {
            if (!this.isColComplete(x)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Reset all cell values
     */
    reset() {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                this.cells[y][x].reset();
            }
        }
    }

    /**
     * Create a deep clone of the grid
     */
    clone() {
        const newGrid = new Grid(this.size);
        newGrid.rowTargets = [...this.rowTargets];
        newGrid.colTargets = [...this.colTargets];
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                newGrid.cells[y][x] = this.cells[y][x].clone();
            }
        }
        return newGrid;
    }

    /**
     * Load puzzle from definition
     */
    static fromPuzzle(puzzle) {
        const grid = new Grid(puzzle.grid);

        // Set row and column targets
        grid.rowTargets = puzzle.rowTargets ? [...puzzle.rowTargets] : new Array(puzzle.grid).fill(0);
        grid.colTargets = puzzle.colTargets ? [...puzzle.colTargets] : new Array(puzzle.grid).fill(0);

        // Set special cell properties
        if (puzzle.cells) {
            for (const cellDef of puzzle.cells) {
                const cell = grid.getCell(cellDef.x, cellDef.y);
                if (cell) {
                    cell.type = cellDef.type || CellType.NORMAL;
                    cell.maxTaps = cellDef.maxTaps !== undefined ? cellDef.maxTaps : -1;
                }
            }
        }

        return grid;
    }

    /**
     * Get all cells as flat array
     */
    getAllCells() {
        const allCells = [];
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                allCells.push(this.cells[y][x]);
            }
        }
        return allCells;
    }

    /**
     * Get current values as 2D array
     */
    getValues() {
        const values = [];
        for (let y = 0; y < this.size; y++) {
            const row = [];
            for (let x = 0; x < this.size; x++) {
                row.push(this.cells[y][x].value);
            }
            values.push(row);
        }
        return values;
    }

    /**
     * Get tap counts as 2D array (for undo)
     */
    getTapCounts() {
        const counts = [];
        for (let y = 0; y < this.size; y++) {
            const row = [];
            for (let x = 0; x < this.size; x++) {
                row.push(this.cells[y][x].tapCount);
            }
            counts.push(row);
        }
        return counts;
    }

    /**
     * Set values from 2D array
     */
    setValues(values) {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                if (values[y] && values[y][x] !== undefined) {
                    this.cells[y][x].value = values[y][x];
                }
            }
        }
    }

    /**
     * Set tap counts from 2D array (for undo)
     */
    setTapCounts(counts) {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                if (counts[y] && counts[y][x] !== undefined) {
                    this.cells[y][x].tapCount = counts[y][x];
                }
            }
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Grid, Cell, CellType };
}
