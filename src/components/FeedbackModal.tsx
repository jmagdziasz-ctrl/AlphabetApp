import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

// Two celebration combos — chime plays first, then the voice clip
const COMBOS = [
  {
    chime: require('@/assets/sounds/chime.mp3'),
    voice: require('@/assets/sounds/youdidiit.mp3'),
  },
  {
    chime: require('@/assets/sounds/chime2.mp3'),
    voice: require('@/assets/sounds/greatjob.mp3'),
  },
];

interface Props {
  visible: boolean;
  success: boolean;
  onNext: () => void;
  onRetry: () => void;
  accentColor: string;
}

const { width, height } = Dimensions.get('window');

const CONFETTI_COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6BD6', '#FF9A3C', '#A855F7', '#06B6D4'];
const CONFETTI_POSITIONS = [
  { x: 0.1, y: 0.1 },
  { x: 0.85, y: 0.12 },
  { x: 0.05, y: 0.45 },
  { x: 0.9, y: 0.4 },
  { x: 0.15, y: 0.75 },
  { x: 0.8, y: 0.72 },
  { x: 0.45, y: 0.05 },
  { x: 0.5, y: 0.9 },
];

export function FeedbackModal({ visible, success, onNext, onRetry, accentColor }: Props) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  // Create bounce animations for each confetti piece
  const bounceAnims = useRef(
    Array.from({ length: 8 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      bounceAnims.forEach(a => a.setValue(0));

      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 4 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ...bounceAnims.map((anim, i) =>
          Animated.sequence([
            Animated.delay(i * 60),
            Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 3 }),
          ])
        ),
      ]).start();

      // Play celebration combo when modal appears
      if (success) {
        const combo = COMBOS[Math.floor(Math.random() * COMBOS.length)];
        (async () => {
          try {
            await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
            // Play chime first
            const { sound: chimeSound } = await Audio.Sound.createAsync(
              combo.chime, { shouldPlay: true },
            );
            // When chime finishes, play the voice clip
            await new Promise<void>((resolve) => {
              chimeSound.setOnPlaybackStatusUpdate((s) => {
                if (s.isLoaded && s.didJustFinish) {
                  chimeSound.unloadAsync();
                  resolve();
                }
              });
            });
            const { sound: voiceSound } = await Audio.Sound.createAsync(
              combo.voice, { shouldPlay: true },
            );
            voiceSound.setOnPlaybackStatusUpdate((s) => {
              if (s.isLoaded && s.didJustFinish) voiceSound.unloadAsync();
            });
          } catch {}
        })();
      } else {
        Speech.speak('Keep trying, you can do it!', { pitch: 1.3, rate: 1.0 });
      }
    } else {
      bounceAnims.forEach(a => a.setValue(0));
      Speech.stop();
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        {/* Confetti circles */}
        {success && bounceAnims.map((anim, i) => (
          <Animated.View
            key={i}
            style={[
              styles.confetti,
              {
                backgroundColor: CONFETTI_COLORS[i],
                left: CONFETTI_POSITIONS[i].x * width - 20,
                top: CONFETTI_POSITIONS[i].y * height - 20,
                transform: [{ scale: anim }],
                opacity: anim,
              },
            ]}
          />
        ))}

        <Animated.View
          style={[
            styles.card,
            {
              borderColor: accentColor,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Text style={styles.emoji}>{success ? '⭐' : '💪'}</Text>
          <Text style={[styles.title, { color: accentColor }]}>
            {success ? 'Great Job!' : 'You Can Do It!'}
          </Text>
          <Text style={styles.subtitle}>
            {success
              ? 'You traced the letter perfectly!'
              : "Keep trying — you're almost there!"}
          </Text>

          {success ? (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: accentColor }]}
              onPress={onNext}
            >
              <Text style={styles.buttonText}>Next Letter →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: accentColor }]}
              onPress={onRetry}
            >
              <Text style={styles.buttonText}>Try Again!</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confetti: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    width: '80%',
    borderWidth: 3,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  emoji: { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#757575', textAlign: 'center', marginBottom: 24 },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 50,
  },
  buttonText: { color: 'white', fontSize: 20, fontWeight: '700' },
});
