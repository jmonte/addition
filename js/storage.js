/**
 * Storage Manager - handles saving and loading game progress
 */
class StorageManager {
    constructor() {
        this.prefix = 'rippleAdd_';
        this.isAvailable = this.checkAvailability();
    }

    /**
     * Check if localStorage is available
     */
    checkAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Get a value from storage
     */
    get(key, defaultValue = null) {
        if (!this.isAvailable) return defaultValue;

        try {
            const value = localStorage.getItem(this.prefix + key);
            return value !== null ? JSON.parse(value) : defaultValue;
        } catch (e) {
            console.warn('Failed to read from storage:', e);
            return defaultValue;
        }
    }

    /**
     * Set a value in storage
     */
    set(key, value) {
        if (!this.isAvailable) return false;

        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn('Failed to write to storage:', e);
            return false;
        }
    }

    /**
     * Remove a value from storage
     */
    remove(key) {
        if (!this.isAvailable) return false;

        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Clear all game data
     */
    clearAll() {
        if (!this.isAvailable) return false;

        try {
            const keys = Object.keys(localStorage);
            for (const key of keys) {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    // === Progress Management ===

    /**
     * Get completed levels
     */
    getCompletedLevels() {
        return new Set(this.get('completedLevels', []));
    }

    /**
     * Mark a level as completed
     */
    completeLevel(levelId, taps) {
        const completed = this.getCompletedLevels();
        completed.add(levelId);
        this.set('completedLevels', Array.from(completed));

        // Update best score
        const scores = this.get('levelScores', {});
        if (!scores[levelId] || taps < scores[levelId]) {
            scores[levelId] = taps;
            this.set('levelScores', scores);
        }
    }

    /**
     * Get best score for a level
     */
    getLevelScore(levelId) {
        const scores = this.get('levelScores', {});
        return scores[levelId] || null;
    }

    /**
     * Check if a level is unlocked
     */
    isLevelUnlocked(chapterId, levelIndex, chapters) {
        // First level of first chapter is always unlocked
        if (chapterId === 'chapter-1' && levelIndex === 0) {
            return true;
        }

        const completed = this.getCompletedLevels();

        // Check if previous level in chapter is completed
        const chapter = chapters.find(c => c.id === chapterId);
        if (!chapter) return false;

        if (levelIndex > 0) {
            const prevLevel = chapter.levels[levelIndex - 1];
            return completed.has(prevLevel.id);
        }

        // First level of new chapter - check if previous chapter is complete
        const chapterIndex = chapters.findIndex(c => c.id === chapterId);
        if (chapterIndex > 0) {
            const prevChapter = chapters[chapterIndex - 1];
            const lastLevel = prevChapter.levels[prevChapter.levels.length - 1];
            return completed.has(lastLevel.id);
        }

        return false;
    }

    /**
     * Check if a chapter is unlocked
     */
    isChapterUnlocked(chapterId, chapters) {
        const chapterIndex = chapters.findIndex(c => c.id === chapterId);

        // First chapter always unlocked
        if (chapterIndex === 0) return true;

        // Check if any level in previous chapter is completed
        const prevChapter = chapters[chapterIndex - 1];
        const completed = this.getCompletedLevels();

        // Chapter is unlocked if at least one level from previous chapter is done
        return prevChapter.levels.some(level => completed.has(level.id));
    }

    /**
     * Get the next unlocked level to play
     */
    getNextUnlockedLevel(chapters) {
        const completed = this.getCompletedLevels();

        for (const chapter of chapters) {
            for (let i = 0; i < chapter.levels.length; i++) {
                const level = chapter.levels[i];
                if (!completed.has(level.id) && this.isLevelUnlocked(chapter.id, i, chapters)) {
                    return { chapter, levelIndex: i, level };
                }
            }
        }

        // All levels completed, return first level
        return {
            chapter: chapters[0],
            levelIndex: 0,
            level: chapters[0].levels[0]
        };
    }

    // === Daily Puzzle ===

    /**
     * Get daily puzzle status
     */
    getDailyStatus() {
        return this.get('dailyStatus', {
            lastPlayed: null,
            streak: 0,
            completed: false,
            taps: null
        });
    }

    /**
     * Update daily puzzle status
     */
    updateDailyStatus(dateString, completed, taps) {
        const status = this.getDailyStatus();
        const today = dateString;

        if (status.lastPlayed !== today) {
            // New day
            const yesterday = this.getYesterdayString(today);
            const isConsecutive = status.lastPlayed === yesterday;

            status.streak = isConsecutive ? status.streak + 1 : 1;
            status.lastPlayed = today;
            status.completed = completed;
            status.taps = completed ? taps : null;
        } else if (completed && !status.completed) {
            // Completed today's puzzle
            status.completed = true;
            status.taps = taps;
        }

        this.set('dailyStatus', status);
        return status;
    }

    /**
     * Get yesterday's date string
     */
    getYesterdayString(todayString) {
        const date = new Date(todayString);
        date.setDate(date.getDate() - 1);
        return date.toISOString().split('T')[0];
    }

    /**
     * Get daily history
     */
    getDailyHistory() {
        return this.get('dailyHistory', {});
    }

    /**
     * Add to daily history
     */
    addDailyHistory(dateString, taps) {
        const history = this.getDailyHistory();
        history[dateString] = { taps, completed: true };
        this.set('dailyHistory', history);
    }

    // === Settings ===

    /**
     * Get settings
     */
    getSettings() {
        return this.get('settings', {
            soundEnabled: true,
            hapticEnabled: true
        });
    }

    /**
     * Update settings
     */
    updateSettings(updates) {
        const settings = this.getSettings();
        Object.assign(settings, updates);
        this.set('settings', settings);
        return settings;
    }

    // === Current Game State ===

    /**
     * Save current game state (for resuming)
     */
    saveGameState(levelId, state) {
        this.set('currentGame', {
            levelId,
            state,
            timestamp: Date.now()
        });
    }

    /**
     * Get saved game state
     */
    getSavedGameState() {
        return this.get('currentGame', null);
    }

    /**
     * Clear saved game state
     */
    clearGameState() {
        this.remove('currentGame');
    }
}

// Create singleton instance
const storage = new StorageManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StorageManager, storage };
}
