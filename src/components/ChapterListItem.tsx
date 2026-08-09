import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import type { ChapterSummary } from '../api/types';
import { theme } from '../theme/theme';

interface Props {
  chapter: ChapterSummary;
  onPress: (chapter: ChapterSummary) => void;
}

function ChapterListItemInner({ chapter, onPress }: Props) {
  return (
    <Pressable
      onPress={() => onPress(chapter)}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.8 : 1 }]}>
      <FastImage source={{ uri: chapter.thumbnailUrl }} style={styles.thumb} resizeMode={FastImage.resizeMode.cover} />
      <View style={styles.info}>
        <Text style={styles.title}>Chapter {chapter.chapterNum}</Text>
        <Text numberOfLines={2} style={styles.description}>
          {chapter.description}
        </Text>
        <Text style={styles.meta}>
          {chapter.pageCount} pages · {chapter.views} views · Type {chapter.type}
        </Text>
      </View>
    </Pressable>
  );
}

export const ChapterListItem = memo(ChapterListItemInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    padding: theme.space(3),
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surface,
    marginBottom: theme.space(2),
  },
  thumb: {
    width: 64,
    height: 88,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.color.surfaceAlt,
  },
  info: {
    flex: 1,
    marginLeft: theme.space(3),
    justifyContent: 'center',
  },
  title: {
    color: theme.color.text,
    fontSize: theme.font.body,
    fontWeight: '700',
  },
  description: {
    color: theme.color.textMuted,
    fontSize: theme.font.caption,
    marginTop: theme.space(1),
  },
  meta: {
    color: theme.color.textMuted,
    fontSize: theme.font.caption,
    marginTop: theme.space(2),
  },
});
