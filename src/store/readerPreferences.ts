import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'fanon-reader-prefs' });

/**
 * MMKV is synchronous (it's a mmap'd C++ store, not a bridge round-trip),
 * which matters here: zustand's persist middleware calls this storage
 * adapter on every state change, and we don't want that hitting an async
 * bridge on the same thread that's driving the pinch gesture.
 */
const zustandMmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.delete(name),
};

interface ReaderPreferencesState {
  /**
   * Last committed pinch-zoom scale, 1 = fit-to-width. This is intentionally
   * the ONLY zoom-related value persisted -- scroll offset and pan
   * translation are position-dependent and reset per chapter on purpose
   * (see architecture write-up, "zoom scale vs. zoom position").
   */
  zoomScale: number;
  setZoomScale: (scale: number) => void;

  spreadMode: boolean;
  setSpreadMode: (on: boolean) => void;
}

export const useReaderPreferences = create<ReaderPreferencesState>()(
  persist(
    set => ({
      zoomScale: 1,
      setZoomScale: scale => set({ zoomScale: scale }),
      spreadMode: false,
      setSpreadMode: on => set({ spreadMode: on }),
    }),
    {
      name: 'reader-preferences',
      storage: createJSONStorage(() => zustandMmkvStorage),
      // Only persist what's meant to survive a kill; spreadMode is derived
      // from device orientation on relaunch so we don't fight the user's
      // current physical rotation with a stale stored value.
      partialize: state => ({ zoomScale: state.zoomScale }),
    },
  ),
);
