import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ALPHABET_DATA } from '@/constants/alphabetData';
import { useAlphabetStore } from '@/store/alphabetStore';

export default function SetupAlphabetScreen() {
  const router = useRouter();
  const { customizations } = useAlphabetStore();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🔤 Alphabet Setup</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.subtitle}>
          Tap a letter to change the character name or add a face photo.
        </Text>

        {ALPHABET_DATA.map((item) => {
          const custom      = customizations[item.letter];
          const displayName = custom?.customName ?? item.defaultName;
          const faceUri     = custom?.customCartoonUri ?? custom?.customImageUri;
          return (
            <TouchableOpacity
              key={item.letter}
              style={[styles.row, { borderLeftColor: item.accentColor }]}
              onPress={() => router.push(`/setup/${item.letter}`)}
            >
              <View style={[styles.badge, { backgroundColor: item.bgColor }]}>
                <Text style={[styles.badgeText, { color: item.accentColor }]}>{item.letter}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{displayName}</Text>
                <Text style={styles.sentence} numberOfLines={1}>
                  {displayName} {item.sentence}
                </Text>
              </View>
              {faceUri ? <Image source={{ uri: faceUri }} style={styles.thumbnail} /> : null}
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
  subtitle: { fontSize: 13, color: '#9E9E9E', marginBottom: 16 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 12, marginBottom: 10,
    padding: 12, borderLeftWidth: 4,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
  },
  badge:       { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  badgeText:   { fontSize: 24, fontWeight: '800' },
  info:        { flex: 1 },
  name:        { fontSize: 16, fontWeight: '700', color: '#37474F' },
  sentence:    { fontSize: 13, color: '#9E9E9E', marginTop: 2 },
  thumbnail:   { width: 40, height: 40, borderRadius: 20, marginRight: 8 },
  arrow:       { fontSize: 24, color: '#BDBDBD' },
});
