import React from 'react';
import { AccidentalType, NoteDuration } from '../../types/score';

/**
 * Treble Clef (G-Clef) SVG Path
 * Centered on G line (line 2 of treble staff)
 */
export const TrebleClefGlyph: React.FC<{ x: number; y: number; scale?: number }> = ({
  x,
  y,
  scale = 1,
}) => {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <path
        d="M 12 44 C 11.5 43.5 11 41 11 39 C 11 34 14 30 18 27 C 22 24 23 20 22 17 C 21 13 18 11 15 11 C 11 11 8 13.5 8 18 C 8 20 9 22 11 23 C 12 24 13 25 13 26 C 13 27 12 28 11 28 C 9 28 6 25 6 20 C 6 13 10 7 17 7 C 23 7 28 11 28 18 C 28 23 25 28 20 32 C 16 35 15 37 15 40 C 15 42 16 43 18 43 C 21 43 24 40 24 35 C 24 31 22 28 19 28 C 18 28 17 29 17 29 C 16 29 16 28 17 27 C 18 26 21 25 24 26 C 28 27 30 31 30 36 C 30 43 24 47 18 47 C 15 47 13 46 12 44 Z M 16 52 C 16 54 15 56 13 56 C 11 56 10 54 10 52 C 10 50 11 48 13 48 C 15 48 16 50 16 52 Z"
        fill="#111111"
      />
      <path
        d="M 19 8 L 19 46 C 19 51 17 56 13 56"
        stroke="#111111"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </g>
  );
};

/**
 * Bass Clef (F-Clef) SVG Path
 * Centered on F line (line 4 of bass staff)
 */
export const BassClefGlyph: React.FC<{ x: number; y: number; scale?: number }> = ({
  x,
  y,
  scale = 1,
}) => {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <path
        d="M 6 12 C 6 8 9 5 13 5 C 19 5 24 9 24 16 C 24 24 17 31 9 36 L 8 34 C 14 30 20 23 20 17 C 20 12 17 9 13 9 C 10 9 8 11 8 13 C 8 15 9 16 11 16 C 12 16 13 15 13 14 C 13 13 12 12 11 12 C 10 12 9 12 9 12 Z"
        fill="#111111"
      />
      {/* Bass clef two dots flanking F line (line 4) */}
      <circle cx="28" cy="11" r="2.2" fill="#111111" />
      <circle cx="28" cy="19" r="2.2" fill="#111111" />
    </g>
  );
};

/**
 * Accidental Glyphs
 */
export const AccidentalGlyph: React.FC<{
  type: AccidentalType;
  x: number;
  y: number;
  scale?: number;
}> = ({ type, x, y, scale = 1 }) => {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {type === 'sharp' && (
        <g stroke="#111111" strokeWidth="1.2" strokeLinecap="round">
          {/* Vertical lines */}
          <line x1="3" y1="-8" x2="3" y2="8" />
          <line x1="8" y1="-10" x2="8" y2="6" />
          {/* Slanted crossbars */}
          <line x1="0" y1="-1" x2="11" y2="-4" strokeWidth="2.4" />
          <line x1="0" y1="4" x2="11" y2="1" strokeWidth="2.4" />
        </g>
      )}
      {type === 'flat' && (
        <g fill="#111111">
          {/* Vertical stem */}
          <rect x="2" y="-11" width="1.4" height="15" rx="0.5" />
          {/* Curved belly */}
          <path d="M 3.2 -1 C 5.5 -2.5 8 -1 8 1.5 C 8 4 5.5 5 3.2 3.5 Z" />
        </g>
      )}
      {type === 'natural' && (
        <g stroke="#111111" strokeWidth="1.3" strokeLinecap="square">
          <line x1="3" y1="-8" x2="3" y2="4" />
          <line x1="8" y1="-4" x2="8" y2="8" />
          <line x1="3" y1="-3" x2="8" y2="-1" strokeWidth="2.2" />
          <line x1="3" y1="2" x2="8" y2="4" strokeWidth="2.2" />
        </g>
      )}
      {type === 'double_sharp' && (
        <g fill="#111111">
          <path d="M 2 -4 L 8 4 M 8 -4 L 2 4" stroke="#111111" strokeWidth="2.8" strokeLinecap="square" />
          <rect x="1" y="-5" width="2" height="2" />
          <rect x="7" y="-5" width="2" height="2" />
          <rect x="1" y="3" width="2" height="2" />
          <rect x="7" y="3" width="2" height="2" />
        </g>
      )}
      {type === 'double_flat' && (
        <g fill="#111111">
          {/* First flat */}
          <rect x="0" y="-11" width="1.3" height="15" rx="0.5" />
          <path d="M 1.2 -1 C 3.2 -2.5 5.5 -1 5.5 1.5 C 5.5 4 3.2 5 1.2 3.5 Z" />
          {/* Second flat */}
          <rect x="6" y="-11" width="1.3" height="15" rx="0.5" />
          <path d="M 7.2 -1 C 9.2 -2.5 11.5 -1 11.5 1.5 C 11.5 4 9.2 5 7.2 3.5 Z" />
        </g>
      )}
    </g>
  );
};

/**
 * Rest Glyphs
 */
export const RestGlyph: React.FC<{
  duration: NoteDuration;
  x: number;
  y: number; // staff reference line 3 (middle line)
}> = ({ duration, x, y }) => {
  if (duration === 'whole') {
    // Hanging from line 4 (which is y - 10px in standard 10px staff spacing)
    return <rect x={x - 6} y={y - 10} width={12} height={5} fill="#111111" />;
  }
  if (duration === 'half') {
    // Sitting on line 3 (which is y in standard 10px staff spacing)
    return <rect x={x - 6} y={y - 5} width={12} height={5} fill="#111111" />;
  }
  if (duration === 'quarter') {
    return (
      <g transform={`translate(${x - 4}, ${y - 14}) scale(0.9)`}>
        <path
          d="M 3 2 L 8 9 L 2 15 C 2 15 7 16 8 19 C 9 22 7 24 5 25 C 3 26 1 25 1 23 C 1 21 3 21 4 22 C 3 20 2 18 4 16 L 1 14 L 7 7 L 3 2 Z"
          fill="#111111"
        />
      </g>
    );
  }
  if (duration === 'eighth') {
    return (
      <g transform={`translate(${x - 4}, ${y - 10}) scale(0.85)`}>
        <circle cx="2" cy="5" r="2.5" fill="#111111" />
        <path d="M 3 5 C 6 4 9 7 9 12 L 6 22" stroke="#111111" strokeWidth="1.8" fill="none" />
      </g>
    );
  }
  if (duration === 'sixteenth') {
    return (
      <g transform={`translate(${x - 4}, ${y - 14}) scale(0.85)`}>
        <circle cx="2" cy="5" r="2.2" fill="#111111" />
        <path d="M 3 5 C 6 4 9 7 9 12" stroke="#111111" strokeWidth="1.8" fill="none" />
        <circle cx="2" cy="11" r="2.2" fill="#111111" />
        <path d="M 3 11 C 6 10 9 13 9 18 L 6 26" stroke="#111111" strokeWidth="1.8" fill="none" />
      </g>
    );
  }
  // thirty_second
  return (
    <g transform={`translate(${x - 4}, ${y - 18}) scale(0.85)`}>
      <circle cx="2" cy="5" r="2" fill="#111111" />
      <path d="M 3 5 C 6 4 9 7 9 11" stroke="#111111" strokeWidth="1.6" fill="none" />
      <circle cx="2" cy="10" r="2" fill="#111111" />
      <path d="M 3 10 C 6 9 9 12 9 16" stroke="#111111" strokeWidth="1.6" fill="none" />
      <circle cx="2" cy="15" r="2" fill="#111111" />
      <path d="M 3 15 C 6 14 9 17 9 21 L 6 29" stroke="#111111" strokeWidth="1.6" fill="none" />
    </g>
  );
};

/**
 * Notehead Glyph
 */
export const NoteheadGlyph: React.FC<{
  duration: NoteDuration;
  x: number;
  y: number;
  isSelected?: boolean;
  isHoverGhost?: boolean;
}> = ({ duration, x, y, isSelected = false, isHoverGhost = false }) => {
  const isFilled = duration !== 'whole' && duration !== 'half';
  const color = isHoverGhost ? '#9ca3af' : isSelected ? '#1d4ed8' : '#111111';

  if (duration === 'whole') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <ellipse cx="0" cy="0" rx="6.8" ry="4.4" fill="none" stroke={color} strokeWidth="2.2" />
        <ellipse cx="0" cy="0" rx="3.2" ry="1.8" fill="#ffffff" />
      </g>
    );
  }

  if (duration === 'half') {
    return (
      <g transform={`translate(${x}, ${y}) rotate(-22)`}>
        <ellipse cx="0" cy="0" rx="6.2" ry="4.2" fill="none" stroke={color} strokeWidth="2.2" />
      </g>
    );
  }

  // Filled notehead (quarter, 8th, 16th, 32nd)
  return (
    <g transform={`translate(${x}, ${y}) rotate(-22)`}>
      <ellipse cx="0" cy="0" rx="6.2" ry="4.4" fill={color} />
    </g>
  );
};

/**
 * Grand Staff Bracket / Brace (left edge of piano score)
 */
export const GrandStaffBrace: React.FC<{
  x: number;
  yTop: number;
  yBottom: number;
}> = ({ x, yTop, yBottom }) => {
  const height = yBottom - yTop;
  const midY = yTop + height / 2;

  // Classic curved curly brace
  return (
    <g>
      {/* Heavy vertical connector line */}
      <line x1={x} y1={yTop} x2={x} y2={yBottom} stroke="#111111" strokeWidth="2.5" />
      {/* Thin line slightly inset */}
      <line x1={x + 3} y1={yTop} x2={x + 3} y2={yBottom} stroke="#111111" strokeWidth="0.8" />
      {/* Classical curly bracket curve */}
      <path
        d={`M ${x - 2} ${yTop} 
            C ${x - 12} ${yTop + height * 0.15}, ${x - 14} ${midY - 15}, ${x - 20} ${midY} 
            C ${x - 14} ${midY + 15}, ${x - 12} ${yBottom - height * 0.15}, ${x - 2} ${yBottom}
            C ${x - 9} ${yBottom - height * 0.15}, ${x - 10} ${midY + 12}, ${x - 16} ${midY}
            C ${x - 10} ${midY - 12}, ${x - 9} ${yTop + height * 0.15}, ${x - 2} ${yTop} Z`}
        fill="#111111"
      />
    </g>
  );
};

/**
 * Classical Time Signature Numbers
 */
export const TimeSignatureGlyph: React.FC<{
  numerator: number;
  denominator: number;
  x: number;
  yStaffTop: number;
}> = ({ numerator, denominator, x, yStaffTop }) => {
  return (
    <g transform={`translate(${x}, ${yStaffTop})`}>
      <text
        x="0"
        y="17"
        textAnchor="middle"
        fontFamily="Lora, serif"
        fontSize="21"
        fontWeight="600"
        fill="#111111"
      >
        {numerator}
      </text>
      <text
        x="0"
        y="37"
        textAnchor="middle"
        fontFamily="Lora, serif"
        fontSize="21"
        fontWeight="600"
        fill="#111111"
      >
        {denominator}
      </text>
    </g>
  );
};

/**
 * Classical Segno Symbol (𝄋)
 */
export const SegnoGlyph: React.FC<{ x: number; y: number; scale?: number }> = ({
  x,
  y,
  scale = 1,
}) => {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <text
        x="0"
        y="0"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="serif"
        fontSize="24"
        fontWeight="bold"
        fill="#111111"
      >
        𝄋
      </text>
    </g>
  );
};

/**
 * Classical Coda Symbol (𝄌)
 */
export const CodaGlyph: React.FC<{ x: number; y: number; scale?: number }> = ({
  x,
  y,
  scale = 1,
}) => {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <text
        x="0"
        y="0"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="serif"
        fontSize="24"
        fontWeight="bold"
        fill="#111111"
      >
        𝄌
      </text>
    </g>
  );
};

/**
 * Volta Ending Bracket (1st, 2nd, 3rd endings)
 */
export const VoltaEndingBracket: React.FC<{
  xStart: number;
  width: number;
  y: number;
  endingNumber: number;
  isClosedRight?: boolean;
}> = ({ xStart, width, y, endingNumber, isClosedRight = true }) => {
  const hookHeight = 12;
  return (
    <g className="volta-bracket">
      {/* Left hook */}
      <line
        x1={xStart}
        y1={y + hookHeight}
        x2={xStart}
        y2={y}
        stroke="#111111"
        strokeWidth="1.2"
      />
      {/* Horizontal line */}
      <line
        x1={xStart}
        y1={y}
        x2={xStart + width}
        y2={y}
        stroke="#111111"
        strokeWidth="1.2"
      />
      {/* Right hook (if closed) */}
      {isClosedRight && (
        <line
          x1={xStart + width}
          y1={y}
          x2={xStart + width}
          y2={y + hookHeight}
          stroke="#111111"
          strokeWidth="1.2"
        />
      )}
      {/* Ending number text */}
      <text
        x={xStart + 6}
        y={y + 11}
        fontFamily="'Plus Jakarta Sans', sans-serif"
        fontSize="11"
        fontWeight="700"
        fill="#111111"
      >
        {endingNumber}.
      </text>
    </g>
  );
};

