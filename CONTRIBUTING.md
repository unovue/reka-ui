# Contributing to Reka UI

Thanks for your interest in improving Reka UI! This guide covers everything you
need to get a local checkout running, find your way around the monorepo, and
open a pull request that fits the project's conventions.

## Welcome & getting help

We would love your contributions — PRs for core components, docs, tests, and
stories are all welcome. The best place to ask questions or pair up is our
Discord: [chat.unovue.com](https://chat.unovue.com). Bugs and feature requests
belong in the [issue tracker](https://github.com/unovue/reka-ui/issues).

By participating you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Repository layout

This is a pnpm monorepo. The pieces you are most likely to touch:

| Path | What it is |
|---|---|
| `packages/core` | The published `reka-ui` package. All components and composables live in `src/`. |
| `packages/plugins` | Build-tool integration (auto-import resolver, Nuxt module). |
| `packages/bench` | Browser benchmark: per-family retained heap and mount time on a production build. |
| `docs/` | The VitePress documentation site (its own workspace — install separately). |
| `playground/` | Local sandboxes for trying things out. |
| `.histoire/` | Histoire setup for the component stories. |

Inside `packages/core/src/`:

- One directory per **component family** (e.g. `Accordion/`, `Dialog/`,
  `Checkbox/` … through the date pickers).
- `shared/` — shared composables (`createContext`, `useForwardExpose`, the
  prop/emit forwarding helpers, typeahead, selection, etc.).
- `date/` — date/calendar utilities used by the date-family components.

## Getting started

**Prerequisites:** Node ≥ 22 and pnpm 10 (the repo pins `pnpm@10.13.1` via the
`packageManager` field; [Corepack](https://nodejs.org/api/corepack.html) will
pick this up automatically).

```bash
git clone https://github.com/unovue/reka-ui.git
cd reka-ui
pnpm i
```

Recommended dev loops, depending on what you're working on:

- **Visual / interactive work** — `pnpm story:dev` opens Histoire with the
  component stories.
- **TDD on a component or composable** — `pnpm --filter reka-ui exec vitest <path>`
  runs that file in watch mode.
- **Testing against an external app** — `pnpm --filter reka-ui watch` rebuilds
  the package on change so a linked app sees your edits.

## Project commands

All commands run from the repo root.

| Task | Command |
|---|---|
| Install | `pnpm i` |
| Build core | `pnpm --filter reka-ui build` (vue-tsc type-check + tsdown bundle) |
| Watch build | `pnpm --filter reka-ui watch` |
| Type-check only | `pnpm --filter reka-ui type-check` |
| Tests (watch) | `pnpm test` |
| Tests (one-shot) | `pnpm --filter reka-ui exec vitest run [path]` |
| Test coverage | `pnpm --filter reka-ui test:coverage` |
| Browser tests | `pnpm test:browser` |
| Lint / auto-fix | `pnpm lint` / `pnpm lint:fix` |
| Stories | `pnpm story:dev` |
| Docs dev | `pnpm --filter reka-ui build && pnpm docs:install && pnpm docs:dev` |
| Docs API regen | `pnpm docs:gen` (regenerates `docs/content/meta/*.md`) |
| Bundle size | `pnpm --filter reka-ui size` |
| Browser benchmark | `pnpm bench` (see [Benchmarks](#benchmarks)) |
| Subpath exports regen | `pnpm --filter reka-ui gen:exports` (after adding or removing a family in `src/index.ts`) |

> - `pnpm test` is **watch mode**. For a one-shot run (CI-style) use
>   `pnpm --filter reka-ui exec vitest run`.
> - The docs site needs `packages/core/dist` to exist — `docs/.vitepress/config.ts`
>   imports `reka-ui/dist/constant.js` through the workspace link. On a fresh
>   checkout run `pnpm --filter reka-ui build` first, or `pnpm docs:dev` fails
>   with `Cannot find module … /dist/constant.js`.

## Component architecture

A few patterns recur in every component family — learn them once and the rest of
the codebase reads the same way. `packages/core/src/Checkbox/` is a small,
complete example to read alongside this section.

- **Family folders & naming.** Components are Vue SFCs named
  `<Family><Part>.vue` — `CheckboxRoot.vue`, `CheckboxIndicator.vue`,
  `DialogRoot.vue`, `DialogContent.vue`, and so on. Each family has an
  `index.ts` re-exporting its parts and prop types, and every family is
  re-exported from `packages/core/src/index.ts` (the public surface).
  Every family the barrel exports is also built as its own entry point
  (`reka-ui/checkbox`), derived from the barrel by
  `packages/core/scripts/families.ts`; `pnpm --filter reka-ui gen:exports`
  writes the matching `exports` into `packages/core/package.json`, and
  `src/subpaths.test.ts` fails when the two drift apart.
- **Context.** State flows from a root to its descendants via
  `createContext('<ComponentName>')` (see
  `packages/core/src/shared/createContext.ts`). It returns
  `[injectContext, provideContext]` around a typed `InjectionKey`: the
  `*Root.vue` calls the provide function, descendants call inject.
- **Rendering.** Output goes through `Primitive`
  (`packages/core/src/Primitive`) which implements the `as` / `asChild` props
  (`asChild` merges props onto the consumer's own element instead of rendering
  a wrapper). Expose template refs with `useForwardExpose()`, and forward
  props/emits with `useForwardProps`, `useEmitAsProps`, or
  `useForwardPropsEmits` from `src/shared/`.

## Shadow DOM & document access

Components must work inside a **shadow root** (web components, micro-frontends,
embedded design systems). A component mounted in a shadow root can't find its own
elements through the global `document` — so **never reach for `document`/`window`
for anything scoped to a component's own tree.** Use the root-aware helpers in
`src/shared/`, anchored on an element you already have (`useForwardExpose().currentElement`,
a trigger/content ref, …):

| Instead of… | Use |
| --- | --- |
| `document.getElementById(id)` | `getElementByIdFrom(anchorEl, id)` — dual-root: the anchor's root, then the owner document (still finds content Teleported to `body`) |
| `document.querySelector('[for="…"]')` | `getRootNode(anchorEl).querySelector('[for="…"]')` |
| `document.activeElement` | `getActiveElement(anchorEl)` (descends shadow roots) |
| `document.body` / `document.head` | `getOwnerDocument(anchorEl).body` / `.head` |
| `window.…` | `getOwnerWindow(anchorEl)` |
| `event.target` in a listener above a shadow boundary | `getEventTarget(event)` — `composedPath()[0]`, read **synchronously** (empty after dispatch) |
| Injecting a `<style>` into `document.head` | `injectStyle(getRootNode(anchorEl), css, { nonce })` — adopted stylesheets + `<style>` fallback |
| `container.contains(target)` for a composed target | `containsComposed(container, target)` (walks the flat tree: through shadow hosts and the slots light-DOM children are assigned to) |
| `target.closest(selector)` / `el.parentElement` walks on a composed target | `closestComposed(target, selector)` / `getFlatTreeParentElement(el)` (`getComposedParentElement(el)` skips slots) |
| `window.addEventListener('scroll', …, { capture: true })` | `useAncestorScroll(anchorEl, onScroll)` — `scroll` is not composed, so it also listens on each shadow root around the anchor |
| `hideOthers(el)` from `aria-hidden` | `useHideOthers(el)` — hides siblings inside every shadow root around `el`, then around the outermost host, and lifts another modal's hold on the hosts around `el` while it holds |

- **A composed target also matters in the light DOM:** a press inside a web component
  (an icon element in a trigger or handle) has its deep target inside that component's
  shadow root. Once you read `getEventTarget(event)`, every `contains` / `closest` /
  parent walk on it must be one of the composed helpers above.
- **Anchor on a real element ref**, not the global document — every part already
  exposes `currentElement` via `useForwardExpose()`.
- `for`/`id` associations never cross shadow boundaries, so root-scoping label
  lookups is semantically correct, not just a shadow workaround.
- **Guard for SSR at the caller** (`isClient` / inside `watchEffect`/`onMounted`),
  as the existing code does — the helpers assume a client context.
- **Test in a shadow root** in a real browser: `mountInShadowRoot(Component, options)`
  (`src/shared/test/shadowDom.ts`) mounts into an open shadow root and returns
  `get(testId)` / `query(selector)` scoped to the shadow root and a deep
  `activeElement()`; see the colocated `*.shadow.browser.test.ts` files. jsdom's shadow
  DOM support is partial (no layout, focus or hit testing), so use `createShadowHost()`
  there only for lookup-level checks. Testing-library queries don't pierce shadow roots.
- **Teleport:** a portal rendered inside a shadow root teleports into that shadow
  root by default (`resolveTeleportTarget`), so its content shares the root's styles
  and aria idrefs. A string `to` / `teleportTo` is looked up in the shadow root first.
  With the default target, a `forceMount` portal rendered during the app's first client
  render mounts its content once the portal has mounted (the root is unknown before
  then); `disabled` and element targets still render during that render.
- **Known limits (browser-only or genuinely unfixable):** closed shadow roots
  (`composedPath()` returns the host); aria idrefs for content explicitly Teleported
  out of the root; FocusScope's tabbable walk does not descend into shadow roots
  nested inside the scope; the Splitter drag cursor is injected into the document
  and reaches shadow content only through inheritance. `useBodyScrollLock` is correct
  as-is — a shadow root shares the host `document.body`, which is the right scroll
  surface. Plain `setTimeout`/`window.innerWidth`-style reads don't need scoping — leave them.

## Testing

- Tests are **colocated** with the code as `<Name>.test.ts` inside each family
  (e.g. `packages/core/src/Checkbox/Checkbox.test.ts`).
- Stack: [Vitest](https://vitest.dev) + jsdom, with
  [`@testing-library/vue`](https://testing-library.com/docs/vue-testing-library/intro/)
  and `@vue/test-utils` for mounting, and `vitest-axe` for accessibility
  assertions: `expect(await axe(el)).toHaveNoViolations()`.
- jsdom quirks (a stubbed `scrollIntoView`, a patched `getComputedStyle` that
  axe relies on) are handled globally in `packages/core/vitest.setup.ts` — you
  don't need to repeat that per test.
- New components and composables should ship with colocated tests, including an
  axe check for anything that renders.
- **Browser tests** (`<Name>.browser.test.ts`, also colocated) run in headless
  Chromium through Vitest browser mode and Playwright. Use them for behaviour
  jsdom cannot represent: native focus order (`Tab`), form submission, the
  default action of a key press, and layout or positioning. Drive them with
  `userEvent` from `vitest/browser`, which sends trusted events. Run
  `pnpm test:browser`; the first time, install the browser with
  `pnpm --filter reka-ui exec playwright install chromium`.

## Benchmarks

`packages/bench` measures what each component family costs in a real browser. It
builds a small Vite page in production mode against `packages/core/dist`, mounts
N instances of a typical composition per family (`src/fixtures/<Family>.vue`, for
example 500 closed Dialogs or 1000 Checkboxes), and drives it with Playwright
Chromium. Every sample is a fresh page, and it measures:

- **Retained heap per instance**: JS heap after mount minus before mount, each
  after a forced GC, divided by N. It is deterministic; runs differ by well
  under 1%.
- **Mount time per instance**: `app.mount()` alone, and up to the next paint.
- **Update time**: one representative action (open, toggle, select, arrow key)
  on 10 instances, timed until the expected DOM state.
- DOM nodes, components and event listeners per instance.

```bash
pnpm bench                                  # all families, this checkout, prints a table
pnpm bench --only Dialog,Popover,Select     # a subset
pnpm bench --compare origin/v3              # base → this checkout, interleaved
pnpm bench:full --compare origin/v3         # 10 runs per build instead of 3
pnpm bench --help                           # all options
```

`--compare <ref>` checks the ref out in a temporary git worktree, installs and
builds it there, then measures both builds interleaved, family by family. It
prints the head/base ratio for heap, mount and update time. Each run gets its own
worktree under `/tmp/rkb-*`, which is removed when the run ends, even on Ctrl-C.
Concurrent runs against the same ref therefore don't collide. Add `--keep-base`
to leave the worktree in place for inspection. Several runs can share one
checkout: they take turns building `packages/core` under a lock. If a killed run
left that lock behind, the next run stops and tells you to remove it with
`pnpm bench --unlock`; run that only when no other bench is running. Runs do
share the default `dist/results.json`, so give each run its own `--out` if you
need every result. The first time, install the browser with
`pnpm --filter bench exec playwright install chromium`. Raw samples go to
`packages/bench/dist/results.json`.

**In CI**, the `Bench` workflow runs `pnpm bench --compare <base>` on every pull
request into `v3` that touches `packages/core`, and writes the table to the job
summary. The job fails when a family's retained heap per instance grows by more
than 3% **and** by more than 0.2 KB per instance, with every PR sample above
every base sample. Times are reported but never fail the job, because shared
runners are too noisy for them.

When you add a component family, add a fixture to `src/fixtures/` and an entry
(instance count and update action) to `src/families.js`. If a fixture imports
something the base build doesn't export, that family is reported as `new`.

## Documentation

Each component has a page under `docs/content/`. The **API tables**
(props / emits / slots) are **auto-generated** — after changing a component's
public props, emits, or slots, run `pnpm docs:gen` and commit the regenerated
`docs/content/meta/*.md`. Never hand-edit those generated files.

## Commits & pull requests

- **Conventional Commits**, enforced by commitlint via a pre-commit hook
  (simple-git-hooks). The scope is the component family:
  `feat(Dialog): …`, `fix(shared): …`, `docs: …`, `ci: …`.
- **lint-staged** runs `eslint --fix` on staged files when you commit (the
  `@antfu/eslint-config` lints JSON / Markdown / YAML too — that's intentional).
- Open PRs against the default branch. CI runs build, tests, and bundle-size
  checks; please make sure they're green.

## Releases

Releasing is maintainer-only: versions are bumped with `pnpm bumpp` and
`reka-ui` is published from `packages/core` with npm provenance. As a
contributor you don't need to run anything release-related — just land
conventional commits and a maintainer will cut the release.
