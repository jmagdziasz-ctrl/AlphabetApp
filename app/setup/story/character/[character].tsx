import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Image, TextInput, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STORY_CHARACTERS } from '@/constants/storyData';
import { useAlphabetStore } from '@/store/alphabetStore';

export default function SetupStoryCharacterScreen() {
  const { character } = useLocalSearchParams<{ character: string }>();
  const router = useRouter();
  const { storyCharacters, setStoryCharacter } = useAlphabetStore();

  const charDef = STORY_CHARACTERS.find(c => c.key === character);
  const existing = storyCharacters[character ?? ''];

  const [name,     setName]     = useState(existing?.customName     ?? charDef?.defaultName ?? '');
  const [imageUri, setImageUri] = useState(existing?.customImageUri ?? '');
  const [rotation, setRotation] = useState(existing?.customImageRotation ?? 0);

  if (!charDef) return null;

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
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setRotation(0);
    }
  };

  const rotate = (dir: 'left' | 'right') => {
    const delta = dir === 'right' ? 15 : -15;
    setRotation(r => (r + delta + 360) % 360);
  };

  const save = async () => {
    await setStoryCharacter(character ?? '', {
      customName:          name !== charDef.defaultName ? name : undefined,
      customImageUri:      imageUri || undefined,
      customImageRotation: imageUri ? rotation : undefined,
    });
    Alert.alert('Saved!', `${charDef.defaultName} has been updated.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const clearPhoto = () => {
    Alert.alert('Remove Photo', `Remove ${displayName}'s photo?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => { setImageUri(''); setRotation(0); } },
    ]);
  };

  const displayName = name || charDef.defaultName;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: charDef.accentColor }]}>
          Edit {charDef.defaultName}
        </Text>
        <TouchableOpacity
          onPress={save}
          style={[styles.saveBtn, { backgroundColor: charDef.accentColor }]}
        >
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Large face preview */}
        <View style={styles.previewRow}>
          <View style={[styles.faceCircleLarge, { borderColor: charDef.accentColor }]}>
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={[styles.faceImageLarge, { transform: [{ rotate: `${rotation}deg` }] }]}
              />
            ) : (
              <Text style={[styles.facePlaceholder, { color: charDef.accentColor }]}>
                {displayName.charAt(0)}
              </Text>
            )}
          </View>
          <Text style={[styles.previewName, { color: charDef.accentColor }]}>{displayName}</Text>
        </View>

        {/* Name */}
        <Text style={styles.sectionLabel}>Character Name</Text>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          placeholder={charDef.defaultName}
          maxLength={40}
        />
        <Text style={styles.hint}>Default name: {charDef.defaultName}</Text>

        {/* Photo */}
        <Text style={styles.sectionLabel}>Face Photo</Text>
        <Text style={styles.hint}>
          Crop tight to the face — the circle will hide the square edges.
        </Text>
        <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
          <Text style={styles.photoBtnText}>📷 Choose Photo &amp; Crop Face</Text>
        </TouchableOpacity>

        {imageUri ? (
          <>
            <View style={styles.rotateRow}>
              <TouchableOpacity style={styles.rotateBtn} onPress={() => rotate('left')}>
                <Text style={styles.rotateBtnText}>↺ Left</Text>
              </TouchableOpacity>
              <Text style={styles.rotateAngle}>{rotation}°</Text>
              <TouchableOpacity style={styles.rotateBtn} onPress={() => rotate('right')}>
                <Text style={styles.rotateBtnText}>Right ↻</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.removeBtn} onPress={clearPhoto}>
              <Text style={styles.removeBtnText}>🗑 Remove Photo</Text>
            </TouchableOpacity>
          </>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#FFF9F0' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
  },
  backText:    { fontSize: 16, color: '#607D8B', fontWeight: '600' },
  title:       { fontSize: 20, fontWeight: '800' },
  saveBtn:     { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20 },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  scroll:      { padding: 16, paddingBottom: 60 },

  previewRow:       { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  faceCircleLarge:  { width: 120, height: 120, borderRadius: 60, borderWidth: 3, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5', marginBottom: 10 },
  faceImageLarge:   { width: 120, height: 120 },
  facePlaceholder:  { fontSize: 54, fontWeight: '900' },
  previewName:      { fontSize: 22, fontWeight: '900' },

  sectionLabel: { fontSize: 16, fontWeight: '700', color: '#37474F', marginTop: 20, marginBottom: 8 },
  nameInput: {
    borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12,
    padding: 14, fontSize: 18, fontWeight: '600', backgroundColor: '#FFF',
  },
  hint:        { fontSize: 13, color: '#9E9E9E', marginTop: 4, marginBottom: 4 },
  photoBtn:    { backgroundColor: '#607D8B', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8, marginBottom: 8 },
  photoBtnText:{ color: 'white', fontSize: 16, fontWeight: '700' },
  rotateRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginVertical: 8 },
  rotateBtn:   { backgroundColor: '#E0E0E0', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 },
  rotateBtnText:{ fontSize: 15, fontWeight: '700', color: '#37474F' },
  rotateAngle: { fontSize: 14, color: '#9E9E9E', minWidth: 44, textAlign: 'center' },
  removeBtn:   { borderWidth: 1.5, borderColor: '#F44336', padding: 12, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  removeBtnText:{ color: '#F44336', fontSize: 15, fontWeight: '700' },
});
