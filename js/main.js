/**
 * Main Application - entry point and UI controller
 */
class App {
    constructor() {
        // Managers
        this.levelManager = new LevelManager();
        this.game = null;
        this.dailyGame = null;

        // Current state
        this.currentScreen = 'menu';
        this.currentChapterId = null;
        this.currentLevelIndex = 0;
        this.currentPuzzle = null;
        this.isDailyMode = false;

        // DOM elements
        this.screens = {
            menu: document.getElementById('menu-screen'),
            chapter: document.getElementById('chapter-screen'),
            level: document.getElementById('level-screen'),
            game: document.getElementById('game-screen'),
            daily: document.getElementById('daily-screen')
        };

        this.winModal = document.getElementById('win-modal');

        // Initialize
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        // Load levels
        await this.levelManager.loadLevels();

        // Setup event listeners
        this.setupEventListeners();

        // Setup games
        this.setupGames();

        // Check for saved game state
        const savedState = storage.getSavedGameState();
        if (savedState && Date.now() - savedState.timestamp < 3600000) {
            // Resume if less than 1 hour old
            // For now, just go to menu
        }

        // Update daily streak display
        this.updateDailyStreak();

        // Show menu
        this.showScreen('menu');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Menu buttons
        document.getElementById('btn-play').addEventListener('click', () => {
            this.startNextLevel();
        });

        document.getElementById('btn-daily').addEventListener('click', () => {
            this.startDailyPuzzle();
        });

        document.getElementById('btn-chapters').addEventListener('click', () => {
            this.showChapterSelect();
        });

        // Back buttons
        document.getElementById('btn-back-menu').addEventListener('click', () => {
            this.showScreen('menu');
        });

        document.getElementById('btn-back-chapters').addEventListener('click', () => {
            this.showChapterSelect();
        });

        document.getElementById('btn-back-levels').addEventListener('click', () => {
            this.showLevelSelect(this.currentChapterId);
        });

        document.getElementById('btn-back-daily').addEventListener('click', () => {
            this.showScreen('menu');
        });

        // Game controls
        document.getElementById('btn-undo').addEventListener('click', () => {
            if (this.game) {
                this.game.undo();
            }
        });

        document.getElementById('btn-reset').addEventListener('click', () => {
            if (this.game) {
                this.game.reset();
            }
        });

        // Daily game controls
        document.getElementById('btn-daily-undo').addEventListener('click', () => {
            if (this.dailyGame) {
                this.dailyGame.undo();
            }
        });

        document.getElementById('btn-daily-reset').addEventListener('click', () => {
            if (this.dailyGame) {
                this.dailyGame.reset();
            }
        });

        // Win modal buttons
        document.getElementById('btn-next-level').addEventListener('click', () => {
            this.closeWinModal();
            if (this.isDailyMode) {
                this.showScreen('menu');
            } else {
                this.loadNextLevel();
            }
        });

        document.getElementById('btn-share').addEventListener('click', () => {
            this.shareResult();
        });

        document.getElementById('btn-replay').addEventListener('click', () => {
            this.closeWinModal();
            if (this.isDailyMode) {
                this.dailyGame.reset();
            } else if (this.game) {
                this.game.reset();
            }
        });

        // Window resize
        window.addEventListener('resize', () => {
            if (this.game) this.game.resize();
            if (this.dailyGame) this.dailyGame.resize();
        });
    }

    /**
     * Setup game instances
     */
    setupGames() {
        const gameCanvas = document.getElementById('game-canvas');
        const dailyCanvas = document.getElementById('daily-canvas');

        this.game = new Game(gameCanvas, {
            onTap: (taps) => this.updateTapCounter(taps),
            onWin: (taps, puzzle) => this.handleWin(taps, puzzle),
            onReset: () => this.updateTapCounter(0)
        });

        this.dailyGame = new Game(dailyCanvas, {
            onTap: (taps) => this.updateDailyTapCounter(taps),
            onWin: (taps, puzzle) => this.handleDailyWin(taps, puzzle),
            onReset: () => this.updateDailyTapCounter(0)
        });
    }

    /**
     * Show a screen
     */
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });

        this.screens[screenName].classList.add('active');
        this.currentScreen = screenName;
    }

    /**
     * Show chapter select screen
     */
    showChapterSelect() {
        const chapters = this.levelManager.getChapters();
        const container = document.getElementById('chapter-list');
        const completedLevels = storage.getCompletedLevels();

        container.innerHTML = '';

        chapters.forEach((chapter, index) => {
            const isUnlocked = storage.isChapterUnlocked(chapter.id, chapters);
            const progress = this.levelManager.getChapterProgress(chapter.id, completedLevels);
            const completedCount = chapter.levels.filter(l => completedLevels.has(l.id)).length;

            const card = document.createElement('div');
            card.className = `chapter-card ${isUnlocked ? '' : 'locked'}`;
            card.innerHTML = `
                <h3>${chapter.name}</h3>
                <p>${chapter.description}</p>
                <p>${completedCount}/${chapter.levels.length} completed</p>
                <div class="chapter-progress">
                    <div class="chapter-progress-fill" style="width: ${progress * 100}%"></div>
                </div>
            `;

            if (isUnlocked) {
                card.addEventListener('click', () => {
                    this.showLevelSelect(chapter.id);
                });
            }

            container.appendChild(card);
        });

        this.showScreen('chapter');
    }

    /**
     * Show level select screen
     */
    showLevelSelect(chapterId) {
        this.currentChapterId = chapterId;
        const chapter = this.levelManager.getChapter(chapterId);
        const chapters = this.levelManager.getChapters();
        const completedLevels = storage.getCompletedLevels();

        document.getElementById('chapter-title').textContent = chapter.name;

        const container = document.getElementById('level-grid');
        container.innerHTML = '';

        chapter.levels.forEach((level, index) => {
            const isUnlocked = storage.isLevelUnlocked(chapterId, index, chapters);
            const isCompleted = completedLevels.has(level.id);
            const score = storage.getLevelScore(level.id);

            const btn = document.createElement('button');
            btn.className = `level-btn ${isCompleted ? 'completed' : ''} ${isUnlocked && !isCompleted ? 'current' : ''} ${!isUnlocked ? 'locked' : ''}`;
            btn.textContent = index + 1;

            if (isUnlocked) {
                btn.addEventListener('click', () => {
                    this.startLevel(chapterId, index);
                });
            }

            container.appendChild(btn);
        });

        this.showScreen('level');
    }

    /**
     * Start a specific level
     */
    startLevel(chapterId, levelIndex) {
        this.currentChapterId = chapterId;
        this.currentLevelIndex = levelIndex;
        this.isDailyMode = false;

        const level = this.levelManager.getLevel(chapterId, levelIndex);
        if (!level) return;

        this.currentPuzzle = level;

        document.getElementById('level-name').textContent = level.name;
        this.updateTapCounter(0);

        // Show screen first so container has dimensions
        this.showScreen('game');

        // Load puzzle after a brief delay for layout
        requestAnimationFrame(() => {
            this.game.loadPuzzle(level);
        });
    }

    /**
     * Start the next unlocked level
     */
    startNextLevel() {
        const chapters = this.levelManager.getChapters();
        const next = storage.getNextUnlockedLevel(chapters);

        if (next) {
            this.startLevel(next.chapter.id, next.levelIndex);
        }
    }

    /**
     * Load next level after winning
     */
    loadNextLevel() {
        const next = this.levelManager.getNextLevel(this.currentChapterId, this.currentLevelIndex);

        if (next) {
            this.startLevel(next.chapterId, next.levelIndex);
        } else {
            // All levels complete
            this.showScreen('menu');
        }
    }

    /**
     * Start daily puzzle
     */
    startDailyPuzzle() {
        this.isDailyMode = true;
        const puzzle = dailyPuzzle.getTodaysPuzzle();
        this.currentPuzzle = puzzle;

        document.getElementById('daily-title').textContent = puzzle.name;
        this.updateDailyTapCounter(0);
        this.updateDailyStreak();

        // Show screen first so container has dimensions
        this.showScreen('daily');

        // Load puzzle after a brief delay for layout
        requestAnimationFrame(() => {
            this.dailyGame.loadPuzzle(puzzle);
        });
    }

    /**
     * Update tap counter
     */
    updateTapCounter(taps) {
        document.getElementById('tap-counter').textContent = `Taps: ${taps}`;
        document.getElementById('btn-undo').disabled = !this.game || !this.game.canUndo();
    }

    /**
     * Update daily tap counter
     */
    updateDailyTapCounter(taps) {
        document.getElementById('daily-tap-counter').textContent = `Taps: ${taps}`;
        document.getElementById('btn-daily-undo').disabled = !this.dailyGame || !this.dailyGame.canUndo();
    }

    /**
     * Update daily streak display
     */
    updateDailyStreak() {
        const status = storage.getDailyStatus();
        document.getElementById('streak-count').textContent = status.streak;
    }

    /**
     * Handle level win
     */
    handleWin(taps, puzzle) {
        storage.completeLevel(puzzle.id, taps);
        storage.clearGameState();
        this.showWinModal(taps, puzzle);
    }

    /**
     * Handle daily win
     */
    handleDailyWin(taps, puzzle) {
        const today = dailyPuzzle.getTodayString();
        storage.updateDailyStatus(today, true, taps);
        storage.addDailyHistory(today, taps);
        this.updateDailyStreak();
        this.showWinModal(taps, puzzle);
    }

    /**
     * Show win modal
     */
    showWinModal(taps, puzzle) {
        document.getElementById('win-taps').textContent = taps;

        // Generate petals
        const petalsContainer = this.winModal.querySelector('.petals');
        petalsContainer.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const petal = document.createElement('div');
            petal.className = 'petal';
            petal.style.left = `${20 * i}%`;
            petalsContainer.appendChild(petal);
        }

        // Update next button text
        const nextBtn = document.getElementById('btn-next-level');
        if (this.isDailyMode) {
            nextBtn.textContent = 'Back to Menu';
        } else {
            const next = this.levelManager.getNextLevel(this.currentChapterId, this.currentLevelIndex);
            nextBtn.textContent = next ? 'Next Level' : 'Back to Menu';
        }

        this.winModal.classList.add('active');
    }

    /**
     * Close win modal
     */
    closeWinModal() {
        this.winModal.classList.remove('active');
    }

    /**
     * Share result
     */
    async shareResult() {
        if (!this.currentPuzzle) return;

        const game = this.isDailyMode ? this.dailyGame : this.game;
        const taps = game.getTapCount();

        if (this.isDailyMode) {
            const result = await dailyPuzzle.shareResult(this.currentPuzzle, taps);
            if (result.success && result.method === 'clipboard') {
                alert('Result copied to clipboard!');
            } else if (!result.success) {
                prompt('Copy this result:', result.text);
            }
        } else {
            const shareText = game.generateShareText(
                this.levelManager.getLevelById(this.currentPuzzle.id)?.chapter?.levels?.findIndex(l => l.id === this.currentPuzzle.id) + 1 || 1
            );
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(shareText);
                alert('Result copied to clipboard!');
            }
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
