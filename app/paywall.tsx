import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Linking,
} from 'react-native';

// ── Update these URLs with your actual hosted pages ──────────────────────────
const PRIVACY_POLICY_URL = 'https://jmagdziasz-ctrl.github.io/abc-and-me-privacy/';
const TERMS_URL          = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
// ────────────────────────────────────────────────────────────────────────────
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Purchases, { PurchasesError, PURCHASES_ERROR_CODE } from 'react-native-purchases';
import { useAlphabetStore } from '@/store/alphabetStore';
import { syncEntitlements } from '@/utils/syncEntitlements';

// ── Product IDs — must match App Store Connect exactly ──────────────────────
export const PRODUCT_IDS = {
  alphabet: 'com.jmagdziasz.abcfamily.unlock_all',      // $2.99
  numbers:  'com.jmagdziasz.abcfamily.numbers',          // $1.99
  story:    'com.jmagdziasz.abcfamily.story',            // $3.99
  names:    'com.jmagdziasz.abcfamily.names',            // $1.99
  bundle:   'com.jmagdziasz.abcfamily.bundle',           // $4.99
  monthly:  'com.jmagdziasz.abcfamily.allaccess_monthly', // $4.99/month
};
// ────────────────────────────────────────────────────────────────────────────

const TIERS = [
  {
    id: 'numbers',
    emoji: '🔢',
    title: 'Numbers 1–10',
    price: '$1.99',
    priceNote: 'one-time',
    desc: 'Unlock all 10 numbers with illustrated scenes, tracing practice, and custom family photo overlays.',
    bullets: ['Numbers 1–10 with tracing', 'Custom photo for each number', 'Illustrated learning scenes'],
    color: '#4CAF50',
  },
  {
    id: 'names',
    emoji: '✏️',
    title: 'Name Spelling',
    price: '$1.99',
    priceNote: 'one-time',
    desc: "Practice spelling child and family names! Add photos and names for everyone in the family, then trace each letter to spell them out.",
    bullets: ['Spelling of child and family names', 'Portrait photo for each family member', 'Phone: one letter at a time · iPad: all at once'],
    color: '#E91E8C',
  },
  {
    id: 'alphabet',
    emoji: '🔤',
    title: 'Full Alphabet',
    price: '$2.99',
    priceNote: 'one-time',
    desc: 'Unlock all 26 letters F–Z with tracing practice, illustrated scenes, and custom family photo overlays.',
    bullets: ['Letters F–Z unlocked', 'Custom photo for each letter', 'Tracing & illustrated scenes'],
    color: '#FF6B35',
  },
  {
    id: 'story',
    emoji: '📖',
    title: 'Story Time',
    price: '$3.99',
    priceNote: 'one-time',
    desc: 'A 15-page illustrated family story where every character can be replaced with your own family photos.',
    bullets: ['15-page illustrated story', 'Custom family photo characters', 'Record your own voice narration'],
    color: '#7B1FA2',
  },
  {
    id: 'bundle',
    emoji: '⭐',
    title: 'Numbers + Story Bundle',
    price: '$4.99',
    priceNote: 'one-time · best value',
    desc: 'Get both Numbers 1–10 and the full Story Book at a discount. Everything you need beyond the alphabet.',
    bullets: ['Numbers 1–10 unlocked', '15-page story unlocked', 'Save vs. buying separately'],
    color: '#1565C0',
    highlight: true,
  },
  {
    id: 'monthly',
    emoji: '♾️',
    title: 'All Access',
    price: '$4.99',
    priceNote: 'per month after free trial',
    trial: '1 Week Free',
    desc: 'Everything unlocked — all 26 letters, all 10 numbers, the full story book, and name spelling. One subscription covers it all.',
    bullets: ['All 26 letters unlocked', 'Numbers 1–10 unlocked', '15-page story unlocked', 'Name spelling for the whole family', 'Cancel anytime — no charge during trial'],
    color: '#F57F17',
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  const parentPin = useAlphabetStore(s => s.parentPin);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handlePurchase = async (tierId: string, productId: string) => {
    // Require parent PIN before any purchase
    await new Promise<void>((resolve, reject) => {
      Alert.prompt(
        '👋 Parent Approval Required',
        'Enter your parent PIN to approve this purchase.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => reject('cancelled') },
          {
            text: 'Approve',
            onPress: (pin) => {
              if (pin === parentPin) {
                resolve();
              } else {
                Alert.alert('Incorrect PIN', 'That PIN is not correct. Please try again.');
                reject('wrong_pin');
              }
            },
          },
        ],
        'secure-text',
      );
    }).catch(() => { return Promise.reject('cancelled'); });

    setLoadingId(tierId);
    try {
      const offerings   = await Purchases.getOfferings();
      const allPackages = offerings.current?.availablePackages ?? [];
      const pkg = allPackages.find(p => p.product.identifier === productId);

      if (!pkg) {
        Alert.alert('Not Available', 'This purchase is not available right now. Please try again later.');
        return;
      }

      const { customerInfo } = await Purchases.purchasePackage(pkg);

      // Primary: sync via RevenueCat entitlements
      await syncEntitlements(customerInfo, useAlphabetStore.getState());

      // Fallback: unlock directly by tier if entitlements aren't configured in RevenueCat yet
      const store = useAlphabetStore.getState();
      if (tierId === 'alphabet') await store.unlockPremium();
      if (tierId === 'numbers')  await store.unlockNumbers();
      if (tierId === 'story')    await store.unlockStory();
      if (tierId === 'names')    await store.unlockNames();
      if (tierId === 'bundle')   { await store.unlockNumbers(); await store.unlockStory(); }
      if (tierId === 'monthly')  await store.unlockAll();

      Alert.alert('🎉 Unlocked!', 'Your new content is ready!', [
        { text: "Let's Go!", onPress: () => router.replace('/') },
      ]);
    } catch (e) {
      // Silently ignore PIN cancellation / wrong PIN
      if (e === 'cancelled' || e === 'wrong_pin') return;
      const err = e as PurchasesError;
      if (err?.code !== PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
      }
    } finally {
      setLoadingId(null);
    }
  };

  const restorePurchase = async () => {
    setLoadingId('restore');
    try {
      const customerInfo = await Purchases.restorePurchases();
      const hasAny = Object.keys(customerInfo.entitlements.active).length > 0;
      await syncEntitlements(customerInfo, useAlphabetStore.getState());

      if (hasAny) {
        Alert.alert('✅ Restored!', 'Your purchases have been restored.', [
          { text: "Let's Go!", onPress: () => router.replace('/') },
        ]);
      } else {
        Alert.alert('Nothing to Restore', 'No previous purchases found for this Apple ID.');
      }
    } catch {
      Alert.alert('Error', 'Could not restore purchases. Please try again.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>✕ Not now</Text>
        </TouchableOpacity>

        <Text style={styles.emoji}>🌟</Text>
        <Text style={styles.headline}>Expand the Adventure!</Text>
        <Text style={styles.sub}>
          Personalize every character with your family's photos. Choose the content that's right for you.
        </Text>

        {TIERS.map((tier) => {
          const productId = PRODUCT_IDS[tier.id as keyof typeof PRODUCT_IDS];
          const isLoading = loadingId === tier.id;

          return (
            <View key={tier.id} style={[styles.tierCard, (tier.highlight || tier.trial) && styles.tierHighlight, { borderColor: tier.color }]}>
              {tier.highlight && (
                <View style={[styles.bestValueBadge, { backgroundColor: tier.color }]}>
                  <Text style={styles.bestValueText}>BEST VALUE</Text>
                </View>
              )}
              {tier.trial && (
                <View style={[styles.bestValueBadge, { backgroundColor: tier.color }]}>
                  <Text style={styles.bestValueText}>FREE TRIAL</Text>
                </View>
              )}

              {/* Header */}
              <View style={styles.tierHeader}>
                <View style={[styles.tierIconBg, { backgroundColor: tier.color + '22' }]}>
                  <Text style={styles.tierEmoji}>{tier.emoji}</Text>
                </View>
                <View style={styles.tierInfo}>
                  <Text style={styles.tierTitle}>{tier.title}</Text>
                  <View style={styles.priceRow}>
                    <Text style={[styles.tierPrice, { color: tier.color }]}>{tier.price}</Text>
                    <Text style={styles.priceNote}> · {tier.priceNote}</Text>
                  </View>
                </View>
              </View>

              {/* Free trial callout */}
              {tier.trial && (
                <View style={[styles.trialBanner, { backgroundColor: tier.color + '18', borderColor: tier.color + '44' }]}>
                  <Text style={[styles.trialBannerText, { color: tier.color }]}>
                    🎉 Try free for 1 week — then {tier.price}/month
                  </Text>
                </View>
              )}

              {/* Description */}
              <Text style={styles.tierDesc}>{tier.desc}</Text>

              {/* Bullets */}
              <View style={styles.bulletList}>
                {tier.bullets.map((b, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <Text style={[styles.bulletDot, { color: tier.color }]}>✓</Text>
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>

              {/* Buy button */}
              <TouchableOpacity
                style={[styles.buyBtn, { backgroundColor: tier.color }, isLoading && styles.buyBtnDisabled]}
                onPress={() => handlePurchase(tier.id, productId)}
                disabled={!!loadingId}
                activeOpacity={0.85}
              >
                {isLoading
                  ? <ActivityIndicator color="#FFF" />
                  : <Text style={styles.buyBtnText}>
                      {tier.trial ? `Start Free Trial — then ${tier.price}/mo` : `Get ${tier.title} — ${tier.price}`}
                    </Text>
                }
              </TouchableOpacity>
            </View>
          );
        })}

        <TouchableOpacity onPress={restorePurchase} disabled={!!loadingId} style={styles.restoreBtn}>
          {loadingId === 'restore'
            ? <ActivityIndicator color="#9E9E9E" />
            : <Text style={styles.restoreText}>Restore Previous Purchases</Text>
          }
        </TouchableOpacity>

        {/* Subscription disclosure — required by App Store for auto-renewable subscriptions */}
        <View style={styles.disclosureBox}>
          <Text style={styles.disclosureTitle}>All Access Subscription</Text>
          <Text style={styles.disclosureBody}>
            • 7-day free trial, then $4.99 / month{'\n'}
            • No charge during the free trial period{'\n'}
            • Renews automatically each month after trial{'\n'}
            • Cancel anytime in App Store Settings before trial ends{'\n'}
            • Payment charged to Apple ID at end of trial{'\n'}
            • Cancellation takes effect at end of billing period
          </Text>
          <View style={styles.linkRow}>
            <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
              <Text style={styles.linkText}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.linkSep}> · </Text>
            <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
              <Text style={styles.linkText}>Terms of Use</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.legal}>
          One-time purchases never expire. All Access includes a 7-day free trial — no charge until the
          trial ends. After the trial, $4.99/month is charged to your Apple ID. Subscription renews
          automatically unless cancelled at least 24 hours before the end of the current period.
          Manage or cancel subscriptions in App Store settings.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#FFF9F0' },
  scroll: { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 48 },

  backBtn:  { alignSelf: 'flex-start', paddingVertical: 12, marginTop: 4 },
  backText: { fontSize: 15, color: '#9E9E9E', fontWeight: '600' },

  emoji:    { fontSize: 56, marginTop: 4 },
  headline: { fontSize: 28, fontWeight: '900', color: '#FF6B35', textAlign: 'center', marginTop: 8 },
  sub:      { fontSize: 15, color: '#607D8B', textAlign: 'center', marginTop: 8, lineHeight: 22, marginBottom: 24 },

  tierCard: {
    width: '100%', backgroundColor: '#FFF',
    borderRadius: 20, borderWidth: 2,
    padding: 18, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09, shadowRadius: 10, elevation: 4,
    position: 'relative', overflow: 'visible',
  },
  tierHighlight: { borderWidth: 3 },
  bestValueBadge: {
    position: 'absolute', top: -13, right: 18,
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20,
  },
  bestValueText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 1 },

  tierHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  tierIconBg:  { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  tierEmoji:   { fontSize: 28 },
  tierInfo:    { flex: 1 },
  tierTitle:   { fontSize: 18, fontWeight: '800', color: '#37474F' },
  priceRow:    { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
  tierPrice:   { fontSize: 17, fontWeight: '800' },
  priceNote:   { fontSize: 12, color: '#9E9E9E', fontWeight: '500' },

  trialBanner: {
    borderRadius: 10, borderWidth: 1,
    paddingVertical: 8, paddingHorizontal: 12,
    marginBottom: 12, alignItems: 'center',
  },
  trialBannerText: { fontSize: 14, fontWeight: '800' },

  tierDesc: { fontSize: 14, color: '#607D8B', lineHeight: 20, marginBottom: 12 },

  bulletList: { marginBottom: 16, gap: 6 },
  bulletRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletDot:  { fontSize: 14, fontWeight: '900', lineHeight: 20 },
  bulletText: { fontSize: 14, color: '#455A64', lineHeight: 20, flex: 1 },

  buyBtn:         { paddingVertical: 14, borderRadius: 50, alignItems: 'center' },
  buyBtnDisabled: { opacity: 0.6 },
  buyBtnText:     { color: '#FFF', fontSize: 15, fontWeight: '800' },

  restoreBtn:  { marginTop: 8, padding: 12 },
  restoreText: { fontSize: 14, color: '#90A4AE', fontWeight: '600', textDecorationLine: 'underline' },
  legal:       { fontSize: 11, color: '#BDBDBD', textAlign: 'center', marginTop: 16, lineHeight: 17, paddingHorizontal: 8 },

  disclosureBox: {
    width: '100%', backgroundColor: '#F5F5F5', borderRadius: 12,
    padding: 14, marginTop: 16,
  },
  disclosureTitle: { fontSize: 13, fontWeight: '700', color: '#455A64', marginBottom: 6 },
  disclosureBody:  { fontSize: 12, color: '#607D8B', lineHeight: 20 },
  linkRow:   { flexDirection: 'row', marginTop: 10, alignItems: 'center' },
  linkText:  { fontSize: 12, color: '#1565C0', textDecorationLine: 'underline', fontWeight: '600' },
  linkSep:   { fontSize: 12, color: '#9E9E9E' },
});
