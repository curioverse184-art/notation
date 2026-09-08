import React from 'react';
import { ToolMode, NoteDuration, AccidentalType, Hand } from '../../types/score';
import {
  MousePointer,
  Music,
  Minus,
  Eraser,
  Link,
  Layers,
  Type,
  AlignLeft,
  Sparkles,
  Repeat,
} from 'lucide-react';

interface MainToolbarProps {
  toolMode: ToolMode;
  onSetToolMode: (mode: ToolMode) => void;
  selectedDuration: NoteDuration;
  onSetDuration: (dur: NoteDuration) => void;
  isDotted: boolean;
  onToggleDotted: () => void;
  selectedAccidental: AccidentalType | null;
  onSetAccidental: (acc: AccidentalType | null) => void;
  activeHand: Hand;
  onSetHand: (hand: Hand) => void;
}

export const MainToolbar: React.FC<MainToolbarProps> = ({
  toolMode,
  onSetToolMode,
  selectedDuration,
  onSetDuration,
  isDotted,
  onToggleDotted,
  selectedAccidental,
  onSetAccidental,
  activeHand,
  onSetHand,
}) => {
  const tools: { id: ToolMode; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: 'select', label: 'Select', icon: <MousePointer className="w-3.5 h-3.5" />, shortcut: 'V' },
    { id: 'note', label: 'Note', icon: <Music className="w-3.5 h-3.5" />, shortcut: 'N' },
    { id: 'rest', label: 'Rest', icon: <Minus className="w-3.5 h-3.5" />, shortcut: 'R' },
    { id: 'eraser', label: 'Eraser', icon: <Eraser className="w-3.5 h-3.5" />, shortcut: 'Del' },
    { id: 'tie', label: 'Tie', icon: <Link className="w-3.5 h-3.5" />, shortcut: 'T' },
    { id: 'chord', label: 'Chord', icon: <Layers className="w-3.5 h-3.5" />, shortcut: 'K' },
    { id: 'lyrics', label: 'Lyrics', icon: <Type className="w-3.5 h-3.5" />, shortcut: 'L' },
    { id: 'chord_symbol', label: 'Chord Symbol', icon: <Sparkles className="w-3.5 h-3.5" />, shortcut: 'C' },
    { id: 'navigation', label: 'Navigation', icon: <Repeat className="w-3.5 h-3.5" />, shortcut: 'G' },
  ];

  const durations: { id: NoteDuration; label: string; symbol: string; num: string }[] = [
    { id: 'whole', label: 'Whole Note', symbol: '𝅝', num: '1' },
    { id: 'half', label: 'Half Note', symbol: '𝅗𝅥', num: '2' },
    { id: 'quarter', label: 'Quarter Note', symbol: '𝅘𝅥', num: '3' },
    { id: 'eighth', label: 'Eighth Note', symbol: '𝅘𝅥𝅮', num: '4' },
    { id: 'sixteenth', label: '16th Note', symbol: '𝅘𝅥𝅯', num: '5' },
    { id: 'thirty_second', label: '32nd Note', symbol: '𝅘𝅥𝅰', num: '6' },
  ];

  const accidentals: { id: AccidentalType | null; label: string; glyph: string }[] = [
    { id: null, label: 'Auto / None', glyph: '–' },
    { id: 'natural', label: 'Natural', glyph: '♮' },
    { id: 'sharp', label: 'Sharp', glyph: '♯' },
    { id: 'flat', label: 'Flat', glyph: '♭' },
    { id: 'double_sharp', label: 'Double Sharp', glyph: '𝄪' },
    { id: 'double_flat', label: 'Double Flat', glyph: '𝄫' },
  ];

  return (
    <div
      id="main-toolbar"
      className="w-full bg-stone-50 border-b border-stone-200/80 px-4 py-1.5 flex flex-wrap items-center justify-between gap-3 text-xs z-20 select-none print:hidden"
    >
      {/* Tool Palette Selector */}
      <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-stone-200 shadow-2xs">
        {tools.map((t) => (
          <button
            key={t.id}
            id={`tool-${t.id}`}
            onClick={() => onSetToolMode(t.id)}
            title={`${t.label} (${t.shortcut})`}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md transition-colors ${
              toolMode === t.id
                ? 'bg-stone-900 text-white shadow-xs font-semibold'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            {t.icon}
            <span className="font-medium">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Note Duration Selector */}
      <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-stone-200 shadow-2xs">
        <span className="text-[10px] uppercase font-bold text-stone-600 px-1.5">Value</span>
        {durations.map((d) => (
          <button
            key={d.id}
            id={`duration-${d.id}`}
            onClick={() => onSetDuration(d.id)}
            title={`${d.label} (Press ${d.num})`}
            className={`w-8 h-7 flex items-center justify-center rounded-md text-base leading-none transition-colors ${
              selectedDuration === d.id
                ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                : 'text-stone-800 hover:bg-stone-100'
            }`}
          >
            <span>{d.symbol}</span>
          </button>
        ))}

        {/* Dot Toggle */}
        <button
          id="dot-toggle-btn"
          onClick={onToggleDotted}
          title="Dotted Note (Press .)"
          className={`px-2 h-7 flex items-center justify-center rounded-md text-sm font-bold transition-colors ${
            isDotted
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : 'text-stone-700 hover:bg-stone-100'
          }`}
        >
          • Dot
        </button>
      </div>

      {/* Accidentals Toolbar */}
      <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-stone-200 shadow-2xs">
        <span className="text-[10px] uppercase font-bold text-stone-600 px-1.5">Accidental</span>
        {accidentals.map((acc) => (
          <button
            key={acc.id || 'none'}
            id={`accidental-${acc.id || 'none'}`}
            onClick={() => onSetAccidental(acc.id)}
            title={acc.label}
            className={`w-7 h-7 flex items-center justify-center rounded-md font-serif text-sm transition-colors ${
              selectedAccidental === acc.id
                ? 'bg-stone-900 text-white font-bold'
                : 'text-stone-800 hover:bg-stone-100'
            }`}
          >
            {acc.glyph}
          </button>
        ))}
      </div>

      {/* Hand Input Selector (RH / LH / Both for Piano Teachers) */}
      <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-stone-200 shadow-2xs">
        <span className="text-[10px] uppercase font-bold text-stone-600 px-1.5">Hand</span>
        {(['RH', 'LH', 'Both'] as Hand[]).map((hand) => (
          <button
            key={hand}
            id={`hand-mode-${hand.toLowerCase()}`}
            onClick={() => onSetHand(hand)}
            className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
              activeHand === hand
                ? 'bg-stone-900 text-white'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            {hand === 'RH' ? 'Right (Treble)' : hand === 'LH' ? 'Left (Bass)' : 'Both'}
          </button>
        ))}
      </div>
    </div>
  );
};
