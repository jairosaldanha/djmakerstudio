import { MixerRenderer } from 'src/ui/MixerRenderer.js';
import { SequencerRenderer } from 'src/ui/SequencerRenderer.js';
import { AudioEngine } from '.audio-engine.js'; // Import AudioEngine
import { Sequencer } from 'sequencer.js'; // Import Sequencer

class BeatMaker {
    constructor() {
        this.audioEngine = new AudioEngine();
        this.sequencer = null;
        
        this.init();
    }

    async init() {
        // Wait for audio engine to initialize
        await this.audioEngine.init();
        
        // Dynamically render mixer and sequencer sections
        const tracksData = this.audioEngine.tracks; // Get the actual Track instances
        const allSoundNames = this.audioEngine.getSampleNames();

        MixerRenderer.render(tracksData.length); // Mixer still only needs number of tracks
        SequencerRenderer.render(tracksData, allSoundNames); // Pass track data and all sound names

        // Initialize sequencer after DOM elements are rendered
        this.sequencer = new Sequencer(this.audioEngine);
        
        this.setupEventListeners();
        this.initMixerControls(); // Initialize mixer control states and listeners
        
        console.log('Beat Maker Studio initialized!');
    }

    setupEventListeners() {
        // Transport controls
        document.getElementById('play-btn').addEventListener('click', () => {
            if (this.audioEngine.isPlaying) {
                this.audioEngine.stop();
                this.updatePlayButton(false);
            } else {
                this.audioEngine.play();
                this.updatePlayButton(true);
            }
        });

        document.getElementById('stop-btn').addEventListener('click', () => {
            this.audioEngine.stop();
            this.updatePlayButton(false);
            this.sequencer.clearStepIndicators(); // Ensure highlights are cleared
        });

        document.getElementById('clear-btn').addEventListener('click', () => {
            this.sequencer.clearAll();
        });

        // BPM control
        const bpmSlider = document.getElementById('bpm');
        const bpmValue = document.getElementById('bpm-value');
        
        bpmSlider.addEventListener('input', (e) => {
            const bpm = parseInt(e.target.value);
            this.audioEngine.setBPM(bpm);
            bpmValue.textContent = bpm;
        });

        // Export button
        document.getElementById('export-btn').addEventListener('click', async () => {
            const exportBtn = document.getElementById('export-btn');
            const exportIcon = exportBtn.querySelector('.btn-icon i');
            const exportText = exportBtn.querySelector('.btn-text');

            exportBtn.disabled = true;
            exportIcon.classList.remove('fa-download', 'fa-circle-check', 'fa-circle-xmark');
            exportIcon.classList.add('fa-spinner', 'fa-spin');
            exportText.textContent = 'EXPORTING...';
            
            try {
                await this.audioEngine.exportBeat();
                exportIcon.classList.remove('fa-spinner', 'fa-spin');
                exportIcon.classList.add('fa-circle-check');
                exportText.textContent = 'EXPORTED!';
                setTimeout(() => {
                    exportIcon.classList.remove('fa-circle-check');
                    exportIcon.classList.add('fa-download');
                    exportText.textContent = 'EXPORT';
                    exportBtn.disabled = false;
                }, 2000);
            } catch (error) {
                console.error('Export failed:', error);
                exportIcon.classList.remove('fa-spinner', 'fa-spin');
                exportIcon.classList.add('fa-circle-xmark');
                exportText.textContent = 'FAILED';
                setTimeout(() => {
                    exportIcon.classList.remove('fa-circle-xmark');
                    exportIcon.classList.add('fa-download');
                    exportText.textContent = 'EXPORT';
                    exportBtn.disabled = false;
                }, 2000);
            }
        });

        // Spacebar Play/Pause toggle
        document.addEventListener('keydown', (e) => {
            // Check if the event target is an input field (to prevent accidental triggers)
            const activeElement = document.activeElement;
            const isInputFocused = activeElement.tagName === 'INPUT' || activeElement.tagName === 'SELECT' || activeElement.tagName === 'TEXTAREA';

            if (e.code === 'Space' && !isInputFocused) {
                e.preventDefault(); // Prevent scrolling down the page
                if (this.audioEngine.isPlaying) {
                    this.audioEngine.stop();
                    this.updatePlayButton(false);
                    this.sequencer.clearStepIndicators(); // Ensure highlights are cleared
                } else {
                    this.audioEngine.play();
                    this.updatePlayButton(true);
                }
            }
        });

        // Sound library interactions
        const soundItems = document.querySelectorAll('.sound-item');
        soundItems.forEach(item => {
            // Click for instant playback/testing (now the only way to play sound from library)
            item.addEventListener('click', () => {
                const soundName = item.dataset.sound;
                this.audioEngine.playSound(soundName);
                
                // Visual feedback
                item.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    item.style.transform = 'translateY(-3px)';
                }, 100);
            });

            // Drag and drop for assigning to tracks
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.dataset.sound);
                e.dataTransfer.effectAllowed = 'copy';
                item.classList.add('dragging');
            });

            item.addEventListener('dragend', (e) => {
                item.classList.remove('dragging');
            });
        });

        // Drag and drop for sound selectors (both sound and step count selectors can be drop targets now)
        const allSelectors = document.querySelectorAll('.sound-selector, .step-count-selector');
        allSelectors.forEach(selector => {
            selector.addEventListener('dragover', (e) => {
                e.preventDefault(); // Allow drop
                e.dataTransfer.dropEffect = 'copy';
                selector.classList.add('drag-over');
            });

            selector.addEventListener('dragleave', () => {
                selector.classList.remove('drag-over');
            });

            selector.addEventListener('drop', (e) => {
                e.preventDefault();
                selector.classList.remove('drag-over');
                const soundName = e.dataTransfer.getData('text/plain');
                const trackIndex = parseInt(selector.dataset.track);

                // Only update sound-selector if drop target is a sound selector
                if (selector.classList.contains('sound-selector')) {
                    // Update the select element's value
                    selector.value = soundName;
                    // Inform the audio engine about the change
                    this.audioEngine.setTrackSound(trackIndex, soundName);

                    // Add visual feedback to the selector
                    selector.classList.add('drop-success');
                    setTimeout(() => {
                        selector.classList.remove('drop-success');
                    }, 500);
                }
                // Dropping on step-count-selector does nothing for sound (as intended)
            });
        });
    }

    initMixerControls() {
        // Initialize track mixer controls
        document.querySelectorAll('.mixer-channel').forEach(channel => {
            const trackIndex = parseInt(channel.dataset.track);
            const track = this.audioEngine.getTrackData(trackIndex); // Use getTrackData to get Track instance

            if (track) { // Ensure track data exists before setting values
                channel.querySelector(`input[data-control="volume"]`).value = track.volume;
                channel.querySelector(`input[data-control="pan"]`).value = track.pan;
                channel.querySelector(`input[data-control="reverb"]`).value = track.reverbAmount;
                channel.querySelector(`input[data-control="eqlow"]`).value = track.eqLow;
                channel.querySelector(`input[data-control="eqhigh"]`).value = track.eqHigh;
            }

            // Add event listeners for track controls
            channel.querySelectorAll('input[type="range"]').forEach(control => {
                control.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    const controlType = e.target.dataset.control;
                    
                    switch (controlType) {
                        case 'volume':
                            this.audioEngine.setTrackVolume(trackIndex, value);
                            break;
                        case 'pan':
                            this.audioEngine.setTrackPan(trackIndex, value);
                            break;
                        case 'reverb':
                            this.audioEngine.setTrackReverbAmount(trackIndex, value);
                            break;
                        case 'eqlow':
                            this.audioEngine.setTrackEqLow(trackIndex, value);
                            break;
                        case 'eqhigh':
                            this.audioEngine.setTrackEqHigh(trackIndex, value);
                            break;
                    }
                });
            });
        });

        // Initialize master mixer controls
        document.getElementById('master-vol').value = this.audioEngine.masterGain.gain.value;
        document.getElementById('master-rev-wet').value = this.audioEngine.globalReverbGain.gain.value;
        document.getElementById('master-eqlow').value = this.audioEngine.masterEQLow.gain.value;
        document.getElementById('master-eqhigh').value = this.audioEngine.masterEQHigh.gain.value;

        // Add event listeners for master controls
        document.getElementById('master-vol').addEventListener('input', (e) => {
            this.audioEngine.setMasterVolume(parseFloat(e.target.value));
        });
        document.getElementById('master-rev-wet').addEventListener('input', (e) => {
            this.audioEngine.setMasterReverbWetness(parseFloat(e.target.value));
        });
        document.getElementById('master-eqlow').addEventListener('input', (e) => {
            this.audioEngine.setMasterEqLow(parseFloat(e.target.value));
        });
        document.getElementById('master-eqhigh').addEventListener('input', (e) => {
            this.audioEngine.setMasterEqHigh(parseFloat(e.target.value));
        });
    }

    updatePlayButton(isPlaying) {
        const playBtn = document.getElementById('play-btn');
        const icon = playBtn.querySelector('.btn-icon i'); // Select the i tag directly
        const text = playBtn.querySelector('.btn-text');
        
        if (isPlaying) {
            icon.classList.remove('fa-play');
            icon.classList.add('fa-pause');
            text.textContent = 'PAUSE';
            playBtn.style.background = 'linear-gradient(45deg, #ff0000, #ff6600)';
        } else {
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
            text.textContent = 'PLAY';
            playBtn.style.background = 'linear-gradient(45deg, #ff00ff, #00ffff)';
        }
    }
}

// Initialize the beat maker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BeatMaker();
});
