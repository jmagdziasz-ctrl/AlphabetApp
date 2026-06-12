import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image, useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlphabetStore } from '@/store/alphabetStore';

const ACCENT = '#E91E8C';

export default function NamesScreen() {
  const router   = useRouter();
  const { width } = useWindowDimensions();
  const isTablet  = width >= 768;

  const familyMembers  = useAlphabetStore(s => s.familyMembers);
  const isNamesUnlocked = useAlphabetStore(s => s.isNamesUnlocked);

  // Guard: redirect to paywall if not unlocked
  React.useEffect(() => {
    if (!isNamesUnlocked) router.replace('/paywall');
  }, [isNamesUnlocked]);

  if (!isNamesUnlocked) return null;

  // Portrait cards — 2 columns on phone, 4 on tablet
  const cols      = isTablet ? 4 : 2;
  const GAP       = 12;
  const PADDING   = 16;
  const cardWidth = Math.floor((width - PADDING * 2 - GAP * (cols - 1)) / cols);
  const cardHeight = Math.floor(cardWidth * 1.35); // portrait ratio

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Names</Text>
        <View style={{ width: 60 }} />
      </View>

      {familyMembers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>👨‍👩‍👧‍👦</Text>
          <Text style={styles.emptyTitle}>No Family Members Yet</Text>
          <Text style={styles.emptySubtitle}>
            Ask a parent to add family members in Parent Setup → Names Setup.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.grid, { padding: PADDING, gap: GAP }]}>
          {familyMembers.map((member) => (
            <TouchableOpacity
              key={member.id}
              style={[styles.card, { width: cardWidth }]}
              onPress={() => router.push(`/name/${member.id}`)}
              activeOpacity={0.82}
            >
              {/* Portrait photo */}
              {member.photoUri ? (
                <Image
                  source={{ uri: member.photoUri }}
                  style={[
                    styles.cardPhoto,
                    {
                      width: cardWidth,
                      height: cardHeight,
                      transform: [{ rotate: `${member.photoRotation}deg` }],
                    },
                  ]}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.cardPhotoPlaceholder, { width: cardWidth, height: cardHeight }]}>
                  <Text style={styles.placeholderEmoji}>😊</Text>
                </View>
              )}

              {/* Name label at bottom of card */}
              <View style={styles.cardLabel}>
                <Text style={styles.cardName} numberOfLines={1}>{member.name}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#FFF9F0' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#F8BBD9',
  },
  backText:    { fontSize: 16, color: '#607D8B', fontWeight: '600' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: ACCENT },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  card: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FFF3FA',
    borderWidth: 2.5,
    borderColor: ACCENT,
    shadowColor: '#E91E8C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardPhoto: { borderRadius: 0 },
  cardPhotoPlaceholder: {
    backgroundColor: '#FCE4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: { fontSize: 56 },

  cardLabel: {
    backgroundColor: ACCENT,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  cardName: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 1,
  },

  emptyState:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyEmoji:    { fontSize: 64, marginBottom: 16 },
  emptyTitle:    { fontSize: 24, fontWeight: '800', color: '#37474F', marginBottom: 8 },
  emptySubtitle: { fontSize: 16, color: '#9E9E9E', textAlign: 'center', lineHeight: 24 },
});
