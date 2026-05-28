import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ALPHABET_DATA } from '@/constants/alphabetData';
import { useAlphabetStore } from '@/store/alphabetStore';

export default function SetupHomeScreen() {
  const router       = useRouter();
  const { customizations, parentPin, setParentPin } = useAlphabetStore();

  const handleChangePin = () => {
    Alert.prompt(
      'Current PIN',
      'Enter your current PIN to continue',
      (current) => {
        if (current !== parentPin) {
          Alert.alert('Incorrect PIN', 'That PIN is not correct. Please try again.');
          return;
        }
        Alert.prompt(
          'New PIN',
          'Enter a new 4-digit PIN',
          (newPin) => {
            if (!newPin || newPin.length < 4) {
              Alert.alert('Invalid PIN', 'PIN must be at least 4 digits.');
              return;
            }
            Alert.prompt(
              'Confirm New PIN',
              'Re-enter your new PIN to confirm',
              (confirm) => {
                if (confirm !== newPin) {
                  Alert.alert('PIN Mismatch', 'The PINs you entered do not match. Please try again.');
                  return;
                }
                setParentPin(newPin);
                Alert.alert('PIN Updated', 'Your new PIN has been saved.');
              },
              'secure-text'
            );
          },
          'secure-text'
        );
      },
      'secure-text'
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Parent Setup</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* PIN section */}
        <Text style={styles.sectionTitle}>🔐 Parent PIN</Text>
        <Text style={styles.sectionSubtitle}>
          This PIN protects the setup area from little fingers.
        </Text>
        <TouchableOpacity style={styles.pinBtn} onPress={handleChangePin}>
          <Text style={styles.pinBtnText}>Change PIN</Text>
        </TouchableOpacity>

        {/* Letter list */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>✏️ Customize Each Letter</Text>
        <Text style={styles.sectionSubtitle}>
          Tap a letter to change the character name or add a face photo.
        </Text>
        {ALPHABET_DATA.map((item) => {
          const custom = customizations[item.letter];
          const displayName = custom?.customName ?? item.defaultName;
          const faceUri = custom?.customCartoonUri ?? custom?.customImageUri;
          return (
            <TouchableOpacity
              key={item.letter}
              style={[styles.letterRow, { borderLeftColor: item.accentColor }]}
              onPress={() => router.push(`/setup/${item.letter}`)}
            >
              <View style={[styles.letterBadge, { backgroundColor: item.bgColor }]}>
                <Text style={[styles.letterBadgeText, { color: item.accentColor }]}>
                  {item.letter}
                </Text>
              </View>
              <View style={styles.letterInfo}>
                <Text style={styles.letterName}>{displayName}</Text>
                <Text style={styles.letterSentence} numberOfLines={1}>
                  {displayName} {item.sentence}
                </Text>
              </View>
              {faceUri ? (
                <Image source={{ uri: faceUri }} style={styles.thumbnail} />
              ) : null}
              <Text style={styles.editArrow}>›</Text>
            </TouchableOpacity>
          );
        })}
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
  title: { fontSize: 22, fontWeight: '800', color: '#37474F' },
  scroll: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#37474F', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: '#9E9E9E', marginBottom: 16 },
  pinBtn: {
    backgroundColor: '#607D8B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  pinBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  letterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 10,
    padding: 12,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  letterBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  letterBadgeText: { fontSize: 24, fontWeight: '800' },
  letterInfo: { flex: 1 },
  letterName: { fontSize: 16, fontWeight: '700', color: '#37474F' },
  letterSentence: { fontSize: 13, color: '#9E9E9E', marginTop: 2 },
  thumbnail: { width: 40, height: 40, borderRadius: 20, marginRight: 8 },
  editArrow: { fontSize: 24, color: '#BDBDBD' },
});
