import React, { useState } from 'react';
import { Score, ToolMode, LearningLayerSettings } from '../../types/score';
import {
  Undo2,
  Redo2,
  Printer,
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Music2,
  FileText,
  FileMusic,
  HelpCircle,
  Sparkles,
  Save,
  Check,
  GraduationCap,
  PlusCircle,
  RotateCcw,
  Piano,
  Clock,
} from 'lucide-react';
import { ExportService } from '../../services/exportService';

interface HeaderProps {
  score: Score;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onUpdateMetadata: (patch: Partial<Score['metadata']>) => void;
  onUpdateLayout: (patch: Partial<Score['layoutSettings']>) => void;
  onUpdateLearningLayer?: (patch: Partial<LearningLayerSettings>) => void;
  onLoadScore: (score: Score) => void;
  onOpenShortcuts: () => void;
  onResetScore: (templateKey: string) => void;
  onOpenCustomTimeSignature?: () => void;
  onOpenChordDialog?: () => void;
  onAddMeasure?: () => void;
  onResetLayout?: () => void;
  onToggleVirtualPiano?: () => void;
  isVirtualPianoOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  score,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onUpdateMetadata,
  onUpdateLayout,
  onUpdateLearningLayer,
  onLoadScore,
  onOpenShortcuts,
  onResetScore,
  onOpenCustomTimeSignature,
  onOpenChordDialog,
  onAddMeasure,
  onResetLayout,
  onToggleVirtualPiano,
  isVirtualPianoOpen,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(score.metadata.title);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const project = await ExportService.importProject(file);
        onLoadScore({
          ...project.score,
          learningLayer: project.learningLayer,
        });
        showToast(`Loaded "${project.score.metadata.title}"`);
      } catch (err) {
        alert('Failed to load project: ' + (err as Error).message);
      }
      e.target.value = '';
    }
  };

  const handleSaveProject = () => {
    ExportService.exportJSON(score);
    showToast(`Saved "${score.metadata.title}.pianotastic"`);
  };

  const handleSaveAs = () => {
    const newTitle = window.prompt('Save project as:', score.metadata.title);
    if (newTitle && newTitle.trim()) {
      onUpdateMetadata({ title: newTitle.trim() });
      ExportService.exportJSON({
        ...score,
        metadata: { ...score.metadata, title: newTitle.trim() },
      }, newTitle.trim());
      showToast(`Saved "${newTitle.trim()}.pianotastic"`);
    }
  };

  const handleRevertAutosave = () => {
    const saved = localStorage.getItem('pianotastic_autosave_project');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.measures) {
          onLoadScore(parsed);
          showToast('Restored latest autosaved score');
          return;
        }
      } catch {
        // ignore
      }
    }
    showToast('No autosaved project found');
  };

  return (
    <header
      id="app-header"
      className="w-full bg-white border-b border-stone-200/90 text-stone-800 px-4 py-2 flex items-center justify-between z-30 select-none print:hidden"
    >
      {/* Brand & Document Menu */}
      <div className="flex items-center space-x-4">
        {/* Pianotastic Academy Logo & Title */}
        <div className="flex items-center space-x-2.5 pr-3 border-r border-stone-200">
          <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold shadow-xs">
            <Music2 className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-900 block -mb-0.5 font-sans">
              Pianotastic Academy
            </span>
            <span className="text-sm font-bold tracking-tight text-stone-900 font-serif">
              Notation Studio
            </span>
          </div>
        </div>

        {/* Application Menus */}
        <div className="relative flex items-center space-x-1 text-sm font-medium text-stone-700">
          {/* File Menu */}
          <div className="relative">
            <button
              id="menu-file-btn"
              onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
              className={`px-2.5 py-1 rounded-md text-xs tracking-wide transition-colors ${
                activeMenu === 'file' ? 'bg-stone-100 text-stone-900' : 'hover:bg-stone-100'
              }`}
            >
              File
            </button>
            {activeMenu === 'file' && (
              <div
                className="absolute left-0 top-full mt-1 w-56 bg-white border border-stone-200 rounded-lg shadow-lg py-1.5 z-50 text-xs text-stone-800 font-sans"
                onMouseLeave={() => setActiveMenu(null)}
              >
                <div className="px-3 py-1 text-[10px] uppercase font-semibold text-stone-600">
                  New Project
                </div>
                <button
                  onClick={() => {
                    onResetScore('blank');
                    setActiveMenu(null);
                    showToast('Created Blank Piano Score');
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-stone-50 flex items-center justify-between"
                >
                  <span>Blank Piano Score</span>
                  <span className="text-[10px] text-stone-600">Grand Staff</span>
                </button>
                <button
                  onClick={() => {
                    onResetScore('etude');
                    setActiveMenu(null);
                    showToast('Loaded Pianotastic Étude in C');
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-stone-50 flex items-center justify-between"
                >
                  <span>Pianotastic Étude in C</span>
                  <span className="text-[10px] text-stone-600">Sample</span>
                </button>
                <button
                  onClick={() => {
                    onResetScore('twinkle');
                    setActiveMenu(null);
                    showToast('Loaded Twinkle Little Star');
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-stone-50 flex items-center justify-between"
                >
                  <span>Twinkle Little Star</span>
                  <span className="text-[10px] text-stone-600">Sample</span>
                </button>
                <div className="my-1 border-t border-stone-100" />
                <div className="px-3 py-1 text-[10px] uppercase font-semibold text-stone-600">
                  Project Storage (.pianotastic)
                </div>
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setActiveMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-stone-50 flex items-center space-x-2"
                >
                  <Upload className="w-3.5 h-3.5 text-stone-500" />
                  <span>Open Project...</span>
                </button>
                <button
                  onClick={() => {
                    handleSaveProject();
                    setActiveMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-stone-50 flex items-center space-x-2"
                >
                  <Save className="w-3.5 h-3.5 text-stone-500" />
                  <span>Save Project (.pianotastic)</span>
                </button>
                <button
                  onClick={() => {
                    handleSaveAs();
                    setActiveMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-stone-50 flex items-center space-x-2"
                >
                  <Download className="w-3.5 h-3.5 text-stone-500" />
                  <span>Save As...</span>
                </button>
                <button
                  onClick={() => {
                    handleRevertAutosave();
                    setActiveMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-stone-50 flex items-center space-x-2 text-stone-700"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                  <span>Revert to Autosave</span>
                </button>
                <div className="my-1 border-t border-stone-100" />
                <div className="px-3 py-1 text-[10px] uppercase font-semibold text-stone-600">
                  Export Document
                </div>
                <button
                  onClick={() => {
                    ExportService.exportProfessionalScorePDF(score);
                    setActiveMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-stone-50 flex items-center space-x-2"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export Professional PDF</span>
                </button>
                <button
                  onClick={() => {
                    ExportService.exportPracticeSheetPDF(score);
                    setActiveMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-stone-50 flex items-center space-x-2"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                  <span>Export Practice Sheet PDF</span>
                </button>
                <button
                  onClick={() => {
                    ExportService.exportMusicXML(score);
                    setActiveMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-stone-50 flex items-center space-x-2"
                >
                  <FileMusic className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Export MusicXML (.musicxml)</span>
                </button>
                <button
                  onClick={() => {
                    ExportService.exportMIDI(score);
                    setActiveMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-stone-50 flex items-center space-x-2"
                >
                  <Music2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Export Standard MIDI (.mid)</span>
                </button>
                <button
                  onClick={() => {
                    ExportService.printScore();
                    setActiveMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-stone-50 flex items-center space-x-2"
                >
                  <Printer className="w-3.5 h-3.5 text-stone-600" />
                  <span>Print Score (Browser Print)</span>
                </button>
              </div>
            )}
          </div>

          {/* Edit Menu */}
          <div className="relative">
            <button
              id="menu-edit-btn"
              onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
              className={`px-2.5 py-1 rounded-md text-xs tracking-wide transition-colors ${
                activeMenu === 'edit' ? 'bg-stone-100 text-stone-900' : 'hover:bg-stone-100'
              }`}
            >
              Edit
            </button>
            {activeMenu === 'edit' && (
              <div
                className="absolute left-0 top-full mt-1 w-48 bg-white border border-stone-200 rounded-lg shadow-lg py-1.5 z-50 text-xs font-sans text-stone-800"
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button
                  onClick={() => {
                    onUndo();
                    setActiveMenu(null);
                  }}
                  disabled={!canUndo}
                  className="w-full px-3 py-1.5 text-left hover:bg-stone-50 flex items-center justify-between disabled:opacity-40"
                >
                  <span>Undo</span>
                  <span className="text-[10px] text-stone-600">Ctrl+Z</span>
                </button>
                <button
                  onClick={() => {
                    onRedo();
                    setActiveMenu(null);
                  }}
                  disabled={!canRedo}
                  className="w-full px-3 py-1.5 text-left hover:bg-stone-50 flex items-center justify-between disabled:opacity-40"
                >
                  <span>Redo</span>
                  <span className="text-[10px] text-stone-600">Ctrl+Y</span>
                </button>
                <div className="my-1 border-t border-stone-100" />
                <button
                  onClick={() => {
                    onResetLayout?.();
                    setActiveMenu(null);
                    showToast('Reset measures to automatic spacing');
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-stone-50 flex items-center space-x-2"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                  <span>Reset Measure Spacing</span>
                </button>
              </div>
            )}
          </div>

          {/* View Menu */}
          <div className="relative">
            <button
              id="menu-view-btn"
              onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
              className={`px-2.5 py-1 rounded-md text-xs tracking-wide transition-colors ${
                activeMenu === 'view' ? 'bg-stone-100 text-stone-900' : 'hover:bg-stone-100'
              }`}
            >
              View
            </button>
            {activeMenu === 'view' && (
              <div
                className="absolute left-0 top-full mt-1 w-56 bg-white border border-stone-200 rounded-lg shadow-lg py-1.5 z-50 text-xs font-sans text-stone-800"
                onMouseLeave={() => setActiveMenu(null)}
              >
                <div className="px-3 py-1 text-[10px] uppercase font-semibold text-stone-600">
                  Document View Mode
                </div>
                <button
                  onClick={() => {
                    onUpdateLearningLayer?.({ viewMode: 'professional', enabled: false });
                    setActiveMenu(null);
                    showToast('Professional Engraving View');
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-stone-50 flex items-center justify-between"
                >
                  <span>Professional Engraving</span>
                  {score.learningLayer?.viewMode !== 'practice_sheet' && <span>✓</span>}
                </button>
                <button
                  onClick={() => {
                    onUpdateLearningLayer?.({ viewMode: 'practice_sheet', enabled: true });
                    setActiveMenu(null);
                    showToast('Pianotastic Practice Sheet View');
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-stone-50 flex items-center justify-between"
                >
                  <span className="text-amber-900 font-medium">Pianotastic Practice Sheet</span>
                  {score.learningLayer?.viewMode === 'practice_sheet' && <span>✓</span>}
                </button>
                <div className="my-1 border-t border-stone-100" />
                <div className="px-3 py-1 text-[10px] uppercase font-semibold text-stone-600">
                  Orientation & Layout
                </div>
                <button
                  onClick={() => {
                    onUpdateLayout({ orientation: 'portrait' });
                    setActiveMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-stone-50 flex items-center justify-between"
                >
                  <span>Portrait Orientation</span>
                  {score.layoutSettings.orientation === 'portrait' && <span>✓</span>}
                </button>
                <button
                  onClick={() => {
                    onUpdateLayout({ orientation: 'landscape' });
                    setActiveMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-stone-50 flex items-center justify-between"
                >
                  <span>Landscape Orientation</span>
                  {score.layoutSettings.orientation === 'landscape' && <span>✓</span>}
                </button>
                <button
                  onClick={() => {
                    onUpdateLayout({ layoutMode: 'auto' });
                    setActiveMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-stone-50 flex items-center justify-between"
                >
                  <span>Automatic Measure Flow</span>
                  {score.layoutSettings.layoutMode === 'auto' && <span>✓</span>}
                </button>
                <div className="my-1 border-t border-stone-100" />
                <div className="px-3 py-1 text-[10px] uppercase font-semibold text-stone-600">
                  Zoom Presets
                </div>
                <div className="grid grid-cols-4 gap-1 px-3 py-1">
                  {[0.75, 1.0, 1.25, 1.5].map((z) => (
                    <button
                      key={z}
                      onClick={() => {
                        onUpdateLayout({ zoom: z });
                        setActiveMenu(null);
                      }}
                      className={`px-1 py-1 rounded text-center text-[11px] font-mono border ${
                        Math.abs(score.layoutSettings.zoom - z) < 0.05
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                      }`}
                    >
                      {Math.round(z * 100)}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Score Menu */}
          <div className="relative">
            <button
              id="menu-score-btn"
              onClick={() => setActiveMenu(activeMenu === 'score' ? null : 'score')}
              className={`px-2.5 py-1 rounded-md text-xs tracking-wide transition-colors ${
                activeMenu === 'score' ? 'bg-stone-100 text-stone-900' : 'hover:bg-stone-100'
              }`}
            >
              Score
            </button>
            {activeMenu === 'score' && (
              <div
                className="absolute left-0 top-full mt-1 w-52 bg-white border border-stone-200 rounded-lg shadow-lg py-1.5 z-50 text-xs font-sans text-stone-800"
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button
                  onClick={() => {
                    onAddMeasure?.();
                    setActiveMenu(null);
                    showToast('Added Measure');
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-stone-50 flex items-center space-x-2"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-stone-600" />
                  <span>Add Measure at End</span>
                </button>
                <button
                  onClick={() => {
                    onOpenCustomTimeSignature?.();
                    setActiveMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-stone-50 flex items-center space-x-2"
                >
                  <Clock className="w-3.5 h-3.5 text-stone-600" />
                  <span>Time Signature...</span>
                </button>
                <button
                  onClick={() => {
                    onOpenChordDialog?.();
                    setActiveMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-stone-50 flex items-center space-x-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Lead Sheet Chord Symbol...</span>
                </button>
              </div>
            )}
          </div>

          {/* Playback Menu */}
          <div className="relative">
            <button
              id="menu-playback-btn"
              onClick={() => setActiveMenu(activeMenu === 'playback' ? null : 'playback')}
              className={`px-2.5 py-1 rounded-md text-xs tracking-wide transition-colors ${
                activeMenu === 'playback' ? 'bg-stone-100 text-stone-900' : 'hover:bg-stone-100'
              }`}
            >
              Playback
            </button>
            {activeMenu === 'playback' && (
              <div
                className="absolute left-0 top-full mt-1 w-52 bg-white border border-stone-200 rounded-lg shadow-lg py-1.5 z-50 text-xs font-sans text-stone-800"
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button
                  onClick={() => {
                    onToggleVirtualPiano?.();
                    setActiveMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-stone-50 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <Piano className="w-3.5 h-3.5 text-stone-600" />
                    <span>Virtual Piano Keyboard</span>
                  </div>
                  {isVirtualPianoOpen && <span>✓</span>}
                </button>
              </div>
            )}
          </div>

          {/* Help Menu */}
          <button
            onClick={onOpenShortcuts}
            className="px-2 py-1 rounded-md text-xs tracking-wide hover:bg-stone-100 flex items-center space-x-1"
          >
            <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
            <span>Shortcuts</span>
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pianotastic,.json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Center: Interactive Score Title */}
      <div className="flex items-center justify-center">
        {isEditingTitle ? (
          <input
            type="text"
            value={titleValue}
            autoFocus
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={() => {
              setIsEditingTitle(false);
              onUpdateMetadata({ title: titleValue.trim() || 'Untitled' });
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditingTitle(false);
                onUpdateMetadata({ title: titleValue.trim() || 'Untitled' });
              }
            }}
            className="text-center font-serif text-sm font-semibold border-b border-stone-400 bg-stone-50 px-2 py-0.5 rounded outline-none w-64"
          />
        ) : (
          <div
            onClick={() => setIsEditingTitle(true)}
            className="cursor-pointer group flex items-center space-x-1.5 px-3 py-1 rounded-md hover:bg-stone-100 transition-colors"
            title="Click to edit score title"
          >
            <span className="font-serif text-sm font-medium text-stone-900">
              {score.metadata.title}
            </span>
            <span className="text-[10px] text-stone-600 opacity-0 group-hover:opacity-100 font-sans">
              Edit
            </span>
          </div>
        )}
      </div>

      {/* Right: Quick Actions & Zoom */}
      <div className="flex items-center space-x-2">
        {/* Undo / Redo */}
        <div className="flex items-center space-x-0.5 bg-stone-100 p-0.5 rounded-lg">
          <button
            id="undo-btn"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-md hover:bg-white text-stone-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            id="redo-btn"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded-md hover:bg-white text-stone-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-1 bg-stone-100 p-0.5 rounded-lg text-xs font-medium text-stone-700">
          <button
            onClick={() =>
              onUpdateLayout({
                zoom: Math.max(0.6, Math.round((score.layoutSettings.zoom - 0.1) * 10) / 10),
              })
            }
            title="Zoom Out"
            className="p-1.5 rounded-md hover:bg-white transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="w-10 text-center font-mono text-[11px]">
            {Math.round(score.layoutSettings.zoom * 100)}%
          </span>
          <button
            onClick={() =>
              onUpdateLayout({
                zoom: Math.min(1.8, Math.round((score.layoutSettings.zoom + 0.1) * 10) / 10),
              })
            }
            title="Zoom In"
            className="p-1.5 rounded-md hover:bg-white transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Educational View Mode Switcher */}
        <button
          id="view-mode-toggle-btn"
          onClick={() => {
            const currentMode = score.learningLayer?.viewMode || 'professional';
            const nextMode = currentMode === 'practice_sheet' ? 'professional' : 'practice_sheet';
            onUpdateLearningLayer?.({
              viewMode: nextMode,
              enabled: true,
            });
            showToast(nextMode === 'practice_sheet' ? 'Switched to Practice Sheet View' : 'Switched to Professional Score View');
          }}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            score.learningLayer?.viewMode === 'practice_sheet'
              ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
              : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
          }`}
          title="Toggle between Professional Engraving and Pianotastic Educational Practice Sheet"
        >
          {score.learningLayer?.viewMode === 'practice_sheet' ? (
            <>
              <GraduationCap className="w-3.5 h-3.5 text-amber-700" />
              <span className="font-serif">Practice Sheet</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-stone-500" />
              <span>Professional Score</span>
            </>
          )}
        </button>

        {/* Print / PDF button */}
        <button
          id="print-pdf-btn"
          onClick={() => ExportService.printScore()}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors shadow-xs"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / PDF</span>
        </button>
      </div>

      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="absolute bottom-[-3rem] left-1/2 -translate-x-1/2 bg-stone-900 text-white text-xs px-3.5 py-1.5 rounded-full shadow-lg flex items-center space-x-2 z-50 animate-in fade-in duration-200 pointer-events-none">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </header>
  );
};
