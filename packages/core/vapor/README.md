# `reka-ui/vapor` (experimental)

The Vapor entry is the unchanged `src/` SFCs compiled a second time, in Vue Vapor mode, by
`vite build -c vapor/vite.config.mjs`. That step is part of `pnpm --filter reka-ui build`, so a `src/`
change can fail the main build. This page covers what to do when it does.

- `plugins.mjs`: the module overrides and the build transforms
- `src/`: the Vapor versions of `Primitive`, `Presence`, `Collection` and a few composables, plus
  `shared/internals.ts`, the only file that touches Vue internals
- `tests/`: the Vitest browser suite (`pnpm test:vapor`)
- `transform-expectations.json`: what each transform rewrote, per file

## When the Vapor build fails after a `src/` change

Every error starts with `[reka-vapor]` and names the file and the transform.

**"rewrote src/ differently than vapor/transform-expectations.json records"**

The build counts what each transform rewrote, per file, and compares the counts with
`transform-expectations.json`. Each line names the file, the transform and the two counts.

- If your change explains the difference, regenerate the file and commit it with your change:
  ```bash
  pnpm --filter reka-ui vapor:expectations
  ```
  For example, you added an `asChild` Primitive to a template, added a component to a family the Vapor
  entry exports, or removed a `v-show`.
- If a count dropped although the code still needs the rewrite, the transform no longer recognises the
  new source. Fix the transform in `plugins.mjs`, not the expectations. For example, a component still
  imports `defineAsyncComponent`, but the async-component count for it is now 0.

**"dist/vapor would import VDOM-only Vue APIs"**

A module in the Vapor output imports something like `h`, `cloneVNode`, `defineAsyncComponent` or
`getCurrentInstance` from `vue`, which cannot work in a Vapor app. Either a transform missed it, or a
new `.ts` module renders VNodes and needs a Vapor version in `MODULE_OVERRIDES`.

**"the patch for … no longer applies"**

`PATCHES` in `plugins.mjs` edits a few files by text. Update the patch to the new source of that file.

**"MODULE_OVERRIDES … no longer exists"**

A module that has a Vapor version was moved or renamed. Point the override at its new path.

**"src claims '…': add it to REFERENCED_KEYS"** (`pnpm test:vapor:node`)

A part in `src/` calls `claimReferencedId` with a new context key. The Vapor version
(`vapor/src/shared/useReferencedId.ts`) prepares those keys when the context is provided, so add the
key to `REFERENCED_KEYS` there.

**Other `presenceRootAttrs`, `vShowOnComponents` or `exposeElementPlugin` errors**

The message says what the transform could not handle and how to fix the template by hand.

## Checking a change

```bash
pnpm --filter reka-ui test:vapor                     # the suite, compiled from src/
VAPOR_PARITY=vdom pnpm --filter reka-ui test:vapor   # the same tests against the VDOM components
pnpm --filter reka-ui build && pnpm --filter reka-ui test:vapor:dist   # against the built dist/vapor
```

A family is exported from `vapor/src/index.ts` only once its tests pass.
