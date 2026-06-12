import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  useWindowDimensions, Image, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlphabetStore } from '@/store/alphabetStore';
import { LetterTracer } from '@/components/LetterTracer';
import { FeedbackModal } from '@/components/FeedbackModal';

const ACCENT = '#E91E8C';

export default function NameTraceScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;

  const familyMembers = useAlphabetStore(s => s.familyMembers);
  const member = familyMembers.find(m => m.id === id);

  // Redirect if member not found
  React.useEffect(() => {
    if (!member) router.replace('/name');
  }, [member]);

  const nameLetters  = member ? member.name.toUpperCase().split('').filter(c => /[A-Z]/.test(c)) : [];
  const displayChars = member ? member.name.toUpperCase().split('') : [];

  // ── Phone state — one letter at a time ─────────────────────────────────
  const [currentIdx,    setCurrentIdx]    = useState(0);
  const [completedSet,  setCompletedSet]  = useState<Set<number>>(new Set());
  const [tracerKeys,    setTracerKeys]    = useState<number[]>(() => nameLetters.map(() => 0));
  // 'success' = brief green flash before auto-advancing
  // 'retry'   = brief red flash before auto-resetting
  const [inlineFeedback, setInlineFeedback] = useState<'success' | 'retry' | null>(null);
  const [doneModal,      setDoneModal]      = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleComplete = useCallback((score: number) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    const success = score >= 0.8;
    setInlineFeedback(success ? 'success' : 'retry');

    if (success) {
      // Mark current letter complete immediately (so chip turns green)
      setCompletedSet(prev => new Set(prev).add(currentIdx));

      feedbackTimer.current = setTimeout(() => {
        setInlineFeedback(null);
        if (currentIdx >= nameLetters.length - 1) {
          // Last letter — celebrate the whole name!
          setDoneModal(true);
        } else {
          setCurrentIdx(currentIdx + 1);
        }
      }, 700);
    } else {
      // Failed — reset this tracer after a short pause
      feedbackTimer.current = setTimeout(() => {
        setInlineFeedback(null);
        setTracerKeys(keys => keys.map((k, i) => i === currentIdx ? k + 1 : k));
      }, 1000);
    }
  }, [currentIdx, nameLetters.length]);

  const handleDoneNext = () => {
    setDoneModal(false);
    setCurrentIdx(0);
    setCompletedSet(new Set());
    setTracerKeys(keys => keys.map(k => k + 1));
  };

  // Skip advances without requiring a trace
  const handleSkip = () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setInlineFeedback(null);
    if (currentIdx >= nameLetters.length - 1) {
      setDoneModal(true);
    } else {
      setCurrentIdx(currentIdx + 1);
    }
  };

  // ── Tablet state — all letters at once ─────────────────────────────────
  const [tabletCompleted, setTabletCompleted] = useState<Set<number>>(new Set());
  const [tabletKeys,      setTabletKeys]      = useState<number[]>(() => nameLetters.map(() => 0));
  const [tabletModal,     setTabletModal]     = useState(false);
  const [tabletSuccess,   setTabletSuccess]   = useState(false);
  const [tabletActiveIdx, setTabletActiveIdx] = useState<number | null>(null);

  const handleTabletComplete = useCallback((idx: number, score: number) => {
    if (score >= 0.8) {
      setTabletCompleted(prev => {
        const next = new Set(prev).add(idx);
        if (next.size === nameLetters.length) {
          setTabletSuccess(true);
          setTabletModal(true);
        }
        return next;
      });
    } else {
      setTabletActiveIdx(idx);
      setTabletSuccess(false);
      setTabletModal(true);
    }
  }, [nameLetters.length]);

  const handleTabletRetry = () => {
    setTabletModal(false);
    if (tabletActiveIdx !== null) {
      setTabletKeys(keys => keys.map((k, i) => i === tabletActiveIdx ? k + 1 : k));
    }
  };

  const handleTabletNext = () => {
    setTabletModal(false);
    if (tabletSuccess) {
      setTabletCompleted(new Set());
      setTabletKeys(keys => keys.map(k => k + 1));
    }
  };

  if (!member) return null;

  // ── Photo dimensions ────────────────────────────────────────────────────
  // Portrait card: wider than before, shorter height to leave room for tracer
  const PHOTO_W   = Math.min(Math.floor(width * 0.38), 160);
  const PHOTO_H   = Math.floor(PHOTO_W * 1.3);
  const HEADER_H  = PHOTO_H + 24; // photo + vertical padding

  // ── Letter chips header ─────────────────────────────────────────────────
  const NameHeader = ({ activeLetterIdx }: { activeLetterIdx?: number }) => (
    <View style={styles.nameHeader}>
      {/* Portrait photo card */}
      <View style={[styles.photoCard, { width: PHOTO_W, height: PHOTO_H }]}>
        {member.photoUri ? (
          <Image
            source={{ uri: member.photoUri }}
            style={[
              styles.photoImg,
              { width: PHOTO_W, height: PHOTO_H, transform: [{ rotate: `${member.photoRotation}deg` }] },
            ]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.photoPlaceholder, { width: PHOTO_W, height: PHOTO_H }]}>
            <Text style={{ fontSize: 40 }}>😊</Text>
          </View>
        )}
      </View>

      {/* Name + letter chips */}
      <View style={styles.nameRightCol}>
        <Text style={styles.memberNameLabel}>{member.name}</Text>
        <View style={styles.nameLettersRow}>
          {displayChars.map((c, i) => {
            if (c === ' ') return <View key={i} style={{ width: 8 }} />;
            const lettersBefore = displayChars.slice(0, i).filter(x => /[A-Z]/.test(x)).length;
            const isActive    = activeLetterIdx === lettersBefore;
            const isCompleted = isTablet
              ? tabletCompleted.has(lettersBefore)
              : completedSet.has(lettersBefore);
            return (
              <View
                key={i}
                style={[
                  styles.letterChip,
                  isActive    && styles.letterChipActive,
                  isCompleted && styles.letterChipDone,
                ]}
              >
                <Text style={[
                  styles.letterChipText,
                  isActive    && styles.letterChipTextActive,
                  isCompleted && styles.letterChipTextDone,
                ]}>{c}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );

  // ──────────────────────────────────────────────────────────────────────
  // TABLET LAYOUT
  // ──────────────────────────────────────────────────────────────────────
  if (isTablet) {
    const tracerSize = Math.min(Math.floor((width - 48) / nameLetters.length) - 12, 200);
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Spell {member.name}!</Text>
          <View style={{ width: 60 }} />
        </View>

        <NameHeader />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabletTracerRow}>
          {nameLetters.map((letter, idx) => (
            <View key={idx} style={styles.tabletLetterCard}>
              <Text style={[styles.tabletLetterLabel, tabletCompleted.has(idx) && { color: '#4CAF50' }]}>
                {tabletCompleted.has(idx) ? '✓' : letter}
              </Text>
              <LetterTracer
                key={tabletKeys[idx]}
                letter={letter}
                size={tracerSize}
                accentColor={tabletCompleted.has(idx) ? '#4CAF50' : ACCENT}
                onComplete={(score) => handleTabletComplete(idx, score)}
                onProgress={() => {}}
                onTouchingChange={() => {}}
              />
            </View>
          ))}
        </ScrollView>

        <FeedbackModal
          visible={tabletModal}
          success={tabletSuccess}
          onNext={handleTabletNext}
          onRetry={handleTabletRetry}
          accentColor={ACCENT}
        />
      </SafeAreaView>
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // PHONE LAYOUT
  // ──────────────────────────────────────────────────────────────────────
  const FIXED_H    = 52 + HEADER_H + 36 + 28 + 16; // header+photo+label+dots+padding
  const available  = height - FIXED_H;
  const tracerSize = Math.floor(Math.min(width - 48, available));
  const currentLetter = nameLetters[currentIdx];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Spell {member.name}!</Text>
        <View style={{ width: 60 }} />
      </View>

      <NameHeader activeLetterIdx={currentIdx} />

      <Text style={[styles.traceLabel, { color: ACCENT }]}>
        Trace the letter {currentLetter}!
      </Text>

      {/* Tracer with inline feedback overlay — no modal between letters */}
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: tracerSize, height: tracerSize }}>
          <LetterTracer
            key={`${currentIdx}-${tracerKeys[currentIdx]}`}
            letter={currentLetter}
            size={tracerSize}
            accentColor={inlineFeedback === 'retry' ? '#F44336' : ACCENT}
            onComplete={handleComplete}
            onProgress={() => {}}
            onTouchingChange={() => {}}
          />
          {/* Overlay blocks touch-through and shows brief result */}
          {inlineFeedback && (
            <View
              style={[
                styles.feedbackOverlay,
                { backgroundColor: inlineFeedback === 'success' ? '#4CAF5099' : '#F4433644' },
              ]}
              pointerEvents="box-only"
            >
              <Text style={styles.feedbackOverlayText}>
                {inlineFeedback === 'success' ? '⭐ Great!' : '🔄 Try Again!'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {nameLetters.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === currentIdx && styles.dotActive,
              completedSet.has(i) && styles.dotDone,
            ]}
          />
        ))}
      </View>

      {/* Skip button — only shown when not in feedback state */}
      {!inlineFeedback && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipBtnText}>Skip →</Text>
        </TouchableOpacity>
      )}

      {/* Celebration modal — only shown when ALL letters are done */}
      <FeedbackModal
        visible={doneModal}
        success={true}
        onNext={handleDoneNext}
        onRetry={handleDoneNext}
        accentColor={ACCENT}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#FFF9F0' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#F8BBD9',
  },
  backText:    { fontSize: 16, color: '#607D8B', fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: ACCENT },

  // ── Photo + chips header ────────────────────────────────────────────────
  nameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF3FA',
    borderBottomWidth: 1,
    borderBottomColor: '#F8BBD9',
    gap: 14,
  },
  photoCard: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: ACCENT,
  },
  photoImg:         { borderRadius: 0 },
  photoPlaceholder: {
    backgroundColor: '#FCE4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  nameRightCol: { flex: 1, gap: 8 },
  memberNameLabel: {
    fontSize: 16, fontWeight: '900', color: ACCENT, letterSpacing: 1,
  },
  nameLettersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  letterChip: {
    width: 34, height: 40, borderRadius: 8, backgroundColor: '#FCE4EC',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#F48FB1',
  },
  letterChipActive: { backgroundColor: ACCENT, borderColor: ACCENT, transform: [{ scale: 1.15 }] },
  letterChipDone:   { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  letterChipText:       { fontSize: 18, fontWeight: '900', color: ACCENT },
  letterChipTextActive: { color: '#FFF' },
  letterChipTextDone:   { color: '#FFF' },

  traceLabel: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginVertical: 4 },

  feedbackOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackOverlayText: {
    fontSize: 32, fontWeight: '900', color: '#FFF',
    textShadowColor: '#00000044', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4,
  },

  dotsRow:   { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 },
  dot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: '#F8BBD9' },
  dotActive: { backgroundColor: ACCENT, transform: [{ scale: 1.3 }] },
  dotDone:   { backgroundColor: '#4CAF50' },

  skipBtn:     { alignSelf: 'center', marginTop: 10, paddingVertical: 7, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1.5, borderColor: '#BDBDBD' },
  skipBtnText: { fontSize: 14, color: '#9E9E9E', fontWeight: '600' },

  // Tablet
  tabletTracerRow:  { paddingHorizontal: 16, paddingVertical: 20, gap: 16, alignItems: 'flex-start' },
  tabletLetterCard: { alignItems: 'center', gap: 8 },
  tabletLetterLabel:{ fontSize: 28, fontWeight: '900', color: ACCENT },
});
