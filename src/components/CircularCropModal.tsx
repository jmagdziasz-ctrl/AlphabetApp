import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  PanResponder, Animated, Image, ActivityIndicator,
  Dimensions, StatusBar,
} from 'react-native';
import { Svg, Defs, Mask, Rect, Circle as SvgCircle } from 'react-native-svg';
import * as ImageManipulator from 'expo-image-manipulator';

const { width: SW, height: SH } = Dimensions.get('window');
const CROP_D = Math.min(SW, SH) * 0.80; // crop circle diameter
const CROP_R = CROP_D / 2;

interface Props {
  visible: boolean;
  imageUri: string;
  onCrop: (uri: string) => void;
  onCancel: () => void;
}

function touchDist(
  a: { pageX: number; pageY: number },
  b: { pageX: number; pageY: number },
) {
  return Math.hypot(b.pageX - a.pageX, b.pageY - a.pageY);
}

export function CircularCropModal({ visible, imageUri, onCrop, onCancel }: Props) {
  const [imgSize, setImgSize]       = useState<{ w: number; h: number } | null>(null);
  const [containerW, setContainerW] = useState(SW);
  const [containerH, setContainerH] = useState(SH * 0.78);
  const [cropping, setCropping]     = useState(false);

  // ── Animated transform values ─────────────────────────────────────────────
  // IMPORTANT: correct RN transform order is [translateX, translateY, scale].
  // With this order, tx/ty are always in screen pixels regardless of scale,
  // and the scale is applied around the element's original (flex-centered) position.
  const txAnim    = useRef(new Animated.Value(0)).current;
  const tyAnim    = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // ── Mutable refs (read inside PanResponder without stale-closure issues) ──
  const scaleRef     = useRef(1);
  const txRef        = useRef(0);
  const tyRef        = useRef(0);
  const containerRef = useRef({ w: SW, h: SH * 0.78 });

  // Display element dimensions: shorter side === CROP_D at scale 1.
  // useMemo ensures the rendered size is always in sync with imgSize state.
  const displaySize = useMemo(() => {
    if (!imgSize) return null;
    const ratio = CROP_D / Math.min(imgSize.w, imgSize.h);
    return { w: imgSize.w * ratio, h: imgSize.h * ratio };
  }, [imgSize]);

  // Keep a ref copy for PanResponder callbacks (which close over the initial value).
  const displaySizeRef = useRef<{ w: number; h: number } | null>(null);
  useEffect(() => {
    displaySizeRef.current = displaySize;
  }, [displaySize]);

  // ── Reset & load image on open ────────────────────────────────────────────
  useEffect(() => {
    if (!visible || !imageUri) return;
    setImgSize(null);
    displaySizeRef.current = null;
    scaleRef.current = 1; txRef.current = 0; tyRef.current = 0;
    scaleAnim.setValue(1); txAnim.setValue(0); tyAnim.setValue(0);

    Image.getSize(imageUri, (w, h) => {
      // Update ref immediately (before the state-driven re-render) so that any
      // gesture that fires right after loading uses the correct dimensions.
      const ratio = CROP_D / Math.min(w, h);
      displaySizeRef.current = { w: w * ratio, h: h * ratio };
      setImgSize({ w, h });
    });
  }, [visible, imageUri]);

  // ── Clamp translate so the crop circle is always covered by the image ─────
  // With [translateX, translateY, scale] transform order:
  //   image left edge  = containerCx + tx - s * displayW / 2
  //   image right edge = containerCx + tx + s * displayW / 2
  // For the image to cover the circle: |tx| ≤ s * displayW/2 − CROP_R
  const clampTranslate = (tx: number, ty: number, s: number) => {
    const ds = displaySizeRef.current;
    if (!ds) return { x: 0, y: 0 };
    const maxX = Math.max(0, s * ds.w / 2 - CROP_R);
    const maxY = Math.max(0, s * ds.h / 2 - CROP_R);
    return {
      x: Math.max(-maxX, Math.min(maxX, tx)),
      y: Math.max(-maxY, Math.min(maxY, ty)),
    };
  };

  // ── Gesture state ─────────────────────────────────────────────────────────
  const pinch = useRef({
    on: false,
    d0: 0,          // initial finger distance
    s0: 1,          // scale at pinch start
    tx0: 0,         // translate at pinch start
    ty0: 0,
    // focal point on the image (in display-element coords from center)
    // — the image point under the pinch midpoint stays fixed as scale changes
    focalX: 0,
    focalY: 0,
  });
  const pan = useRef({ on: false, px0: 0, py0: 0, tx0: 0, ty0: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,

      onPanResponderGrant: (evt) => {
        const ts = evt.nativeEvent.touches;
        if (ts.length >= 2) {
          const midX = (ts[0].pageX + ts[1].pageX) / 2;
          const midY = (ts[0].pageY + ts[1].pageY) / 2;
          const cx   = containerRef.current.w / 2;
          const cy   = containerRef.current.h / 2;
          const s0   = scaleRef.current;
          // focal = where under the midpoint is in image-element local coords
          const focalX = (midX - cx - txRef.current) / s0;
          const focalY = (midY - cy - tyRef.current) / s0;
          pinch.current = {
            on: true,
            d0: touchDist(ts[0], ts[1]),
            s0,
            tx0: txRef.current,
            ty0: tyRef.current,
            focalX,
            focalY,
          };
          pan.current.on = false;
        } else {
          pan.current = {
            on: true,
            px0: ts[0].pageX,
            py0: ts[0].pageY,
            tx0: txRef.current,
            ty0: tyRef.current,
          };
          pinch.current.on = false;
        }
      },

      onPanResponderMove: (evt) => {
        const ts = evt.nativeEvent.touches;

        if (ts.length >= 2) {
          // Re-initialise pinch if fingers were added mid-gesture
          if (!pinch.current.on) {
            const midX   = (ts[0].pageX + ts[1].pageX) / 2;
            const midY   = (ts[0].pageY + ts[1].pageY) / 2;
            const cx     = containerRef.current.w / 2;
            const cy     = containerRef.current.h / 2;
            const s0     = scaleRef.current;
            pinch.current = {
              on: true,
              d0: touchDist(ts[0], ts[1]),
              s0,
              tx0: txRef.current,
              ty0: tyRef.current,
              focalX: (midX - cx - txRef.current) / s0,
              focalY: (midY - cy - tyRef.current) / s0,
            };
            pan.current.on = false;
            return;
          }

          const newS = Math.max(1, Math.min(8,
            pinch.current.s0 * touchDist(ts[0], ts[1]) / pinch.current.d0,
          ));

          // Keep the focal point under the current pinch midpoint
          const cx    = containerRef.current.w / 2;
          const cy    = containerRef.current.h / 2;
          const midX  = (ts[0].pageX + ts[1].pageX) / 2;
          const midY  = (ts[0].pageY + ts[1].pageY) / 2;
          const rawTx = midX - cx - pinch.current.focalX * newS;
          const rawTy = midY - cy - pinch.current.focalY * newS;

          const { x, y } = clampTranslate(rawTx, rawTy, newS);
          scaleRef.current = newS;
          txRef.current    = x;
          tyRef.current    = y;
          scaleAnim.setValue(newS);
          txAnim.setValue(x);
          tyAnim.setValue(y);

        } else if (ts.length === 1) {
          if (pinch.current.on) {
            // One finger lifted — switch cleanly to pan
            pinch.current.on = false;
            pan.current = {
              on: true,
              px0: ts[0].pageX,
              py0: ts[0].pageY,
              tx0: txRef.current,
              ty0: tyRef.current,
            };
            return;
          }
          if (!pan.current.on) return;
          const { x, y } = clampTranslate(
            pan.current.tx0 + (ts[0].pageX - pan.current.px0),
            pan.current.ty0 + (ts[0].pageY - pan.current.py0),
            scaleRef.current,
          );
          txRef.current = x;
          tyRef.current = y;
          txAnim.setValue(x);
          tyAnim.setValue(y);
        }
      },

      onPanResponderRelease:   () => { pinch.current.on = false; pan.current.on = false; },
      onPanResponderTerminate: () => { pinch.current.on = false; pan.current.on = false; },
    })
  ).current;

  // ── Crop ──────────────────────────────────────────────────────────────────
  // With the [translateX, translateY, scale] transform, the image center in
  // screen coords is (containerCx + tx, containerCy + ty).  Scale is applied
  // around the element's original (flex-centered) position.
  //
  // Image visual left edge  = cx + tx − s·displayW/2
  // Crop circle left edge   = cx − CROP_R
  // Offset of crop TL from image TL (screen):  s·displayW/2 − CROP_R − tx
  // In display-element pixels (÷ s):            displayW/2 − CROP_R/s − tx/s
  // In original image pixels (× imgW/displayW): (displayW/2 − CROP_R/s − tx/s) × d2i
  const handleCrop = async () => {
    if (!imgSize || !displaySize) return;
    setCropping(true);
    try {
      const s   = scaleRef.current;
      const tx  = txRef.current;
      const ty  = tyRef.current;
      const { w: imgW, h: imgH } = imgSize;
      const { w: dw, h: dh }    = displaySize;

      // d2i = min(imgW, imgH) / CROP_D (same ratio for both axes)
      const d2i     = imgW / dw;
      const originX = Math.max(0, Math.round((dw / 2 - CROP_R / s - tx / s) * d2i));
      const originY = Math.max(0, Math.round((dh / 2 - CROP_R / s - ty / s) * d2i));
      const cropSz  = Math.min(
        Math.round((CROP_D / s) * d2i),
        Math.min(imgW - originX, imgH - originY),
      );

      if (cropSz <= 0) return;

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ crop: { originX, originY, width: cropSz, height: cropSz } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
      );
      onCrop(result.uri);
    } catch (e) {
      console.error('Crop failed:', e);
    } finally {
      setCropping(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.root}>

        {/* Gesture + image area */}
        <View
          style={styles.gestureArea}
          onLayout={e => {
            const { width, height } = e.nativeEvent.layout;
            setContainerW(width);
            setContainerH(height);
            containerRef.current = { w: width, h: height };
          }}
          {...panResponder.panHandlers}
        >
          {displaySize ? (
            <Animated.Image
              source={{ uri: imageUri }}
              style={{
                width:  displaySize.w,
                height: displaySize.h,
                // CORRECT order: translate first (in screen px), then scale
                // around the element's original flex-centered position.
                transform: [
                  { translateX: txAnim },
                  { translateY: tyAnim },
                  { scale: scaleAnim },
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
            <Rect
              width={containerW}
              height={containerH}
              fill="rgba(0,0,0,0.65)"
              mask="url(#cropHole)"
            />
          </Svg>

          {/* White ring around the crop circle */}
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.ringWrapper]}
          >
            <View
              style={[
                styles.ring,
                { width: CROP_D + 3, height: CROP_D + 3, borderRadius: (CROP_D + 3) / 2 },
              ]}
            />
          </View>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottom}>
          <Text style={styles.hint}>Drag to position · Pinch to zoom</Text>
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              disabled={cropping}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.useBtn, (!displaySize || cropping) && styles.dimmed]}
              onPress={handleCrop}
              disabled={!displaySize || cropping}
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
  hint:      { color: '#999', fontSize: 13, textAlign: 'center', marginBottom: 14 },
  btnRow:    { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 15, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#555', alignItems: 'center',
  },
  cancelText: { color: '#CCC', fontSize: 16, fontWeight: '700' },
  useBtn: {
    flex: 2, paddingVertical: 15, borderRadius: 14,
    backgroundColor: '#4CAF50', alignItems: 'center',
  },
  useText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  dimmed:  { opacity: 0.45 },
});
