# packages/core

## Scope
Component primitives, shared utilities, date/temporal logic, tests, stories.

## Directory Contract
Each component lives in `packages/core/src/<Component>/`:
- `<Component>Root.vue`, `<Component>Item.vue`, etc. (Vue SFCs)
- `index.ts` — barrel exports for all parts + types
- `<Component>.test.ts` — Vitest + Testing Library + axe
- `story/<Component>.story.vue` — Histoire stories

## Code Conventions
- `@/*` alias resolves to `src/*`.
- Use `<script lang="ts">` for types/context + `<script setup lang="ts">` for logic.
- Props/emits types: `export type <Component>RootProps`, `export type <Component>RootEmits`.
- Context: `createContext('<Component>Root')` → `[inject, provide]`.
- Default export: `export { default as <Component>Root, type ... } from './<Component>Root.vue'`.
- Follow existing test patterns: `setup()` helper, `userEvent.setup()`, `axe()` accessibility checks.

## Temporal / Date Rules
- Date/time values use `Temporal` types (`TemporalDate`, `TimeValue`).
- Never mix legacy `Date` objects in public APIs.
- Import from `@/temporal`, `@/date`, or `reka-ui/date` as appropriate.
- When environment lacks native Temporal, polyfill via `temporal-polyfill`.

## Adding / Modifying a Primitive
1. Create `src/<Component>/` with SFCs + `index.ts`.
2. Export all parts + types from `index.ts`.
3. Add component names to `constant/components.ts`.
4. Re-export from `src/index.ts`.
5. Write tests: keyboard, accessibility, controlled/uncontrolled.
6. Add/update Histoire story.
7. Run: `pnpm --filter reka-ui test` → `pnpm --filter reka-ui build` → `pnpm lint`.

## Verification Commands
- `pnpm --filter reka-ui test` — Vitest suite.
- `pnpm --filter reka-ui test-update` — update snapshots.
- `pnpm --filter reka-ui build` — type-check + bundle.
- `pnpm type-check` — vue-tsc only.
- `pnpm lint` — ESLint.

## Do-Not-Edit
- `dist/**` — build output.
- `node_modules/**` — dependencies.
