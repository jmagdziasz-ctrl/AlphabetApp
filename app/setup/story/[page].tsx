import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, Alert, ActivityIndicator, PanResponder,
  useWindowDimensions, ScrollView,
} from 'react-native';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STORY_DATA, STORY_CHARACTERS, StoryCharacterDef } from '@/constants/storyData';
import { useAlphabetStore, StoryCharacterCustomization } from '@/store/alphabetStore';

// Story images are 1200×896 px (landscape). Compute the rendered rect inside a
// resizeMode="contain" container so face circles land on the image, not the black bars.
const IMG_RATIO = 1200 / 896;
function getRenderedRect(screenW: number, screenH: number) {
  const containerRatio = screenW / screenH;
  let rW: number, rH: number;
  if (containerRatio > IMG_RATIO) {
    rH = screenH; rW = screenH * IMG_RATIO;
  } else {
    rW = screenW; rH = screenW / IMG_RATIO;
  }
  return { rW, rH, rX: (screenW - rW) / 2, rY: (screenH - rH) / 2 };
}

// ── Draggable circle component ────────────────────────────────────────────────
function DraggableCircle({
  charKey, def, custom, pos, screenWidth, screenHeight,
  onMove,
}: {
  charKey: string;
  def: StoryCharacterDef;
  custom?: StoryCharacterCustomization;
  pos: { top: number; left: number; size: number };
  screenWidth: number;
  screenHeight: number;
  onMove: (key: string, top: number, left: number) => void;
}) {
  const startPos   = useRef({ top: 0, left: 0 });
  const posRef     = useRef(pos);
  posRef.current   = pos;
  const onMoveRef  = useRef(onMove);
  onMoveRef.current = onMove;
  const swRef = useRef(screenWidth);
  swRef.current = screenWidth;
  const shRef = useRef(screenHeight);
  shRef.current = screenHeight;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startPos.current = { top: posRef.current.top, left: posRef.current.left };
      },
      onPanResponderMove: (_, { dx, dy }) => {
        // Convert pixel delta → fraction of RENDERED image rect (not full screen)
        const { rW, rH } = getRenderedRect(swRef.current, shRef.current);
        onMoveRef.current(
          charKey,
          Math.max(0, Math.min(1.2, startPos.current.top  + dy / rH)),
          Math.max(0, Math.min(1,   startPos.current.left + dx / rW)),
        );
      },
    })
  ).current;

  const imageUri    = custom?.customImageUri;
  const displayName = custom?.customName ?? def.defaultName;

  const { rW, rH, rX, rY } = getRenderedRect(screenWidth, screenHeight);
  return (
    <View
      {...panResponder.panHandlers}
      style={{
        position: 'absolute',
        top:  rY + pos.top  * rH - pos.size / 2,
        left: rX + pos.left * rW - pos.size / 2,
        width: pos.size, height: pos.size,
        borderRadius: pos.size / 2,
        overflow: 'hidden',
        backgroundColor: imageUri ? 'transparent' : def.bgColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{ width: pos.size, height: pos.size, transform: [{ rotate: `${custom?.customImageRotation ?? 0}deg` }] }}
        />
      ) : (
        <Text style={{ fontSize: pos.size * 0.45, fontWeight: '900', color: def.accentColor }}>
          {displayName.charAt(0)}
        </Text>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function SetupStoryPage() {
  const { page }  = useLocalSearchParams<{ page: string }>();
  const router    = useRouter();
  const { width, height } = useWindowDimensions();
  const pageNum   = Number(page);
  const pageData  = STORY_DATA.find(p => p.page === pageNum);

  const {
    storyCharacters, storyAudioUris, storyPagePositions,
    setStoryAudio, clearStoryAudio, setStoryPagePosition, clearStoryPagePosition,
  } = useAlphabetStore();

  const existingAudio = storyAudioUris[pageNum];

  const initialPositions = () => {
    const stored = storyPagePositions[String(pageNum)] ?? {};
    const result: Record<string, { top: number; left: number; size: number }> = {};
    for (const cp of pageData?.characterPositions ?? []) {
      result[cp.characterKey] = {
        top:  stored[cp.characterKey]?.top  ?? cp.defaultTop,
        left: stored[cp.characterKey]?.left ?? cp.defaultLeft,
        size: stored[cp.characterKey]?.size ?? cp.defaultSize,
      };
    }
    return result;
  };

  const [positions, setPositions] = useState<Record<string, { top: number; left: number; size: number }>>(initialPositions);

  const recordingRef   = useRef<Audio.Recording | null>(null);
  const soundRef       = useRef<Audio.Sound | null>(null);
  const [isRecording,  setIsRecording]  = useState(false);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [hasAudio,     setHasAudio]     = useState(!!existingAudio);

  if (!pageData) return null;

  const handleMove = (key: string, top: number, left: number) => {
    setPositions(prev => ({ ...prev, [key]: { ...prev[key], top, left } }));
  };

  const handleResize = (key: string, delta: number) => {
    setPositions(prev => ({
      ...prev,
      [key]: { ...prev[key], size: Math.max(20, prev[key].size + delta) },
    }));
  };

  const savePositions = async () => {
    for (const [key, pos] of Object.entries(positions)) {
      await setStoryPagePosition(pageNum, key, pos);
    }
    Alert.alert('Saved!', `Page ${pageNum} saved.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  // ── Recording ──────────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow microphone access.'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecording(true);
    } catch { Alert.alert('Error', 'Could not start recording.'); }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await recordingRef.current?.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recordingRef.current?.getURI();
      if (uri) { await setStoryAudio(pageNum, uri); setHasAudio(true); Alert.alert('✅ Saved!', 'Recording saved.'); }
      recordingRef.current = null;
    } catch { Alert.alert('Error', 'Could not save recording.'); }
  };

  const playRecording = async () => {
    const uri = storyAudioUris[pageNum];
    if (!uri) return;
    try {
      setLoadingAudio(true);
      if (soundRef.current) { await soundRef.current.unloadAsync(); soundRef.current = null; }
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      soundRef.current = sound;
      setIsPlaying(true);
      setLoadingAudio(false);
      sound.setOnPlaybackStatusUpdate(s => { if (s.isLoaded && s.didJustFinish) setIsPlaying(false); });
    } catch { setLoadingAudio(false); }
  };

  const stopPlayback   = async () => { await soundRef.current?.stopAsync(); setIsPlaying(false); };
  const deleteRecording = () => {
    Alert.alert('Delete Recording', 'Remove the recording for this page?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await clearStoryAudio(pageNum); setHasAudio(false); } },
    ]);
  };

  const chars = (pageData.characterPositions ?? []).map(cp => ({
    cp,
    def: STORY_CHARACTERS.find(c => c.key === cp.characterKey)!,
    custom: storyCharacters[cp.characterKey],
    pos: positions[cp.characterKey] ?? { top: cp.defaultTop, left: cp.defaultLeft, size: cp.defaultSize },
  })).filter(c => c.def);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>

      {/* Full-screen illustration */}
      {pageData.image ? (
        <Image source={pageData.image} style={{ width, height }} resizeMode="contain" />
      ) : (
        <View style={[styles.endPage, { backgroundColor: pageData.bgColor, width, height }]}>
          <Text style={[styles.endText, { color: pageData.accentColor }]}>{pageData.text}</Text>
        </View>
      )}

      {/* Draggable character circles */}
      {chars.map(({ cp, def, custom, pos }) => (
        <DraggableCircle
          key={cp.characterKey}
          charKey={cp.characterKey}
          def={def}
          custom={custom}
          pos={pos}
          screenWidth={width}
          screenHeight={height}
          onMove={handleMove}
        />
      ))}

      {/* Floating overlay */}
      <SafeAreaView style={StyleSheet.absoluteFill} pointerEvents="box-none">

        {/* Top bar */}
        <View style={styles.topBar} pointerEvents="box-none">
          <TouchableOpacity style={styles.topBtn} onPress={() => router.back()}>
            <Text style={styles.topBtnText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.pagePill}>
            <Text style={styles.pagePillText}>Page {pageNum} Setup</Text>
          </View>
          <TouchableOpacity style={[styles.topBtn, { backgroundColor: pageData.accentColor }]} onPress={savePositions}>
            <Text style={styles.topBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom panel */}
        <View style={styles.bottomPanel} pointerEvents="box-none">

          {/* Story text */}
          <ScrollView style={styles.textScroll} pointerEvents="auto">
            <Text style={styles.storyText}>{pageData.text}</Text>
          </ScrollView>

          {/* Recording controls */}
          <TouchableOpacity
            style={[styles.recordBtn, { backgroundColor: isRecording ? '#F44336' : pageData.accentColor }]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Text style={styles.recordBtnText}>
              {isRecording ? '⏹ Stop Recording' : '🎙️ Start Recording'}
            </Text>
          </TouchableOpacity>

          {hasAudio && !isRecording && (
            <View style={styles.audioRow} pointerEvents="auto">
              <TouchableOpacity
                style={[styles.previewBtn, { backgroundColor: pageData.accentColor }]}
                onPress={isPlaying ? stopPlayback : playRecording}
                disabled={loadingAudio}
              >
                {loadingAudio
                  ? <ActivityIndicator color="#FFF" size="small" />
                  : <Text style={styles.previewBtnText}>{isPlaying ? '⏹ Stop' : '▶ Preview'}</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={deleteRecording}>
                <Text style={styles.deleteBtnText}>🗑 Delete</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Per-character size controls */}
          {chars.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sizeRow} pointerEvents="auto">
              {chars.map(({ cp, def, custom, pos }) => {
                const displayName = custom?.customName ?? def.defaultName;
                return (
                  <View key={cp.characterKey} style={styles.sizeChip}>
                    <Text style={[styles.sizeChipName, { color: def.accentColor }]} numberOfLines={1}>
                      {displayName.split(' ')[0]}
                    </Text>
                    <View style={styles.sizeBtns}>
                      <TouchableOpacity style={styles.sizeBtn} onPress={() => handleResize(cp.characterKey, -5)}>
                        <Text style={styles.sizeBtnText}>－</Text>
                      </TouchableOpacity>
                      <Text style={[styles.sizeVal, { color: def.accentColor }]}>{Math.round(pos.size)}</Text>
                      <TouchableOpacity style={styles.sizeBtn} onPress={() => handleResize(cp.characterKey, 5)}>
                        <Text style={styles.sizeBtnText}>＋</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  endPage: { alignItems: 'center', justifyContent: 'center' },
  endText: { fontSize: 48, fontWeight: '900', textAlign: 'center' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingTop: 4,
  },
  topBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20,
  },
  topBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  pagePill: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 5, paddingHorizontal: 14, borderRadius: 20,
  },
  pagePillText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  bottomPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 16, paddingBottom: 20, paddingTop: 10,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  textScroll:    { maxHeight: 80, marginBottom: 10 },
  storyText:     { color: '#FFF', fontSize: 13, lineHeight: 19, opacity: 0.9 },

  recordBtn:     { padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  recordBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  audioRow:      { flexDirection: 'row', gap: 10, marginBottom: 10 },
  previewBtn:    { flex: 1, padding: 11, borderRadius: 12, alignItems: 'center' },
  previewBtnText:{ color: '#FFF', fontSize: 15, fontWeight: '700' },
  deleteBtn:     { borderWidth: 1.5, borderColor: '#F44336', padding: 11, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { color: '#F44336', fontSize: 13, fontWeight: '700' },

  sizeRow:  { flexDirection: 'row', marginTop: 6 },
  sizeChip: {
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 6, marginRight: 8, alignItems: 'center',
  },
  sizeChipName: { fontSize: 12, fontWeight: '800', marginBottom: 4 },
  sizeBtns:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sizeBtn:      { backgroundColor: 'rgba(255,255,255,0.2)', width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sizeBtnText:  { color: '#FFF', fontSize: 16, fontWeight: '700' },
  sizeVal:      { fontSize: 13, fontWeight: '700', minWidth: 24, textAlign: 'center' },
});
