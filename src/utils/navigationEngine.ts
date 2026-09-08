import { Measure, TimeSignature, NavigationJump, NavigationTarget } from '../types/score';

export interface PlaybackStep {
  stepIndex: number;
  measureIndex: number;
  measureNumber: number;
  measureId: string;
  passNumber: number; // 1st pass, 2nd pass, etc.
  voltaEnding?: number;
  isFine?: boolean;
  bpm: number;
  timeSignature: TimeSignature;
  keySignature: string;
}

export interface NavigationValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  route: PlaybackStep[];
  routeSummary: string;
}

/**
 * Calculates the exact playback route following repeats, voltas, D.C., D.S., Coda, and Fine.
 * Strictly validates structures and prevents infinite loops.
 */
export function calculatePlaybackRoute(
  measures: Measure[],
  defaultBpm = 100,
  defaultTimeSig: TimeSignature = { numerator: 4, denominator: 4 },
  defaultKeySig = 'C_major'
): NavigationValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const route: PlaybackStep[] = [];

  if (!measures || measures.length === 0) {
    return {
      isValid: true,
      errors: [],
      warnings: ['Score has no measures to play.'],
      route: [],
      routeSummary: 'Empty',
    };
  }

  // Pre-scan indices for targets
  let segnoIdx = -1;
  let codaIdx = -1;
  let fineIdx = -1;
  let hasDS = false;
  let hasDC = false;
  let hasToCoda = false;

  measures.forEach((m, idx) => {
    if (m.navigationTarget === 'Segno') segnoIdx = idx;
    if (m.navigationTarget === 'Coda') codaIdx = idx;
    if (m.navigationTarget === 'Fine') fineIdx = idx;

    if (m.navigationJump?.startsWith('D.S.')) hasDS = true;
    if (m.navigationJump?.startsWith('D.C.')) hasDC = true;
    if (m.navigationJump === 'To Coda') hasToCoda = true;

    // Check barline repeats
    if (m.barlineType === 'repeat_start') {
      m.repeatStart = true;
    }
    if (m.barlineType === 'repeat_end' || m.barlineType === 'repeat_both') {
      m.repeatEnd = true;
    }
  });

  // Validation checks
  if (hasDS && segnoIdx === -1) {
    errors.push('Dal Segno (D.S.) instruction found, but no Segno (𝄋) target marker exists in the score.');
  }
  if (hasToCoda && codaIdx === -1) {
    errors.push('"To Coda" instruction found, but no Coda (𝄌) target marker exists in the score.');
  }
  if ((hasDS || hasDC) && measures.some((m) => m.navigationJump?.includes('al Fine')) && fineIdx === -1) {
    warnings.push('"al Fine" instruction found, but no "Fine" target marker was placed. Playback will continue to the end.');
  }

  // Volta structure check: check if volta 2 exists without volta 1
  const voltas = measures.filter((m) => m.voltaEnding).map((m) => m.voltaEnding!);
  if (voltas.includes(2) && !voltas.includes(1)) {
    warnings.push('A 2nd Ending exists without a 1st Ending.');
  }
  if (voltas.includes(3) && !voltas.includes(2)) {
    warnings.push('A 3rd Ending exists without a 2nd Ending.');
  }

  // State machine simulation
  let curMeasureIdx = 0;
  let safetyCounter = 0;
  const MAX_STEPS = 600; // Cap to prevent infinite loops

  // Repeat state tracking
  // Store pass count for active repeat sections
  let sectionStartIdx = 0;
  const repeatSectionPasses = new Map<number, number>(); // repeatEndIdx -> current pass completed

  let dcExecuted = false;
  let dsExecuted = false;
  let activeDCOrDSJump: NavigationJump = 'none';

  let inheritedBpm = defaultBpm;
  let inheritedTimeSig = defaultTimeSig;
  let inheritedKeySig = defaultKeySig;

  while (curMeasureIdx < measures.length && safetyCounter < MAX_STEPS) {
    safetyCounter++;
    const m = measures[curMeasureIdx];

    // Update tempo, time sig, key sig inheritance
    if (m.tempoBpm) inheritedBpm = m.tempoBpm;
    if (m.timeSignature) inheritedTimeSig = m.timeSignature;
    if (m.keySignature) inheritedKeySig = m.keySignature;

    // Check if this measure marks the beginning of a repeat section
    if (m.repeatStart) {
      sectionStartIdx = curMeasureIdx;
    }

    // Check if this measure has a Volta ending
    const currentPass = (repeatSectionPasses.get(findNextRepeatEndIdx(measures, curMeasureIdx)) || 0) + 1;

    // Check if we should skip this measure because of volta mismatch:
    // E.g. If m has voltaEnding = 1, but we are on pass 2, we should skip all measures in volta 1
    // and jump to volta 2!
    if (m.voltaEnding && m.voltaEnding !== currentPass) {
      // Find the measure that corresponds to currentPass volta, or after the repeat section
      const nextVoltaIdx = findMeasureForVoltaOrAfterRepeat(measures, curMeasureIdx, currentPass);
      if (nextVoltaIdx !== -1 && nextVoltaIdx !== curMeasureIdx) {
        curMeasureIdx = nextVoltaIdx;
        continue;
      }
    }

    // Record this step in route
    route.push({
      stepIndex: route.length,
      measureIndex: curMeasureIdx,
      measureNumber: m.measureNumber,
      measureId: m.id,
      passNumber: currentPass,
      voltaEnding: m.voltaEnding,
      isFine: (dcExecuted || dsExecuted) && activeDCOrDSJump.includes('al Fine') && m.navigationTarget === 'Fine',
      bpm: inheritedBpm,
      timeSignature: inheritedTimeSig,
      keySignature: inheritedKeySig,
    });

    // Check if we hit "Fine" during D.C. or D.S.
    if ((dcExecuted || dsExecuted) && activeDCOrDSJump.includes('al Fine') && m.navigationTarget === 'Fine') {
      // Reached Fine, stop playback
      break;
    }

    // Check if we hit "To Coda" during D.C. or D.S.
    if ((dcExecuted || dsExecuted) && activeDCOrDSJump.includes('al Coda') && m.navigationJump === 'To Coda') {
      if (codaIdx !== -1) {
        curMeasureIdx = codaIdx;
        continue;
      }
    }

    // Check Repeat End (:||)
    const isRepeatEnd = m.repeatEnd || m.barlineType === 'repeat_end' || m.barlineType === 'repeat_both';
    if (isRepeatEnd) {
      const maxPasses = m.repeatCount || 2;
      const completedPasses = (repeatSectionPasses.get(curMeasureIdx) || 0) + 1;
      repeatSectionPasses.set(curMeasureIdx, completedPasses);

      if (completedPasses < maxPasses) {
        // Jump back to repeat start
        curMeasureIdx = sectionStartIdx;
        continue;
      }
    }

    // Check D.C. (Da Capo)
    if (!dcExecuted && m.navigationJump && m.navigationJump.startsWith('D.C.')) {
      dcExecuted = true;
      activeDCOrDSJump = m.navigationJump;
      curMeasureIdx = 0; // Return to beginning
      continue;
    }

    // Check D.S. (Dal Segno)
    if (!dsExecuted && m.navigationJump && m.navigationJump.startsWith('D.S.')) {
      if (segnoIdx !== -1) {
        dsExecuted = true;
        activeDCOrDSJump = m.navigationJump;
        curMeasureIdx = segnoIdx; // Jump to Segno
        continue;
      }
    }

    // Normal advance
    curMeasureIdx++;
  }

  if (safetyCounter >= MAX_STEPS) {
    errors.push('Possible infinite repeat loop detected in navigation markers. Playback route was terminated early.');
  }

  // Generate summary string
  const routeSummary =
    route.length > 0
      ? route.map((s) => `M${s.measureNumber}${s.voltaEnding ? `[${s.voltaEnding}]` : ''}`).join(' → ')
      : 'None';

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    route,
    routeSummary,
  };
}

/**
 * Helper to locate the next repeat end boundary for an active section
 */
function findNextRepeatEndIdx(measures: Measure[], fromIdx: number): number {
  for (let i = fromIdx; i < measures.length; i++) {
    if (measures[i].repeatEnd || measures[i].barlineType === 'repeat_end' || measures[i].barlineType === 'repeat_both') {
      return i;
    }
  }
  return -1;
}

/**
 * Helper to jump past mismatched volta endings to the desired volta or post-repeat measure
 */
function findMeasureForVoltaOrAfterRepeat(measures: Measure[], currentIdx: number, targetVolta: number): number {
  // First look forward for a measure with voltaEnding === targetVolta
  for (let i = currentIdx; i < measures.length; i++) {
    if (measures[i].voltaEnding === targetVolta) {
      return i;
    }
    // If we passed the repeat end, and no matching volta was found, return next measure after repeat end
    if (measures[i].repeatEnd || measures[i].barlineType === 'repeat_end' || measures[i].barlineType === 'repeat_both') {
      return i + 1 < measures.length ? i + 1 : -1;
    }
  }
  return -1;
}
