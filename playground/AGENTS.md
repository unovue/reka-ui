# playground

## Scope
Smoke-test apps for validating core components in real-world Vue 3 and Nuxt 3 environments.

## Sub-Apps
| Path | Purpose |
|---|---|
| `playground/vue3/` | Vite + Vue 3 SPA. Tests bare-metal integration. |
| `playground/nuxt/` | Nuxt 3 app. Tests Nuxt module + SSR behavior. |

## Usage
- Use for manual testing, reproduction of issues, integration smoke tests.
- Do not add production features here; keep minimal.
- Link to local `packages/core` via `file:` or `link:` protocol.

## Commands
| Command | What |
|---|---|
| `pnpm --filter playground-vue3 dev` | Start Vue 3 Vite dev server. |
| `pnpm --filter playground-vue3 build` | Type-check + build Vue 3 app. |
| `pnpm --filter nuxt-app dev` | Start Nuxt 3 dev server. |
| `pnpm --filter nuxt-app build` | Build Nuxt 3 app (SSR). |

## When to Touch
- Reproducing a bug report.
- Validating a new component works in isolation.
- Testing Nuxt module auto-import behavior.
- SSR hydration checks.

## Rules
- No test files here; tests belong in `packages/core/src/<Component>/*.test.ts`.
- No documentation here; docs belong in `docs/`.
- Keep dependencies minimal; only what's needed to render components.
- If you add a component demo, clean it up after verification.

## Do-Not-Edit
- `pnpm-lock.yaml` — auto-managed.
- `node_modules/` — dependencies.
- `.nuxt/` — Nuxt build cache.
