import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NUMBER_DATA } from '@/constants/numberData';

const COLS = 2;
const ROWS = 5; // 10 numbers / 2 cols

export default function NumbersHomeScreen() {
  const { width, height } = useWindowDimensions();
  const router = useRouter();

  const GAP     = 12;
  const PADDING = 16;
  const btnW    = (width - PADDING * 2 - GAP * (COLS - 1)) / COLS;
  // Reserve space for header
  const btnH    = Math.floor((height - 80 - GAP * (ROWS - 1) - PADDING * 2) / ROWS);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🔢 Numbers</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Number grid */}
      <View style={[styles.grid, { padding: PADDING, gap: GAP }]}>
        {NUMBER_DATA.map((item) => (
          <TouchableOpacity
            key={item.number}
            style={[
              styles.numBtn,
              { width: btnW, height: btnH, backgroundColor: item.bgColor, borderColor: item.accentColor },
            ]}
            onPress={() => router.push(`/numbers/${item.number}`)}
            activeOpacity={0.75}
          >
            <Text style={[styles.numText, { color: item.accentColor }]}>
              {item.number}
            </Text>
            <Text style={[styles.numLabel, { color: item.accentColor }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#FFF9F0' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
  },
  backBtn:  { padding: 4 },
  backText: { fontSize: 16, color: '#607D8B', fontWeight: '600' },
  title:    { fontSize: 22, fontWeight: '900', color: '#FF6B35' },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  numBtn: {
    borderRadius: 20,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  numText:  { fontSize: 52, fontWeight: '900', lineHeight: 60 },
  numLabel: { fontSize: 16, fontWeight: '700', marginTop: 2 },
});
