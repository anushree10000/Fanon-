import type { Page } from '../api/types';

/**
 * A page whose display height/width are pre-computed from its declared
 * `resolution`. Doing this once, up front, from metadata is the whole reason
 * the vertical reader doesn't jank on scroll -- FlashList gets exact sizes
 * before it ever requests an image, for both chapter type A (heights happen
 * to be equal) and type B (heights vary per page). No on-device measuring,
 * no layout jump when an image finishes decoding.
 */
export interface LaidOutPage extends Page {
  displayWidth: number;
  displayHeight: number;
}

// A page whose aspect ratio implies a height many multiples of the screen
// width (e.g. a mis-tagged resolution, or a genuinely huge scan near the
// 6000px source cap) is clamped so one page can't dominate the whole list's
// virtualization window. Cropped visually top-aligned; see write-up.
const MAX_HEIGHT_MULTIPLIER = 3;

export function layoutPages(pages: Page[], screenWidth: number): LaidOutPage[] {
  return pages.map(p => {
    const [w, h] = p.resolution;
    const safeW = w > 0 ? w : 1;
    const rawHeight = screenWidth * (h / safeW);
    const displayHeight = Math.min(rawHeight, screenWidth * MAX_HEIGHT_MULTIPLIER);
    return { ...p, displayWidth: screenWidth, displayHeight };
  });
}
