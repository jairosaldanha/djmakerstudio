export class SampleGenerator {
    constructor(audioContext) {
        this.audioContext = audioContext;
    }

    createNoiseBuffer(duration) {
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        return buffer;
    }

    createSynthSamplePlayer(config, baseVolume = 1, destinationNode, reverbSendNode = null) {
        return {
            play: (volume = baseVolume, dest = destinationNode, revSend = reverbSendNode) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain(); // This is the sample's ADSR gain
                
                const now = this.audioContext.currentTime;
                const attackTime = config.attack || 0.01;
                const decayTime = config.decay || 0.1;
                const sustainValue = config.sustain !== undefined ? config.sustain * volume * config.gain : 0.01;
                const releaseTime = config.release || 0.1;
                const totalDuration = config.duration || (attackTime + decayTime + releaseTime);

                gainNode.gain.setValueAtTime(0, now);
                gainNode.gain.linearRampToValueAtTime(volume * config.gain, now + attackTime);
                gainNode.gain.linearRampToValueAtTime(sustainValue, now + attackTime + decayTime);
                gainNode.gain.linearRampToValueAtTime(0.0001, now + totalDuration);

                oscillator.type = config.type;
                oscillator.frequency.value = config.freq;
                
                if (config.sweep) {
                    oscillator.frequency.setValueAtTime(config.sweep.start, now);
                    oscillator.frequency.exponentialRampToValueAtTime(
                        config.sweep.end, 
                        now + totalDuration
                    );
                }

                const sampleFilter = this.audioContext.createBiquadFilter();
                sampleFilter.type = config.filterType || 'lowpass';
                sampleFilter.frequency.value = config.filterFreq || 20000;
                sampleFilter.Q.value = config.filterQ || 1;

                if (!config.filterType && config.freq > 2000) {
                    sampleFilter.type = 'highpass';
                    sampleFilter.frequency.value = config.filterFreq || 2000;
                } else if (!config.filterType && config.freq < 150) {
                    sampleFilter.type = 'lowpass';
                    sampleFilter.frequency.value = config.filterFreq || 800;
                }

                oscillator.connect(sampleFilter);
                sampleFilter.connect(gainNode);

                if (config.noise) {
                    const noiseBuffer = this.createNoiseBuffer(totalDuration);
                    const noiseSource = this.audioContext.createBufferSource();
                    noiseSource.buffer = noiseBuffer;
                    
                    const noiseGain = this.audioContext.createGain();
                    noiseGain.gain.value = config.noiseGain || 0.3;
                    
                    noiseSource.connect(noiseGain);
                    noiseGain.connect(gainNode);
                    noiseSource.start(now);
                    noiseSource.stop(now + totalDuration);
                }

                if (dest) { // Connect to the provided destination (track EQ or master input)
                    gainNode.connect(dest);
                }
                if (revSend) { // Connect to track's reverb send if provided
                    gainNode.connect(revSend);
                }

                oscillator.start(now);
                oscillator.stop(now + totalDuration);
            },
            playAtTime: (time, volume = baseVolume, dest = destinationNode, revSend = reverbSendNode) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                const now = time; // Use the provided time for scheduling
                const attackTime = config.attack || 0.01;
                const decayTime = config.decay || 0.1;
                const sustainValue = config.sustain !== undefined ? config.sustain * volume * config.gain : 0.01;
                const releaseTime = config.release || 0.1;
                const totalDuration = config.duration || (attackTime + decayTime + releaseTime);

                gainNode.gain.setValueAtTime(0, now);
                gainNode.gain.linearRampToValueAtTime(volume * config.gain, now + attackTime);
                gainNode.gain.linearRampToValueAtTime(sustainValue, now + attackTime + decayTime);
                gainNode.gain.linearRampToValueAtTime(0.0001, now + totalDuration);

                oscillator.type = config.type;
                oscillator.frequency.value = config.freq;
                
                if (config.sweep) {
                    oscillator.frequency.setValueAtTime(config.sweep.start, now);
                    oscillator.frequency.exponentialRampToValueAtTime(
                        config.sweep.end, 
                        now + totalDuration
                    );
                }

                const sampleFilter = this.audioContext.createBiquadFilter();
                sampleFilter.type = config.filterType || 'lowpass';
                sampleFilter.frequency.value = config.filterFreq || 20000;
                sampleFilter.Q.value = config.filterQ || 1;

                if (!config.filterType && config.freq > 2000) {
                    sampleFilter.type = 'highpass';
                    sampleFilter.frequency.value = config.filterFreq || 2000;
                } else if (!config.filterType && config.freq < 150) {
                    sampleFilter.type = 'lowpass';
                    sampleFilter.frequency.value = config.filterFreq || 800;
                }

                oscillator.connect(sampleFilter);
                sampleFilter.connect(gainNode);

                if (config.noise) {
                    const noiseBuffer = this.createNoiseBuffer(totalDuration);
                    const noiseSource = this.audioContext.createBufferSource();
                    noiseSource.buffer = noiseBuffer;
                    
                    const noiseGain = this.audioContext.createGain();
                    noiseGain.gain.value = config.noiseGain || 0.3;
                    
                    noiseSource.connect(noiseGain);
                    noiseGain.connect(gainNode);
                    noiseSource.start(now);
                    noiseSource.stop(now + totalDuration);
                }

                if (dest) {
                    gainNode.connect(dest);
                }
                if (revSend) {
                    gainNode.connect(revSend);
                }
                
                oscillator.start(now);
                oscillator.stop(now + totalDuration);
            }
        };
    }
}