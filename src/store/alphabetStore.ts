import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LetterCustomization {
  customName?: string;
  customImageUri?: string;      // photo URI chosen by parent (first character)
  customImageRotation?: number; // degrees, clockwise (first character)
  customImageUri2?: string;     // photo URI for second character (e.g. T = Tucker & Tate)
  customImageRotation2?: number;// degrees, clockwise (second character)
  customCartoonUri?: string;    // kept for backwards compatibility
}

// Letters A–E are always free. F–Z require the $2.99 unlock.
export const FREE_LETTERS = new Set(['A', 'B', 'C', 'D', 'E']);

interface AlphabetStore {
  customizations: Record<string, LetterCustomization>;
  isPremiumUnlocked: boolean;
  parentPin: string;
  setCustomization: (letter: string, data: Partial<LetterCustomization>) => Promise<void>;
  clearCustomization: (letter: string) => Promise<void>;
  // Call this after a successful in-app purchase to permanently unlock all letters.
  unlockPremium: () => Promise<void>;
  setParentPin: (pin: string) => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAlphabetStore = create<AlphabetStore>((set, get) => ({
  customizations: {},
  isPremiumUnlocked: false,
  parentPin: '1234',
  setCustomization: async (letter, data) => {
    const updated = {
      ...get().customizations,
      [letter]: { ...get().customizations[letter], ...data },
    };
    set({ customizations: updated });
    await AsyncStorage.setItem('customizations', JSON.stringify(updated));
  },
  clearCustomization: async (letter) => {
    const updated = { ...get().customizations };
    delete updated[letter];
    set({ customizations: updated });
    await AsyncStorage.setItem('customizations', JSON.stringify(updated));
  },
  unlockPremium: async () => {
    set({ isPremiumUnlocked: true });
    await AsyncStorage.setItem('isPremiumUnlocked', 'true');
  },
  setParentPin: async (pin: string) => {
    set({ parentPin: pin });
    await AsyncStorage.setItem('parentPin', pin);
  },
  loadFromStorage: async () => {
    const custRaw   = await AsyncStorage.getItem('customizations');
    const premRaw   = await AsyncStorage.getItem('isPremiumUnlocked');
    const pinRaw    = await AsyncStorage.getItem('parentPin');
    set({
      customizations:    custRaw ? JSON.parse(custRaw) : {},
      isPremiumUnlocked: premRaw === 'true',
      parentPin:         pinRaw ?? '1234',
    });
  },
}));
