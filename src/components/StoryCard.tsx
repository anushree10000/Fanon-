import React, { memo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import type { StorySummary } from '../api/types';
import { theme } from '../theme/theme';

interface Props {
  story: StorySummary;
  width: number;
  onPress: (story: StorySummary) => void;
}

function StoryCardInner({ story, width, onPress }: Props) {
  const height = width * 1.4; // fixed cover aspect ratio, keeps the grid rhythm predictable

  return (
    <Pressable
      onPress={() => onPress(story)}
      style={({ pressed }) => [styles.card, { width, opacity: pressed ? 0.85 : 1 }]}>
      <FastImage
        source={{ uri: story.thumbnailUrl, priority: FastImage.priority.normal }}
        style={{ width, height, borderRadius: theme.radius.md }}
        resizeMode={FastImage.resizeMode.cover}
      />
      <Text numberOfLines={2} style={styles.title}>
        {story.title}
      </Text>
      <Text numberOfLines={1} style={styles.meta}>
        {story.creators.join(', ')} · {story.views} views
      </Text>
    </Pressable>
  );
}

export const StoryCard = memo(StoryCardInner);

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.space(4),
  },
  title: {
    color: theme.color.text,
    fontSize: theme.font.body,
    fontWeight: '600',
    marginTop: theme.space(2),
  },
  meta: {
    color: theme.color.textMuted,
    fontSize: theme.font.caption,
    marginTop: theme.space(1),
  },
});
