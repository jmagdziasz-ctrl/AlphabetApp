import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LetterCustomization {
  customName?: string;
  customImageUri?: string;
  customImageRotation?: number;
  customImageUri2?: string;
  customImageRotation2?: number;
  customCartoonUri?: string;
  customFaceTop?: number;
  customFaceLeft?: number;
  customFaceSize?: number;   // legacy: kept for backward compat, superseded by width/height
  customFaceWidth?: number;  // oval horizontal size in px
  customFaceHeight?: number; // oval vertical size in px
  customFaceTop2?: number;
  customFaceLeft2?: number;
  customFaceSize2?: number;  // legacy
  customFaceWidth2?: number;
  customFaceHeight2?: number;
}

export interface StoryPageCustomization {
  customImageUri?: string;
  customImageRotation?: number;
  customImageUri2?: string;
  customImageRotation2?: number;
  customFaceTop?: number;
  customFaceLeft?: number;
  customFaceSize?: number;
  customFaceTop2?: number;
  customFaceLeft2?: number;
  customFaceSize2?: number;
}

// Family member for the Names spelling feature
export interface FamilyMember {
  id: string;
  name: string;         // uppercase
  photoUri: string;
  photoRotation: number;
}

// Global story character (photo + name set once, used on all pages)
export interface StoryCharacterCustomization {
  customName?: string;
  customImageUri?: string;
  customImageRotation?: number;
}

// Per-page position override for a single character
export interface CharacterPagePosition {
  top?: number;
  left?: number;
  size?: number;
}

// Letters A–E are always free. F–Z require the $2.99 unlock.
export const FREE_LETTERS = new Set(['A', 'B', 'C', 'D', 'E']);

interface AlphabetStore {
  // ── Alphabet ──────────────────────────────────────────────────────────────
  customizations: Record<string, LetterCustomization>;
  isPremiumUnlocked: boolean;
  // ── Numbers ───────────────────────────────────────────────────────────────
  isNumbersUnlocked: boolean;
  // ── Names ─────────────────────────────────────────────────────────────────
  isNamesUnlocked: boolean;
  // ── Story ─────────────────────────────────────────────────────────────────
  isStoryUnlocked: boolean;
  storyCustomizations: Record<number, StoryPageCustomization>;
  storyAudioUris: Record<number, string>;
  // Story characters: key = character key e.g. 'benny'
  storyCharacters: Record<string, StoryCharacterCustomization>;
  // Per-page face positions: storyPagePositions[pageNum][characterKey]
  storyPagePositions: Record<string, Record<string, CharacterPagePosition>>;
  // ── Name Spelling ─────────────────────────────────────────────────────────
  familyMembers: FamilyMember[];
  // ── Settings ──────────────────────────────────────────────────────────────
  parentPin: string;
  letterCase: 'upper' | 'lower';
  // ── Actions ───────────────────────────────────────────────────────────────
  setCustomization: (letter: string, data: Partial<LetterCustomization>) => Promise<void>;
  clearCustomization: (letter: string) => Promise<void>;
  unlockPremium: () => Promise<void>;
  unlockNumbers: () => Promise<void>;
  unlockStory: () => Promise<void>;
  unlockNames: () => Promise<void>;
  unlockAll: () => Promise<void>;
  setParentPin: (pin: string) => Promise<void>;
  setLetterCase: (c: 'upper' | 'lower') => Promise<void>;
  setStoryCustomization: (page: number, data: Partial<StoryPageCustomization>) => Promise<void>;
  setStoryAudio: (page: number, uri: string) => Promise<void>;
  clearStoryAudio: (page: number) => Promise<void>;
  setStoryCharacter: (key: string, data: Partial<StoryCharacterCustomization>) => Promise<void>;
  setStoryPagePosition: (page: number, characterKey: string, pos: CharacterPagePosition) => Promise<void>;
  clearStoryPagePosition: (page: number, characterKey: string) => Promise<void>;
  addFamilyMember: (data: Omit<FamilyMember, 'id'>) => Promise<FamilyMember>;
  updateFamilyMember: (id: string, data: Partial<Omit<FamilyMember, 'id'>>) => Promise<void>;
  deleteFamilyMember: (id: string) => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAlphabetStore = create<AlphabetStore>((set, get) => ({
  customizations:      {},
  isPremiumUnlocked:   false,
  isNumbersUnlocked:   false,
  isStoryUnlocked:     false,
  isNamesUnlocked:     false,
  storyCustomizations: {},
  storyAudioUris:      {},
  storyCharacters:     {},
  storyPagePositions:  {},
  familyMembers:       [],
  parentPin:           '1234',
  letterCase:          'upper',

  setCustomization: async (letter, data) => {
    const updated = { ...get().customizations, [letter]: { ...get().customizations[letter], ...data } };
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

  unlockNumbers: async () => {
    set({ isNumbersUnlocked: true });
    await AsyncStorage.setItem('isNumbersUnlocked', 'true');
  },

  unlockStory: async () => {
    set({ isStoryUnlocked: true });
    await AsyncStorage.setItem('isStoryUnlocked', 'true');
  },

  unlockNames: async () => {
    set({ isNamesUnlocked: true });
    await AsyncStorage.setItem('isNamesUnlocked', 'true');
  },

  unlockAll: async () => {
    set({ isPremiumUnlocked: true, isNumbersUnlocked: true, isStoryUnlocked: true, isNamesUnlocked: true });
    await AsyncStorage.multiSet([
      ['isPremiumUnlocked', 'true'],
      ['isNumbersUnlocked', 'true'],
      ['isStoryUnlocked',   'true'],
      ['isNamesUnlocked',   'true'],
    ]);
  },

  setParentPin: async (pin) => {
    set({ parentPin: pin });
    await AsyncStorage.setItem('parentPin', pin);
  },

  setLetterCase: async (c) => {
    set({ letterCase: c });
    await AsyncStorage.setItem('letterCase', c);
  },

  setStoryCustomization: async (page, data) => {
    const updated = { ...get().storyCustomizations, [page]: { ...get().storyCustomizations[page], ...data } };
    set({ storyCustomizations: updated });
    await AsyncStorage.setItem('storyCustomizations', JSON.stringify(updated));
  },

  setStoryAudio: async (page, uri) => {
    const updated = { ...get().storyAudioUris, [page]: uri };
    set({ storyAudioUris: updated });
    await AsyncStorage.setItem('storyAudioUris', JSON.stringify(updated));
  },

  clearStoryAudio: async (page) => {
    const updated = { ...get().storyAudioUris };
    delete updated[page];
    set({ storyAudioUris: updated });
    await AsyncStorage.setItem('storyAudioUris', JSON.stringify(updated));
  },

  setStoryCharacter: async (key, data) => {
    const updated = {
      ...get().storyCharacters,
      [key]: { ...get().storyCharacters[key], ...data },
    };
    set({ storyCharacters: updated });
    await AsyncStorage.setItem('storyCharacters', JSON.stringify(updated));
  },

  setStoryPagePosition: async (page, characterKey, pos) => {
    const pageKey = String(page);
    const pagePositions = get().storyPagePositions;
    const updated = {
      ...pagePositions,
      [pageKey]: { ...pagePositions[pageKey], [characterKey]: pos },
    };
    set({ storyPagePositions: updated });
    await AsyncStorage.setItem('storyPagePositions', JSON.stringify(updated));
  },

  clearStoryPagePosition: async (page, characterKey) => {
    const pageKey = String(page);
    const pagePositions = get().storyPagePositions;
    const updatedPage = { ...pagePositions[pageKey] };
    delete updatedPage[characterKey];
    const updated = { ...pagePositions, [pageKey]: updatedPage };
    set({ storyPagePositions: updated });
    await AsyncStorage.setItem('storyPagePositions', JSON.stringify(updated));
  },

  addFamilyMember: async (data) => {
    const member: FamilyMember = { ...data, id: Date.now().toString() };
    const updated = [...get().familyMembers, member];
    set({ familyMembers: updated });
    await AsyncStorage.setItem('familyMembers', JSON.stringify(updated));
    return member;
  },

  updateFamilyMember: async (id, data) => {
    const updated = get().familyMembers.map(m => m.id === id ? { ...m, ...data } : m);
    set({ familyMembers: updated });
    await AsyncStorage.setItem('familyMembers', JSON.stringify(updated));
  },

  deleteFamilyMember: async (id) => {
    const updated = get().familyMembers.filter(m => m.id !== id);
    set({ familyMembers: updated });
    await AsyncStorage.setItem('familyMembers', JSON.stringify(updated));
  },

  loadFromStorage: async () => {
    const results = await AsyncStorage.multiGet([
      'customizations', 'isPremiumUnlocked', 'isNumbersUnlocked',
      'isStoryUnlocked', 'isNamesUnlocked', 'parentPin', 'letterCase', 'storyCustomizations', 'storyAudioUris',
      'storyCharacters', 'storyPagePositions', 'familyMembers',
    ]);
    const m = Object.fromEntries(results.map(([k, v]) => [k, v]));
    set({
      customizations:      m.customizations      ? JSON.parse(m.customizations)      : {},
      isPremiumUnlocked:   m.isPremiumUnlocked    === 'true',
      isNumbersUnlocked:   m.isNumbersUnlocked    === 'true',
      isStoryUnlocked:     m.isStoryUnlocked      === 'true',
      isNamesUnlocked:     m.isNamesUnlocked      === 'true',
      parentPin:           m.parentPin            ?? '1234',
      letterCase:          (m.letterCase as 'upper' | 'lower') ?? 'upper',
      storyCustomizations: m.storyCustomizations  ? JSON.parse(m.storyCustomizations) : {},
      storyAudioUris:      m.storyAudioUris       ? JSON.parse(m.storyAudioUris)      : {},
      storyCharacters:    m.storyCharacters    ? JSON.parse(m.storyCharacters)    : {},
      storyPagePositions: m.storyPagePositions ? JSON.parse(m.storyPagePositions) : {},
      familyMembers:      m.familyMembers      ? JSON.parse(m.familyMembers)      : [],
    });
  },
}));
