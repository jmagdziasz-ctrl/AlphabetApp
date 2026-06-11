import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Image, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlphabetStore } from '@/store/alphabetStore';

export default function NameSetupScreen() {
  const router = useRouter();
  const { childName, childNamePhotoUri, childNamePhotoRotation, setChildNameData } =
    useAlphabetStore();

  const [name,     setName]     = useState(childName);
  const [photoUri, setPhotoUri] = useState(childNamePhotoUri);
  const [rotation, setRotation] = useState(childNamePhotoRotation);

  const pickPhoto = async () => {
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
      setPhotoUri(result.assets[0].uri);
      setRotation(0);
    }
  };

  const rotate = (dir: 'left' | 'right') =>
    setRotation(r => (r + (dir === 'right' ? 15 : -15) + 360) % 360);

  const save = async () => {
    const trimmed = name.trim().toUpperCase();
    if (!trimmed) {
      Alert.alert('Name Required', 'Please enter a name before saving.');
      return;
    }
    await setChildNameData(trimmed, photoUri, rotation);
    Alert.alert('Saved!', `Name set to "${trimmed}".`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const letters = name.trim().toUpperCase().split('').filter(c => /[A-Z]/.test(c));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>✏️ Name Setup</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Preview */}
        <View style={styles.preview}>
          {photoUri ? (
            <View style={styles.photoCircle}>
              <Image
                source={{ uri: photoUri }}
                style={[styles.photoImg, { transform: [{ rotate: `${rotation}deg` }] }]}
                resizeMode="cover"
              />
            </View>
          ) : (
            <View style={[styles.photoCircle, styles.photoPlaceholder]}>
              <Text style={styles.photoPlaceholderText}>📷</Text>
            </View>
          )}
          <View style={styles.previewLetters}>
            {letters.map((l, i) => (
              <View key={i} style={styles.previewLetterBox}>
                <Text style={styles.previewLetter}>{l}</Text>
              </View>
            ))}
            {letters.length === 0 && (
              <Text style={styles.previewPlaceholder}>Enter a name below</Text>
            )}
          </View>
        </View>

        {/* Name input */}
        <Text style={styles.label}>Child's Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={t => setName(t.toUpperCase())}
          placeholder="e.g. EMMA"
          placeholderTextColor="#BDBDBD"
          autoCapitalize="characters"
          maxLength={20}
        />
        <Text style={styles.hint}>Only letters A–Z are used for tracing. Spaces are shown but skipped.</Text>

        {/* Photo */}
        <Text style={[styles.label, { marginTop: 24 }]}>Child's Photo</Text>
        <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto}>
          <Text style={styles.photoBtnText}>📷 Choose Photo & Crop to Face</Text>
        </TouchableOpacity>

        {photoUri ? (
          <View style={styles.rotateRow}>
            <TouchableOpacity style={styles.rotateBtn} onPress={() => rotate('left')}>
              <Text style={styles.rotateBtnText}>↺ Left</Text>
            </TouchableOpacity>
            <Text style={styles.rotateAngle}>{rotation}°</Text>
            <TouchableOpacity style={styles.rotateBtn} onPress={() => rotate('right')}>
              <Text style={styles.rotateBtnText}>Right ↻</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Clear */}
        {(name || photoUri) ? (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => Alert.alert('Clear', 'Remove name and photo?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: async () => {
                setName(''); setPhotoUri(''); setRotation(0);
                await setChildNameData('', '', 0);
              }},
            ])}
          >
            <Text style={styles.clearBtnText}>Clear Name & Photo</Text>
          </TouchableOpacity>
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
  title:       { fontSize: 20, fontWeight: '800', color: '#37474F' },
  saveBtn:     { backgroundColor: '#E91E8C', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20 },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },

  scroll: { padding: 16, paddingBottom: 60 },

  preview: {
    alignItems: 'center', backgroundColor: '#FFF3FA', borderRadius: 20,
    padding: 20, marginBottom: 24, borderWidth: 2, borderColor: '#F48FB1',
  },
  photoCircle: {
    width: 100, height: 100, borderRadius: 50, overflow: 'hidden',
    marginBottom: 16, borderWidth: 3, borderColor: '#E91E8C',
  },
  photoImg:         { width: 100, height: 100 },
  photoPlaceholder: { backgroundColor: '#FCE4EC', alignItems: 'center', justifyContent: 'center' },
  photoPlaceholderText: { fontSize: 40 },
  previewLetters:   { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  previewLetterBox: {
    width: 44, height: 52, backgroundColor: '#E91E8C', borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  previewLetter:      { fontSize: 26, fontWeight: '900', color: '#FFF' },
  previewPlaceholder: { color: '#BDBDBD', fontSize: 14 },

  label: { fontSize: 16, fontWeight: '700', color: '#37474F', marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12,
    padding: 14, fontSize: 22, fontWeight: '700', backgroundColor: '#FFF',
    letterSpacing: 4, color: '#37474F',
  },
  hint: { fontSize: 12, color: '#9E9E9E', marginTop: 6 },

  photoBtn: {
    backgroundColor: '#607D8B', padding: 14, borderRadius: 12,
    alignItems: 'center', marginBottom: 12,
  },
  photoBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  rotateRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 },
  rotateBtn:  { backgroundColor: '#E0E0E0', paddingVertical: 7, paddingHorizontal: 14, borderRadius: 10 },
  rotateBtnText: { fontSize: 15, fontWeight: '700', color: '#37474F' },
  rotateAngle:   { fontSize: 14, color: '#9E9E9E', minWidth: 40, textAlign: 'center' },

  clearBtn:     { marginTop: 32, borderWidth: 1.5, borderColor: '#F44336', padding: 14, borderRadius: 12, alignItems: 'center' },
  clearBtnText: { color: '#F44336', fontSize: 16, fontWeight: '700' },
});
