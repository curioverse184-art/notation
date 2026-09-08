import React from 'react';
import { Score } from '../../types/score';
import {
  Sparkles,
  Binary,
  Type,
  Hash,
  Move,
  GraduationCap,
  Eye,
  EyeOff,
} from 'lucide-react';

interface LeftToolPaletteProps {
  score: Score;
  onUpdateLayout: (patch: Partial<Score['layoutSettings']>) => void;
}

export const LeftToolPalette: React.FC<LeftToolPaletteProps> = ({
  score,
  onUpdateLayout,
}) => {
  const { layoutSettings } = score;

  return (
    <div
      id="left-tool-palette"
      className="w-14 bg-white border-r border-stone-200/90 py-3 flex flex-col items-center justify-between z-10 select-none print:hidden shadow-2xs"
    >
      <div className="flex flex-col items-center space-y-3 w-full px-2">
        {/* Pianotastic Learning Mode Header */}
        <div className="w-full flex flex-col items-center pb-2 border-b border-stone-200">
          <div
            title="Pianotastic Learning Annotations"
            className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center mb-1"
          >
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="text-[9px] font-bold tracking-tighter uppercase text-stone-600">
            Learn
          </span>
        </div>

        {/* Master Annotation Toggle */}
        <button
          id="toggle-annotations-btn"
          onClick={() =>
            onUpdateLayout({ showAnnotations: !layoutSettings.showAnnotations })
          }
          title={`Learning Annotations: ${layoutSettings.showAnnotations ? 'ON' : 'OFF'}`}
          className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center transition-colors ${
            layoutSettings.showAnnotations
              ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Sparkles className="w-4 h-4 mb-0.5" />
          <span className="text-[8px] font-bold uppercase">All</span>
        </button>

        {/* Finger Numbers 1-5 */}
        <button
          id="toggle-fingering-btn"
          onClick={() =>
            onUpdateLayout({ showFingering: !layoutSettings.showFingering })
          }
          title={`Finger Numbers (1-5): ${layoutSettings.showFingering ? 'Visible' : 'Hidden'}`}
          className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center transition-colors ${
            layoutSettings.showFingering
              ? 'bg-stone-900 text-white font-bold'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <span className="font-serif text-sm font-bold leading-none mb-0.5">1-5</span>
          <span className="text-[8px] uppercase">Finger</span>
        </button>

        {/* Note Names (C4, D4...) */}
        <button
          id="toggle-note-names-btn"
          onClick={() =>
            onUpdateLayout({ showNoteNames: !layoutSettings.showNoteNames })
          }
          title={`Note Names (C, D, E...): ${layoutSettings.showNoteNames ? 'Visible' : 'Hidden'}`}
          className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center transition-colors ${
            layoutSettings.showNoteNames
              ? 'bg-blue-600 text-white font-bold'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <span className="font-mono text-xs font-bold leading-none mb-0.5">C-D</span>
          <span className="text-[8px] uppercase">Names</span>
        </button>

        <div className="w-8 border-t border-stone-200 my-1" />

        {/* Lyrics Visibility */}
        <button
          id="toggle-lyrics-btn"
          onClick={() =>
            onUpdateLayout({ showLyrics: !layoutSettings.showLyrics })
          }
          title={`Lyrics: ${layoutSettings.showLyrics ? 'Visible' : 'Hidden'}`}
          className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center transition-colors ${
            layoutSettings.showLyrics
              ? 'bg-stone-100 text-stone-900 font-bold'
              : 'text-stone-500 hover:bg-stone-100'
          }`}
        >
          <Type className="w-4 h-4 mb-0.5" />
          <span className="text-[8px] uppercase">Lyrics</span>
        </button>

        {/* Chord Symbols Visibility */}
        <button
          id="toggle-chords-btn"
          onClick={() =>
            onUpdateLayout({ showChordSymbols: !layoutSettings.showChordSymbols })
          }
          title={`Chord Symbols: ${layoutSettings.showChordSymbols ? 'Visible' : 'Hidden'}`}
          className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center transition-colors ${
            layoutSettings.showChordSymbols
              ? 'bg-stone-100 text-stone-900 font-bold'
              : 'text-stone-500 hover:bg-stone-100'
          }`}
        >
          <span className="font-sans text-xs font-bold leading-none mb-0.5">C7</span>
          <span className="text-[8px] uppercase">Chords</span>
        </button>

        {/* Measure Numbers Visibility */}
        <button
          id="toggle-measure-numbers-btn"
          onClick={() =>
            onUpdateLayout({ showMeasureNumbers: !layoutSettings.showMeasureNumbers })
          }
          title={`Measure Numbers: ${layoutSettings.showMeasureNumbers ? 'Visible' : 'Hidden'}`}
          className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center transition-colors ${
            layoutSettings.showMeasureNumbers
              ? 'bg-stone-100 text-stone-900 font-bold'
              : 'text-stone-500 hover:bg-stone-100'
          }`}
        >
          <Hash className="w-4 h-4 mb-0.5" />
          <span className="text-[8px] uppercase">Bars</span>
        </button>
      </div>

      {/* Bottom: Layout Mode Switch (Auto vs Manual) */}
      <div className="flex flex-col items-center px-2 w-full pt-2 border-t border-stone-200">
        <button
          id="toggle-layout-mode-btn"
          onClick={() =>
            onUpdateLayout({
              layoutMode: layoutSettings.layoutMode === 'auto' ? 'manual' : 'auto',
            })
          }
          title={`Layout Mode: ${layoutSettings.layoutMode === 'auto' ? 'Automatic (Flow)' : 'Manual (Adjustable Handles)'}`}
          className={`w-10 h-11 rounded-lg flex flex-col items-center justify-center transition-colors ${
            layoutSettings.layoutMode === 'manual'
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          <Move className="w-3.5 h-3.5 mb-0.5" />
          <span className="text-[8px] uppercase font-semibold">
            {layoutSettings.layoutMode === 'manual' ? 'Manual' : 'Auto'}
          </span>
        </button>
      </div>
    </div>
  );
};
