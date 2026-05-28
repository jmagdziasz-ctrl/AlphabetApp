import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import { useAlphabetStore } from '@/store/alphabetStore';

// ─── RevenueCat API Keys ──────────────────────────────────────────────────────
// Get these from app.revenuecat.com → Project → API Keys
// Use the PUBLIC (not secret) Apple key — starts with "appl_"
const REVENUECAT_APPLE_KEY = 'appl_nedKTDZNdzJKAQrNWnixOfFEnsd';
// ─────────────────────────────────────────────────────────────────────────────

export default function RootLayout() {
  const loadFromStorage = useAlphabetStore(s => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();

    // Initialize RevenueCat
    if (Platform.OS === 'ios') {
      Purchases.configure({ apiKey: REVENUECAT_APPLE_KEY });
    }
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="learn/[letter]" />
      <Stack.Screen name="setup/index" />
      <Stack.Screen name="setup/[letter]" />
      <Stack.Screen
        name="paywall"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
