import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useAlphabetStore } from '@/store/alphabetStore';

const SECTIONS = [
  {
    key: 'alphabet',
    label: '🔤 Alphabet Setup',
    subtitle: 'Customize names & photos for each letter',
    color: '#FF6B35',
    route: '/setup/alphabet',
  },
  {
    key: 'numbers',
    label: '🔢 Numbers Setup',
    subtitle: 'Customize names & photos for each number',
    color: '#4CAF50',
    route: '/setup/numbers',
  },
  {
    key: 'story',
    label: '📖 Story Setup',
    subtitle: 'Record readings & add photos for each page',
    color: '#7B1FA2',
    route: '/setup/story',
  },
  // Add new sections here in the future
];

export default function SetupHomeScreen() {
  const router = useRouter();
  const { parentPin, setParentPin } = useAlphabetStore();

  const handleChangePin = () => {
    Alert.prompt('Current PIN', 'Enter your current PIN to continue', (current) => {
      if (current !== parentPin) {
        Alert.alert('Incorrect PIN', 'That PIN is not correct. Please try again.');
        return;
      }
      Alert.prompt('New PIN', 'Enter a new 4-digit PIN', (newPin) => {
        if (!newPin || newPin.length < 4) {
          Alert.alert('Invalid PIN', 'PIN must be at least 4 digits.');
          return;
        }
        Alert.prompt('Confirm New PIN', 'Re-enter your new PIN to confirm', (confirm) => {
          if (confirm !== newPin) {
            Alert.alert('PIN Mismatch', 'The PINs you entered do not match. Please try again.');
            return;
          }
          setParentPin(newPin);
          Alert.alert('PIN Updated', 'Your new PIN has been saved.');
        }, 'secure-text');
      }, 'secure-text');
    }, 'secure-text');
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

        {/* PIN */}
        <Text style={styles.sectionTitle}>🔐 Parent PIN</Text>
        <Text style={styles.sectionSubtitle}>Protects this area from little fingers.</Text>
        <TouchableOpacity style={styles.pinBtn} onPress={handleChangePin}>
          <Text style={styles.pinBtnText}>Change PIN</Text>
        </TouchableOpacity>

        {/* Section buttons */}
        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>✏️ Customize Sections</Text>
        <Text style={styles.sectionSubtitle}>Tap a section to personalize it for your family.</Text>

        {SECTIONS.map((section) => (
          <TouchableOpacity
            key={section.key}
            style={[styles.sectionCard, { borderLeftColor: section.color }]}
            onPress={() => router.push(section.route as any)}
            activeOpacity={0.75}
          >
            <View style={[styles.sectionIcon, { backgroundColor: section.color }]}>
              <Text style={styles.sectionIconText}>
                {section.label.split(' ')[0]}
              </Text>
            </View>
            <View style={styles.sectionCardText}>
              <Text style={[styles.sectionCardTitle, { color: section.color }]}>
                {section.label.split(' ').slice(1).join(' ')}
              </Text>
              <Text style={styles.sectionCardSubtitle}>{section.subtitle}</Text>
            </View>
            <Text style={styles.sectionArrow}>›</Text>
          </TouchableOpacity>
        ))}

        {/* Version number */}
        <Text style={styles.versionText}>
          Version {Constants.expoConfig?.version ?? '—'} ({Constants.expoConfig?.ios?.buildNumber ?? '—'})
        </Text>

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
  backText: { fontSize: 16, color: '#607D8B', fontWeight: '600' },
  title:    { fontSize: 22, fontWeight: '800', color: '#37474F' },
  scroll:   { padding: 16, paddingBottom: 48 },
  sectionTitle:    { fontSize: 18, fontWeight: '700', color: '#37474F', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: '#9E9E9E', marginBottom: 16 },
  pinBtn: {
    backgroundColor: '#607D8B', paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: 12, alignSelf: 'flex-start',
  },
  pinBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  sectionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 16, marginBottom: 14,
    padding: 16, borderLeftWidth: 5,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.09, shadowRadius: 5,
  },
  sectionIcon:     { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  sectionIconText: { fontSize: 26 },
  sectionCardText: { flex: 1 },
  sectionCardTitle:    { fontSize: 18, fontWeight: '800', marginBottom: 3 },
  sectionCardSubtitle: { fontSize: 13, color: '#9E9E9E' },
  sectionArrow: { fontSize: 28, color: '#BDBDBD', marginLeft: 8 },
  versionText:  { textAlign: 'center', color: '#BDBDBD', fontSize: 12, marginTop: 28 },
});
