import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import PagerView from 'react-native-pager-view';
import type { LaidOutPage } from './pageLayout';
import { computeSpreads, type Spread } from './computeSpreads';
import { PageImage } from './PageImage';
import { theme } from '../theme/theme';

interface Props {
  pages: LaidOutPage[];
  initialSpreadIndex?: number;
  onSpreadIndexChange?: (index: number) => void;
}

function SpreadPage({ page, boxWidth, boxHeight }: { page: LaidOutPage; boxWidth: number; boxHeight: number }) {
  // Re-fit this page's own aspect ratio into its half of the screen --
  // PageImage's displayWidth/Height were computed for full-width vertical
  // reading, so we override the box here rather than re-running layoutPages.
  const [w, h] = page.resolution;
  const scale = Math.min(boxWidth / w, boxHeight / h);
  const fitted = { ...page, displayWidth: w * scale, displayHeight: h * scale };
  return (
    <View style={{ width: boxWidth, height: boxHeight, alignItems: 'center', justifyContent: 'center' }}>
      <PageImage page={fitted} priority="high" />
    </View>
  );
}

function SpreadView({ spread, viewportWidth, viewportHeight }: { spread: Spread; viewportWidth: number; viewportHeight: number }) {
  const boxWidth = spread.length === 2 ? viewportWidth / 2 : viewportWidth;
  return (
    <View style={styles.spreadRow}>
      {spread.map(page => (
        <SpreadPage key={page.pageNum} page={page} boxWidth={boxWidth} boxHeight={viewportHeight} />
      ))}
    </View>
  );
}

export function SpreadReader({ pages, initialSpreadIndex = 0, onSpreadIndexChange }: Props) {
  const { width, height } = useWindowDimensions();
  const pagerRef = useRef<PagerView>(null);
  const [currentIndex, setCurrentIndex] = useState(initialSpreadIndex);

  const spreads = useMemo(() => computeSpreads(pages), [pages]);

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(spreads.length - 1, index));
      pagerRef.current?.setPage(clamped);
    },
    [spreads.length],
  );

  const handlePageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      const idx = e.nativeEvent.position;
      setCurrentIndex(idx);
      onSpreadIndexChange?.(idx);
    },
    [onSpreadIndexChange],
  );

  return (
    <View style={styles.fill}>
      <PagerView
        ref={pagerRef}
        style={styles.fill}
        initialPage={initialSpreadIndex}
        onPageSelected={handlePageSelected}>
        {spreads.map(spread => (
          <View key={spread[0].pageNum} style={styles.fill}>
            <SpreadView spread={spread} viewportWidth={width} viewportHeight={height} />
          </View>
        ))}
      </PagerView>

      {/* Edge tap zones layered above the pager; the large open middle
          keeps the pager's own swipe gesture the primary navigation. */}
      <Pressable
        style={[styles.edgeZone, styles.leftEdge]}
        onPress={() => goTo(currentIndex - 1)}
        hitSlop={0}
      />
      <Pressable
        style={[styles.edgeZone, styles.rightEdge]}
        onPress={() => goTo(currentIndex + 1)}
        hitSlop={0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: theme.color.bg },
  spreadRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  edgeZone: { position: 'absolute', top: 0, bottom: 0, width: '15%' },
  leftEdge: { left: 0 },
  rightEdge: { right: 0 },
});
