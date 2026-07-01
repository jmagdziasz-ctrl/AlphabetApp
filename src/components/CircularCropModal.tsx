import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  PanResponder, Animated, Image, ActivityIndicator,
  Dimensions, StatusBar,
} from 'react-native';
import { Svg, Defs, Mask, Rect, Circle as SvgCircle } from 'react-native-svg';
import * as ImageManipulator from 'expo-image-manipulator';

const { width: SW, height: SH } = Dimensions.get('window');
const CROP_D = Math.min(SW, SH) * 0.80; // circle diameter
const CROP_R = CROP_D / 2;

interface Props {
  visible: boolean;
  imageUri: string;
  onCrop: (uri: string) => void;
  onCancel: () => void;
}

function touchDist(a: { pageX: number; pageY: number }, b: { pageX: number; pageY: number }) {
  return Math.hypot(b.pageX - a.pageX, b.pageY - a.pageY);
}

export function CircularCropModal({ visible, imageUri, onCrop, onCancel }: Props) {
  const [imgSize, setImgSize]       = useState<{ w: number; h: number } | null>(null);
  const [containerW, setContainerW] = useState(SW);
  const [containerH, setContainerH] = useState(SH * 0.78);
  const [cropping, setCropping]     = useState(false);

  // Animated transform values — written directly via setValue, no spring/timing needed
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const txAnim    = useRef(new Animated.Value(0)).current;
  const tyAnim    = useRef(new Animated.Value(0)).current;

  // Mutable refs (current transform, readable inside gesture callbacks without stale closure)
  const scaleRef = useRef(1);
  const txRef    = useRef(0);
  const tyRef    = useRef(0);

  // Keep display-size in a ref so PanResponder callbacks can read the latest value
  const displaySizeRef = useRef({ w: CROP_D, h: CROP_D });
  const imgSizeRef     = useRef<{ w: number; h: number } | null>(null);

  useEffect(() => {
    if (!imgSize) return;
    const ratio = CROP_D / Math.min(imgSize.w, imgSize.h);
    displaySizeRef.current = { w: imgSize.w * ratio, h: imgSize.h * ratio };
    imgSizeRef.current = imgSize;
  }, [imgSize]);

  // Load image dimensions and reset transform whenever the modal opens with a new image
  useEffect(() => {
    if (!visible || !imageUri) return;
    setImgSize(null);
    scaleRef.current = 1; txRef.current = 0; tyRef.current = 0;
    scaleAnim.setValue(1); txAnim.setValue(0); tyAnim.setValue(0);
    Image.getSize(imageUri, (w, h) => setImgSize({ w, h }));
  }, [visible, imageUri]);

  // Clamp translate so the crop circle is always covered by the image
  const clampTranslate = (tx: number, ty: number, s: number) => {
    const { w: dw, h: dh } = displaySizeRef.current;
    const maxX = Math.max(0, (dw * s) / 2 - CROP_R);
    const maxY = Math.max(0, (dh * s) / 2 - CROP_R);
    return {
      x: Math.max(-maxX, Math.min(maxX, tx)),
      y: Math.max(-maxY, Math.min(maxY, ty)),
    };
  };

  // Gesture state refs
  const pinchState = useRef({ on: false, d0: 0, s0: 1, tx0: 0, ty0: 0 });
  const panState   = useRef({ on: false, px0: 0, py0: 0, tx0: 0, ty0: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,

      onPanResponderGrant: (evt) => {
        const ts = evt.nativeEvent.touches;
        if (ts.length >= 2) {
          pinchState.current = { on: true, d0: touchDist(ts[0], ts[1]), s0: scaleRef.current, tx0: txRef.current, ty0: tyRef.current };
          panState.current.on = false;
        } else {
          panState.current = { on: true, px0: ts[0].pageX, py0: ts[0].pageY, tx0: txRef.current, ty0: tyRef.current };
          pinchState.current.on = false;
        }
      },

      onPanResponderMove: (evt) => {
        const ts = evt.nativeEvent.touches;

        if (ts.length >= 2) {
          if (!pinchState.current.on) {
            // Fingers added mid-gesture — re-initialise pinch from current position
            pinchState.current = { on: true, d0: touchDist(ts[0], ts[1]), s0: scaleRef.current, tx0: txRef.current, ty0: tyRef.current };
            panState.current.on = false;
            return;
          }
          const newS = Math.max(1, Math.min(8, pinchState.current.s0 * touchDist(ts[0], ts[1]) / pinchState.current.d0));
          const { x, y } = clampTranslate(pinchState.current.tx0, pinchState.current.ty0, newS);
          scaleRef.current = newS; txRef.current = x; tyRef.current = y;
          scaleAnim.setValue(newS); txAnim.setValue(x); tyAnim.setValue(y);
        } else if (ts.length === 1) {
          if (pinchState.current.on) {
            // One finger lifted — switch to pan from current position
            pinchState.current.on = false;
            panState.current = { on: true, px0: ts[0].pageX, py0: ts[0].pageY, tx0: txRef.current, ty0: tyRef.current };
            return;
          }
          if (!panState.current.on) return;
          const { x, y } = clampTranslate(
            panState.current.tx0 + ts[0].pageX - panState.current.px0,
            panState.current.ty0 + ts[0].pageY - panState.current.py0,
            scaleRef.current,
          );
          txRef.current = x; tyRef.current = y;
          txAnim.setValue(x); tyAnim.setValue(y);
        }
      },

      onPanResponderRelease:   () => { pinchState.current.on = false; panState.current.on = false; },
      onPanResponderTerminate: () => { pinchState.current.on = false; panState.current.on = false; },
    })
  ).current;

  const handleCrop = async () => {
    const imgS = imgSizeRef.current;
    if (!imgS) return;
    setCropping(true);
    try {
      const s  = scaleRef.current;
      const tx = txRef.current;
      const ty = tyRef.current;
      const { w: imgW, h: imgH } = imgS;
      const { w: dw, h: dh }     = displaySizeRef.current;

      // Map the crop circle bounding box from display coords → original image pixels.
      // display-to-image scale factor (same for both axes)
      const d2i      = imgW / dw; // = imgH / dh = min(imgW, imgH) / CROP_D
      const originX  = Math.max(0, Math.round((dw / 2 - CROP_R / s - tx / s) * d2i));
      const originY  = Math.max(0, Math.round((dh / 2 - CROP_R / s - ty / s) * d2i));
      const cropSize = Math.min(
        Math.round((CROP_D / s) * d2i),
        Math.min(imgW - originX, imgH - originY),
      );

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ crop: { originX, originY, width: cropSize, height: cropSize } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
      );
      onCrop(result.uri);
    } catch (e) {
      console.error('Crop failed:', e);
    } finally {
      setCropping(false);
    }
  };

  const displaySize = displaySizeRef.current;

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.root}>

        {/* Gesture + image area */}
        <View
          style={styles.gestureArea}
          onLayout={e => {
            setContainerW(e.nativeEvent.layout.width);
            setContainerH(e.nativeEvent.layout.height);
          }}
          {...panResponder.panHandlers}
        >
          {imgSize ? (
            <Animated.Image
              source={{ uri: imageUri }}
              style={{
                width: displaySize.w,
                height: displaySize.h,
                transform: [
                  { scale: scaleAnim },
                  { translateX: txAnim },
                  { translateY: tyAnim },
                ],
              }}
              resizeMode="cover"
            />
          ) : (
            <ActivityIndicator size="large" color="#FFF" />
          )}

          {/* Dark overlay with circular cutout */}
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            <Defs>
              <Mask id="cropHole">
                <Rect width={containerW} height={containerH} fill="white" />
                <SvgCircle cx={containerW / 2} cy={containerH / 2} r={CROP_R} fill="black" />
              </Mask>
            </Defs>
            <Rect width={containerW} height={containerH} fill="rgba(0,0,0,0.65)" mask="url(#cropHole)" />
          </Svg>

          {/* White ring around the crop circle */}
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.ringWrapper]}
          >
            <View style={[styles.ring, { width: CROP_D + 3, height: CROP_D + 3, borderRadius: (CROP_D + 3) / 2 }]} />
          </View>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottom}>
          <Text style={styles.hint}>Drag to position · Pinch to zoom</Text>
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={cropping}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.useBtn, (!imgSize || cropping) && styles.dimmed]}
              onPress={handleCrop}
              disabled={!imgSize || cropping}
            >
              {cropping
                ? <ActivityIndicator color="#FFF" size="small" />
                : <Text style={styles.useText}>Use Photo</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#000' },
  gestureArea: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ringWrapper: { alignItems: 'center', justifyContent: 'center' },
  ring: {
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.85)',
    backgroundColor: 'transparent',
  },
  bottom: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 40,
    backgroundColor: '#111',
  },
  hint: { color: '#999', fontSize: 13, textAlign: 'center', marginBottom: 14 },
  btnRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 15, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#555', alignItems: 'center',
  },
  cancelText: { color: '#CCC', fontSize: 16, fontWeight: '700' },
  useBtn: {
    flex: 2, paddingVertical: 15, borderRadius: 14,
    backgroundColor: '#4CAF50', alignItems: 'center',
  },
  useText:  { color: '#FFF', fontSize: 16, fontWeight: '800' },
  dimmed:   { opacity: 0.45 },
});
