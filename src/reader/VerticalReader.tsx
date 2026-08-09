import React, { useCallback, useRef } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { AnimatedFlashList, type FlashList } from '@shopify/flash-list';
import { GestureDetector } from 'react-native-gesture-handler';
import type { LaidOutPage } from './pageLayout';
import { PageImage } from './PageImage';
import { useZoomGesture } from './useZoomGesture';
import { useReaderPreferences } from '../store/readerPreferences';
import { theme } from '../theme/theme';

interface Props {
  pages: LaidOutPage[];
  /** Restores scroll position when returning from a rotation-triggered remount. */
  initialScrollIndex?: number;
}

export function VerticalReader({ pages, initialScrollIndex }: Props) {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlashList<LaidOutPage>>(null);
  const zoomScale = useReaderPreferences(s => s.zoomScale);
  const setZoomScale = useReaderPreferences(s => s.setZoomScale);

  const { gesture, animatedStyle } = useZoomGesture({
    viewportWidth: width,
    initialScale: zoomScale,
    onScaleCommitted: setZoomScale,
  });

  const renderItem = useCallback(
    ({ item }: { item: LaidOutPage }) => <PageImage page={item} priority="normal" />,
    [],
  );

  const overrideItemLayout = useCallback(
    (layout: { size?: number }, item: LaidOutPage) => {
      layout.size = item.displayHeight;
    },
    [],
  );

  return (
    <View style={styles.viewport}>
      <GestureDetector gesture={gesture}>
        <AnimatedFlashList
          ref={listRef}
          data={pages}
          renderItem={renderItem}
          keyExtractor={item => String(item.pageNum)}
          estimatedItemSize={width * 1.4}
          overrideItemLayout={overrideItemLayout}
          initialScrollIndex={initialScrollIndex}
          showsVerticalScrollIndicator={false}
          style={animatedStyle}
          // Generous windows: comic pages are tall, and we'd rather hold a
          // couple extra decoded bitmaps in memory than reveal a blank
          // recycled cell mid-zoom-scroll.
          drawDistance={width * 3}
        />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: theme.color.bg,
  },
});
