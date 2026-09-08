# .histoire

## Scope
Histoire (storybook-like) environment for component development and visual testing.

## Config
- `vite.config.ts` — Histoire config embedded in Vite.
- `setup.ts` — global setup (imports styles).
- `style.css` — global styles for stories.
- `tailwind.config.js` — Tailwind tokens for story previews.

## Story Conventions
- Stories live next to components: `packages/core/src/<Component>/story/<Component>.story.vue`.
- File naming: `<Component>.story.vue` for primary stories, `_*.vue` for internal/demo components.
- Match pattern: `**/*.story.vue` (configured in `storyMatch`).
- Story tree groups: Components, Compounds, Utilities.

## When to Touch
- Adding visual stories for new components.
- Updating story themes, logos, or tree structure.
- Fixing story rendering issues (CSS, aliases, plugins).

## Commands

| Command | What |
|---|---|
| `pnpm story:dev` | Start Histoire dev server (port 6006). |
| `pnpm --filter histoire story:build` | Build static storybook. |
| `pnpm --filter histoire story:preview` | Preview built storybook. |

## Rules
- Stories are not tests; they are visual/interactive demos.
- Keep stories self-contained; import from `@/` alias (resolves to `packages/core/src`).
- Do not add business logic to stories; use `_*.vue` helper components for demos.
- Stories should demonstrate default state + key variants.

## Alias
- `@/*` → `packages/core/src/*` (configured in Histoire Vite config).

## Do-Not-Edit
- `dist/` — build output.
- `node_modules/` — dependencies.
