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
import { ALPHABET_DATA } from '@/constants/alphabetData';
import { SceneView } from '@/components/SceneView';
import { useAlphabetStore } from '@/store/alphabetStore';

export default function SetupLetterScreen() {
  const { letter } = useLocalSearchParams<{ letter: string }>();
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  // Match the learn screen's scene height so face positions align between setup and learn
  const LEARN_FIXED_H = 52 + 36 + 44 + 60 + 16;
  const available = height - LEARN_FIXED_H;
  const tracerSize = Math.floor(Math.min(width - 48, available * 0.55));
  const PREVIEW_HEIGHT = Math.max(120, available - tracerSize);
  const { customizations, setCustomization, clearCustomization } = useAlphabetStore();

  const letterData = ALPHABET_DATA.find(d => d.letter === letter);
  const existing = customizations[letter ?? ''];
  const hasTwoCharacters = !!letterData?.secondFacePosition;

  const [name, setName]           = useState(existing?.customName ?? letterData?.defaultName ?? '');
  const [imageUri, setImageUri]   = useState(existing?.customImageUri  ?? '');
  const [rotation, setRotation]   = useState(existing?.customImageRotation  ?? 0);
  const [imageUri2, setImageUri2] = useState(existing?.customImageUri2 ?? '');
  const [rotation2, setRotation2] = useState(existing?.customImageRotation2 ?? 0);

  const [faceTop,    setFaceTop]    = useState(existing?.customFaceTop  ?? letterData?.facePosition.top  ?? 0.25);
  const [faceLeft,   setFaceLeft]   = useState(existing?.customFaceLeft ?? letterData?.facePosition.left ?? 0.5);
  // Width / height — fall back to legacy customFaceSize, then default
  const defaultW1 = existing?.customFaceSize ?? letterData?.facePosition.size ?? 96;
  const [faceWidth,  setFaceWidth]  = useState(existing?.customFaceWidth  ?? defaultW1);
  const [faceHeight, setFaceHeight] = useState(existing?.customFaceHeight ?? defaultW1);

  const [faceTop2,    setFaceTop2]    = useState(existing?.customFaceTop2  ?? letterData?.secondFacePosition?.top  ?? 0.25);
  const [faceLeft2,   setFaceLeft2]   = useState(existing?.customFaceLeft2 ?? letterData?.secondFacePosition?.left ?? 0.5);
  const defaultW2 = existing?.customFaceSize2 ?? letterData?.secondFacePosition?.size ?? 96;
  const [faceWidth2,  setFaceWidth2]  = useState(existing?.customFaceWidth2  ?? defaultW2);
  const [faceHeight2, setFaceHeight2] = useState(existing?.customFaceHeight2 ?? defaultW2);

  const STEP = 0.02;
  const SIZE_STEP = 5;

  if (!letterData) return null;

  const pickImage = async (slot: 1 | 2) => {
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
      if (slot === 1) { setImageUri(result.assets[0].uri); setRotation(0); }
      else            { setImageUri2(result.assets[0].uri); setRotation2(0); }
    }
  };

  const rotate = (slot: 1 | 2, direction: 'left' | 'right') => {
    const delta = direction === 'right' ? 15 : -15;
    if (slot === 1) setRotation(r => (r + delta + 360) % 360);
    else            setRotation2(r => (r + delta + 360) % 360);
  };

  const save = async () => {
    const origW1 = letterData.facePosition.size ?? 96;
    const origW2 = letterData.secondFacePosition?.size ?? 96;
    await setCustomization(letter ?? '', {
      customName: name !== letterData.defaultName ? name : undefined,
      customImageUri: imageUri || undefined,
      customImageRotation: imageUri ? rotation : undefined,
      customImageUri2: hasTwoCharacters ? (imageUri2 || undefined) : undefined,
      customImageRotation2: hasTwoCharacters && imageUri2 ? rotation2 : undefined,
      customCartoonUri: undefined,
      customFaceTop:  faceTop  !== letterData.facePosition.top  ? faceTop  : undefined,
      customFaceLeft: faceLeft !== letterData.facePosition.left ? faceLeft : undefined,
      customFaceSize: undefined,  // superseded by width/height
      customFaceWidth:  faceWidth  !== origW1 ? faceWidth  : undefined,
      customFaceHeight: faceHeight !== origW1 ? faceHeight : undefined,
      customFaceTop2:  hasTwoCharacters ? (faceTop2  !== letterData.secondFacePosition?.top  ? faceTop2  : undefined) : undefined,
      customFaceLeft2: hasTwoCharacters ? (faceLeft2 !== letterData.secondFacePosition?.left ? faceLeft2 : undefined) : undefined,
      customFaceSize2:  undefined,
      customFaceWidth2:  hasTwoCharacters ? (faceWidth2  !== origW2 ? faceWidth2  : undefined) : undefined,
      customFaceHeight2: hasTwoCharacters ? (faceHeight2 !== origW2 ? faceHeight2 : undefined) : undefined,
    });
    Alert.alert('Saved!', `Settings for "${letter}" have been saved.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const reset = () => {
    Alert.alert('Reset', 'Remove all customizations for this letter?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await clearCustomization(letter ?? '');
          setName(letterData.defaultName);
          setImageUri('');  setRotation(0);
          setImageUri2(''); setRotation2(0);
          setFaceTop(letterData.facePosition.top);
          setFaceLeft(letterData.facePosition.left);
          setFaceWidth(letterData.facePosition.size ?? 96);
          setFaceHeight(letterData.facePosition.size ?? 96);
          setFaceTop2(letterData.secondFacePosition?.top ?? 0.25);
          setFaceLeft2(letterData.secondFacePosition?.left ?? 0.5);
          setFaceWidth2(letterData.secondFacePosition?.size ?? 96);
          setFaceHeight2(letterData.secondFacePosition?.size ?? 96);
        },
      },
    ]);
  };

  const previewCustomization = {
    customName: name !== letterData.defaultName ? name : undefined,
    customImageUri: imageUri || undefined,
    customImageRotation: rotation,
    customImageUri2: imageUri2 || undefined,
    customImageRotation2: rotation2,
    customCartoonUri: undefined,
    customFaceTop: faceTop, customFaceLeft: faceLeft,
    customFaceWidth: faceWidth, customFaceHeight: faceHeight,
    customFaceTop2: faceTop2, customFaceLeft2: faceLeft2,
    customFaceWidth2: faceWidth2, customFaceHeight2: faceHeight2,
  };

  // Live oval preview thumbnail — updates as W/H change.
  // Uses independent proportional scaling so W+ → wider preview,
  // H+ → taller preview, with no cross-axis confusion.
  const OvalThumb = ({ uri, rotation: rot, w, h }: { uri: string; rotation: number; w: number; h: number }) => {
    const BASE  = 96;       // reference size (default letter oval)
    const SCALE = 90 / BASE; // 90 px preview for a default-sized oval
    const pvW = Math.max(16, Math.min(Math.round(w * SCALE), 160));
    const pvH = Math.max(16, Math.min(Math.round(h * SCALE), 160));
    return (
      <View style={{ width: pvW, height: pvH, borderRadius: 9999, overflow: 'hidden', borderWidth: 3, borderColor: '#90CAF9', borderStyle: 'dashed' }}>
        <Image source={{ uri }} style={{ width: pvW, height: pvH, transform: [{ rotate: `${rot}deg` }] }} resizeMode="cover" />
      </View>
    );
  };

  const OvalControls = ({
    top, left, width, height, onTop, onLeft, onWidth, onHeight, label,
  }: {
    top: number; left: number; width: number; height: number;
    onTop: (v: number) => void; onLeft: (v: number) => void;
    onWidth: (v: number) => void; onHeight: (v: number) => void;
    label: string;
  }) => (
    <View style={styles.circleControls}>
      <Text style={styles.circleControlsLabel}>📍 Adjust {label} Position &amp; Oval Shape</Text>
      <View style={styles.dpadRow}>

        {/* D-pad: position */}
        <View style={styles.dpadCenter}>
          <TouchableOpacity style={styles.dpadBtn} onPress={() => onTop(Math.max(0, top - STEP))}>
            <Text style={styles.dpadText}>↑</Text>
          </TouchableOpacity>
          <View style={styles.dpadMiddleRow}>
            <TouchableOpacity style={styles.dpadBtn} onPress={() => onLeft(Math.max(0, left - STEP))}>
              <Text style={styles.dpadText}>←</Text>
            </TouchableOpacity>
            <View style={styles.dpadSpacer} />
            <TouchableOpacity style={styles.dpadBtn} onPress={() => onLeft(Math.min(1, left + STEP))}>
              <Text style={styles.dpadText}>→</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.dpadBtn} onPress={() => onTop(Math.min(1, top + STEP))}>
            <Text style={styles.dpadText}>↓</Text>
          </TouchableOpacity>
        </View>

        {/* Size / Width / Height controls */}
        <View style={styles.ovalControls}>
          <View style={styles.ovalRow}>
            <Text style={styles.ovalLabel}>⤢ Size</Text>
            <TouchableOpacity style={styles.dpadBtn} onPress={() => { onWidth(Math.max(20, width - SIZE_STEP)); onHeight(Math.max(20, height - SIZE_STEP)); }}>
              <Text style={styles.dpadText}>－</Text>
            </TouchableOpacity>
            <Text style={styles.sizeValue}>{Math.round((width + height) / 2)}</Text>
            <TouchableOpacity style={styles.dpadBtn} onPress={() => { onWidth(Math.min(300, width + SIZE_STEP)); onHeight(Math.min(300, height + SIZE_STEP)); }}>
              <Text style={styles.dpadText}>＋</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.ovalRow}>
            <Text style={styles.ovalLabel}>↔ W</Text>
            <TouchableOpacity style={styles.dpadBtn} onPress={() => onWidth(Math.max(20, width - SIZE_STEP))}>
              <Text style={styles.dpadText}>－</Text>
            </TouchableOpacity>
            <Text style={styles.sizeValue}>{Math.round(width)}</Text>
            <TouchableOpacity style={styles.dpadBtn} onPress={() => onWidth(Math.min(300, width + SIZE_STEP))}>
              <Text style={styles.dpadText}>＋</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.ovalRow}>
            <Text style={styles.ovalLabel}>↕ H</Text>
            <TouchableOpacity style={styles.dpadBtn} onPress={() => onHeight(Math.max(20, height - SIZE_STEP))}>
              <Text style={styles.dpadText}>－</Text>
            </TouchableOpacity>
            <Text style={styles.sizeValue}>{Math.round(height)}</Text>
            <TouchableOpacity style={styles.dpadBtn} onPress={() => onHeight(Math.min(300, height + SIZE_STEP))}>
              <Text style={styles.dpadText}>＋</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </View>
  );

  const names = letterData.defaultName.split(' and ');
  const name1Label = names[0] ?? 'Character';
  const name2Label = names[1] ?? 'Second Character';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: letterData.accentColor }]}>Edit "{letter}"</Text>
        <TouchableOpacity onPress={save} style={[styles.saveBtn, { backgroundColor: letterData.accentColor }]}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Fixed preview — always visible above the scroll */}
      <View style={[styles.previewPanel, { width, height: PREVIEW_HEIGHT }]}>
        <SceneView
          letterData={letterData}
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
          placeholder={letterData.defaultName}
          maxLength={40}
        />
        <Text style={styles.hint}>Default: {letterData.defaultName}</Text>

        {hasTwoCharacters ? (
          <>
            {/* First character */}
            <Text style={styles.sectionLabel}>📷 {name1Label}'s Face Photo</Text>
            <Text style={styles.hint}>Tip: center the face when cropping — the square edges will be hidden.</Text>
            <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(1)}>
              <Text style={styles.photoBtnText}>Choose Photo for {name1Label}</Text>
            </TouchableOpacity>
            {imageUri ? (
              <View style={styles.photoPreviewBox}>
                <Text style={styles.photoLabel}>{name1Label}</Text>
                <OvalThumb uri={imageUri} rotation={rotation} w={faceWidth} h={faceHeight} />
                <View style={styles.rotateRow}>
                  <TouchableOpacity style={styles.rotateBtn} onPress={() => rotate(1, 'left')}>
                    <Text style={styles.rotateBtnText}>↺ Left</Text>
                  </TouchableOpacity>
                  <Text style={styles.rotateAngle}>{rotation}°</Text>
                  <TouchableOpacity style={styles.rotateBtn} onPress={() => rotate(1, 'right')}>
                    <Text style={styles.rotateBtnText}>Right ↻</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
            <OvalControls
              label={name1Label} top={faceTop} left={faceLeft} width={faceWidth} height={faceHeight}
              onTop={setFaceTop} onLeft={setFaceLeft} onWidth={setFaceWidth} onHeight={setFaceHeight}
            />

            {/* Second character */}
            <Text style={styles.sectionLabel}>📷 {name2Label}'s Face Photo</Text>
            <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(2)}>
              <Text style={styles.photoBtnText}>Choose Photo for {name2Label}</Text>
            </TouchableOpacity>
            {imageUri2 ? (
              <View style={styles.photoPreviewBox}>
                <Text style={styles.photoLabel}>{name2Label}</Text>
                <OvalThumb uri={imageUri2} rotation={rotation2} w={faceWidth2} h={faceHeight2} />
                <View style={styles.rotateRow}>
                  <TouchableOpacity style={styles.rotateBtn} onPress={() => rotate(2, 'left')}>
                    <Text style={styles.rotateBtnText}>↺ Left</Text>
                  </TouchableOpacity>
                  <Text style={styles.rotateAngle}>{rotation2}°</Text>
                  <TouchableOpacity style={styles.rotateBtn} onPress={() => rotate(2, 'right')}>
                    <Text style={styles.rotateBtnText}>Right ↻</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
            <OvalControls
              label={name2Label} top={faceTop2} left={faceLeft2} width={faceWidth2} height={faceHeight2}
              onTop={setFaceTop2} onLeft={setFaceLeft2} onWidth={setFaceWidth2} onHeight={setFaceHeight2}
            />
          </>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Character Face Photo</Text>
            <Text style={styles.hint}>Choose a photo and crop to the person's face. It will appear as a circle on the scene.</Text>
            <Text style={styles.hint}>Tip: center the face when cropping — the square edges will be hidden.</Text>
            <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(1)}>
              <Text style={styles.photoBtnText}>📷 Choose Photo & Crop Face</Text>
            </TouchableOpacity>
            {imageUri ? (
              <View style={styles.photoPreviewBox}>
                <Text style={styles.photoLabel}>Your photo</Text>
                <OvalThumb uri={imageUri} rotation={rotation} w={faceWidth} h={faceHeight} />
                <View style={styles.rotateRow}>
                  <TouchableOpacity style={styles.rotateBtn} onPress={() => rotate(1, 'left')}>
                    <Text style={styles.rotateBtnText}>↺ Left</Text>
                  </TouchableOpacity>
                  <Text style={styles.rotateAngle}>{rotation}°</Text>
                  <TouchableOpacity style={styles.rotateBtn} onPress={() => rotate(1, 'right')}>
                    <Text style={styles.rotateBtnText}>Right ↻</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
            <OvalControls
              label="Face" top={faceTop} left={faceLeft} width={faceWidth} height={faceHeight}
              onTop={setFaceTop} onLeft={setFaceLeft} onWidth={setFaceWidth} onHeight={setFaceHeight}
            />
          </>
        )}

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
  // circleFrame / photoThumb replaced by inline OvalThumb component
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
