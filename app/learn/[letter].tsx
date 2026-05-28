import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ALPHABET_DATA } from '@/constants/alphabetData';
import { SceneView } from '@/components/SceneView';
import { LetterTracer } from '@/components/LetterTracer';
import { FeedbackModal } from '@/components/FeedbackModal';
import { useAlphabetStore, FREE_LETTERS } from '@/store/alphabetStore';

const { width } = Dimensions.get('window');

export default function LearnScreen() {
  const { letter } = useLocalSearchParams<{ letter: string }>();
  const router = useRouter();
  const customizations    = useAlphabetStore(s => s.customizations);
  const isPremiumUnlocked = useAlphabetStore(s => s.isPremiumUnlocked);

  const letterIndex = ALPHABET_DATA.findIndex(d => d.letter === letter);
  const letterData = ALPHABET_DATA[letterIndex];
  const customization = customizations[letter ?? ''];

  const [progress, setProgress] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tracerKey, setTracerKey] = useState(0);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const attemptsRef = useRef(0);

  const handleComplete = useCallback((score: number) => {
    if (score >= 0.8) {
      setIsSuccess(true);
    } else {
      attemptsRef.current += 1;
      setIsSuccess(false);
    }
    setModalVisible(true);
  }, []);

  const handleProgress = useCallback((pct: number) => {
    setProgress(pct);
  }, []);

  const handleNext = () => {
    setModalVisible(false);
    const nextIndex = letterIndex + 1;
    if (nextIndex < ALPHABET_DATA.length) {
      const nextLetter = ALPHABET_DATA[nextIndex].letter;
      if (!FREE_LETTERS.has(nextLetter) && !isPremiumUnlocked) {
        router.replace('/paywall');
      } else {
        router.replace(`/learn/${nextLetter}`);
      }
    } else {
      router.replace('/');
    }
  };

  const handleRetry = () => {
    setModalVisible(false);
    setProgress(0);
    setTracerKey(k => k + 1);
  };

  const goToPrev = () => {
    if (letterIndex > 0) {
      router.replace(`/learn/${ALPHABET_DATA[letterIndex - 1].letter}`);
    }
  };

  const goToNext = () => {
    if (letterIndex < ALPHABET_DATA.length - 1) {
      const nextLetter = ALPHABET_DATA[letterIndex + 1].letter;
      if (!FREE_LETTERS.has(nextLetter) && !isPremiumUnlocked) {
        router.replace('/paywall');
      } else {
        router.replace(`/learn/${nextLetter}`);
      }
    }
  };

  // Guard: redirect to paywall if this letter isn't unlocked
  const isLocked = letter ? !FREE_LETTERS.has(letter) && !isPremiumUnlocked : false;
  React.useEffect(() => {
    if (isLocked) router.replace('/paywall');
  }, [isLocked]);

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

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
      >
        {/* Scene */}
        <SceneView letterData={letterData} customization={customization} />

        {/* Tracing label */}
        <Text style={[styles.traceLabel, { color: letterData.accentColor }]}>
          Trace the letter {letter}!
        </Text>

        {/* Tracer */}
        <View style={styles.tracerWrapper}>
          <LetterTracer
            key={tracerKey}
            letter={letter ?? 'A'}
            size={width - 64}
            accentColor={letterData.accentColor}
            onComplete={handleComplete}
            onProgress={handleProgress}
            onTouchingChange={(isTouching) => setScrollEnabled(!isTouching)}
          />
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.round(progress * 100)}%`,
                backgroundColor: letterData.accentColor,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(progress * 100)}% traced</Text>

        {/* Nav buttons */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navBtn, { opacity: letterIndex > 0 ? 1 : 0.3 }]}
            onPress={goToPrev}
            disabled={letterIndex === 0}
          >
            <Text style={styles.navBtnText}>← Prev</Text>
          </TouchableOpacity>
          <Text style={styles.pageIndicator}>
            {letterIndex + 1} / {ALPHABET_DATA.length}
          </Text>
          <TouchableOpacity
            style={[
              styles.navBtn,
              { opacity: letterIndex < ALPHABET_DATA.length - 1 ? 1 : 0.3 },
            ]}
            onPress={goToNext}
            disabled={letterIndex === ALPHABET_DATA.length - 1}
          >
            <Text style={styles.navBtnText}>Next →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
  safe: { flex: 1, backgroundColor: '#FFF9F0' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerBtn: { padding: 8 },
  headerBtnText: { fontSize: 16, color: '#607D8B', fontWeight: '600' },
  headerLetter: { fontSize: 40, fontWeight: '900' },
  scroll: { alignItems: 'center', paddingBottom: 32 },
  traceLabel: { fontSize: 20, fontWeight: '700', marginTop: 8, marginBottom: 8 },
  tracerWrapper: { marginHorizontal: 32 },
  progressTrack: {
    width: '80%',
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: { height: 12, borderRadius: 6 },
  progressText: { color: '#9E9E9E', marginTop: 4, fontSize: 14 },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 16,
  },
  navBtn: {
    backgroundColor: '#607D8B',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
  },
  navBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  pageIndicator: { fontSize: 16, color: '#9E9E9E' },
});
