/**
 * Daily Puzzle Manager - handles daily puzzle generation and sharing
 */
class DailyPuzzleManager {
    constructor() {
        // Start date for puzzle numbering
        this.startDate = new Date('2024-01-01');

        // Seed for deterministic puzzle generation
        this.baseSeed = 12345;
    }

    /**
     * Get today's date string
     */
    getTodayString() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Get puzzle number based on date
     */
    getPuzzleNumber(dateString) {
        const date = new Date(dateString);
        const diffTime = date - this.startDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1;
    }

    /**
     * Simple seeded random number generator
     */
    seededRandom(seed) {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }

    /**
     * Generate a deterministic puzzle for a given date
     */
    generatePuzzle(dateString) {
        const puzzleNumber = this.getPuzzleNumber(dateString);

        // Create seed from date
        const dateParts = dateString.split('-');
        const seed = this.baseSeed +
            parseInt(dateParts[0]) * 10000 +
            parseInt(dateParts[1]) * 100 +
            parseInt(dateParts[2]);

        let currentSeed = seed;
        const random = () => {
            currentSeed++;
            return this.seededRandom(currentSeed);
        };

        // Determine grid size based on puzzle number progression
        let gridSize;
        if (puzzleNumber <= 30) {
            gridSize = 4;
        } else if (puzzleNumber <= 100) {
            gridSize = 5;
        } else if (puzzleNumber <= 200) {
            gridSize = 6;
        } else {
            gridSize = 5 + Math.floor(random() * 2); // 5-6
        }

        // Generate puzzle with guaranteed solution
        const puzzle = this.generateSolvablePuzzle(gridSize, random, puzzleNumber);

        return {
            id: `daily-${dateString}`,
            name: `Daily #${puzzleNumber}`,
            puzzleNumber,
            date: dateString,
            ...puzzle
        };
    }

    /**
     * Generate a solvable puzzle by working backwards from a solution
     */
    generateSolvablePuzzle(gridSize, random, puzzleNumber) {
        const cells = [];

        // Initialize all cells
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                cells.push({
                    x,
                    y,
                    type: 'normal',
                    target: 0,
                    value: 0
                });
            }
        }

        // Determine number of taps for solution (scales with puzzle number)
        const baseTaps = 3;
        const maxExtraTaps = Math.min(5, Math.floor(puzzleNumber / 20));
        const numTaps = baseTaps + Math.floor(random() * (maxExtraTaps + 1));

        // Determine special cells
        const numBlockers = puzzleNumber > 20 ? Math.floor(random() * 3) : 0;
        const numBoosters = puzzleNumber > 50 ? Math.floor(random() * 2) : 0;

        // Add blockers
        const blockerPositions = new Set();
        for (let i = 0; i < numBlockers; i++) {
            let attempts = 0;
            while (attempts < 20) {
                const x = Math.floor(random() * gridSize);
                const y = Math.floor(random() * gridSize);
                const key = `${x},${y}`;

                if (!blockerPositions.has(key)) {
                    blockerPositions.add(key);
                    const cell = cells.find(c => c.x === x && c.y === y);
                    if (cell) {
                        cell.type = 'blocker';
                    }
                    break;
                }
                attempts++;
            }
        }

        // Add boosters
        for (let i = 0; i < numBoosters; i++) {
            let attempts = 0;
            while (attempts < 20) {
                const x = Math.floor(random() * gridSize);
                const y = Math.floor(random() * gridSize);
                const cell = cells.find(c => c.x === x && c.y === y);

                if (cell && cell.type === 'normal') {
                    cell.type = 'booster';
                    break;
                }
                attempts++;
            }
        }

        // Generate solution by picking tap positions
        const solution = [];
        const tappableCells = cells.filter(c => c.type !== 'blocker');

        for (let i = 0; i < numTaps; i++) {
            const cell = tappableCells[Math.floor(random() * tappableCells.length)];
            solution.push([cell.x, cell.y]);
        }

        // Simulate the solution to calculate target values
        for (const [tapX, tapY] of solution) {
            const tappedCell = cells.find(c => c.x === tapX && c.y === tapY);
            if (!tappedCell || tappedCell.type === 'blocker') continue;

            const rippleValue = tappedCell.type === 'booster' ? 2 : 1;

            // Add to tapped cell
            if (tappedCell.type !== 'blocker') {
                tappedCell.value += rippleValue;
            }

            // Add to neighbors
            const neighbors = [
                { dx: 0, dy: -1 },
                { dx: 0, dy: 1 },
                { dx: -1, dy: 0 },
                { dx: 1, dy: 0 }
            ];

            for (const { dx, dy } of neighbors) {
                const neighbor = cells.find(c => c.x === tapX + dx && c.y === tapY + dy);
                if (neighbor && neighbor.type !== 'blocker') {
                    neighbor.value += rippleValue;
                }
            }
        }

        // Set target values based on simulation
        for (const cell of cells) {
            if (cell.type !== 'blocker') {
                cell.target = cell.value;
            }
        }

        // Filter to only include cells with targets or special types
        const puzzleCells = cells
            .filter(c => c.type === 'blocker' || c.target > 0)
            .map(c => ({
                x: c.x,
                y: c.y,
                type: c.type,
                target: c.type === 'blocker' ? undefined : c.target
            }));

        return {
            grid: gridSize,
            cells: puzzleCells,
            solution
        };
    }

    /**
     * Get today's puzzle
     */
    getTodaysPuzzle() {
        return this.generatePuzzle(this.getTodayString());
    }

    /**
     * Generate share text
     */
    generateShareText(puzzle, taps, optimal) {
        const isOptimal = taps <= puzzle.solution.length;

        let result = `Ripple Add #${puzzle.puzzleNumber}\n`;

        // Generate visual representation
        const stones = [];
        for (let i = 0; i < Math.min(taps, 6); i++) {
            stones.push(i === 0 ? '\u{1FAA8}' : '\u{2B55}');
        }
        if (taps > 6) {
            stones.push('...');
        }

        result += stones.join('') + '\n';
        result += `${taps} tap${taps !== 1 ? 's' : ''}`;

        if (isOptimal) {
            result += ' \u{2728}';
        }

        result += '\n\nPlay at: [your-url-here]';

        return result;
    }

    /**
     * Copy share text to clipboard
     */
    async shareResult(puzzle, taps) {
        const shareText = this.generateShareText(puzzle, taps);

        try {
            if (navigator.share) {
                await navigator.share({
                    title: `Ripple Add #${puzzle.puzzleNumber}`,
                    text: shareText
                });
                return { success: true, method: 'share' };
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(shareText);
                return { success: true, method: 'clipboard' };
            } else {
                return { success: false, text: shareText };
            }
        } catch (e) {
            console.error('Share failed:', e);
            return { success: false, text: shareText };
        }
    }
}

// Create singleton instance
const dailyPuzzle = new DailyPuzzleManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DailyPuzzleManager, dailyPuzzle };
}
