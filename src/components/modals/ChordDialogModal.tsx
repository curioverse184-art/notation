import React, { useState, useMemo } from 'react';
import { CHORD_ROOTS, CHORD_QUALITIES } from '../../utils/musicTheory';
import { X, Check, Search } from 'lucide-react';

interface ChordDialogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertChord: (chord: { root: string; quality: string; bass?: string; formatted: string }) => void;
  initialRoot?: string;
  initialQuality?: string;
  initialBass?: string;
}

export const ChordDialogModal: React.FC<ChordDialogModalProps> = ({
  isOpen,
  onClose,
  onInsertChord,
  initialRoot = 'C',
  initialQuality = 'Major',
  initialBass = '',
}) => {
  const [root, setRoot] = useState(initialRoot);
  const [qualitySuffix, setQualitySuffix] = useState('');
  const [qualityLabel, setQualityLabel] = useState(initialQuality);
  const [bass, setBass] = useState(initialBass);
  const [manualText, setManualText] = useState('');

  // Formatted chord string
  const formattedChord = useMemo(() => {
    if (manualText.trim()) {
      return manualText.trim();
    }
    const base = `${root}${qualitySuffix}`;
    return bass && bass !== root ? `${base}/${bass}` : base;
  }, [root, qualitySuffix, bass, manualText]);

  // Autocomplete library suggestions based on manual text
  const autocompleteSuggestions = useMemo(() => {
    if (!manualText.trim()) return [];
    const query = manualText.trim().toLowerCase();
    const suggestions: string[] = [];

    CHORD_ROOTS.forEach((r) => {
      CHORD_QUALITIES.forEach((q) => {
        const chordStr = `${r}${q.suffix}`;
        if (chordStr.toLowerCase().startsWith(query)) {
          suggestions.push(chordStr);
        }
      });
    });

    return suggestions.slice(0, 8);
  }, [manualText]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (!formattedChord) return;
    onInsertChord({
      root,
      quality: qualityLabel,
      bass: bass || undefined,
      formatted: formattedChord,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900 font-serif">
              Add Chord Symbol
            </h3>
            <p className="text-xs text-stone-500">
              Select root, chord quality, and slash bass note or type directly
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Chord Symbol Preview Box */}
          <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-600 block">
                Chord Preview
              </span>
              <div className="font-sans text-3xl font-bold text-stone-900 tracking-tight">
                {formattedChord || '—'}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full">
                {qualityLabel}
              </span>
              {bass && bass !== root && (
                <span className="block text-[11px] text-stone-600 mt-1 font-mono">
                  Bass note: {bass}
                </span>
              )}
            </div>
          </div>

          {/* Manual Input with Autocomplete */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Manual Chord Input / Search
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Cmaj7, G/B, F#m7b5, Dsus4"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              {manualText && (
                <button
                  onClick={() => setManualText('')}
                  className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>
            {autocompleteSuggestions.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {autocompleteSuggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setManualText(sug)}
                    className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-xs font-mono font-medium"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 1. Root Note */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              1. Root Note
            </label>
            <div className="grid grid-cols-7 gap-1">
              {CHORD_ROOTS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRoot(r);
                    setManualText('');
                  }}
                  className={`py-1.5 rounded-md border text-xs font-bold transition-colors ${
                    root === r && !manualText
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-800 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Chord Quality */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              2. Quality / Extension
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {CHORD_QUALITIES.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => {
                    setQualitySuffix(q.suffix);
                    setQualityLabel(q.label);
                    setManualText('');
                  }}
                  className={`px-2 py-1.5 rounded-md border text-left text-xs transition-colors flex flex-col ${
                    qualitySuffix === q.suffix && !manualText
                      ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <span className="font-bold">{root}{q.suffix}</span>
                  <span className="text-[10px] text-stone-600 font-normal leading-tight">
                    {q.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Slash Bass Note (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-stone-700">
                3. Alternate Bass Note (Slash Chord)
              </label>
              {bass && (
                <button
                  type="button"
                  onClick={() => setBass('')}
                  className="text-[11px] text-amber-700 hover:underline"
                >
                  Clear Bass
                </button>
              )}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {CHORD_ROOTS.map((b) => (
                <button
                  key={`bass_${b}`}
                  type="button"
                  onClick={() => {
                    setBass(b === bass ? '' : b);
                    setManualText('');
                  }}
                  className={`py-1 rounded-md border text-xs font-medium transition-colors ${
                    bass === b && !manualText
                      ? 'bg-amber-600 text-white border-amber-600 font-bold'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  /{b}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-stone-50 border-t border-stone-200 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-200/70"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-2 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 flex items-center space-x-1.5 shadow-xs"
          >
            <Check className="w-4 h-4" />
            <span>Place Chord Symbol</span>
          </button>
        </div>
      </div>
    </div>
  );
};
