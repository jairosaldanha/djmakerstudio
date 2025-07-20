export class MixerRenderer {
    static render(numTracks) {
        const mixerChannelsContainer = document.querySelector('.mixer-channels');
        mixerChannelsContainer.innerHTML = ''; // Clear existing content

        for (let i = 0; i < numTracks; i++) {
            const channelDiv = document.createElement('div');
            channelDiv.classList.add('mixer-channel');
            channelDiv.dataset.track = i;
            channelDiv.innerHTML = `
                <h3>TRACK ${i + 1}</h3>
                <div class="control-group">
                    <label for="vol-${i}">VOL</label>
                    <input type="range" id="vol-${i}" min="0" max="1" step="0.01" value="0.8" data-track="${i}" data-control="volume">
                </div>
                <div class="control-group">
                    <label for="pan-${i}">PAN</label>
                    <input type="range" id="pan-${i}" min="-1" max="1" step="0.01" value="0" data-track="${i}" data-control="pan">
                </div>
                <div class="control-group">
                    <label for="rev-${i}">REVERB</label>
                    <input type="range" id="rev-${i}" min="0" max="1" step="0.01" value="0" data-track="${i}" data-control="reverb">
                </div>
                <div class="control-group">
                    <label for="eqlow-${i}">LOW EQ</label>
                    <input type="range" id="eqlow-${i}" min="-12" max="12" step="0.1" value="0" data-track="${i}" data-control="eqlow">
                </div>
                <div class="control-group">
                    <label for="eqhigh-${i}">HIGH EQ</label>
                    <input type="range" id="eqhigh-${i}" min="-12" max="12" step="0.1" value="0" data-track="${i}" data-control="eqhigh">
                </div>
            `;
            mixerChannelsContainer.appendChild(channelDiv);
        }
    }
}