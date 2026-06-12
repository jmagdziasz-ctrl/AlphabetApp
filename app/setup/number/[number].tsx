import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  TextInput,
  Alert,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';
import { NUMBER_DATA } from '@/constants/numberData';
import { SceneView } from '@/components/SceneView';
import { useAlphabetStore } from '@/store/alphabetStore';

export default function SetupNumberScreen() {
  const { number } = useLocalSearchParams<{ number: string }>();
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  // Match the learn screen's scene height so face positions align between setup and learn
  const LEARN_FIXED_H = 52 + 36 + 44 + 60 + 16;
  const available = height - LEARN_FIXED_H;
  const tracerSize = Math.floor(Math.min(width - 48, available * 0.55));
  const PREVIEW_HEIGHT = Math.max(120, available - tracerSize);
  const { customizations, setCustomization, clearCustomization } = useAlphabetStore();

  const numData = NUMBER_DATA.find(d => d.number === Number(number));
  const key = String(number);
  const existing = customizations[key];

  const [name,     setName]     = useState(existing?.customName ?? numData?.characterName ?? '');
  const [imageUri, setImageUri] = useState(existing?.customImageUri ?? '');
  const [rotation, setRotation] = useState(existing?.customImageRotation ?? 0);

  const [faceTop,    setFaceTop]    = useState(existing?.customFaceTop  ?? numData?.facePosition.top  ?? 0.25);
  const [faceLeft,   setFaceLeft]   = useState(existing?.customFaceLeft ?? numData?.facePosition.left ?? 0.5);
  const defaultW = existing?.customFaceSize ?? numData?.facePosition.size ?? 80;
  const [faceWidth,  setFaceWidth]  = useState(existing?.customFaceWidth  ?? defaultW);
  const [faceHeight, setFaceHeight] = useState(existing?.customFaceHeight ?? defaultW);

  const STEP      = 0.02;
  const SIZE_STEP = 5;

  if (!numData) return null;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setRotation(0);
    }
  };

  const rotate = (direction: 'left' | 'right') => {
    const delta = direction === 'right' ? 15 : -15;
    setRotation(r => (r + delta + 360) % 360);
  };

  const save = async () => {
    const origW = numData.facePosition.size ?? 80;
    await setCustomization(key, {
      customName:           name !== numData.characterName ? name : undefined,
      customImageUri:       imageUri || undefined,
      customImageRotation:  imageUri ? rotation : undefined,
      customImageUri2:      undefined,
      customImageRotation2: undefined,
      customCartoonUri:     undefined,
      customFaceTop:  faceTop  !== numData.facePosition.top  ? faceTop  : undefined,
      customFaceLeft: faceLeft !== numData.facePosition.left ? faceLeft : undefined,
      customFaceSize:   undefined,
      customFaceWidth:  faceWidth  !== origW ? faceWidth  : undefined,
      customFaceHeight: faceHeight !== origW ? faceHeight : undefined,
    });
    Alert.alert('Saved!', `Settings for "${number}" have been saved.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const reset = () => {
    Alert.alert('Reset', 'Remove all customizations for this number?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await clearCustomization(key);
          setName(numData.characterName);
          setImageUri('');
          setRotation(0);
          setFaceTop(numData.facePosition.top);
          setFaceLeft(numData.facePosition.left);
          setFaceWidth(numData.facePosition.size ?? 80);
          setFaceHeight(numData.facePosition.size ?? 80);
        },
      },
    ]);
  };

  const sceneLetterData = {
    letter:       String(numData.number),
    defaultName:  numData.characterName,
    sentence:     numData.sentence,
    bgColor:      numData.bgColor,
    accentColor:  numData.accentColor,
    image:        numData.image,
    facePosition: numData.facePosition,
  };

  const previewCustomization = {
    customName:           name !== numData.characterName ? name : undefined,
    customImageUri:       imageUri || undefined,
    customImageRotation:  rotation,
    customImageUri2:      undefined,
    customImageRotation2: undefined,
    customCartoonUri:     undefined,
    customFaceTop: faceTop, customFaceLeft: faceLeft,
    customFaceWidth: faceWidth, customFaceHeight: faceHeight,
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: numData.accentColor }]}>Edit "{numData.label}"</Text>
        <TouchableOpacity onPress={save} style={[styles.saveBtn, { backgroundColor: numData.accentColor }]}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Fixed preview — always visible above the scroll */}
      <View style={[styles.previewPanel, { width, height: PREVIEW_HEIGHT }]}>
        <SceneView
          letterData={sceneLetterData}
          customization={previewCustomization}
          imageHeight={PREVIEW_HEIGHT}
        />
      </View>

      {/* Scrollable controls below */}
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Name input */}
        <Text style={styles.sectionLabel}>Character Name</Text>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          placeholder={numData.characterName}
          maxLength={40}
        />
        <Text style={styles.hint}>Default: {numData.characterName}</Text>

        {/* Photo */}
        <Text style={styles.sectionLabel}>Character Face Photo</Text>
        <Text style={styles.hint}>Choose a photo and crop to the person's face. It will appear as a circle on the scene.</Text>
        <Text style={styles.hint}>Tip: center the face when cropping — the square edges will be hidden.</Text>
        <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
          <Text style={styles.photoBtnText}>📷 Choose Photo & Crop Face</Text>
        </TouchableOpacity>
        {imageUri ? (() => {
          // Independent proportional scaling: W+ → wider, H+ → taller
          const BASE  = 80;       // default number oval size
          const SCALE = 90 / BASE;
          const pvW = Math.max(16, Math.min(Math.round(faceWidth  * SCALE), 160));
          const pvH = Math.max(16, Math.min(Math.round(faceHeight * SCALE), 160));
          return (
            <View style={styles.photoPreviewBox}>
              <Text style={styles.photoLabel}>Your photo</Text>
              <View style={{ width: pvW, height: pvH, borderRadius: 9999, overflow: 'hidden', borderWidth: 3, borderColor: '#90CAF9', borderStyle: 'dashed' }}>
                <Image source={{ uri: imageUri }} style={{ width: pvW, height: pvH, transform: [{ rotate: `${rotation}deg` }] }} resizeMode="cover" />
              </View>
              <View style={styles.rotateRow}>
                <TouchableOpacity style={styles.rotateBtn} onPress={() => rotate('left')}>
                  <Text style={styles.rotateBtnText}>↺ Left</Text>
                </TouchableOpacity>
                <Text style={styles.rotateAngle}>{rotation}°</Text>
                <TouchableOpacity style={styles.rotateBtn} onPress={() => rotate('right')}>
                  <Text style={styles.rotateBtnText}>Right ↻</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })() : null}

        {/* Position & oval shape controls */}
        <View style={styles.circleControls}>
          <Text style={styles.circleControlsLabel}>📍 Adjust Face Position &amp; Oval Shape</Text>
          <View style={styles.dpadRow}>
            <View style={styles.dpadCenter}>
              <TouchableOpacity style={styles.dpadBtn} onPress={() => setFaceTop(v => Math.max(0, v - STEP))}>
                <Text style={styles.dpadText}>↑</Text>
              </TouchableOpacity>
              <View style={styles.dpadMiddleRow}>
                <TouchableOpacity style={styles.dpadBtn} onPress={() => setFaceLeft(v => Math.max(0, v - STEP))}>
                  <Text style={styles.dpadText}>←</Text>
                </TouchableOpacity>
                <View style={styles.dpadSpacer} />
                <TouchableOpacity style={styles.dpadBtn} onPress={() => setFaceLeft(v => Math.min(1, v + STEP))}>
                  <Text style={styles.dpadText}>→</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.dpadBtn} onPress={() => setFaceTop(v => Math.min(1, v + STEP))}>
                <Text style={styles.dpadText}>↓</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.ovalControls}>
              <View style={styles.ovalRow}>
                <Text style={styles.ovalLabel}>⤢ Size</Text>
                <TouchableOpacity style={styles.dpadBtn} onPress={() => { setFaceWidth(v => Math.max(20, v - SIZE_STEP)); setFaceHeight(v => Math.max(20, v - SIZE_STEP)); }}>
                  <Text style={styles.dpadText}>－</Text>
                </TouchableOpacity>
                <Text style={styles.sizeValue}>{Math.round((faceWidth + faceHeight) / 2)}</Text>
                <TouchableOpacity style={styles.dpadBtn} onPress={() => { setFaceWidth(v => Math.min(300, v + SIZE_STEP)); setFaceHeight(v => Math.min(300, v + SIZE_STEP)); }}>
                  <Text style={styles.dpadText}>＋</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.ovalRow}>
                <Text style={styles.ovalLabel}>↔ W</Text>
                <TouchableOpacity style={styles.dpadBtn} onPress={() => setFaceWidth(v => Math.max(20, v - SIZE_STEP))}>
                  <Text style={styles.dpadText}>－</Text>
                </TouchableOpacity>
                <Text style={styles.sizeValue}>{Math.round(faceWidth)}</Text>
                <TouchableOpacity style={styles.dpadBtn} onPress={() => setFaceWidth(v => Math.min(300, v + SIZE_STEP))}>
                  <Text style={styles.dpadText}>＋</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.ovalRow}>
                <Text style={styles.ovalLabel}>↕ H</Text>
                <TouchableOpacity style={styles.dpadBtn} onPress={() => setFaceHeight(v => Math.max(20, v - SIZE_STEP))}>
                  <Text style={styles.dpadText}>－</Text>
                </TouchableOpacity>
                <Text style={styles.sizeValue}>{Math.round(faceHeight)}</Text>
                <TouchableOpacity style={styles.dpadBtn} onPress={() => setFaceHeight(v => Math.min(300, v + SIZE_STEP))}>
                  <Text style={styles.dpadText}>＋</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Reset */}
        <TouchableOpacity style={styles.resetBtn} onPress={reset}>
          <Text style={styles.resetBtnText}>Reset to Default</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF9F0' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
  },
  backText:    { fontSize: 16, color: '#607D8B', fontWeight: '600' },
  title:       { fontSize: 22, fontWeight: '800' },
  saveBtn:     { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20 },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },

  previewPanel: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    overflow: 'hidden',
  },

  scroll:       { padding: 16, paddingBottom: 60 },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: '#37474F', marginTop: 20, marginBottom: 8 },
  nameInput: {
    borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12,
    padding: 14, fontSize: 18, fontWeight: '600', backgroundColor: '#FFF',
  },
  hint:         { fontSize: 13, color: '#9E9E9E', marginTop: 4 },
  photoBtn:     { backgroundColor: '#607D8B', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12, marginTop: 8 },
  photoBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  photoPreviewBox: { alignItems: 'center', marginBottom: 12 },
  photoLabel:   { fontSize: 13, color: '#9E9E9E', marginBottom: 8 },
  // oval thumbnail rendered inline — no fixed circleFrame needed
  rotateRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 10 },
  rotateBtn:    { backgroundColor: '#E0E0E0', paddingVertical: 7, paddingHorizontal: 14, borderRadius: 10 },
  rotateBtnText:{ fontSize: 15, fontWeight: '700', color: '#37474F' },
  rotateAngle:  { fontSize: 14, color: '#9E9E9E', minWidth: 40, textAlign: 'center' },
  resetBtn:     { marginTop: 32, borderWidth: 1.5, borderColor: '#F44336', padding: 14, borderRadius: 12, alignItems: 'center' },
  resetBtnText: { color: '#F44336', fontSize: 16, fontWeight: '700' },

  circleControls:      { backgroundColor: '#F5F5F5', borderRadius: 14, padding: 14, marginTop: 12, marginBottom: 4 },
  circleControlsLabel: { fontSize: 14, fontWeight: '700', color: '#37474F', marginBottom: 10 },
  dpadRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  dpadCenter:    { alignItems: 'center', gap: 4 },
  dpadMiddleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dpadSpacer:    { width: 40 },
  dpadBtn:       { backgroundColor: '#607D8B', width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dpadText:      { fontSize: 20, color: '#FFF', fontWeight: '700' },
  sizeValue:     { fontSize: 16, fontWeight: '700', color: '#37474F', minWidth: 36, textAlign: 'center' },
  ovalControls:  { gap: 10, justifyContent: 'center' },
  ovalRow:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ovalLabel:     { fontSize: 12, fontWeight: '700', color: '#607D8B', width: 44 },
});
