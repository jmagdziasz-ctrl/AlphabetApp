import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STORY_DATA, STORY_TITLE, STORY_COVER } from '@/constants/storyData';
import { useAlphabetStore } from '@/store/alphabetStore';

export default function StoryHomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { storyAudioUris } = useAlphabetStore();
  const coverHeight = Math.round(width * 0.55);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📖 {STORY_TITLE}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Cover — tap to start from page 1 */}
        <TouchableOpacity onPress={() => router.push('/story/1')} activeOpacity={0.85}>
          <Image
            source={STORY_COVER}
            style={[styles.cover, { height: coverHeight }]}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <Text style={styles.subtitle}>Tap a page to read it together!</Text>

        {STORY_DATA.map((page) => {
          const hasAudio = !!storyAudioUris[page.page];
          // First line of text as preview
          const preview = page.text.split('\n')[0];
          return (
            <TouchableOpacity
              key={page.page}
              style={[styles.pageRow, { borderLeftColor: page.accentColor }]}
              onPress={() => router.push(`/story/${page.page}`)}
              activeOpacity={0.75}
            >
              <View style={[styles.pageBadge, { backgroundColor: page.bgColor }]}>
                <Text style={[styles.pageNum, { color: page.accentColor }]}>{page.page}</Text>
              </View>
              <Text style={styles.pageText} numberOfLines={2}>{preview}</Text>
              {hasAudio && <Text style={styles.audioIcon}>🎙️</Text>}
            </TouchableOpacity>
          );
        })}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#FFF9F0' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
  },
  backText:  { fontSize: 16, color: '#607D8B', fontWeight: '600' },
  title:     { fontSize: 16, fontWeight: '900', color: '#FF6B35', flex: 1, textAlign: 'center' },
  scroll:    { padding: 16, paddingBottom: 40 },
  cover:     { width: '100%', alignSelf: 'center', marginBottom: 12 },
  subtitle:  { fontSize: 14, color: '#9E9E9E', textAlign: 'center', marginBottom: 16 },
  pageRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 14,
    marginBottom: 10, padding: 12, borderLeftWidth: 4,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 3,
  },
  pageBadge: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  pageNum:   { fontSize: 20, fontWeight: '900' },
  pageText:  { flex: 1, fontSize: 14, color: '#37474F', fontWeight: '500' },
  audioIcon: { fontSize: 20, marginLeft: 8 },
});
