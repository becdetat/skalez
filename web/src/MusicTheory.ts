export type NoteState = {
    note: string;
    pressed: boolean;
}

export const notes = [ "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B" ];
const scales = {
    major: [ 0, 2, 4, 5, 7, 9, 11 ],
    minor: [ 0, 2, 3, 5, 7, 8, 10 ]
};
const chordDefinitions = [
    { name: "Major", intervals: [4, 7] },
    { name: "Minor", intervals: [3, 7] },
    { name: "Diminished", intervals: [3, 6] },
    { name: "Augmented", intervals: [4, 8] },
    { name: "6th", intervals: [5, 9] },
    { name: "Major 7th", intervals: [4, 7, 11] },
    { name: "Minor 7th", intervals: [3, 7, 10] },
    { name: "Dominant 7th", intervals: [4, 7, 10] },
    { name: "Suspended 4th", intervals: [5, 7] },
    { name: "Suspended 2nd", intervals: [2, 7] },
    { name: "Minor 6th", intervals: [3, 8] },
    { name: "Major 6th", intervals: [4, 9] },
    { name: "Major 9th", intervals: [4, 7, 11, 14] },
    { name: "Minor 9th", intervals: [3, 7, 10, 14] },
    { name: "Dominant 9th", intervals: [4, 7, 10, 14] },
    { name: "Major 13th", intervals: [4, 7, 11, 14, 17] },
    { name: "Minor 13th", intervals: [3, 7, 10, 14, 17] },
    { name: "Dominant 13th", intervals: [4, 7, 10, 14, 17] },
    { name: "Augmented 7th", intervals: [4, 8, 10] },
    { name: "Diminished 7th", intervals: [3, 6, 9] },
    { name: "Half-Diminished 7th", intervals: [3, 6, 10] },
    { name: "Minor Major 7th", intervals: [3, 7, 11] },
    { name: "Augmented Major 7th", intervals: [4, 8, 11] },
    { name: "Flat 5", intervals: [4, 6] },
    { name: "Augmented 9th", intervals: [4, 8, 14] },
    { name: "Flat 9", intervals: [4, 7, 10, 13] },
    { name: "Minor 7th Flat 5", intervals: [3, 6, 10] },
    { name: "Sharp 11", intervals: [4, 7, 11, 18] },
];

export function getPossibleScales(noteStates: NoteState[]) {
    if (noteStates.length === 0) {
        return [];
    }

    const activeNotes = noteStates
        .filter(x => x.pressed)
        .map(x => x.note);
    const possibleScales: {rootNote: string, scaleName: string}[] = [];

    for (const [ scaleName, intervals ] of Object.entries(scales)) {
        for (const rootNote of notes) {
            // Get the notes in the scale
            const rootIndex = notes.indexOf(rootNote);
            const scaleNotes = intervals.map(interval => notes[(rootIndex + interval) % notes.length]);

            if (activeNotes.every(note => scaleNotes.includes(note))) {
                possibleScales.push({
                    rootNote,
                    scaleName
                });
            }
        }
    }

    return possibleScales;
}

export function getChord(noteStates) {
    const pressedNoteValues = noteStates
        .filter(x => x.pressed)
        .map(x => notes.indexOf(x.note));
    
    if (pressedNoteValues.length < 2) {
        return null;
    }
    
    const rootNote = pressedNoteValues[0];
    const intervals = pressedNoteValues
        .map(note => (note - rootNote + 12) % 12)
        .slice(1)
        .sort((a, b) => a - b);
    
    for (const chord of chordDefinitions) {
        if (intervals.every(interval => chord.intervals.includes(interval))) {
            return `${notes[rootNote]} ${chord.name}`;
        }
    }
    
    return "Unknown chord";
}
