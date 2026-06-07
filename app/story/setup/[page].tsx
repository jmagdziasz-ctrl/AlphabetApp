import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Image, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STORY_DATA } from '@/constants/storyData';
import { useAlphabetStore } from '@/store/alphabetStore';

export default function StorySetupPage() {
  const { page } = useLocalSearchParams<{ page: string }>();
  const router   = useRouter();
  const pageNum  = Number(page);
  const pageData = STORY_DATA.find(p => p.page === pageNum);

  const { storyCustomizations, storyAudioUris, setStoryCustomization, setStoryAudio, clearStoryAudio } = useAlphabetStore();
  const existing = storyCustomizations[pageNum];
  const existingAudio = storyAudioUris[pageNum];

  const [imageUri,  setImageUri]  = useState(existing?.customImageUri  ?? '');
  const [rotation,  setRotation]  = useState(existing?.customImageRotation  ?? 0);
  const [imageUri2, setImageUri2] = useState(existing?.customImageUri2 ?? '');
  const [rotation2, setRotation2] = useState(existing?.customImageRotation2 ?? 0);

  // Recording state
  const recordingRef  = useRef<Audio.Recording | null>(null);
  const [isRecording, setIsRecording]   = useState(false);
  const [isPlaying,   setIsPlaying]     = useState(false);
  const [loadingAudio,setLoadingAudio]  = useState(false);
  const [hasAudio,    setHasAudio]      = useState(!!existingAudio);
  const soundRef = useRef<Audio.Sound | null>(null);

  if (!pageData) return null;

  const pickImage = async (slot: 1 | 2) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow photo access.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      if (slot === 1) { setImageUri(result.assets[0].uri); setRotation(0); }
      else            { setImageUri2(result.assets[0].uri); setRotation2(0); }
    }
  };

  const rotate = (slot: 1 | 2, dir: 'left' | 'right') => {
    const delta = dir === 'right' ? 15 : -15;
    if (slot === 1) setRotation(r => (r + delta + 360) % 360);
    else            setRotation2(r => (r + delta + 360) % 360);
  };

  // ── Recording ─────────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow microphone access.'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (e) {
      Alert.alert('Error', 'Could not start recording.');
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await recordingRef.current?.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recordingRef.current?.getURI();
      if (uri) {
        await setStoryAudio(pageNum, uri);
        setHasAudio(true);
        Alert.alert('✅ Saved!', 'Your recording has been saved for this page.');
      }
      recordingRef.current = null;
    } catch (e) {
      Alert.alert('Error', 'Could not save recording.');
    }
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
      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.isLoaded && s.didJustFinish) setIsPlaying(false);
      });
    } catch { setLoadingAudio(false); }
  };

  const stopPlayback = async () => {
    await soundRef.current?.stopAsync();
    setIsPlaying(false);
  };

  const deleteRecording = () => {
    Alert.alert('Delete Recording', 'Remove the recording for this page?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await clearStoryAudio(pageNum);
        setHasAudio(false);
      }},
    ]);
  };

  const save = async () => {
    await setStoryCustomization(pageNum, {
      customImageUri:      imageUri  || undefined,
      customImageRotation: imageUri  ? rotation  : undefined,
      customImageUri2:     imageUri2 || undefined,
      customImageRotation2:imageUri2 ? rotation2 : undefined,
    });
    Alert.alert('Saved!', `Page ${pageNum} has been saved.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: pageData.accentColor }]}>Page {pageNum}</Text>
        <TouchableOpacity onPress={save} style={[styles.saveBtn, { backgroundColor: pageData.accentColor }]}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Story text preview */}
        <View style={[styles.textPreview, { backgroundColor: pageData.bgColor, borderColor: pageData.accentColor }]}>
          <Text style={[styles.previewText, { color: pageData.accentColor }]}>{pageData.text}</Text>
        </View>

        {/* ── Recording section ── */}
        <Text style={styles.sectionLabel}>🎙️ Page Recording</Text>
        <Text style={styles.hint}>
          Record yourself reading this page. Your child can tap ▶ Play to hear your voice.
        </Text>

        {/* Record button */}
        <TouchableOpacity
          style={[styles.recordBtn, { backgroundColor: isRecording ? '#F44336' : pageData.accentColor }]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Text style={styles.recordBtnText}>
            {isRecording ? '⏹ Stop Recording' : '🎙️ Start Recording'}
          </Text>
        </TouchableOpacity>

        {/* Playback / delete existing recording */}
        {hasAudio && !isRecording && (
          <View style={styles.audioRow}>
            <TouchableOpacity
              style={[styles.playBtn, { backgroundColor: pageData.accentColor }]}
              onPress={isPlaying ? stopPlayback : playRecording}
              disabled={loadingAudio}
            >
              {loadingAudio
                ? <ActivityIndicator color="#FFF" size="small" />
                : <Text style={styles.playBtnText}>{isPlaying ? '⏹ Stop' : '▶ Preview'}</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={deleteRecording}>
              <Text style={styles.deleteBtnText}>🗑 Delete</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Character photos ── */}
        <Text style={styles.sectionLabel}>📷 Character 1 Photo</Text>
        <Text style={styles.hint}>Tip: center the face when cropping.</Text>
        <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(1)}>
          <Text style={styles.photoBtnText}>Choose Photo for Character 1</Text>
        </TouchableOpacity>
        {imageUri ? (
          <View style={styles.photoPreviewBox}>
            <View style={styles.circleFrame}>
              <Image source={{ uri: imageUri }} style={[styles.photoThumb, { transform: [{ rotate: `${rotation}deg` }] }]} />
            </View>
            <View style={styles.rotateRow}>
              <TouchableOpacity style={styles.rotateBtn} onPress={() => rotate(1, 'left')}><Text style={styles.rotateBtnText}>↺ Left</Text></TouchableOpacity>
              <Text style={styles.rotateAngle}>{rotation}°</Text>
              <TouchableOpacity style={styles.rotateBtn} onPress={() => rotate(1, 'right')}><Text style={styles.rotateBtnText}>Right ↻</Text></TouchableOpacity>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>📷 Character 2 Photo</Text>
        <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(2)}>
          <Text style={styles.photoBtnText}>Choose Photo for Character 2</Text>
        </TouchableOpacity>
        {imageUri2 ? (
          <View style={styles.photoPreviewBox}>
            <View style={styles.circleFrame}>
              <Image source={{ uri: imageUri2 }} style={[styles.photoThumb, { transform: [{ rotate: `${rotation2}deg` }] }]} />
            </View>
            <View style={styles.rotateRow}>
              <TouchableOpacity style={styles.rotateBtn} onPress={() => rotate(2, 'left')}><Text style={styles.rotateBtnText}>↺ Left</Text></TouchableOpacity>
              <Text style={styles.rotateAngle}>{rotation2}°</Text>
              <TouchableOpacity style={styles.rotateBtn} onPress={() => rotate(2, 'right')}><Text style={styles.rotateBtnText}>Right ↻</Text></TouchableOpacity>
            </View>
          </View>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#FFF9F0' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  backText:    { fontSize: 16, color: '#607D8B', fontWeight: '600' },
  title:       { fontSize: 20, fontWeight: '800' },
  saveBtn:     { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20 },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  scroll:      { padding: 16, paddingBottom: 60 },
  textPreview: { borderRadius: 16, borderWidth: 2, padding: 16, marginBottom: 8 },
  previewText: { fontSize: 16, fontWeight: '600', lineHeight: 24, textAlign: 'center' },
  sectionLabel:{ fontSize: 16, fontWeight: '700', color: '#37474F', marginTop: 24, marginBottom: 8 },
  hint:        { fontSize: 13, color: '#9E9E9E', marginBottom: 8 },
  recordBtn:   { padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  recordBtnText:{ color: 'white', fontSize: 17, fontWeight: '800' },
  audioRow:    { flexDirection: 'row', gap: 12, marginBottom: 8 },
  playBtn:     { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
  playBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
  deleteBtn:   { borderWidth: 1.5, borderColor: '#F44336', padding: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText:{ color: '#F44336', fontSize: 14, fontWeight: '700' },
  photoBtn:    { backgroundColor: '#607D8B', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12, marginTop: 4 },
  photoBtnText:{ color: 'white', fontSize: 16, fontWeight: '700' },
  photoPreviewBox:{ alignItems: 'center', marginBottom: 12 },
  circleFrame: { width: 110, height: 110, borderRadius: 55, overflow: 'hidden', borderWidth: 3, borderColor: '#90CAF9', borderStyle: 'dashed' },
  photoThumb:  { width: 110, height: 110 },
  rotateRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 10 },
  rotateBtn:   { backgroundColor: '#E0E0E0', paddingVertical: 7, paddingHorizontal: 14, borderRadius: 10 },
  rotateBtnText:{ fontSize: 15, fontWeight: '700', color: '#37474F' },
  rotateAngle: { fontSize: 14, color: '#9E9E9E', minWidth: 40, textAlign: 'center' },
});
