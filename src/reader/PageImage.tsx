import React, { memo } from 'react';
import { View } from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import type { LaidOutPage } from './pageLayout';
import { theme } from '../theme/theme';

interface Props {
  page: LaidOutPage;
  /** Priority hint for FastImage's prefetch queue -- current page reads high. */
  priority?: 'low' | 'normal' | 'high';
}

function PageImageInner({ page, priority = 'normal' }: Props) {
  return (
    <View style={{ width: page.displayWidth, height: page.displayHeight, backgroundColor: theme.color.surfaceAlt }}>
      <FastImage
        source={{
          uri: page.pageUrl,
          priority: FastImage.priority[priority],
        }}
        style={{ width: '100%', height: '100%' }}
        resizeMode={FastImage.resizeMode.contain}
        accessible
        accessibilityLabel={page.altText}
      />
    </View>
  );
}

export const PageImage = memo(PageImageInner, (a, b) => a.page.pageUrl === b.page.pageUrl && a.priority === b.priority);
