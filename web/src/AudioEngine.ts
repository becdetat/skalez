const activeOscillators = {};
let audioContext;

export function playNote(note: number, velocity: number) {
    audioContext = audioContext || new ((window as any).AudioContext || (window as any).webkitAudioContext)();
    
    if (activeOscillators[note]) {
        return;
    }   

    const oscillator = audioContext.createOscillator();
    const gainNode = getGain(velocity);
    activeOscillators[note] = {
        oscillator,
        gainNode
    };
    
    // Normalise the gain for each note being played so it totals 1.0 (otherwise it distorts)
    const adjustedGain = 0.95 / Object.keys(activeOscillators).length;
    for (const key in activeOscillators) {
        activeOscillators[key].gainNode.gain.setValueAtTime(adjustedGain, audioContext.currentTime);
    }

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(getFrequencyForNote(note), audioContext.currentTime);
    oscillator
        .connect(getLowPassFilter(1500))
        .connect(gainNode)
        .connect(getCompressor(-30))
        .connect(audioContext.destination);
    oscillator.start();    
}

function getCompressor(threshold: number) {
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(threshold, audioContext.currentTime);
    compressor.knee.setValueAtTime(40, audioContext.currentTime);
    compressor.ratio.setValueAtTime(12, audioContext.currentTime);
    compressor.attack.setValueAtTime(0.003, audioContext.currentTime);
    compressor.release.setValueAtTime(0.25, audioContext.currentTime);
    return compressor;
}

function getGain(velocity: number) {
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(velocity / 127, audioContext.currentTime);
    return gainNode;
}

function getFrequencyForNote(note: number) {
    return 440 * Math.pow(2, (note - 69) / 12);
}

function getLowPassFilter(frequency: number) {
    const filter = audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(frequency, audioContext.currentTime);
    return filter;
}

export function stopNote(note: number) {
    if (!activeOscillators[note]) {
        return;
    }
    
    const {
        oscillator,
        gainNode
    } = activeOscillators[note];
    
    gainNode.gain.setValueAtTime(gainNode.gain.value, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);

    oscillator.stop(audioContext.currentTime + 0.1);
    
    delete activeOscillators[note];
}