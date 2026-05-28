import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Purchases, { PurchasesError, PURCHASES_ERROR_CODE } from 'react-native-purchases';
import { useAlphabetStore } from '@/store/alphabetStore';

const PRICE = '$2.99';

const UNLOCK_FEATURES = [
  { emoji: '🔤', text: 'All 26 letters — A through Z' },
  { emoji: '✏️', text: 'Interactive tracing for every letter' },
  { emoji: '🖼️', text: 'Illustrated scenes for each letter' },
  { emoji: '📷', text: 'Add family photos to every character' },
  { emoji: '👨‍👩‍👧', text: 'Personalize names for all characters' },
  { emoji: '🔓', text: 'One-time purchase — no subscriptions!' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const unlockPremium = useAlphabetStore(s => s.unlockPremium);
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages[0];
      if (!pkg) {
        Alert.alert('Not Available', 'Purchase is not available right now. Please try again later.');
        return;
      }
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (customerInfo.entitlements.active['premium']) {
        await unlockPremium();
        Alert.alert(
          '🎉 Unlocked!',
          'All 26 letters are now available. Happy learning!',
          [{ text: "Let's Go!", onPress: () => router.replace('/') }],
        );
      }
    } catch (e) {
      const err = e as PurchasesError;
      // User cancelled — don't show an error
      if (err.code !== PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const restorePurchase = async () => {
    setLoading(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active['premium']) {
        await unlockPremium();
        Alert.alert(
          '✅ Restored!',
          'Your purchase has been restored.',
          [{ text: "Let's Go!", onPress: () => router.replace('/') }],
        );
      } else {
        Alert.alert('Nothing to Restore', 'No previous purchase was found for this Apple ID.');
      }
    } catch {
      Alert.alert('Error', 'Could not restore purchases. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Close / Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>✕ Not now</Text>
        </TouchableOpacity>

        {/* Hero */}
        <Text style={styles.emoji}>🌟</Text>
        <Text style={styles.headline}>Unlock All 26 Letters!</Text>
        <Text style={styles.sub}>
          Your child is loving ABC and Me! Keep the learning going with every letter of the alphabet.
        </Text>

        {/* Feature list */}
        <View style={styles.featureBox}>
          {UNLOCK_FEATURES.map((f) => (
            <View key={f.text} style={styles.featureRow}>
              <Text style={styles.featureEmoji}>{f.emoji}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Price callout */}
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>One-time unlock</Text>
          <Text style={styles.price}>{PRICE}</Text>
          <Text style={styles.priceNote}>No subscription. Yours forever.</Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.unlockBtn, loading && styles.unlockBtnDisabled]}
          onPress={handlePurchase}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.unlockBtnText}>Unlock All Letters — {PRICE}</Text>
          )}
        </TouchableOpacity>

        {/* Restore */}
        <TouchableOpacity onPress={restorePurchase} disabled={loading} style={styles.restoreBtn}>
          <Text style={styles.restoreText}>Restore Previous Purchase</Text>
        </TouchableOpacity>

        <Text style={styles.legal}>
          Payment will be charged to your Apple ID account. The purchase is non-refundable.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF9F0' },
  scroll: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 48 },

  backBtn: { alignSelf: 'flex-start', paddingVertical: 12, marginTop: 4 },
  backText: { fontSize: 15, color: '#9E9E9E', fontWeight: '600' },

  emoji: { fontSize: 64, marginTop: 8 },
  headline: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FF6B35',
    textAlign: 'center',
    marginTop: 8,
  },
  sub: {
    fontSize: 16,
    color: '#607D8B',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 23,
  },

  featureBox: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 20,
    marginTop: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  featureEmoji: { fontSize: 22, width: 36 },
  featureText: { fontSize: 16, color: '#37474F', fontWeight: '600', flex: 1 },

  priceBox: {
    marginTop: 24,
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 40,
    width: '100%',
  },
  priceLabel: { fontSize: 13, color: '#4CAF50', fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  price: { fontSize: 48, fontWeight: '900', color: '#2E7D32', marginVertical: 4 },
  priceNote: { fontSize: 14, color: '#66BB6A', fontWeight: '600' },

  unlockBtn: {
    backgroundColor: '#FF6B35',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  unlockBtnDisabled: { opacity: 0.7 },
  unlockBtnText: { color: '#FFF', fontSize: 18, fontWeight: '900' },

  restoreBtn: { marginTop: 16, padding: 8 },
  restoreText: { fontSize: 14, color: '#90A4AE', fontWeight: '600', textDecorationLine: 'underline' },

  legal: {
    fontSize: 11,
    color: '#BDBDBD',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 16,
  },
});
