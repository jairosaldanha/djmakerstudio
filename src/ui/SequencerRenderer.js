export class SequencerRenderer {
    static render(tracksData, allSounds) { // tracksData will be an array of Track instances
        const sequencerGridContainer = document.querySelector('.sequencer-grid');
        sequencerGridContainer.innerHTML = ''; // Clear existing content

        tracksData.forEach((track, i) => {
            const trackRowDiv = document.createElement('div');
            trackRowDiv.classList.add('track-row');
            trackRowDiv.dataset.track = i; // Add data-track to the row for easier targeting

            // Generate options for the sound selector
            const optionsHtml = allSounds.map(sound => {
                // Convert sound-name-01 to "SOUND NAME 01" for display
                const displayName = sound.replace(/-/g, ' ').toUpperCase();
                const isSelected = sound === track.sound ? 'selected' : ''; // Use track.sound
                return `<option value="${sound}" ${isSelected}>${displayName}</option>`;
            }).join('');

            // Generate options for the step count selector
            const stepOptions = [4, 8, 16].map(count => {
                const isSelected = count === track.stepCount ? 'selected' : '';
                return `<option value="${count}" ${isSelected}>${count} Steps</option>`;
            }).join('');

            trackRowDiv.innerHTML = `
                <div class="track-info">
                    <div class="track-name">TRACK ${i + 1}</div>
                    <select class="sound-selector" data-track="${i}">
                        ${optionsHtml}
                    </select>
                    <select class="step-count-selector" data-track="${i}">
                        ${stepOptions}
                    </select>
                </div>
                <div class="step-buttons" data-track="${i}">
                    <!-- Step buttons will be generated by Sequencer class -->
                </div>
            `;
            sequencerGridContainer.appendChild(trackRowDiv);
        });
    }

    // New static method to render steps for a single track (called by Sequencer.js)
    static renderTrackSteps(trackIndex, stepCount, stepsActiveState) {
        const trackStepButtonsContainer = document.querySelector(`.step-buttons[data-track="${trackIndex}"]`);
        if (!trackStepButtonsContainer) return;

        trackStepButtonsContainer.innerHTML = '';
        // Group steps into 'measures' of 4 for visual consistency, even if total steps isn't a multiple of 4
        const measures = Math.ceil(stepCount / 4);

        for (let measure = 0; measure < measures; measure++) {
            const measureGroup = document.createElement('div');
            measureGroup.classList.add('measure-group');

            for (let stepInMeasure = 0; stepInMeasure < 4; stepInMeasure++) {
                const actualStepIndex = (measure * 4) + stepInMeasure;
                if (actualStepIndex >= stepCount) break; // Stop if we exceed the track's stepCount

                const button = document.createElement('button');
                button.className = 'step-button';
                button.dataset.track = trackIndex;
                button.dataset.step = actualStepIndex;
                button.textContent = (stepInMeasure + 1).toString(); // Display 1-4 for steps within a measure
                                                                  // Convert to string for textContent

                if (stepsActiveState[actualStepIndex]) {
                    button.classList.add('active');
                }

                measureGroup.appendChild(button);
            }
            trackStepButtonsContainer.appendChild(measureGroup);
        }
    }
}