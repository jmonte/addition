/**
 * Analytics - tracks player actions and events
 *
 * Supports multiple providers:
 * - Console (for development)
 * - Google Analytics 4
 * - Custom endpoint
 *
 * Usage:
 *   analytics.track('level_completed', { levelId: 'level-1', taps: 5 });
 */
class Analytics {
    constructor() {
        this.enabled = true;
        this.debug = false; // Set to true to log events to console
        this.queue = [];
        this.sessionId = this.generateSessionId();
        this.sessionStart = Date.now();

        // Configuration - set your preferred provider
        this.config = {
            // Set to 'ga4', 'custom', or 'console'
            provider: 'ga4',

            // For custom endpoint
            endpoint: null,

            // Google Analytics 4 Measurement ID
            ga4MeasurementId: 'G-RBKQYX7QNP'
        };

        // Track session start
        this.track('session_start', {
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            language: navigator.language
        });
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
    // Convenience methods for common events
    // ==========================================

    // Tutorial events
    trackTutorialStart() {
        this.track('tutorial_start');
    }

    trackTutorialStep(step, totalSteps) {
        this.track('tutorial_step', { step, totalSteps });
    }

    trackTutorialComplete() {
        this.track('tutorial_complete');
    }

    trackTutorialSkip(atStep) {
        this.track('tutorial_skip', { atStep });
    }

    // Level events
    trackLevelStart(chapterId, levelIndex, levelId) {
        this.track('level_start', { chapterId, levelIndex, levelId });
    }

    trackLevelComplete(chapterId, levelIndex, levelId, taps, hintsUsed) {
        this.track('level_complete', { chapterId, levelIndex, levelId, taps, hintsUsed });
    }

    trackLevelReset(levelId) {
        this.track('level_reset', { levelId });
    }

    // Daily puzzle events
    trackDailyStart(date) {
        this.track('daily_start', { date });
    }

    trackDailyComplete(date, taps, streak) {
        this.track('daily_complete', { date, taps, streak });
    }

    // Action events
    trackHintUsed(levelId, hintNumber) {
        this.track('hint_used', { levelId, hintNumber });
    }

    trackUndoUsed(levelId) {
        this.track('undo_used', { levelId });
    }

    trackShare(levelId, taps) {
        this.track('share', { levelId, taps });
    }

    // Screen events
    trackScreenView(screenName) {
        this.track('screen_view', { screenName });
    }

    // Chapter events
    trackChapterUnlock(chapterId) {
        this.track('chapter_unlock', { chapterId });
    }

    // Mechanic events
    trackMechanicsView(unlockedMechanics) {
        this.track('mechanics_view', { unlockedMechanics });
    }
}

// Create singleton instance
const analytics = new Analytics();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Analytics, analytics };
}
