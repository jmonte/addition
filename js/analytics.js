/**
 * Analytics - tracks player actions and events
 *
 * Supports multiple providers:
 * - Console (for development)
 * - Google Analytics 4
 * - Custom endpoint
 *
 * Key metrics tracked:
 * - Player progression (furthest level, chapter)
 * - Session engagement (levels played, duration)
 * - Difficulty indicators (attempts, resets, hints per level)
 * - Churn signals (where players quit, frustration patterns)
 * - Retention (returning players, play frequency)
 */
class Analytics {
    constructor() {
        this.enabled = true;
        this.debug = false;
        this.queue = [];
        this.sessionId = this.generateSessionId();
        this.sessionStart = Date.now();

        // Session state tracking
        this.sessionState = {
            levelsStarted: 0,
            levelsCompleted: 0,
            totalTaps: 0,
            totalHints: 0,
            totalResets: 0,
            totalUndos: 0,
            lastScreen: null,
            lastLevel: null,
            lastAction: null,
            lastActionTime: Date.now()
        };

        // Level attempt tracking (for current level)
        this.currentLevelState = {
            levelId: null,
            startTime: null,
            attempts: 0,
            taps: 0,
            hints: 0,
            resets: 0,
            undos: 0
        };

        // Configuration
        this.config = {
            provider: 'ga4',
            endpoint: null,
            ga4MeasurementId: 'G-RBKQYX7QNP'
        };

        // Load player stats
        this.playerStats = this.loadPlayerStats();

        // Track session start with context
        this.track('session_start', {
            referrer: document.referrer,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            language: navigator.language,
            // Retention metrics
            isReturningPlayer: this.playerStats.totalSessions > 0,
            totalSessions: this.playerStats.totalSessions + 1,
            daysSinceFirstPlay: this.getDaysSinceFirstPlay(),
            daysSinceLastPlay: this.getDaysSinceLastPlay(),
            // Progression context
            furthestChapter: this.playerStats.furthestChapter,
            furthestLevel: this.playerStats.furthestLevel,
            totalLevelsCompleted: this.playerStats.totalLevelsCompleted
        });

        // Update player stats
        this.playerStats.totalSessions++;
        this.playerStats.lastPlayDate = new Date().toISOString().split('T')[0];
        if (!this.playerStats.firstPlayDate) {
            this.playerStats.firstPlayDate = this.playerStats.lastPlayDate;
        }
        this.savePlayerStats();

        // Track when user leaves
        window.addEventListener('beforeunload', () => this.trackSessionEnd());
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.trackSessionEnd();
            }
        });
    }

    /**
     * Load persistent player stats
     */
    loadPlayerStats() {
        const defaults = {
            oddsPlayerId: null,
            firstPlayDate: null,
            lastPlayDate: null,
            totalSessions: 0,
            totalLevelsCompleted: 0,
            furthestChapter: 0,
            furthestLevel: 0,
            levelAttempts: {}, // levelId -> { attempts, bestTaps, totalTime }
            chapterProgress: {} // chapterId -> { started, completed, timeSpent }
        };
        return storage.get('playerStats', defaults);
    }

    /**
     * Save player stats
     */
    savePlayerStats() {
        storage.set('playerStats', this.playerStats);
    }

    /**
     * Get days since first play
     */
    getDaysSinceFirstPlay() {
        if (!this.playerStats.firstPlayDate) return 0;
        const first = new Date(this.playerStats.firstPlayDate);
        const now = new Date();
        return Math.floor((now - first) / (1000 * 60 * 60 * 24));
    }

    /**
     * Get days since last play
     */
    getDaysSinceLastPlay() {
        if (!this.playerStats.lastPlayDate) return 0;
        const last = new Date(this.playerStats.lastPlayDate);
        const now = new Date();
        return Math.floor((now - last) / (1000 * 60 * 60 * 24));
    }

    /**
     * Generate a unique session ID
     */
    generateSessionId() {
        return 'sess_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get or create a persistent user ID
     */
    getUserId() {
        let userId = storage.get('analyticsUserId', null);
        if (!userId) {
            userId = 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
            storage.set('analyticsUserId', userId);
        }
        return userId;
    }

    /**
     * Track an event
     * @param {string} eventName - Name of the event
     * @param {object} properties - Additional properties
     */
    track(eventName, properties = {}) {
        if (!this.enabled) return;

        const event = {
            event: eventName,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.getUserId(),
            sessionDuration: Date.now() - this.sessionStart,
            ...properties
        };

        if (this.debug) {
            console.log('[Analytics]', eventName, properties);
        }

        switch (this.config.provider) {
            case 'ga4':
                this.sendToGA4(event);
                break;
            case 'custom':
                this.sendToCustomEndpoint(event);
                break;
            case 'console':
            default:
                this.logToConsole(event);
                break;
        }

        // Store locally for offline support
        this.storeLocally(event);
    }

    /**
     * Log to console (development)
     */
    logToConsole(event) {
        if (this.debug) {
            console.table(event);
        }
    }

    /**
     * Send to Google Analytics 4
     */
    sendToGA4(event) {
        if (typeof gtag === 'function') {
            gtag('event', event.event, {
                ...event,
                send_to: this.config.ga4MeasurementId
            });
        }
    }

    /**
     * Send to custom endpoint
     */
    sendToCustomEndpoint(event) {
        if (!this.config.endpoint) return;

        // Use sendBeacon for reliability
        if (navigator.sendBeacon) {
            navigator.sendBeacon(
                this.config.endpoint,
                JSON.stringify(event)
            );
        } else {
            fetch(this.config.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event),
                keepalive: true
            }).catch(() => {});
        }
    }

    /**
     * Store event locally for offline support and analysis
     */
    storeLocally(event) {
        const events = storage.get('analyticsEvents', []);
        events.push(event);

        // Keep last 100 events
        if (events.length > 100) {
            events.shift();
        }

        storage.set('analyticsEvents', events);
    }

    /**
     * Get stored events (for debugging or export)
     */
    getStoredEvents() {
        return storage.get('analyticsEvents', []);
    }

    /**
     * Clear stored events
     */
    clearStoredEvents() {
        storage.set('analyticsEvents', []);
    }

    /**
     * Configure the analytics provider
     */
    configure(options) {
        Object.assign(this.config, options);
    }

    /**
     * Enable/disable analytics
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Enable/disable debug mode
     */
    setDebug(debug) {
        this.debug = debug;
    }

    // ==========================================
    // Session tracking
    // ==========================================

    trackSessionEnd() {
        const sessionDuration = Math.floor((Date.now() - this.sessionStart) / 1000);

        this.track('session_end', {
            sessionDuration,
            levelsStarted: this.sessionState.levelsStarted,
            levelsCompleted: this.sessionState.levelsCompleted,
            completionRate: this.sessionState.levelsStarted > 0
                ? Math.round((this.sessionState.levelsCompleted / this.sessionState.levelsStarted) * 100)
                : 0,
            totalTaps: this.sessionState.totalTaps,
            totalHints: this.sessionState.totalHints,
            totalResets: this.sessionState.totalResets,
            totalUndos: this.sessionState.totalUndos,
            // Churn context - where did they stop?
            lastScreen: this.sessionState.lastScreen,
            lastLevel: this.sessionState.lastLevel,
            lastAction: this.sessionState.lastAction,
            secondsSinceLastAction: Math.floor((Date.now() - this.sessionState.lastActionTime) / 1000)
        });
    }

    updateLastAction(action) {
        this.sessionState.lastAction = action;
        this.sessionState.lastActionTime = Date.now();
    }

    // ==========================================
    // Tutorial events
    // ==========================================

    trackTutorialStart() {
        this.updateLastAction('tutorial_start');
        this.track('tutorial_start', {
            isFirstSession: this.playerStats.totalSessions <= 1
        });
    }

    trackTutorialStep(step, totalSteps) {
        this.updateLastAction('tutorial_step');
        this.track('tutorial_step', { step, totalSteps });
    }

    trackTutorialComplete() {
        this.updateLastAction('tutorial_complete');
        this.track('tutorial_complete', {
            timeToComplete: Math.floor((Date.now() - this.sessionStart) / 1000)
        });
    }

    trackTutorialSkip(atStep) {
        this.updateLastAction('tutorial_skip');
        this.track('tutorial_skip', {
            atStep,
            timeBeforeSkip: Math.floor((Date.now() - this.sessionStart) / 1000)
        });
    }

    // ==========================================
    // Level events with progression tracking
    // ==========================================

    trackLevelStart(chapterId, levelIndex, levelId) {
        this.updateLastAction('level_start');
        this.sessionState.levelsStarted++;
        this.sessionState.lastLevel = levelId;

        // Initialize level attempt tracking
        const attempts = (this.playerStats.levelAttempts[levelId]?.attempts || 0) + 1;
        this.currentLevelState = {
            levelId,
            chapterId,
            levelIndex,
            startTime: Date.now(),
            attempts,
            taps: 0,
            hints: 0,
            resets: 0,
            undos: 0
        };

        // Update persistent stats
        if (!this.playerStats.levelAttempts[levelId]) {
            this.playerStats.levelAttempts[levelId] = { attempts: 0, bestTaps: null, totalTime: 0 };
        }
        this.playerStats.levelAttempts[levelId].attempts = attempts;
        this.savePlayerStats();

        this.track('level_start', {
            chapterId,
            levelIndex,
            levelId,
            attemptNumber: attempts,
            isFirstAttempt: attempts === 1,
            isRetry: attempts > 1,
            // Progression context
            playerTotalLevelsCompleted: this.playerStats.totalLevelsCompleted,
            playerFurthestChapter: this.playerStats.furthestChapter,
            playerFurthestLevel: this.playerStats.furthestLevel
        });
    }

    trackLevelComplete(chapterId, levelIndex, levelId, taps, hintsUsed) {
        this.updateLastAction('level_complete');
        this.sessionState.levelsCompleted++;
        this.sessionState.totalTaps += taps;

        const timeSpent = Math.floor((Date.now() - this.currentLevelState.startTime) / 1000);
        const attempts = this.currentLevelState.attempts;
        const resets = this.currentLevelState.resets;
        const undos = this.currentLevelState.undos;

        // Update persistent stats
        const levelStats = this.playerStats.levelAttempts[levelId];
        if (levelStats) {
            levelStats.totalTime += timeSpent;
            if (levelStats.bestTaps === null || taps < levelStats.bestTaps) {
                levelStats.bestTaps = taps;
            }
        }

        this.playerStats.totalLevelsCompleted++;

        // Update furthest progression
        const chapterNum = parseInt(chapterId.replace('chapter-', '')) || 0;
        if (chapterNum > this.playerStats.furthestChapter ||
            (chapterNum === this.playerStats.furthestChapter && levelIndex > this.playerStats.furthestLevel)) {
            this.playerStats.furthestChapter = chapterNum;
            this.playerStats.furthestLevel = levelIndex;
        }
        this.savePlayerStats();

        this.track('level_complete', {
            chapterId,
            levelIndex,
            levelId,
            taps,
            hintsUsed,
            timeSpent,
            attemptNumber: attempts,
            resetsUsed: resets,
            undosUsed: undos,
            // Performance indicators
            usedHints: hintsUsed > 0,
            struggled: resets > 2 || hintsUsed > 1,
            // Progression
            isNewFurthest: chapterNum >= this.playerStats.furthestChapter,
            totalLevelsCompleted: this.playerStats.totalLevelsCompleted
        });
    }

    trackLevelAbandon(levelId) {
        if (!this.currentLevelState.levelId) return;

        const timeSpent = Math.floor((Date.now() - this.currentLevelState.startTime) / 1000);

        this.track('level_abandon', {
            levelId: this.currentLevelState.levelId,
            chapterId: this.currentLevelState.chapterId,
            levelIndex: this.currentLevelState.levelIndex,
            timeSpent,
            taps: this.currentLevelState.taps,
            hints: this.currentLevelState.hints,
            resets: this.currentLevelState.resets,
            undos: this.currentLevelState.undos,
            attemptNumber: this.currentLevelState.attempts
        });
    }

    trackLevelReset(levelId) {
        this.updateLastAction('level_reset');
        this.sessionState.totalResets++;
        this.currentLevelState.resets++;

        const timeBeforeReset = Math.floor((Date.now() - this.currentLevelState.startTime) / 1000);

        this.track('level_reset', {
            levelId,
            resetNumber: this.currentLevelState.resets,
            tapsBeforeReset: this.currentLevelState.taps,
            timeBeforeReset,
            // Frustration indicator
            isFrustrationSignal: this.currentLevelState.resets > 2
        });
    }

    // ==========================================
    // Daily puzzle events
    // ==========================================

    trackDailyStart(date) {
        this.updateLastAction('daily_start');
        this.track('daily_start', {
            date,
            dayOfWeek: new Date().getDay(),
            isReturningPlayer: this.playerStats.totalSessions > 1
        });
    }

    trackDailyComplete(date, taps, streak) {
        this.updateLastAction('daily_complete');
        this.track('daily_complete', {
            date,
            taps,
            streak,
            isStreakMilestone: streak % 7 === 0,
            dayOfWeek: new Date().getDay()
        });
    }

    // ==========================================
    // Action events with context
    // ==========================================

    trackHintUsed(levelId, hintNumber) {
        this.updateLastAction('hint_used');
        this.sessionState.totalHints++;
        this.currentLevelState.hints++;

        this.track('hint_used', {
            levelId,
            hintNumber,
            hintsThisLevel: this.currentLevelState.hints,
            tapsBeforeHint: this.currentLevelState.taps,
            timeBeforeHint: Math.floor((Date.now() - this.currentLevelState.startTime) / 1000)
        });
    }

    trackUndoUsed(levelId) {
        this.updateLastAction('undo_used');
        this.sessionState.totalUndos++;
        this.currentLevelState.undos++;

        this.track('undo_used', {
            levelId,
            undosThisLevel: this.currentLevelState.undos
        });
    }

    trackTap(levelId) {
        this.currentLevelState.taps++;
        this.sessionState.totalTaps++;
    }

    trackShare(levelId, taps) {
        this.updateLastAction('share');
        this.track('share', {
            levelId,
            taps,
            totalLevelsCompleted: this.playerStats.totalLevelsCompleted
        });
    }

    // ==========================================
    // Screen events with churn tracking
    // ==========================================

    trackScreenView(screenName) {
        // Track if leaving a level without completing
        if (this.sessionState.lastScreen === 'game' && screenName !== 'game') {
            this.trackLevelAbandon(this.currentLevelState.levelId);
        }

        this.sessionState.lastScreen = screenName;
        this.updateLastAction('screen_view');

        this.track('screen_view', {
            screenName,
            sessionDuration: Math.floor((Date.now() - this.sessionStart) / 1000),
            levelsCompletedThisSession: this.sessionState.levelsCompleted
        });
    }

    // ==========================================
    // Chapter events
    // ==========================================

    trackChapterUnlock(chapterId) {
        this.updateLastAction('chapter_unlock');
        this.track('chapter_unlock', {
            chapterId,
            totalLevelsCompleted: this.playerStats.totalLevelsCompleted,
            sessionNumber: this.playerStats.totalSessions
        });
    }

    trackChapterStart(chapterId) {
        this.updateLastAction('chapter_start');
        const chapterNum = parseInt(chapterId.replace('chapter-', '')) || 0;

        if (!this.playerStats.chapterProgress[chapterId]) {
            this.playerStats.chapterProgress[chapterId] = {
                firstStarted: new Date().toISOString(),
                completed: false,
                timeSpent: 0
            };
            this.savePlayerStats();
        }

        this.track('chapter_start', {
            chapterId,
            chapterNumber: chapterNum,
            isFirstTime: !this.playerStats.chapterProgress[chapterId]?.firstStarted
        });
    }

    // ==========================================
    // Mechanics view
    // ==========================================

    trackMechanicsView(unlockedMechanics) {
        this.updateLastAction('mechanics_view');
        this.track('mechanics_view', {
            unlockedMechanics,
            unlockedCount: unlockedMechanics.length,
            totalLevelsCompleted: this.playerStats.totalLevelsCompleted
        });
    }

    // ==========================================
    // Player progression summary
    // ==========================================

    getPlayerProgression() {
        return {
            totalSessions: this.playerStats.totalSessions,
            totalLevelsCompleted: this.playerStats.totalLevelsCompleted,
            furthestChapter: this.playerStats.furthestChapter,
            furthestLevel: this.playerStats.furthestLevel,
            daysSinceFirstPlay: this.getDaysSinceFirstPlay(),
            averageLevelsPerSession: this.playerStats.totalSessions > 0
                ? Math.round(this.playerStats.totalLevelsCompleted / this.playerStats.totalSessions * 10) / 10
                : 0
        };
    }
}

// Create singleton instance
const analytics = new Analytics();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Analytics, analytics };
}
