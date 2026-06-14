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
import { useAlphabetStore, StoryCharacterCustomization } from '@/store/alphabetStore';

// Replace default character names with any custom names the parent has set.
// Applied to displayed text and TTS — recorded audio plays unchanged.
function personalizeText(
  raw: string,
  storyCharacters: Record<string, StoryCharacterCustomization>,
): string {
  let text = raw;
  for (const char of STORY_CHARACTERS) {
    const customName = storyCharacters[char.key]?.customName?.trim();
    if (customName && customName !== char.defaultName) {
      const escaped = char.defaultName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      text = text.replace(new RegExp(escaped, 'g'), customName);
    }
  }
  return text;
}

// Estimate how long (ms) the highlighter should stay on each word.
// Calibrated from Whisper timestamps of the original bundled TTS audio:
//   • Average speaking time  ≈ 305 ms for a 5-letter word
//   • iOS TTS pause after .!?  ≈ 550 ms
//   • iOS TTS pause after ,;:  ≈ 600 ms
//   • No measurable gap between consecutive plain words
function wordDurationMs(word: string): number {
  const letters = word.replace(/[^a-zA-Z]/g, '').length;
  const speak = Math.max(180, letters * 25 + 180);
  const pause = /[.!?]$/.test(word) ? 550 : /[,;:]$/.test(word) ? 600 : 0;
  return speak + pause;
}

export default function StoryPageScreen() {
  const { page } = useLocalSearchParams<{ page: string }>();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { storyAudioUris, storyCharacters, storyPagePositions } = useAlphabetStore();

  const pageNum   = Number(page);
  const pageIndex = STORY_DATA.findIndex(p => p.page === pageNum);
  const pageData  = STORY_DATA[pageIndex];

  const soundRef    = useRef<Audio.Sound | null>(null);
  const ttsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing,       setPlaying]       = useState(false);
  const [ttsPlaying,    setTtsPlaying]    = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [activeWordIdx, setActiveWordIdx] = useState<number>(-1);

  // Parent recording only — everything else uses TTS so names are always correct.
  const audioUri = storyAudioUris[pageNum] ?? storyAudioUris[String(pageNum) as any];

  // Personalise text: swap in custom character names for display and TTS.
  // Parent recordings play unchanged — re-record after renaming characters.
  const displayText = personalizeText(pageData?.text ?? '', storyCharacters);
  const words       = displayText.split(/\s+/).filter(Boolean);
  const hasText     = words.length > 0;

  // ── Clean up everything when page changes or unmounts ──────────────────
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
      soundRef.current = null;
      Speech.stop();
      if (ttsTimerRef.current) { clearTimeout(ttsTimerRef.current); ttsTimerRef.current = null; }
    };
  }, [page]);

  const clearHighlight = () => setActiveWordIdx(-1);

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

  // ── Parent recording playback ────────────────────────────────────────────
  const playAudio = async (uri: string) => {
    try {
      setLoading(true);
      await stopAll();
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      soundRef.current = sound;
      setPlaying(true);
      setLoading(false);
      sound.setOnPlaybackStatusUpdate((s) => {
        if (!s.isLoaded) return;
        if (s.didJustFinish) { setPlaying(false); clearHighlight(); }
      });
    } catch {
      setLoading(false);
      setPlaying(false);
      clearHighlight();
      Alert.alert('Playback Error', 'Could not play the recording. Try re-recording this page in Parent Setup.');
    }
  };

  // ── TTS playback — used whenever there is no parent recording ────────────
  const playTTS = async () => {
    if (!hasText) return;
    await stopAll();
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

    // iOS requires an actual sound to be playing (or recently played) for
    // Speech.speak to be audible. Play the success chime silently to prime
    // the audio session before handing off to the speech synthesiser.
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

    // Start speech and word highlighting together after the primer activates
    // the audio session. Highlighting advances word-by-word with durations
    // proportional to word length so it roughly tracks the TTS at rate=0.82.
    setTimeout(() => {
      let idx = 0;
      const advance = () => {
        if (idx >= words.length) return;
        setActiveWordIdx(idx);
        ttsTimerRef.current = setTimeout(advance, wordDurationMs(words[idx]));
        idx++;
      };
      advance();

      Speech.speak(displayText, {
        language: 'en-US',
        rate: 0.82,
        pitch: 1.0,
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

      {/* Character face overlays
          Story images are 1200×896 px (landscape) displayed with resizeMode="contain".
          We must compute the actual rendered image rect to position faces correctly on
          all screen sizes (especially iPad, which letterboxes more than phone). */}
      {(() => {
        const IMG_W = 1200, IMG_H = 896;
        const IMG_RATIO = IMG_W / IMG_H;
        const containerRatio = width / height;
        let renderedW: number, renderedH: number, renderedX: number, renderedY: number;
        if (containerRatio > IMG_RATIO) {
          // Container wider → pillarboxed (bars left/right)
          renderedH = height;
          renderedW = height * IMG_RATIO;
        } else {
          // Container taller → letterboxed (bars top/bottom)
          renderedW = width;
          renderedH = width / IMG_RATIO;
        }
        renderedX = (width  - renderedW) / 2;
        renderedY = (height - renderedH) / 2;

        return (pageData.characterPositions ?? []).map((cp) => {
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
                top:  renderedY + top  * renderedH - size / 2,
                left: renderedX + left * renderedW - size / 2,
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
        });
      })()}

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

          {audioUri ? (
            /* ── Parent recording ── */
            <TouchableOpacity
              style={styles.playBtn}
              onPress={playing
                ? () => { soundRef.current?.stopAsync().catch(() => {}); setPlaying(false); clearHighlight(); }
                : () => playAudio(audioUri)}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#FFF" size="small" />
                : <Text style={styles.playBtnText}>{playing ? '⏹' : '▶'}</Text>
              }
            </TouchableOpacity>
          ) : hasText ? (
            /* ── TTS (no parent recording — always used so names are correct) ── */
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
