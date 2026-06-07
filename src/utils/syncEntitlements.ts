import { CustomerInfo } from 'react-native-purchases';
import { useAlphabetStore } from '@/store/alphabetStore';

// Sync RevenueCat entitlements → local unlock state.
// Call this on launch AND after any purchase/restore.
export async function syncEntitlements(
  customerInfo: CustomerInfo,
  store: ReturnType<typeof useAlphabetStore.getState>,
) {
  const active = customerInfo.entitlements.active;
  if (active['all_access'] || active['monthly']) {
    await store.unlockAll();
  } else {
    if (active['alphabet']) await store.unlockPremium();
    if (active['numbers'])  await store.unlockNumbers();
    if (active['story'])    await store.unlockStory();
    if (active['bundle'])   { await store.unlockNumbers(); await store.unlockStory(); }
  }
}
