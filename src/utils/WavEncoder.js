export class WavEncoder {
    static downloadAudio(buffer, filename = 'beat.wav') {
        const numOfChan = buffer.numberOfChannels;
        const totalLength = buffer.length * numOfChan;
        const sampleRate = buffer.sampleRate;
        const bytesPerSample = 2; // 16-bit PCM
        const blockAlign = numOfChan * bytesPerSample;
        const byteRate = sampleRate * blockAlign;

        const arrayBuffer = new ArrayBuffer(44 + totalLength * bytesPerSample);
        const view = new DataView(arrayBuffer);
        
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + totalLength * bytesPerSample, true); // ChunkSize
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true); // Subchunk1Size
        view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
        view.setUint16(22, numOfChan, true); // NumChannels
        view.setUint32(24, sampleRate, true); // SampleRate
        view.setUint32(28, byteRate, true); // ByteRate
        view.setUint16(32, blockAlign, true); // BlockAlign
        view.setUint16(34, bytesPerSample * 8, true); // BitsPerSample
        writeString(36, 'data');
        view.setUint32(40, totalLength * bytesPerSample, true); // Subchunk2Size
        
        let offset = 44;
        for (let i = 0; i < buffer.length; i++) {
            for (let channel = 0; channel < numOfChan; channel++) {
                const sample = buffer.getChannelData(channel)[i];
                const s = Math.max(-1, Math.min(1, sample)); // Clamp to [-1, 1]
                view.setInt16(offset, s * 0x7FFF, true); // 16-bit PCM
                offset += bytesPerSample;
            }
        }
        
        const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}