import React, { useCallback, useRef, useState } from 'react';
import { View, PanResponder, StyleSheet } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { LETTER_PATHS } from '../constants/letterPaths';

interface Props {
  letter: string;
  size?: number;
  accentColor: string;
  onComplete: (score: number) => void;
  onProgress?: (pct: number) => void;
  onTouchingChange?: (isTouching: boolean) => void;
}

// How long (ms) to wait after the finger lifts before deciding the tracing is done.
// This lets the child reposition and keep going without being cut off early.
const FINISH_DELAY_MS = 3500;

// ── Y-normalisation ────────────────────────────────────────────────────────────
// Letter coordinates are defined on a 0-100 grid.  Most letters bottom out at
// y≈92, which places the lowest dots right at the canvas edge — too close to
// the iOS home-gesture area on iPhones with a notch/Dynamic Island.
// We compress the Y axis so that y=92 (the original bottom) maps to y=83,
// keeping the tops exactly where they are (y=8 stays y=8).  This lifts every
// letter/number 9 units inside the canvas without touching the path data.
const TOP_Y    = 8;   // coordinates start here
const SRC_BOT  = 92;  // original bottom coordinate (what "B" uses)
const DST_BOT  = 83;  // new bottom limit (lifted by 9 units)
const Y_SCALE  = (DST_BOT - TOP_Y) / (SRC_BOT - TOP_Y); // ≈ 0.893

function normY(y: number): number {
  return TOP_Y + (y - TOP_Y) * Y_SCALE;
}
// ───────────────────────────────────────────────────────────────────────────────

export function LetterTracer({ letter, size = 280, accentColor, onComplete, onProgress, onTouchingChange }: Props) {
  const strokes = LETTER_PATHS[letter] ?? [];

  // Flatten all dots with their stroke/index info
  const allDots = strokes.flatMap((stroke, si) =>
    stroke.map((pt, pi) => ({
      id: `${si}-${pi}`,
      x: (pt.x / 100) * size,
      y: (normY(pt.y) / 100) * size,
      strokeIndex: si,
      pointIndex: pi,
    }))
  );

  const [visited, setVisited] = useState<Set<string>>(new Set());
  const visitedRef   = useRef<Set<string>>(new Set());
  const completedRef = useRef(false);
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always up-to-date finish function stored in a ref so the panResponder
  // closure (created once) can still call the latest version.
  const finishTracingRef = useRef<() => void>(() => {});
  finishTracingRef.current = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    const pct = visitedRef.current.size / allDots.length;
    onComplete(pct);
  };

  const clearFinishTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const scheduleFinish = () => {
    clearFinishTimer();
    timerRef.current = setTimeout(() => {
      finishTracingRef.current();
    }, FINISH_DELAY_MS);
  };

  const checkDot = useCallback((touchX: number, touchY: number) => {
    if (completedRef.current) return;
    let changed = false;

    for (const dot of allDots) {
      if (visitedRef.current.has(dot.id)) continue;
      const dist = Math.sqrt((touchX - dot.x) ** 2 + (touchY - dot.y) ** 2);
      if (dist < 30) {
        visitedRef.current = new Set([...visitedRef.current, dot.id]);
        changed = true;
      }
    }

    if (changed) {
      const pct = visitedRef.current.size / allDots.length;
      setVisited(new Set(visitedRef.current));
      onProgress?.(pct);

      // Perfect trace — complete immediately, no need to wait
      if (pct >= 1.0 && !completedRef.current) {
        clearFinishTimer();
        completedRef.current = true;
        onComplete(pct);
      }
    }
  }, [allDots, onComplete, onProgress]);

  const panResponder = useRef(
    PanResponder.create({
      // Capture the touch BEFORE the ScrollView can claim it
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (e) => {
        // Cancel any pending finish — the child is still tracing
        clearFinishTimer();
        onTouchingChange?.(true);
        const { locationX, locationY } = e.nativeEvent;
        checkDot(locationX, locationY);
      },
      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        checkDot(locationX, locationY);
      },
      onPanResponderRelease: () => {
        onTouchingChange?.(false);
        // Start the grace-period timer. If the child puts their finger back
        // down, the timer is cancelled (see onPanResponderGrant above).
        // When the timer fires, we complete with whatever score they reached.
        scheduleFinish();
      },
      onPanResponderTerminate: () => {
        onTouchingChange?.(false);
        scheduleFinish();
      },
    })
  ).current;

  // Draw connecting lines between dots in each stroke
  const strokeLines = strokes.flatMap((stroke, si) =>
    stroke.slice(0, -1).map((pt, pi) => {
      const x1 = (pt.x / 100) * size;
      const y1 = (normY(pt.y) / 100) * size;
      const x2 = (stroke[pi + 1].x / 100) * size;
      const y2 = (normY(stroke[pi + 1].y) / 100) * size;
      return (
        <Line
          key={`line-${si}-${pi}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#E0E0E0"
          strokeWidth="4"
          strokeDasharray="8,6"
        />
      );
    })
  );

  return (
    <View style={[styles.container, { width: size, height: size }]} {...panResponder.panHandlers}>
      <Svg width={size} height={size}>
        {/* Dashed connecting lines */}
        {strokeLines}

        {/* Dots */}
        {allDots.map((dot) => {
          const isVisited = visited.has(dot.id);
          return (
            <Circle
              key={dot.id}
              cx={dot.x}
              cy={dot.y}
              r={16}
              fill={isVisited ? accentColor : 'white'}
              stroke={isVisited ? accentColor : '#BDBDBD'}
              strokeWidth={3}
              opacity={isVisited ? 1 : 0.9}
            />
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
});
