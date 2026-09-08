import React from 'react';
import {
  Score,
  Measure,
  SelectionState,
  NoteEvent,
  NoteDuration,
  AccidentalType,
  TimeSignature,
  NavigationJump,
  NavigationTarget,
  VoltaEnding,
  TempoBeatUnit,
  ArticulationType,
  LearningLayerSettings,
  DEFAULT_LEARNING_LAYER,
} from '../../types/score';
import { KEY_SIGNATURES, validateMeasureEvents, formatPitchName } from '../../utils/musicTheory';
import { calculatePlaybackRoute } from '../../utils/navigationEngine';
import {
  Settings,
  Music,
  PlusCircle,
  Trash2,
  Copy,
  RotateCcw,
  Sliders,
  Type,
  ChevronRight,
  Sparkles,
  Maximize2,
  Repeat,
  CheckCircle2,
  AlertCircle,
  Flag,
  GraduationCap,
  BookOpen,
} from 'lucide-react';

interface PropertiesPanelProps {
  score: Score;
  selection: SelectionState;
  onUpdateScoreMetadata: (patch: Partial<Score['metadata']>) => void;
  onUpdateLayout: (patch: Partial<Score['layoutSettings']>) => void;
  onUpdateLearningLayer?: (patch: Partial<LearningLayerSettings>) => void;
  onUpdateMeasure: (measureId: string, patch: Partial<Measure>) => void;
  onUpdateEvent: (
    measureId: string,
    staff: 'RH' | 'LH',
    eventId: string,
    patch: Partial<NoteEvent>
  ) => void;
  onAddMeasure: () => void;
  onInsertMeasureBefore: (measureId: string) => void;
  onInsertMeasureAfter: (measureId: string) => void;
  onDuplicateMeasure: (measureId: string) => void;
  onDeleteMeasure: (measureId: string) => void;
  onClearMeasure: (measureId: string) => void;
  onOpenCustomTimeSignature: () => void;
  onOpenChordDialog: () => void;
  onResetLayout: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  score,
  selection,
  onUpdateScoreMetadata,
  onUpdateLayout,
  onUpdateLearningLayer,
  onUpdateMeasure,
  onUpdateEvent,
  onAddMeasure,
  onInsertMeasureBefore,
  onInsertMeasureAfter,
  onDuplicateMeasure,
  onDeleteMeasure,
  onClearMeasure,
  onOpenCustomTimeSignature,
  onOpenChordDialog,
  onResetLayout,
}) => {
  const selectedMeasure = score.measures.find((m) => m.id === selection.measureId);

  // Find selected event if any
  let selectedEvent: NoteEvent | null = null;
  if (selectedMeasure && selection.staff && selection.eventId) {
    const list = selection.staff === 'RH' ? selectedMeasure.rhEvents : selectedMeasure.lhEvents;
    selectedEvent = list.find((e) => e.id === selection.eventId) || null;
  }

  const ts = selectedMeasure?.timeSignature || score.metadata.initialTimeSignature;
  const rhValidation = selectedMeasure ? validateMeasureEvents(selectedMeasure.rhEvents, ts) : null;
  const lhValidation = selectedMeasure ? validateMeasureEvents(selectedMeasure.lhEvents, ts) : null;

  return (
    <aside
      id="properties-panel"
      className="w-72 bg-white border-l border-stone-200/90 flex flex-col h-full overflow-y-auto text-xs text-stone-800 z-10 select-none print:hidden shadow-xs"
    >
      {/* Panel Header */}
      <div className="p-3.5 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-stone-700" />
          <span className="font-serif font-bold text-sm text-stone-900">Score & Inspector</span>
        </div>
      </div>

      <div className="p-3.5 space-y-4">
        {/* SECTION 1: Key Signature Tool (Full 15 Major & Minor Keys) */}
        <div className="space-y-1.5 bg-stone-50/60 p-2.5 rounded-lg border border-stone-200/70">
          <div className="flex items-center justify-between">
            <label className="font-bold text-stone-800">Key Signature</label>
            <span className="text-[10px] text-stone-500 font-mono">
              {KEY_SIGNATURES[score.metadata.initialKeySignature]?.fifths !== 0
                ? `${Math.abs(KEY_SIGNATURES[score.metadata.initialKeySignature]?.fifths)} ${KEY_SIGNATURES[score.metadata.initialKeySignature]?.fifths > 0 ? 'sharps' : 'flats'}`
                : 'Natural'}
            </span>
          </div>
          <select
            id="key-signature-select"
            value={score.metadata.initialKeySignature}
            onChange={(e) => onUpdateScoreMetadata({ initialKeySignature: e.target.value })}
            className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-md font-medium text-xs text-stone-900 focus:ring-2 focus:ring-amber-500"
          >
            <optgroup label="Major Keys">
              <option value="C_major">C major (0 sharps/flats)</option>
              <option value="G_major">G major (1 sharp: F♯)</option>
              <option value="D_major">D major (2 sharps: F♯, C♯)</option>
              <option value="A_major">A major (3 sharps: F♯, C♯, G♯)</option>
              <option value="E_major">E major (4 sharps: F♯, C♯, G♯, D♯)</option>
              <option value="B_major">B major (5 sharps: F♯, C♯, G♯, D♯, A♯)</option>
              <option value="F#_major">F♯ major (6 sharps)</option>
              <option value="C#_major">C♯ major (7 sharps)</option>
              <option value="F_major">F major (1 flat: B♭)</option>
              <option value="Bb_major">B♭ major (2 flats: B♭, E♭)</option>
              <option value="Eb_major">E♭ major (3 flats: B♭, E♭, A♭)</option>
              <option value="Ab_major">A♭ major (4 flats: B♭, E♭, A♭, D♭)</option>
              <option value="Db_major">D♭ major (5 flats: B♭, E♭, A♭, D♭, G♭)</option>
              <option value="Gb_major">G♭ major (6 flats)</option>
              <option value="Cb_major">C♭ major (7 flats)</option>
            </optgroup>
            <optgroup label="Relative Minor Keys">
              <option value="A_minor">A minor (relative to C)</option>
              <option value="E_minor">E minor (1 sharp)</option>
              <option value="B_minor">B minor (2 sharps)</option>
              <option value="D_minor">D minor (1 flat)</option>
              <option value="G_minor">G minor (2 flats)</option>
              <option value="C_minor">C minor (3 flats)</option>
            </optgroup>
          </select>
        </div>

        {/* SECTION 2: Time Signature & Custom Meter */}
        <div className="space-y-1.5 bg-stone-50/60 p-2.5 rounded-lg border border-stone-200/70">
          <div className="flex items-center justify-between">
            <label className="font-bold text-stone-800">Time Signature</label>
            <button
              onClick={onOpenCustomTimeSignature}
              className="text-[11px] text-amber-800 font-semibold hover:underline"
            >
              Custom...
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenCustomTimeSignature}
              className="flex-1 py-1.5 px-3 bg-white border border-stone-300 rounded-md text-center font-bold text-sm text-stone-900 hover:bg-stone-100 flex items-center justify-between"
            >
              <span>Current:</span>
              <span className="font-serif text-base">
                {score.metadata.initialTimeSignature.numerator}/
                {score.metadata.initialTimeSignature.denominator}
              </span>
            </button>
          </div>
        </div>

        {/* SECTION 3: Selected Event Inspector (Note, Rest, Lyrics, Fingering) */}
        {selectedEvent && selectedMeasure && selection.staff && (
          <div className="space-y-3 bg-amber-50/40 p-3 rounded-lg border border-amber-200/80">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-1.5">
              <span className="font-bold text-amber-950 uppercase text-[10px] tracking-wider">
                Selected {selectedEvent.type === 'note' ? 'Note' : 'Rest'}
              </span>
              <span className="text-[10px] font-mono text-amber-900">
                Staff: {selection.staff}
              </span>
            </div>

            {/* Note pitch display */}
            {selectedEvent.type === 'note' && selectedEvent.pitches.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-stone-600">Pitch:</span>
                <span className="font-serif font-bold text-base text-stone-900">
                  {selectedEvent.pitches
                    .map((p) => formatPitchName(p, score.metadata.initialKeySignature))
                    .join(' - ')}
                </span>
              </div>
            )}

            {/* Duration Selector for Selected Event */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">Duration</label>
              <div className="grid grid-cols-6 gap-1">
                {(['whole', 'half', 'quarter', 'eighth', 'sixteenth', 'thirty_second'] as NoteDuration[]).map(
                  (dur) => (
                    <button
                      key={dur}
                      onClick={() =>
                        onUpdateEvent(selectedMeasure.id, selection.staff!, selectedEvent!.id, {
                          duration: dur,
                        })
                      }
                      className={`py-1 rounded text-center font-serif text-sm ${
                        selectedEvent!.duration === dur
                          ? 'bg-stone-900 text-white font-bold'
                          : 'bg-white border border-stone-200 text-stone-800 hover:bg-stone-100'
                      }`}
                    >
                      {dur === 'whole' ? '𝅝' : dur === 'half' ? '𝅗𝅥' : dur === 'quarter' ? '𝅘𝅥' : dur === 'eighth' ? '𝅘𝅥𝅮' : dur === 'sixteenth' ? '𝅘𝅥𝅯' : '𝅘𝅥𝅰'}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Dotted Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-stone-700">Dotted:</span>
              <button
                onClick={() =>
                  onUpdateEvent(selectedMeasure.id, selection.staff!, selectedEvent!.id, {
                    isDotted: !selectedEvent!.isDotted,
                  })
                }
                className={`px-3 py-1 rounded text-xs font-semibold ${
                  selectedEvent.isDotted
                    ? 'bg-amber-600 text-white'
                    : 'bg-white border border-stone-300 text-stone-700'
                }`}
              >
                {selectedEvent.isDotted ? '• Dotted ON' : 'Off'}
              </button>
            </div>

            {/* Accidental Toggle */}
            {selectedEvent.type === 'note' && (
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Accidental</label>
                <div className="grid grid-cols-5 gap-1 text-center font-serif">
                  {(['natural', 'sharp', 'flat', 'double_sharp', 'double_flat'] as AccidentalType[]).map(
                    (acc) => {
                      const hasAcc = selectedEvent!.pitches[0]?.accidental === acc;
                      return (
                        <button
                          key={acc}
                          onClick={() => {
                            const updatedPitches = selectedEvent!.pitches.map((p) => ({
                              ...p,
                              accidental: hasAcc ? null : acc,
                            }));
                            onUpdateEvent(
                              selectedMeasure.id,
                              selection.staff!,
                              selectedEvent!.id,
                              { pitches: updatedPitches }
                            );
                          }}
                          className={`py-1 rounded border text-sm ${
                            hasAcc
                              ? 'bg-stone-900 text-white font-bold border-stone-900'
                              : 'bg-white border-stone-200 text-stone-800 hover:bg-stone-100'
                          }`}
                        >
                          {acc === 'natural' ? '♮' : acc === 'sharp' ? '♯' : acc === 'flat' ? '♭' : acc === 'double_sharp' ? '𝄪' : '𝄫'}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* Pianotastic Fingering (1 to 5) */}
            {selectedEvent.type === 'note' && (
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Piano Fingering (1 to 5)
                </label>
                <div className="grid grid-cols-5 gap-1 font-serif">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() =>
                        onUpdateEvent(selectedMeasure.id, selection.staff!, selectedEvent!.id, {
                          fingerNumber: selectedEvent!.fingerNumber === num ? undefined : num,
                        })
                      }
                      className={`py-1 rounded border font-bold text-xs ${
                        selectedEvent!.fingerNumber === num
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Lyric Syllable */}
            {selectedEvent.type === 'note' && (
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-stone-700">Lyric Syllable</label>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="text"
                    placeholder="e.g. Tra-, la, la"
                    value={selectedEvent.lyricSyllable || ''}
                    onChange={(e) =>
                      onUpdateEvent(selectedMeasure.id, selection.staff!, selectedEvent!.id, {
                        lyricSyllable: e.target.value,
                      })
                    }
                    className="flex-1 px-2 py-1 border border-stone-300 rounded bg-white text-xs focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    onClick={() =>
                      onUpdateEvent(selectedMeasure.id, selection.staff!, selectedEvent!.id, {
                        lyricHyphen: !selectedEvent!.lyricHyphen,
                      })
                    }
                    title="Toggle Syllable Hyphen (-)"
                    className={`px-2 py-1 rounded text-xs font-bold border ${
                      selectedEvent.lyricHyphen
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white border-stone-300 text-stone-700'
                    }`}
                  >
                    -
                  </button>
                </div>
              </div>
            )}

            {/* Hand Allocation */}
            {selectedEvent.type === 'note' && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-700">Staff / Hand:</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() =>
                      onUpdateEvent(selectedMeasure.id, selection.staff!, selectedEvent!.id, {
                        hand: 'RH',
                      })
                    }
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      (selectedEvent.hand || selection.staff) === 'RH'
                        ? 'bg-amber-600 text-white'
                        : 'bg-white border border-stone-200 text-stone-700'
                    }`}
                  >
                    RH
                  </button>
                  <button
                    onClick={() =>
                      onUpdateEvent(selectedMeasure.id, selection.staff!, selectedEvent!.id, {
                        hand: 'LH',
                      })
                    }
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      (selectedEvent.hand || selection.staff) === 'LH'
                        ? 'bg-amber-600 text-white'
                        : 'bg-white border border-stone-200 text-stone-700'
                    }`}
                  >
                    LH
                  </button>
                </div>
              </div>
            )}

            {/* Articulation Selector */}
            {selectedEvent.type === 'note' && (
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Articulation</label>
                <div className="grid grid-cols-5 gap-1 text-center font-serif text-xs">
                  {[
                    { type: 'none', label: 'None' },
                    { type: 'staccato', label: '• Stacc' },
                    { type: 'accent', label: '> Acc' },
                    { type: 'tenuto', label: '— Ten' },
                    { type: 'fermata', label: '𝄐 Ferm' },
                  ].map((item) => (
                    <button
                      key={item.type}
                      onClick={() =>
                        onUpdateEvent(selectedMeasure.id, selection.staff!, selectedEvent!.id, {
                          articulation: item.type as ArticulationType,
                        })
                      }
                      className={`py-1 rounded border ${
                        (selectedEvent!.articulation || 'none') === item.type
                          ? 'bg-amber-600 text-white font-bold border-amber-600'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Note-Level Teacher Note */}
            {selectedEvent.type === 'note' && (
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-stone-700">Teacher Note for Note</label>
                <input
                  type="text"
                  placeholder="e.g. Loose wrist, drop on beat"
                  value={selectedEvent.teacherNote || ''}
                  onChange={(e) =>
                    onUpdateEvent(selectedMeasure.id, selection.staff!, selectedEvent!.id, {
                      teacherNote: e.target.value,
                    })
                  }
                  className="w-full px-2 py-1 border border-stone-300 rounded bg-white text-xs text-stone-800 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            )}
          </div>
        )}

        {/* SECTION 4: Measure Inspector */}
        {selectedMeasure && (
          <div className="space-y-3 bg-stone-50/60 p-3 rounded-lg border border-stone-200/70">
            <div className="flex items-center justify-between border-b border-stone-200/70 pb-1.5">
              <span className="font-bold text-stone-900">
                Measure {selectedMeasure.measureNumber}
              </span>
              {/* Validation Status badge */}
              {rhValidation && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    rhValidation.isValid
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {rhValidation.isValid
                    ? 'Valid 4/4'
                    : `${rhValidation.totalBeats} / ${rhValidation.capacity} beats`}
                </span>
              )}
            </div>

            {/* Barline Type */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">Barline</label>
              <select
                value={selectedMeasure.barlineType}
                onChange={(e) =>
                  onUpdateMeasure(selectedMeasure.id, {
                    barlineType: e.target.value as any,
                    repeatEnd: e.target.value === 'repeat_end' || e.target.value === 'repeat_both',
                    repeatStart: e.target.value === 'repeat_start' || e.target.value === 'repeat_both',
                  })
                }
                className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded-md font-medium text-xs text-stone-800"
              >
                <option value="single">Single Barline</option>
                <option value="double">Double Barline</option>
                <option value="end">Final End Barline</option>
                <option value="repeat_start">Repeat Start (||:)</option>
                <option value="repeat_end">Repeat End (:||)</option>
                <option value="repeat_both">Repeat Both (:||:)</option>
              </select>
            </div>

            {/* Repeats & Navigation Box */}
            <div className="p-2.5 bg-white border border-stone-200 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800 flex items-center space-x-1">
                  <Repeat className="w-3.5 h-3.5 text-amber-600" />
                  <span>Repeat & Navigation</span>
                </span>
              </div>

              {/* Repeat Start & End Quick Buttons */}
              <div className="grid grid-cols-2 gap-1.5 font-mono">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateMeasure(selectedMeasure.id, {
                      repeatStart: !selectedMeasure.repeatStart,
                    })
                  }
                  className={`py-1 px-2 rounded border text-xs font-bold transition-colors ${
                    selectedMeasure.repeatStart
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-stone-50 border-stone-300 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  ||: Repeat Start
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateMeasure(selectedMeasure.id, {
                      repeatEnd: !selectedMeasure.repeatEnd,
                      repeatCount: !selectedMeasure.repeatEnd ? selectedMeasure.repeatCount || 2 : undefined,
                    })
                  }
                  className={`py-1 px-2 rounded border text-xs font-bold transition-colors ${
                    selectedMeasure.repeatEnd
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-stone-50 border-stone-300 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  :|| Repeat End
                </button>
              </div>

              {/* Repeat Count */}
              {selectedMeasure.repeatEnd && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-stone-600 font-medium">Passes:</span>
                  <div className="flex items-center space-x-1">
                    {[2, 3, 4].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => onUpdateMeasure(selectedMeasure.id, { repeatCount: cnt })}
                        className={`w-6 h-5 rounded text-[11px] font-bold border transition-colors ${
                          (selectedMeasure.repeatCount || 2) === cnt
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-stone-50 border-stone-300 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {cnt}x
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Volta Endings */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Volta (Alternate Ending)
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { val: undefined, label: 'None' },
                    { val: 1 as VoltaEnding, label: '1st' },
                    { val: 2 as VoltaEnding, label: '2nd' },
                    { val: 3 as VoltaEnding, label: '3rd' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => onUpdateMeasure(selectedMeasure.id, { voltaEnding: item.val })}
                      className={`py-1 rounded text-center text-xs font-semibold border transition-colors ${
                        selectedMeasure.voltaEnding === item.val
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-stone-50 border-stone-300 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Marker: Segno, Coda, Fine */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Target Marker
                </label>
                <select
                  value={selectedMeasure.navigationTarget || 'none'}
                  onChange={(e) =>
                    onUpdateMeasure(selectedMeasure.id, {
                      navigationTarget: e.target.value as NavigationTarget,
                    })
                  }
                  className="w-full px-2 py-1 bg-white border border-stone-300 rounded text-xs"
                >
                  <option value="none">None</option>
                  <option value="Segno">Segno (𝄋)</option>
                  <option value="Coda">Coda (𝄌)</option>
                  <option value="Fine">Fine (End of piece)</option>
                </select>
              </div>

              {/* Navigation Jump Instruction */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Jump Instruction (Measure End)
                </label>
                <select
                  value={selectedMeasure.navigationJump || 'none'}
                  onChange={(e) =>
                    onUpdateMeasure(selectedMeasure.id, {
                      navigationJump: e.target.value as NavigationJump,
                    })
                  }
                  className="w-full px-2 py-1 bg-white border border-stone-300 rounded text-xs"
                >
                  <option value="none">None</option>
                  <option value="To Coda">To Coda 𝄌</option>
                  <option value="D.C.">D.C. (Da Capo)</option>
                  <option value="D.C. al Fine">D.C. al Fine</option>
                  <option value="D.C. al Coda">D.C. al Coda</option>
                  <option value="D.S.">D.S. (Dal Segno)</option>
                  <option value="D.S. al Fine">D.S. al Fine</option>
                  <option value="D.S. al Coda">D.S. al Coda</option>
                </select>
              </div>
            </div>

            {/* Measure Tempo Override */}
            <div className="p-2.5 bg-white border border-stone-200 rounded-md space-y-1.5">
              <label className="flex items-center space-x-2 text-xs text-stone-800 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!selectedMeasure.tempoBpm}
                  onChange={(e) =>
                    onUpdateMeasure(selectedMeasure.id, {
                      tempoBpm: e.target.checked ? score.metadata.tempoBpm : undefined,
                      tempoBeatUnit: e.target.checked ? 'quarter' : undefined,
                    })
                  }
                  className="rounded border-stone-300 text-stone-900"
                />
                <span>Tempo Change at Measure</span>
              </label>

              {selectedMeasure.tempoBpm && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] text-stone-600 font-medium">BPM (40-240)</label>
                    <input
                      type="number"
                      min={40}
                      max={240}
                      value={selectedMeasure.tempoBpm}
                      onChange={(e) =>
                        onUpdateMeasure(selectedMeasure.id, {
                          tempoBpm: Math.max(40, Math.min(240, parseInt(e.target.value) || 100)),
                        })
                      }
                      className="w-full px-2 py-1 bg-stone-50 border border-stone-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone-600 font-medium">Beat Unit</label>
                    <select
                      value={selectedMeasure.tempoBeatUnit || 'quarter'}
                      onChange={(e) =>
                        onUpdateMeasure(selectedMeasure.id, {
                          tempoBeatUnit: e.target.value as TempoBeatUnit,
                        })
                      }
                      className="w-full px-2 py-1 bg-stone-50 border border-stone-300 rounded text-xs"
                    >
                      <option value="quarter">Quarter (♩)</option>
                      <option value="half">Half (𝅗𝅥)</option>
                      <option value="dotted_quarter">Dotted Qtr (♩.)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* System Break / Page Break Toggles */}
            <div className="space-y-1.5 pt-1">
              <label className="flex items-center space-x-2 text-xs text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!selectedMeasure.systemBreak}
                  onChange={(e) =>
                    onUpdateMeasure(selectedMeasure.id, { systemBreak: e.target.checked })
                  }
                  className="rounded border-stone-300 text-stone-900"
                />
                <span>Force Line / System Break after this measure</span>
              </label>
              <label className="flex items-center space-x-2 text-xs text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!selectedMeasure.pageBreak}
                  onChange={(e) =>
                    onUpdateMeasure(selectedMeasure.id, { pageBreak: e.target.checked })
                  }
                  className="rounded border-stone-300 text-stone-900"
                />
                <span>Force Page Break after this measure</span>
              </label>
            </div>

            {/* Measure-Level Teacher / Practice Instruction */}
            <div className="space-y-1 pt-1">
              <label className="block text-[11px] font-semibold text-stone-700">
                Measure Teacher Tip / Practice Goal
              </label>
              <input
                type="text"
                placeholder="e.g. Hands separately first; count out loud"
                value={selectedMeasure.teacherNote || ''}
                onChange={(e) =>
                  onUpdateMeasure(selectedMeasure.id, {
                    teacherNote: e.target.value,
                  })
                }
                className="w-full px-2 py-1 border border-stone-300 rounded bg-white text-xs text-stone-800 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Add Chord Symbol to Measure Button */}
            <button
              onClick={onOpenChordDialog}
              className="w-full py-1.5 px-2.5 bg-white border border-stone-300 rounded-md text-stone-800 hover:bg-stone-100 font-medium text-xs flex items-center justify-center space-x-1.5 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Add / Edit Chord Symbol</span>
            </button>

            {/* Measure Actions */}
            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-stone-200">
              <button
                onClick={() => onInsertMeasureBefore(selectedMeasure.id)}
                className="p-1.5 rounded bg-white border border-stone-200 hover:bg-stone-100 text-left flex items-center space-x-1"
              >
                <PlusCircle className="w-3 h-3 text-stone-500" />
                <span className="text-[11px]">Insert Before</span>
              </button>
              <button
                onClick={() => onInsertMeasureAfter(selectedMeasure.id)}
                className="p-1.5 rounded bg-white border border-stone-200 hover:bg-stone-100 text-left flex items-center space-x-1"
              >
                <PlusCircle className="w-3 h-3 text-stone-500" />
                <span className="text-[11px]">Insert After</span>
              </button>
              <button
                onClick={() => onDuplicateMeasure(selectedMeasure.id)}
                className="p-1.5 rounded bg-white border border-stone-200 hover:bg-stone-100 text-left flex items-center space-x-1"
              >
                <Copy className="w-3 h-3 text-stone-500" />
                <span className="text-[11px]">Duplicate</span>
              </button>
              <button
                onClick={() => onClearMeasure(selectedMeasure.id)}
                className="p-1.5 rounded bg-white border border-stone-200 hover:bg-stone-100 text-left flex items-center space-x-1 text-amber-800"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="text-[11px]">Clear Notes</span>
              </button>
            </div>

            <button
              onClick={() => onDeleteMeasure(selectedMeasure.id)}
              disabled={score.measures.length <= 1}
              className="w-full p-1.5 rounded bg-red-50 text-red-700 hover:bg-red-100 flex items-center justify-center space-x-1 font-semibold disabled:opacity-30"
            >
              <Trash2 className="w-3 h-3 text-red-600" />
              <span>Delete Measure</span>
            </button>
          </div>
        )}

        {/* SECTION 5: Add Measure to End */}
        <button
          id="add-measure-btn"
          onClick={onAddMeasure}
          className="w-full py-2 px-3 rounded-lg bg-stone-900 text-white font-medium hover:bg-stone-800 flex items-center justify-center space-x-2 shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Measure at End</span>
        </button>

        {/* SECTION: Pianotastic Learning Layer (Educational Annotation System) */}
        {(() => {
          const learning = score.learningLayer || DEFAULT_LEARNING_LAYER;
          const isPractice = learning.viewMode === 'practice_sheet';

          return (
            <div className="space-y-3 bg-amber-50/50 p-3 rounded-lg border border-amber-200/80 shadow-2xs">
              {/* Header with Title and View Mode Badge */}
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                <div className="flex items-center space-x-1.5">
                  <GraduationCap className="w-4 h-4 text-amber-800" />
                  <span className="font-serif font-bold text-xs text-amber-950">Learning Layer</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={learning.enabled}
                    onChange={(e) =>
                      onUpdateLearningLayer?.({
                        enabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-amber-600"></div>
                  <span className="ml-1.5 text-[10px] font-semibold text-amber-900">
                    {learning.enabled ? 'ON' : 'OFF'}
                  </span>
                </label>
              </div>

              {/* View Mode Toggle */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-stone-700">Display View Mode</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => onUpdateLearningLayer?.({ viewMode: 'professional' })}
                    className={`py-1.5 px-2 rounded border text-xs font-medium transition-colors ${
                      !isPractice
                        ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    Professional Score
                  </button>
                  <button
                    onClick={() => onUpdateLearningLayer?.({ viewMode: 'practice_sheet', enabled: true })}
                    className={`py-1.5 px-2 rounded border text-xs font-medium transition-colors ${
                      isPractice
                        ? 'bg-amber-700 text-white border-amber-700 shadow-2xs'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    Practice Sheet
                  </button>
                </div>
              </div>

              {learning.enabled && (
                <>
                  {/* Annotation Elements to Display */}
                  <div className="space-y-1.5 pt-1 border-t border-amber-200/50">
                    <span className="block text-[11px] font-semibold text-stone-800">
                      Educational Annotations
                    </span>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <label className="flex items-center space-x-1.5 cursor-pointer bg-white/70 p-1 rounded border border-amber-100">
                        <input
                          type="checkbox"
                          checked={learning.showRH_LH}
                          onChange={(e) => onUpdateLearningLayer?.({ showRH_LH: e.target.checked })}
                          className="rounded border-stone-300 text-amber-600"
                        />
                        <span className="font-medium text-stone-800">RH / LH Staves</span>
                      </label>

                      <label className="flex items-center space-x-1.5 cursor-pointer bg-white/70 p-1 rounded border border-amber-100">
                        <input
                          type="checkbox"
                          checked={learning.showFingerNumbers}
                          onChange={(e) => onUpdateLearningLayer?.({ showFingerNumbers: e.target.checked })}
                          className="rounded border-stone-300 text-amber-600"
                        />
                        <span className="font-medium text-stone-800">Fingering (1-5)</span>
                      </label>

                      <label className="flex items-center space-x-1.5 cursor-pointer bg-white/70 p-1 rounded border border-amber-100">
                        <input
                          type="checkbox"
                          checked={learning.showNoteNames}
                          onChange={(e) => onUpdateLearningLayer?.({ showNoteNames: e.target.checked })}
                          className="rounded border-stone-300 text-amber-600"
                        />
                        <span className="font-medium text-stone-800">Note Names</span>
                      </label>

                      <label className="flex items-center space-x-1.5 cursor-pointer bg-white/70 p-1 rounded border border-amber-100">
                        <input
                          type="checkbox"
                          checked={learning.showSolfege}
                          onChange={(e) => onUpdateLearningLayer?.({ showSolfege: e.target.checked })}
                          className="rounded border-stone-300 text-amber-600"
                        />
                        <span className="font-medium text-stone-800">Solfege (Do-Re)</span>
                      </label>

                      <label className="flex items-center space-x-1.5 cursor-pointer bg-white/70 p-1 rounded border border-amber-100">
                        <input
                          type="checkbox"
                          checked={learning.showBeatNumbers}
                          onChange={(e) => onUpdateLearningLayer?.({ showBeatNumbers: e.target.checked })}
                          className="rounded border-stone-300 text-amber-600"
                        />
                        <span className="font-medium text-stone-800">Beat Numbers</span>
                      </label>

                      <label className="flex items-center space-x-1.5 cursor-pointer bg-white/70 p-1 rounded border border-amber-100">
                        <input
                          type="checkbox"
                          checked={learning.showPracticeCounts}
                          onChange={(e) => onUpdateLearningLayer?.({ showPracticeCounts: e.target.checked })}
                          className="rounded border-stone-300 text-amber-600"
                        />
                        <span className="font-medium text-stone-800">Counts (1 & 2 &)</span>
                      </label>

                      <label className="flex items-center space-x-1.5 cursor-pointer bg-white/70 p-1 rounded border border-amber-100 col-span-2">
                        <input
                          type="checkbox"
                          checked={learning.showTeacherNotes}
                          onChange={(e) => onUpdateLearningLayer?.({ showTeacherNotes: e.target.checked })}
                          className="rounded border-stone-300 text-amber-600"
                        />
                        <span className="font-medium text-stone-800">Teacher Notes & Tips</span>
                      </label>
                    </div>
                  </div>

                  {/* Annotation Placement */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-stone-700">
                      Annotation Placement
                    </label>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      {[
                        { id: 'above_notes', label: 'Above Notes' },
                        { id: 'below_notes', label: 'Below Notes' },
                        { id: 'above_staff', label: 'Above Staff' },
                        { id: 'below_staff', label: 'Below Staff' },
                      ].map((pos) => (
                        <button
                          key={pos.id}
                          onClick={() => onUpdateLearningLayer?.({ position: pos.id as any })}
                          className={`py-1 px-1.5 rounded border ${
                            learning.position === pos.id
                              ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Student & Practice Assignment Details */}
                  <div className="space-y-2 pt-2 border-t border-amber-200/50">
                    <span className="block text-[11px] font-semibold text-stone-800">
                      Student & Assignment Info
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-stone-600">Student Name</label>
                        <input
                          type="text"
                          value={learning.studentName || ''}
                          placeholder="e.g. Alex"
                          onChange={(e) => onUpdateLearningLayer?.({ studentName: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-stone-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-600">Lesson Date</label>
                        <input
                          type="date"
                          value={learning.lessonDate || ''}
                          onChange={(e) => onUpdateLearningLayer?.({ lessonDate: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-stone-300 rounded text-xs"
                        />
                      </div>
                    </div>

                    {/* Repetition Goals */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-stone-600">Repetition Checklist Boxes</label>
                        <label className="flex items-center space-x-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={learning.showPracticeRepetitions ?? true}
                            onChange={(e) => onUpdateLearningLayer?.({ showPracticeRepetitions: e.target.checked })}
                            className="rounded border-stone-300 text-amber-600"
                          />
                          <span className="text-[10px] text-stone-700">Show</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {[3, 5, 10].map((count) => (
                          <button
                            key={count}
                            onClick={() => onUpdateLearningLayer?.({ targetRepetitions: count })}
                            className={`py-1 rounded border text-xs font-semibold ${
                              (learning.targetRepetitions || 5) === count
                                ? 'bg-amber-600 text-white border-amber-600'
                                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                            }`}
                          >
                            {count} Repetitions
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* General Teacher Notes */}
                    <div>
                      <label className="block text-[10px] text-stone-600 mb-1">
                        General Teacher Instructions
                      </label>
                      <textarea
                        rows={2}
                        value={learning.teacherGeneralNotes || ''}
                        onChange={(e) => onUpdateLearningLayer?.({ teacherGeneralNotes: e.target.value })}
                        placeholder="e.g. Practice hands separately, count out loud..."
                        className="w-full px-2 py-1 bg-white border border-stone-300 rounded text-xs text-stone-800"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* SECTION 6: Layout Mode & Reset Layout */}
        <div className="space-y-2.5 bg-stone-50/60 p-3 rounded-lg border border-stone-200/70">
          <div className="flex items-center justify-between">
            <span className="font-bold text-stone-800">Score Layout & Pages</span>
            <span className="text-[10px] text-stone-500 uppercase font-semibold">
              {score.layoutSettings.pageSize || 'A4'} • {score.layoutSettings.orientation}
            </span>
          </div>

          {/* Orientation: Portrait / Landscape */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onUpdateLayout({ orientation: 'portrait' })}
              className={`py-1.5 rounded border text-xs font-semibold ${
                score.layoutSettings.orientation === 'portrait'
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              Portrait
            </button>
            <button
              onClick={() => onUpdateLayout({ orientation: 'landscape' })}
              className={`py-1.5 rounded border text-xs font-semibold ${
                score.layoutSettings.orientation === 'landscape'
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              Landscape
            </button>
          </div>

          {/* Page Size: A4 / Letter */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onUpdateLayout({ pageSize: 'A4' })}
              className={`py-1 rounded border text-xs font-semibold ${
                (score.layoutSettings.pageSize || 'A4') === 'A4'
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              A4 Sheet
            </button>
            <button
              onClick={() => onUpdateLayout({ pageSize: 'Letter' })}
              className={`py-1 rounded border text-xs font-semibold ${
                score.layoutSettings.pageSize === 'Letter'
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              US Letter
            </button>
          </div>

          {/* Page Margins */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">Page Margins</label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { label: 'Compact', val: 30 },
                { label: 'Normal', val: 48 },
                { label: 'Spacious', val: 64 },
              ].map((m) => (
                <button
                  key={m.label}
                  onClick={() =>
                    onUpdateLayout({
                      pageMarginTop: m.val,
                      pageMarginBottom: m.val,
                      pageMarginLeft: m.val,
                      pageMarginRight: m.val,
                    })
                  }
                  className={`py-1 rounded text-xs font-medium border ${
                    (score.layoutSettings.pageMarginLeft || 48) === m.val
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Layout Mode */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={() => onUpdateLayout({ layoutMode: 'auto' })}
              className={`py-1.5 rounded border text-xs font-semibold ${
                score.layoutSettings.layoutMode === 'auto'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              Auto Flow
            </button>
            <button
              onClick={() => onUpdateLayout({ layoutMode: 'manual' })}
              className={`py-1.5 rounded border text-xs font-semibold ${
                score.layoutSettings.layoutMode === 'manual'
                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              Manual Widths
            </button>
          </div>

          {/* Pianotastic Academy Branding Toggle */}
          <div className="pt-2 border-t border-stone-200 space-y-1.5">
            <label className="flex items-center space-x-2 text-xs text-stone-800 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={score.layoutSettings.showAcademyBranding ?? true}
                onChange={(e) => onUpdateLayout({ showAcademyBranding: e.target.checked })}
                className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
              />
              <span>Pianotastic Academy Branding</span>
            </label>
            {score.layoutSettings.showAcademyBranding && (
              <input
                type="text"
                value={score.layoutSettings.academyFooterText || 'Pianotastic Academy — Pianotastic Notation Studio'}
                onChange={(e) => onUpdateLayout({ academyFooterText: e.target.value })}
                placeholder="Footer branding text..."
                className="w-full px-2 py-1 text-[11px] bg-white border border-stone-300 rounded text-stone-700"
              />
            )}
          </div>

          {/* Reset Layout button */}
          <button
            id="reset-layout-btn"
            onClick={onResetLayout}
            className="w-full py-1.5 px-2.5 rounded bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-medium flex items-center justify-center space-x-1.5 mt-2"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>Reset Layout (Restore Auto)</span>
          </button>
        </div>

        {/* SECTION 7: Playback Route & Navigation Diagnostics */}
        {(() => {
          const routeResult = calculatePlaybackRoute(score.measures);
          const hasRepeatsOrJumps = score.measures.some(
            (m) =>
              m.repeatStart ||
              m.repeatEnd ||
              m.voltaEnding ||
              (m.navigationTarget && m.navigationTarget !== 'none') ||
              (m.navigationJump && m.navigationJump !== 'none')
          );
          if (!hasRepeatsOrJumps) return null;

          return (
            <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 text-xs flex items-center space-x-1">
                  <Flag className="w-3.5 h-3.5 text-amber-700" />
                  <span>Playback Route</span>
                </span>
                {routeResult.errors.length === 0 ? (
                  <span className="flex items-center space-x-1 text-[10px] font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Valid</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 text-[10px] font-semibold text-red-600">
                    <AlertCircle className="w-3 h-3" />
                    <span>Warning</span>
                  </span>
                )}
              </div>

              {routeResult.errors.map((err, i) => (
                <p key={i} className="text-[10px] text-red-700 font-medium">
                  • {err}
                </p>
              ))}

              <div className="font-mono text-[10px] text-amber-950 bg-white/80 p-1.5 rounded border border-amber-200/60 overflow-x-auto whitespace-nowrap">
                {routeResult.route.map((step, idx) => (
                  <span key={idx} className="mr-1">
                    m.{step.measureNumber}
                    {step.voltaEnding ? `(${step.voltaEnding})` : ''}
                    {idx < routeResult.route.length - 1 ? ' → ' : ''}
                  </span>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </aside>
  );
};
