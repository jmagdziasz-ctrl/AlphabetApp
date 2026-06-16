import { CustomerInfo } from 'react-native-purchases';
import { useAlphabetStore } from '@/store/alphabetStore';

// Sync RevenueCat entitlements → local unlock state.
// Call this on launch AND after any purchase/restore.
//
// Uses setUnlockStates() so the result is AUTHORITATIVE — if RevenueCat
// says a feature is not purchased, it will be locked even if a stale
// 'true' value was left in AsyncStorage (e.g. from a test unlock).
export async function syncEntitlements(
  customerInfo: CustomerInfo,
  store: ReturnType<typeof useAlphabetStore.getState>,
) {
  const active = customerInfo.entitlements.active;

  const hasAllAccess = !!(active['all_access'] || active['monthly']);

  await store.setUnlockStates({
    isPremiumUnlocked: hasAllAccess || !!active['alphabet'],
    isNumbersUnlocked: hasAllAccess || !!active['numbers'] || !!active['bundle'],
    isStoryUnlocked:   hasAllAccess || !!active['story']   || !!active['bundle'],
    isNamesUnlocked:   hasAllAccess || !!active['names'],
  });
}
