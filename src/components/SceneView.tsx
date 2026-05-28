import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LetterData } from '../constants/alphabetData';
import { LetterCustomization } from '../store/alphabetStore';

interface Props {
  letterData: LetterData;
  customization?: LetterCustomization;
}

const IMAGE_HEIGHT = 220;
const DEFAULT_FACE_SIZE = 96; // diameter of the face circle overlay

export function SceneView({ letterData, customization }: Props) {
  const displayName = customization?.customName ?? letterData.defaultName;
  const faceUri = customization?.customCartoonUri ?? customization?.customImageUri;

  const faceUri2      = customization?.customImageUri2;
  const faceRotation  = customization?.customImageRotation  ?? 0;
  const faceRotation2 = customization?.customImageRotation2 ?? 0;

  const faceSize = letterData.facePosition.size ?? DEFAULT_FACE_SIZE;
  // Convert 0–1 fractions to pixel positions, centering the circle on the face
  const faceTop = letterData.facePosition.top * IMAGE_HEIGHT - faceSize / 2;

  const faceSize2 = letterData.secondFacePosition?.size ?? DEFAULT_FACE_SIZE;
  const faceTop2 = letterData.secondFacePosition
    ? letterData.secondFacePosition.top * IMAGE_HEIGHT - faceSize2 / 2
    : 0;

  const textAtBottom = letterData.textPosition === 'bottom';

  const sentenceBanner = (
    <Text style={[styles.sentence, { color: letterData.accentColor }]}>
      {displayName} {letterData.sentence}
    </Text>
  );

  return (
    <View style={[styles.card, { backgroundColor: letterData.bgColor }]}>
      {/* Banner above the image (default) */}
      {!textAtBottom && sentenceBanner}

      {/* Illustration */}
      <View style={styles.imageWrapper}>
        <Image
          source={letterData.image}
          style={
            letterData.imageShiftY
              ? {
                  // Extend the image above the container so resizeMode="cover"
                  // anchors to the bottom, revealing character content that
                  // would otherwise be clipped at the bottom of the frame.
                  position: 'absolute',
                  top: -(letterData.imageShiftY * IMAGE_HEIGHT),
                  left: 0,
                  right: 0,
                  bottom: 0,
                }
              : styles.sceneImage
          }
          resizeMode="cover"
        />

        {/* First face overlay */}
        {faceUri ? (
          <View
            style={[
              styles.faceOverlay,
              {
                top: faceTop,
                left: `${letterData.facePosition.left * 100}%` as any,
                marginLeft: -(faceSize / 2),
                width: faceSize,
                height: faceSize,
                borderRadius: faceSize / 2,
              },
            ]}
          >
            <Image
              source={{ uri: faceUri }}
              style={{
                width: faceSize,
                height: faceSize,
                transform: [{ rotate: `${faceRotation}deg` }],
              }}
            />
          </View>
        ) : null}

        {/* Second face overlay (e.g. Tate for letter T) */}
        {faceUri2 && letterData.secondFacePosition ? (
          <View
            style={[
              styles.faceOverlay,
              {
                top: faceTop2,
                left: `${letterData.secondFacePosition.left * 100}%` as any,
                marginLeft: -(faceSize2 / 2),
                width: faceSize2,
                height: faceSize2,
                borderRadius: faceSize2 / 2,
              },
            ]}
          >
            <Image
              source={{ uri: faceUri2 }}
              style={{
                width: faceSize2,
                height: faceSize2,
                transform: [{ rotate: `${faceRotation2}deg` }],
              }}
            />
          </View>
        ) : null}
      </View>

      {/* Banner below the image (when textPosition === 'bottom') */}
      {textAtBottom && sentenceBanner}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  sentence: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    letterSpacing: 0.3,
  },
  imageWrapper: {
    width: '100%',
    height: IMAGE_HEIGHT,
    overflow: 'hidden',
  },
  sceneImage: {
    width: '100%',
    height: IMAGE_HEIGHT,
  },
  faceOverlay: {
    position: 'absolute',
    // top, left, marginLeft, width, height, borderRadius set inline per-letter
    overflow: 'hidden',
  },
});
