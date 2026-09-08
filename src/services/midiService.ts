import { Pitch, NoteStep, AccidentalType } from '../types/score';
import { audioEngine } from './audioEngine';

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
  state: string;
}

type NoteListener = (pitch: Pitch, velocity: number) => void;
type DeviceListener = (devices: MidiDevice[]) => void;

class MidiService {
  private midiAccess: any = null;
  private noteListeners: NoteListener[] = [];
  private deviceListeners: DeviceListener[] = [];
  private isSupported = false;
  private connectedDevices: MidiDevice[] = [];

  constructor() {
    this.isSupported = typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
  }

  public getIsSupported(): boolean {
    return this.isSupported;
  }

  public async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      this.updateDevices();

      this.midiAccess.onstatechange = () => {
        this.updateDevices();
      };

      this.attachInputs();
      return true;
    } catch {
      return false;
    }
  }

  private updateDevices() {
    if (!this.midiAccess) return;
    const devices: MidiDevice[] = [];
    this.midiAccess.inputs.forEach((input) => {
      devices.push({
        id: input.id,
        name: input.name || 'MIDI Input Device',
        manufacturer: input.manufacturer || 'Generic',
        state: input.state,
      });
    });
    this.connectedDevices = devices;
    this.deviceListeners.forEach((l) => l(devices));
  }

  private attachInputs() {
    if (!this.midiAccess) return;
    this.midiAccess.inputs.forEach((input) => {
      input.onmidimessage = this.handleMidiMessage.bind(this);
    });
  }

  private handleMidiMessage(event: any) {
    const [status, noteNumber, velocity] = event.data;
    const command = status >> 4;

    // 0x9 = note on, 0x8 = note off
    if (command === 9 && velocity > 0) {
      const pitch = this.midiNoteToPitch(noteNumber);
      // Play audio preview
      audioEngine.playPitch(pitch, 'C_major', 0.5);
      // Notify active note entry listeners
      this.noteListeners.forEach((l) => l(pitch, velocity));
    }
  }

  public midiNoteToPitch(midi: number): Pitch {
    // MIDI 60 is C4
    const semitonesFromC0 = midi - 12; // C0 = MIDI 12
    const octave = Math.floor(semitonesFromC0 / 12);
    const semitone = ((semitonesFromC0 % 12) + 12) % 12;

    const SEMITONE_MAP: { step: NoteStep; accidental?: AccidentalType }[] = [
      { step: 'C' },
      { step: 'C', accidental: 'sharp' },
      { step: 'D' },
      { step: 'E', accidental: 'flat' },
      { step: 'E' },
      { step: 'F' },
      { step: 'F', accidental: 'sharp' },
      { step: 'G' },
      { step: 'A', accidental: 'flat' },
      { step: 'A' },
      { step: 'B', accidental: 'flat' },
      { step: 'B' },
    ];

    const match = SEMITONE_MAP[semitone];
    return {
      step: match.step,
      octave: octave,
      accidental: match.accidental ?? null,
    };
  }

  public onNote(listener: NoteListener): () => void {
    this.noteListeners.push(listener);
    return () => {
      this.noteListeners = this.noteListeners.filter((l) => l !== listener);
    };
  }

  public onDevicesChange(listener: DeviceListener): () => void {
    this.deviceListeners.push(listener);
    listener(this.connectedDevices);
    return () => {
      this.deviceListeners = this.deviceListeners.filter((l) => l !== listener);
    };
  }

  public getConnectedDevices(): MidiDevice[] {
    return this.connectedDevices;
  }
}

export const midiService = new MidiService();
