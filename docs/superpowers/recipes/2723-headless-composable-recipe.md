# Headless Composable Migration Recipe (`useX()`)

> Status: **validated on Switch (form-control archetype) + Tabs (collection /
> per-item / roving-focus archetype).** The two pilots have shipped; the recipe is
> ready to batch-apply to the tiers below, still one family per PR with its own
> characterization gate.

Every component family gains a `useX()` composable holding its logic/state; the
`.vue` SFC becomes a thin shell. Components keep their exact public API — this is
an internal re-architecture that additively exposes the logic as a new public API.

## The contract

Each rendered part returns a **`PartSurface`**, the shared contract homed in
`@/shared` (`shared/partSurface.ts`), imported as `import type { PartSurface } from '@/shared'`:

```ts
export interface PartSurface<S extends Record<string, any> = Record<string, any>> {
  props: ComputedRef<Record<string, any>> // aria/role/value/id?/handlers — NO data-*
  state: ComputedRef<S> // semantic state ({ state: 'checked', disabled })
}
```

`data-*` come from `state` via the shared `stateToDataAttrs(state)` — whose
semantics match `useRender`'s `getStateAttributes` (#2722), so once a part renders
through `useRender` the SFC passes `state` straight in and the helper drops away.

`useX()` returns `{ ...topLevelState, ...methods, <part>: PartSurface, context }`.

## Steps (per family)

1. **Characterize first.** Write characterization tests against the UNMODIFIED
   family for the surface the black-box suite misses — ids, `[for]`/label wiring,
   **consumer-listener chaining**, disabled, controlled emit. Run them GREEN
   pre-refactor (see `Switch.test.ts` › "characterization"). This is the guard the
   thin existing suites don't provide.
2. **Create `use<Family>.ts`** next to the SFCs. Pure: state derivation, methods,
   per-part `PartSurface`, and the `context` value object. Props in as
   `MaybeRefOrGetter`/`Ref`, read with `toValue`. NO `defineProps`/`defineEmits`/
   `provide`/`document` inside. Handlers live in `part.props` (e.g. `onClick`) so
   they chain.
3. **Keep in the Root SFC:** public prop/emit interfaces + `createContext` (in the
   plain `<script>` block, so descendant `import`s don't move), `withDefaults`
   verbatim (incl. load-bearing factory-default hacks), `useVModel` + `passive`,
   `useForwardExpose`/`useForwardScopeId`, `useFormControl` + DOM-bound computeds
   (e.g. the `[for]` label lookup, SSR-guarded by `currentElement`), `id`/`type`/
   tag-dependent bindings, `defineExpose` parity, the hidden-input `v-if` gate, and
   Presence/Teleport/Popper wrappers. The SFC builds the context via the composable
   then calls `provideX(context)` — never `provide` inside the composable.
4. **Bind with `mergeProps`, NEVER object spread:**
   `v-bind="mergeProps(part.props.value, stateToDataAttrs(part.state.value), scopeIdAttrs, $attrs)"`.
   Object spread makes a consumer's `onClick` in `$attrs` clobber the part's handler.
5. **Export** `useX` + `UseXProps`/`UseXReturn` from the family `index.ts` after a
   **collision audit** against `vue` (`useId`), `@vueuse/core` (`useToggle`!), and
   common Nuxt auto-imports. Rename on a clash (`useTogglePressed`).
6. **Verify:** characterization + existing `*.test.ts` untouched + new
   `useX.test.ts` (effectScope/mount harness for families with watchers) + axe +
   `type-check` + family-scoped `docs:gen` (real diff must be empty — build first;
   generic SFCs may show tool noise, re-diff on a clean checkout).

## Collection / per-item families (validated on Tabs)

The Switch archetype has one attr-bearing root. Collection families (Tabs,
RadioGroup, Accordion, ToggleGroup) differ — the attr-bearing logic is **per item**,
computed from `(context, itemValue)`. What converting Tabs settled:

- **Per-item surfaces are exported, context-PURE builders — not just getters and
  not methods on the return.** Define free functions
  `get<Family><Part>Surface(context, value, disabled?)` returning a `PartSurface`,
  deriving everything from the **context** (`makeTriggerId(context.baseId, value)`,
  `aria-controls` from `context.contentIds`, `aria-selected`/`data-state` from
  `context.modelValue`). This is the crux: the **descendant part SFC injects the
  context, NOT the `useX()` return** (exactly like `SwitchThumb` derives from
  context). If the SFC re-derived its own attrs, that logic would drift from the
  composable — so BOTH the SFC and `useX().getTriggerSurface` call the SAME pure
  builder. One derivation, two callers, zero drift. The `useX()` return still
  exposes `getTriggerSurface(value)` = `builder(context, value)` for standalone use.
- **Pass `value` as `MaybeRefOrGetter<StringOrNumber>`**, read via `toValue`, so the
  SFC's reactive `() => props.value` keeps the ids/state live (the pre-refactor
  `computed(() => makeTriggerId(baseId, props.value))` was reactive — match it).
- **Registration methods stay in context** (`registerContent`/`unregisterContent`,
  the `contentIds` Set) and the registration *lifecycle* (`onMounted`/`onBeforeUnmount`)
  stays in the content SFC. The composable builds the context value and exposes the
  methods; the context shape stays frozen (byte-for-byte — descendant `import`s and
  `injectX` consumers must not break). The root SFC calls `provideX(context)`.
- **`inheritAttrs` differs by part-count, not by archetype.** Switch set
  `inheritAttrs: false` because it renders **two siblings** (control + hidden input)
  and had to steer `$attrs`. Tabs parts render a **single root inside a wrapper**
  (`<RovingFocusItem as-child>`), so they keep the default `inheritAttrs: true`:
  `$attrs` auto-inherit through the wrapper and chain with the surface's handlers,
  and `v-bind="mergeProps(part.props.value, stateToDataAttrs(part.state.value))"`
  needs **no explicit `$attrs`**. Only add `$attrs` to `mergeProps` when the SFC
  sets `inheritAttrs: false`.
- **Component-wrapper behaviors stay wrappers in v1.** `TabsTrigger` wraps
  `<RovingFocusItem as-child>` for arrow-key nav; `TabsContent` wraps `<Presence>`.
  A pure `useTabs()` **cannot** absorb `RovingFocus`/`Collection`/`Presence`/`Popper`
  (they are component families). So a standalone `useTabs()` consumer gets
  ids/aria/selection but NOT roving-focus keyboard nav or presence mount/unmount
  unless they also compose those components. **State this limit in the docs** —
  "headless" is bounded in v1.
- **`useId`/SSR-ids stay in the shell.** The root SFC passes
  `baseId: useId(undefined, 'reka-<family>')` in; the composable defaults `baseId`
  to a literal so it stays callable outside `setup()` (Tabs is computed-only — no
  watchers/lifecycle in the composable). Never call `useId` inside the composable.

## Dependency- and structure-ordered migration (not size)

- **Overlays are deferred.** Dialog/Popover/Tooltip/HoverCard/DropdownMenu/Select/
  Combobox render **no root attrs** (`PopoverRoot` is `<PopperRoot><slot/></PopperRoot>`);
  their logic lives in Content-part component wrappers. Define the overlay contract
  **jointly with #2724** (which rewrites overlay internals) — converting them here
  first is double churn.
- **Convert dependencies first.** Families that snapshot a child's `exposed`
  (`ComboboxRoot` reads `ListboxRoot`'s exposed methods) require the dependency
  converted first: **Listbox → Combobox → Select**.
- **Tiers:** (1) form/toggle: Checkbox, RadioGroup, ToggleGroup, Toggle; (2)
  collection/disclosure: Tabs ✓(gate), Accordion, Collapsible; (3) delegation
  chains: Listbox → Combobox → Select; (4) overlays — deferred (joint with #2724);
  (5) date/calendar family last (heavy generics; `useDateField` is already
  composable-shaped — the house prior art for this whole effort).

## Footguns

- Getters/`toValue`, never raw `props.x` snapshots (freezes reactivity).
- No `document` at call scope (SSR).
- Port handler bodies verbatim — do NOT add guards the SFC lacks (Switch has no
  modifier guard on `@keydown.enter.prevent`).
- `export *` publishes `UseXProps`/`UseXReturn` instantly — name deliberately.
- `<part>.state` and the part SFC must not become two sources of truth that drift;
  share the derivation (both read the same `checked`/`disabled` refs).
- `defineExpose` is component-bound — re-expose the same refs from composable state.
