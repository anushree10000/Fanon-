import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from './types';

interface Page<T> {
  page: T[];
  hasMore: boolean;
  continueCursor: string | null;
}

interface Options<T> {
  fetchPage: (cursor: string | null, signal: AbortSignal) => Promise<Page<T>>;
  /** Bump to force a full reset + refetch (e.g. pull-to-refresh, story change). */
  resetKey?: string | number;
}

interface State<T> {
  items: T[];
  loadingInitial: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: ApiError | Error | null;
  hasMore: boolean;
}

/**
 * Cursor-based infinite list state, deliberately not react-query: the two
 * lists in this app (stories, chapters) don't need cross-screen cache
 * sharing or background refetch, and pulling in a whole query-cache library
 * for two lists felt like the wrong trade for app size / review surface.
 * If this app grew a third or fourth paginated list, or needed to share
 * loaded data across screens, that calculus flips -- see write-up.
 */
export function usePaginatedList<T>({ fetchPage, resetKey }: Options<T>) {
  const [state, setState] = useState<State<T>>({
    items: [],
    loadingInitial: true,
    loadingMore: false,
    refreshing: false,
    error: null,
    hasMore: true,
  });

  const cursorRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inFlight = useRef(false);

  const load = useCallback(
    async (mode: 'initial' | 'more' | 'refresh') => {
      if (inFlight.current) return;
      inFlight.current = true;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState(s => ({
        ...s,
        loadingInitial: mode === 'initial',
        loadingMore: mode === 'more',
        refreshing: mode === 'refresh',
        error: null,
      }));

      try {
        const cursor = mode === 'more' ? cursorRef.current : null;
        const result = await fetchPage(cursor, controller.signal);
        cursorRef.current = result.continueCursor;
        setState(s => ({
          items: mode === 'more' ? [...s.items, ...result.page] : result.page,
          loadingInitial: false,
          loadingMore: false,
          refreshing: false,
          error: null,
          hasMore: result.hasMore,
        }));
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setState(s => ({
          ...s,
          loadingInitial: false,
          loadingMore: false,
          refreshing: false,
          error: err as Error,
        }));
      } finally {
        inFlight.current = false;
      }
    },
    [fetchPage],
  );

  useEffect(() => {
    cursorRef.current = null;
    load('initial');
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const loadMore = useCallback(() => {
    if (!state.hasMore || state.loadingMore || state.loadingInitial) return;
    load('more');
  }, [state.hasMore, state.loadingMore, state.loadingInitial, load]);

  const refresh = useCallback(() => {
    cursorRef.current = null;
    load('refresh');
  }, [load]);

  return { ...state, loadMore, refresh };
}
