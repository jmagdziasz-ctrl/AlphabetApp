import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NUMBER_DATA } from '@/constants/numberData';
import { SceneView } from '@/components/SceneView';
import { LetterTracer } from '@/components/LetterTracer';
import { FeedbackModal } from '@/components/FeedbackModal';
import { useAlphabetStore } from '@/store/alphabetStore';

export default function NumberLearnScreen() {
  const { number } = useLocalSearchParams<{ number: string }>();
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const numIndex  = NUMBER_DATA.findIndex(d => d.number === Number(number));
  const numData   = NUMBER_DATA[numIndex];
  const { customizations } = useAlphabetStore();

  const [progress, setProgress]         = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSuccess, setIsSuccess]       = useState(false);
  const [tracerKey, setTracerKey]       = useState(0);
  const attemptsRef = useRef(0);

  // Dynamic sizing — same approach as alphabet learn screen
  const FIXED_H    = 52 + 36 + 44 + 60 + 16;
  const available  = height - FIXED_H;
  const tracerSize = Math.floor(Math.min(width - 48, available * 0.55));
  const sceneHeight = Math.max(120, available - tracerSize);

  const handleComplete = useCallback((score: number) => {
    setIsSuccess(score >= 0.8);
    if (score < 0.8) attemptsRef.current += 1;
    setModalVisible(true);
  }, []);

  const goTo = (index: number) => {
    if (index < 0 || index >= NUMBER_DATA.length) { router.replace('/numbers'); return; }
    router.replace(`/numbers/${NUMBER_DATA[index].number}`);
  };

  const handleNext  = () => { setModalVisible(false); goTo(numIndex + 1); };
  const handleRetry = () => { setModalVisible(false); setProgress(0); setTracerKey(k => k + 1); };

  if (!numData) return null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: numData.bgColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerNum, { color: numData.accentColor }]}>{number}</Text>
        <TouchableOpacity onPress={handleNext} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>Skip →</Text>
        </TouchableOpacity>
      </View>

      {/* Scene image — reuse SceneView with number data mapped to LetterData shape */}
      <SceneView
        letterData={{
          letter: String(numData.number),
          defaultName: numData.characterName,
          sentence: numData.sentence,
          bgColor: numData.bgColor,
          accentColor: numData.accentColor,
          image: numData.image,
          facePosition: numData.facePosition,
        }}
        customization={customizations[String(numData.number)]}
        imageHeight={sceneHeight}
      />

      {/* Trace label */}
      <Text style={[styles.traceLabel, { color: numData.accentColor }]}>
        Trace the number {number}!
      </Text>

      {/* Tracer */}
      <View style={styles.tracerWrapper}>
        <LetterTracer
          key={tracerKey}
          letter={String(numData.number)}
          size={tracerSize}
          accentColor={numData.accentColor}
          onComplete={handleComplete}
          onProgress={setProgress}
          onTouchingChange={() => {}}
        />
      </View>

      {/* Progress */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, {
          width: `${Math.round(progress * 100)}%`,
          backgroundColor: numData.accentColor,
        }]} />
      </View>
      <Text style={styles.progressText}>{Math.round(progress * 100)}% traced</Text>

      {/* Nav */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navBtn, { opacity: numIndex > 0 ? 1 : 0.3 }]}
          onPress={() => goTo(numIndex - 1)} disabled={numIndex === 0}
        >
          <Text style={styles.navBtnText}>← Prev</Text>
        </TouchableOpacity>
        <Text style={styles.pageIndicator}>{numIndex + 1} / {NUMBER_DATA.length}</Text>
        <TouchableOpacity
          style={[styles.navBtn, { opacity: numIndex < NUMBER_DATA.length - 1 ? 1 : 0.3 }]}
          onPress={() => goTo(numIndex + 1)} disabled={numIndex === NUMBER_DATA.length - 1}
        >
          <Text style={styles.navBtnText}>Next →</Text>
        </TouchableOpacity>
      </View>

      <FeedbackModal
        visible={modalVisible} success={isSuccess}
        onNext={handleNext} onRetry={handleRetry}
        accentColor={numData.accentColor}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 6 },
  headerBtn:  { padding: 8 },
  headerBtnText: { fontSize: 16, color: '#607D8B', fontWeight: '600' },
  headerNum:  { fontSize: 36, fontWeight: '900' },
  displayCard: {
    alignSelf: 'center', flexDirection: 'row', alignItems: 'center',
    gap: 12, borderWidth: 2.5, borderRadius: 20,
    paddingHorizontal: 28, paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.6)', marginHorizontal: 16,
  },
  bigNumber:    { fontSize: 64, fontWeight: '900', lineHeight: 72 },
  word:         { fontSize: 20, fontWeight: '700' },
  traceLabel:   { fontSize: 18, fontWeight: '700', textAlign: 'center', marginVertical: 4 },
  tracerWrapper:{ alignItems: 'center' },
  progressTrack:{ alignSelf: 'center', width: '80%', height: 10, backgroundColor: '#E0E0E0', borderRadius: 5, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: 10, borderRadius: 5 },
  progressText: { color: '#9E9E9E', textAlign: 'center', marginTop: 2, fontSize: 13 },
  navRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 8, marginBottom: 4 },
  navBtn:       { backgroundColor: '#607D8B', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 50 },
  navBtnText:   { color: 'white', fontWeight: '700', fontSize: 15 },
  pageIndicator:{ fontSize: 15, color: '#9E9E9E' },
});
