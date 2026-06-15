# reka-ui — agent notes

Vue 3 headless component library. pnpm monorepo. Node ≥ 22, pnpm 10.

## Commands (from repo root)
- Install: `pnpm i`
- Test (one-shot): `pnpm --filter reka-ui exec vitest run [path]`  (`pnpm test` = watch mode — avoid in automation)
- Coverage: `pnpm --filter reka-ui test:coverage`
- Type-check: `pnpm --filter reka-ui type-check`
- Lint: `pnpm lint` (fix: `pnpm lint:fix`)
- Build: `pnpm --filter reka-ui build` (vue-tsc + tsdown)
- Regenerate API docs after changing public props/emits/slots: `pnpm docs:gen`

## Layout
- `packages/core/src/<Family>/` — one dir per component family; parts named `<Family><Part>.vue`; each family has `index.ts`; public surface = `packages/core/src/index.ts`.
- `packages/core/src/shared/` — shared composables (`createContext`, `useForwardExpose`, prop/emit forwarding, …).
- `packages/core/src/date/` — date/calendar utilities.
- `packages/plugins` — build-tool integration (resolver, Nuxt module).
- `docs/` — VitePress site; `docs/content/meta/*.md` is AUTO-GENERATED (never hand-edit).
- Stories are Histoire (`*.story.vue`), not Storybook.

## Conventions
- Context: `createContext('<Component>')` → `[inject, provide]`; `*Root.vue` provides, descendants inject.
- Rendering: `Primitive` with `as` / `asChild`; expose refs via `useForwardExpose()`.
- Tests: colocated `*.test.ts`, vitest + jsdom + `@testing-library/vue` + `vitest-axe` (axe check expected for new components); jsdom quirks handled in `packages/core/vitest.setup.ts`.
- Commits: Conventional Commits, scope = component family (`fix(Dialog): …`); commitlint enforces; lint-staged runs `eslint --fix` (lints JSON/MD/YAML too — intentional).

See CONTRIBUTING.md for the full guide.
