# Development & Tooling Log

I built this project directly in React Native CLI using TypeScript. AI was used strictly as an assistant for boilerplate syntax generation, specific API lookup, and rapid debugging.

## 1. Setup & Project Architecture
* **Environment:** Initialized a bare React Native CLI project (`@react-native-community/cli`) to maintain native control over iOS and Android configurations.
* **Architecture:** Hand-designed the screen architecture, state management flow, and data handling pipeline based on the assignment brief before writing code.

## 2. Schema Mapping & Types
* **Data Layer:** Extracted the data contracts directly from `/openapi.json` and generated strict TypeScript interfaces for API models (`Page`, `ChapterSummary`, `Story`).
* **Aspect Ratio Calculation:** Wrote custom helper logic to parse `Page.resolution` and pre-calculate reader layout ratios to prevent layout shifts during scroll.

## 3. Targeted AI Assistance (Prompts)
Below are the exact micro-tasks where Claude was consulted during development:

* **Dependency Check:** 
  > *"What is the correct export syntax for `AnimatedFlashList` in `@shopify/flash-list` version 1.8.3?"*
* **Type Narrowing:** 
  > *"How do I properly type a strict union discriminator in TypeScript for `type: 'A' | 'B'` without getting implicit `any` errors?"*
* **Linter Cleanup:** 
  > *"Fix this ESLint unhandled promise warning in my `fetch` wrapper function."*

## 4. Verification & Testing
* Hand-tested layout responsiveness and zoom touch gestures on both iOS simulator and Android emulator.
* Ran static analysis and type checks manually via `npx tsc --noEmit` and `npx eslint .`.
