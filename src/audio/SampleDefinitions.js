export const SAMPLE_DEFINITIONS = {
    'kick-01': { category: 'drums', freq: 60, type: 'sine', duration: 0.5, gain: 0.8, attack: 0.005, decay: 0.3 },
    'kick-02': { category: 'drums', freq: 50, type: 'triangle', duration: 0.7, gain: 0.9, attack: 0.01, decay: 0.4 },
    'snare-01': { category: 'drums', freq: 200, type: 'sawtooth', duration: 0.2, gain: 0.6, noise: true, attack: 0.001, decay: 0.15, noiseGain: 0.4, filterFreq: 1500, filterQ: 1 },
    'snare-02': { category: 'drums', freq: 150, type: 'square', duration: 0.3, gain: 0.7, noise: true, attack: 0.002, decay: 0.2, noiseGain: 0.5, filterFreq: 1000, filterQ: 0.5 },
    'clap-01': { category: 'drums', freq: 1000, type: 'square', duration: 0.15, gain: 0.5, noise: true, attack: 0.001, decay: 0.1, noiseGain: 0.6, filterType: 'bandpass', filterFreq: 800, filterQ: 2 },
    'clap-02': { category: 'drums', freq: 1200, type: 'triangle', duration: 0.2, gain: 0.4, noise: true, attack: 0.005, decay: 0.15, noiseGain: 0.7, filterType: 'bandpass', filterFreq: 1000, filterQ: 1.5 },
    'hihat-01': { category: 'drums', freq: 8000, type: 'sawtooth', duration: 0.1, gain: 0.3, noise: true, attack: 0.001, decay: 0.05, noiseGain: 0.8, filterType: 'highpass', filterFreq: 5000 },
    'hihat-02': { category: 'drums', freq: 9000, type: 'square', duration: 0.15, gain: 0.25, noise: true, attack: 0.002, decay: 0.07, noiseGain: 0.7, filterType: 'highpass', filterFreq: 6000 },
    'perc-01': { category: 'drums', freq: 400, type: 'triangle', duration: 0.3, gain: 0.4, attack: 0.005, decay: 0.2 },
    'perc-02': { category: 'drums', freq: 800, type: 'sine', duration: 0.25, gain: 0.35, attack: 0.002, decay: 0.15 },
    'bass-01': { category: 'synths', freq: 80, type: 'square', duration: 0.8, gain: 0.7, attack: 0.01, decay: 0.5, sustain: 0.6 },
    'bass-02': { category: 'synths', freq: 60, type: 'sawtooth', duration: 1.0, gain: 0.75, attack: 0.05, decay: 0.7, sustain: 0.5 },
    'synth-01': { category: 'synths', freq: 440, type: 'triangle', duration: 1.0, gain: 0.5, attack: 0.1, decay: 0.5, sustain: 0.7 },
    'synth-02': { category: 'synths', freq: 520, type: 'sine', duration: 1.2, gain: 0.45, attack: 0.05, decay: 0.6, sustain: 0.8 },
    'fx-01': { category: 'fx', freq: 1200, type: 'sine', duration: 0.7, gain: 0.4, sweep: { start: 1200, end: 100 }, attack: 0.01, decay: 0.6 },
    'fx-02': { category: 'fx', freq: 200, type: 'sawtooth', duration: 0.8, gain: 0.35, sweep: { start: 200, end: 1500 }, attack: 0.05, decay: 0.7 }
};

