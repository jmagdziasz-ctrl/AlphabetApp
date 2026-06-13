import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import { Audio } from 'expo-av';
import { useAlphabetStore } from '@/store/alphabetStore';
import { syncEntitlements } from '@/utils/syncEntitlements';

// ─── RevenueCat API Keys ──────────────────────────────────────────────────────
const REVENUECAT_APPLE_KEY = 'appl_nedKTDZNdzJKAQrNWnixOfFEnsd';
// ─────────────────────────────────────────────────────────────────────────────

export default function RootLayout() {
  const loadFromStorage = useAlphabetStore(s => s.loadFromStorage);

  useEffect(() => {
    const init = async () => {
      // 0. Enable audio in silent mode so speech & sounds work without story playback first
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      } catch {}

      // 1. Load locally cached state first (instant, no network)
      await loadFromStorage();

      // 2. Configure RevenueCat and sync purchases from server
      //    This restores unlocks after reinstalls / new TestFlight builds
      if (Platform.OS === 'ios') {
        try {
          Purchases.configure({ apiKey: REVENUECAT_APPLE_KEY });
          const customerInfo = await Purchases.getCustomerInfo();
          await syncEntitlements(customerInfo, useAlphabetStore.getState());
        } catch (e) {
          console.warn('RevenueCat sync failed:', e);
        }
      }
    };
    init();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="learn/[letter]" />
      <Stack.Screen name="setup/index" />
      <Stack.Screen name="setup/alphabet" />
      <Stack.Screen name="setup/numbers" />
      <Stack.Screen name="setup/[letter]" />
      <Stack.Screen name="setup/number/[number]" />
      <Stack.Screen name="setup/story/index" />
      <Stack.Screen name="setup/story/characters" />
      <Stack.Screen name="setup/story/character/[character]" />
      <Stack.Screen name="setup/story/[page]" />
      <Stack.Screen name="numbers/index" />
      <Stack.Screen name="numbers/[number]" />
      <Stack.Screen name="name/index" />
      {/* detachPreviousScreen removes name/index from the native view hierarchy while
          name/[id] is active — prevents the list screen's ScrollView from rubber-banding
          behind the tracing screen when the child drags on the LetterTracer. */}
      <Stack.Screen name="name/[id]" options={{ detachPreviousScreen: true }} />
      <Stack.Screen name="story/index" />
      <Stack.Screen name="story/[page]" />
      <Stack.Screen name="story/setup/[page]" />
      <Stack.Screen
        name="paywall"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack>
  );
}
