import { NoteEvent, Pitch, Measure, Score, TempoBeatUnit } from '../types/score';
import { getMidiNote, midiToFrequency, getEventBeats } from '../utils/musicTheory';
import { calculatePlaybackRoute, PlaybackStep } from '../utils/navigationEngine';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private isPaused = false;
  private currentScore: Score | null = null;

  // Route-based playback
  private playbackRoute: PlaybackStep[] = [];
  private currentRouteIndex = 0;
  private playbackTimer: number | null = null;
  private scheduledEvents: { stop: () => void }[] = [];

  // Callbacks
  private onPositionUpdate: ((measureIndex: number, beat: number, stepIndex: number) => void) | null = null;
  private onStateChange: ((isPlaying: boolean) => void) | null = null;

  // Metronome & Audio settings
  private metronomeEnabled = true;
  private metronomeVolume = 0.7;
  private accentFirstBeat = true;
  private masterVolume = 0.85;

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMetronome(enabled: boolean) {
    this.metronomeEnabled = enabled;
  }

  public getMetronome(): boolean {
    return this.metronomeEnabled;
  }

  public setMetronomeVolume(vol: number) {
    this.metronomeVolume = Math.max(0, Math.min(1, vol));
  }

  public getMetronomeVolume(): number {
    return this.metronomeVolume;
  }

  public setAccentFirstBeat(accent: boolean) {
    this.accentFirstBeat = accent;
  }

  public getAccentFirstBeat(): boolean {
    return this.accentFirstBeat;
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public setPositionCallback(cb: (measureIndex: number, beat: number, stepIndex: number) => void) {
    this.onPositionUpdate = cb;
  }

  public setStateCallback(cb: (isPlaying: boolean) => void) {
    this.onStateChange = cb;
  }

  /**
   * Calculate effective quarter-note duration in seconds based on BPM and Beat Unit
   */
  public getQuarterNoteSec(bpm: number, beatUnit?: TempoBeatUnit): number {
    const validBpm = Math.max(30, Math.min(300, bpm || 100));
    switch (beatUnit) {
      case 'half':
        // Half note gets the beat => 1 half = 2 quarter notes = 60/BPM sec => 1 quarter note = 30/BPM sec
        return 30 / validBpm;
      case 'dotted_quarter':
        // Dotted quarter (compound time) gets the beat => 1.5 quarter notes = 60/BPM sec => 1 quarter = 40/BPM sec
        return 40 / validBpm;
      case 'quarter':
      default:
        return 60 / validBpm;
    }
  }

  /**
   * Synthesize an acoustic piano tone using multi-harmonic synthesis, envelope decay, and hammer transient
   */
  public playTone(freq: number, durationSec = 1.0, velocity = 0.8, timeOffset = 0) {
    try {
      const ctx = this.initContext();
      const startTime = ctx.currentTime + timeOffset;

      const masterGain = ctx.createGain();
      const effectiveGain = this.masterVolume * velocity;
      masterGain.gain.setValueAtTime(0, startTime);
      // Fast attack
      masterGain.gain.linearRampToValueAtTime(0.38 * effectiveGain, startTime + 0.007);
      // Realistic piano exponential decay
      masterGain.gain.exponentialRampToValueAtTime(0.14 * effectiveGain, startTime + Math.min(durationSec * 0.35, 0.3));
      masterGain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec + 0.18);

      // Low pass filter to simulate piano soundboard & string warmth
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(freq * 6, 8500), startTime);
      filter.frequency.exponentialRampToValueAtTime(Math.min(freq * 2.4, 4200), startTime + durationSec);

      // Harmonics (Fundamental, 2nd, 3rd, 4th, 5th harmonics)
      const harmonics = [
        { mult: 1, gain: 1.0 },
        { mult: 2, gain: 0.52 },
        { mult: 3, gain: 0.26 },
        { mult: 4, gain: 0.14 },
        { mult: 5, gain: 0.07 },
      ];

      const oscs: OscillatorNode[] = [];
      harmonics.forEach((h) => {
        const osc = ctx.createOscillator();
        osc.type = h.mult === 1 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq * h.mult, startTime);

        const hGain = ctx.createGain();
        hGain.gain.setValueAtTime(h.gain, startTime);

        osc.connect(hGain);
        hGain.connect(filter);
        oscs.push(osc);
      });

      // Subtle hammer noise transient (percussive click of piano hammer hitting string)
      const bufferSize = Math.floor(ctx.sampleRate * 0.022); // 22ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.005));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(Math.min(freq * 1.5, 4500), startTime);
      noiseFilter.Q.setValueAtTime(2.2, startTime);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.045 * effectiveGain, startTime);
      noise.connect(noiseFilter);
      noiseFilter.connect(masterGain);

      filter.connect(masterGain);
      masterGain.connect(ctx.destination);

      oscs.forEach((osc) => {
        osc.start(startTime);
        osc.stop(startTime + durationSec + 0.22);
      });
      noise.start(startTime);
      noise.stop(startTime + 0.025);

      return {
        stop: () => {
          try {
            masterGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
          } catch {
            // ignore
          }
        },
      };
    } catch {
      return { stop: () => {} };
    }
  }

  /**
   * Play metronome click with first beat accent respecting time signature
   */
  public playClick(isHighBeat: boolean, timeOffset = 0) {
    if (!this.metronomeEnabled || this.metronomeVolume <= 0) return;
    try {
      const ctx = this.initContext();
      const startTime = ctx.currentTime + timeOffset;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Pitch: high accented beat vs normal beat
      const freq = isHighBeat && this.accentFirstBeat ? 1650 : 960;
      osc.frequency.setValueAtTime(freq, startTime);

      const clickVolume = isHighBeat && this.accentFirstBeat
        ? 0.32 * this.metronomeVolume
        : 0.16 * this.metronomeVolume;

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(clickVolume, startTime + 0.0015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + (isHighBeat ? 0.05 : 0.038));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.055);
    } catch {
      // ignore
    }
  }

  public playPitch(pitch: Pitch, keySignatureId = 'C_major', durationSec = 0.6) {
    const midi = getMidiNote(pitch, keySignatureId);
    const freq = midiToFrequency(midi);
    return this.playTone(freq, durationSec);
  }

  public playNoteEvent(event: NoteEvent, keySignatureId = 'C_major', durationSec?: number) {
    if (event.type === 'rest' || event.pitches.length === 0) return;
    const dur = durationSec ?? Math.max(0.2, getEventBeats(event) * 0.5);
    event.pitches.forEach((pitch) => {
      this.playPitch(pitch, keySignatureId, dur);
    });
  }

  /**
   * Start playback of score from specific measure index or from beginning,
   * fully evaluating the navigation route (repeats, voltas, D.C., D.S., Coda, Fine).
   */
  public playScore(score: Score, startMeasureIndex = 0) {
    this.initContext();
    this.stopPlayback();
    this.currentScore = score;

    // Calculate full playback route
    const validation = calculatePlaybackRoute(
      score.measures,
      score.metadata.tempoBpm,
      score.metadata.initialTimeSignature,
      score.metadata.initialKeySignature
    );

    this.playbackRoute = validation.route;

    // Find the closest step in route matching startMeasureIndex
    let targetStepIdx = this.playbackRoute.findIndex((s) => s.measureIndex === startMeasureIndex);
    if (targetStepIdx === -1) targetStepIdx = 0;

    this.currentRouteIndex = targetStepIdx;
    this.isPlaying = true;
    this.isPaused = false;
    this.onStateChange?.(true);

    this.runPlaybackLoop();
  }

  private runPlaybackLoop() {
    if (!this.isPlaying || !this.currentScore || this.playbackRoute.length === 0) return;

    if (this.currentRouteIndex >= this.playbackRoute.length) {
      // Finished entire route
      this.stopPlayback();
      return;
    }

    const currentStep = this.playbackRoute[this.currentRouteIndex];
    const measure = this.currentScore.measures[currentStep.measureIndex];

    if (!measure) {
      this.stopPlayback();
      return;
    }

    // Determine measure parameters
    const keySig = currentStep.keySignature || measure.keySignature || this.currentScore.metadata.initialKeySignature || 'C_major';
    const bpm = measure.tempoBpm || currentStep.bpm || this.currentScore.metadata.tempoBpm || 100;
    const beatUnit = measure.tempoBeatUnit || this.currentScore.metadata.tempoBeatUnit || 'quarter';
    const quarterNoteSec = this.getQuarterNoteSec(bpm, beatUnit);

    const ts = measure.timeSignature || currentStep.timeSignature || this.currentScore.metadata.initialTimeSignature || { numerator: 4, denominator: 4 };
    const measureCapacityBeats = (ts.numerator * 4) / ts.denominator;
    const measureDurationSec = measureCapacityBeats * quarterNoteSec;

    // Report measure position to UI
    this.onPositionUpdate?.(currentStep.measureIndex, 0, this.currentRouteIndex);

    // Schedule metronome clicks for this measure respecting time signature
    for (let beat = 0; beat < ts.numerator; beat++) {
      const beatOffsetSec = beat * (4 / ts.denominator) * quarterNoteSec;
      // High click on beat 0
      this.playClick(beat === 0, beatOffsetSec);

      // Report fractional beat to UI for smooth playhead cursor
      if (beat > 0) {
        window.setTimeout(() => {
          if (this.isPlaying) {
            this.onPositionUpdate?.(currentStep.measureIndex, beat, this.currentRouteIndex);
          }
        }, beatOffsetSec * 1000);
      }
    }

    // Schedule RH & LH audio events
    this.scheduleStaffEvents(measure.rhEvents, keySig, quarterNoteSec);
    this.scheduleStaffEvents(measure.lhEvents, keySig, quarterNoteSec);

    // Stop if this step is "Fine"
    if (currentStep.isFine) {
      this.playbackTimer = window.setTimeout(() => {
        this.stopPlayback();
      }, measureDurationSec * 1000);
      return;
    }

    // Schedule next route step
    this.playbackTimer = window.setTimeout(() => {
      if (this.isPlaying) {
        this.currentRouteIndex++;
        this.runPlaybackLoop();
      }
    }, measureDurationSec * 1000);
  }

  private scheduleStaffEvents(events: NoteEvent[], keySig: string, quarterNoteSec: number) {
    let currentOffsetBeats = 0;
    events.forEach((ev) => {
      const beats = getEventBeats(ev);
      const timeOffsetSec = currentOffsetBeats * quarterNoteSec;
      const durationSec = beats * quarterNoteSec * 0.95;

      if (ev.type === 'note' && ev.pitches.length > 0) {
        ev.pitches.forEach((pitch) => {
          const midi = getMidiNote(pitch, keySig);
          const freq = midiToFrequency(midi);
          const handle = this.playTone(freq, durationSec, 0.78, timeOffsetSec);
          if (handle) {
            this.scheduledEvents.push(handle);
          }
        });
      }

      currentOffsetBeats += beats;
    });
  }

  public pausePlayback() {
    this.isPlaying = false;
    this.isPaused = true;
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
    this.scheduledEvents.forEach((e) => e.stop());
    this.scheduledEvents = [];
    this.onStateChange?.(false);
  }

  public stopPlayback() {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentRouteIndex = 0;
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
    this.scheduledEvents.forEach((e) => e.stop());
    this.scheduledEvents = [];
    this.onPositionUpdate?.(0, 0, 0);
    this.onStateChange?.(false);
  }

  public restartPlayback() {
    if (this.currentScore) {
      this.playScore(this.currentScore, 0);
    }
  }

  public jumpToPreviousMeasure() {
    if (!this.currentScore) return;
    const currentMIdx = this.playbackRoute[this.currentRouteIndex]?.measureIndex ?? 0;
    const prevMIdx = Math.max(0, currentMIdx - 1);
    if (this.isPlaying) {
      this.playScore(this.currentScore, prevMIdx);
    } else {
      this.onPositionUpdate?.(prevMIdx, 0, 0);
    }
  }

  public jumpToNextMeasure() {
    if (!this.currentScore) return;
    const currentMIdx = this.playbackRoute[this.currentRouteIndex]?.measureIndex ?? 0;
    const nextMIdx = Math.min(this.currentScore.measures.length - 1, currentMIdx + 1);
    if (this.isPlaying) {
      this.playScore(this.currentScore, nextMIdx);
    } else {
      this.onPositionUpdate?.(nextMIdx, 0, 0);
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public getCurrentRoute(): PlaybackStep[] {
    return this.playbackRoute;
  }
}

export const audioEngine = new AudioEngine();
