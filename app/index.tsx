import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ALPHABET_DATA } from '@/constants/alphabetData';
import { useAlphabetStore, FREE_LETTERS } from '@/store/alphabetStore';

const { width } = Dimensions.get('window');
const COLS = 5;
const BTN_SIZE = (width - 48) / COLS;

export default function HomeScreen() {
  const router = useRouter();
  const customizations    = useAlphabetStore(s => s.customizations);
  const isPremiumUnlocked = useAlphabetStore(s => s.isPremiumUnlocked);
  const parentPin         = useAlphabetStore(s => s.parentPin);

  const openSetup = () => {
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
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>ABC{'\n'}and Me!</Text>
        <Text style={styles.subtitle}>Tap a letter to start tracing</Text>

        {/* Free letters label */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Free — A through E</Text>
        </View>

        <View style={styles.grid}>
          {ALPHABET_DATA.map((item) => {
            const custom   = customizations[item.letter];
            const isLocked = !FREE_LETTERS.has(item.letter) && !isPremiumUnlocked;

            return (
              <TouchableOpacity
                key={item.letter}
                style={[
                  styles.letterBtn,
                  {
                    backgroundColor: isLocked ? '#F5F5F5' : item.bgColor,
                    borderColor:     isLocked ? '#E0E0E0' : item.accentColor,
                  },
                ]}
                onPress={() => handleLetterPress(item.letter)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.letterText,
                    { color: isLocked ? '#BDBDBD' : item.accentColor },
                  ]}
                >
                  {item.letter}
                </Text>

                {/* Lock badge */}
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

        {/* Unlock banner — only shown when not yet purchased */}
        {!isPremiumUnlocked && (
          <TouchableOpacity style={styles.unlockBanner} onPress={() => router.push('/paywall')}>
            <Text style={styles.unlockBannerText}>🔓 Unlock All 26 Letters — $2.99</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.setupBtn} onPress={openSetup}>
          <Text style={styles.setupBtnText}>⚙️ Parent Setup</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF9F0' },
  container: { alignItems: 'center', paddingBottom: 40 },
  title: {
    fontSize: 52,
    fontWeight: '900',
    textAlign: 'center',
    color: '#FF6B35',
    marginTop: 16,
    lineHeight: 56,
  },
  subtitle: { fontSize: 16, color: '#9E9E9E', marginBottom: 16, marginTop: 4 },

  sectionHeader: { width: '100%', paddingHorizontal: 24, marginBottom: 8 },
  sectionLabel:  { fontSize: 13, color: '#9E9E9E', fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    justifyContent: 'center',
  },
  letterBtn: {
    width: BTN_SIZE - 4,
    height: BTN_SIZE - 4,
    borderRadius: 16,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  letterText: { fontSize: 28, fontWeight: '800' },
  customDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  lockBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  lockIcon: { fontSize: 11 },

  unlockBanner: {
    marginTop: 20,
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 50,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  unlockBannerText: { color: 'white', fontSize: 17, fontWeight: '800' },

  setupBtn: {
    marginTop: 16,
    backgroundColor: '#607D8B',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 50,
  },
  setupBtnText: { color: 'white', fontSize: 18, fontWeight: '700' },
});
