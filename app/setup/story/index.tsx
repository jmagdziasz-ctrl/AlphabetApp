import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STORY_DATA, STORY_TITLE } from '@/constants/storyData';
import { useAlphabetStore } from '@/store/alphabetStore';

export default function SetupStoryIndexScreen() {
  const router = useRouter();
  const { storyAudioUris } = useAlphabetStore();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>📖 Story Setup</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.bookTitle}>{STORY_TITLE}</Text>

        {/* Characters button */}
        <TouchableOpacity
          style={styles.charactersBtn}
          onPress={() => router.push('/setup/story/characters')}
          activeOpacity={0.8}
        >
          <Text style={styles.charactersBtnText}>👥 Manage Characters &amp; Photos</Text>
          <Text style={styles.charactersBtnSub}>Set names &amp; photos for Benny, Mom, Dad, and everyone else</Text>
        </TouchableOpacity>

        <Text style={styles.subtitle}>
          Tap a page to record yourself reading it. The full text is shown so you know exactly what to say.
        </Text>

        {STORY_DATA.filter(p => p.page <= 14).map((page) => {
          const hasAudio = !!storyAudioUris[page.page];
          return (
            <TouchableOpacity
              key={page.page}
              style={[styles.card, { borderLeftColor: page.accentColor }]}
              onPress={() => router.push(`/setup/story/${page.page}`)}
              activeOpacity={0.75}
            >
              {/* Page number + recording badge */}
              <View style={styles.cardHeader}>
                <View style={[styles.pageBadge, { backgroundColor: page.bgColor }]}>
                  <Text style={[styles.pageNum, { color: page.accentColor }]}>{page.page}</Text>
                </View>
                <Text style={[styles.pageTitle, { color: page.accentColor }]}>Page {page.page}</Text>
                <View style={styles.cardHeaderRight}>
                  {hasAudio
                    ? <Text style={styles.recordedBadge}>🎙️ Recorded</Text>
                    : <Text style={styles.notRecordedBadge}>No recording</Text>
                  }
                  <Text style={styles.arrow}>›</Text>
                </View>
              </View>

              {/* Full story text */}
              <View style={[styles.textBox, { backgroundColor: page.bgColor }]}>
                <Text style={[styles.storyText, { color: page.accentColor }]}>
                  {page.text}
                </Text>
              </View>
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
  backText:  { fontSize: 16, color: '#607D8B', fontWeight: '600' },
  title:     { fontSize: 20, fontWeight: '800', color: '#37474F', flex: 1, textAlign: 'center' },
  scroll:    { padding: 16, paddingBottom: 48 },
  bookTitle: { fontSize: 18, fontWeight: '900', color: '#FF6B35', textAlign: 'center', marginBottom: 12 },
  charactersBtn: {
    backgroundColor: '#7B1FA2', borderRadius: 14, padding: 16, marginBottom: 16,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 5,
  },
  charactersBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800', marginBottom: 3 },
  charactersBtnSub:  { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  subtitle:  { fontSize: 13, color: '#9E9E9E', textAlign: 'center', marginBottom: 20, lineHeight: 18 },

  card: {
    backgroundColor: '#FFF', borderRadius: 16, marginBottom: 16,
    borderLeftWidth: 5, overflow: 'hidden',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 5,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
  },
  pageBadge: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  pageNum:   { fontSize: 18, fontWeight: '900' },
  pageTitle: { fontSize: 16, fontWeight: '800', flex: 1 },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recordedBadge:    { fontSize: 12, fontWeight: '700', color: '#2E7D32', backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  notRecordedBadge: { fontSize: 12, fontWeight: '600', color: '#9E9E9E', backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  arrow: { fontSize: 22, color: '#BDBDBD' },

  textBox: {
    marginHorizontal: 14, marginBottom: 14, borderRadius: 12, padding: 14,
  },
  storyText: { fontSize: 15, fontWeight: '600', lineHeight: 24 },
});
