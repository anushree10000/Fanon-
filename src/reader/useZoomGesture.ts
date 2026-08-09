import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SNAP_BACK_THRESHOLD = 1.05;
const DOUBLE_TAP_SCALE = 2.5;

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

function clampTranslateX(tx: number, scale: number, viewportWidth: number) {
  'worklet';
  // How far the scaled content can shift before its edge would come inward
  // of the viewport edge.
  const maxShift = (viewportWidth * (scale - 1)) / 2;
  return clamp(tx, -maxShift, maxShift);
}

interface Options {
  viewportWidth: number;
  initialScale: number;
  onScaleCommitted: (scale: number) => void;
}

/**
 * Drives pinch-to-zoom + horizontal pan-while-zoomed over whatever content
 * is wrapped in the returned `animatedStyle`. Vertical movement while zoomed
 * is deliberately left to the underlying scroll view (see VerticalReader) --
 * this hook only owns scale and horizontal translate.
 */
export function useZoomGesture({ viewportWidth, initialScale, onScaleCommitted }: Options) {
  const scale = useSharedValue(initialScale);
  const savedScale = useSharedValue(initialScale);
  const translateX = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);

  const commit = (value: number) => onScaleCommitted(value);

  const pinch = Gesture.Pinch()
    .onUpdate(e => {
      const next = clamp(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE);
      scale.value = next;
      // Anchor the zoom roughly around the pinch focal point rather than
      // the view center, so zooming in on the top of a page doesn't yank
      // the viewport to center itself.
      const focalOffsetFromCenter = e.focalX - viewportWidth / 2;
      translateX.value = clampTranslateX(
        savedTranslateX.value + focalOffsetFromCenter * (1 - e.scale),
        next,
        viewportWidth,
      );
    })
    .onEnd(() => {
      if (scale.value <= SNAP_BACK_THRESHOLD) {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        runOnJS(commit)(1);
        return;
      }
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      runOnJS(commit)(scale.value);
    });

  const pan = Gesture.Pan()
    // Only claim gestures that are clearly horizontal; anything mostly
    // vertical is left alone so the list's own scroll responder gets it.
    .activeOffsetX([-10, 10])
    .failOffsetY([-15, 15])
    .onUpdate(e => {
      if (savedScale.value <= 1.001) return; // not zoomed, nothing to pan
      translateX.value = clampTranslateX(
        savedTranslateX.value + e.translationX,
        savedScale.value,
        viewportWidth,
      );
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(250)
    .onEnd(() => {
      const next = savedScale.value > 1.5 ? 1 : DOUBLE_TAP_SCALE;
      scale.value = withTiming(next);
      translateX.value = withTiming(0);
      savedScale.value = next;
      savedTranslateX.value = 0;
      runOnJS(commit)(next);
    });

  // Double-tap is tried first (with its short recognition delay); anything
  // that isn't a double tap falls through to pinch+pan.
  const gesture = Gesture.Exclusive(doubleTap, Gesture.Simultaneous(pinch, pan));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  }));

  return { gesture, animatedStyle, scale, isZoomed: () => savedScale.value > 1.001 };
}

export type ZoomGesture = ReturnType<typeof useZoomGesture>;
