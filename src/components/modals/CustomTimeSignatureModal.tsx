import React, { useState } from 'react';
import { TimeSignature } from '../../types/score';
import { X, Check } from 'lucide-react';

interface CustomTimeSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (ts: TimeSignature, applyToEntireScore: boolean) => void;
  currentTs: TimeSignature;
}

export const CustomTimeSignatureModal: React.FC<CustomTimeSignatureModalProps> = ({
  isOpen,
  onClose,
  onApply,
  currentTs,
}) => {
  const [numerator, setNumerator] = useState(currentTs.numerator);
  const [denominator, setDenominator] = useState(currentTs.denominator);
  const [applyToAll, setApplyToAll] = useState(true);

  if (!isOpen) return null;

  const capacityQuarterNotes = (numerator * 4) / denominator;

  const handleApply = () => {
    onApply(
      {
        numerator: Math.max(1, Math.min(32, numerator)),
        denominator: [2, 4, 8, 16, 32].includes(denominator) ? denominator : 4,
      },
      applyToAll
    );
    onClose();
  };

  const presetExamples = [
    { n: 2, d: 4, name: '2/4 March' },
    { n: 3, d: 4, name: '3/4 Waltz' },
    { n: 4, d: 4, name: '4/4 Common' },
    { n: 5, d: 4, name: '5/4 Dave Brubeck' },
    { n: 6, d: 8, name: '6/8 Compound' },
    { n: 7, d: 8, name: '7/8 Balkan / Bartók' },
    { n: 9, d: 8, name: '9/8 Compound' },
    { n: 11, d: 8, name: '11/8 Progressive' },
    { n: 12, d: 8, name: '12/8 Blues / Slow Rock' },
    { n: 12, d: 16, name: '12/16 Fast Compound' },
  ];

  return (
    <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900 font-serif">
              Time Signature
            </h3>
            <p className="text-xs text-stone-500">
              Set standard or custom meter with automatic beat calculation
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Visual Fraction Preview */}
          <div className="flex items-center justify-center space-x-6 p-4 bg-stone-50 rounded-lg border border-stone-100">
            <div className="flex flex-col items-center justify-center bg-white border border-stone-200 shadow-2xs rounded-lg px-5 py-3">
              <span className="font-serif text-3xl font-bold text-stone-900 leading-none">
                {numerator}
              </span>
              <div className="w-8 border-b-2 border-stone-800 my-1" />
              <span className="font-serif text-3xl font-bold text-stone-900 leading-none">
                {denominator}
              </span>
            </div>
            <div className="text-xs text-stone-600 space-y-1">
              <div>
                <span className="font-semibold text-stone-800">Capacity: </span>
                <span>{capacityQuarterNotes} quarter beats</span>
              </div>
              <div>
                <span className="font-semibold text-stone-800">Beat Value: </span>
                <span>1/{denominator} note</span>
              </div>
              <div className="text-[11px] text-amber-800 font-medium">
                {numerator % 3 === 0 && denominator === 8
                  ? 'Compound meter (grouped in 3s)'
                  : 'Simple meter'}
              </div>
            </div>
          </div>

          {/* Numerator & Denominator Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Beats Per Measure (Numerator)
              </label>
              <input
                type="number"
                min="1"
                max="32"
                value={numerator}
                onChange={(e) => setNumerator(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-base font-bold text-center focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Beat Unit (Denominator)
              </label>
              <select
                value={denominator}
                onChange={(e) => setDenominator(parseInt(e.target.value) || 4)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-base font-bold text-center focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value={2}>2 (Half note)</option>
                <option value={4}>4 (Quarter note)</option>
                <option value={8}>8 (Eighth note)</option>
                <option value={16}>16 (16th note)</option>
                <option value={32}>32 (32nd note)</option>
              </select>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Common & Complex Meter Presets
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {presetExamples.map((p) => (
                <button
                  key={`${p.n}_${p.d}`}
                  type="button"
                  onClick={() => {
                    setNumerator(p.n);
                    setDenominator(p.d);
                  }}
                  className={`px-2 py-1.5 rounded-md border text-xs font-mono font-semibold transition-colors ${
                    numerator === p.n && denominator === p.d
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                  title={p.name}
                >
                  {p.n}/{p.d}
                </button>
              ))}
            </div>
          </div>

          {/* Scope Checkbox */}
          <div className="pt-2 border-t border-stone-100">
            <label className="flex items-center space-x-2 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
                className="rounded border-stone-300 text-stone-900 focus:ring-amber-500"
              />
              <span>Apply to entire score (otherwise only selected measure)</span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
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
            <span>Apply Time Signature</span>
          </button>
        </div>
      </div>
    </div>
  );
};
