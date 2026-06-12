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
  const [currentIdx,   setCurrentIdx]   = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSuccess,    setIsSuccess]    = useState(false);
  const [completedSet, setCompletedSet] = useState<Set<number>>(new Set());
  const [tracerKeys,   setTracerKeys]   = useState<number[]>(() => nameLetters.map(() => 0));
  const attemptsRef = useRef(0);

  const handleComplete = useCallback((score: number) => {
    const success = score >= 0.8;
    setIsSuccess(success);
    if (!success) attemptsRef.current += 1;
    setModalVisible(true);
  }, []);

  const handleNext = () => {
    setModalVisible(false);
    if (isSuccess) {
      setCompletedSet(prev => new Set(prev).add(currentIdx));
      if (currentIdx < nameLetters.length - 1) {
        setCurrentIdx(i => i + 1);
      } else {
        // All done — reset for another round
        setCurrentIdx(0);
        setCompletedSet(new Set());
        setTracerKeys(keys => keys.map(k => k + 1));
      }
    }
  };

  const handleRetry = () => {
    setModalVisible(false);
    setTracerKeys(keys => keys.map((k, i) => i === currentIdx ? k + 1 : k));
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
  const FIXED_H   = 52 + HEADER_H + 36 + 28 + 60 + 16; // header+photo+label+dots+nav+padding
  const available = height - FIXED_H;
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

      <View style={{ alignItems: 'center' }}>
        <LetterTracer
          key={tracerKeys[currentIdx]}
          letter={currentLetter}
          size={tracerSize}
          accentColor={ACCENT}
          onComplete={handleComplete}
          onProgress={() => {}}
          onTouchingChange={() => {}}
        />
      </View>

      {/* Navigation dots */}
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

      {/* Prev / Next */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navBtn, { opacity: currentIdx > 0 ? 1 : 0.3 }]}
          onPress={() => setCurrentIdx(i => i - 1)}
          disabled={currentIdx === 0}
        >
          <Text style={styles.navBtnText}>← Prev</Text>
        </TouchableOpacity>
        <Text style={styles.pageIndicator}>{currentIdx + 1} / {nameLetters.length}</Text>
        <TouchableOpacity
          style={[styles.navBtn, { opacity: currentIdx < nameLetters.length - 1 ? 1 : 0.3 }]}
          onPress={() => setCurrentIdx(i => i + 1)}
          disabled={currentIdx === nameLetters.length - 1}
        >
          <Text style={styles.navBtnText}>Next →</Text>
        </TouchableOpacity>
      </View>

      <FeedbackModal
        visible={modalVisible}
        success={isSuccess}
        onNext={handleNext}
        onRetry={handleRetry}
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

  dotsRow:   { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 },
  dot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: '#F8BBD9' },
  dotActive: { backgroundColor: ACCENT, transform: [{ scale: 1.3 }] },
  dotDone:   { backgroundColor: '#4CAF50' },

  navRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 8, marginBottom: 4 },
  navBtn:        { backgroundColor: ACCENT, paddingVertical: 8, paddingHorizontal: 18, borderRadius: 50 },
  navBtnText:    { color: '#FFF', fontWeight: '700', fontSize: 15 },
  pageIndicator: { fontSize: 15, color: '#9E9E9E' },

  // Tablet
  tabletTracerRow:  { paddingHorizontal: 16, paddingVertical: 20, gap: 16, alignItems: 'flex-start' },
  tabletLetterCard: { alignItems: 'center', gap: 8 },
  tabletLetterLabel:{ fontSize: 28, fontWeight: '900', color: ACCENT },
});
