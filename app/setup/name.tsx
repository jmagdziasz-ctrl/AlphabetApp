import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Image, Alert, Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlphabetStore, FamilyMember } from '@/store/alphabetStore';

const ACCENT = '#E91E8C';

export default function NameSetupScreen() {
  const router = useRouter();
  const { familyMembers, addFamilyMember, updateFamilyMember, deleteFamilyMember } = useAlphabetStore();

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [formName,     setFormName]     = useState('');
  const [formPhotoUri, setFormPhotoUri] = useState('');
  const [formRotation, setFormRotation] = useState(0);

  const openAdd = () => {
    setEditingId(null);
    setFormName('');
    setFormPhotoUri('');
    setFormRotation(0);
    setModalVisible(true);
  };

  const openEdit = (member: FamilyMember) => {
    setEditingId(member.id);
    setFormName(member.name);
    setFormPhotoUri(member.photoUri);
    setFormRotation(member.photoRotation);
    setModalVisible(true);
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],   // portrait crop to show more of face
      quality: 0.8,
      // Force full-screen on iPad so the crop UI appears (popover mode disables editing)
      presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
    });
    if (!result.canceled && result.assets[0]) {
      setFormPhotoUri(result.assets[0].uri);
      setFormRotation(0);
    }
  };

  const rotate = (dir: 'left' | 'right') =>
    setFormRotation(r => (r + (dir === 'right' ? 15 : -15) + 360) % 360);

  const save = async () => {
    const trimmed = formName.trim().toUpperCase();
    if (!trimmed) {
      Alert.alert('Name Required', 'Please enter a name before saving.');
      return;
    }
    if (editingId) {
      await updateFamilyMember(editingId, { name: trimmed, photoUri: formPhotoUri, photoRotation: formRotation });
    } else {
      await addFamilyMember({ name: trimmed, photoUri: formPhotoUri, photoRotation: formRotation });
    }
    setModalVisible(false);
  };

  const confirmDelete = (member: FamilyMember) => {
    Alert.alert(
      'Remove Member',
      `Remove ${member.name} from the list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => deleteFamilyMember(member.id) },
      ],
    );
  };

  const previewLetters = formName.trim().toUpperCase().split('').filter(c => /[A-Z]/.test(c));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>✏️ Names Setup</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {familyMembers.length === 0 ? (
          <View style={styles.emptyHint}>
            <Text style={styles.emptyHintText}>
              No family members added yet. Tap the button below to get started!
            </Text>
          </View>
        ) : (
          familyMembers.map((member) => (
            <View key={member.id} style={styles.memberRow}>
              <View style={styles.memberThumb}>
                {member.photoUri ? (
                  <Image
                    source={{ uri: member.photoUri }}
                    style={[styles.thumbImg, { transform: [{ rotate: `${member.photoRotation}deg` }] }]}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.thumbPlaceholder}>
                    <Text style={{ fontSize: 28 }}>😊</Text>
                  </View>
                )}
              </View>
              <Text style={styles.memberName} numberOfLines={1}>{member.name}</Text>
              <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(member)}>
                <Text style={styles.editBtnText}>✎ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDelete(member)}>
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Add Family Member</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Add / Edit Modal ────────────────────────────────────────────── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingId ? 'Edit Member' : 'Add Member'}</Text>
            <TouchableOpacity onPress={save}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>

            {/* Preview */}
            <View style={styles.preview}>
              <View style={styles.previewPhotoCard}>
                {formPhotoUri ? (
                  <Image
                    source={{ uri: formPhotoUri }}
                    style={[styles.previewPhoto, { transform: [{ rotate: `${formRotation}deg` }] }]}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.previewPhotoPlaceholder}>
                    <Text style={{ fontSize: 48 }}>📷</Text>
                  </View>
                )}
              </View>
              <View style={styles.previewLetters}>
                {previewLetters.length === 0 ? (
                  <Text style={styles.previewPlaceholder}>Enter a name below</Text>
                ) : (
                  previewLetters.map((l, i) => (
                    <View key={i} style={styles.previewChip}>
                      <Text style={styles.previewChipText}>{l}</Text>
                    </View>
                  ))
                )}
              </View>
            </View>

            {/* Name input */}
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={formName}
              onChangeText={t => setFormName(t.toUpperCase())}
              placeholder="e.g. EMMA"
              placeholderTextColor="#BDBDBD"
              autoCapitalize="characters"
              maxLength={20}
            />
            <Text style={styles.hint}>Only A–Z letters are traced. Spaces are shown but skipped.</Text>

            {/* Photo */}
            <Text style={[styles.label, { marginTop: 24 }]}>Photo</Text>
            <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto}>
              <Text style={styles.photoBtnText}>📷 Choose Photo & Crop to Portrait</Text>
            </TouchableOpacity>

            {formPhotoUri ? (
              <View style={styles.rotateRow}>
                <TouchableOpacity style={styles.rotateBtn} onPress={() => rotate('left')}>
                  <Text style={styles.rotateBtnText}>↺ Left</Text>
                </TouchableOpacity>
                <Text style={styles.rotateAngle}>{formRotation}°</Text>
                <TouchableOpacity style={styles.rotateBtn} onPress={() => rotate('right')}>
                  <Text style={styles.rotateBtnText}>Right ↻</Text>
                </TouchableOpacity>
              </View>
            ) : null}

          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#FFF9F0' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
  },
  backText: { fontSize: 16, color: '#607D8B', fontWeight: '600' },
  title:    { fontSize: 20, fontWeight: '800', color: '#37474F' },
  scroll:   { padding: 16, paddingBottom: 48 },

  emptyHint: {
    backgroundColor: '#FFF3FA', borderRadius: 14, padding: 20,
    marginBottom: 20, borderWidth: 1.5, borderColor: '#F8BBD9',
  },
  emptyHintText: { fontSize: 15, color: '#9E9E9E', textAlign: 'center', lineHeight: 22 },

  memberRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 14, marginBottom: 12,
    padding: 12, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  memberThumb: {
    width: 54, height: 72, borderRadius: 10, overflow: 'hidden',
    borderWidth: 2, borderColor: ACCENT,
  },
  thumbImg:         { width: 54, height: 72 },
  thumbPlaceholder: {
    width: 54, height: 72, backgroundColor: '#FCE4EC',
    alignItems: 'center', justifyContent: 'center',
  },
  memberName:   { flex: 1, fontSize: 18, fontWeight: '800', color: '#37474F' },
  editBtn:      { backgroundColor: '#607D8B', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  editBtnText:  { color: '#FFF', fontWeight: '700', fontSize: 13 },
  deleteBtn:    { backgroundColor: '#FCE4EC', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  deleteBtnText:{ color: '#F44336', fontWeight: '900', fontSize: 15 },

  addBtn:    { backgroundColor: ACCENT, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  addBtnText:{ color: '#FFF', fontSize: 17, fontWeight: '800' },

  // Modal
  modalSafe:   { flex: 1, backgroundColor: '#FFF9F0' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
  },
  modalCancel: { fontSize: 16, color: '#607D8B', fontWeight: '600' },
  modalTitle:  { fontSize: 18, fontWeight: '800', color: '#37474F' },
  modalSave:   { fontSize: 16, color: ACCENT, fontWeight: '800' },
  modalScroll: { padding: 16, paddingBottom: 60 },

  preview: {
    alignItems: 'center', backgroundColor: '#FFF3FA', borderRadius: 20,
    padding: 20, marginBottom: 24, borderWidth: 2, borderColor: '#F48FB1', gap: 16,
  },
  previewPhotoCard: {
    width: 120, height: 160, borderRadius: 16, overflow: 'hidden',
    borderWidth: 2.5, borderColor: ACCENT,
  },
  previewPhoto:            { width: 120, height: 160 },
  previewPhotoPlaceholder: {
    width: 120, height: 160, backgroundColor: '#FCE4EC',
    alignItems: 'center', justifyContent: 'center',
  },
  previewLetters:    { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  previewChip:       {
    width: 40, height: 48, backgroundColor: ACCENT, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  previewChipText:   { fontSize: 22, fontWeight: '900', color: '#FFF' },
  previewPlaceholder:{ color: '#BDBDBD', fontSize: 14 },

  label: { fontSize: 16, fontWeight: '700', color: '#37474F', marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12,
    padding: 14, fontSize: 22, fontWeight: '700', backgroundColor: '#FFF',
    letterSpacing: 4, color: '#37474F',
  },
  hint: { fontSize: 12, color: '#9E9E9E', marginTop: 6 },

  photoBtn:     { backgroundColor: '#607D8B', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  photoBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  rotateRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 },
  rotateBtn:    { backgroundColor: '#E0E0E0', paddingVertical: 7, paddingHorizontal: 14, borderRadius: 10 },
  rotateBtnText:{ fontSize: 15, fontWeight: '700', color: '#37474F' },
  rotateAngle:  { fontSize: 14, color: '#9E9E9E', minWidth: 40, textAlign: 'center' },
});
