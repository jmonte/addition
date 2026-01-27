/**
 * Level Manager - handles loading and managing levels
 */
class LevelManager {
    constructor() {
        this.chapters = [];
        this.currentChapter = null;
        this.currentLevelIndex = 0;
        this.levelsData = null;
    }

    async loadLevels() {
        // Use embedded levels directly
        this.loadEmbeddedLevels();
        return true;
    }

    loadEmbeddedLevels() {
        this.levelsData = EMBEDDED_LEVELS;
        this.chapters = this.levelsData.chapters;
    }

    getChapters() {
        return this.chapters;
    }

    getChapter(chapterId) {
        return this.chapters.find(c => c.id === chapterId);
    }

    getLevelsForChapter(chapterId) {
        const chapter = this.getChapter(chapterId);
        return chapter ? chapter.levels : [];
    }

    getLevel(chapterId, levelIndex) {
        const levels = this.getLevelsForChapter(chapterId);
        return levels[levelIndex] || null;
    }

    getLevelById(levelId) {
        for (const chapter of this.chapters) {
            for (const level of chapter.levels) {
                if (level.id === levelId) {
                    return { chapter, level };
                }
            }
        }
        return null;
    }

    getNextLevel(chapterId, levelIndex) {
        const levels = this.getLevelsForChapter(chapterId);

        if (levelIndex < levels.length - 1) {
            return {
                chapterId,
                levelIndex: levelIndex + 1,
                level: levels[levelIndex + 1]
            };
        }

        const chapterIndex = this.chapters.findIndex(c => c.id === chapterId);
        if (chapterIndex < this.chapters.length - 1) {
            const nextChapter = this.chapters[chapterIndex + 1];
            return {
                chapterId: nextChapter.id,
                levelIndex: 0,
                level: nextChapter.levels[0]
            };
        }

        return null;
    }

    getTotalLevelCount() {
        return this.chapters.reduce((sum, chapter) => sum + chapter.levels.length, 0);
    }

    getChapterProgress(chapterId, completedLevels) {
        const levels = this.getLevelsForChapter(chapterId);
        if (levels.length === 0) return 0;

        const completed = levels.filter(level =>
            completedLevels.has(level.id)
        ).length;

        return completed / levels.length;
    }
}

/**
 * Embedded levels - 30 puzzles per chapter, 4 chapters
 * New format: rowTargets and colTargets for sum-based win condition
 */
const EMBEDDED_LEVELS = {
    chapters: [
        {
            id: 'chapter-1',
            name: 'Calm Waters',
            description: 'Learn the basics of ripple mechanics',
            levels: [
                { id: '1-1', name: 'First Ripple', grid: 3, rowTargets: [1, 3, 1], colTargets: [1, 3, 1], cells: [], solution: [[1, 1]] },
                { id: '1-2', name: 'Corner Start', grid: 3, rowTargets: [2, 1, 0], colTargets: [2, 1, 0], cells: [], solution: [[0, 0]] },
                { id: '1-3', name: 'Side by Side', grid: 3, rowTargets: [2, 4, 2], colTargets: [3, 2, 3], cells: [], solution: [[0, 1], [2, 1]] },
                { id: '1-4', name: 'Up and Down', grid: 3, rowTargets: [3, 2, 3], colTargets: [2, 4, 2], cells: [], solution: [[1, 0], [1, 2]] },
                { id: '1-5', name: 'Diagonal', grid: 3, rowTargets: [2, 2, 2], colTargets: [2, 2, 2], cells: [], solution: [[0, 0], [2, 2]] },
                { id: '1-6', name: 'The Line', grid: 3, rowTargets: [3, 7, 3], colTargets: [4, 5, 4], cells: [], solution: [[0, 1], [1, 1], [2, 1]] },
                { id: '1-7', name: 'L Shape', grid: 3, rowTargets: [3, 3, 1], colTargets: [5, 2, 0], cells: [], solution: [[0, 0], [0, 1]] },
                { id: '1-8', name: 'Cross', grid: 3, rowTargets: [5, 6, 5], colTargets: [5, 6, 5], cells: [], solution: [[1, 0], [0, 1], [2, 1], [1, 2]] },
                { id: '1-9', name: 'Bigger Board', grid: 4, rowTargets: [1, 4, 4, 1], colTargets: [1, 4, 4, 1], cells: [], solution: [[1, 1], [2, 2]] },
                { id: '1-10', name: 'Four Corners', grid: 4, rowTargets: [2, 1, 1, 2], colTargets: [2, 1, 1, 2], cells: [], solution: [[0, 0], [3, 3]] },
                { id: '1-11', name: 'Center Mass', grid: 4, rowTargets: [2, 8, 8, 2], colTargets: [2, 8, 8, 2], cells: [], solution: [[1, 1], [2, 1], [1, 2], [2, 2]] },
                { id: '1-12', name: 'Edge Walk', grid: 4, rowTargets: [4, 2, 2, 4], colTargets: [4, 2, 2, 4], cells: [], solution: [[0, 0], [3, 0], [0, 3], [3, 3]] },
                { id: '1-13', name: 'The Plus', grid: 4, rowTargets: [2, 8, 8, 2], colTargets: [2, 8, 8, 2], cells: [], solution: [[1, 1], [2, 1], [1, 2], [2, 2]] },
                { id: '1-14', name: 'Staircase', grid: 4, rowTargets: [3, 5, 5, 3], colTargets: [3, 5, 5, 3], cells: [], solution: [[0, 0], [1, 1], [2, 2], [3, 3]] },
                { id: '1-15', name: 'Waves', grid: 4, rowTargets: [2, 7, 7, 2], colTargets: [4, 5, 5, 4], cells: [], solution: [[0, 1], [1, 1], [2, 2], [3, 2]] },
                { id: '1-16', name: 'Checkers', grid: 4, rowTargets: [7, 9, 9, 7], colTargets: [7, 9, 9, 7], cells: [], solution: [[0, 0], [2, 0], [1, 1], [3, 1], [0, 2], [2, 2], [1, 3], [3, 3]] },
                { id: '1-17', name: 'The Frame', grid: 4, rowTargets: [4, 2, 2, 4], colTargets: [4, 2, 2, 4], cells: [], solution: [[0, 0], [3, 0], [0, 3], [3, 3]] },
                { id: '1-18', name: 'Crossroads', grid: 4, rowTargets: [3, 11, 11, 3], colTargets: [5, 9, 9, 5], cells: [], solution: [[1, 1], [2, 1], [1, 2], [2, 2], [0, 1], [3, 2]] },
                { id: '1-19', name: 'Diamond', grid: 4, rowTargets: [4, 4, 4, 4], colTargets: [4, 4, 4, 4], cells: [], solution: [[1, 0], [0, 1], [3, 2], [2, 3]] },
                { id: '1-20', name: 'Ripple Chain', grid: 4, rowTargets: [1, 4, 4, 1], colTargets: [1, 4, 4, 1], cells: [], solution: [[1, 1], [2, 2]] },
                { id: '1-21', name: 'Offset', grid: 4, rowTargets: [4, 5, 5, 4], colTargets: [2, 7, 7, 2], cells: [], solution: [[1, 0], [2, 1], [1, 2], [2, 3]] },
                { id: '1-22', name: 'Sparse', grid: 4, rowTargets: [2, 1, 1, 2], colTargets: [2, 1, 1, 2], cells: [], solution: [[0, 0], [3, 3]] },
                { id: '1-23', name: 'Full Grid', grid: 3, rowTargets: [5, 7, 5], colTargets: [5, 7, 5], cells: [], solution: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]] },
                { id: '1-24', name: 'Overflow', grid: 4, rowTargets: [5, 6, 7, 7], colTargets: [5, 7, 8, 5], cells: [], solution: [[1, 0], [0, 1], [3, 1], [2, 2], [1, 3], [2, 3]] },
                { id: '1-25', name: 'Scatter', grid: 4, rowTargets: [4, 4, 8, 6], colTargets: [5, 6, 6, 5], cells: [], solution: [[0, 0], [3, 0], [1, 2], [2, 2], [0, 3], [3, 3]] },
                { id: '1-26', name: 'Mirror', grid: 4, rowTargets: [1, 4, 4, 1], colTargets: [1, 4, 4, 1], cells: [], solution: [[1, 1], [2, 2]] },
                { id: '1-27', name: 'Cascade', grid: 4, rowTargets: [2, 7, 5, 1], colTargets: [1, 5, 7, 2], cells: [], solution: [[1, 1], [2, 1], [2, 2]] },
                { id: '1-28', name: 'Puzzle Box', grid: 4, rowTargets: [7, 6, 6, 7], colTargets: [3, 10, 10, 3], cells: [], solution: [[1, 0], [2, 0], [1, 1], [2, 2], [1, 3], [2, 3]] },
                { id: '1-29', name: 'Balance', grid: 4, rowTargets: [4, 5, 5, 4], colTargets: [2, 7, 7, 2], cells: [], solution: [[1, 0], [2, 1], [1, 2], [2, 3]] },
                { id: '1-30', name: 'Graduation', grid: 4, rowTargets: [2, 8, 8, 2], colTargets: [2, 8, 8, 2], cells: [], solution: [[1, 1], [2, 1], [1, 2], [2, 2]] }
            ]
        },
        {
            id: 'chapter-2',
            name: 'Stone Path',
            description: 'Master the art of blocking',
            levels: [
                { id: '2-1', name: 'First Block', grid: 3, rowTargets: [2, 2, 2], colTargets: [3, 0, 3], cells: [{ x: 1, y: 1, type: 'blocker' }], solution: [[0, 1], [2, 1]] },
                { id: '2-2', name: 'Split Path', grid: 4, rowTargets: [2, 1, 1, 2], colTargets: [2, 1, 1, 2], cells: [{ x: 1, y: 1, type: 'blocker' }, { x: 2, y: 2, type: 'blocker' }], solution: [[0, 0], [3, 3]] },
                { id: '2-3', name: 'Wall', grid: 4, rowTargets: [2, 2, 2, 2], colTargets: [4, 0, 0, 4], cells: [{ x: 1, y: 0, type: 'blocker' }, { x: 1, y: 1, type: 'blocker' }, { x: 1, y: 2, type: 'blocker' }, { x: 1, y: 3, type: 'blocker' }, { x: 2, y: 0, type: 'blocker' }, { x: 2, y: 1, type: 'blocker' }, { x: 2, y: 2, type: 'blocker' }, { x: 2, y: 3, type: 'blocker' }], solution: [[0, 0], [0, 3], [3, 0], [3, 3]] },
                { id: '2-4', name: 'Island', grid: 4, rowTargets: [2, 1, 1, 2], colTargets: [2, 1, 1, 2], cells: [{ x: 1, y: 1, type: 'blocker' }, { x: 2, y: 1, type: 'blocker' }, { x: 1, y: 2, type: 'blocker' }, { x: 2, y: 2, type: 'blocker' }], solution: [[0, 0], [3, 3]] },
                { id: '2-5', name: 'Corners Blocked', grid: 4, rowTargets: [2, 8, 8, 2], colTargets: [2, 8, 8, 2], cells: [{ x: 0, y: 0, type: 'blocker' }, { x: 3, y: 0, type: 'blocker' }, { x: 0, y: 3, type: 'blocker' }, { x: 3, y: 3, type: 'blocker' }], solution: [[1, 1], [2, 1], [1, 2], [2, 2]] },
                { id: '2-6', name: 'Channel', grid: 4, rowTargets: [0, 7, 7, 0], colTargets: [3, 4, 4, 3], cells: [{ x: 0, y: 0, type: 'blocker' }, { x: 1, y: 0, type: 'blocker' }, { x: 2, y: 0, type: 'blocker' }, { x: 3, y: 0, type: 'blocker' }, { x: 0, y: 3, type: 'blocker' }, { x: 1, y: 3, type: 'blocker' }, { x: 2, y: 3, type: 'blocker' }, { x: 3, y: 3, type: 'blocker' }], solution: [[0, 1], [1, 2], [2, 1], [3, 2]] },
                { id: '2-7', name: 'Zigzag', grid: 4, rowTargets: [2, 3, 3, 2], colTargets: [5, 0, 0, 5], cells: [{ x: 1, y: 0, type: 'blocker' }, { x: 2, y: 1, type: 'blocker' }, { x: 1, y: 2, type: 'blocker' }, { x: 2, y: 3, type: 'blocker' }], solution: [[0, 0], [3, 1], [0, 2], [3, 3]] },
                { id: '2-8', name: 'Cross Block', grid: 5, rowTargets: [2, 4, 0, 4, 2], colTargets: [2, 4, 0, 4, 2], cells: [{ x: 2, y: 0, type: 'blocker' }, { x: 2, y: 1, type: 'blocker' }, { x: 0, y: 2, type: 'blocker' }, { x: 1, y: 2, type: 'blocker' }, { x: 2, y: 2, type: 'blocker' }, { x: 3, y: 2, type: 'blocker' }, { x: 4, y: 2, type: 'blocker' }, { x: 2, y: 3, type: 'blocker' }, { x: 2, y: 4, type: 'blocker' }], solution: [[1, 1], [3, 1], [1, 3], [3, 3]] },
                { id: '2-9', name: 'Maze Start', grid: 5, rowTargets: [4, 3, 3, 3, 4], colTargets: [4, 3, 3, 3, 4], cells: [{ x: 1, y: 1, type: 'blocker' }, { x: 3, y: 1, type: 'blocker' }, { x: 1, y: 3, type: 'blocker' }, { x: 3, y: 3, type: 'blocker' }], solution: [[0, 0], [4, 0], [2, 2], [0, 4], [4, 4]] },
                { id: '2-10', name: 'Narrow Pass', grid: 5, rowTargets: [0, 5, 7, 7, 0], colTargets: [3, 4, 5, 4, 3], cells: [{ x: 0, y: 0, type: 'blocker' }, { x: 1, y: 0, type: 'blocker' }, { x: 2, y: 0, type: 'blocker' }, { x: 3, y: 0, type: 'blocker' }, { x: 4, y: 0, type: 'blocker' }, { x: 0, y: 4, type: 'blocker' }, { x: 1, y: 4, type: 'blocker' }, { x: 2, y: 4, type: 'blocker' }, { x: 3, y: 4, type: 'blocker' }, { x: 4, y: 4, type: 'blocker' }], solution: [[0, 1], [2, 2], [4, 1], [1, 3], [3, 3]] },
                { id: '2-11', name: 'Fortress', grid: 5, rowTargets: [4, 2, 1, 2, 4], colTargets: [4, 2, 1, 2, 4], cells: [{ x: 1, y: 1, type: 'blocker' }, { x: 2, y: 1, type: 'blocker' }, { x: 3, y: 1, type: 'blocker' }, { x: 1, y: 2, type: 'blocker' }, { x: 3, y: 2, type: 'blocker' }, { x: 1, y: 3, type: 'blocker' }, { x: 2, y: 3, type: 'blocker' }, { x: 3, y: 3, type: 'blocker' }], solution: [[0, 0], [4, 0], [2, 2], [0, 4], [4, 4]] },
                { id: '2-12', name: 'Scattered Blocks', grid: 5, rowTargets: [3, 6, 6, 6, 3], colTargets: [4, 6, 4, 6, 4], cells: [{ x: 0, y: 0, type: 'blocker' }, { x: 2, y: 2, type: 'blocker' }, { x: 4, y: 4, type: 'blocker' }], solution: [[1, 0], [3, 1], [0, 2], [4, 2], [1, 3], [3, 4]] },
                { id: '2-13', name: 'Blocked Center', grid: 5, rowTargets: [2, 6, 4, 6, 2], colTargets: [2, 6, 4, 6, 2], cells: [{ x: 2, y: 2, type: 'blocker' }], solution: [[1, 1], [3, 1], [1, 3], [3, 3]] },
                { id: '2-14', name: 'Frame', grid: 5, rowTargets: [4, 2, 0, 2, 4], colTargets: [4, 2, 0, 2, 4], cells: [{ x: 1, y: 1, type: 'blocker' }, { x: 2, y: 1, type: 'blocker' }, { x: 3, y: 1, type: 'blocker' }, { x: 1, y: 2, type: 'blocker' }, { x: 2, y: 2, type: 'blocker' }, { x: 3, y: 2, type: 'blocker' }, { x: 1, y: 3, type: 'blocker' }, { x: 2, y: 3, type: 'blocker' }, { x: 3, y: 3, type: 'blocker' }], solution: [[0, 0], [4, 0], [0, 4], [4, 4]] },
                { id: '2-15', name: 'Asymmetric', grid: 5, rowTargets: [3, 5, 4, 2, 3], colTargets: [3, 5, 4, 4, 1], cells: [{ x: 0, y: 2, type: 'blocker' }, { x: 4, y: 0, type: 'blocker' }], solution: [[0, 0], [1, 1], [3, 2], [2, 4]] },
                { id: '2-16', name: 'Obstacle Course', grid: 5, rowTargets: [4, 1, 3, 1, 4], colTargets: [2, 3, 3, 3, 2], cells: [{ x: 0, y: 1, type: 'blocker' }, { x: 4, y: 1, type: 'blocker' }, { x: 0, y: 3, type: 'blocker' }, { x: 4, y: 3, type: 'blocker' }], solution: [[0, 0], [4, 0], [2, 2], [0, 4], [4, 4]] },
                { id: '2-17', name: 'Tunnel', grid: 5, rowTargets: [0, 7, 6, 7, 0], colTargets: [4, 4, 4, 4, 4], cells: [{ x: 0, y: 0, type: 'blocker' }, { x: 1, y: 0, type: 'blocker' }, { x: 2, y: 0, type: 'blocker' }, { x: 3, y: 0, type: 'blocker' }, { x: 4, y: 0, type: 'blocker' }, { x: 0, y: 4, type: 'blocker' }, { x: 1, y: 4, type: 'blocker' }, { x: 2, y: 4, type: 'blocker' }, { x: 3, y: 4, type: 'blocker' }, { x: 4, y: 4, type: 'blocker' }], solution: [[0, 1], [2, 1], [4, 1], [0, 3], [2, 3], [4, 3]] },
                { id: '2-18', name: 'Checkerboard', grid: 5, rowTargets: [3, 0, 3, 0, 3], colTargets: [3, 0, 3, 0, 3], cells: [{ x: 1, y: 0, type: 'blocker' }, { x: 3, y: 0, type: 'blocker' }, { x: 0, y: 1, type: 'blocker' }, { x: 2, y: 1, type: 'blocker' }, { x: 4, y: 1, type: 'blocker' }, { x: 1, y: 2, type: 'blocker' }, { x: 3, y: 2, type: 'blocker' }, { x: 0, y: 3, type: 'blocker' }, { x: 2, y: 3, type: 'blocker' }, { x: 4, y: 3, type: 'blocker' }, { x: 1, y: 4, type: 'blocker' }, { x: 3, y: 4, type: 'blocker' }], solution: [[0, 0], [2, 0], [4, 0], [0, 2], [2, 2], [4, 2], [0, 4], [2, 4], [4, 4]] },
                { id: '2-19', name: 'Lanes', grid: 5, rowTargets: [4, 0, 0, 0, 4], colTargets: [2, 2, 0, 2, 2], cells: [{ x: 2, y: 0, type: 'blocker' }, { x: 0, y: 1, type: 'blocker' }, { x: 1, y: 1, type: 'blocker' }, { x: 2, y: 1, type: 'blocker' }, { x: 3, y: 1, type: 'blocker' }, { x: 4, y: 1, type: 'blocker' }, { x: 2, y: 2, type: 'blocker' }, { x: 0, y: 3, type: 'blocker' }, { x: 1, y: 3, type: 'blocker' }, { x: 2, y: 3, type: 'blocker' }, { x: 3, y: 3, type: 'blocker' }, { x: 4, y: 3, type: 'blocker' }, { x: 2, y: 4, type: 'blocker' }], solution: [[0, 0], [4, 0], [0, 4], [4, 4]] },
                { id: '2-20', name: 'Blocked Diamond', grid: 5, rowTargets: [5, 9, 8, 9, 5], colTargets: [5, 9, 8, 9, 5], cells: [{ x: 0, y: 0, type: 'blocker' }, { x: 4, y: 0, type: 'blocker' }, { x: 0, y: 4, type: 'blocker' }, { x: 4, y: 4, type: 'blocker' }], solution: [[2, 0], [1, 1], [3, 1], [0, 2], [4, 2], [1, 3], [3, 3], [2, 4]] },
                { id: '2-21', name: 'Plus Sign', grid: 5, rowTargets: [1, 6, 11, 6, 1], colTargets: [1, 6, 11, 6, 1], cells: [{ x: 0, y: 0, type: 'blocker' }, { x: 1, y: 0, type: 'blocker' }, { x: 3, y: 0, type: 'blocker' }, { x: 4, y: 0, type: 'blocker' }, { x: 0, y: 1, type: 'blocker' }, { x: 4, y: 1, type: 'blocker' }, { x: 0, y: 3, type: 'blocker' }, { x: 4, y: 3, type: 'blocker' }, { x: 0, y: 4, type: 'blocker' }, { x: 1, y: 4, type: 'blocker' }, { x: 3, y: 4, type: 'blocker' }, { x: 4, y: 4, type: 'blocker' }], solution: [[2, 0], [1, 1], [3, 1], [0, 2], [2, 2], [4, 2], [1, 3], [3, 3], [2, 4]] },
                { id: '2-22', name: 'Spiral', grid: 5, rowTargets: [4, 7, 4, 7, 4], colTargets: [4, 7, 4, 7, 4], cells: [{ x: 2, y: 0, type: 'blocker' }, { x: 0, y: 2, type: 'blocker' }, { x: 4, y: 2, type: 'blocker' }, { x: 2, y: 4, type: 'blocker' }], solution: [[0, 0], [1, 1], [3, 1], [1, 3], [3, 3], [4, 4]] },
                { id: '2-23', name: 'Bridge', grid: 5, rowTargets: [2, 8, 10, 8, 2], colTargets: [3, 9, 6, 9, 3], cells: [{ x: 0, y: 0, type: 'blocker' }, { x: 2, y: 0, type: 'blocker' }, { x: 4, y: 0, type: 'blocker' }, { x: 0, y: 4, type: 'blocker' }, { x: 2, y: 4, type: 'blocker' }, { x: 4, y: 4, type: 'blocker' }], solution: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]] },
                { id: '2-24', name: 'Corners Only', grid: 5, rowTargets: [4, 2, 0, 2, 4], colTargets: [4, 2, 0, 2, 4], cells: [{ x: 2, y: 0, type: 'blocker' }, { x: 0, y: 2, type: 'blocker' }, { x: 1, y: 2, type: 'blocker' }, { x: 2, y: 2, type: 'blocker' }, { x: 3, y: 2, type: 'blocker' }, { x: 4, y: 2, type: 'blocker' }, { x: 2, y: 4, type: 'blocker' }], solution: [[0, 0], [4, 0], [0, 4], [4, 4]] },
                { id: '2-25', name: 'Grid Lock', grid: 5, rowTargets: [7, 6, 7, 6, 7], colTargets: [7, 6, 7, 6, 7], cells: [{ x: 1, y: 1, type: 'blocker' }, { x: 3, y: 1, type: 'blocker' }, { x: 1, y: 3, type: 'blocker' }, { x: 3, y: 3, type: 'blocker' }], solution: [[0, 0], [2, 0], [4, 0], [0, 2], [2, 2], [4, 2], [0, 4], [2, 4], [4, 4]] },
                { id: '2-26', name: 'Slalom', grid: 5, rowTargets: [3, 5, 5, 5, 3], colTargets: [7, 2, 6, 0, 6], cells: [{ x: 1, y: 0, type: 'blocker' }, { x: 3, y: 1, type: 'blocker' }, { x: 1, y: 2, type: 'blocker' }, { x: 3, y: 3, type: 'blocker' }, { x: 1, y: 4, type: 'blocker' }], solution: [[0, 0], [2, 1], [4, 1], [0, 2], [2, 3], [4, 3], [0, 4]] },
                { id: '2-27', name: 'Pocket', grid: 5, rowTargets: [5, 7, 4, 7, 5], colTargets: [2, 8, 8, 8, 2], cells: [{ x: 0, y: 0, type: 'blocker' }, { x: 4, y: 0, type: 'blocker' }, { x: 2, y: 2, type: 'blocker' }, { x: 0, y: 4, type: 'blocker' }, { x: 4, y: 4, type: 'blocker' }], solution: [[2, 0], [1, 1], [3, 1], [1, 3], [3, 3], [2, 4]] },
                { id: '2-28', name: 'Winding Path', grid: 5, rowTargets: [3, 4, 3, 4, 3], colTargets: [4, 1, 7, 1, 4], cells: [{ x: 1, y: 0, type: 'blocker' }, { x: 3, y: 0, type: 'blocker' }, { x: 1, y: 4, type: 'blocker' }, { x: 3, y: 4, type: 'blocker' }], solution: [[0, 0], [2, 0], [4, 0], [2, 2], [0, 4], [2, 4], [4, 4]] },
                { id: '2-29', name: 'Strategic Blocks', grid: 5, rowTargets: [2, 6, 4, 6, 2], colTargets: [2, 6, 4, 6, 2], cells: [{ x: 0, y: 0, type: 'blocker' }, { x: 2, y: 2, type: 'blocker' }, { x: 4, y: 4, type: 'blocker' }], solution: [[1, 1], [3, 1], [1, 3], [3, 3]] },
                { id: '2-30', name: 'Mastery', grid: 5, rowTargets: [5, 10, 11, 10, 5], colTargets: [5, 10, 11, 10, 5], cells: [{ x: 0, y: 0, type: 'blocker' }, { x: 4, y: 0, type: 'blocker' }, { x: 0, y: 4, type: 'blocker' }, { x: 4, y: 4, type: 'blocker' }], solution: [[2, 0], [1, 1], [3, 1], [0, 2], [2, 2], [4, 2], [1, 3], [3, 3], [2, 4]] }
            ]
        },
        {
            id: 'chapter-3',
            name: 'Spirit Garden',
            description: 'Discover the power of boosters',
            levels: [
                { id: '3-1', name: 'First Boost', grid: 3, rowTargets: [2, 6, 2], colTargets: [2, 6, 2], cells: [{ x: 1, y: 1, type: 'booster' }], solution: [[1, 1]] },
                { id: '3-2', name: 'Double Power', grid: 3, rowTargets: [4, 12, 4], colTargets: [4, 12, 4], cells: [{ x: 1, y: 1, type: 'booster' }], solution: [[1, 1], [1, 1]] },
                { id: '3-3', name: 'Corner Boost', grid: 3, rowTargets: [4, 2, 0], colTargets: [4, 2, 0], cells: [{ x: 0, y: 0, type: 'booster' }], solution: [[0, 0]] },
                { id: '3-4', name: 'Mixed Taps', grid: 3, rowTargets: [4, 7, 2], colTargets: [4, 7, 2], cells: [{ x: 1, y: 1, type: 'booster' }], solution: [[0, 0], [1, 1]] },
                { id: '3-5', name: 'Two Boosters', grid: 4, rowTargets: [2, 8, 8, 2], colTargets: [2, 8, 8, 2], cells: [{ x: 1, y: 1, type: 'booster' }, { x: 2, y: 2, type: 'booster' }], solution: [[1, 1], [2, 2]] },
                { id: '3-6', name: 'Boost Line', grid: 4, rowTargets: [2, 6, 6, 2], colTargets: [6, 2, 2, 6], cells: [{ x: 0, y: 1, type: 'booster' }, { x: 3, y: 2, type: 'booster' }], solution: [[0, 1], [3, 2]] },
                { id: '3-7', name: 'Strategic Boost', grid: 4, rowTargets: [2, 6, 2, 0], colTargets: [2, 6, 2, 0], cells: [{ x: 1, y: 1, type: 'booster' }], solution: [[1, 1]] },
                { id: '3-8', name: 'Boost Chain', grid: 4, rowTargets: [2, 8, 8, 2], colTargets: [2, 8, 8, 2], cells: [{ x: 1, y: 1, type: 'booster' }, { x: 2, y: 1, type: 'booster' }, { x: 1, y: 2, type: 'booster' }, { x: 2, y: 2, type: 'booster' }], solution: [[1, 1], [2, 2]] },
                { id: '3-9', name: 'Selective Power', grid: 4, rowTargets: [4, 7, 2, 0], colTargets: [4, 7, 2, 0], cells: [{ x: 1, y: 1, type: 'booster' }], solution: [[0, 0], [1, 1]] },
                { id: '3-10', name: 'Booster Grid', grid: 4, rowTargets: [4, 16, 16, 4], colTargets: [4, 16, 16, 4], cells: [{ x: 1, y: 1, type: 'booster' }, { x: 2, y: 1, type: 'booster' }, { x: 1, y: 2, type: 'booster' }, { x: 2, y: 2, type: 'booster' }], solution: [[1, 1], [2, 1], [1, 2], [2, 2]] },
                { id: '3-11', name: 'Power Corners', grid: 4, rowTargets: [4, 2, 2, 4], colTargets: [4, 2, 2, 4], cells: [{ x: 0, y: 0, type: 'booster' }, { x: 3, y: 3, type: 'booster' }], solution: [[0, 0], [3, 3]] },
                { id: '3-12', name: 'Central Boost', grid: 5, rowTargets: [0, 2, 6, 2, 0], colTargets: [0, 2, 6, 2, 0], cells: [{ x: 2, y: 2, type: 'booster' }], solution: [[2, 2]] },
                { id: '3-13', name: 'Boost Cross', grid: 5, rowTargets: [0, 2, 6, 2, 0], colTargets: [0, 2, 6, 2, 0], cells: [{ x: 2, y: 1, type: 'booster' }, { x: 1, y: 2, type: 'booster' }, { x: 2, y: 2, type: 'booster' }, { x: 3, y: 2, type: 'booster' }, { x: 2, y: 3, type: 'booster' }], solution: [[2, 2]] },
                { id: '3-14', name: 'Scattered Boosts', grid: 5, rowTargets: [8, 4, 0, 4, 8], colTargets: [8, 4, 0, 4, 8], cells: [{ x: 0, y: 0, type: 'booster' }, { x: 4, y: 0, type: 'booster' }, { x: 0, y: 4, type: 'booster' }, { x: 4, y: 4, type: 'booster' }], solution: [[0, 0], [4, 0], [0, 4], [4, 4]] },
                { id: '3-15', name: 'Power Mix', grid: 5, rowTargets: [1, 5, 8, 5, 1], colTargets: [1, 5, 8, 5, 1], cells: [{ x: 2, y: 2, type: 'booster' }], solution: [[1, 1], [2, 2], [3, 3]] },
                { id: '3-16', name: 'Boost Blocked', grid: 5, rowTargets: [2, 6, 4, 6, 2], colTargets: [2, 6, 4, 6, 2], cells: [{ x: 2, y: 2, type: 'blocker' }, { x: 1, y: 1, type: 'booster' }, { x: 3, y: 3, type: 'booster' }], solution: [[1, 1], [3, 3]] },
                { id: '3-17', name: 'Power Frame', grid: 5, rowTargets: [8, 4, 0, 4, 8], colTargets: [8, 4, 0, 4, 8], cells: [{ x: 0, y: 0, type: 'booster' }, { x: 4, y: 0, type: 'booster' }, { x: 2, y: 2, type: 'blocker' }, { x: 0, y: 4, type: 'booster' }, { x: 4, y: 4, type: 'booster' }], solution: [[0, 0], [4, 0], [0, 4], [4, 4]] },
                { id: '3-18', name: 'Diagonal Boost', grid: 5, rowTargets: [4, 4, 6, 4, 4], colTargets: [4, 4, 6, 4, 4], cells: [{ x: 0, y: 0, type: 'booster' }, { x: 1, y: 1, type: 'booster' }, { x: 2, y: 2, type: 'booster' }, { x: 3, y: 3, type: 'booster' }, { x: 4, y: 4, type: 'booster' }], solution: [[0, 0], [2, 2], [4, 4]] },
                { id: '3-19', name: 'Boost Islands', grid: 5, rowTargets: [4, 12, 8, 12, 4], colTargets: [4, 12, 8, 12, 4], cells: [{ x: 1, y: 1, type: 'booster' }, { x: 3, y: 1, type: 'booster' }, { x: 2, y: 2, type: 'blocker' }, { x: 1, y: 3, type: 'booster' }, { x: 3, y: 3, type: 'booster' }], solution: [[1, 1], [3, 1], [1, 3], [3, 3]] },
                { id: '3-20', name: 'Power Surge', grid: 5, rowTargets: [2, 10, 16, 10, 2], colTargets: [2, 10, 16, 10, 2], cells: [{ x: 2, y: 1, type: 'booster' }, { x: 1, y: 2, type: 'booster' }, { x: 2, y: 2, type: 'booster' }, { x: 3, y: 2, type: 'booster' }, { x: 2, y: 3, type: 'booster' }], solution: [[2, 1], [1, 2], [3, 2], [2, 3]] },
                { id: '3-21', name: 'Balanced Power', grid: 5, rowTargets: [4, 4, 6, 4, 4], colTargets: [4, 4, 6, 4, 4], cells: [{ x: 2, y: 2, type: 'booster' }], solution: [[0, 0], [4, 0], [2, 2], [0, 4], [4, 4]] },
                { id: '3-22', name: 'Boost Wall', grid: 5, rowTargets: [0, 4, 12, 4, 0], colTargets: [0, 2, 8, 8, 2], cells: [{ x: 0, y: 0, type: 'blocker' }, { x: 0, y: 1, type: 'blocker' }, { x: 0, y: 2, type: 'blocker' }, { x: 0, y: 3, type: 'blocker' }, { x: 0, y: 4, type: 'blocker' }, { x: 2, y: 2, type: 'booster' }, { x: 3, y: 2, type: 'booster' }], solution: [[2, 2], [3, 2]] },
                { id: '3-23', name: 'Power Channel', grid: 5, rowTargets: [0, 6, 10, 6, 0], colTargets: [4, 4, 6, 4, 4], cells: [{ x: 0, y: 0, type: 'blocker' }, { x: 1, y: 0, type: 'blocker' }, { x: 2, y: 0, type: 'blocker' }, { x: 3, y: 0, type: 'blocker' }, { x: 4, y: 0, type: 'blocker' }, { x: 0, y: 4, type: 'blocker' }, { x: 1, y: 4, type: 'blocker' }, { x: 2, y: 4, type: 'blocker' }, { x: 3, y: 4, type: 'blocker' }, { x: 4, y: 4, type: 'blocker' }, { x: 2, y: 2, type: 'booster' }], solution: [[0, 1], [2, 2], [4, 1], [0, 3], [4, 3]] },
                { id: '3-24', name: 'Boost Maze', grid: 5, rowTargets: [3, 5, 6, 5, 3], colTargets: [4, 2, 10, 2, 4], cells: [{ x: 1, y: 0, type: 'blocker' }, { x: 3, y: 0, type: 'blocker' }, { x: 2, y: 2, type: 'booster' }, { x: 1, y: 4, type: 'blocker' }, { x: 3, y: 4, type: 'blocker' }], solution: [[0, 0], [2, 0], [4, 0], [2, 2], [0, 4], [2, 4], [4, 4]] },
                { id: '3-25', name: 'Power Plus', grid: 5, rowTargets: [3, 5, 10, 5, 3], colTargets: [3, 5, 10, 5, 3], cells: [{ x: 0, y: 0, type: 'blocker' }, { x: 4, y: 0, type: 'blocker' }, { x: 2, y: 2, type: 'booster' }, { x: 0, y: 4, type: 'blocker' }, { x: 4, y: 4, type: 'blocker' }], solution: [[2, 0], [0, 2], [2, 2], [4, 2], [2, 4]] },
                { id: '3-26', name: 'Booster Ring', grid: 5, rowTargets: [4, 12, 8, 12, 4], colTargets: [4, 12, 8, 12, 4], cells: [{ x: 1, y: 1, type: 'booster' }, { x: 2, y: 1, type: 'booster' }, { x: 3, y: 1, type: 'booster' }, { x: 1, y: 2, type: 'booster' }, { x: 3, y: 2, type: 'booster' }, { x: 1, y: 3, type: 'booster' }, { x: 2, y: 3, type: 'booster' }, { x: 3, y: 3, type: 'booster' }, { x: 2, y: 2, type: 'blocker' }], solution: [[1, 1], [3, 1], [1, 3], [3, 3]] },
                { id: '3-27', name: 'Power Scatter', grid: 5, rowTargets: [5, 7, 8, 7, 5], colTargets: [5, 7, 8, 7, 5], cells: [{ x: 0, y: 0, type: 'booster' }, { x: 2, y: 2, type: 'booster' }, { x: 4, y: 4, type: 'booster' }], solution: [[0, 0], [2, 2], [4, 4], [1, 1], [3, 3]] },
                { id: '3-28', name: 'Boost Lines', grid: 5, rowTargets: [4, 8, 8, 8, 4], colTargets: [12, 4, 0, 4, 12], cells: [{ x: 0, y: 1, type: 'booster' }, { x: 1, y: 1, type: 'booster' }, { x: 3, y: 1, type: 'booster' }, { x: 4, y: 1, type: 'booster' }, { x: 0, y: 3, type: 'booster' }, { x: 1, y: 3, type: 'booster' }, { x: 3, y: 3, type: 'booster' }, { x: 4, y: 3, type: 'booster' }], solution: [[0, 1], [4, 1], [0, 3], [4, 3]] },
                { id: '3-29', name: 'Ultimate Boost', grid: 5, rowTargets: [6, 8, 14, 8, 6], colTargets: [6, 8, 14, 8, 6], cells: [{ x: 2, y: 0, type: 'booster' }, { x: 0, y: 2, type: 'booster' }, { x: 2, y: 2, type: 'booster' }, { x: 4, y: 2, type: 'booster' }, { x: 2, y: 4, type: 'booster' }], solution: [[2, 0], [0, 2], [2, 2], [4, 2], [2, 4]] },
                { id: '3-30', name: 'Spirit Master', grid: 5, rowTargets: [4, 12, 8, 12, 4], colTargets: [4, 12, 8, 12, 4], cells: [{ x: 1, y: 1, type: 'booster' }, { x: 2, y: 1, type: 'booster' }, { x: 3, y: 1, type: 'booster' }, { x: 1, y: 2, type: 'booster' }, { x: 2, y: 2, type: 'blocker' }, { x: 3, y: 2, type: 'booster' }, { x: 1, y: 3, type: 'booster' }, { x: 2, y: 3, type: 'booster' }, { x: 3, y: 3, type: 'booster' }], solution: [[1, 1], [3, 1], [1, 3], [3, 3]] }
            ]
        },
        {
            id: 'chapter-4',
            name: "Master's Challenge",
            description: 'Prove your mastery with tap limits',
            levels: [
                { id: '4-1', name: 'Limited Taps', grid: 4, rowTargets: [1, 4, 4, 1], colTargets: [1, 4, 4, 1], cells: [{ x: 1, y: 1, maxTaps: 1 }, { x: 2, y: 2, maxTaps: 1 }], solution: [[1, 1], [2, 2]] },
                { id: '4-2', name: 'One Shot', grid: 4, rowTargets: [1, 3, 1, 0], colTargets: [1, 3, 1, 0], cells: [{ x: 1, y: 1, maxTaps: 1 }], solution: [[1, 1]] },
                { id: '4-3', name: 'No Center', grid: 4, rowTargets: [4, 2, 2, 4], colTargets: [4, 2, 2, 4], cells: [{ x: 1, y: 1, maxTaps: 0 }, { x: 2, y: 1, maxTaps: 0 }, { x: 1, y: 2, maxTaps: 0 }, { x: 2, y: 2, maxTaps: 0 }], solution: [[0, 0], [3, 0], [0, 3], [3, 3]] },
                { id: '4-4', name: 'Edge Only', grid: 4, rowTargets: [5, 5, 5, 5], colTargets: [7, 3, 3, 7], cells: [{ x: 1, y: 1, maxTaps: 0 }, { x: 2, y: 1, maxTaps: 0 }, { x: 1, y: 2, maxTaps: 0 }, { x: 2, y: 2, maxTaps: 0 }], solution: [[0, 0], [3, 0], [0, 1], [3, 2], [0, 3], [3, 3]] },
                { id: '4-5', name: 'Precision', grid: 4, rowTargets: [1, 4, 4, 1], colTargets: [1, 4, 4, 1], cells: [{ x: 1, y: 1, maxTaps: 1 }, { x: 2, y: 1, maxTaps: 1 }, { x: 1, y: 2, maxTaps: 1 }, { x: 2, y: 2, maxTaps: 1 }], solution: [[1, 1], [2, 2]] },
                { id: '4-6', name: 'Limited Power', grid: 4, rowTargets: [2, 8, 8, 2], colTargets: [2, 8, 8, 2], cells: [{ x: 1, y: 1, type: 'booster', maxTaps: 1 }, { x: 2, y: 2, type: 'booster', maxTaps: 1 }], solution: [[1, 1], [2, 2]] },
                { id: '4-7', name: 'Block and Limit', grid: 5, rowTargets: [2, 6, 4, 6, 2], colTargets: [2, 6, 4, 6, 2], cells: [{ x: 2, y: 2, type: 'blocker' }, { x: 1, y: 1, maxTaps: 1 }, { x: 3, y: 1, maxTaps: 1 }, { x: 1, y: 3, maxTaps: 1 }, { x: 3, y: 3, maxTaps: 1 }], solution: [[1, 1], [3, 1], [1, 3], [3, 3]] },
                { id: '4-8', name: 'Strategic Limits', grid: 5, rowTargets: [4, 3, 3, 3, 4], colTargets: [4, 3, 3, 3, 4], cells: [{ x: 0, y: 0, maxTaps: 1 }, { x: 4, y: 0, maxTaps: 1 }, { x: 2, y: 2, maxTaps: 1 }, { x: 0, y: 4, maxTaps: 1 }, { x: 4, y: 4, maxTaps: 1 }], solution: [[0, 0], [4, 0], [2, 2], [0, 4], [4, 4]] },
                { id: '4-9', name: 'Double Limit', grid: 5, rowTargets: [2, 6, 4, 6, 2], colTargets: [2, 6, 4, 6, 2], cells: [{ x: 1, y: 1, maxTaps: 2 }, { x: 3, y: 3, maxTaps: 2 }], solution: [[1, 1], [1, 1], [3, 3], [3, 3]] },
                { id: '4-10', name: 'Power Limited', grid: 5, rowTargets: [0, 4, 12, 4, 0], colTargets: [0, 4, 12, 4, 0], cells: [{ x: 2, y: 2, type: 'booster', maxTaps: 2 }], solution: [[2, 2], [2, 2]] },
                { id: '4-11', name: 'Mixed Limits', grid: 5, rowTargets: [2, 8, 10, 8, 2], colTargets: [2, 8, 10, 8, 2], cells: [{ x: 1, y: 1, maxTaps: 1 }, { x: 3, y: 1, maxTaps: 1 }, { x: 2, y: 2, type: 'booster', maxTaps: 1 }, { x: 1, y: 3, maxTaps: 1 }, { x: 3, y: 3, maxTaps: 1 }], solution: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]] },
                { id: '4-12', name: 'Outer Limits', grid: 5, rowTargets: [4, 2, 0, 2, 4], colTargets: [4, 2, 0, 2, 4], cells: [{ x: 0, y: 0, maxTaps: 1 }, { x: 4, y: 0, maxTaps: 1 }, { x: 0, y: 4, maxTaps: 1 }, { x: 4, y: 4, maxTaps: 1 }, { x: 1, y: 1, maxTaps: 0 }, { x: 2, y: 2, maxTaps: 0 }, { x: 3, y: 3, maxTaps: 0 }], solution: [[0, 0], [4, 0], [0, 4], [4, 4]] },
                { id: '4-13', name: 'Center Locked', grid: 5, rowTargets: [2, 8, 10, 8, 2], colTargets: [3, 9, 6, 9, 3], cells: [{ x: 2, y: 2, maxTaps: 0 }, { x: 1, y: 1, maxTaps: 1 }, { x: 3, y: 1, maxTaps: 1 }, { x: 1, y: 3, maxTaps: 1 }, { x: 3, y: 3, maxTaps: 1 }], solution: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]] },
                { id: '4-14', name: 'Cascade Limit', grid: 5, rowTargets: [3, 5, 10, 5, 3], colTargets: [3, 5, 10, 5, 3], cells: [{ x: 2, y: 0, maxTaps: 1 }, { x: 0, y: 2, maxTaps: 1 }, { x: 2, y: 2, type: 'booster', maxTaps: 1 }, { x: 4, y: 2, maxTaps: 1 }, { x: 2, y: 4, maxTaps: 1 }], solution: [[2, 0], [0, 2], [2, 2], [4, 2], [2, 4]] },
                { id: '4-15', name: 'Power Gate', grid: 5, rowTargets: [4, 12, 8, 12, 4], colTargets: [4, 12, 8, 12, 4], cells: [{ x: 1, y: 1, type: 'booster', maxTaps: 1 }, { x: 3, y: 1, type: 'booster', maxTaps: 1 }, { x: 2, y: 2, type: 'blocker' }, { x: 1, y: 3, type: 'booster', maxTaps: 1 }, { x: 3, y: 3, type: 'booster', maxTaps: 1 }], solution: [[1, 1], [3, 1], [1, 3], [3, 3]] },
                { id: '4-16', name: 'Triple Limit', grid: 5, rowTargets: [0, 3, 9, 3, 0], colTargets: [0, 3, 9, 3, 0], cells: [{ x: 2, y: 2, maxTaps: 3 }], solution: [[2, 2], [2, 2], [2, 2]] },
                { id: '4-17', name: 'Grid of Limits', grid: 5, rowTargets: [2, 7, 7, 7, 2], colTargets: [2, 7, 7, 7, 2], cells: [{ x: 1, y: 1, maxTaps: 1 }, { x: 2, y: 1, maxTaps: 1 }, { x: 3, y: 1, maxTaps: 1 }, { x: 1, y: 2, maxTaps: 1 }, { x: 2, y: 2, maxTaps: 1 }, { x: 3, y: 2, maxTaps: 1 }, { x: 1, y: 3, maxTaps: 1 }, { x: 2, y: 3, maxTaps: 1 }, { x: 3, y: 3, maxTaps: 1 }], solution: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]] },
                { id: '4-18', name: 'Boost Block Limit', grid: 5, rowTargets: [2, 6, 4, 6, 2], colTargets: [2, 6, 4, 6, 2], cells: [{ x: 1, y: 1, type: 'booster', maxTaps: 1 }, { x: 3, y: 1, type: 'blocker' }, { x: 1, y: 3, type: 'blocker' }, { x: 3, y: 3, type: 'booster', maxTaps: 1 }], solution: [[1, 1], [3, 3]] },
                { id: '4-19', name: 'Limited Diagonal', grid: 5, rowTargets: [3, 6, 8, 6, 3], colTargets: [3, 6, 8, 6, 3], cells: [{ x: 0, y: 0, maxTaps: 1 }, { x: 1, y: 1, maxTaps: 1 }, { x: 2, y: 2, type: 'booster', maxTaps: 1 }, { x: 3, y: 3, maxTaps: 1 }, { x: 4, y: 4, maxTaps: 1 }], solution: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]] },
                { id: '4-20', name: 'No Repeat', grid: 5, rowTargets: [2, 7, 7, 7, 2], colTargets: [2, 8, 9, 5, 1], cells: [{ x: 1, y: 1, maxTaps: 1 }, { x: 2, y: 1, maxTaps: 1 }, { x: 3, y: 1, maxTaps: 1 }, { x: 1, y: 2, maxTaps: 1 }, { x: 2, y: 2, maxTaps: 1 }, { x: 3, y: 2, maxTaps: 1 }, { x: 1, y: 3, maxTaps: 1 }, { x: 2, y: 3, maxTaps: 1 }, { x: 3, y: 3, maxTaps: 1 }], solution: [[1, 1], [2, 1], [3, 2], [1, 3], [2, 3]] },
                { id: '4-21', name: '6x6 Intro', grid: 6, rowTargets: [0, 1, 4, 4, 1, 0], colTargets: [0, 1, 4, 4, 1, 0], cells: [{ x: 2, y: 2, maxTaps: 1 }, { x: 3, y: 3, maxTaps: 1 }], solution: [[2, 2], [3, 3]] },
                { id: '4-22', name: 'Big Limited', grid: 6, rowTargets: [0, 2, 8, 8, 2, 0], colTargets: [0, 2, 8, 8, 2, 0], cells: [{ x: 2, y: 2, maxTaps: 1 }, { x: 3, y: 2, maxTaps: 1 }, { x: 2, y: 3, maxTaps: 1 }, { x: 3, y: 3, maxTaps: 1 }], solution: [[2, 2], [3, 2], [2, 3], [3, 3]] },
                { id: '4-23', name: 'Corner Power', grid: 6, rowTargets: [4, 2, 0, 0, 2, 4], colTargets: [4, 2, 0, 0, 2, 4], cells: [{ x: 0, y: 0, type: 'booster', maxTaps: 1 }, { x: 5, y: 5, type: 'booster', maxTaps: 1 }], solution: [[0, 0], [5, 5]] },
                { id: '4-24', name: 'Central Lock', grid: 6, rowTargets: [2, 6, 2, 2, 6, 2], colTargets: [2, 6, 2, 2, 6, 2], cells: [{ x: 2, y: 2, type: 'blocker' }, { x: 3, y: 2, type: 'blocker' }, { x: 2, y: 3, type: 'blocker' }, { x: 3, y: 3, type: 'blocker' }, { x: 1, y: 1, maxTaps: 1 }, { x: 4, y: 1, maxTaps: 1 }, { x: 1, y: 4, maxTaps: 1 }, { x: 4, y: 4, maxTaps: 1 }], solution: [[1, 1], [4, 1], [1, 4], [4, 4]] },
                { id: '4-25', name: 'Complex Limits', grid: 6, rowTargets: [2, 2, 4, 4, 2, 2], colTargets: [2, 2, 4, 4, 2, 2], cells: [{ x: 2, y: 2, maxTaps: 1 }, { x: 3, y: 2, maxTaps: 1 }, { x: 2, y: 3, maxTaps: 1 }, { x: 3, y: 3, maxTaps: 1 }, { x: 0, y: 0, maxTaps: 1 }, { x: 5, y: 5, maxTaps: 1 }], solution: [[0, 0], [2, 2], [3, 3], [5, 5]] },
                { id: '4-26', name: 'Power Grid', grid: 6, rowTargets: [0, 4, 16, 16, 4, 0], colTargets: [0, 4, 16, 16, 4, 0], cells: [{ x: 2, y: 2, type: 'booster', maxTaps: 1 }, { x: 3, y: 2, type: 'booster', maxTaps: 1 }, { x: 2, y: 3, type: 'booster', maxTaps: 1 }, { x: 3, y: 3, type: 'booster', maxTaps: 1 }], solution: [[2, 2], [3, 2], [2, 3], [3, 3]] },
                { id: '4-27', name: 'Blocked Frame', grid: 6, rowTargets: [4, 6, 2, 2, 6, 4], colTargets: [4, 6, 2, 2, 6, 4], cells: [{ x: 0, y: 0, type: 'blocker' }, { x: 5, y: 0, type: 'blocker' }, { x: 0, y: 5, type: 'blocker' }, { x: 5, y: 5, type: 'blocker' }, { x: 1, y: 0, maxTaps: 1 }, { x: 4, y: 0, maxTaps: 1 }, { x: 0, y: 1, maxTaps: 1 }, { x: 5, y: 1, maxTaps: 1 }, { x: 0, y: 4, maxTaps: 1 }, { x: 5, y: 4, maxTaps: 1 }, { x: 1, y: 5, maxTaps: 1 }, { x: 4, y: 5, maxTaps: 1 }], solution: [[1, 0], [4, 0], [0, 1], [5, 1], [0, 4], [5, 4], [1, 5], [4, 5]] },
                { id: '4-28', name: 'Ultimate Mix', grid: 6, rowTargets: [0, 2, 8, 8, 2, 0], colTargets: [0, 2, 8, 8, 2, 0], cells: [{ x: 2, y: 2, type: 'booster', maxTaps: 1 }, { x: 3, y: 3, type: 'booster', maxTaps: 1 }, { x: 0, y: 0, type: 'blocker' }, { x: 5, y: 5, type: 'blocker' }], solution: [[2, 2], [3, 3]] },
                { id: '4-29', name: 'Final Test', grid: 6, rowTargets: [4, 4, 8, 8, 4, 4], colTargets: [4, 4, 8, 8, 4, 4], cells: [{ x: 2, y: 2, type: 'booster', maxTaps: 1 }, { x: 3, y: 2, type: 'booster', maxTaps: 1 }, { x: 2, y: 3, type: 'booster', maxTaps: 1 }, { x: 3, y: 3, type: 'booster', maxTaps: 1 }, { x: 0, y: 0, maxTaps: 1 }, { x: 5, y: 0, maxTaps: 1 }, { x: 0, y: 5, maxTaps: 1 }, { x: 5, y: 5, maxTaps: 1 }], solution: [[0, 0], [5, 0], [2, 2], [3, 3], [0, 5], [5, 5]] },
                { id: '4-30', name: 'Grandmaster', grid: 6, rowTargets: [0, 6, 24, 24, 6, 0], colTargets: [0, 6, 24, 24, 6, 0], cells: [{ x: 2, y: 2, type: 'booster', maxTaps: 2 }, { x: 3, y: 2, type: 'booster', maxTaps: 2 }, { x: 2, y: 3, type: 'booster', maxTaps: 2 }, { x: 3, y: 3, type: 'booster', maxTaps: 2 }], solution: [[2, 2], [3, 2], [2, 3], [3, 3], [2, 2], [3, 3]] }
            ]
        }
    ]
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LevelManager, EMBEDDED_LEVELS };
}
