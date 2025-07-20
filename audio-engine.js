import { SampleGenerator } from './src/audio/SampleGenerator.js';
import { WavEncoder } from './src/utils/WavEncoder.js';
import { Track } from './src/audio/Track.js'; // New import
import { SAMPLE_DEFINITIONS } from './src/audio/SampleDefinitions.js'; // New import

export class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.masterInputGain = null; // Collects all track output before master effects
        this.masterEQLow = null;
        this.masterEQHigh = null;
        this.globalReverbConvolver = null;
        this.globalReverbGain = null; // Gain for the wet signal of the global reverb
        this.impulseResponseBuffer = null;

        this.tracks = []; // Now will hold Track instances
        this.isPlaying = false;
        this.bpm = 120;
        this.currentStep = 0; // This is now the global 16th note index (0-15 for a 4/4 measure)
        this.globalStepCount = 16; // A fixed value for the global sequencer loop length (e.g., 1 measure of 16th notes)
        this.intervalId = null;
        this.samples = {}; // Stores sample configurations (now loaded from SAMPLE_DEFINITIONS)
        this.sampleGenerator = null; // Will be initialized with AudioContext

        this.isRecording = false;
        this.recordedBuffer = [];
        
        // This is a placeholder for `BeatMaker` to attach a callback
        this.onStepPlay = null;
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.sampleGenerator = new SampleGenerator(this.audioContext);

            // Master Chain Setup
            this.masterGain = this.audioContext.createGain();
            this.masterEQLow = this.audioContext.createBiquadFilter();
            this.masterEQHigh = this.audioContext.createBiquadFilter();
            this.masterInputGain = this.audioContext.createGain(); // Sum of all dry tracks and global wet reverb

            this.masterEQLow.type = 'lowshelf';
            this.masterEQLow.frequency.value = 250;
            this.masterEQHigh.type = 'highshelf';
            this.masterEQHigh.frequency.value = 4000;

            // Connect Master Chain: Input -> EQ Low -> EQ High -> Master Gain -> Destination
            this.masterInputGain.connect(this.masterEQLow);
            this.masterEQLow.connect(this.masterEQHigh);
            this.masterEQHigh.connect(this.masterGain);
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.7; // Initial master volume

            // Global Reverb Setup
            this.globalReverbConvolver = this.audioContext.createConvolver();
            this.globalReverbGain = this.audioContext.createGain(); // For controlling master wet reverb amount
            this.globalReverbGain.gain.value = 0.3; // Default master reverb wetness

            // Connect global reverb output to master input chain
            this.globalReverbConvolver.connect(this.globalReverbGain);
            this.globalReverbGain.connect(this.masterInputGain);

            await this.loadSamples();
            await this.loadImpulseResponse('reverb_ir.mp3'); // Load impulse response for global reverb
            this.globalReverbConvolver.buffer = this.impulseResponseBuffer;

            this.setupTracks();
        } catch (error) {
            console.error('Audio initialization failed:', error);
        }
    }

    async loadSamples() {
        for (const [name, config] of Object.entries(SAMPLE_DEFINITIONS)) {
            this.samples[name] = config; // Store config, not a pre-created player function
        }
    }

    async loadImpulseResponse(url) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        this.impulseResponseBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    }

    setupTracks() {
        // Initialize 4 tracks with default settings
        const defaultSounds = ['kick-01', 'snare-01', 'hihat-01', 'bass-01'];

        for (let i = 0; i < 4; i++) {
            const newTrack = new Track(this.audioContext, {
                sound: defaultSounds[i],
                volume: 0.8,
                pan: 0,
                reverbAmount: 0,
                eqLow: 0,
                eqHigh: 0,
                stepCount: this.globalStepCount // All tracks start with 16 steps
            });

            // Connect the new track's dry output to the master input
            newTrack.getOutputNode().connect(this.masterInputGain);
            // Connect the new track's reverb send to the global convolver
            newTrack.getReverbSendNode().connect(this.globalReverbConvolver);

            this.tracks.push(newTrack);
        }
    }

    setBPM(bpm) {
        this.bpm = bpm;
        if (this.isPlaying) {
            this.stop();
            this.play();
        }
    }

    setMasterVolume(volume) {
        this.masterGain.gain.value = volume;
    }

    setMasterReverbWetness(amount) {
        this.globalReverbGain.gain.value = amount;
    }

    setMasterEqLow(gainDb) {
        this.masterEQLow.gain.value = gainDb;
    }

    setMasterEqHigh(gainDb) {
        this.masterEQHigh.gain.value = gainDb;
    }

    setTrackVolume(trackIndex, volume) {
        if (this.tracks[trackIndex]) {
            this.tracks[trackIndex].setVolume(volume);
        }
    }

    setTrackPan(trackIndex, pan) {
        if (this.tracks[trackIndex]) {
            this.tracks[trackIndex].setPan(pan);
        }
    }

    setTrackReverbAmount(trackIndex, amount) {
        if (this.tracks[trackIndex]) {
            this.tracks[trackIndex].setReverbAmount(amount);
        }
    }

    setTrackEqLow(trackIndex, gainDb) {
        if (this.tracks[trackIndex]) {
            this.tracks[trackIndex].setEqLow(gainDb);
        }
    }

    setTrackEqHigh(trackIndex, gainDb) {
        if (this.tracks[trackIndex]) {
            this.tracks[trackIndex].setEqHigh(gainDb);
        }
    }

    setTrackStepCount(trackIndex, count) {
        if (this.tracks[trackIndex]) {
            this.tracks[trackIndex].setStepCount(count);
        }
    }

    play() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.currentStep = 0; // Global 16th note index, always resets to 0
        
        // Duration of one 16th note based on BPM
        const stepDuration = (60 / this.bpm) * 1000 / 4;

        this.intervalId = setInterval(() => {
            this.playStep();
            this.currentStep = (this.currentStep + 1) % this.globalStepCount; // Global step loops 0-15
        }, stepDuration);
    }

    stop() {
        this.isPlaying = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.currentStep = 0; // Reset global step on stop
    }

    playStep() {
        this.tracks.forEach((track, trackIndex) => {
            // Use current global step modulo track's individual stepCount
            if (track.steps[this.currentStep % track.stepCount]) {
                const sampleConfig = this.samples[track.sound];
                if (sampleConfig) {
                    this.sampleGenerator.createSynthSamplePlayer(
                        sampleConfig,
                        track.volume,
                        track.getInputNode(), // Send output to track's EQ chain
                        track.getReverbSendInputNode() // Sample also needs to send to its track's reverb send input
                    ).play(track.volume, track.getInputNode(), track.getReverbSendInputNode());
                }
            }
        });
        
        // Trigger visual update, passing the global step
        this.onStepPlay?.(this.currentStep);
    }

    toggleStep(trackIndex, stepLocal) { // stepLocal is the step within the track's sequence (0-3, 0-7, or 0-15)
        if (this.tracks[trackIndex] && stepLocal < this.tracks[trackIndex].stepCount) {
            this.tracks[trackIndex].steps[stepLocal] = !this.tracks[trackIndex].steps[stepLocal];
            return this.tracks[trackIndex].steps[stepLocal];
        }
        return false;
    }

    setTrackSound(trackIndex, soundName) {
        if (this.tracks[trackIndex]) {
            this.tracks[trackIndex].sound = soundName;
        }
    }

    playSound(soundName) {
        const sampleConfig = this.samples[soundName];
        if (sampleConfig) {
            // For preview, connect directly to masterInputGain
            this.sampleGenerator.createSynthSamplePlayer(
                sampleConfig,
                1, // Full volume for preview
                this.masterInputGain, // Direct connection for preview
                null // No reverb send for simple preview
            ).play(1, this.masterInputGain);
        }
    }

    clearAll() {
        this.tracks.forEach(track => {
            track.steps.fill(false);
        });
    }

    getCurrentStep() {
        return this.currentStep;
    }

    getTrackData(trackIndex) {
        return this.tracks[trackIndex]; // Return the Track instance
    }

    getSampleNames() {
        return Object.keys(this.samples);
    }

    startRecording() {
        this.isRecording = true;
        this.recordedBuffer = [];
    }

    stopRecording() {
        this.isRecording = false;
        return this.recordedBuffer;
    }

    async exportBeat() {
        const totalStepsToExport = this.globalStepCount; // Always export a full 16-step measure
        const loops = 1; // Export the sequence once
        const stepDurationSec = (60 / this.bpm) / 4; // Duration of one 16th note
        const totalDurationSec = loops * totalStepsToExport * stepDurationSec;
        const offlineContext = new OfflineAudioContext(
            2, // Stereo
            this.audioContext.sampleRate * totalDurationSec,
            this.audioContext.sampleRate
        );
        
        // Recreate master chain for offline context
        const offlineMasterInputGain = offlineContext.createGain();
        const offlineMasterEQLow = offlineContext.createBiquadFilter();
        const offlineMasterEQHigh = offlineContext.createBiquadFilter();
        const offlineMasterGain = offlineContext.createGain();

        offlineMasterEQLow.type = 'lowshelf';
        offlineMasterEQLow.frequency.value = 250;
        offlineMasterEQHigh.type = 'highshelf';
        offlineMasterEQHigh.frequency.value = 4000;

        offlineMasterInputGain.connect(offlineMasterEQLow);
        offlineMasterEQLow.connect(offlineMasterEQHigh);
        offlineMasterEQHigh.connect(offlineMasterGain);
        offlineMasterGain.connect(offlineContext.destination);

        // Apply current master settings from live engine
        offlineMasterGain.gain.value = this.masterGain.gain.value;
        offlineMasterEQLow.gain.value = this.masterEQLow.gain.value;
        offlineMasterEQHigh.gain.value = this.masterEQHigh.gain.value;

        // Recreate global reverb for offline context
        const offlineGlobalReverbConvolver = offlineContext.createConvolver();
        const offlineGlobalReverbGain = offlineContext.createGain();
        if (this.impulseResponseBuffer) { // Ensure IR is loaded
            offlineGlobalReverbConvolver.buffer = this.impulseResponseBuffer;
        }
        offlineGlobalReverbConvolver.connect(offlineGlobalReverbGain);
        offlineGlobalReverbGain.connect(offlineMasterInputGain);
        offlineGlobalReverbGain.gain.value = this.globalReverbGain.gain.value; // Apply current master reverb wetness

        // Use a temporary SampleGenerator for offline context
        const offlineSampleGenerator = new SampleGenerator(offlineContext);

        for (let loop = 0; loop < loops; loop++) {
            for (let globalStep = 0; globalStep < totalStepsToExport; globalStep++) { // Loop for 16 global steps
                const stepTime = (loop * totalStepsToExport + globalStep) * stepDurationSec;
                
                this.tracks.forEach((track) => { // track is now a Track instance
                    // Use the current global step (0-15) modulo the track's specific stepCount
                    if (track.steps[globalStep % track.stepCount]) {
                        const config = this.samples[track.sound];
                        if (!config) {
                            console.warn(`Sample config for ${track.sound} not found during export.`);
                            return;
                        }

                        // Recreate track chain nodes for offline context for each sample instance
                        // This is necessary to prevent nodes from being connected multiple times
                        const trackGainNode = offlineContext.createGain();
                        const trackPannerNode = offlineContext.createStereoPanner();
                        const trackEqLowFilter = offlineContext.createBiquadFilter();
                        const trackEqHighFilter = offlineContext.createBiquadFilter();
                        const trackReverbSendGain = offlineContext.createGain();

                        // Apply current track settings from live engine's track instance
                        trackGainNode.gain.value = track.volume;
                        trackPannerNode.pan.value = track.pan;
                        trackEqLowFilter.gain.value = track.eqLow;
                        trackEqHighFilter.gain.value = track.eqHigh;
                        trackReverbSendGain.gain.value = track.reverbAmount;

                        trackEqLowFilter.type = 'lowshelf';
                        trackEqLowFilter.frequency.value = 250;
                        trackEqHighFilter.type = 'highshelf';
                        trackEqHighFilter.frequency.value = 4000;

                        // Connect track chain
                        trackEqLowFilter.connect(trackEqHighFilter);
                        trackEqHighFilter.connect(trackPannerNode);
                        trackPannerNode.connect(trackGainNode);
                        trackGainNode.connect(offlineMasterInputGain); // Dry signal to master
                        trackGainNode.connect(trackReverbSendGain);
                        trackReverbSendGain.connect(offlineGlobalReverbConvolver); // Wet send to global reverb

                        // Play the sound using the offline sample generator
                        offlineSampleGenerator.createSynthSamplePlayer(
                            config,
                            track.volume,
                            trackEqLowFilter, // Pass track's EQ filter for connection
                            trackReverbSendGain // Pass track's reverb send for connection
                        ).playAtTime(stepTime, track.volume, trackEqLowFilter, trackReverbSendGain);
                    }
                });
            }
        }

        try {
            const renderedBuffer = await offlineContext.startRendering();
            WavEncoder.downloadAudio(renderedBuffer);
        } catch (error) {
            console.error('Export failed:', error);
        }
    }
}