import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STORY_CHARACTERS } from '@/constants/storyData';
import { useAlphabetStore } from '@/store/alphabetStore';

export default function StoryCharactersScreen() {
  const router = useRouter();
  const { storyCharacters } = useAlphabetStore();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Story Characters</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.subtitle}>
          Set a name and face photo for each character once here — they'll appear on every story page.
        </Text>

        {STORY_CHARACTERS.map((char) => {
          const custom      = storyCharacters[char.key];
          const displayName = custom?.customName ?? char.defaultName;
          const imageUri    = custom?.customImageUri;

          return (
            <TouchableOpacity
              key={char.key}
              style={[styles.row, { borderLeftColor: char.accentColor }]}
              onPress={() => router.push(`/setup/story/character/${char.key}`)}
              activeOpacity={0.75}
            >
              {/* Face circle or placeholder */}
              <View style={[styles.faceCircle, { borderColor: char.accentColor }]}>
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={[styles.faceImage, {
                      transform: [{ rotate: `${custom?.customImageRotation ?? 0}deg` }],
                    }]}
                  />
                ) : (
                  <Text style={[styles.facePlaceholder, { color: char.accentColor }]}>
                    {char.defaultName.charAt(0)}
                  </Text>
                )}
              </View>

              <View style={styles.info}>
                <Text style={[styles.name, { color: char.accentColor }]}>{displayName}</Text>
                {custom?.customName && custom.customName !== char.defaultName ? (
                  <Text style={styles.defaultName}>Default: {char.defaultName}</Text>
                ) : null}
                <Text style={styles.hint}>
                  {imageUri ? '✅ Photo set' : '📷 No photo yet'}
                </Text>
              </View>

              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#FFF9F0' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
  },
  backText: { fontSize: 16, color: '#607D8B', fontWeight: '600' },
  title:    { fontSize: 20, fontWeight: '800', color: '#37474F' },
  scroll:   { padding: 16, paddingBottom: 40 },
  subtitle: { fontSize: 13, color: '#9E9E9E', marginBottom: 20, lineHeight: 18 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 14, marginBottom: 12,
    padding: 14, borderLeftWidth: 4,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
  },
  faceCircle: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 2.5, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14, backgroundColor: '#F5F5F5',
  },
  faceImage:       { width: 56, height: 56 },
  facePlaceholder: { fontSize: 26, fontWeight: '900' },
  info:            { flex: 1 },
  name:            { fontSize: 17, fontWeight: '800', marginBottom: 2 },
  defaultName:     { fontSize: 12, color: '#9E9E9E', marginBottom: 2 },
  hint:            { fontSize: 13, color: '#9E9E9E' },
  arrow:           { fontSize: 24, color: '#BDBDBD' },
});
