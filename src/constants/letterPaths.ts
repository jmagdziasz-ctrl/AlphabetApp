export type Point = { x: number; y: number };
export type Stroke = Point[];
export type LetterStrokes = Stroke[];

export const LETTER_PATHS: Record<string, LetterStrokes> = {
  // A: two diagonals meeting at top + crossbar
  'A': [
    // Left leg: top-center down to bottom-left
    [{ x: 50, y: 8 }, { x: 40, y: 30 }, { x: 30, y: 52 }, { x: 20, y: 75 }, { x: 12, y: 92 }],
    // Right leg: top-center down to bottom-right
    [{ x: 50, y: 8 }, { x: 60, y: 30 }, { x: 70, y: 52 }, { x: 80, y: 75 }, { x: 88, y: 92 }],
    // Crossbar
    [{ x: 28, y: 57 }, { x: 50, y: 57 }, { x: 72, y: 57 }],
  ],

  // B: vertical stroke + two bumps on right
  'B': [
    // Vertical stroke
    [{ x: 20, y: 10 }, { x: 20, y: 32 }, { x: 20, y: 55 }, { x: 20, y: 78 }, { x: 20, y: 92 }],
    // Top bump
    [{ x: 20, y: 10 }, { x: 45, y: 10 }, { x: 62, y: 18 }, { x: 68, y: 30 }, { x: 62, y: 42 }, { x: 45, y: 50 }, { x: 20, y: 50 }],
    // Bottom bump
    [{ x: 20, y: 50 }, { x: 48, y: 50 }, { x: 68, y: 58 }, { x: 75, y: 70 }, { x: 68, y: 82 }, { x: 48, y: 92 }, { x: 20, y: 92 }],
  ],

  // C: single arc open on right
  'C': [
    [
      { x: 78, y: 22 },
      { x: 62, y: 10 },
      { x: 44, y: 8 },
      { x: 26, y: 16 },
      { x: 14, y: 32 },
      { x: 10, y: 50 },
      { x: 14, y: 68 },
      { x: 26, y: 82 },
      { x: 44, y: 90 },
      { x: 62, y: 90 },
      { x: 78, y: 80 },
    ],
  ],

  // D: vertical stroke + large right bump
  'D': [
    // Vertical stroke
    [{ x: 20, y: 10 }, { x: 20, y: 35 }, { x: 20, y: 60 }, { x: 20, y: 80 }, { x: 20, y: 92 }],
    // Bump
    [{ x: 20, y: 10 }, { x: 45, y: 10 }, { x: 65, y: 20 }, { x: 78, y: 38 }, { x: 82, y: 52 }, { x: 78, y: 66 }, { x: 65, y: 82 }, { x: 45, y: 92 }, { x: 20, y: 92 }],
  ],

  // E: vertical stroke + three horizontal bars
  'E': [
    // Vertical stroke
    [{ x: 22, y: 10 }, { x: 22, y: 35 }, { x: 22, y: 60 }, { x: 22, y: 80 }, { x: 22, y: 92 }],
    // Top bar
    [{ x: 22, y: 10 }, { x: 45, y: 10 }, { x: 70, y: 10 }],
    // Middle bar
    [{ x: 22, y: 51 }, { x: 42, y: 51 }, { x: 62, y: 51 }],
    // Bottom bar
    [{ x: 22, y: 92 }, { x: 45, y: 92 }, { x: 70, y: 92 }],
  ],

  // F: vertical stroke + two horizontal bars (no bottom bar)
  'F': [
    // Vertical stroke
    [{ x: 22, y: 10 }, { x: 22, y: 35 }, { x: 22, y: 60 }, { x: 22, y: 80 }, { x: 22, y: 92 }],
    // Top bar
    [{ x: 22, y: 10 }, { x: 45, y: 10 }, { x: 70, y: 10 }],
    // Middle bar
    [{ x: 22, y: 51 }, { x: 42, y: 51 }, { x: 60, y: 51 }],
  ],

  // G: like C but with a horizontal shelf on the right mid
  'G': [
    [
      { x: 78, y: 22 },
      { x: 62, y: 10 },
      { x: 44, y: 8 },
      { x: 26, y: 16 },
      { x: 14, y: 32 },
      { x: 10, y: 50 },
      { x: 14, y: 68 },
      { x: 26, y: 82 },
      { x: 44, y: 90 },
      { x: 62, y: 90 },
      { x: 78, y: 82 },
      { x: 78, y: 65 },
      { x: 58, y: 65 },
    ],
  ],

  // H: two verticals + crossbar
  'H': [
    // Left vertical
    [{ x: 18, y: 10 }, { x: 18, y: 35 }, { x: 18, y: 60 }, { x: 18, y: 80 }, { x: 18, y: 92 }],
    // Right vertical
    [{ x: 82, y: 10 }, { x: 82, y: 35 }, { x: 82, y: 60 }, { x: 82, y: 80 }, { x: 82, y: 92 }],
    // Crossbar
    [{ x: 18, y: 51 }, { x: 40, y: 51 }, { x: 60, y: 51 }, { x: 82, y: 51 }],
  ],

  // I: vertical stroke + top/bottom serifs
  'I': [
    // Top serif
    [{ x: 28, y: 10 }, { x: 50, y: 10 }, { x: 72, y: 10 }],
    // Vertical
    [{ x: 50, y: 10 }, { x: 50, y: 35 }, { x: 50, y: 60 }, { x: 50, y: 80 }, { x: 50, y: 92 }],
    // Bottom serif
    [{ x: 28, y: 92 }, { x: 50, y: 92 }, { x: 72, y: 92 }],
  ],

  // J: straight down then curve left at bottom
  'J': [
    // Top serif
    [{ x: 36, y: 10 }, { x: 60, y: 10 }, { x: 75, y: 10 }],
    // Vertical then curve
    [{ x: 62, y: 10 }, { x: 62, y: 30 }, { x: 62, y: 52 }, { x: 62, y: 70 }, { x: 58, y: 82 }, { x: 48, y: 90 }, { x: 35, y: 90 }, { x: 24, y: 82 }, { x: 20, y: 72 }],
  ],

  // K: vertical stroke + two diagonals
  'K': [
    // Vertical stroke
    [{ x: 20, y: 10 }, { x: 20, y: 35 }, { x: 20, y: 60 }, { x: 20, y: 80 }, { x: 20, y: 92 }],
    // Upper diagonal: top-right to middle
    [{ x: 78, y: 10 }, { x: 60, y: 28 }, { x: 44, y: 44 }, { x: 20, y: 52 }],
    // Lower diagonal: middle to bottom-right
    [{ x: 20, y: 52 }, { x: 44, y: 65 }, { x: 62, y: 78 }, { x: 78, y: 92 }],
  ],

  // L: vertical then horizontal at bottom
  'L': [
    // Vertical
    [{ x: 22, y: 10 }, { x: 22, y: 30 }, { x: 22, y: 52 }, { x: 22, y: 72 }, { x: 22, y: 92 }],
    // Bottom horizontal
    [{ x: 22, y: 92 }, { x: 44, y: 92 }, { x: 65, y: 92 }, { x: 80, y: 92 }],
  ],

  // M: two verticals with inverted V in middle
  'M': [
    // Left vertical up
    [{ x: 12, y: 92 }, { x: 12, y: 68 }, { x: 12, y: 44 }, { x: 12, y: 20 }, { x: 12, y: 10 }],
    // Left diagonal down to center
    [{ x: 12, y: 10 }, { x: 25, y: 30 }, { x: 38, y: 50 }, { x: 50, y: 60 }],
    // Right diagonal up from center
    [{ x: 50, y: 60 }, { x: 62, y: 50 }, { x: 75, y: 30 }, { x: 88, y: 10 }],
    // Right vertical down
    [{ x: 88, y: 10 }, { x: 88, y: 35 }, { x: 88, y: 60 }, { x: 88, y: 80 }, { x: 88, y: 92 }],
  ],

  // N: two verticals + diagonal
  'N': [
    // Left vertical
    [{ x: 15, y: 92 }, { x: 15, y: 68 }, { x: 15, y: 44 }, { x: 15, y: 20 }, { x: 15, y: 10 }],
    // Diagonal
    [{ x: 15, y: 10 }, { x: 30, y: 30 }, { x: 50, y: 51 }, { x: 70, y: 72 }, { x: 85, y: 92 }],
    // Right vertical
    [{ x: 85, y: 10 }, { x: 85, y: 32 }, { x: 85, y: 55 }, { x: 85, y: 75 }, { x: 85, y: 92 }],
  ],

  // O: full oval
  'O': [
    [
      { x: 50, y: 8 },
      { x: 68, y: 12 },
      { x: 82, y: 28 },
      { x: 88, y: 50 },
      { x: 82, y: 72 },
      { x: 68, y: 88 },
      { x: 50, y: 92 },
      { x: 32, y: 88 },
      { x: 18, y: 72 },
      { x: 12, y: 50 },
      { x: 18, y: 28 },
      { x: 32, y: 12 },
      { x: 50, y: 8 },
    ],
  ],

  // P: vertical stroke + top bump
  'P': [
    // Vertical
    [{ x: 20, y: 10 }, { x: 20, y: 32 }, { x: 20, y: 55 }, { x: 20, y: 75 }, { x: 20, y: 92 }],
    // Bump
    [{ x: 20, y: 10 }, { x: 45, y: 10 }, { x: 65, y: 18 }, { x: 72, y: 30 }, { x: 65, y: 44 }, { x: 45, y: 52 }, { x: 20, y: 52 }],
  ],

  // Q: like O with a small tail at bottom-right
  'Q': [
    [
      { x: 50, y: 8 },
      { x: 68, y: 12 },
      { x: 82, y: 28 },
      { x: 88, y: 50 },
      { x: 82, y: 72 },
      { x: 68, y: 88 },
      { x: 50, y: 92 },
      { x: 32, y: 88 },
      { x: 18, y: 72 },
      { x: 12, y: 50 },
      { x: 18, y: 28 },
      { x: 32, y: 12 },
      { x: 50, y: 8 },
    ],
    // Tail
    [{ x: 60, y: 78 }, { x: 72, y: 88 }, { x: 82, y: 97 }],
  ],

  // R: vertical + top bump + diagonal leg
  'R': [
    // Vertical
    [{ x: 20, y: 10 }, { x: 20, y: 32 }, { x: 20, y: 55 }, { x: 20, y: 75 }, { x: 20, y: 92 }],
    // Top bump
    [{ x: 20, y: 10 }, { x: 45, y: 10 }, { x: 65, y: 18 }, { x: 72, y: 30 }, { x: 65, y: 44 }, { x: 45, y: 52 }, { x: 20, y: 52 }],
    // Diagonal leg
    [{ x: 20, y: 52 }, { x: 40, y: 65 }, { x: 58, y: 78 }, { x: 78, y: 92 }],
  ],

  // S: top arc right-to-left, bottom arc left-to-right
  'S': [
    [
      { x: 75, y: 18 },
      { x: 60, y: 8 },
      { x: 42, y: 8 },
      { x: 26, y: 18 },
      { x: 20, y: 32 },
      { x: 26, y: 44 },
      { x: 44, y: 50 },
      { x: 62, y: 56 },
      { x: 76, y: 68 },
      { x: 78, y: 80 },
      { x: 68, y: 90 },
      { x: 50, y: 92 },
      { x: 32, y: 90 },
      { x: 20, y: 80 },
    ],
  ],

  // T: top bar + vertical
  'T': [
    // Top bar
    [{ x: 10, y: 10 }, { x: 30, y: 10 }, { x: 50, y: 10 }, { x: 70, y: 10 }, { x: 90, y: 10 }],
    // Vertical
    [{ x: 50, y: 10 }, { x: 50, y: 32 }, { x: 50, y: 55 }, { x: 50, y: 75 }, { x: 50, y: 92 }],
  ],

  // U: two verticals curving together at bottom
  'U': [
    [
      { x: 15, y: 10 },
      { x: 15, y: 30 },
      { x: 15, y: 52 },
      { x: 18, y: 68 },
      { x: 26, y: 80 },
      { x: 38, y: 88 },
      { x: 50, y: 90 },
      { x: 62, y: 88 },
      { x: 74, y: 80 },
      { x: 82, y: 68 },
      { x: 85, y: 52 },
      { x: 85, y: 30 },
      { x: 85, y: 10 },
    ],
  ],

  // V: two diagonals meeting at bottom
  'V': [
    // Left diagonal
    [{ x: 10, y: 10 }, { x: 22, y: 35 }, { x: 34, y: 60 }, { x: 50, y: 92 }],
    // Right diagonal
    [{ x: 90, y: 10 }, { x: 78, y: 35 }, { x: 66, y: 60 }, { x: 50, y: 92 }],
  ],

  // W: four diagonals
  'W': [
    // First down-left
    [{ x: 10, y: 10 }, { x: 18, y: 38 }, { x: 25, y: 65 }, { x: 30, y: 92 }],
    // Up to middle
    [{ x: 30, y: 92 }, { x: 38, y: 65 }, { x: 44, y: 44 }, { x: 50, y: 52 }],
    // Down again
    [{ x: 50, y: 52 }, { x: 56, y: 65 }, { x: 62, y: 80 }, { x: 70, y: 92 }],
    // Up to right
    [{ x: 70, y: 92 }, { x: 76, y: 65 }, { x: 82, y: 38 }, { x: 90, y: 10 }],
  ],

  // X: two diagonals crossing
  'X': [
    // Top-left to bottom-right
    [{ x: 15, y: 10 }, { x: 30, y: 30 }, { x: 50, y: 51 }, { x: 70, y: 72 }, { x: 85, y: 92 }],
    // Top-right to bottom-left
    [{ x: 85, y: 10 }, { x: 70, y: 30 }, { x: 50, y: 51 }, { x: 30, y: 72 }, { x: 15, y: 92 }],
  ],

  // Y: two diagonals to center, then vertical down
  'Y': [
    // Left arm down to center
    [{ x: 10, y: 10 }, { x: 25, y: 28 }, { x: 38, y: 44 }, { x: 50, y: 52 }],
    // Right arm down to center
    [{ x: 90, y: 10 }, { x: 75, y: 28 }, { x: 62, y: 44 }, { x: 50, y: 52 }],
    // Stem down
    [{ x: 50, y: 52 }, { x: 50, y: 68 }, { x: 50, y: 80 }, { x: 50, y: 92 }],
  ],

  // Z: top bar + diagonal + bottom bar
  'Z': [
    // Top bar
    [{ x: 15, y: 10 }, { x: 38, y: 10 }, { x: 62, y: 10 }, { x: 85, y: 10 }],
    // Diagonal
    [{ x: 85, y: 10 }, { x: 68, y: 32 }, { x: 50, y: 51 }, { x: 32, y: 70 }, { x: 15, y: 92 }],
    // Bottom bar
    [{ x: 15, y: 92 }, { x: 38, y: 92 }, { x: 62, y: 92 }, { x: 85, y: 92 }],
  ],
};
