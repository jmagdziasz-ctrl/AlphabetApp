import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALPHABET_DATA } from '@/constants/alphabetData';
import { useAlphabetStore, FREE_LETTERS } from '@/store/alphabetStore';
import { STORY_TITLE } from '@/constants/storyData';

const COLS = 5;
const ROWS = Math.ceil(ALPHABET_DATA.length / COLS); // 6 rows for 26 letters
const GAP  = 6;

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const customizations    = useAlphabetStore(s => s.customizations);
  const isPremiumUnlocked = useAlphabetStore(s => s.isPremiumUnlocked);
  const isNumbersUnlocked = useAlphabetStore(s => s.isNumbersUnlocked);
  const isStoryUnlocked   = useAlphabetStore(s => s.isStoryUnlocked);
  const isNamesUnlocked   = useAlphabetStore(s => s.isNamesUnlocked);
  const parentPin         = useAlphabetStore(s => s.parentPin);

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinInput, setPinInput]               = useState('');

  // usableHeight excludes status bar (top) and home indicator / nav bar (bottom).
  // useWindowDimensions returns full device height, but SafeAreaView consumes the insets,
  // so grid calculations must use the actual available height.
  const usableHeight  = height - insets.top - insets.bottom;
  const hasAnyLocked  = !isPremiumUnlocked || !isNumbersUnlocked || !isStoryUnlocked || !isNamesUnlocked;
  const nonGridHeight = usableHeight * (hasAnyLocked ? 0.32 : 0.26);
  const gridHeight    = usableHeight - nonGridHeight;
  const btnByHeight   = (gridHeight - GAP * (ROWS - 1)) / ROWS;
  const btnByWidth    = (width - 32 - GAP * (COLS - 1)) / COLS;
  const btnSize       = Math.floor(Math.min(btnByHeight, btnByWidth));
  const letterFontSize = Math.max(14, Math.floor(btnSize * 0.42));
  const titleFontSize  = Math.min(34, Math.floor(usableHeight * 0.052));

  const openSetup = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Parent Setup',
        'Enter PIN (default: 1234)',
        (pin) => {
          if (pin === parentPin) {
            router.push('/setup');
          } else {
            Alert.alert('Incorrect PIN', 'Please try again.');
          }
        },
        'secure-text'
      );
    } else {
      setPinInput('');
      setPinModalVisible(true);
    }
  };

  const submitPin = () => {
    setPinModalVisible(false);
    if (pinInput === parentPin) {
      router.push('/setup');
    } else {
      Alert.alert('Incorrect PIN', 'Please try again.');
    }
  };

  const handleLetterPress = (letter: string) => {
    const isLocked = !FREE_LETTERS.has(letter) && !isPremiumUnlocked;
    if (isLocked) {
      router.push('/paywall');
    } else {
      router.push(`/learn/${letter}`);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Title */}
        <Text style={[styles.title, { fontSize: titleFontSize }]}>ABC and Me!</Text>

        {/* Section buttons */}
        <View style={styles.sectionRow}>
          <TouchableOpacity
            style={[styles.sectionBtn, { backgroundColor: '#FF6B35' }]}
            onPress={() => !isPremiumUnlocked ? router.push('/paywall') : null}
          >
            <Text style={styles.sectionBtnText}>🔤 {isPremiumUnlocked ? 'ABC' : '🔒 ABC'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sectionBtn, { backgroundColor: isNumbersUnlocked ? '#4CAF50' : '#9E9E9E' }]}
            onPress={() => isNumbersUnlocked ? router.push('/numbers') : router.push('/paywall')}
          >
            <Text style={styles.sectionBtnText}>🔢 {isNumbersUnlocked ? '123' : '🔒 123'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sectionBtn, { backgroundColor: isStoryUnlocked ? '#7B1FA2' : '#9E9E9E' }]}
            onPress={() => isStoryUnlocked ? router.push('/story') : router.push('/paywall')}
          >
            <Text style={styles.sectionBtnText}>📖 {isStoryUnlocked ? 'Story' : '🔒 Story'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sectionBtn, { backgroundColor: isNamesUnlocked ? '#E91E8C' : '#9E9E9E' }]}
            onPress={() => isNamesUnlocked ? router.push('/name') : router.push('/paywall')}
          >
            <Text style={styles.sectionBtnText}>✏️ {isNamesUnlocked ? 'Names' : '🔒 Names'}</Text>
          </TouchableOpacity>
        </View>

        {/* Letter grid */}
        <View style={[styles.grid, { gap: GAP }]}>
          {ALPHABET_DATA.map((item) => {
            const custom   = customizations[item.letter];
            const isLocked = !FREE_LETTERS.has(item.letter) && !isPremiumUnlocked;

            return (
              <TouchableOpacity
                key={item.letter}
                style={[
                  styles.letterBtn,
                  {
                    width:           btnSize,
                    height:          btnSize,
                    backgroundColor: isLocked ? '#F5F5F5' : item.bgColor,
                    borderColor:     isLocked ? '#E0E0E0' : item.accentColor,
                  },
                ]}
                onPress={() => handleLetterPress(item.letter)}
                activeOpacity={0.7}
              >
                <Text style={[styles.letterText, { fontSize: letterFontSize, color: isLocked ? '#BDBDBD' : item.accentColor }]}>
                  {item.letter}
                </Text>

                {isLocked ? (
                  <View style={styles.lockBadge}>
                    <Text style={styles.lockIcon}>🔒</Text>
                  </View>
                ) : custom?.customName ? (
                  <View style={[styles.customDot, { backgroundColor: item.accentColor }]} />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bottom buttons */}
        <View style={styles.bottomRow}>
          {!isPremiumUnlocked && (
            <TouchableOpacity style={styles.unlockBanner} onPress={() => router.push('/paywall')}>
              <Text style={styles.unlockBannerText}>🔓 Unlock All 26 Letters — $2.99</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.setupBtn} onPress={openSetup}>
            <Text style={styles.setupBtnText}>⚙️ Parent Setup</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>v1.3.0 (34)</Text>
        </View>

      </View>

      {/* Android PIN modal (Alert.prompt is iOS-only) */}
      <Modal visible={pinModalVisible} transparent animationType="fade">
        <View style={styles.pinOverlay}>
          <View style={styles.pinBox}>
            <Text style={styles.pinTitle}>Parent Setup</Text>
            <Text style={styles.pinSubtitle}>Enter PIN (default: 1234)</Text>
            <TextInput
              style={styles.pinInput}
              value={pinInput}
              onChangeText={setPinInput}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={10}
              autoFocus
            />
            <View style={styles.pinBtnRow}>
              <TouchableOpacity style={styles.pinCancel} onPress={() => setPinModalVisible(false)}>
                <Text style={styles.pinCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pinOk} onPress={submitPin}>
                <Text style={styles.pinOkText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#FFF9F0' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  title: {
    fontWeight: '900',
    color: '#FF6B35',
    marginTop: 4,
  },
  subtitle: { fontSize: 13, color: '#9E9E9E', marginTop: 2 },
  sectionRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 6 },
  sectionBtn: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20 },
  sectionBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  letterBtn: {
    borderRadius: 14,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  letterText: { fontWeight: '800' },
  customDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  lockBadge: { position: 'absolute', bottom: 2, right: 2 },
  lockIcon:  { fontSize: 10 },

  bottomRow:   { alignItems: 'center', gap: 8, paddingBottom: 4 },
  versionText: { fontSize: 11, color: '#BDBDBD' },
  unlockBanner: {
    backgroundColor: '#FF6B35',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 50,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  unlockBannerText: { color: 'white', fontSize: 15, fontWeight: '800' },
  setupBtn: {
    backgroundColor: '#607D8B',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 50,
  },
  setupBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },

  pinOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  pinBox:      { backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: 280 },
  pinTitle:    { fontSize: 18, fontWeight: '800', color: '#37474F', marginBottom: 6 },
  pinSubtitle: { fontSize: 14, color: '#9E9E9E', marginBottom: 16 },
  pinInput: {
    borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 10,
    padding: 12, fontSize: 18, letterSpacing: 4, marginBottom: 20,
  },
  pinBtnRow:    { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  pinCancel:    { paddingVertical: 8, paddingHorizontal: 16 },
  pinCancelText:{ color: '#9E9E9E', fontSize: 16, fontWeight: '600' },
  pinOk:        { backgroundColor: '#607D8B', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8 },
  pinOkText:    { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
