/**
 * PuzzleSolver - validates solvability and returns solution sequences
 */
class PuzzleSolver {
    constructor() {
        this.maxSearchDepth = 20;
        this.maxStatesExplored = 100000;
    }

    /**
     * Solve a puzzle and return the solution
     * @param {Object} puzzle - Puzzle definition with grid, rowTargets, colTargets, cells
     * @returns {Object} { solvable: boolean, solution: [[x,y], ...] }
     */
    solve(puzzle) {
        const grid = Grid.fromPuzzle(puzzle);
        return this.solveFromGrid(grid);
    }

    /**
     * Solve from a Grid instance (for hint system)
     * @param {Grid} grid - Current grid state
     * @returns {Object} { solvable: boolean, solution: [[x,y], ...] }
     */
    solveFromGrid(grid) {
        // Use BFS with A* heuristic
        return this.bfsSolve(grid);
    }

    /**
     * Check if a puzzle is solvable
     * @param {Object} puzzle - Puzzle definition
     * @returns {boolean}
     */
    isSolvable(puzzle) {
        return this.solve(puzzle).solvable;
    }

    /**
     * BFS solver with A* heuristic
     * @param {Grid} initialGrid - Starting grid state
     * @returns {Object} { solvable: boolean, solution: [[x,y], ...] }
     */
    bfsSolve(initialGrid) {
        // Priority queue using array (sorted by f-score)
        const openSet = [];
        const visited = new Set();

        const initialState = {
            grid: initialGrid.clone(),
            taps: [],
            gScore: 0,
            fScore: this.calculateHeuristic(initialGrid)
        };

        // Check if already solved
        if (initialGrid.isComplete()) {
            return { solvable: true, solution: [] };
        }

        openSet.push(initialState);
        let statesExplored = 0;

        while (openSet.length > 0 && statesExplored < this.maxStatesExplored) {
            // Sort by fScore and get best
            openSet.sort((a, b) => a.fScore - b.fScore);
            const current = openSet.shift();
            statesExplored++;

            // Check depth limit
            if (current.taps.length >= this.maxSearchDepth) {
                continue;
            }

            // Get all tappable cells
            const tappableCells = this.getTappableCells(current.grid);

            for (const cell of tappableCells) {
                const newGrid = current.grid.clone();
                const result = newGrid.tap(cell.x, cell.y);

                if (!result) continue;

                const newTaps = [...current.taps, [cell.x, cell.y]];
                const stateHash = this.hashState(newGrid);

                // Skip if we've seen this state
                if (visited.has(stateHash)) {
                    continue;
                }
                visited.add(stateHash);

                // Check if solved
                if (newGrid.isComplete()) {
                    return { solvable: true, solution: newTaps };
                }

                // Check if state is still potentially solvable
                if (!this.isPotentiallySolvable(newGrid)) {
                    continue;
                }

                const gScore = newTaps.length;
                const hScore = this.calculateHeuristic(newGrid);
                const fScore = gScore + hScore;

                openSet.push({
                    grid: newGrid,
                    taps: newTaps,
                    gScore,
                    fScore
                });
            }
        }

        return { solvable: false, solution: [] };
    }

    /**
     * Get all cells that can currently be tapped
     * @param {Grid} grid
     * @returns {Array<Cell>}
     */
    getTappableCells(grid) {
        const cells = [];
        for (let y = 0; y < grid.size; y++) {
            for (let x = 0; x < grid.size; x++) {
                const cell = grid.getCell(x, y);
                if (cell && cell.canTap()) {
                    cells.push(cell);
                }
            }
        }
        return cells;
    }

    /**
     * Calculate A* heuristic - estimate of remaining taps needed
     * @param {Grid} grid
     * @returns {number}
     */
    calculateHeuristic(grid) {
        let totalDeficit = 0;
        let maxDeficit = 0;

        // Calculate row deficits
        for (let y = 0; y < grid.size; y++) {
            const current = grid.getRowSum(y);
            const target = grid.rowTargets[y];
            const deficit = Math.max(0, target - current);
            totalDeficit += deficit;
            maxDeficit = Math.max(maxDeficit, deficit);
        }

        // Calculate column deficits
        for (let x = 0; x < grid.size; x++) {
            const current = grid.getColSum(x);
            const target = grid.colTargets[x];
            const deficit = Math.max(0, target - current);
            totalDeficit += deficit;
            maxDeficit = Math.max(maxDeficit, deficit);
        }

        // Estimate: each tap typically contributes 4-5 to total sums
        // (1 to center + 1 to each of up to 4 neighbors)
        // Use a conservative estimate
        const avgContribution = 4;

        // The heuristic is the estimated minimum taps needed
        // We use max of (total deficit / avg contribution) and (max single deficit)
        return Math.max(
            Math.ceil(totalDeficit / (avgContribution * 2)), // Divide by 2 since each tap contributes to both row and col
            Math.ceil(maxDeficit / 2) // A single cell can get at most 2 from one tap (if booster neighbor)
        );
    }

    /**
     * Check if a state is potentially solvable (no row/col is over target)
     * @param {Grid} grid
     * @returns {boolean}
     */
    isPotentiallySolvable(grid) {
        // Check if any row/col is over target
        for (let y = 0; y < grid.size; y++) {
            if (grid.getRowSum(y) > grid.rowTargets[y]) {
                return false;
            }
        }
        for (let x = 0; x < grid.size; x++) {
            if (grid.getColSum(x) > grid.colTargets[x]) {
                return false;
            }
        }

        // Check if there are still tappable cells or if we've reached the target
        const hasTappableCells = this.getTappableCells(grid).length > 0;
        const isComplete = grid.isComplete();

        return isComplete || hasTappableCells;
    }

    /**
     * Create a hash of the grid state for deduplication
     * @param {Grid} grid
     * @returns {string}
     */
    hashState(grid) {
        const parts = [];
        for (let y = 0; y < grid.size; y++) {
            for (let x = 0; x < grid.size; x++) {
                const cell = grid.getCell(x, y);
                parts.push(`${cell.value}:${cell.tapCount}`);
            }
        }
        return parts.join(',');
    }

    /**
     * Build contribution matrix for linear algebra approach
     * Maps each tap position to its contribution to row/column sums
     * @param {Grid} grid
     * @returns {Object} { tappable: [{x, y, rowContribs, colContribs}], ... }
     */
    buildContributionMatrix(grid) {
        const contributions = [];

        for (let y = 0; y < grid.size; y++) {
            for (let x = 0; x < grid.size; x++) {
                const cell = grid.getCell(x, y);
                if (!cell || cell.type === CellType.BLOCKER) continue;
                if (cell.maxTaps === 0) continue;

                const rippleValue = cell.getRippleValue();
                const rowContribs = new Array(grid.size).fill(0);
                const colContribs = new Array(grid.size).fill(0);

                // Contribution to self
                rowContribs[y] += rippleValue;
                colContribs[x] += rippleValue;

                // Contribution to neighbors
                const neighbors = [
                    { dx: 0, dy: -1 },
                    { dx: 0, dy: 1 },
                    { dx: -1, dy: 0 },
                    { dx: 1, dy: 0 }
                ];

                for (const { dx, dy } of neighbors) {
                    const nx = x + dx;
                    const ny = y + dy;
                    const neighbor = grid.getCell(nx, ny);
                    if (neighbor && neighbor.type !== CellType.BLOCKER) {
                        rowContribs[ny] += rippleValue;
                        colContribs[nx] += rippleValue;
                    }
                }

                contributions.push({
                    x,
                    y,
                    maxTaps: cell.maxTaps,
                    rowContribs,
                    colContribs
                });
            }
        }

        return contributions;
    }

    /**
     * Verify a solution by simulating it
     * @param {Object} puzzle - Puzzle definition
     * @param {Array} solution - Array of [x, y] tap positions
     * @returns {boolean}
     */
    verifySolution(puzzle, solution) {
        const grid = Grid.fromPuzzle(puzzle);

        for (const [x, y] of solution) {
            const result = grid.tap(x, y);
            if (!result) {
                return false;
            }
        }

        return grid.isComplete();
    }

    /**
     * Find the optimal (shortest) solution
     * @param {Object} puzzle - Puzzle definition
     * @param {number} maxDepth - Maximum solution length to search
     * @returns {Object} { solvable: boolean, solution: [[x,y], ...] }
     */
    findOptimalSolution(puzzle, maxDepth = 15) {
        const originalMaxDepth = this.maxSearchDepth;
        this.maxSearchDepth = maxDepth;
        const result = this.solve(puzzle);
        this.maxSearchDepth = originalMaxDepth;
        return result;
    }
}

// Create singleton instance
const puzzleSolver = new PuzzleSolver();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PuzzleSolver, puzzleSolver };
}
