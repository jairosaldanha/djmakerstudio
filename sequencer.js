import { SequencerRenderer } from 'src/ui/SequencerRenderer.js';

export class Sequencer {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.init();
    }

    init() {
        // SequencerRenderer handles initial rendering of track rows and dropdowns
        // We still need to create the step buttons themselves for each track
        this.createAllTrackStepButtons();
        this.setupEventListeners();
    }

    createAllTrackStepButtons() {
        const trackRows = document.querySelectorAll('.track-row');
        trackRows.forEach(row => {
            const trackIndex = parseInt(row.dataset.track);
            this.createTrackStepButtons(trackIndex);
        });
    }

    createTrackStepButtons(trackIndex) {
        const track = this.audioEngine.getTrackData(trackIndex);
        if (!track) return;

        SequencerRenderer.renderTrackSteps(trackIndex, track.stepCount, track.steps);

        // Re-attach click listeners for the newly rendered buttons
        const stepButtonsContainer = document.querySelector(`.step-buttons[data-track="${trackIndex}"]`);
        if (stepButtonsContainer) {
            stepButtonsContainer.querySelectorAll('.step-button').forEach(button => {
                button.addEventListener('click', () => {
                    const stepLocal = parseInt(button.dataset.step);
                    const isActive = this.audioEngine.toggleStep(trackIndex, stepLocal);
                    button.classList.toggle('active', isActive);
                });
            });
        }
    }

    setupEventListeners() {
        // Existing sound selector event listener
        const soundSelectors = document.querySelectorAll('.sound-selector');
        soundSelectors.forEach(selector => {
            selector.addEventListener('change', (e) => {
                const trackIndex = parseInt(e.target.dataset.track);
                const soundName = e.target.value;
                this.audioEngine.setTrackSound(trackIndex, soundName);
            });
        });

        // New: Step Count Selector
        const stepCountSelectors = document.querySelectorAll('.step-count-selector');
        stepCountSelectors.forEach(selector => {
            selector.addEventListener('change', (e) => {
                const trackIndex = parseInt(e.target.dataset.track);
                const newStepCount = parseInt(e.target.value);
                this.audioEngine.setTrackStepCount(trackIndex, newStepCount);
                // Re-render the step buttons for this specific track
                this.createTrackStepButtons(trackIndex);
                // After changing step count, clear playback highlight
                this.clearStepIndicators();
            });
        });

        this.audioEngine.onStepPlay = (currentGlobalStep) => {
            this.updateStepIndicators(currentGlobalStep);
        };
    }

    updateStepIndicators(currentGlobalStep) {
        const trackRows = document.querySelectorAll('.track-row');
        trackRows.forEach(row => {
            const trackIndex = parseInt(row.dataset.track);
            const track = this.audioEngine.getTrackData(trackIndex);
            if (!track) return;

            const trackLocalStep = currentGlobalStep % track.stepCount;

            // Clear previous 'playing' state for this track
            row.querySelectorAll('.step-button.playing').forEach(btn => {
                btn.classList.remove('playing');
            });

            // Set 'playing' state for the current step in this track, if it exists
            const currentStepButton = row.querySelector(`.step-button[data-step="${trackLocalStep}"]`);
            if (currentStepButton) {
                currentStepButton.classList.add('playing');
            }
        });
    }

    clearAll() {
        this.audioEngine.clearAll();
        document.querySelectorAll('.step-button').forEach(button => {
            button.classList.remove('active');
        });
        this.clearStepIndicators(); // Also clear playing indicator
    }

    clearStepIndicators() {
        document.querySelectorAll('.step-button.playing').forEach(button => {
            button.classList.remove('playing');
        });
    }
}
