import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { api } from '../api/client';
import { usePaginatedList } from '../api/usePaginatedList';
import type { StorySummary } from '../api/types';
import { StoryCard } from '../components/StoryCard';
import { theme } from '../theme/theme';
import type { StoryFeedProps } from '../navigation/types';

const COLUMNS = 2;
const GUTTER = theme.space(4);

export function StoryFeedScreen({ navigation }: StoryFeedProps) {
  const { width } = useWindowDimensions();
  const cardWidth = (width - GUTTER * (COLUMNS + 1)) / COLUMNS;

  const fetchPage = useCallback(
    (cursor: string | null, signal: AbortSignal) => api.listStories({ cursor, limit: 20 }, signal),
    [],
  );

  const { items, loadingInitial, loadingMore, refreshing, error, hasMore, loadMore, refresh } =
    usePaginatedList<StorySummary>({ fetchPage });

  const openStory = useCallback(
    (story: StorySummary) => {
      navigation.navigate('ChapterList', { storyId: story.storyId, storyTitle: story.title });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: StorySummary }) => (
      <StoryCard story={item} width={cardWidth} onPress={openStory} />
    ),
    [cardWidth, openStory],
  );

  const footer = useMemo(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={theme.color.accent} />
      </View>
    );
  }, [loadingMore]);

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
        <Text style={styles.errorTitle}>Couldn't load stories</Text>
        <Text style={styles.errorBody}>{error.message}</Text>
        <Text style={styles.retry} onPress={refresh}>
          Tap to retry
        </Text>
      </View>
    );
  }

  return (
    <FlashList
      data={items}
      renderItem={renderItem}
      keyExtractor={item => item.storyId}
      numColumns={COLUMNS}
      estimatedItemSize={cardWidth * 1.4 + 48}
      contentContainerStyle={{ padding: GUTTER }}
      onEndReachedThreshold={0.6}
      onEndReached={hasMore ? loadMore : undefined}
      ListFooterComponent={footer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.color.accent} />
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
    padding: theme.space(6),
  },
  footer: {
    paddingVertical: theme.space(6),
  },
  errorTitle: {
    color: theme.color.text,
    fontSize: theme.font.title,
    fontWeight: '700',
    marginBottom: theme.space(2),
  },
  errorBody: {
    color: theme.color.textMuted,
    fontSize: theme.font.body,
    textAlign: 'center',
    marginBottom: theme.space(4),
  },
  retry: {
    color: theme.color.accent,
    fontSize: theme.font.body,
    fontWeight: '600',
  },
});
