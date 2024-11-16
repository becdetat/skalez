import {useEffect, useState} from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

type Device = {
    id: string;
    name: string;
}


const notes = [ "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B" ];
const scales = {
    major: [ 0, 2, 4, 5, 7, 9, 11 ],
    minor: [ 0, 2, 3, 5, 7, 8, 10 ]
};

function getPossibleScales(noteStates: NoteState[]) {
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

type NoteState = {
    note: string;
    pressed: boolean;
}

function App() {
    const [ error, setError ] = useState<string>();
    const [ midi, setMidi ] = useState<any>();
    const [ devices, setDevices ] = useState<Device[]>();
    const [ selectedDevice, setSelectedDevice ] = useState<Device>();
    const [ noteStates, setNoteStates ] = useState<NoteState[]>([
        { note: "C", pressed: false },
        { note: "C#", pressed: false },
        { note: "D", pressed: false },
        { note: "D#", pressed: false },
        { note: "E", pressed: false },
        { note: "F", pressed: false },
        { note: "F#", pressed: false },
        { note: "G", pressed: false },
        { note: "G#", pressed: false },
        { note: "A", pressed: false },
        { note: "A#", pressed: false },
        { note: "B", pressed: false }
    ]);
    const [ recordedNoteStates, setRecordedNoteStates ] = useState<NoteState[]>([]);
    const [ possibleScales, setPossibleScales ] = useState<{ rootNote: string, scaleName: string }[]>([]);
    
    function connectTo(device) {
        setSelectedDevice(device);
        midi.inputs.forEach((input) => {
            if (input.id === device.id) {
                input.onmidimessage = onMidiMessage;
            }
        });
    }
    function onMidiMessage(event) {
        const command = event.data[0];
        const note = event.data[1];
        const velocity = event.data[2];
        
        // Command must be 0x90, otherwise it's a message we're not interested in
        if (command !== 0x90) {
            return;
        }
        
        // If velocity is zero, the key has been released
        if (velocity === 0) {
            releaseNote(note);
        } else {
            pressNote(note);
        }
    }
    
    function releaseNote(note) {
        setNoteStates(previousState => {
            const newState = [...previousState];
            newState[note % 12].pressed = false;
            return newState;
        });
    }
    
    function pressNote(noteData: number) {
        const note = notes[noteData % 12];
        setNoteStates(previousState => {
            const newState = [...previousState];
            newState[noteData % 12].pressed = true;
            return newState;
        })
        // record the note
        setRecordedNoteStates(previousState => {
            if (previousState.every(x => x.note !== note)) {
                const newState = [
                    ...previousState,
                    {
                        note,
                        pressed: true
                    }
                ];
                setPossibleScales(getPossibleScales(newState));
                return newState;
            } else {
                return previousState;
            }
        });
    }
    
    function clearRecordedNotes() {
        setRecordedNoteStates([]);
        setPossibleScales(getPossibleScales([]));
    }
    
    useEffect(() => {
        function onSuccess(midiAccess: MIDIAccess) {
            setMidi(midiAccess);
            
            const devicesArray: Device[] = [];
            midiAccess.inputs.forEach((input) => {
                devicesArray.push({
                    id: input.id,
                    name: input.name
                })
            });
            setDevices(devicesArray);
        }
        
        navigator
            .requestMIDIAccess()
            .then(onSuccess, setError);
    }, []);
    
    // Order by note (C to B)
    const orderedRecordedNoteStates = [...recordedNoteStates]
        .sort((a, b) => notes.indexOf(a.note) - notes.indexOf(b.note));
    
    return (<>
        <h1>Skalez</h1>
        {!midi && !error && <p>Allow access to your MIDI device to continue.</p>}
        {devices && !selectedDevice && devices.map((device) => (
            <p key={`input-${device.id}`}>
                {device.name} <button onClick={() => connectTo(device)}>Connect</button>
            </p>
        ))}
        {selectedDevice && <p>Connected to {selectedDevice.name}</p>}
        {error && <>
            <h2>Failed to get MIDI access.</h2>
            <p>Reset the MIDI device control permission in your browser and try again.</p>
        </>}
        <h2>
            Pressed: {noteStates.filter((x) => x.pressed).map((x) => ` ${x.note}`)}
        </h2>
        <h2>
            Recorded: {orderedRecordedNoteStates.map((x) => ` ${x.note}`)} <button onClick={clearRecordedNotes}>Clear</button>
        </h2>
        <h2>Possible scales:</h2>
        <ul>
            {possibleScales.map((scale, i) => <li key={`scale-${i}`}>{scale.rootNote} {scale.scaleName}</li>)}
        </ul>
    </>);
}

export default App
