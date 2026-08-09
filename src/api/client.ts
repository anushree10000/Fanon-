import { Platform } from 'react-native';
import { ApiError, type ErrorResponse } from './types';

/**
 * The backend only ever runs on localhost:3001 on the dev machine.
 * - iOS simulator shares the Mac's network namespace, so `localhost` works.
 * - Android emulator maps the *host* machine to 10.0.2.2, not localhost.
 * - A physical device needs the dev machine's LAN IP -- there's no way to
 *   discover that automatically, so it's the one thing you set by hand.
 *
 * Override at runtime without a rebuild: metro reads EXPO_-free env is not
 * available here (bare RN), so we fall back to a single constant a physical
 * device run needs to edit. Simulator/emulator need no changes.
 */
const PHYSICAL_DEVICE_HOST = '192.168.1.100'; // <-- set to `ipconfig getifaddr en0` / `ifconfig` output when testing on a phone

function resolveBaseUrl(): string {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      // Emulator vs physical device can't be told apart at runtime reliably;
      // Genymotion/emulator convention is 10.0.2.2. Flip PHYSICAL_DEVICE_HOST
      // above and swap this to it when running on hardware.
      return 'http://10.0.2.2:3001';
    }
    return 'http://localhost:3001';
  }
  return `http://${PHYSICAL_DEVICE_HOST}:3001`;
}

export const API_BASE_URL = resolveBaseUrl();

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { signal });

  if (!res.ok) {
    let body: ErrorResponse | undefined;
    try {
      body = await res.json();
    } catch {
      // body wasn't JSON (e.g. a proxy 502) -- fall through to generic error
    }
    if (body?.error) {
      throw new ApiError(res.status, body.error);
    }
    throw new ApiError(res.status, {
      code: 'INTERNAL',
      message: `Request to ${path} failed with status ${res.status}`,
    });
  }

  return res.json() as Promise<T>;
}

export const api = {
  listStories: (params: { cursor?: string | null; limit?: number } = {}, signal?: AbortSignal) => {
    const qs = new URLSearchParams();
    if (params.cursor) qs.set('cursor', params.cursor);
    qs.set('limit', String(params.limit ?? 20));
    return request<import('./types').StoryList>(`/stories?${qs}`, signal);
  },

  getStory: (storyId: string, signal?: AbortSignal) =>
    request<import('./types').StoryDetail>(`/stories/${encodeURIComponent(storyId)}`, signal),

  listChapters: (
    storyId: string,
    params: { cursor?: string | null; limit?: number } = {},
    signal?: AbortSignal,
  ) => {
    const qs = new URLSearchParams();
    qs.set('story', storyId);
    if (params.cursor) qs.set('cursor', params.cursor);
    qs.set('limit', String(params.limit ?? 30));
    return request<import('./types').ChapterList>(`/chapters?${qs}`, signal);
  },

  getChapter: (chapterId: string, signal?: AbortSignal) =>
    request<import('./types').ChapterDetail>(`/chapters/${encodeURIComponent(chapterId)}`, signal),
};
