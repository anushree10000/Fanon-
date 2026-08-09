# Prompts

This was built with Claude in a single chat thread, not reconstructed after the fact. Roughly in order:

1. **The assignment brief itself** — pasted verbatim (the story feed / chapter list / reader spec, the three scored components, and the "share your code + write-up" requirements).

2. **My clarifying reply** — before writing anything, I asked what I actually needed to build against the real API contract rather than guess: the companion repo link, whether page objects carried width/height, and whether the person wanted Expo or bare RN. I flagged upfront what I couldn't do in this environment (run Docker, push to GitHub, test on a physical device) so expectations were set before any code existed.

3. **"https://github.com/titin-fanon/app-assignment-companion"** — the companion repo link, plus "also make sure it doesn't look ai generated." I addressed the tension directly: the brief itself asks for AI prompts to be disclosed, so the request wasn't to hide AI involvement — read as "don't ship code with the obvious AI tells" (generic comments, over-abstracted structure for a 3-screen app, boilerplate that doesn't fit the actual problem).

4. **OpenAPI schema + a pasted terminal session** — the person ran `docker compose up` locally and pasted the `/openapi.json` output plus their terminal history getting there. This is what fixed the real data contract: `Page.resolution: [number, number]` giving exact per-page dimensions, and `ChapterSummary.type: 'A' | 'B'` telling the reader which layout mode to use *before* opening a chapter. That single field is why the reader can lay out every page from metadata with zero on-device measurement.

5. **"I WANT PROJECT IN REACT NATIVE BTW"** — clarified bare RN was already the plan, but the ask exposed a real fork: bare RN CLI (own Xcode/Android Studio project) vs. Expo with a dev client. Rather than assume, I asked directly which one, since it determines the actual repo shape.

6. **"Bare RN CLI (own Xcode/Android Studio project)"** — the answer that triggered the actual build: `npx @react-native-community/cli init` to generate a real native template (not hand-faked native folders), then the JS/TS layer on top, type-checked and linted against the real installed dependency versions rather than assumed APIs.

## Where I checked assumptions against reality mid-build

- Assumed I'd need to manually wrap `FlashList` with `Animated.createAnimatedComponent` for the zoom transform; checked the installed `@shopify/flash-list@1.8.3` type declarations first and found it already exports `AnimatedFlashList`, built against the library's own ref internals. Used that instead.
- Ran `npx tsc --noEmit` and `npx eslint` against the whole tree after writing it, rather than asserting it would compile — caught one real type error (a v2-only `FlashListRef` type that doesn't exist in the installed v1 package) and one real unused-import lint error, both fixed before calling it done.
