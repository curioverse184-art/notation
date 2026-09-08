import React from 'react';
import { Measure, NavigationJump, NavigationTarget, VoltaEnding } from '../../types/score';
import { Repeat, Flag, ArrowRightCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { calculatePlaybackRoute } from '../../utils/navigationEngine';

interface NavigationPaletteProps {
  activeMeasure: Measure | null;
  onUpdateMeasure: (measureId: string, patch: Partial<Measure>) => void;
  measures: Measure[];
  onClose?: () => void;
}

export const NavigationPalette: React.FC<NavigationPaletteProps> = ({
  activeMeasure,
  onUpdateMeasure,
  measures,
  onClose,
}) => {
  const routeValidation = React.useMemo(() => {
    return calculatePlaybackRoute(measures);
  }, [measures]);

  if (!activeMeasure) {
    return (
      <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center justify-between">
        <span>Select a measure in the score to apply repeat and navigation symbols.</span>
        {onClose && (
          <button onClick={onClose} className="font-semibold underline ml-2">
            Close
          </button>
        )}
      </div>
    );
  }

  const handleToggleRepeatStart = () => {
    const next = !activeMeasure.repeatStart;
    onUpdateMeasure(activeMeasure.id, {
      repeatStart: next,
      barlineType: next ? 'repeat_start' : activeMeasure.barlineType === 'repeat_start' ? 'single' : activeMeasure.barlineType,
    });
  };

  const handleToggleRepeatEnd = () => {
    const next = !activeMeasure.repeatEnd;
    onUpdateMeasure(activeMeasure.id, {
      repeatEnd: next,
      repeatCount: next ? activeMeasure.repeatCount || 2 : undefined,
      barlineType: next ? 'repeat_end' : activeMeasure.barlineType === 'repeat_end' ? 'single' : activeMeasure.barlineType,
    });
  };

  const handleSetVolta = (ending: VoltaEnding | 0) => {
    onUpdateMeasure(activeMeasure.id, {
      voltaEnding: ending === 0 ? undefined : ending,
    });
  };

  const handleSetJump = (jump: NavigationJump) => {
    onUpdateMeasure(activeMeasure.id, {
      navigationJump: jump,
    });
  };

  const handleSetTarget = (target: NavigationTarget) => {
    onUpdateMeasure(activeMeasure.id, {
      navigationTarget: target,
    });
  };

  return (
    <div
      id="navigation-tool-palette"
      className="bg-white border border-stone-300 rounded-xl shadow-md p-3.5 text-xs text-stone-800 space-y-3"
    >
      <div className="flex items-center justify-between border-b border-stone-200 pb-2">
        <div className="flex items-center space-x-2">
          <Repeat className="w-4 h-4 text-amber-600" />
          <span className="font-bold text-stone-900">
            Navigation Tool • Measure {activeMeasure.measureNumber}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 text-[11px] font-semibold"
          >
            Done
          </button>
        )}
      </div>

      {/* Repeats & Endings */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider">
          Repeats & Endings
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            id="nav-toggle-repeat-start"
            type="button"
            onClick={handleToggleRepeatStart}
            className={`py-1.5 px-2.5 rounded-lg border font-mono font-bold text-center flex items-center justify-center space-x-1.5 transition-colors ${
              activeMeasure.repeatStart
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white border-stone-300 text-stone-800 hover:bg-stone-50'
            }`}
          >
            <span>||:</span>
            <span className="text-xs font-sans font-medium">Repeat Start</span>
          </button>

          <button
            id="nav-toggle-repeat-end"
            type="button"
            onClick={handleToggleRepeatEnd}
            className={`py-1.5 px-2.5 rounded-lg border font-mono font-bold text-center flex items-center justify-center space-x-1.5 transition-colors ${
              activeMeasure.repeatEnd
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white border-stone-300 text-stone-800 hover:bg-stone-50'
            }`}
          >
            <span>:||</span>
            <span className="text-xs font-sans font-medium">Repeat End</span>
          </button>
        </div>

        {/* Repeat Count selector if repeat end is active */}
        {activeMeasure.repeatEnd && (
          <div className="flex items-center justify-between pt-1 px-1 text-xs">
            <span className="text-stone-600 font-medium">Repeat Count:</span>
            <div className="flex items-center space-x-1">
              {[2, 3, 4].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => onUpdateMeasure(activeMeasure.id, { repeatCount: cnt })}
                  className={`w-7 h-6 rounded text-xs font-bold border transition-colors ${
                    (activeMeasure.repeatCount || 2) === cnt
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {cnt}x
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Volta Endings (1st, 2nd, 3rd) */}
        <div className="pt-1.5">
          <div className="text-[11px] font-medium text-stone-600 mb-1">Volta / Alternate Endings:</div>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { val: 0 as const, label: 'None' },
              { val: 1 as const, label: '1st Ending' },
              { val: 2 as const, label: '2nd Ending' },
              { val: 3 as const, label: '3rd Ending' },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleSetVolta(item.val)}
                className={`py-1 rounded text-center text-xs font-semibold border transition-colors ${
                  (activeMeasure.voltaEnding || 0) === item.val
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Target Markers (Segno, Coda, Fine) */}
      <div className="space-y-1.5 pt-2 border-t border-stone-200">
        <div className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider">
          Target Markers
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: 'none' as const, label: 'None', glyph: '' },
            { id: 'Segno' as const, label: 'Segno', glyph: '𝄋' },
            { id: 'Coda' as const, label: 'Coda', glyph: '𝄌' },
            { id: 'Fine' as const, label: 'Fine', glyph: 'Fine' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSetTarget(item.id)}
              className={`py-1.5 px-1 rounded-md text-xs font-semibold border text-center transition-colors ${
                (activeMeasure.navigationTarget || 'none') === item.id
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                  : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-100'
              }`}
            >
              {item.glyph && <span className="font-serif mr-1">{item.glyph}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Jumps (D.C., D.S., To Coda) */}
      <div className="space-y-1.5 pt-2 border-t border-stone-200">
        <div className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider">
          Jump Instructions (At Measure End)
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'none' as const, label: 'None' },
            { id: 'To Coda' as const, label: 'To Coda 𝄌' },
            { id: 'D.C.' as const, label: 'D.C.' },
            { id: 'D.C. al Fine' as const, label: 'D.C. al Fine' },
            { id: 'D.C. al Coda' as const, label: 'D.C. al Coda' },
            { id: 'D.S.' as const, label: 'D.S.' },
            { id: 'D.S. al Fine' as const, label: 'D.S. al Fine' },
            { id: 'D.S. al Coda' as const, label: 'D.S. al Coda' },
          ].map((jump) => (
            <button
              key={jump.id}
              type="button"
              onClick={() => handleSetJump(jump.id)}
              className={`py-1 px-1.5 rounded-md text-xs font-semibold border text-center transition-colors ${
                (activeMeasure.navigationJump || 'none') === jump.id
                  ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                  : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-100'
              }`}
            >
              {jump.label}
            </button>
          ))}
        </div>
      </div>

      {/* Validation & Calculated Route Summary */}
      <div className="pt-2 border-t border-stone-200 space-y-1.5 bg-stone-50 p-2.5 rounded-lg text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-stone-800 flex items-center space-x-1">
            {routeValidation.isValid ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            )}
            <span>Playback Route Engine</span>
          </span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              routeValidation.isValid
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {routeValidation.isValid ? 'Valid Navigation' : 'Invalid Setup'}
          </span>
        </div>

        {routeValidation.errors.map((err, i) => (
          <div key={i} className="text-red-700 text-[11px] font-medium leading-tight">
            • {err}
          </div>
        ))}

        {routeValidation.warnings.map((wrn, i) => (
          <div key={i} className="text-amber-700 text-[11px] font-medium leading-tight">
            • {wrn}
          </div>
        ))}

        <div className="text-stone-600 font-mono text-[11px] break-words pt-1">
          <span className="text-stone-500 font-sans font-semibold">Route: </span>
          {routeValidation.routeSummary}
        </div>
      </div>
    </div>
  );
};
