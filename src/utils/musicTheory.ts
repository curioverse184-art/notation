import {
  NoteDuration,
  AccidentalType,
  NoteStep,
  Pitch,
  NoteEvent,
  TimeSignature,
} from '../types/score';

export interface KeySignatureInfo {
  id: string;
  name: string;
  mode: 'major' | 'minor';
  fifths: number; // >0 for sharps, <0 for flats, 0 for C/Am
  sharpsCount: number;
  flatsCount: number;
  alteredNotes: Partial<Record<NoteStep, 'sharp' | 'flat'>>;
  relativeKey: string;
}

export const KEY_SIGNATURES: Record<string, KeySignatureInfo> = {
  'C_major': {
    id: 'C_major',
    name: 'C major',
    mode: 'major',
    fifths: 0,
    sharpsCount: 0,
    flatsCount: 0,
    alteredNotes: {},
    relativeKey: 'A minor',
  },
  'G_major': {
    id: 'G_major',
    name: 'G major',
    mode: 'major',
    fifths: 1,
    sharpsCount: 1,
    flatsCount: 0,
    alteredNotes: { F: 'sharp' },
    relativeKey: 'E minor',
  },
  'D_major': {
    id: 'D_major',
    name: 'D major',
    mode: 'major',
    fifths: 2,
    sharpsCount: 2,
    flatsCount: 0,
    alteredNotes: { F: 'sharp', C: 'sharp' },
    relativeKey: 'B minor',
  },
  'A_major': {
    id: 'A_major',
    name: 'A major',
    mode: 'major',
    fifths: 3,
    sharpsCount: 3,
    flatsCount: 0,
    alteredNotes: { F: 'sharp', C: 'sharp', G: 'sharp' },
    relativeKey: 'F# minor',
  },
  'E_major': {
    id: 'E_major',
    name: 'E major',
    mode: 'major',
    fifths: 4,
    sharpsCount: 4,
    flatsCount: 0,
    alteredNotes: { F: 'sharp', C: 'sharp', G: 'sharp', D: 'sharp' },
    relativeKey: 'C# minor',
  },
  'B_major': {
    id: 'B_major',
    name: 'B major',
    mode: 'major',
    fifths: 5,
    sharpsCount: 5,
    flatsCount: 0,
    alteredNotes: { F: 'sharp', C: 'sharp', G: 'sharp', D: 'sharp', A: 'sharp' },
    relativeKey: 'G# minor',
  },
  'F#_major': {
    id: 'F#_major',
    name: 'F# major',
    mode: 'major',
    fifths: 6,
    sharpsCount: 6,
    flatsCount: 0,
    alteredNotes: { F: 'sharp', C: 'sharp', G: 'sharp', D: 'sharp', A: 'sharp', E: 'sharp' },
    relativeKey: 'D# minor',
  },
  'C#_major': {
    id: 'C#_major',
    name: 'C# major',
    mode: 'major',
    fifths: 7,
    sharpsCount: 7,
    flatsCount: 0,
    alteredNotes: { F: 'sharp', C: 'sharp', G: 'sharp', D: 'sharp', A: 'sharp', E: 'sharp', B: 'sharp' },
    relativeKey: 'A# minor',
  },
  'F_major': {
    id: 'F_major',
    name: 'F major',
    mode: 'major',
    fifths: -1,
    sharpsCount: 0,
    flatsCount: 1,
    alteredNotes: { B: 'flat' },
    relativeKey: 'D minor',
  },
  'Bb_major': {
    id: 'Bb_major',
    name: 'B♭ major',
    mode: 'major',
    fifths: -2,
    sharpsCount: 0,
    flatsCount: 2,
    alteredNotes: { B: 'flat', E: 'flat' },
    relativeKey: 'G minor',
  },
  'Eb_major': {
    id: 'Eb_major',
    name: 'E♭ major',
    mode: 'major',
    fifths: -3,
    sharpsCount: 0,
    flatsCount: 3,
    alteredNotes: { B: 'flat', E: 'flat', A: 'flat' },
    relativeKey: 'C minor',
  },
  'Ab_major': {
    id: 'Ab_major',
    name: 'A♭ major',
    mode: 'major',
    fifths: -4,
    sharpsCount: 0,
    flatsCount: 4,
    alteredNotes: { B: 'flat', E: 'flat', A: 'flat', D: 'flat' },
    relativeKey: 'F minor',
  },
  'Db_major': {
    id: 'Db_major',
    name: 'D♭ major',
    mode: 'major',
    fifths: -5,
    sharpsCount: 0,
    flatsCount: 5,
    alteredNotes: { B: 'flat', E: 'flat', A: 'flat', D: 'flat', G: 'flat' },
    relativeKey: 'B♭ minor',
  },
  'Gb_major': {
    id: 'Gb_major',
    name: 'G♭ major',
    mode: 'major',
    fifths: -6,
    sharpsCount: 0,
    flatsCount: 6,
    alteredNotes: { B: 'flat', E: 'flat', A: 'flat', D: 'flat', G: 'flat', C: 'flat' },
    relativeKey: 'E♭ minor',
  },
  'Cb_major': {
    id: 'Cb_major',
    name: 'C♭ major',
    mode: 'major',
    fifths: -7,
    sharpsCount: 0,
    flatsCount: 7,
    alteredNotes: { B: 'flat', E: 'flat', A: 'flat', D: 'flat', G: 'flat', C: 'flat', F: 'flat' },
    relativeKey: 'A♭ minor',
  },
  // Natural / Minor variations
  'A_minor': {
    id: 'A_minor',
    name: 'A minor',
    mode: 'minor',
    fifths: 0,
    sharpsCount: 0,
    flatsCount: 0,
    alteredNotes: {},
    relativeKey: 'C major',
  },
  'E_minor': {
    id: 'E_minor',
    name: 'E minor',
    mode: 'minor',
    fifths: 1,
    sharpsCount: 1,
    flatsCount: 0,
    alteredNotes: { F: 'sharp' },
    relativeKey: 'G major',
  },
  'B_minor': {
    id: 'B_minor',
    name: 'B minor',
    mode: 'minor',
    fifths: 2,
    sharpsCount: 2,
    flatsCount: 0,
    alteredNotes: { F: 'sharp', C: 'sharp' },
    relativeKey: 'D major',
  },
  'D_minor': {
    id: 'D_minor',
    name: 'D minor',
    mode: 'minor',
    fifths: -1,
    sharpsCount: 0,
    flatsCount: 1,
    alteredNotes: { B: 'flat' },
    relativeKey: 'F major',
  },
  'G_minor': {
    id: 'G_minor',
    name: 'G minor',
    mode: 'minor',
    fifths: -2,
    sharpsCount: 0,
    flatsCount: 2,
    alteredNotes: { B: 'flat', E: 'flat' },
    relativeKey: 'B♭ major',
  },
  'C_minor': {
    id: 'C_minor',
    name: 'C minor',
    mode: 'minor',
    fifths: -3,
    sharpsCount: 0,
    flatsCount: 3,
    alteredNotes: { B: 'flat', E: 'flat', A: 'flat' },
    relativeKey: 'E♭ major',
  },
};

// Base duration values measured in Quarter Note units (quarter = 1.0)
export const DURATION_VALUES: Record<NoteDuration, number> = {
  whole: 4.0,
  half: 2.0,
  quarter: 1.0,
  eighth: 0.5,
  sixteenth: 0.25,
  thirty_second: 0.125,
};

export function getEventBeats(event: NoteEvent): number {
  const base = DURATION_VALUES[event.duration] ?? 1.0;
  return event.isDotted ? base * 1.5 : base;
}

export function getTimeSignatureCapacity(ts: TimeSignature): number {
  // In quarter notes:
  // denominator 4 -> 1 quarter note each
  // denominator 8 -> 0.5 quarter note each
  // denominator 2 -> 2.0 quarter note each
  // denominator 16 -> 0.25 quarter note each
  return (ts.numerator * 4.0) / ts.denominator;
}

export function validateMeasureEvents(
  events: NoteEvent[],
  ts: TimeSignature
): {
  totalBeats: number;
  capacity: number;
  isValid: boolean;
  difference: number;
} {
  const capacity = getTimeSignatureCapacity(ts);
  const totalBeats = events.reduce((sum, ev) => sum + getEventBeats(ev), 0);
  const diff = totalBeats - capacity;
  const isValid = Math.abs(diff) < 0.0001;
  return {
    totalBeats: Math.round(totalBeats * 1000) / 1000,
    capacity: Math.round(capacity * 1000) / 1000,
    isValid,
    difference: Math.round(diff * 1000) / 1000,
  };
}

// Semitone step lookup from C
const STEP_SEMITONES: Record<NoteStep, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

export function getMidiNote(
  pitch: Pitch,
  keySignatureId = 'C_major',
  measureAccidentals?: Partial<Record<string, AccidentalType>>
): number {
  const keyInfo = KEY_SIGNATURES[keySignatureId] || KEY_SIGNATURES['C_major'];
  let accidental = pitch.accidental;

  // If no explicit accidental on note, check measure accidental or key signature
  if (accidental === undefined || accidental === null) {
    const key = `${pitch.step}${pitch.octave}`;
    if (measureAccidentals && measureAccidentals[key]) {
      accidental = measureAccidentals[key];
    } else if (keyInfo.alteredNotes[pitch.step]) {
      accidental = keyInfo.alteredNotes[pitch.step];
    }
  }

  let semitones = STEP_SEMITONES[pitch.step];
  if (accidental === 'sharp') semitones += 1;
  else if (accidental === 'double_sharp') semitones += 2;
  else if (accidental === 'flat') semitones -= 1;
  else if (accidental === 'double_flat') semitones -= 2;
  // natural does not change base semitone

  // C4 is MIDI 60 => (4 + 1) * 12 + 0 = 60
  return (pitch.octave + 1) * 12 + semitones;
}

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Diatonic step index from C0
const STEP_INDEX: Record<NoteStep, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
};

const INDEX_TO_STEP: NoteStep[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export function getDiatonicStepValue(pitch: Pitch): number {
  return pitch.octave * 7 + STEP_INDEX[pitch.step];
}

export function pitchFromDiatonicStepValue(stepVal: number): { step: NoteStep; octave: number } {
  const octave = Math.floor(stepVal / 7);
  let rem = stepVal % 7;
  if (rem < 0) {
    rem += 7;
  }
  return { step: INDEX_TO_STEP[rem], octave };
}

/**
 * Calculates vertical line position (in staff step units, where 1 unit = half line space)
 * For Treble Clef:
 * Top line (line 5) is F5.
 * Line 4 is D5.
 * Line 3 (middle) is B4.
 * Line 2 is G4.
 * Line 1 (bottom) is E4.
 * Middle C (C4) is step value for C4.
 *
 * For Bass Clef:
 * Top line (line 5) is A3.
 * Line 4 is F3.
 * Line 3 (middle) is D3.
 * Line 2 is B2.
 * Line 1 (bottom) is G2.
 * Middle C (C4) is 1 ledger line above line 5.
 */
export function getStaffStepOffset(pitch: Pitch, staff: 'RH' | 'LH'): number {
  const pitchStepVal = getDiatonicStepValue(pitch);
  if (staff === 'RH') {
    // Reference: B4 is line 3 (middle line of treble staff, offset = 0)
    // Notes higher than B4 have positive offset (drawn higher)
    const b4StepVal = getDiatonicStepValue({ step: 'B', octave: 4 });
    return pitchStepVal - b4StepVal;
  } else {
    // Reference: D3 is line 3 (middle line of bass staff, offset = 0)
    const d3StepVal = getDiatonicStepValue({ step: 'D', octave: 3 });
    return pitchStepVal - d3StepVal;
  }
}

/**
 * Ledger lines needed for a given staff step offset from middle line.
 * Staff has 5 lines, which correspond to step offsets:
 * Line 5 (top) = +4
 * Space 4 = +3
 * Line 4 = +2
 * Space 3 = +1
 * Line 3 (middle) = 0
 * Space 2 = -1
 * Line 2 = -2
 * Space 1 = -3
 * Line 1 (bottom) = -4
 *
 * Above line 5 (+4):
 * +5 is space above line 5 (no ledger line)
 * +6 is line 6 (1 ledger line)
 * +7 is space above line 6 (1 ledger line through line 6)
 * +8 is line 7 (2 ledger lines)
 *
 * Below line 1 (-4):
 * -5 is space below line 1 (no ledger line)
 * -6 is 1 ledger line below (e.g. C4 in treble clef: B4 is 0, A4 is -1, G4 is -2, F4 is -3, E4 is -4, D4 is -5, C4 is -6!)
 * -7 is space below ledger line 1 (1 ledger line)
 * -8 is 2 ledger lines below
 */
export function getLedgerLineOffsets(stepOffset: number): number[] {
  const ledgers: number[] = [];
  if (stepOffset >= 6) {
    for (let s = 6; s <= stepOffset; s += 2) {
      ledgers.push(s);
    }
  } else if (stepOffset <= -6) {
    for (let s = -6; s >= stepOffset; s -= 2) {
      ledgers.push(s);
    }
  }
  return ledgers;
}

export function formatPitchName(pitch: Pitch, keySignatureId = 'C_major'): string {
  const keyInfo = KEY_SIGNATURES[keySignatureId] || KEY_SIGNATURES['C_major'];
  let accStr = '';
  const accidental = pitch.accidental ?? keyInfo.alteredNotes[pitch.step];
  if (accidental === 'sharp') accStr = '♯';
  else if (accidental === 'flat') accStr = '♭';
  else if (accidental === 'natural') accStr = '♮';
  else if (accidental === 'double_sharp') accStr = '𝄪';
  else if (accidental === 'double_flat') accStr = '𝄫';

  return `${pitch.step}${accStr}${pitch.octave}`;
}

export function getNoteSolfege(step: NoteStep, accidental?: AccidentalType | null): string {
  const map: Record<NoteStep, string> = {
    C: 'Do',
    D: 'Re',
    E: 'Mi',
    F: 'Fa',
    G: 'Sol',
    A: 'La',
    B: 'Ti',
  };
  const base = map[step] || step;
  if (!accidental || accidental === 'natural') return base;
  if (accidental === 'sharp') return `${base}♯`;
  if (accidental === 'flat') return `${base}♭`;
  if (accidental === 'double_sharp') return `${base}𝄪`;
  if (accidental === 'double_flat') return `${base}𝄫`;
  return base;
}


export const COMMON_TIME_SIGNATURES: TimeSignature[] = [
  { numerator: 4, denominator: 4 },
  { numerator: 3, denominator: 4 },
  { numerator: 2, denominator: 4 },
  { numerator: 5, denominator: 4 },
  { numerator: 6, denominator: 8 },
  { numerator: 7, denominator: 8 },
  { numerator: 9, denominator: 8 },
  { numerator: 12, denominator: 8 },
];

export const CHORD_QUALITIES = [
  { label: 'Major', suffix: '', desc: 'Major Triad (1-3-5)' },
  { label: 'Minor', suffix: 'm', desc: 'Minor Triad (1-b3-5)' },
  { label: 'Dominant 7', suffix: '7', desc: 'Dominant 7th (1-3-5-b7)' },
  { label: 'Major 7', suffix: 'Maj7', desc: 'Major 7th (1-3-5-7)' },
  { label: 'Minor 7', suffix: 'm7', desc: 'Minor 7th (1-b3-5-b7)' },
  { label: 'Diminished', suffix: 'dim', desc: 'Diminished Triad (1-b3-b5)' },
  { label: 'Augmented', suffix: 'aug', desc: 'Augmented Triad (1-3-#5)' },
  { label: 'Suspended 2', suffix: 'sus2', desc: 'Suspended 2nd (1-2-5)' },
  { label: 'Suspended 4', suffix: 'sus4', desc: 'Suspended 4th (1-4-5)' },
  { label: 'Major 6', suffix: '6', desc: 'Major 6th (1-3-5-6)' },
  { label: 'Minor 6', suffix: 'm6', desc: 'Minor 6th (1-b3-5-6)' },
  { label: 'Dominant 9', suffix: '9', desc: 'Dominant 9th (1-3-5-b7-9)' },
  { label: 'Major 9', suffix: 'Maj9', desc: 'Major 9th (1-3-5-7-9)' },
  { label: 'Minor 9', suffix: 'm9', desc: 'Minor 9th (1-b3-5-b7-9)' },
  { label: 'Eleventh', suffix: '11', desc: '11th chord' },
  { label: 'Thirteenth', suffix: '13', desc: '13th chord' },
];

export const CHORD_ROOTS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
