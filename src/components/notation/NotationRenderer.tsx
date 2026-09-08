import React, { useState, useRef, useMemo } from 'react';
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
  NoteStep,
  LearningLayerSettings,
  DEFAULT_LEARNING_LAYER,
} from '../../types/score';
import {
  getStaffStepOffset,
  getLedgerLineOffsets,
  pitchFromDiatonicStepValue,
  KEY_SIGNATURES,
  getEventBeats,
  validateMeasureEvents,
  formatPitchName,
  getNoteSolfege,
} from '../../utils/musicTheory';
import {
  TrebleClefGlyph,
  BassClefGlyph,
  AccidentalGlyph,
  RestGlyph,
  NoteheadGlyph,
  GrandStaffBrace,
  TimeSignatureGlyph,
  SegnoGlyph,
  CodaGlyph,
  VoltaEndingBracket,
} from './MusicGlyphs';

interface NotationRendererProps {
  score: Score;
  toolMode: ToolMode;
  selectedDuration: NoteDuration;
  selectedAccidental: AccidentalType | null;
  activeHand: Hand;
  selection: SelectionState;
  playbackPosition: { measureIndex: number; beat: number } | null;
  onSelectMeasure: (measureId: string) => void;
  onSelectEvent: (measureId: string, staff: 'RH' | 'LH', eventId: string, pitchIndex?: number) => void;
  onInsertNote: (measureId: string, staff: 'RH' | 'LH', pitch: Pitch, beatOffset?: number) => void;
  onDeleteSelected: () => void;
  onMeasureWidthChange: (measureId: string, newWidth: number) => void;
  onMeasureContextMenu?: (measure: Measure, x: number, y: number) => void;
  onOpenNavigationPalette?: (measure: Measure) => void;
}

export const NotationRenderer: React.FC<NotationRendererProps> = ({
  score,
  toolMode,
  selectedDuration,
  selectedAccidental,
  activeHand,
  selection,
  playbackPosition,
  onSelectMeasure,
  onSelectEvent,
  onInsertNote,
  onMeasureWidthChange,
  onMeasureContextMenu,
  onOpenNavigationPalette,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverState, setHoverState] = useState<{
    measureId: string;
    staff: 'RH' | 'LH';
    pitch: Pitch;
    x: number;
    y: number;
  } | null>(null);

  const [resizingMeasureId, setResizingMeasureId] = useState<string | null>(null);
  const resizeStartXRef = useRef<number>(0);
  const resizeStartWidthRef = useRef<number>(0);

  // Dimensions & Layout constants
  const isLandscape = score.layoutSettings.orientation === 'landscape';
  const pageWidth = isLandscape ? 1120 : 860;
  const pageHeight = isLandscape ? 800 : 1160;
  const zoom = score.layoutSettings.zoom || 1.0;

  const staffMarginLeft = 68; // Space for brace, clefs, key sig, time sig
  const staffMarginRight = 30;
  const contentWidth = pageWidth - staffMarginLeft - staffMarginRight;

  const staffSpacing = 10; // 10px per staff space (staff height = 40px)
  const grandStaffGap = 65; // Distance between treble top and bass top
  const systemHeight = 165; // Total vertical space allocated per system

  // Group measures into systems (lines)
  const systems = useMemo(() => {
    const sysList: { measures: { measure: Measure; width: number; measureIdx: number }[] }[] = [];
    const layoutMode = score.layoutSettings.layoutMode;
    const autoPerSystem = score.layoutSettings.measuresPerSystemAuto || 3;

    let currentSystem: { measure: Measure; width: number; measureIdx: number }[] = [];
    let currentSystemWidth = 0;

    score.measures.forEach((m, idx) => {
      // Manual layout width or automatic width
      let mWidth = m.customWidth;
      if (layoutMode === 'auto' || !mWidth) {
        // Compute base width based on measure capacity and event counts
        const ts = m.timeSignature || score.metadata.initialTimeSignature;
        const totalNotes = Math.max(m.rhEvents.length, m.lhEvents.length, 2);
        mWidth = Math.max(160, totalNotes * 45 + (ts.numerator * 20));
      }

      const shouldBreak =
        (layoutMode === 'manual' && m.systemBreak) ||
        (layoutMode === 'auto' && (currentSystem.length >= autoPerSystem || currentSystemWidth + mWidth > contentWidth + 40));

      if (currentSystem.length > 0 && shouldBreak) {
        sysList.push({ measures: currentSystem });
        currentSystem = [];
        currentSystemWidth = 0;
      }

      currentSystem.push({ measure: m, width: mWidth, measureIdx: idx });
      currentSystemWidth += mWidth;
    });

    if (currentSystem.length > 0) {
      sysList.push({ measures: currentSystem });
    }

    // Proportional width expansion in Auto mode to neatly justify to right margin
    if (layoutMode === 'auto') {
      sysList.forEach((sys) => {
        const totalSysW = sys.measures.reduce((acc, item) => acc + item.width, 0);
        if (totalSysW > 0 && sys.measures.length > 1) {
          const ratio = contentWidth / totalSysW;
          sys.measures.forEach((item) => {
            item.width = Math.round(item.width * ratio);
          });
        } else if (sys.measures.length === 1) {
          sys.measures[0].width = contentWidth;
        }
      });
    }

    return sysList;
  }, [score.measures, score.layoutSettings, score.metadata.initialTimeSignature, contentWidth]);

  // Group systems into pages
  const pages = useMemo(() => {
    const systemsPerPage = isLandscape ? 3 : 5;
    const pageList: typeof systems[] = [];
    let curPage: typeof systems = [];

    systems.forEach((sys) => {
      const hasPageBreak = sys.measures.some((m) => m.measure.pageBreak);
      curPage.push(sys);
      if (curPage.length >= systemsPerPage || hasPageBreak) {
        pageList.push(curPage);
        curPage = [];
      }
    });

    if (curPage.length > 0) {
      pageList.push(curPage);
    }
    return pageList;
  }, [systems, isLandscape]);

  // Handle Staff Mouse Move (for note hover ghost and pitch calculation)
  const handleStaffMouseMove = (
    e: React.MouseEvent<SVGRectElement>,
    measureId: string,
    staff: 'RH' | 'LH',
    staffTopY: number,
    measureStartX: number
  ) => {
    if (toolMode !== 'note') {
      if (hoverState) setHoverState(null);
      return;
    }

    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;

    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    // Calculate staff step from middle line (line 3 = staffTopY + 20)
    const midLineY = staffTopY + 20;
    const diffY = midLineY - svgP.y;
    // Each step is 5px
    const stepOffset = Math.round(diffY / 5);

    // Diatonic pitch calculation from step offset
    const refStepVal =
      staff === 'RH'
        ? 4 * 7 + 6 // B4
        : 3 * 7 + 1; // D3

    const targetStepVal = refStepVal + stepOffset;
    const { step, octave } = pitchFromDiatonicStepValue(targetStepVal);

    const pitch: Pitch = {
      step,
      octave,
      accidental: selectedAccidental,
    };

    setHoverState({
      measureId,
      staff,
      pitch,
      x: svgP.x,
      y: midLineY - stepOffset * 5,
    });
  };

  // Handle Staff Click to Insert Note
  const handleStaffClick = (measureId: string, staff: 'RH' | 'LH') => {
    if (toolMode === 'note' && hoverState && hoverState.measureId === measureId) {
      onInsertNote(measureId, staff, hoverState.pitch);
    } else {
      onSelectMeasure(measureId);
      if (toolMode === 'navigation') {
        const found = score.measures.find((m) => m.id === measureId);
        if (found && onOpenNavigationPalette) {
          onOpenNavigationPalette(found);
        }
      }
    }
  };

  // Handle Drag Resize of Measure
  const handleResizeStart = (e: React.MouseEvent, measureId: string, currentWidth: number) => {
    e.stopPropagation();
    setResizingMeasureId(measureId);
    resizeStartXRef.current = e.clientX;
    resizeStartWidthRef.current = currentWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - resizeStartXRef.current) / zoom;
      const newW = Math.max(100, Math.round(resizeStartWidthRef.current + deltaX));
      onMeasureWidthChange(measureId, newW);
    };

    const handleMouseUp = () => {
      setResizingMeasureId(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={containerRef}
      id="score-canvas-container"
      className="w-full flex-1 overflow-auto bg-stone-100/70 p-6 flex flex-col items-center select-none"
      onMouseLeave={() => setHoverState(null)}
    >
      {pages.map((pageSystems, pageIdx) => (
        <div
          key={`page_${pageIdx}`}
          id={`score-page-${pageIdx + 1}`}
          className="relative bg-white shadow-md border border-stone-200/90 mb-10 transition-transform origin-top print:shadow-none print:border-none print:m-0 print:p-0"
          style={{
            width: `${pageWidth * zoom}px`,
            minHeight: `${pageHeight * zoom}px`,
            padding: `${score.layoutSettings.pageMargins.top * zoom}px ${score.layoutSettings.pageMargins.right * zoom}px ${score.layoutSettings.pageMargins.bottom * zoom}px ${score.layoutSettings.pageMargins.left * zoom}px`,
          }}
        >
          <svg
            viewBox={`0 0 ${pageWidth} ${pageHeight}`}
            width={pageWidth * zoom}
            height={pageHeight * zoom}
            className="score-page-svg w-full h-auto overflow-visible"
          >
            {/* Title and Composer Header (First page only) */}
            {pageIdx === 0 && (
              <g id="score-header" className="select-none">
                <text
                  x={pageWidth / 2}
                  y={48}
                  textAnchor="middle"
                  fontFamily="'Cinzel', 'Lora', Georgia, serif"
                  fontSize="28"
                  fontWeight="700"
                  letterSpacing="0.05em"
                  fill="#111111"
                >
                  {score.metadata.title}
                </text>
                {score.metadata.subtitle && (
                  <text
                    x={pageWidth / 2}
                    y={70}
                    textAnchor="middle"
                    fontFamily="'Lora', Georgia, serif"
                    fontSize="13"
                    fontStyle="italic"
                    fill="#444444"
                  >
                    {score.metadata.subtitle}
                  </text>
                )}
                <text
                  x={pageWidth - staffMarginRight}
                  y={76}
                  textAnchor="end"
                  fontFamily="'Plus Jakarta Sans', sans-serif"
                  fontSize="13"
                  fontWeight="600"
                  fill="#111111"
                >
                  {score.metadata.composer}
                </text>
                {score.metadata.lyricist && (
                  <text
                    x={staffMarginLeft}
                    y={76}
                    textAnchor="start"
                    fontFamily="'Plus Jakarta Sans', sans-serif"
                    fontSize="12"
                    fill="#555555"
                  >
                    {score.metadata.lyricist}
                  </text>
                )}
                {/* Tempo Mark */}
                <g transform={`translate(${staffMarginLeft}, 98)`}>
                  <text
                    x="0"
                    y="0"
                    fontFamily="'Lora', Georgia, serif"
                    fontSize="13"
                    fontWeight="600"
                    fill="#111111"
                  >
                    ♩ = {score.metadata.tempoBpm}
                  </text>
                </g>

                {/* Pianotastic Practice Sheet Mode Educational Header */}
                {score.learningLayer?.viewMode === 'practice_sheet' && (
                  <g className="pianotastic-practice-sheet-header pianotastic-learning-layer select-none">
                    <rect
                      x={staffMarginLeft}
                      y={94}
                      width={pageWidth - staffMarginLeft - staffMarginRight}
                      height={38}
                      fill="#fcfbf9"
                      stroke="#d6d3d1"
                      strokeWidth="1"
                      rx="4"
                    />
                    {/* Student Name */}
                    <text
                      x={staffMarginLeft + 12}
                      y={117}
                      fontFamily="'Plus Jakarta Sans', sans-serif"
                      fontSize="11"
                      fontWeight="700"
                      fill="#44403c"
                    >
                      Student: <tspan fontWeight="500" fill="#1c1917">{score.learningLayer?.studentName || '____________________'}</tspan>
                    </text>
                    {/* Lesson Date */}
                    <text
                      x={staffMarginLeft + 230}
                      y={117}
                      fontFamily="'Plus Jakarta Sans', sans-serif"
                      fontSize="11"
                      fontWeight="700"
                      fill="#44403c"
                    >
                      Date: <tspan fontWeight="500" fill="#1c1917">{score.learningLayer?.lessonDate || new Date().toISOString().split('T')[0]}</tspan>
                    </text>
                    {/* Practice Repetitions Checkboxes */}
                    <text
                      x={pageWidth - staffMarginRight - 160}
                      y={117}
                      fontFamily="'Plus Jakarta Sans', sans-serif"
                      fontSize="11"
                      fontWeight="700"
                      fill="#44403c"
                    >
                      Repetitions:
                    </text>
                    {Array.from({ length: score.learningLayer?.targetRepetitions || 5 }, (_, i) => i + 1).map((rep, idx) => (
                      <g key={`rep_${rep}`} transform={`translate(${pageWidth - staffMarginRight - 92 + idx * 17}, 108)`}>
                        <circle cx="5" cy="5" r="5" fill="#ffffff" stroke="#78716c" strokeWidth="1" />
                        <text
                          x="5"
                          y="7.5"
                          textAnchor="middle"
                          fontFamily="'Plus Jakarta Sans', sans-serif"
                          fontSize="7.5"
                          fontWeight="700"
                          fill="#57534e"
                        >
                          {rep}
                        </text>
                      </g>
                    ))}
                  </g>
                )}
              </g>
            )}

            {/* Academy Footer Branding */}
            {score.layoutSettings.showAcademyBranding && (
              <text
                x={pageWidth / 2}
                y={pageHeight - 34}
                textAnchor="middle"
                fontFamily="'Plus Jakarta Sans', sans-serif"
                fontSize="10"
                fontWeight="600"
                letterSpacing="0.06em"
                fill="#78716c"
              >
                {score.layoutSettings.academyFooterText || 'Pianotastic Academy — Pianotastic Notation Studio'}
              </text>
            )}

            {/* Page number footer */}
            <text
              x={pageWidth / 2}
              y={pageHeight - 18}
              textAnchor="middle"
              fontFamily="'Lora', Georgia, serif"
              fontSize="11"
              fill="#777777"
            >
              — {pageIdx + 1} —
            </text>

            {/* Render Each System in this page */}
            {pageSystems.map((sys, sysIdx) => {
              const firstPageTopOffset = score.learningLayer?.viewMode === 'practice_sheet' ? 148 : 116;
              const startY = (pageIdx === 0 ? firstPageTopOffset : 40) + sysIdx * systemHeight;
              const trebleTopY = startY;
              const bassTopY = startY + grandStaffGap;

              let currentX = staffMarginLeft;
              const isFirstSystem = sysIdx === 0 && pageIdx === 0;

              return (
                <g key={`sys_${sysIdx}`} id={`system-${sysIdx}`}>
                  {/* Grand Staff Brace & Left Bracket */}
                  <GrandStaffBrace x={currentX} yTop={trebleTopY} yBottom={bassTopY + 40} />

                  {/* Pianotastic Learning Layer: RH / LH Clef Labels */}
                  {score.learningLayer?.enabled && score.learningLayer?.showRH_LH && (
                    <g className="pianotastic-learning-layer select-none">
                      <text
                        x={currentX - 16}
                        y={trebleTopY + 22}
                        textAnchor="middle"
                        fontFamily="'Plus Jakarta Sans', sans-serif"
                        fontSize="9.5"
                        fontWeight="800"
                        letterSpacing="0.05em"
                        fill="#475569"
                      >
                        RH
                      </text>
                      <text
                        x={currentX - 16}
                        y={bassTopY + 22}
                        textAnchor="middle"
                        fontFamily="'Plus Jakarta Sans', sans-serif"
                        fontSize="9.5"
                        fontWeight="800"
                        letterSpacing="0.05em"
                        fill="#475569"
                      >
                        LH
                      </text>
                    </g>
                  )}

                  {/* Clefs for System start */}
                  <TrebleClefGlyph x={currentX + 6} y={trebleTopY - 14} scale={0.88} />
                  <BassClefGlyph x={currentX + 7} y={bassTopY} scale={0.88} />

                  {/* Initial Key Signature display at start of system */}
                  {renderKeySignatureGlyphs(
                    score.metadata.initialKeySignature,
                    currentX + 38,
                    trebleTopY,
                    bassTopY
                  )}

                  {/* Initial Time Signature on first system */}
                  {isFirstSystem && (
                    <>
                      <TimeSignatureGlyph
                        numerator={score.metadata.initialTimeSignature.numerator}
                        denominator={score.metadata.initialTimeSignature.denominator}
                        x={currentX + 56}
                        yStaffTop={trebleTopY}
                      />
                      <TimeSignatureGlyph
                        numerator={score.metadata.initialTimeSignature.numerator}
                        denominator={score.metadata.initialTimeSignature.denominator}
                        x={currentX + 56}
                        yStaffTop={bassTopY}
                      />
                    </>
                  )}

                  {/* Measures in System */}
                  {sys.measures.map(({ measure, width, measureIdx }) => {
                    const measureX = currentX;
                    currentX += width;
                    const isMeasureSelected = selection.measureId === measure.id;

                    const ts = measure.timeSignature || score.metadata.initialTimeSignature;
                    const rhValidation = validateMeasureEvents(measure.rhEvents, ts);
                    const lhValidation = validateMeasureEvents(measure.lhEvents, ts);
                    const isInvalidDuration = !rhValidation.isValid || !lhValidation.isValid;

                    return (
                      <g
                        key={measure.id}
                        id={`measure-${measure.measureNumber}`}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          onMeasureContextMenu?.(measure, e.clientX, e.clientY);
                        }}
                      >
                        {/* Measure selection background */}
                        {isMeasureSelected && (
                          <rect
                            x={measureX}
                            y={trebleTopY - 12}
                            width={width}
                            height={grandStaffGap + 40 + 24}
                            fill="#3b82f6"
                            fillOpacity="0.04"
                            stroke="#3b82f6"
                            strokeWidth="1.2"
                            strokeDasharray="3 3"
                            rx="4"
                          />
                        )}

                        {/* Measure Number */}
                        {score.layoutSettings.showMeasureNumbers && (
                          <text
                            x={measureX + 4}
                            y={trebleTopY - 6}
                            fontFamily="'Lora', Georgia, serif"
                            fontSize="11"
                            fontStyle="italic"
                            fontWeight="500"
                            fill={isInvalidDuration ? '#dc2626' : '#666666'}
                          >
                            {measure.measureNumber}
                            {isInvalidDuration && ' ⚠'}
                          </text>
                        )}

                        {/* Treble Staff 5 Lines */}
                        {[0, 1, 2, 3, 4].map((lineIndex) => (
                          <line
                            key={`rh_line_${lineIndex}`}
                            x1={measureX}
                            y1={trebleTopY + lineIndex * staffSpacing}
                            x2={measureX + width}
                            y2={trebleTopY + lineIndex * staffSpacing}
                            stroke="#111111"
                            strokeWidth="0.85"
                          />
                        ))}

                        {/* Bass Staff 5 Lines */}
                        {[0, 1, 2, 3, 4].map((lineIndex) => (
                          <line
                            key={`lh_line_${lineIndex}`}
                            x1={measureX}
                            y1={bassTopY + lineIndex * staffSpacing}
                            x2={measureX + width}
                            y2={bassTopY + lineIndex * staffSpacing}
                            stroke="#111111"
                            strokeWidth="0.85"
                          />
                        ))}

                        {/* Repeat Start (Left Edge of Measure) */}
                        {(measure.repeatStart ||
                          measure.barlineType === 'repeat_start' ||
                          measure.barlineType === 'repeat_both') && (
                          <g>
                            <line
                              x1={measureX}
                              y1={trebleTopY}
                              x2={measureX}
                              y2={bassTopY + 40}
                              stroke="#111111"
                              strokeWidth="3"
                            />
                            <line
                              x1={measureX + 4}
                              y1={trebleTopY}
                              x2={measureX + 4}
                              y2={bassTopY + 40}
                              stroke="#111111"
                              strokeWidth="1"
                            />
                            {/* Treble repeat start dots */}
                            <circle cx={measureX + 9} cy={trebleTopY + 15} r="2.2" fill="#111111" />
                            <circle cx={measureX + 9} cy={trebleTopY + 25} r="2.2" fill="#111111" />
                            {/* Bass repeat start dots */}
                            <circle cx={measureX + 9} cy={bassTopY + 15} r="2.2" fill="#111111" />
                            <circle cx={measureX + 9} cy={bassTopY + 25} r="2.2" fill="#111111" />
                          </g>
                        )}

                        {/* Bar lines (Right Edge) */}
                        {renderBarLine(
                          measure.barlineType,
                          measureX + width,
                          trebleTopY,
                          bassTopY + 40,
                          measure.repeatCount
                        )}

                        {/* Volta / Alternate Ending Bracket */}
                        {measure.voltaEnding && (
                          <VoltaEndingBracket
                            xStart={measureX}
                            width={width}
                            y={trebleTopY - 26}
                            endingNumber={measure.voltaEnding}
                            isClosedRight={measure.repeatEnd || measure.barlineType === 'repeat_end'}
                          />
                        )}

                        {/* Navigation Target Markers: Segno, Coda, Fine */}
                        {measure.navigationTarget === 'Segno' && (
                          <SegnoGlyph x={measureX + 12} y={trebleTopY - 20} scale={0.8} />
                        )}
                        {measure.navigationTarget === 'Coda' && (
                          <CodaGlyph x={measureX + 12} y={trebleTopY - 20} scale={0.8} />
                        )}
                        {measure.navigationTarget === 'Fine' && (
                          <text
                            x={measureX + width - 6}
                            y={trebleTopY - 10}
                            textAnchor="end"
                            fontFamily="'Lora', Georgia, serif"
                            fontSize="13"
                            fontStyle="italic"
                            fontWeight="700"
                            fill="#111111"
                          >
                            Fine
                          </text>
                        )}

                        {/* Navigation Jumps: To Coda, D.C., D.S. */}
                        {measure.navigationJump && measure.navigationJump !== 'none' && (
                          <text
                            x={measureX + width - 6}
                            y={trebleTopY - 10}
                            textAnchor="end"
                            fontFamily="'Lora', Georgia, serif"
                            fontSize="11.5"
                            fontStyle="italic"
                            fontWeight="700"
                            fill="#111111"
                          >
                            {measure.navigationJump}
                          </text>
                        )}

                        {/* Mid-score Measure Tempo Marking */}
                        {measure.tempoBpm && measure.measureNumber !== 1 && (
                          <text
                            x={measureX + 4}
                            y={trebleTopY - 18}
                            fontFamily="'Lora', Georgia, serif"
                            fontSize="12"
                            fontWeight="600"
                            fill="#111111"
                          >
                            {measure.tempoBeatUnit === 'half'
                              ? '𝅗𝅥'
                              : measure.tempoBeatUnit === 'dotted_quarter'
                              ? '♩.'
                              : '♩'}{' '}
                            = {measure.tempoBpm}
                          </text>
                        )}

                        {/* Chord Symbols above Treble Staff */}
                        {score.layoutSettings.showChordSymbols &&
                          measure.chordSymbols?.map((cs) => {
                            const csX = measureX + 24 + (cs.beatOffset * (width - 40)) / (ts.numerator || 4);
                            return (
                              <g
                                key={cs.id}
                                className="cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectMeasure(measure.id);
                                }}
                              >
                                <text
                                  x={csX}
                                  y={trebleTopY - 16}
                                  textAnchor="middle"
                                  fontFamily="'Plus Jakarta Sans', sans-serif"
                                  fontSize="13"
                                  fontWeight="700"
                                  fill="#111111"
                                >
                                  {cs.formatted}
                                </text>
                              </g>
                            );
                          })}

                        {/* Treble Events */}
                        {renderStaffEvents(
                          measure.rhEvents,
                          'RH',
                          measureX,
                          width,
                          trebleTopY,
                          measure.id,
                          selection,
                          score.layoutSettings,
                          score.metadata.initialKeySignature,
                          onSelectEvent,
                          score.learningLayer
                        )}

                        {/* Bass Events */}
                        {renderStaffEvents(
                          measure.lhEvents,
                          'LH',
                          measureX,
                          width,
                          bassTopY,
                          measure.id,
                          selection,
                          score.layoutSettings,
                          score.metadata.initialKeySignature,
                          onSelectEvent,
                          score.learningLayer
                        )}

                        {/* Measure-level Teacher Practice Note / Instruction */}
                        {score.learningLayer?.enabled &&
                          score.learningLayer?.showTeacherNotes &&
                          (measure.teacherNote || measure.practiceInstruction) && (
                            <g className="pianotastic-learning-layer select-none">
                              <rect
                                x={measureX + 4}
                                y={bassTopY + 54}
                                width={width - 8}
                                height={17}
                                fill="#fefce8"
                                stroke="#fde047"
                                strokeWidth="0.8"
                                rx="3"
                              />
                              <text
                                x={measureX + 8}
                                y={bassTopY + 66}
                                fontFamily="'Lora', Georgia, serif"
                                fontSize="9.5"
                                fontStyle="italic"
                                fontWeight="600"
                                fill="#854d0e"
                              >
                                ✍ {measure.teacherNote || measure.practiceInstruction}
                              </text>
                            </g>
                          )}

                        {/* Interactive Click Area for Treble Staff */}
                        <rect
                          x={measureX}
                          y={trebleTopY - 25}
                          width={width}
                          height={grandStaffGap - 10}
                          fill="transparent"
                          className={toolMode === 'note' ? 'cursor-crosshair' : 'cursor-pointer'}
                          onMouseMove={(e) =>
                            handleStaffMouseMove(e, measure.id, 'RH', trebleTopY, measureX)
                          }
                          onClick={() => handleStaffClick(measure.id, 'RH')}
                        />

                        {/* Interactive Click Area for Bass Staff */}
                        <rect
                          x={measureX}
                          y={bassTopY - 15}
                          width={width}
                          height={75}
                          fill="transparent"
                          className={toolMode === 'note' ? 'cursor-crosshair' : 'cursor-pointer'}
                          onMouseMove={(e) =>
                            handleStaffMouseMove(e, measure.id, 'LH', bassTopY, measureX)
                          }
                          onClick={() => handleStaffClick(measure.id, 'LH')}
                        />

                        {/* Layout Drag Handle (in Manual Mode, right boundary of measure) */}
                        {score.layoutSettings.layoutMode === 'manual' && isMeasureSelected && (
                          <g
                            transform={`translate(${measureX + width - 4}, ${trebleTopY - 8})`}
                            className="cursor-ew-resize opacity-90 hover:opacity-100"
                            onMouseDown={(e) => handleResizeStart(e, measure.id, width)}
                          >
                            <rect x="0" y="0" width="8" height={grandStaffGap + 56} rx="4" fill="#2563eb" />
                            <circle cx="4" cy={(grandStaffGap + 56) / 2} r="2.5" fill="#ffffff" />
                          </g>
                        )}

                        {/* Active Playhead cursor in current measure */}
                        {playbackPosition && playbackPosition.measureIndex === measureIdx && (
                          <line
                            x1={measureX + 20 + playbackPosition.beat * ((width - 30) / (ts.numerator || 4))}
                            y1={trebleTopY - 12}
                            x2={measureX + 20 + playbackPosition.beat * ((width - 30) / (ts.numerator || 4))}
                            y2={bassTopY + 48}
                            stroke="#ef4444"
                            strokeWidth="1.8"
                            strokeDasharray="4 2"
                            className="transition-all duration-75"
                          />
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* Note Placement Hover Ghost Notehead */}
            {hoverState && (
              <g className="pointer-events-none opacity-60">
                <NoteheadGlyph
                  duration={selectedDuration}
                  x={hoverState.x}
                  y={hoverState.y}
                  isHoverGhost={true}
                />
                {hoverState.pitch.accidental && (
                  <AccidentalGlyph
                    type={hoverState.pitch.accidental}
                    x={hoverState.x - 14}
                    y={hoverState.y}
                  />
                )}
                {/* Floating Pitch Badge */}
                <rect
                  x={hoverState.x - 16}
                  y={hoverState.y - 24}
                  width="32"
                  height="16"
                  rx="3"
                  fill="#1e293b"
                  fillOpacity="0.85"
                />
                <text
                  x={hoverState.x}
                  y={hoverState.y - 12}
                  textAnchor="middle"
                  fontFamily="'Plus Jakarta Sans', sans-serif"
                  fontSize="10"
                  fontWeight="600"
                  fill="#ffffff"
                >
                  {formatPitchName(hoverState.pitch)}
                </text>
              </g>
            )}
          </svg>
        </div>
      ))}
    </div>
  );
};

/**
 * Render Barline: single, double, end barline, repeats
 */
function renderBarLine(
  type: string,
  x: number,
  yTop: number,
  yBottom: number,
  repeatCount?: number
): React.ReactNode {
  const bassStaffTop = yBottom - 40;

  if (type === 'double') {
    return (
      <g>
        <line x1={x - 4} y1={yTop} x2={x - 4} y2={yBottom} stroke="#111111" strokeWidth="0.9" />
        <line x1={x} y1={yTop} x2={x} y2={yBottom} stroke="#111111" strokeWidth="0.9" />
      </g>
    );
  }
  if (type === 'end') {
    return (
      <g>
        <line x1={x - 4} y1={yTop} x2={x - 4} y2={yBottom} stroke="#111111" strokeWidth="0.9" />
        <line x1={x} y1={yTop} x2={x} y2={yBottom} stroke="#111111" strokeWidth="3" />
      </g>
    );
  }
  if (type === 'repeat_end' || type === 'repeat_both') {
    return (
      <g>
        {/* Treble repeat dots in spaces 2 & 3 */}
        <circle cx={x - 10} cy={yTop + 15} r="2.2" fill="#111111" />
        <circle cx={x - 10} cy={yTop + 25} r="2.2" fill="#111111" />
        {/* Bass repeat dots in spaces 2 & 3 */}
        <circle cx={x - 10} cy={bassStaffTop + 15} r="2.2" fill="#111111" />
        <circle cx={x - 10} cy={bassStaffTop + 25} r="2.2" fill="#111111" />
        <line x1={x - 4} y1={yTop} x2={x - 4} y2={yBottom} stroke="#111111" strokeWidth="1" />
        <line x1={x} y1={yTop} x2={x} y2={yBottom} stroke="#111111" strokeWidth="3" />
        {/* Repeat Count label if > 2 */}
        {repeatCount && repeatCount > 2 && (
          <text
            x={x - 2}
            y={yTop - 6}
            textAnchor="end"
            fontFamily="'Plus Jakarta Sans', sans-serif"
            fontSize="10.5"
            fontWeight="700"
            fill="#111111"
          >
            {repeatCount}x
          </text>
        )}
      </g>
    );
  }
  // Single barline default
  return <line x1={x} y1={yTop} x2={x} y2={yBottom} stroke="#111111" strokeWidth="0.9" />;
}

/**
 * Render Key Signature Glyphs at standard positions on both staves
 */
function renderKeySignatureGlyphs(
  keyId: string,
  x: number,
  trebleTopY: number,
  bassTopY: number
) {
  const keyInfo = KEY_SIGNATURES[keyId] || KEY_SIGNATURES['C_major'];
  if (keyInfo.fifths === 0) return null;

  // Sharps positions
  const trebleSharpOffsets = [
    { stepOffset: 4 }, // F5
    { stepOffset: 1 }, // C5
    { stepOffset: 5 }, // G5
    { stepOffset: 2 }, // D5
    { stepOffset: -1 }, // A4
    { stepOffset: 3 }, // E5
    { stepOffset: 0 }, // B4
  ];

  const bassSharpOffsets = [
    { stepOffset: 2 }, // F3
    { stepOffset: -1 }, // C3
    { stepOffset: 3 }, // G3
    { stepOffset: 0 }, // D3
    { stepOffset: -2 }, // A2
    { stepOffset: 1 }, // E3
    { stepOffset: -1 }, // B2
  ];

  // Flats positions
  const trebleFlatOffsets = [
    { stepOffset: 0 }, // B4
    { stepOffset: 3 }, // E5
    { stepOffset: -1 }, // A4
    { stepOffset: 2 }, // D5
    { stepOffset: -2 }, // G4
    { stepOffset: 1 }, // C5
    { stepOffset: -3 }, // F4
  ];

  const bassFlatOffsets = [
    { stepOffset: -1 }, // B2
    { stepOffset: 1 }, // E3
    { stepOffset: -2 }, // A2
    { stepOffset: 0 }, // D3
    { stepOffset: -3 }, // G2
    { stepOffset: -1 }, // C3
    { stepOffset: -4 }, // F2
  ];

  const isSharps = keyInfo.fifths > 0;
  const count = Math.abs(keyInfo.fifths);
  const glyphs: React.ReactNode[] = [];

  for (let i = 0; i < count; i++) {
    const glyphX = x + i * 9;
    const tOffset = isSharps ? trebleSharpOffsets[i].stepOffset : trebleFlatOffsets[i].stepOffset;
    const bOffset = isSharps ? bassSharpOffsets[i].stepOffset : bassFlatOffsets[i].stepOffset;

    // Treble accidental
    const tY = trebleTopY + 20 - tOffset * 5;
    glyphs.push(
      <AccidentalGlyph
        key={`key_t_${i}`}
        type={isSharps ? 'sharp' : 'flat'}
        x={glyphX}
        y={tY}
        scale={0.8}
      />
    );

    // Bass accidental
    const bY = bassTopY + 20 - bOffset * 5;
    glyphs.push(
      <AccidentalGlyph
        key={`key_b_${i}`}
        type={isSharps ? 'sharp' : 'flat'}
        x={glyphX}
        y={bY}
        scale={0.8}
      />
    );
  }

  return <g>{glyphs}</g>;
}

/**
 * Render Staff Events (Notes, Chords, Rests, Lyrics, Annotations)
 */
function renderStaffEvents(
  events: NoteEvent[],
  staff: 'RH' | 'LH',
  measureX: number,
  measureWidth: number,
  staffTopY: number,
  measureId: string,
  selection: SelectionState,
  layoutSettings: Score['layoutSettings'],
  keySig: string,
  onSelectEvent: (measureId: string, staff: 'RH' | 'LH', eventId: string, pitchIndex?: number) => void,
  learningLayer?: LearningLayerSettings
) {
  if (!events || events.length === 0) return null;

  const totalBeats = events.reduce((acc, ev) => acc + getEventBeats(ev), 0);
  let currentBeat = 0;

  return (
    <g>
      {events.map((ev, evIdx) => {
        const beats = getEventBeats(ev);
        // Distribute event horizontally based on beat position
        const availableW = measureWidth - 40;
        const eventX = measureX + 22 + (currentBeat / Math.max(totalBeats, 4)) * availableW;
        currentBeat += beats;

        const isEventSelected = selection.eventId === ev.id;

        // Render Rest
        if (ev.type === 'rest') {
          return (
            <g
              key={ev.id}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onSelectEvent(measureId, staff, ev.id);
              }}
            >
              {isEventSelected && (
                <rect
                  x={eventX - 10}
                  y={staffTopY + 4}
                  width="20"
                  height="32"
                  fill="#3b82f6"
                  fillOpacity="0.15"
                  rx="3"
                />
              )}
              <RestGlyph duration={ev.duration} x={eventX} y={staffTopY + 20} />
              {ev.isDotted && <circle cx={eventX + 9} cy={staffTopY + 15} r="2" fill="#111111" />}
            </g>
          );
        }

        // Render Note or Chord
        const pitches = ev.pitches;
        if (!pitches || pitches.length === 0) return null;

        // Calculate stem direction based on average offset
        const avgOffset =
          pitches.reduce((sum, p) => sum + getStaffStepOffset(p, staff), 0) / pitches.length;
        const stemDown = avgOffset >= 0;

        return (
          <g
            key={ev.id}
            className="cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              onSelectEvent(measureId, staff, ev.id);
            }}
          >
            {/* Event selection indicator */}
            {isEventSelected && (
              <rect
                x={eventX - 12}
                y={staffTopY - 20}
                width="24"
                height={80}
                fill="#3b82f6"
                fillOpacity="0.12"
                stroke="#3b82f6"
                strokeWidth="1"
                rx="3"
              />
            )}

            {/* Noteheads & Ledger Lines for each pitch */}
            {pitches.map((pitch, pIdx) => {
              const stepOffset = getStaffStepOffset(pitch, staff);
              const noteY = staffTopY + 20 - stepOffset * 5;
              const ledgers = getLedgerLineOffsets(stepOffset);

              return (
                <g key={`${ev.id}_p_${pIdx}`}>
                  {/* Ledger lines */}
                  {ledgers.map((lStep) => {
                    const lY = staffTopY + 20 - lStep * 5;
                    return (
                      <line
                        key={`ledger_${lStep}`}
                        x1={eventX - 10}
                        y1={lY}
                        x2={eventX + 10}
                        y2={lY}
                        stroke="#111111"
                        strokeWidth="0.9"
                      />
                    );
                  })}

                  {/* Accidental */}
                  {pitch.accidental && (
                    <AccidentalGlyph
                      type={pitch.accidental}
                      x={eventX - 13}
                      y={noteY}
                      scale={0.9}
                    />
                  )}

                  {/* Notehead */}
                  <NoteheadGlyph
                    duration={ev.duration}
                    x={eventX}
                    y={noteY}
                    isSelected={isEventSelected}
                  />

                  {/* Dotted note dot */}
                  {ev.isDotted && (
                    <circle
                      cx={eventX + 10}
                      cy={stepOffset % 2 === 0 ? noteY - 3 : noteY}
                      r="2"
                      fill="#111111"
                    />
                  )}

                  {/* Learning Annotation Layer: Note Name (e.g. C4, D4) */}
                  {layoutSettings.showAnnotations && layoutSettings.showNoteNames && (
                    <text
                      x={eventX}
                      y={staff === 'RH' ? noteY - 10 : noteY + 16}
                      textAnchor="middle"
                      fontFamily="'Plus Jakarta Sans', sans-serif"
                      fontSize="9"
                      fontWeight="600"
                      fill="#2563eb"
                    >
                      {formatPitchName(pitch, keySig)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Stem (for half, quarter, 8th, 16th, 32nd notes) */}
            {ev.duration !== 'whole' && (
              <g>
                {(() => {
                  const offsets = pitches.map((p) => getStaffStepOffset(p, staff));
                  const minOffset = Math.min(...offsets);
                  const maxOffset = Math.max(...offsets);
                  const stemLength = 28;

                  if (stemDown) {
                    const topY = staffTopY + 20 - maxOffset * 5;
                    const stemX = eventX - 5.8;
                    const botY = topY + stemLength;
                    return (
                      <g>
                        <line
                          x1={stemX}
                          y1={topY}
                          x2={stemX}
                          y2={botY}
                          stroke={isEventSelected ? '#1d4ed8' : '#111111'}
                          strokeWidth="1.2"
                        />
                        {/* Flags for stem down */}
                        {ev.duration === 'eighth' && (
                          <path
                            d={`M ${stemX} ${botY} C ${stemX + 5} ${botY - 7} ${stemX + 8} ${botY - 14} ${stemX + 3} ${botY - 18}`}
                            stroke="#111111"
                            strokeWidth="1.6"
                            fill="none"
                          />
                        )}
                        {ev.duration === 'sixteenth' && (
                          <g>
                            <path
                              d={`M ${stemX} ${botY} C ${stemX + 5} ${botY - 7} ${stemX + 8} ${botY - 14} ${stemX + 3} ${botY - 18}`}
                              stroke="#111111"
                              strokeWidth="1.6"
                              fill="none"
                            />
                            <path
                              d={`M ${stemX} ${botY - 5} C ${stemX + 5} ${botY - 12} ${stemX + 8} ${botY - 19} ${stemX + 3} ${botY - 23}`}
                              stroke="#111111"
                              strokeWidth="1.6"
                              fill="none"
                            />
                          </g>
                        )}
                      </g>
                    );
                  } else {
                    const botY = staffTopY + 20 - minOffset * 5;
                    const stemX = eventX + 5.8;
                    const topY = botY - stemLength;
                    return (
                      <g>
                        <line
                          x1={stemX}
                          y1={botY}
                          x2={stemX}
                          y2={topY}
                          stroke={isEventSelected ? '#1d4ed8' : '#111111'}
                          strokeWidth="1.2"
                        />
                        {/* Flags for stem up */}
                        {ev.duration === 'eighth' && (
                          <path
                            d={`M ${stemX} ${topY} C ${stemX + 5} ${topY + 7} ${stemX + 8} ${topY + 14} ${stemX + 3} ${topY + 18}`}
                            stroke="#111111"
                            strokeWidth="1.6"
                            fill="none"
                          />
                        )}
                        {ev.duration === 'sixteenth' && (
                          <g>
                            <path
                              d={`M ${stemX} ${topY} C ${stemX + 5} ${topY + 7} ${stemX + 8} ${topY + 14} ${stemX + 3} ${topY + 18}`}
                              stroke="#111111"
                              strokeWidth="1.6"
                              fill="none"
                            />
                            <path
                              d={`M ${stemX} ${topY + 5} C ${stemX + 5} ${topY + 12} ${stemX + 8} ${topY + 19} ${stemX + 3} ${topY + 23}`}
                              stroke="#111111"
                              strokeWidth="1.6"
                              fill="none"
                            />
                          </g>
                        )}
                      </g>
                    );
                  }
                })()}
              </g>
            )}

            {/* Articulations (Staccato, Accent, Tenuto, Fermata) */}
            {ev.articulation && ev.articulation !== 'none' && (
              <g className="select-none pointer-events-none">
                {ev.articulation === 'staccato' && (
                  <circle
                    cx={eventX}
                    cy={stemDown ? staffTopY + 20 - Math.min(...pitches.map(p => getStaffStepOffset(p, staff))) * 5 + 10 : staffTopY + 20 - Math.max(...pitches.map(p => getStaffStepOffset(p, staff))) * 5 - 10}
                    r="2.2"
                    fill="#111111"
                  />
                )}
                {ev.articulation === 'accent' && (
                  <text
                    x={eventX}
                    y={stemDown ? staffTopY + 20 - Math.min(...pitches.map(p => getStaffStepOffset(p, staff))) * 5 + 15 : staffTopY + 20 - Math.max(...pitches.map(p => getStaffStepOffset(p, staff))) * 5 - 8}
                    textAnchor="middle"
                    fontFamily="'Lora', Georgia, serif"
                    fontSize="13"
                    fontWeight="800"
                    fill="#111111"
                  >
                    &gt;
                  </text>
                )}
                {ev.articulation === 'tenuto' && (
                  <line
                    x1={eventX - 6}
                    y1={stemDown ? staffTopY + 20 - Math.min(...pitches.map(p => getStaffStepOffset(p, staff))) * 5 + 9 : staffTopY + 20 - Math.max(...pitches.map(p => getStaffStepOffset(p, staff))) * 5 - 9}
                    x2={eventX + 6}
                    y2={stemDown ? staffTopY + 20 - Math.min(...pitches.map(p => getStaffStepOffset(p, staff))) * 5 + 9 : staffTopY + 20 - Math.max(...pitches.map(p => getStaffStepOffset(p, staff))) * 5 - 9}
                    stroke="#111111"
                    strokeWidth="1.6"
                  />
                )}
                {ev.articulation === 'fermata' && (
                  <text
                    x={eventX}
                    y={staffTopY - 14}
                    textAnchor="middle"
                    fontFamily="'Lora', Georgia, serif"
                    fontSize="17"
                    fill="#111111"
                  >
                    𝄐
                  </text>
                )}
              </g>
            )}

            {/* Pianotastic Learning Layer Annotations */}
            {learningLayer?.enabled && (
              <g className="pianotastic-learning-layer select-none pointer-events-none">
                {(() => {
                  const pos = learningLayer.position || 'above_notes';
                  const maxStep = Math.max(...pitches.map(p => getStaffStepOffset(p, staff)));
                  const minStep = Math.min(...pitches.map(p => getStaffStepOffset(p, staff)));
                  const topNoteY = staffTopY + 20 - maxStep * 5;
                  const bottomNoteY = staffTopY + 20 - minStep * 5;

                  let baseY: number;
                  let lineDelta = 11;

                  if (pos === 'above_notes') {
                    baseY = Math.min(staffTopY - 14, topNoteY - 16);
                    lineDelta = -12; // stack upwards
                  } else if (pos === 'below_notes') {
                    baseY = Math.max(staffTopY + 54, bottomNoteY + 18);
                    lineDelta = 12; // stack downwards
                  } else if (pos === 'above_staff') {
                    baseY = staffTopY - 12;
                    lineDelta = -12;
                  } else { // 'below_staff'
                    baseY = staffTopY + 54;
                    lineDelta = 12;
                  }

                  let currentLineY = baseY;
                  const elements: React.ReactNode[] = [];

                  // 1. Finger Number (1-5)
                  if (learningLayer.showFingerNumbers && ev.fingerNumber) {
                    elements.push(
                      <text
                        key="finger"
                        x={eventX}
                        y={currentLineY}
                        textAnchor="middle"
                        fontFamily="'Lora', Georgia, serif"
                        fontSize="12"
                        fontStyle="italic"
                        fontWeight="700"
                        fill="#111111"
                      >
                        {ev.fingerNumber}
                      </text>
                    );
                    currentLineY += lineDelta;
                  }

                  // 2. Note Name (C, D, E, F...) or Solfege (Do, Re, Mi...)
                  if (learningLayer.showNoteNames || learningLayer.showSolfege) {
                    const primaryPitch = pitches[0];
                    const label = learningLayer.showSolfege
                      ? getNoteSolfege(primaryPitch.step, primaryPitch.accidental)
                      : primaryPitch.step;

                    elements.push(
                      <text
                        key="note_name"
                        x={eventX}
                        y={currentLineY}
                        textAnchor="middle"
                        fontFamily="'Plus Jakarta Sans', sans-serif"
                        fontSize="10"
                        fontWeight="700"
                        fill="#2563eb"
                      >
                        {label}
                      </text>
                    );
                    currentLineY += lineDelta;
                  }

                  // 3. Beat Number (1, 2, 3, 4) or Practice Count (1 &, 2 &)
                  if (learningLayer.showBeatNumbers || learningLayer.showPracticeCounts) {
                    const beatVal = Math.floor(currentBeat - beats) + 1;
                    const isOffbeat = ((currentBeat - beats) % 1) >= 0.45;
                    const countLabel = learningLayer.showPracticeCounts
                      ? (isOffbeat ? '&' : `${beatVal}`)
                      : `${beatVal}`;

                    elements.push(
                      <text
                        key="beat_count"
                        x={eventX}
                        y={currentLineY}
                        textAnchor="middle"
                        fontFamily="'Plus Jakarta Sans', sans-serif"
                        fontSize="9"
                        fontWeight="600"
                        fill="#059669"
                      >
                        {countLabel}
                      </text>
                    );
                    currentLineY += lineDelta;
                  }

                  // 4. Custom Teacher Note on Event
                  if (learningLayer.showTeacherNotes && ev.teacherNote) {
                    elements.push(
                      <text
                        key="teacher_note"
                        x={eventX}
                        y={currentLineY}
                        textAnchor="middle"
                        fontFamily="'Lora', Georgia, serif"
                        fontSize="9"
                        fontStyle="italic"
                        fontWeight="600"
                        fill="#b45309"
                      >
                        {ev.teacherNote}
                      </text>
                    );
                    currentLineY += lineDelta;
                  }

                  return elements;
                })()}
              </g>
            )}

            {/* Standard fingering if learning layer is disabled but layout fingering is enabled */}
            {!learningLayer?.enabled && layoutSettings.showAnnotations && layoutSettings.showFingering && ev.fingerNumber && (
              <text
                x={eventX}
                y={staff === 'RH' ? staffTopY - 7 : staffTopY + 51}
                textAnchor="middle"
                fontFamily="'Lora', Georgia, serif"
                fontSize="11"
                fontStyle="italic"
                fontWeight="700"
                fill="#111111"
              >
                {ev.fingerNumber}
              </text>
            )}

            {/* Lyrics Layer underneath the notes */}
            {layoutSettings.showLyrics && ev.lyricSyllable && (
              <g>
                <text
                  x={eventX}
                  y={staffTopY + 56}
                  textAnchor="middle"
                  fontFamily="'Lora', 'Noto Sans Bengali', 'Noto Sans Devanagari', serif"
                  fontSize="12"
                  fill="#111111"
                >
                  {ev.lyricSyllable}
                </text>
                {/* Syllable hyphen separator */}
                {ev.lyricHyphen && (
                  <line
                    x1={eventX + 10}
                    y1={staffTopY + 52}
                    x2={eventX + 22}
                    y2={staffTopY + 52}
                    stroke="#555555"
                    strokeWidth="1.2"
                  />
                )}
                {/* Melisma extender line */}
                {ev.lyricMelisma && (
                  <line
                    x1={eventX + 16}
                    y1={staffTopY + 54}
                    x2={eventX + 36}
                    y2={staffTopY + 54}
                    stroke="#111111"
                    strokeWidth="1"
                  />
                )}
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}
