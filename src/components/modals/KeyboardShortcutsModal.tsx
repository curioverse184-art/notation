import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { category: 'Tools & Modes', items: [
      { key: 'V', desc: 'Select tool' },
      { key: 'N', desc: 'Note entry tool' },
      { key: 'R', desc: 'Rest entry tool' },
      { key: 'L', desc: 'Lyrics entry tool' },
      { key: 'C', desc: 'Chord symbol tool' },
      { key: 'Del / Backspace', desc: 'Delete selected note, rest, or chord' },
    ]},
    { category: 'Note Durations', items: [
      { key: '1', desc: 'Whole note (𝅝)' },
      { key: '2', desc: 'Half note (𝅗𝅥)' },
      { key: '3', desc: 'Quarter note (𝅘𝅥)' },
      { key: '4', desc: 'Eighth note (𝅘𝅥𝅮)' },
      { key: '5', desc: 'Sixteenth note (𝅘𝅥𝅯)' },
      { key: '6', desc: 'Thirty-second note (𝅘𝅥𝅰)' },
      { key: '.', desc: 'Toggle dotted note' },
    ]},
    { category: 'Note Pitch Entry (Computer Keyboard)', items: [
      { key: 'A, B, C, D, E, F, G', desc: 'Insert note with specified letter pitch' },
      { key: '↑ / ↓ Arrow', desc: 'Transpose selected note up or down by step' },
      { key: '← / → Arrow', desc: 'Navigate to previous / next note' },
    ]},
    { category: 'Lyrics Mode', items: [
      { key: 'Type text', desc: 'Enter syllable for current note' },
      { key: 'Space', desc: 'Advance to next note' },
      { key: '-', desc: 'Add hyphen syllable separator and advance' },
      { key: '_', desc: 'Add melisma extender line' },
    ]},
    { category: 'General & Playback', items: [
      { key: 'Space', desc: 'Play / Stop playback (when not typing lyrics)' },
      { key: 'Ctrl + Z', desc: 'Undo' },
      { key: 'Ctrl + Y / Ctrl+Shift+Z', desc: 'Redo' },
      { key: 'Ctrl + P', desc: 'Print score / Export clean PDF' },
    ]},
  ];

  return (
    <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-stone-100 rounded-lg text-stone-800">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-serif">
                Keyboard Shortcuts
              </h3>
              <p className="text-xs text-stone-500">
                Pianotastic notation input & editing shortcuts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {shortcuts.map((group) => (
            <div key={group.category} className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                {group.category}
              </h4>
              <div className="bg-stone-50 rounded-lg p-2.5 border border-stone-200/80 space-y-1.5">
                {group.items.map((item) => (
                  <div key={item.key} className="flex items-center justify-between text-xs">
                    <span className="text-stone-700">{item.desc}</span>
                    <kbd className="px-2 py-0.5 bg-white border border-stone-300 rounded font-mono font-semibold text-stone-800 shadow-2xs text-[11px]">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3.5 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
