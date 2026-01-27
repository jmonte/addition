/**
 * DifficultyCalculator - gauges puzzle complexity with a score/rating
 */
class DifficultyCalculator {
    constructor() {
        // Metric weights (must sum to 1.0)
        this.weights = {
            gridSize: 0.15,
            tapCount: 0.20,
            blockers: 0.15,
            boosters: 0.10,
            tapLimits: 0.15,
            uniqueness: 0.10,
            branching: 0.10,
            deadEnds: 0.05
        };

        // Rating thresholds
        this.thresholds = {
            easy: 24,
            medium: 49,
            hard: 74
            // Expert: 75-100
        };
    }

    /**
     * Calculate difficulty rating for a puzzle
     * @param {Object} puzzle - Puzzle definition
     * @param {Object} solverResult - Optional pre-computed solver result
     * @returns {Object} { score, rating, breakdown }
     */
    calculate(puzzle, solverResult = null) {
        const grid = Grid.fromPuzzle(puzzle);

        // Get solver result if not provided
        if (!solverResult && typeof puzzleSolver !== 'undefined') {
            solverResult = puzzleSolver.solve(puzzle);
        }

        const optimalTaps = solverResult?.solution?.length || puzzle.solution?.length || 1;

        // Calculate individual metrics
        const breakdown = {
            gridSize: this.calculateGridSizeScore(grid.size),
            tapCount: this.calculateTapCountScore(optimalTaps),
            blockers: this.calculateBlockerScore(grid),
            boosters: this.calculateBoosterScore(grid),
            tapLimits: this.calculateTapLimitScore(grid),
            uniqueness: this.calculateUniquenessScore(puzzle, solverResult),
            branching: this.calculateBranchingScore(grid),
            deadEnds: this.calculateDeadEndScore(puzzle, solverResult)
        };

        // Calculate weighted score
        let score = 0;
        for (const [metric, value] of Object.entries(breakdown)) {
            score += value * this.weights[metric];
        }

        // Clamp to 0-100
        score = Math.max(0, Math.min(100, Math.round(score)));

        // Determine rating
        const rating = this.scoreToRating(score);

        return { score, rating, breakdown };
    }

    /**
     * Grid Size metric: (size - 3) / 3 * 100
     * 3x3 = 0, 4x4 = 33, 5x5 = 67, 6x6 = 100
     */
    calculateGridSizeScore(size) {
        return Math.min(100, Math.max(0, (size - 3) / 3 * 100));
    }

    /**
     * Tap Count metric: min(100, (optimalTaps - 1) * 15)
     */
    calculateTapCountScore(optimalTaps) {
        return Math.min(100, Math.max(0, (optimalTaps - 1) * 15));
    }

    /**
     * Blockers metric: blockerCount / totalCells * 400
     */
    calculateBlockerScore(grid) {
        let blockerCount = 0;
        const totalCells = grid.size * grid.size;

        for (let y = 0; y < grid.size; y++) {
            for (let x = 0; x < grid.size; x++) {
                const cell = grid.getCell(x, y);
                if (cell.type === CellType.BLOCKER) {
                    blockerCount++;
                }
            }
        }

        return Math.min(100, blockerCount / totalCells * 400);
    }

    /**
     * Boosters metric: boosterCount * 20
     */
    calculateBoosterScore(grid) {
        let boosterCount = 0;

        for (let y = 0; y < grid.size; y++) {
            for (let x = 0; x < grid.size; x++) {
                const cell = grid.getCell(x, y);
                if (cell.type === CellType.BOOSTER) {
                    boosterCount++;
                }
            }
        }

        return Math.min(100, boosterCount * 20);
    }

    /**
     * Tap Limits metric: limitedCells / tappableCells * 100
     */
    calculateTapLimitScore(grid) {
        let limitedCells = 0;
        let tappableCells = 0;

        for (let y = 0; y < grid.size; y++) {
            for (let x = 0; x < grid.size; x++) {
                const cell = grid.getCell(x, y);
                if (cell.type !== CellType.BLOCKER) {
                    if (cell.maxTaps === 0) {
                        // Can't tap at all - very limiting
                        limitedCells += 2;
                    } else if (cell.maxTaps > 0) {
                        // Has a tap limit
                        limitedCells++;
                        tappableCells++;
                    } else {
                        // Unlimited taps
                        tappableCells++;
                    }
                }
            }
        }

        if (tappableCells === 0) return 100;
        return Math.min(100, limitedCells / tappableCells * 100);
    }

    /**
     * Solution Uniqueness metric
     * Attempts to find multiple solutions to gauge uniqueness
     */
    calculateUniquenessScore(puzzle, solverResult) {
        // If we don't have solver or it couldn't solve, assume moderate uniqueness
        if (!solverResult || !solverResult.solvable) {
            return 60;
        }

        // For simplicity, we estimate based on solution length and grid constraints
        // Longer solutions with more constraints tend to be more unique
        const solutionLength = solverResult.solution?.length || 1;
        const grid = Grid.fromPuzzle(puzzle);

        // Count constraints (blockers, limited taps)
        let constraints = 0;
        for (let y = 0; y < grid.size; y++) {
            for (let x = 0; x < grid.size; x++) {
                const cell = grid.getCell(x, y);
                if (cell.type === CellType.BLOCKER) constraints += 2;
                if (cell.maxTaps >= 0 && cell.maxTaps <= 2) constraints++;
            }
        }

        // More constraints and longer solutions generally mean fewer valid solutions
        const constraintFactor = Math.min(1, constraints / 10);
        const lengthFactor = Math.min(1, solutionLength / 8);

        // Higher uniqueness score means harder (fewer solutions)
        const uniqueness = 30 + (constraintFactor * 35) + (lengthFactor * 35);
        return Math.min(100, uniqueness);
    }

    /**
     * Branching Factor metric: avgValidMovesPerState * 10
     */
    calculateBranchingScore(grid) {
        // Count tappable cells (initial branching factor)
        let tappableCells = 0;
        for (let y = 0; y < grid.size; y++) {
            for (let x = 0; x < grid.size; x++) {
                const cell = grid.getCell(x, y);
                if (cell.canTap()) {
                    tappableCells++;
                }
            }
        }

        // High branching factor makes puzzles harder to solve (more choices)
        return Math.min(100, tappableCells * 10);
    }

    /**
     * Dead End Potential metric
     * Estimates likelihood of reaching unsolvable states
     */
    calculateDeadEndScore(puzzle, solverResult) {
        const grid = Grid.fromPuzzle(puzzle);

        // Factors that increase dead end potential:
        // 1. Limited tap cells (can run out)
        // 2. High targets with few contributing cells
        // 3. Blockers that isolate areas

        let deadEndFactors = 0;

        // Check for limited tap cells
        for (let y = 0; y < grid.size; y++) {
            for (let x = 0; x < grid.size; x++) {
                const cell = grid.getCell(x, y);
                if (cell.maxTaps > 0 && cell.maxTaps <= 2) {
                    deadEndFactors += 10;
                }
                if (cell.maxTaps === 0 && cell.type !== CellType.BLOCKER) {
                    deadEndFactors += 15;
                }
            }
        }

        // Check for high targets
        const maxTarget = Math.max(
            ...grid.rowTargets,
            ...grid.colTargets
        );
        if (maxTarget > grid.size * 2) {
            deadEndFactors += 10;
        }

        return Math.min(100, deadEndFactors);
    }

    /**
     * Convert score to rating string
     */
    scoreToRating(score) {
        if (score <= this.thresholds.easy) return 'Easy';
        if (score <= this.thresholds.medium) return 'Medium';
        if (score <= this.thresholds.hard) return 'Hard';
        return 'Expert';
    }

    /**
     * Get difficulty for a chapter's levels
     * @param {Array} levels - Array of puzzle definitions
     * @returns {Object} { average, distribution }
     */
    analyzeChapter(levels) {
        const results = levels.map(level => this.calculate(level));
        const scores = results.map(r => r.score);

        const distribution = {
            Easy: 0,
            Medium: 0,
            Hard: 0,
            Expert: 0
        };

        for (const result of results) {
            distribution[result.rating]++;
        }

        return {
            average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
            distribution,
            details: results
        };
    }
}

// Create singleton instance
const difficultyCalculator = new DifficultyCalculator();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DifficultyCalculator, difficultyCalculator };
}
