import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api/client';
import type { ChapterDetail, ApiError } from '../api/types';
import { layoutPages } from '../reader/pageLayout';
import { VerticalReader } from '../reader/VerticalReader';
import { SpreadReader } from '../reader/SpreadReader';
import { useOrientation } from '../utils/useOrientation';
import { useReaderPreferences } from '../store/readerPreferences';
import { theme } from '../theme/theme';
import type { ReaderProps } from '../navigation/types';

export function ReaderScreen({ route, navigation }: ReaderProps) {
  const { chapterId } = route.params;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const orientation = useOrientation();

  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [error, setError] = useState<ApiError | Error | null>(null);

  // Manual toggle only has effect in portrait; landscape always forces
  // spread mode per "on rotating the screen, this should toggle
  // automatically" -- rotation is the source of truth once it happens.
  const [manualSpread, setManualSpread] = useState(false);
  const spreadMode = orientation === 'landscape' || manualSpread;
  const setSpreadModePref = useReaderPreferences(s => s.setSpreadMode);

  useEffect(() => {
    setSpreadModePref(spreadMode);
  }, [spreadMode, setSpreadModePref]);

  useEffect(() => {
    const controller = new AbortController();
    api
      .getChapter(chapterId, controller.signal)
      .then(setChapter)
      .catch(err => {
        if ((err as Error).name !== 'AbortError') setError(err as Error);
      });
    return () => controller.abort();
  }, [chapterId]);

  const laidOutPages = useMemo(
    () => (chapter ? layoutPages(chapter.chapterPages, width) : []),
    [chapter, width],
  );

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Couldn't load this chapter.</Text>
        <Text style={styles.retry} onPress={() => navigation.goBack()}>
          Go back
        </Text>
      </View>
    );
  }

  if (!chapter) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.color.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      {spreadMode ? (
        <SpreadReader pages={laidOutPages} />
      ) : (
        <VerticalReader pages={laidOutPages} />
      )}

      <View style={[styles.topBar, { paddingTop: insets.top + theme.space(2) }]} pointerEvents="box-none">
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={12}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.chapterLabel}>Ch. {chapter.chapterNum}</Text>
        {orientation === 'portrait' && (
          <Pressable onPress={() => setManualSpread(m => !m)} style={styles.spreadToggle} hitSlop={12}>
            <Text style={styles.spreadToggleText}>{manualSpread ? '1 pg' : '2 pg'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: theme.color.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.bg,
    padding: theme.space(6),
  },
  errorText: { color: theme.color.text, marginBottom: theme.space(3) },
  retry: { color: theme.color.accent, fontWeight: '600' },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.space(3),
    paddingBottom: theme.space(2),
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: theme.color.text, fontSize: 24, lineHeight: 26 },
  chapterLabel: {
    color: theme.color.text,
    marginLeft: theme.space(3),
    fontSize: theme.font.body,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: theme.space(3),
    paddingVertical: theme.space(1),
    borderRadius: theme.radius.sm,
  },
  spreadToggle: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: theme.space(3),
    paddingVertical: theme.space(2),
    borderRadius: theme.radius.sm,
  },
  spreadToggleText: { color: theme.color.text, fontWeight: '600', fontSize: theme.font.caption },
});
