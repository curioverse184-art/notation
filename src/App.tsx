import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Score,
  Measure,
  NoteEvent,
  Pitch,
  ToolMode,
  NoteDuration,
  AccidentalType,
  SelectionState,
  Hand,
  TimeSignature,
  LearningLayerSettings,
  DEFAULT_LEARNING_LAYER,
} from './types/score';
import { SAMPLE_SCORES } from './data/sampleScores';
import { audioEngine } from './services/audioEngine';
import { midiService } from './services/midiService';
import { getStaffStepOffset, pitchFromDiatonicStepValue, getDiatonicStepValue } from './utils/musicTheory';

// Components
import { Header } from './components/layout/Header';
import { MainToolbar } from './components/toolbar/MainToolbar';
import { LeftToolPalette } from './components/palette/LeftToolPalette';
import { NotationRenderer } from './components/notation/NotationRenderer';
import { PropertiesPanel } from './components/properties/PropertiesPanel';
import { BottomPlaybackBar } from './components/playback/BottomPlaybackBar';
import { VirtualPiano } from './components/piano/VirtualPiano';

// Modals
import { CustomTimeSignatureModal } from './components/modals/CustomTimeSignatureModal';
import { ChordDialogModal } from './components/modals/ChordDialogModal';
import { KeyboardShortcutsModal } from './components/modals/KeyboardShortcutsModal';
import { MeasureContextMenu } from './components/modals/MeasureContextMenu';
import { NavigationPalette } from './components/navigation/NavigationPalette';
import { MidiDeviceModal } from './components/midi/MidiDeviceModal';

export default function App() {
  // Score state
  const [score, setScore] = useState<Score>(SAMPLE_SCORES.etude);

  // Undo / Redo history
  const [history, setHistory] = useState<Score[]>([SAMPLE_SCORES.etude]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Tools & Entry state
  const [toolMode, setToolMode] = useState<ToolMode>('note');
  const [selectedDuration, setSelectedDuration] = useState<NoteDuration>('quarter');
  const [isDotted, setIsDotted] = useState(false);
  const [selectedAccidental, setSelectedAccidental] = useState<AccidentalType | null>(null);
  const [activeHand, setActiveHand] = useState<Hand>('RH');

  // Selection state
  const [selection, setSelection] = useState<SelectionState>({
    measureId: 'm1',
    staff: 'RH',
    eventId: null,
  });

  // Playback & Input UI state
  const [playbackPosition, setPlaybackPosition] = useState<{ measureIndex: number; beat: number } | null>(null);
  const [isVirtualPianoOpen, setIsVirtualPianoOpen] = useState(false);

  // Modals state
  const [isCustomTimeSigOpen, setIsCustomTimeSigOpen] = useState(false);
  const [isChordDialogOpen, setIsChordDialogOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ measure: Measure; x: number; y: number } | null>(null);
  const [navigationModalMeasure, setNavigationModalMeasure] = useState<Measure | null>(null);
  const [isMidiModalOpen, setIsMidiModalOpen] = useState(false);
  const [midiMode, setMidiMode] = useState<'playback' | 'entry'>('entry');
  const [quantization, setQuantization] = useState('quarter');
  const [selectedChannel, setSelectedChannel] = useState(0);
  const [velocitySensitive, setVelocitySensitive] = useState(true);

  // Push score to undo stack
  const pushScoreState = useCallback((newScore: Score) => {
    setHistory((prev) => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      return [...upToCurrent, newScore];
    });
    setHistoryIndex((prev) => prev + 1);
    setScore(newScore);
  }, [historyIndex]);

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setScore(history[newIndex]);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setScore(history[newIndex]);
    }
  }, [historyIndex, history]);

  // Update Score Metadata
  const handleUpdateMetadata = useCallback((patch: Partial<Score['metadata']>) => {
    setScore((prev) => {
      const updated: Score = {
        ...prev,
        metadata: { ...prev.metadata, ...patch },
      };
      pushScoreState(updated);
      return updated;
    });
  }, [pushScoreState]);

  // Update Layout Settings
  const handleUpdateLayout = useCallback((patch: Partial<Score['layoutSettings']>) => {
    setScore((prev) => {
      const updated: Score = {
        ...prev,
        layoutSettings: { ...prev.layoutSettings, ...patch },
      };
      pushScoreState(updated);
      return updated;
    });
  }, [pushScoreState]);

  // Update Measure
  const handleUpdateMeasure = useCallback((measureId: string, patch: Partial<Measure>) => {
    setScore((prev) => {
      const updatedMeasures = prev.measures.map((m) =>
        m.id === measureId ? { ...m, ...patch } : m
      );
      const updated: Score = { ...prev, measures: updatedMeasures };
      pushScoreState(updated);
      return updated;
    });
  }, [pushScoreState]);

  // Update Event
  const handleUpdateEvent = useCallback((
    measureId: string,
    staff: 'RH' | 'LH',
    eventId: string,
    patch: Partial<NoteEvent>
  ) => {
    setScore((prev) => {
      const updatedMeasures = prev.measures.map((m) => {
        if (m.id !== measureId) return m;
        const list = staff === 'RH' ? m.rhEvents : m.lhEvents;
        const updatedList = list.map((ev) =>
          ev.id === eventId ? { ...ev, ...patch } : ev
        );
        return {
          ...m,
          rhEvents: staff === 'RH' ? updatedList : m.rhEvents,
          lhEvents: staff === 'LH' ? updatedList : m.lhEvents,
        };
      });
      const updated: Score = { ...prev, measures: updatedMeasures };
      pushScoreState(updated);
      return updated;
    });
  }, [pushScoreState]);

  // Measure Operations
  const handleAddMeasure = useCallback(() => {
    setScore((prev) => {
      const newNum = prev.measures.length + 1;
      const newMeasure: Measure = {
        id: `m_${Date.now()}`,
        measureNumber: newNum,
        barlineType: 'single',
        chordSymbols: [],
        rhEvents: [
          {
            id: `rh_${Date.now()}`,
            type: 'rest',
            pitches: [],
            duration: 'whole',
          },
        ],
        lhEvents: [
          {
            id: `lh_${Date.now()}`,
            type: 'rest',
            pitches: [],
            duration: 'whole',
          },
        ],
      };
      const updated: Score = {
        ...prev,
        measures: [...prev.measures, newMeasure],
      };
      pushScoreState(updated);
      setSelection({ measureId: newMeasure.id, staff: 'RH', eventId: null });
      return updated;
    });
  }, [pushScoreState]);

  const handleInsertMeasureBefore = useCallback((targetMeasureId: string) => {
    setScore((prev) => {
      const idx = prev.measures.findIndex((m) => m.id === targetMeasureId);
      if (idx === -1) return prev;

      const newMeasure: Measure = {
        id: `m_${Date.now()}`,
        measureNumber: idx + 1,
        barlineType: 'single',
        chordSymbols: [],
        rhEvents: [{ id: `rh_${Date.now()}`, type: 'rest', pitches: [], duration: 'whole' }],
        lhEvents: [{ id: `lh_${Date.now()}`, type: 'rest', pitches: [], duration: 'whole' }],
      };

      const newMeasures = [...prev.measures];
      newMeasures.splice(idx, 0, newMeasure);
      // Renumber
      newMeasures.forEach((m, i) => {
        m.measureNumber = i + 1;
      });

      const updated: Score = { ...prev, measures: newMeasures };
      pushScoreState(updated);
      setSelection({ measureId: newMeasure.id, staff: 'RH', eventId: null });
      return updated;
    });
  }, [pushScoreState]);

  const handleInsertMeasureAfter = useCallback((targetMeasureId: string) => {
    setScore((prev) => {
      const idx = prev.measures.findIndex((m) => m.id === targetMeasureId);
      if (idx === -1) return prev;

      const newMeasure: Measure = {
        id: `m_${Date.now()}`,
        measureNumber: idx + 2,
        barlineType: 'single',
        chordSymbols: [],
        rhEvents: [{ id: `rh_${Date.now()}`, type: 'rest', pitches: [], duration: 'whole' }],
        lhEvents: [{ id: `lh_${Date.now()}`, type: 'rest', pitches: [], duration: 'whole' }],
      };

      const newMeasures = [...prev.measures];
      newMeasures.splice(idx + 1, 0, newMeasure);
      // Renumber
      newMeasures.forEach((m, i) => {
        m.measureNumber = i + 1;
      });

      const updated: Score = { ...prev, measures: newMeasures };
      pushScoreState(updated);
      setSelection({ measureId: newMeasure.id, staff: 'RH', eventId: null });
      return updated;
    });
  }, [pushScoreState]);

  const handleDuplicateMeasure = useCallback((targetMeasureId: string) => {
    setScore((prev) => {
      const idx = prev.measures.findIndex((m) => m.id === targetMeasureId);
      if (idx === -1) return prev;
      const target = prev.measures[idx];

      const cloned: Measure = JSON.parse(JSON.stringify(target));
      cloned.id = `m_${Date.now()}`;
      cloned.rhEvents.forEach((e) => (e.id = `rh_${Math.random()}`));
      cloned.lhEvents.forEach((e) => (e.id = `lh_${Math.random()}`));
      cloned.chordSymbols.forEach((c) => (c.id = `cs_${Math.random()}`));

      const newMeasures = [...prev.measures];
      newMeasures.splice(idx + 1, 0, cloned);
      newMeasures.forEach((m, i) => {
        m.measureNumber = i + 1;
      });

      const updated: Score = { ...prev, measures: newMeasures };
      pushScoreState(updated);
      setSelection({ measureId: cloned.id, staff: 'RH', eventId: null });
      return updated;
    });
  }, [pushScoreState]);

  const handleDeleteMeasure = useCallback((targetMeasureId: string) => {
    setScore((prev) => {
      if (prev.measures.length <= 1) return prev;
      const newMeasures = prev.measures.filter((m) => m.id !== targetMeasureId);
      newMeasures.forEach((m, i) => {
        m.measureNumber = i + 1;
      });
      const updated: Score = { ...prev, measures: newMeasures };
      pushScoreState(updated);
      setSelection({ measureId: newMeasures[0].id, staff: 'RH', eventId: null });
      return updated;
    });
  }, [pushScoreState]);

  const handleClearMeasure = useCallback((targetMeasureId: string) => {
    setScore((prev) => {
      const updatedMeasures = prev.measures.map((m) => {
        if (m.id !== targetMeasureId) return m;
        return {
          ...m,
          chordSymbols: [],
          rhEvents: [{ id: `rh_${Date.now()}`, type: 'rest' as const, pitches: [], duration: 'whole' as const }],
          lhEvents: [{ id: `lh_${Date.now()}`, type: 'rest' as const, pitches: [], duration: 'whole' as const }],
        };
      });
      const updated: Score = { ...prev, measures: updatedMeasures };
      pushScoreState(updated);
      return updated;
    });
  }, [pushScoreState]);

  const handleMeasureWidthChange = useCallback((measureId: string, newWidth: number) => {
    setScore((prev) => {
      const updatedMeasures = prev.measures.map((m) =>
        m.id === measureId ? { ...m, customWidth: newWidth } : m
      );
      return {
        ...prev,
        layoutSettings: { ...prev.layoutSettings, layoutMode: 'manual' },
        measures: updatedMeasures,
      };
    });
  }, []);

  const handleResetLayout = useCallback(() => {
    setScore((prev) => {
      const updatedMeasures = prev.measures.map((m) => ({
        ...m,
        customWidth: undefined,
        systemBreak: false,
        pageBreak: false,
      }));
      const updated: Score = {
        ...prev,
        layoutSettings: {
          ...prev.layoutSettings,
          layoutMode: 'auto',
        },
        measures: updatedMeasures,
      };
      pushScoreState(updated);
      return updated;
    });
  }, [pushScoreState]);

  // Insert Note Event
  const handleInsertNote = useCallback((
    targetMeasureId: string,
    targetStaff: 'RH' | 'LH',
    pitch: Pitch
  ) => {
    // Play pitch for auditory feedback
    audioEngine.playPitch(pitch, score.metadata.initialKeySignature, 0.5);

    setScore((prev) => {
      const updatedMeasures = prev.measures.map((m) => {
        if (m.id !== targetMeasureId) return m;
        const list = targetStaff === 'RH' ? [...m.rhEvents] : [...m.lhEvents];

        // If the only event is a single placeholder rest, replace it
        if (list.length === 1 && list[0].type === 'rest' && list[0].duration === 'whole') {
          list.length = 0;
        }

        const newEvent: NoteEvent = {
          id: `ev_${Date.now()}_${Math.random()}`,
          type: 'note',
          pitches: [pitch],
          duration: selectedDuration,
          isDotted,
          hand: targetStaff,
        };

        list.push(newEvent);

        return {
          ...m,
          rhEvents: targetStaff === 'RH' ? list : m.rhEvents,
          lhEvents: targetStaff === 'LH' ? list : m.lhEvents,
        };
      });

      const updated: Score = { ...prev, measures: updatedMeasures };
      pushScoreState(updated);
      return updated;
    });
  }, [selectedDuration, isDotted, score.metadata.initialKeySignature, pushScoreState]);

  // Insert Note from Virtual Piano or Web MIDI
  const handlePianoNotePress = useCallback((pitch: Pitch) => {
    const targetMeasureId = selection.measureId || score.measures[0].id;
    const targetStaff = activeHand === 'LH' ? 'LH' : 'RH';
    handleInsertNote(targetMeasureId, targetStaff, pitch);
  }, [selection.measureId, score.measures, activeHand, handleInsertNote]);

  // Delete Selected Event
  const handleDeleteSelected = useCallback(() => {
    if (!selection.measureId || !selection.staff || !selection.eventId) return;
    setScore((prev) => {
      const updatedMeasures = prev.measures.map((m) => {
        if (m.id !== selection.measureId) return m;
        const list = selection.staff === 'RH' ? m.rhEvents : m.lhEvents;
        const filtered = list.filter((e) => e.id !== selection.eventId);
        // If empty, put back a whole rest
        if (filtered.length === 0) {
          filtered.push({
            id: `rest_${Date.now()}`,
            type: 'rest',
            pitches: [],
            duration: 'whole',
          });
        }
        return {
          ...m,
          rhEvents: selection.staff === 'RH' ? filtered : m.rhEvents,
          lhEvents: selection.staff === 'LH' ? filtered : m.lhEvents,
        };
      });
      const updated: Score = { ...prev, measures: updatedMeasures };
      pushScoreState(updated);
      setSelection((sel) => ({ ...sel, eventId: null }));
      return updated;
    });
  }, [selection, pushScoreState]);

  // Transpose Selected Note Up / Down
  const handleTransposeSelected = useCallback((stepDelta: number) => {
    if (!selection.measureId || !selection.staff || !selection.eventId) return;
    setScore((prev) => {
      const updatedMeasures = prev.measures.map((m) => {
        if (m.id !== selection.measureId) return m;
        const list = selection.staff === 'RH' ? m.rhEvents : m.lhEvents;
        const updatedList = list.map((ev) => {
          if (ev.id !== selection.eventId || ev.type !== 'note') return ev;
          const updatedPitches = ev.pitches.map((p) => {
            const curStepVal = getDiatonicStepValue(p);
            const nextStepVal = curStepVal + stepDelta;
            const nextPitch = pitchFromDiatonicStepValue(nextStepVal);
            return {
              step: nextPitch.step,
              octave: nextPitch.octave,
              accidental: p.accidental,
            };
          });
          // Play preview of transposed note
          if (updatedPitches[0]) {
            audioEngine.playPitch(updatedPitches[0], prev.metadata.initialKeySignature, 0.4);
          }
          return { ...ev, pitches: updatedPitches };
        });
        return {
          ...m,
          rhEvents: selection.staff === 'RH' ? updatedList : m.rhEvents,
          lhEvents: selection.staff === 'LH' ? updatedList : m.lhEvents,
        };
      });
      const updated: Score = { ...prev, measures: updatedMeasures };
      pushScoreState(updated);
      return updated;
    });
  }, [selection, pushScoreState]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Space -> Play / Pause
      if (e.code === 'Space') {
        e.preventDefault();
        if (audioEngine.getIsPlaying()) {
          audioEngine.pausePlayback();
        } else {
          audioEngine.playScore(score, playbackPosition?.measureIndex || 0);
        }
        return;
      }

      // Tool switching
      if (e.key.toLowerCase() === 'v') {
        setToolMode('select');
        return;
      }
      if (e.key.toLowerCase() === 'n') {
        setToolMode('note');
        return;
      }
      if (e.key.toLowerCase() === 'r') {
        setToolMode('rest');
        return;
      }
      if (e.key.toLowerCase() === 'l') {
        setToolMode('lyrics');
        return;
      }
      if (e.key.toLowerCase() === 'c') {
        setIsChordDialogOpen(true);
        return;
      }

      // Durations (1-6)
      if (e.key === '1') { setSelectedDuration('whole'); return; }
      if (e.key === '2') { setSelectedDuration('half'); return; }
      if (e.key === '3') { setSelectedDuration('quarter'); return; }
      if (e.key === '4') { setSelectedDuration('eighth'); return; }
      if (e.key === '5') { setSelectedDuration('sixteenth'); return; }
      if (e.key === '6') { setSelectedDuration('thirty_second'); return; }
      if (e.key === '.') { setIsDotted((prev) => !prev); return; }

      // Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelected();
        return;
      }

      // Arrow navigation / transposition
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleTransposeSelected(1);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleTransposeSelected(-1);
        return;
      }

      // Direct Computer Pitch Keys: C, D, E, F, G, A, B
      const upper = e.key.toUpperCase();
      if (['C', 'D', 'E', 'F', 'G', 'A', 'B'].includes(upper)) {
        const octave = activeHand === 'LH' ? 3 : 4;
        const pitch: Pitch = {
          step: upper as any,
          octave,
          accidental: selectedAccidental,
        };
        const targetMeasureId = selection.measureId || score.measures[0].id;
        const targetStaff = activeHand === 'LH' ? 'LH' : 'RH';
        handleInsertNote(targetMeasureId, targetStaff, pitch);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleDeleteSelected,
    handleTransposeSelected,
    handleInsertNote,
    score,
    playbackPosition,
    selection,
    activeHand,
    selectedAccidental,
  ]);

  // Web MIDI note input listener
  useEffect(() => {
    const unsubscribe = midiService.onNote((pitch) => {
      const targetMeasureId = selection.measureId || score.measures[0].id;
      const targetStaff = pitch.octave <= 3 ? 'LH' : 'RH';
      handleInsertNote(targetMeasureId, targetStaff, pitch);
    });
    return () => {
      unsubscribe();
    };
  }, [selection.measureId, score.measures, handleInsertNote]);

  // Audio Engine position callback
  useEffect(() => {
    audioEngine.setPositionCallback((measureIndex, beat) => {
      setPlaybackPosition({ measureIndex, beat });
    });
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-stone-100 font-sans text-stone-900">
      {/* 1. Top Application Header */}
      <Header
        score={score}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onUpdateMetadata={handleUpdateMetadata}
        onUpdateLayout={handleUpdateLayout}
        onLoadScore={(newScore) => {
          setScore(newScore);
          pushScoreState(newScore);
        }}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onResetScore={(templateKey) => {
          const t = SAMPLE_SCORES[templateKey] || SAMPLE_SCORES.blank;
          setScore(t);
          pushScoreState(t);
        }}
      />

      {/* 2. Main Notation Toolbar */}
      <MainToolbar
        toolMode={toolMode}
        onSetToolMode={setToolMode}
        selectedDuration={selectedDuration}
        onSetDuration={setSelectedDuration}
        isDotted={isDotted}
        onToggleDotted={() => setIsDotted(!isDotted)}
        selectedAccidental={selectedAccidental}
        onSetAccidental={setSelectedAccidental}
        activeHand={activeHand}
        onSetHand={setActiveHand}
      />

      {/* Central Workspace: Left Palette + Score Canvas + Right Inspector */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* 3. Left-side Tool Palette */}
        <LeftToolPalette
          score={score}
          onUpdateLayout={handleUpdateLayout}
        />

        {/* 4. Central Score Canvas */}
        <NotationRenderer
          score={score}
          toolMode={toolMode}
          selectedDuration={selectedDuration}
          selectedAccidental={selectedAccidental}
          activeHand={activeHand}
          selection={selection}
          playbackPosition={playbackPosition}
          onSelectMeasure={(measureId) =>
            setSelection((sel) => ({ ...sel, measureId, eventId: null }))
          }
          onSelectEvent={(measureId, staff, eventId) =>
            setSelection({ measureId, staff, eventId })
          }
          onInsertNote={handleInsertNote}
          onDeleteSelected={handleDeleteSelected}
          onMeasureWidthChange={handleMeasureWidthChange}
          onMeasureContextMenu={(measure, x, y) =>
            setContextMenu({ measure, x, y })
          }
          onOpenNavigationPalette={(measure) =>
            setNavigationModalMeasure(measure)
          }
        />

        {/* 5. Right-side Properties Panel */}
        <PropertiesPanel
          score={score}
          selection={selection}
          onUpdateScoreMetadata={handleUpdateMetadata}
          onUpdateLayout={handleUpdateLayout}
          onUpdateMeasure={handleUpdateMeasure}
          onUpdateEvent={handleUpdateEvent}
          onAddMeasure={handleAddMeasure}
          onInsertMeasureBefore={handleInsertMeasureBefore}
          onInsertMeasureAfter={handleInsertMeasureAfter}
          onDuplicateMeasure={handleDuplicateMeasure}
          onDeleteMeasure={handleDeleteMeasure}
          onClearMeasure={handleClearMeasure}
          onOpenCustomTimeSignature={() => setIsCustomTimeSigOpen(true)}
          onOpenChordDialog={() => setIsChordDialogOpen(true)}
          onResetLayout={handleResetLayout}
        />
      </div>

      {/* Virtual Piano Expandable Keyboard */}
      <VirtualPiano
        isOpen={isVirtualPianoOpen}
        onClose={() => setIsVirtualPianoOpen(false)}
        onKeyPress={handlePianoNotePress}
        selectedAccidental={selectedAccidental}
      />

      {/* 6. Bottom Playback & Control Bar */}
      <BottomPlaybackBar
        score={score}
        onUpdateScoreMetadata={handleUpdateMetadata}
        isVirtualPianoOpen={isVirtualPianoOpen}
        onToggleVirtualPiano={() => setIsVirtualPianoOpen(!isVirtualPianoOpen)}
        playbackPosition={playbackPosition}
        onOpenMidiModal={() => setIsMidiModalOpen(true)}
      />

      {/* MODALS */}
      <CustomTimeSignatureModal
        isOpen={isCustomTimeSigOpen}
        onClose={() => setIsCustomTimeSigOpen(false)}
        currentTs={score.metadata.initialTimeSignature}
        onApply={(ts: TimeSignature, applyToAll: boolean) => {
          if (applyToAll) {
            handleUpdateMetadata({ initialTimeSignature: ts });
            setScore((prev) => {
              const updatedMeasures = prev.measures.map((m) => ({
                ...m,
                timeSignature: undefined, // inherit new score time signature
              }));
              const updated = { ...prev, measures: updatedMeasures };
              pushScoreState(updated);
              return updated;
            });
          } else if (selection.measureId) {
            handleUpdateMeasure(selection.measureId, { timeSignature: ts });
          }
        }}
      />

      <ChordDialogModal
        isOpen={isChordDialogOpen}
        onClose={() => setIsChordDialogOpen(false)}
        onInsertChord={(chord) => {
          if (!selection.measureId) return;
          const targetMeasure = score.measures.find((m) => m.id === selection.measureId);
          if (!targetMeasure) return;

          const newChordSymbols = [...targetMeasure.chordSymbols];
          newChordSymbols.push({
            id: `cs_${Date.now()}`,
            beatOffset: 0,
            root: chord.root,
            quality: chord.quality,
            bass: chord.bass,
            formatted: chord.formatted,
          });

          handleUpdateMeasure(selection.measureId, { chordSymbols: newChordSymbols });
        }}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Navigation Tool Modal / Palette */}
      {navigationModalMeasure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-100">
            <NavigationPalette
              activeMeasure={score.measures.find((m) => m.id === navigationModalMeasure.id) || navigationModalMeasure}
              measures={score.measures}
              onUpdateMeasure={(mId, patch) => handleUpdateMeasure(mId, patch)}
              onClose={() => setNavigationModalMeasure(null)}
            />
          </div>
        </div>
      )}

      {/* MIDI Device Configuration Modal */}
      <MidiDeviceModal
        isOpen={isMidiModalOpen}
        onClose={() => setIsMidiModalOpen(false)}
        midiMode={midiMode}
        onSetMidiMode={setMidiMode}
        quantization={quantization}
        onSetQuantization={setQuantization}
        selectedChannel={selectedChannel}
        onSetSelectedChannel={setSelectedChannel}
        velocitySensitive={velocitySensitive}
        onSetVelocitySensitive={setVelocitySensitive}
      />

      {contextMenu && (
        <MeasureContextMenu
          measure={contextMenu.measure}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onAddBefore={handleInsertMeasureBefore}
          onAddAfter={handleInsertMeasureAfter}
          onDuplicate={handleDuplicateMeasure}
          onDelete={handleDeleteMeasure}
          onClear={handleClearMeasure}
          onResetWidth={(mId) => handleMeasureWidthChange(mId, undefined as any)}
          onOpenNavigation={(measure) => setNavigationModalMeasure(measure)}
        />
      )}
    </div>
  );
}
