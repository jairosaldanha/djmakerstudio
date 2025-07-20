export class Track {
    constructor(audioContext, config) {
        this.audioContext = audioContext;

        this.sound = config.sound;
        this._stepCount = config.stepCount; // New: number of steps for this track
        this.steps = new Array(this._stepCount).fill(false); // Initialize based on stepCount

        // Track parameters
        this._volume = config.volume;
        this._pan = config.pan;
        this._reverbAmount = config.reverbAmount;
        this._eqLow = config.eqLow;
        this._eqHigh = config.eqHigh;

        // Web Audio Nodes for this track
        this.gainNode = this.audioContext.createGain();
        this.pannerNode = this.audioContext.createStereoPanner();
        this.eqLowFilter = this.audioContext.createBiquadFilter();
        this.eqHighFilter = this.audioContext.createBiquadFilter();
        this.reverbSendGain = this.audioContext.createGain();

        // Configure EQ filters
        this.eqLowFilter.type = 'lowshelf';
        this.eqLowFilter.frequency.value = 250;
        this.eqHighFilter.type = 'highshelf';
        this.eqHighFilter.frequency.value = 4000;

        // Connect track processing chain: EQ Low -> EQ High -> Panner -> Track Gain
        // Samples will connect to eqLowFilter as the entry point for the track's processing
        this.eqLowFilter.connect(this.eqHighFilter);
        this.eqHighFilter.connect(this.pannerNode);
        this.pannerNode.connect(this.gainNode);

        // Apply initial values to nodes
        this.setVolume(this._volume);
        this.setPan(this._pan);
        this.setReverbAmount(this._reverbAmount);
        this.setEqLow(this._eqLow);
        this.setEqHigh(this._eqHigh);
    }

    // Getters for track parameters (read-only from outside, use setters to change)
    get volume() { return this._volume; }
    get pan() { return this._pan; }
    get reverbAmount() { return this._reverbAmount; }
    get eqLow() { return this._eqLow; }
    get eqHigh() { return this._eqHigh; }
    get stepCount() { return this._stepCount; } // New getter for step count

    // Setters to update parameters and corresponding Web Audio nodes
    setVolume(value) {
        this._volume = value;
        this.gainNode.gain.value = value;
    }

    setPan(value) {
        this._pan = value;
        this.pannerNode.pan.value = value;
    }

    setReverbAmount(value) {
        this._reverbAmount = value;
        this.reverbSendGain.gain.value = value;
    }

    setEqLow(value) {
        this._eqLow = value;
        this.eqLowFilter.gain.value = value;
    }

    setEqHigh(value) {
        this._eqHigh = value;
        this.eqHighFilter.gain.value = value;
    }

    setStepCount(newCount) {
        if (newCount !== this._stepCount) {
            const oldSteps = [...this.steps]; // Copy existing steps
            this._stepCount = newCount;
            this.steps = new Array(newCount).fill(false); // Create new array of the new size
            // Copy relevant steps from old array to new, up to newCount or oldLength, whichever is smaller
            for (let i = 0; i < Math.min(oldSteps.length, newCount); i++) {
                this.steps[i] = oldSteps[i];
            }
        }
    }

    // Methods to get nodes for external connections
    getInputNode() {
        return this.eqLowFilter; // Samples connect here
    }

    getOutputNode() {
        return this.gainNode; // Connects to master chain
    }

    getReverbSendInputNode() {
        return this.gainNode; // Send dry output of track to reverb send gain
    }

    getReverbSendNode() {
        return this.reverbSendGain; // Connects to global reverb convolver
    }
}