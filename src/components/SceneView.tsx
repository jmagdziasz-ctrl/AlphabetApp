import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { LetterData } from '../constants/alphabetData';
import { LetterCustomization } from '../store/alphabetStore';

interface Props {
  letterData: LetterData;
  customization?: LetterCustomization;
  imageHeight?: number; // optional override — used by learn screen for dynamic sizing
}

const { width } = Dimensions.get('window');
const IS_TABLET = width >= 768;
const IPHONE_IMAGE_HEIGHT = 220;
const DEFAULT_IMAGE_HEIGHT = IS_TABLET ? 520 : IPHONE_IMAGE_HEIGHT;
const DEFAULT_FACE_SIZE = 96; // diameter of the face circle overlay (iPhone base)

export function SceneView({ letterData, customization, imageHeight }: Props) {
  const imgH      = imageHeight ?? DEFAULT_IMAGE_HEIGHT;
  const sizeScale = imgH / IPHONE_IMAGE_HEIGHT;

  const displayName = customization?.customName ?? letterData.defaultName;
  const faceUri     = customization?.customCartoonUri ?? customization?.customImageUri;
  const faceUri2    = customization?.customImageUri2;
  const faceRotation  = customization?.customImageRotation  ?? 0;
  const faceRotation2 = customization?.customImageRotation2 ?? 0;

  // Use parent-adjusted values if set, otherwise fall back to defaults
  const faceTopFrac  = customization?.customFaceTop  ?? letterData.facePosition.top;
  const faceLeftFrac = customization?.customFaceLeft ?? letterData.facePosition.left;
  // Face 1 — oval support: width/height can differ for portrait/landscape oval
  const faceSizeBase   = customization?.customFaceSize ?? (letterData.facePosition.size ?? DEFAULT_FACE_SIZE);
  const faceWidthBase  = customization?.customFaceWidth  ?? faceSizeBase;
  const faceHeightBase = customization?.customFaceHeight ?? faceSizeBase;
  const faceWidth  = faceWidthBase  * sizeScale;
  const faceHeight = faceHeightBase * sizeScale;
  const faceTop    = faceTopFrac * imgH - faceHeight / 2;

  // Face 2
  const faceTopFrac2   = customization?.customFaceTop2  ?? letterData.secondFacePosition?.top  ?? 0;
  const faceLeftFrac2  = customization?.customFaceLeft2 ?? letterData.secondFacePosition?.left ?? 0;
  const faceSizeBase2  = customization?.customFaceSize2 ?? (letterData.secondFacePosition?.size ?? DEFAULT_FACE_SIZE);
  const faceWidthBase2  = customization?.customFaceWidth2  ?? faceSizeBase2;
  const faceHeightBase2 = customization?.customFaceHeight2 ?? faceSizeBase2;
  const faceWidth2  = faceWidthBase2  * sizeScale;
  const faceHeight2 = faceHeightBase2 * sizeScale;
  const faceTop2    = letterData.secondFacePosition ? faceTopFrac2 * imgH - faceHeight2 / 2 : 0;

  const textAtBottom = letterData.textPosition === 'bottom';

  const sentenceFontSize = Math.max(14, Math.round(imgH * 0.09));

  const sentenceBanner = (
    <Text style={[styles.sentence, { color: letterData.accentColor, fontSize: sentenceFontSize }]}>
      {displayName} {letterData.sentence}
    </Text>
  );

  return (
    <View style={[styles.card, { backgroundColor: letterData.bgColor }]}>
      {!textAtBottom && sentenceBanner}

      <View style={[styles.imageWrapper, { height: imgH }]}>
        <Image
          source={letterData.image}
          style={
            letterData.imageShiftY
              ? {
                  position: 'absolute',
                  top: -(letterData.imageShiftY * imgH),
                  left: 0, right: 0, bottom: 0,
                }
              : { width: '100%', height: imgH }
          }
          resizeMode="cover"
        />

        {/* First face overlay — oval when width ≠ height */}
        {faceUri ? (
          <View
            style={[styles.faceOverlay, {
              top: faceTop,
              left: `${faceLeftFrac * 100}%` as any,
              marginLeft: -(faceWidth / 2),
              width: faceWidth, height: faceHeight,
              borderRadius: 9999,
            }]}
          >
            <Image
              source={{ uri: faceUri }}
              style={{ width: faceWidth, height: faceHeight, transform: [{ rotate: `${faceRotation}deg` }] }}
              resizeMode="cover"
            />
          </View>
        ) : null}

        {/* Second face overlay — oval when width ≠ height */}
        {faceUri2 && letterData.secondFacePosition ? (
          <View
            style={[styles.faceOverlay, {
              top: faceTop2,
              left: `${faceLeftFrac2 * 100}%` as any,
              marginLeft: -(faceWidth2 / 2),
              width: faceWidth2, height: faceHeight2,
              borderRadius: 9999,
            }]}
          >
            <Image
              source={{ uri: faceUri2 }}
              style={{ width: faceWidth2, height: faceHeight2, transform: [{ rotate: `${faceRotation2}deg` }] }}
              resizeMode="cover"
            />
          </View>
        ) : null}
      </View>

      {textAtBottom && sentenceBanner}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    borderRadius: 24,
    marginHorizontal: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  sentence: {
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    letterSpacing: 0.3,
  },
  imageWrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  faceOverlay: {
    position: 'absolute',
    overflow: 'hidden',
  },
});
