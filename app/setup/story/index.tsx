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

        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>📖 How Story Setup works</Text>
          <Text style={styles.infoCardBody}>
            You can personalize each story page in two ways:{'\n'}
            {'  '}• Record your own voice reading the page aloud — your child hears you instead of the default voice{'\n'}
            {'  '}• Position character face circles so they land on the right person in each illustration{'\n\n'}
            To personalize with real family photos:{'\n'}
            {'  '}1. Tap "Manage Characters & Photos" below and add a photo for each character{'\n'}
            {'  '}2. Then open each story page to check the photo placement{'\n'}
            {'  '}3. Drag the face circles to the correct position on the illustration{'\n'}
            {'  '}4. Use the + / − buttons at the bottom of the page to resize each circle{'\n'}
            {'  '}5. Tap Save when the page looks right{'\n\n'}
            The full story text is shown on every page so you always know exactly what to read.{'\n\n'}
            💡 Word highlighting: when the app reads aloud (no parent recording), words are highlighted approximately as they're spoken. When your own voice recording plays, the audio plays in full but word-by-word highlighting is not available — the full text is shown on screen for your child to follow along.
          </Text>
        </View>

        {/* Re-record warning */}
        <View style={styles.warnCard}>
          <Text style={styles.warnCardTitle}>⚠️ Rename characters before recording</Text>
          <Text style={styles.warnCardBody}>
            If you want to use custom character names (e.g. your child's real name instead of "Benny"), set those up in Manage Characters first. Recordings you make before renaming will use the old names and won't update automatically — you'll need to re-record those pages.
          </Text>
        </View>

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
          Tap a page below to record your reading or reposition the face circles.
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
  infoCard: {
    backgroundColor: '#F3E5F5', borderLeftWidth: 4, borderLeftColor: '#7B1FA2',
    borderRadius: 12, padding: 14, marginBottom: 12,
  },
  infoCardTitle: { fontSize: 15, fontWeight: '800', color: '#6A1B9A', marginBottom: 6 },
  infoCardBody:  { fontSize: 13, color: '#37474F', lineHeight: 20 },
  warnCard: {
    backgroundColor: '#FFF8E1', borderLeftWidth: 4, borderLeftColor: '#F9A825',
    borderRadius: 12, padding: 14, marginBottom: 16,
  },
  warnCardTitle: { fontSize: 15, fontWeight: '800', color: '#E65100', marginBottom: 6 },
  warnCardBody:  { fontSize: 13, color: '#37474F', lineHeight: 20 },

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
