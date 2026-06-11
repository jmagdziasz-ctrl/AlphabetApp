import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ALPHABET_DATA } from '@/constants/alphabetData';
import { SceneView } from '@/components/SceneView';
import { LetterTracer } from '@/components/LetterTracer';
import { FeedbackModal } from '@/components/FeedbackModal';
import { useAlphabetStore, FREE_LETTERS } from '@/store/alphabetStore';

export default function LearnScreen() {
  const { letter } = useLocalSearchParams<{ letter: string }>();
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const customizations    = useAlphabetStore(s => s.customizations);
  const isPremiumUnlocked = useAlphabetStore(s => s.isPremiumUnlocked);

  const letterIndex   = ALPHABET_DATA.findIndex(d => d.letter === letter);
  const letterData    = ALPHABET_DATA[letterIndex];
  const customization = customizations[letter ?? ''];

  const [progress, setProgress]       = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSuccess, setIsSuccess]     = useState(false);
  const [tracerKey, setTracerKey]     = useState(0);
  const [isLowercase, setIsLowercase] = useState(false);
  const attemptsRef = useRef(0);

  const switchCase = (lowercase: boolean) => {
    if (lowercase === isLowercase) return;
    setIsLowercase(lowercase);
    setTracerKey(k => k + 1);
    setProgress(0);
  };

  // Guard: redirect to paywall if this letter isn't unlocked
  const isLocked = letter ? !FREE_LETTERS.has(letter) && !isPremiumUnlocked : false;
  React.useEffect(() => {
    if (isLocked) router.replace('/paywall');
  }, [isLocked]);

  // ── Dynamic sizing ──────────────────────────────────────────────────────────
  // Reserve space for: header + trace label + case toggle + progress bar+text + nav row + padding
  const HEADER_H   = 52;
  const LABEL_H    = 36;
  const TOGGLE_H   = 40;
  const PROGRESS_H = 44;
  const NAV_H      = 60;
  const PADDING_H  = 16;
  const FIXED_H    = HEADER_H + LABEL_H + TOGGLE_H + PROGRESS_H + NAV_H + PADDING_H;

  const available  = height - FIXED_H;
  // Give ~45% to scene, ~55% to tracer; clamp tracer to screen width
  const tracerSize  = Math.floor(Math.min(width - 48, available * 0.55));
  const sceneHeight = Math.max(120, available - tracerSize);
  // ───────────────────────────────────────────────────────────────────────────

  const handleComplete = useCallback((score: number) => {
    setIsSuccess(score >= 0.8);
    if (score < 0.8) attemptsRef.current += 1;
    setModalVisible(true);
  }, []);

  const handleProgress = useCallback((pct: number) => setProgress(pct), []);

  const goToLetter = (index: number) => {
    if (index < 0 || index >= ALPHABET_DATA.length) { router.replace('/'); return; }
    const next = ALPHABET_DATA[index].letter;
    if (!FREE_LETTERS.has(next) && !isPremiumUnlocked) {
      router.replace('/paywall');
    } else {
      router.replace(`/learn/${next}`);
    }
  };

  const handleNext  = () => { setModalVisible(false); goToLetter(letterIndex + 1); };
  const handleRetry = () => { setModalVisible(false); setProgress(0); setTracerKey(k => k + 1); };

  if (!letterData || isLocked) return null;

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerLetter, { color: letterData.accentColor }]}>{letter}</Text>
        <TouchableOpacity onPress={handleNext} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>Skip →</Text>
        </TouchableOpacity>
      </View>

      {/* Scene */}
      <SceneView
        letterData={letterData}
        customization={customization}
        imageHeight={sceneHeight}
      />

      {/* Tracing label */}
      <Text style={[styles.traceLabel, { color: letterData.accentColor }]}>
        Trace the letter {isLowercase ? letter?.toLowerCase() : letter}!
      </Text>

      {/* Case toggle */}
      <View style={styles.caseToggleRow}>
        <TouchableOpacity
          style={[styles.caseBtn, !isLowercase && { backgroundColor: letterData.accentColor }]}
          onPress={() => switchCase(false)}
        >
          <Text style={[styles.caseBtnText, !isLowercase && styles.caseBtnTextActive]}>A</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.caseBtn, isLowercase && { backgroundColor: letterData.accentColor }]}
          onPress={() => switchCase(true)}
        >
          <Text style={[styles.caseBtnText, isLowercase && styles.caseBtnTextActive]}>a</Text>
        </TouchableOpacity>
      </View>

      {/* Tracer */}
      <View style={styles.tracerWrapper}>
        <LetterTracer
          key={tracerKey}
          letter={isLowercase ? (letter?.toLowerCase() ?? 'a') : (letter ?? 'A')}
          size={tracerSize}
          accentColor={letterData.accentColor}
          onComplete={handleComplete}
          onProgress={handleProgress}
          onTouchingChange={() => {}}
        />
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.round(progress * 100)}%`, backgroundColor: letterData.accentColor },
          ]}
        />
      </View>
      <Text style={styles.progressText}>{Math.round(progress * 100)}% traced</Text>

      {/* Nav buttons */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navBtn, { opacity: letterIndex > 0 ? 1 : 0.3 }]}
          onPress={() => goToLetter(letterIndex - 1)}
          disabled={letterIndex === 0}
        >
          <Text style={styles.navBtnText}>← Prev</Text>
        </TouchableOpacity>
        <Text style={styles.pageIndicator}>
          {letterIndex + 1} / {ALPHABET_DATA.length}
        </Text>
        <TouchableOpacity
          style={[styles.navBtn, { opacity: letterIndex < ALPHABET_DATA.length - 1 ? 1 : 0.3 }]}
          onPress={() => goToLetter(letterIndex + 1)}
          disabled={letterIndex === ALPHABET_DATA.length - 1}
        >
          <Text style={styles.navBtnText}>Next →</Text>
        </TouchableOpacity>
      </View>

      <FeedbackModal
        visible={modalVisible}
        success={isSuccess}
        onNext={handleNext}
        onRetry={handleRetry}
        accentColor={letterData.accentColor}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#FFF9F0' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  headerBtn:     { padding: 8 },
  headerBtnText: { fontSize: 16, color: '#607D8B', fontWeight: '600' },
  headerLetter:  { fontSize: 36, fontWeight: '900' },

  traceLabel: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginTop: 4, marginBottom: 2 },
  tracerWrapper: { alignItems: 'center' },

  caseToggleRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 6, borderRadius: 20, overflow: 'hidden', alignSelf: 'center' },
  caseBtn: {
    width: 44, height: 30, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  caseBtnText:       { fontSize: 16, fontWeight: '800', color: '#9E9E9E' },
  caseBtnTextActive: { color: '#FFF' },

  progressTrack: {
    alignSelf: 'center',
    width: '80%',
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill:  { height: 10, borderRadius: 5 },
  progressText:  { color: '#9E9E9E', textAlign: 'center', marginTop: 2, fontSize: 13 },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  navBtn: {
    backgroundColor: '#607D8B',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 50,
  },
  navBtnText:     { color: 'white', fontWeight: '700', fontSize: 15 },
  pageIndicator:  { fontSize: 15, color: '#9E9E9E' },
});
