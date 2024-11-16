import {useEffect, useState} from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

type Device = {
    id: string;
    name: string;
}

function App() {
    const [ keys, setKeys ] = useState(["A#"]);
    const [ error, setError ] = useState<string>();
    const [ midi, setMidi ] = useState<any>();
    const [ devices, setDevices ] = useState<Device[]>();
    const [ selectedDevice, setSelectedDevice ] = useState<Device>();

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
        console.log(`Released note ${note}`);
    }
    
    function pressNote(note) {
        console.log(`Pressed note ${note}`);
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
        {keys.map((key, i) => <h2 key={`key-${i}`}>{key}</h2>)}
    </>);
}

export default App
