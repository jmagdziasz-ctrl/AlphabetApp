import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  useWindowDimensions, ActivityIndicator, Image, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { STORY_DATA, STORY_CHARACTERS } from '@/constants/storyData';
import { useAlphabetStore } from '@/store/alphabetStore';

// ── Whisper word-timing data (exact timestamps from transcription) ───────────
const TIMING: Record<number, { word: string; start: number; end: number }[]> = {
  1:  require('@/assets/sounds/page1_timing.json'),
  2:  require('@/assets/sounds/page2_timing.json'),
  3:  require('@/assets/sounds/page3_timing.json'),
  4:  require('@/assets/sounds/page4_timing.json'),
  5:  require('@/assets/sounds/page5_timing.json'),
  6:  require('@/assets/sounds/page6_timing.json'),
  7:  require('@/assets/sounds/page7_timing.json'),
  8:  require('@/assets/sounds/page8_timing.json'),
  9:  require('@/assets/sounds/page9_timing.json'),
  10: require('@/assets/sounds/page10_timing.json'),
  11: require('@/assets/sounds/page11_timing.json'),
  12: require('@/assets/sounds/page12_timing.json'),
  13: require('@/assets/sounds/page13_timing.json'),
  14: require('@/assets/sounds/page14_timing.json'),
};

// Match a display-word index to a Whisper word by stripping punctuation and comparing.
// Returns the word index in the display `words` array that is currently being spoken.
function activeDisplayWord(
  positionSec: number,
  timingWords: { word: string; start: number; end: number }[],
  displayWords: string[],
): number {
  // Find which Whisper word is playing right now
  let whisperIdx = -1;
  for (let i = 0; i < timingWords.length; i++) {
    if (positionSec >= timingWords[i].start && positionSec < timingWords[i].end) {
      whisperIdx = i; break;
    }
    // In a gap between words, use the last word that finished
    if (positionSec >= timingWords[i].end &&
        (i + 1 >= timingWords.length || positionSec < timingWords[i + 1].start)) {
      whisperIdx = i; break;
    }
  }
  if (whisperIdx < 0) return -1;

  // Map whisper word index → display word index proportionally
  // (Whisper may split contractions or punctuation differently than split(/\s+/))
  const ratio = displayWords.length / timingWords.length;
  return Math.min(Math.round(whisperIdx * ratio), displayWords.length - 1);
}
// ─────────────────────────────────────────────────────────────────────────────

// Bundled narrator recordings — used when no parent recording exists for a page
const BUNDLED_AUDIO: Record<number, number> = {
  1:  require('@/assets/sounds/page1.mp3'),
  2:  require('@/assets/sounds/page2.mp3'),
  3:  require('@/assets/sounds/page3.mp3'),
  4:  require('@/assets/sounds/page4.mp3'),
  5:  require('@/assets/sounds/page5.mp3'),
  6:  require('@/assets/sounds/page6.mp3'),
  7:  require('@/assets/sounds/page7.mp3'),
  8:  require('@/assets/sounds/page8.mp3'),
  9:  require('@/assets/sounds/page9.mp3'),
  10: require('@/assets/sounds/page10.mp3'),
  11: require('@/assets/sounds/page11.mp3'),
  12: require('@/assets/sounds/page12.mp3'),
  13: require('@/assets/sounds/page13.mp3'),
  14: require('@/assets/sounds/page14.mp3'),
};

export default function StoryPageScreen() {
  const { page } = useLocalSearchParams<{ page: string }>();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { storyAudioUris, storyCharacters, storyPagePositions } = useAlphabetStore();

  const pageNum   = Number(page);
  const pageIndex = STORY_DATA.findIndex(p => p.page === pageNum);
  const pageData  = STORY_DATA[pageIndex];

  const soundRef       = useRef<Audio.Sound | null>(null);
  const lastWordIdxRef = useRef<number>(-1);
  const ttsTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing,       setPlaying]       = useState(false);
  const [ttsPlaying,    setTtsPlaying]    = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [activeWordIdx, setActiveWordIdx] = useState<number>(-1);

  // Parent recording takes priority; fall back to bundled narrator MP3
  const audioUri     = storyAudioUris[pageNum] ?? storyAudioUris[String(pageNum) as any];
  const bundledAudio = BUNDLED_AUDIO[pageNum];
  const words        = (pageData?.text ?? '').split(/\s+/).filter(Boolean);
  const hasText      = words.length > 0;

  // Exact Whisper timestamps for bundled audio (null for parent recordings)
  const timingWords = TIMING[pageNum] ?? null;

  // ── Clean up everything when page changes or unmounts ──────────────────
  useEffect(() => {
    return () => {
      // Stop recorded audio
      soundRef.current?.unloadAsync();
      soundRef.current = null;
      lastWordIdxRef.current = -1;
      // Stop TTS
      Speech.stop();
      if (ttsTimerRef.current) { clearTimeout(ttsTimerRef.current); ttsTimerRef.current = null; }
    };
  }, [page]);

  const clearHighlight = () => {
    lastWordIdxRef.current = -1;
    setActiveWordIdx(-1);
  };

  // ── Stop everything (called before navigating) ──────────────────────────
  const stopAll = async () => {
    // Stop recorded audio
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); } catch {}
      try { await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
    }
    setPlaying(false);
    // Stop TTS
    Speech.stop();
    if (ttsTimerRef.current) { clearTimeout(ttsTimerRef.current); ttsTimerRef.current = null; }
    setTtsPlaying(false);
    clearHighlight();
  };

  // ── Audio playback — parent recording or bundled narrator MP3 ───────────
  const playAudio = async (source: { uri: string } | number) => {
    try {
      setLoading(true);
      await stopAll();
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        typeof source === 'number' ? source : { uri: source.uri },
        { shouldPlay: true },
      );
      soundRef.current = sound;
      setPlaying(true);
      setLoading(false);

      sound.setOnPlaybackStatusUpdate((s) => {
        if (!s.isLoaded) return;
        if (s.didJustFinish) {
          setPlaying(false);
          clearHighlight();
          return;
        }
        if (s.isPlaying && words.length > 0) {
          const posSec = s.positionMillis / 1000;
          const idx = timingWords
            ? activeDisplayWord(posSec, timingWords, words)
            : Math.min(
                Math.floor((s.positionMillis / (s.durationMillis ?? 1)) * words.length),
                words.length - 1,
              );
          if (idx !== lastWordIdxRef.current) {
            lastWordIdxRef.current = idx;
            setActiveWordIdx(idx);
          }
        }
      });
    } catch {
      setLoading(false);
      setPlaying(false);
      clearHighlight();
      Alert.alert(
        'Playback Error',
        'Could not play the recording. Try re-recording this page in Parent Setup.',
      );
    }
  };

  // ── TTS playback (for pages with no recording) ──────────────────────────
  const playTTS = async () => {
    if (!hasText) return;
    await stopAll();
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

    // iOS requires an actual sound to be playing (or recently played) for
    // Speech.speak to be audible.  Play the success chime silently to prime
    // the audio session before we hand off to the speech synthesiser.
    try {
      const { sound: primer } = await Audio.Sound.createAsync(
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('@/assets/sounds/success.wav'),
        { shouldPlay: true, volume: 0.01 },
      );
      primer.setOnPlaybackStatusUpdate((s) => {
        if (s.isLoaded && s.didJustFinish) primer.unloadAsync();
      });
    } catch { /* ignore — speech will still attempt */ }

    setTtsPlaying(true);
    setActiveWordIdx(0);

    // Simple even-paced TTS timing (~300 ms per word)
    const msPerWord = 300;
    let idx = 0;
    const tick = () => {
      if (idx >= words.length) { setActiveWordIdx(-1); setTtsPlaying(false); return; }
      setActiveWordIdx(idx);
      idx++;
      ttsTimerRef.current = setTimeout(tick, msPerWord);
    };
    tick();

    // Wait for the primer to activate the audio session before speaking
    setTimeout(() => {
      Speech.speak(pageData.text ?? '', {
        language: 'en-US',
        rate: 0.85,
        pitch: 1.1,
        onDone: () => {
          if (ttsTimerRef.current) { clearTimeout(ttsTimerRef.current); ttsTimerRef.current = null; }
          setActiveWordIdx(-1);
          setTtsPlaying(false);
        },
        onError: () => {
          if (ttsTimerRef.current) { clearTimeout(ttsTimerRef.current); ttsTimerRef.current = null; }
          setActiveWordIdx(-1);
          setTtsPlaying(false);
        },
      });
    }, 300);
  };

  const stopTTS = () => {
    Speech.stop();
    if (ttsTimerRef.current) { clearTimeout(ttsTimerRef.current); ttsTimerRef.current = null; }
    setTtsPlaying(false);
    clearHighlight();
  };

  // ── Navigation — synchronous so nothing can block or crash the transition ──
  const goTo = (index: number) => {
    // Fire-and-forget audio cleanup (don't await — just navigate immediately)
    if (soundRef.current) {
      soundRef.current.stopAsync().catch(() => {});
      soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    Speech.stop();
    if (ttsTimerRef.current) { clearTimeout(ttsTimerRef.current); ttsTimerRef.current = null; }
    setPlaying(false);
    setTtsPlaying(false);
    clearHighlight();

    if (index < 0 || index >= STORY_DATA.length) { router.replace('/story'); return; }
    router.replace(`/story/${STORY_DATA[index].page}`);
  };

  if (!pageData) return null;

  const isAnyPlaying = playing || ttsPlaying;

  return (
    <View style={styles.container}>

      {/* Full-screen illustration */}
      {pageData.image ? (
        <Image source={pageData.image} style={{ width, height }} resizeMode="contain" />
      ) : (
        <View style={[styles.endPage, { backgroundColor: pageData.bgColor, width, height }]}>
          <Text style={[styles.endText, { color: pageData.accentColor }]}>{pageData.text}</Text>
        </View>
      )}

      {/* Character face overlays */}
      {(pageData.characterPositions ?? []).map((cp) => {
        const charDef  = STORY_CHARACTERS.find(c => c.key === cp.characterKey);
        if (!charDef) return null;
        const custom   = storyCharacters[cp.characterKey];
        const imageUri = custom?.customImageUri;
        if (!imageUri) return null;
        const stored = storyPagePositions[String(pageNum)]?.[cp.characterKey];
        const top    = stored?.top  ?? cp.defaultTop;
        const left   = stored?.left ?? cp.defaultLeft;
        const size   = stored?.size ?? cp.defaultSize;
        return (
          <View
            key={cp.characterKey}
            style={{
              position: 'absolute',
              top: top * height - size / 2,
              left: left * width - size / 2,
              width: size, height: size,
              borderRadius: size / 2,
              overflow: 'hidden',
            }}
          >
            <Image
              source={{ uri: imageUri }}
              style={{ width: size, height: size, transform: [{ rotate: `${custom?.customImageRotation ?? 0}deg` }] }}
            />
          </View>
        );
      })}

      {/* ── Floating overlay controls ── */}
      <SafeAreaView style={StyleSheet.absoluteFill} pointerEvents="box-none">

        {/* Top bar */}
        <View style={styles.topBar} pointerEvents="box-none">
          <TouchableOpacity style={styles.topBtn} onPress={() => router.back()}>
            <Text style={styles.topBtnText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.pagePill}>
            <Text style={styles.pagePillText}>{pageIndex + 1} / {STORY_DATA.length}</Text>
          </View>
          <View style={{ width: 72 }} />
        </View>

        {/* Story text bubble with word-by-word highlighting */}
        {hasText && pageData.image ? (
          <View style={styles.textBubble} pointerEvents="none">
            <Text style={styles.textBubbleContent}>
              {words.map((word, i) => (
                <Text
                  key={i}
                  style={i === activeWordIdx ? styles.wordHighlight : styles.wordNormal}
                >
                  {word}{i < words.length - 1 ? ' ' : ''}
                </Text>
              ))}
            </Text>
          </View>
        ) : null}

        {/* Bottom bar — prev + play + next */}
        <View style={styles.bottomBar} pointerEvents="box-none">
          <TouchableOpacity
            style={[styles.navBtn, { opacity: pageIndex > 0 ? 1 : 0.35 }]}
            onPress={() => goTo(pageIndex - 1)}
            disabled={pageIndex === 0}
          >
            <Text style={styles.navBtnText}>‹</Text>
          </TouchableOpacity>

          {audioUri || bundledAudio ? (
            /* ── Recorded or bundled audio ── */
            <TouchableOpacity
              style={styles.playBtn}
              onPress={playing
                ? () => { soundRef.current?.stopAsync().catch(() => {}); setPlaying(false); clearHighlight(); }
                : () => playAudio(audioUri ? { uri: audioUri } : bundledAudio!)}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#FFF" size="small" />
                : <Text style={styles.playBtnText}>{playing ? '⏹' : '▶'}</Text>
              }
            </TouchableOpacity>
          ) : hasText ? (
            /* ── TTS fallback (no audio at all) ── */
            <TouchableOpacity
              style={styles.ttsBtn}
              onPress={ttsPlaying ? stopTTS : playTTS}
              activeOpacity={0.85}
            >
              <Text style={styles.playBtnText}>{ttsPlaying ? '⏹' : '🔊'}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.playBtnPlaceholder} />
          )}

          <TouchableOpacity
            style={[styles.navBtn, { opacity: pageIndex < STORY_DATA.length - 1 ? 1 : 0.35 }]}
            onPress={() => goTo(pageIndex + 1)}
            disabled={pageIndex === STORY_DATA.length - 1}
          >
            <Text style={styles.navBtnText}>›</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  endPage:   { alignItems: 'center', justifyContent: 'center' },
  endText:   { fontSize: 48, fontWeight: '900', textAlign: 'center' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingTop: 4,
  },
  topBtn:      { backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20 },
  topBtnText:  { color: '#FFF', fontSize: 15, fontWeight: '700' },
  pagePill:    { backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 5, paddingHorizontal: 14, borderRadius: 20 },
  pagePillText:{ color: '#FFF', fontSize: 14, fontWeight: '700' },

  textBubble: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textBubbleContent: { flexDirection: 'row', flexWrap: 'wrap' },
  wordNormal:    { color: '#FFF', fontSize: 18, fontWeight: '600', lineHeight: 28 },
  wordHighlight: { color: '#FFE500', fontSize: 18, fontWeight: '800', lineHeight: 28 },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingBottom: 16,
  },
  navBtn: {
    backgroundColor: 'rgba(0,0,0,0.45)', width: 52, height: 52,
    borderRadius: 26, alignItems: 'center', justifyContent: 'center',
  },
  navBtnText: { color: '#FFF', fontSize: 34, fontWeight: '300', lineHeight: 38 },
  playBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)', width: 72, height: 72,
    borderRadius: 36, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.7)',
  },
  // TTS button — same size but blue tint so parents know it's not their recording
  ttsBtn: {
    backgroundColor: 'rgba(21,101,192,0.7)', width: 72, height: 72,
    borderRadius: 36, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.5)',
  },
  playBtnText:        { color: '#FFF', fontSize: 30, fontWeight: '900' },
  playBtnPlaceholder: { width: 72, height: 72 },
});
