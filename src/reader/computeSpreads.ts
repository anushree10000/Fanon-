import type { LaidOutPage } from './pageLayout';

export type Spread = [LaidOutPage] | [LaidOutPage, LaidOutPage];

// A page whose source is already wider than it is tall is almost always a
// pre-composed two-page spread scanned as one image (a common "outlier"
// in chapter archives). Pairing it with a neighbor would squeeze it to
// quarter-width, so it gets its own pager screen instead.
const LANDSCAPE_OUTLIER_RATIO = 1.15;

function isLandscapeOutlier(page: LaidOutPage): boolean {
  const [w, h] = page.resolution;
  return h > 0 && w / h >= LANDSCAPE_OUTLIER_RATIO;
}

/**
 * Cover-solo pairing: page 1 stands alone, then sequential pairs. This
 * matches how most scanlated/printed comics are actually bound (front
 * cover doesn't share a spread), so left/right pairing lines up with the
 * art's original spread boundaries instead of drifting by one page.
 */
export function computeSpreads(pages: LaidOutPage[]): Spread[] {
  const spreads: Spread[] = [];
  let i = 0;

  if (pages.length > 0) {
    spreads.push([pages[0]]);
    i = 1;
  }

  while (i < pages.length) {
    const current = pages[i];
    if (isLandscapeOutlier(current)) {
      spreads.push([current]);
      i += 1;
      continue;
    }
    const next = pages[i + 1];
    if (next && !isLandscapeOutlier(next)) {
      spreads.push([current, next]);
      i += 2;
    } else {
      spreads.push([current]);
      i += 1;
    }
  }

  return spreads;
}
