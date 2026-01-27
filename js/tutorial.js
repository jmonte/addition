/**
 * TutorialController - manages the 2-step interactive tutorial
 */
class TutorialController {
    constructor() {
        this.currentStep = 0;
        this.totalSteps = 2;
        this.canvas = null;
        this.renderer = null;
        this.grid = null;
        this.isActive = false;
        this.stepCompleted = false;

        // Tutorial step definitions
        this.steps = [
            {
                title: 'Welcome to Ripple Add',
                description: 'Tap a stone to add +1 to it and all adjacent stones (up, down, left, right).',
                instruction: 'Tap the center stone!',
                hasDemo: true,
                demoType: 'ripple',
                requiresInteraction: true,
                autoAdvance: true
            },
            {
                title: 'Match the Targets',
                description: 'Make each row and column sum match the target numbers. Tap the center to win!',
                instruction: 'Make all targets turn green!',
                hasDemo: true,
                demoType: 'puzzle',
                requiresInteraction: true,
                autoAdvance: true,
                isFinal: true
            }
        ];

        this.demoPuzzles = {
            ripple: {
                grid: 3,
                rowTargets: [0, 0, 0],
                colTargets: [0, 0, 0],
                cells: []
            },
            puzzle: {
                grid: 3,
                rowTargets: [1, 3, 1],
                colTargets: [1, 3, 1],
                cells: []
            }
        };
    }

    /**
     * Initialize the tutorial
     */
    init() {
        this.canvas = document.getElementById('tutorial-canvas');
        this.currentStep = 0;
        this.isActive = true;
        this.setupEventListeners();
        this.renderStep();

        // Track tutorial start
        analytics.trackTutorialStart();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Canvas interaction
        this.handleCanvasClick = this.handleCanvasClick.bind(this);
        this.handleCanvasTouch = this.handleCanvasTouch.bind(this);
        this.canvas.addEventListener('click', this.handleCanvasClick);
        this.canvas.addEventListener('touchstart', this.handleCanvasTouch, { passive: false });
    }

    /**
     * Remove event listeners
     */
    removeEventListeners() {
        if (this.canvas) {
            this.canvas.removeEventListener('click', this.handleCanvasClick);
            this.canvas.removeEventListener('touchstart', this.handleCanvasTouch);
        }
    }

    /**
     * Handle canvas click
     */
    handleCanvasClick(event) {
        if (!this.isActive || !this.renderer || !this.grid) return;

        const step = this.steps[this.currentStep];
        if (!step.requiresInteraction || this.stepCompleted) return;

        const canvasPos = this.renderer.pageToCanvas(event.clientX, event.clientY);
        const cell = this.renderer.getCellFromPosition(canvasPos.x, canvasPos.y);

        if (cell) {
            this.handleCellTap(cell.x, cell.y);
        }
    }

    /**
     * Handle canvas touch
     */
    handleCanvasTouch(event) {
        if (!this.isActive || !this.renderer || !this.grid) return;
        event.preventDefault();

        const step = this.steps[this.currentStep];
        if (!step.requiresInteraction || this.stepCompleted) return;

        const touch = event.touches[0];
        const canvasPos = this.renderer.pageToCanvas(touch.clientX, touch.clientY);
        const cell = this.renderer.getCellFromPosition(canvasPos.x, canvasPos.y);

        if (cell) {
            this.handleCellTap(cell.x, cell.y);
        }
    }

    /**
     * Handle cell tap during tutorial
     */
    handleCellTap(x, y) {
        const cell = this.grid.getCell(x, y);
        if (!cell || !cell.canTap()) return;

        const affected = this.grid.tap(x, y);
        if (affected) {
            this.renderer.addRipple(x, y);
            for (const { cell, addedValue } of affected) {
                this.renderer.addNumberPop(cell.x, cell.y, addedValue);
            }

            // Check if step is complete
            this.checkStepCompletion();
        }
    }

    /**
     * Check if current step's objective is complete
     */
    checkStepCompletion() {
        const step = this.steps[this.currentStep];

        if (step.demoType === 'ripple') {
            // Ripple demo: any tap completes it
            this.stepCompleted = true;
            this.updateInstruction('Great!');
            this.autoAdvanceIfNeeded(step);
        } else if (step.demoType === 'puzzle') {
            // Puzzle demo: check if solved
            if (this.grid.isComplete()) {
                this.stepCompleted = true;
                this.updateInstruction('Perfect!');
                this.autoAdvanceIfNeeded(step);
            }
        }
    }

    /**
     * Auto-advance to next step or complete tutorial after a delay
     */
    autoAdvanceIfNeeded(step) {
        if (!step.autoAdvance) return;

        setTimeout(() => {
            if (!this.isActive) return;

            if (step.isFinal) {
                this.complete();
            } else {
                this.nextStep();
            }
        }, 800);
    }

    /**
     * Render the current tutorial step
     */
    renderStep() {
        const step = this.steps[this.currentStep];
        this.stepCompleted = false;

        // Update progress dots
        this.renderProgressDots();

        // Update step counter
        document.querySelector('.tutorial-step-counter').textContent =
            `Step ${this.currentStep + 1} of ${this.totalSteps}`;

        // Update text content
        document.getElementById('tutorial-title').textContent = step.title;
        document.getElementById('tutorial-description').textContent = step.description;
        this.updateInstruction(step.instruction);

        // Update navigation buttons - hide Next/Prev since we auto-advance
        const prevBtn = document.getElementById('btn-tutorial-prev');
        const nextBtn = document.getElementById('btn-tutorial-next');
        const skipBtn = document.getElementById('btn-tutorial-skip');

        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        skipBtn.style.display = 'block';
        skipBtn.textContent = 'Skip Tutorial';

        // Setup demo if needed
        if (step.hasDemo) {
            this.setupDemo(step.demoType);
            this.canvas.style.display = 'block';
        } else {
            this.canvas.style.display = 'none';
            if (this.renderer) {
                this.renderer.stopRenderLoop();
            }
        }
    }

    /**
     * Render progress dots
     */
    renderProgressDots() {
        const container = document.querySelector('.tutorial-step-dots');
        container.innerHTML = '';

        for (let i = 0; i < this.totalSteps; i++) {
            const dot = document.createElement('div');
            dot.className = 'tutorial-step-dot';
            if (i === this.currentStep) {
                dot.classList.add('active');
            } else if (i < this.currentStep) {
                dot.classList.add('completed');
            }
            container.appendChild(dot);
        }
    }

    /**
     * Update instruction text
     */
    updateInstruction(text) {
        document.getElementById('tutorial-instruction').textContent = text;
    }

    /**
     * Setup demo for a step
     */
    setupDemo(demoType) {
        // Stop previous renderer if exists
        if (this.renderer) {
            this.renderer.stopRenderLoop();
            this.renderer = null;
        }

        const puzzle = this.demoPuzzles[demoType];
        if (!puzzle) return;

        this.grid = Grid.fromPuzzle(puzzle);

        // Apply initial values if specified
        if (puzzle.initialValues) {
            this.grid.setValues(puzzle.initialValues);
        }

        // Create renderer
        this.renderer = new Renderer(this.canvas);
        this.renderer.init(this.grid);

        // For static demos (no interaction), stop the render loop after initial render
        const step = this.steps[this.currentStep];
        if (!step.requiresInteraction) {
            // Do one render then stop
            this.renderer.render();
            this.renderer.stopRenderLoop();
        }
    }

    /**
     * Go to next step
     */
    nextStep() {
        if (this.currentStep < this.totalSteps - 1) {
            this.currentStep++;
            this.renderStep();

            // Track step progression
            analytics.trackTutorialStep(this.currentStep + 1, this.totalSteps);
        } else {
            // Tutorial complete
            this.complete();
        }
    }

    /**
     * Go to previous step
     */
    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.renderStep();
        }
    }

    /**
     * Skip tutorial
     */
    skip() {
        // Track tutorial skip
        analytics.trackTutorialSkip(this.currentStep + 1);

        this.completeInternal(false);
    }

    /**
     * Complete tutorial
     */
    complete() {
        // Track tutorial complete
        analytics.trackTutorialComplete();

        this.completeInternal(true);
    }

    /**
     * Internal completion handler
     */
    completeInternal(completed) {
        this.isActive = false;
        storage.set('tutorialCompleted', true);
        this.removeEventListeners();

        if (this.renderer) {
            this.renderer.stopRenderLoop();
        }

        // Notify app to start playing
        if (window.app) {
            window.app.onTutorialComplete();
        }
    }

    /**
     * Check if tutorial has been completed before
     */
    static hasCompleted() {
        return storage.get('tutorialCompleted', false);
    }

    /**
     * Reset tutorial completion (for testing)
     */
    static resetCompletion() {
        storage.remove('tutorialCompleted');
    }

    /**
     * Cleanup
     */
    destroy() {
        this.removeEventListeners();
        if (this.renderer) {
            this.renderer.stopRenderLoop();
        }
        this.isActive = false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TutorialController };
}
