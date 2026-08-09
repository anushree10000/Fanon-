# Fanon Comics — Mobile Application Engineering Assignment

Bare React Native CLI (0.86.2, New Architecture on by default), TypeScript. No Expo.

## Running it

```bash
npm install
cd ios && pod install && cd ..     # macOS only, needed once and after native dep changes
npx react-native run-ios           # or run-android
```

The backend (`app-assignment-companion`) needs to be up separately via `docker compose up`. Point the app at it in `src/api/client.ts`:

- **iOS simulator**: works out of the box (`localhost:3001`, shares the Mac's network).
- **Android emulator**: works out of the box (`10.0.2.2:3001`, the emulator's alias for the host).
- **Physical device**: edit `PHYSICAL_DEVICE_HOST` in `src/api/client.ts` to your dev machine's LAN IP (`ipconfig getifaddr en0` on Mac), since a phone on wifi can't resolve `localhost` to your laptop.

## Architecture (≈500 words)

Three screens, one navigation stack (`@react-navigation/native-stack`): `StoryFeed` → `ChapterList` → `Reader`.

**Data layer.** `src/api/types.ts` mirrors the provided OpenAPI schema field-for-field on purpose, so a diff against the contract stays trivial. `usePaginatedList` is a small hand-rolled cursor-pagination hook shared by both list screens, backed by `AbortController` so a fast back-navigation or a second story tap cancels the stale request instead of racing it into state.

**Reader layout.** The reader's core idea: `Page.resolution` in the API response gives exact `[width, height]` for every page, so `layoutPages()` converts that into an exact on-screen height *before* any image has loaded, for both chapter type A (heights happen to be equal) and type B (heights vary). `FlashList`'s `overrideItemLayout` is fed this exact height, so the recycler never guesses, never reflows when an image finishes decoding, and can recycle cells correctly however tall the content is. This is the single decision that gets rid of most scroll jank and loading-latency complaints in comic readers — most of the jank in naive implementations comes from measuring images after the fact.

**Zoom.** `useZoomGesture` composes a `Pinch` and a `Pan` gesture (react-native-gesture-handler) into one `transform: [{translateX}, {scale}]` applied to the *entire* `FlashList` container, not per-page. Because the transform wraps the whole scrollable list rather than individual cells, zooming page 1 is inherently the same operation as zooming pages 2 and 3 — there's only one scale value for the whole reading surface, which is what makes "zoom carries forward as you scroll" fall out for free rather than needing to be explicitly synchronized across cells. Vertical movement while zoomed is deliberately left to `FlashList`'s own native scroll (the pan gesture only claims clearly-horizontal drags via `failOffsetY`), so recycling stays intact and I'm not reimplementing scroll physics. Only the committed `scale` — not scroll position or pan translation — is persisted, via `zustand` + `react-native-mmkv` (synchronous, so it can write on gesture-end without touching the async bridge mid-interaction). That's what survives chapter change and app kill.

**Spread mode.** `computeSpreads` pairs pages cover-solo-then-sequential (page 1 alone, then `[2,3], [4,5]…`), and pulls out any page whose source aspect ratio is already landscape (a pre-scanned two-page spread) into its own pager screen rather than squeezing it to quarter-width. `react-native-pager-view` handles the horizontal swipe; two invisible edge-tap zones handle tap-navigation. Auto-toggle is driven by `Dimensions.addEventListener('change', …)` rather than a device-orientation-lock library — no extra native permissions, and it fires on the same signal RN itself uses for layout, so it can't disagree with what's actually on screen.

**What's not here:** no query cache library, no code-splitting, no offline chapter downloads. For a 3-screen app they'd add surface area without adding much — see the decisions section below for where I'd add react-query if this grew.

## Edge cases handled

- Chapter type A (constant height) and B (variable height) both laid out from `resolution` metadata alone — no on-device image measurement, no post-load reflow.
- Landscape-oriented "outlier" pages (a pre-composed two-page spread scanned as a single image) detected via aspect ratio and given their own pager screen in spread mode instead of being squeezed to quarter-width.
- Odd page counts in spread mode (trailing page shown solo).
- Divide-by-zero guard in `layoutPages` for a malformed `resolution` with width 0.
- Pages near the stated 6000px source-height cap, on a narrow width, are clamped to 3× screen width in display height so one page can't dominate the list's virtualization window.
- Network/API errors surfaced with explicit retry UI, distinguished from a genuinely empty list.
- Stale-request races (fast back-nav, rapid double-tap into a story) cancelled via `AbortController`.
- Zoom scale clamped to [1, 4] with snap-back under ~1.05× so it can't get stuck at a barely-zoomed, visually-flat state.
- Rotation is authoritative over the manual spread toggle (matches the spec's wording literally) — manual toggle only has effect in portrait, and gets overridden the next time the device actually rotates.

## Edge cases *not* handled

- RTL reading direction in spread mode — edge taps and swipe direction assume left-to-right.
- Zero-page chapters render an empty reader rather than an explicit empty state.
- No offline chapter caching beyond FastImage's default disk cache — killing the app without connectivity mid-chapter will fail to reload images on relaunch.
- Pinch-zoom in spread/double-page mode is scoped per page-pair and does **not** persist across page turns or app kill — only vertical-mode zoom scale persists (see decisions below; this was a deliberate scope call given the spec's zoom-persistence requirement sits under the base reader section, not the spread section).
- No accessibility pass beyond `accessibilityLabel` from `altText` — no dynamic type scaling on the overlay controls.

## Scroll FPS at max zoom

I don't have a physical device in this environment to actually run and profile the app, so I'm not going to fabricate a number — that measurement has to come from an actual test run. Here's exactly how to get a real one:

- **iOS**: Xcode → Product → Profile → Core Animation instrument, pinch to 4× zoom on a type-B chapter, scroll, read the frame-rate graph directly (target: 60fps on ProMotion devices it'll report up to 120).
- **Android**: `adb shell dumpsys gfxinfo <package> framestats` while scrolling, or Android Studio's GPU rendering profiler overlay (Settings → Developer options → Profile GPU rendering) for a live bar-graph while you interact.
- FlashList also ships a built-in `useBenchmark`/`JSFPSMonitor` (from `@shopify/flash-list`) if you want an in-app overlay instead of external tooling — I didn't wire it in to keep the reader screen free of dev-only code paths, but it's a five-minute add if useful for grading.

## Three decisions, A over B

1. **Hand-rolled pagination hook over react-query.** Two lists, no cross-screen cache sharing needed, no background refetch requirement. Would flip to react-query the moment a third paginated list showed up, or if stories needed to stay warm in cache when navigating back from the reader.
2. **`Dimensions` over `react-native-orientation-locker` for the rotation trigger.** The spec only needs "this screen's layout follows current rotation," which `Dimensions` already reports. Would flip to a real orientation-lock library if the app needed to *force* landscape (e.g. lock the reader to spread mode regardless of how the user holds the phone) rather than just observe it.
3. **Vertical pan-while-zoomed rides on `FlashList`'s native scroll, not a fully custom pan+scroll reimplementation.** Trades a bit of 1:1 finger-tracking fidelity at high zoom (see below) for keeping virtualization intact. Would flip to a custom implementation if grading emphasized pixel-perfect two-finger drag over scroll/memory performance on long chapters.

## Least happy with

The focal-point pinch math in `useZoomGesture.ts`. It anchors zoom roughly around the pinch center using a linear offset approximation rather than the exact matrix math a library like `react-native-photo-view` would do, and because scale is a paint-time transform over `FlashList`'s own (unscaled) scroll coordinate space, native scroll-to-touch speed doesn't stay perfectly 1:1 once you're zoomed in and dragging vertically. It reads correctly and doesn't fight the list, but it's the one place I'd want another pass with more time.

## One thing I tried that didn't work

I initially tried making the zoom fully custom — replacing `FlashList`'s native scroll with a JS-driven pan for *both* axes while zoomed, so two-finger drag would track the finger exactly at any zoom level. Abandoned it: `FlashList`'s recycler needs real native scroll offset events to know what to render, and coordinating a synthetic scroll position against its own offset bookkeeping got complicated fast, for a gain (perfect diagonal drag tracking) that wasn't worth losing recycling correctness over. Reverted to native scroll owning vertical movement always, gesture only owning horizontal pan + scale.

## AI usage

Built with Claude (Anthropic) as an interactive pair, in the same chat thread as the assignment brief — prompts included below rather than reconstructed after the fact.

One place I rejected the first approach I reached for: I initially wrapped `FlashList` in `Animated.createAnimatedComponent(FlashList)` by hand to get an animatable ref for the zoom transform, before checking what the installed `@shopify/flash-list@1.8.3` actually exported. It turned out the package already ships its own `AnimatedFlashList`, built and tested against FlashList's specific ref/ref-forwarding internals — using the hand-wrapped version risked subtly different ref behavior on scroll-to-index calls than what the library maintainers actually test. Swapped to the built-in export once I checked the package's type declarations instead of assuming.
