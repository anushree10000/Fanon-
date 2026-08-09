import React, { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { api } from '../api/client';
import { usePaginatedList } from '../api/usePaginatedList';
import type { ChapterSummary } from '../api/types';
import { ChapterListItem } from '../components/ChapterListItem';
import { theme } from '../theme/theme';
import type { ChapterListProps } from '../navigation/types';

export function ChapterListScreen({ route, navigation }: ChapterListProps) {
  const { storyId } = route.params;

  const fetchPage = useCallback(
    (cursor: string | null, signal: AbortSignal) =>
      api.listChapters(storyId, { cursor, limit: 30 }, signal),
    [storyId],
  );

  const { items, loadingInitial, loadingMore, error, hasMore, loadMore, refresh } =
    usePaginatedList<ChapterSummary>({ fetchPage, resetKey: storyId });

  const openChapter = useCallback(
    (chapter: ChapterSummary) => {
      navigation.navigate('Reader', {
        chapterId: chapter.chapterId,
        storyId,
        chapterNum: chapter.chapterNum,
      });
    },
    [navigation, storyId],
  );

  if (loadingInitial) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.color.accent} size="large" />
      </View>
    );
  }

  if (error && items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Couldn't load chapters</Text>
        <Text style={styles.retry} onPress={refresh}>
          Tap to retry
        </Text>
      </View>
    );
  }

  return (
    <FlashList
      data={items}
      renderItem={({ item }) => <ChapterListItem chapter={item} onPress={openChapter} />}
      keyExtractor={item => item.chapterId}
      estimatedItemSize={104}
      contentContainerStyle={{ padding: theme.space(4) }}
      onEndReachedThreshold={0.6}
      onEndReached={hasMore ? loadMore : undefined}
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.footer}>
            <ActivityIndicator color={theme.color.accent} />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.bg,
  },
  footer: { paddingVertical: theme.space(6) },
  errorTitle: { color: theme.color.text, fontSize: theme.font.title, marginBottom: theme.space(3) },
  retry: { color: theme.color.accent, fontWeight: '600' },
});
