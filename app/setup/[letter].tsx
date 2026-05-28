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
import { ALPHABET_DATA } from '@/constants/alphabetData';
import { SceneView } from '@/components/SceneView';
import { useAlphabetStore } from '@/store/alphabetStore';

export default function SetupLetterScreen() {
  const { letter } = useLocalSearchParams<{ letter: string }>();
  const router = useRouter();
  const { customizations, setCustomization, clearCustomization } = useAlphabetStore();

  const letterData = ALPHABET_DATA.find(d => d.letter === letter);
  const existing = customizations[letter ?? ''];
  const hasTwoCharacters = !!letterData?.secondFacePosition;

  const [name, setName] = useState(existing?.customName ?? letterData?.defaultName ?? '');
  const [imageUri, setImageUri]       = useState(existing?.customImageUri  ?? '');
  const [rotation, setRotation]       = useState(existing?.customImageRotation  ?? 0);
  const [imageUri2, setImageUri2]     = useState(existing?.customImageUri2 ?? '');
  const [rotation2, setRotation2]     = useState(existing?.customImageRotation2 ?? 0);

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
    await setCustomization(letter ?? '', {
      customName: name !== letterData.defaultName ? name : undefined,
      customImageUri: imageUri || undefined,
      customImageRotation: imageUri ? rotation : undefined,
      customImageUri2: hasTwoCharacters ? (imageUri2 || undefined) : undefined,
      customImageRotation2: hasTwoCharacters && imageUri2 ? rotation2 : undefined,
      customCartoonUri: undefined,
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
  };

  // Split "Tucker and Tate" into two names for labels
  const names = letterData.defaultName.split(' and ');
  const name1Label = names[0] ?? 'Character';
  const name2Label = names[1] ?? 'Second Character';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: letterData.accentColor }]}>
          Edit "{letter}"
        </Text>
        <TouchableOpacity
          onPress={save}
          style={[styles.saveBtn, { backgroundColor: letterData.accentColor }]}
        >
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Live preview */}
        <Text style={styles.sectionLabel}>Preview</Text>
        <SceneView letterData={letterData} customization={previewCustomization} />

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

        {/* Photo section — one picker or two for letters with two characters */}
        {hasTwoCharacters ? (
          <>
            {/* --- First character --- */}
            <Text style={styles.sectionLabel}>📷 {name1Label}'s Face Photo</Text>
            <Text style={styles.hint}>
              Tip: center the face when cropping — the square edges will be hidden.
            </Text>
            <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(1)}>
              <Text style={styles.photoBtnText}>Choose Photo for {name1Label}</Text>
            </TouchableOpacity>
            {imageUri ? (
              <View style={styles.photoPreviewBox}>
                <Text style={styles.photoLabel}>{name1Label}</Text>
                <View style={styles.circleFrame}>
                  <Image
                    source={{ uri: imageUri }}
                    style={[styles.photoThumb, { transform: [{ rotate: `${rotation}deg` }] }]}
                  />
                </View>
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

            {/* --- Second character --- */}
            <Text style={styles.sectionLabel}>📷 {name2Label}'s Face Photo</Text>
            <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(2)}>
              <Text style={styles.photoBtnText}>Choose Photo for {name2Label}</Text>
            </TouchableOpacity>
            {imageUri2 ? (
              <View style={styles.photoPreviewBox}>
                <Text style={styles.photoLabel}>{name2Label}</Text>
                <View style={styles.circleFrame}>
                  <Image
                    source={{ uri: imageUri2 }}
                    style={[styles.photoThumb, { transform: [{ rotate: `${rotation2}deg` }] }]}
                  />
                </View>
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
          </>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Character Face Photo</Text>
            <Text style={styles.hint}>
              Choose a photo and crop to the person's face. It will appear as a circle on the scene.
            </Text>
            <Text style={styles.hint}>
              Tip: center the face when cropping — the square edges will be hidden.
            </Text>
            <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(1)}>
              <Text style={styles.photoBtnText}>📷 Choose Photo & Crop Face</Text>
            </TouchableOpacity>
            {imageUri ? (
              <View style={styles.photoPreviewBox}>
                <Text style={styles.photoLabel}>Your photo</Text>
                <View style={styles.circleFrame}>
                  <Image
                    source={{ uri: imageUri }}
                    style={[styles.photoThumb, { transform: [{ rotate: `${rotation}deg` }] }]}
                  />
                </View>
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
          </>
        )}

        {/* Reset button */}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backText: { fontSize: 16, color: '#607D8B', fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '800' },
  saveBtn: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20 },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  scroll: { padding: 16, paddingBottom: 60 },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#37474F',
    marginTop: 20,
    marginBottom: 8,
  },
  nameInput: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: '#FFF',
  },
  hint: { fontSize: 13, color: '#9E9E9E', marginTop: 4 },
  photoBtn: {
    backgroundColor: '#607D8B',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  photoBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  photoPreviewBox: { alignItems: 'center', marginBottom: 12 },
  photoLabel: { fontSize: 13, color: '#9E9E9E', marginBottom: 8 },
  rotateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
  },
  rotateBtn: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  rotateBtnText: { fontSize: 15, fontWeight: '700', color: '#37474F' },
  rotateAngle: { fontSize: 14, color: '#9E9E9E', minWidth: 40, textAlign: 'center' },
  circleFrame: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#90CAF9',
    borderStyle: 'dashed',
  },
  photoThumb: { width: 110, height: 110 },
  resetBtn: {
    marginTop: 32,
    borderWidth: 1.5,
    borderColor: '#F44336',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetBtnText: { color: '#F44336', fontSize: 16, fontWeight: '700' },
});
