# Headless Composable Migration Recipe (`useX()`)

> Status: **validated on Switch (form-control archetype).** The collection-family
> section below is derived from reading Tabs end-to-end; **Tabs is the next
> conversion and the recipe-validation gate** — amend this recipe with whatever
> it forces. Do NOT batch-apply to all ~57 families before Tabs is converted.

Every component family gains a `useX()` composable holding its logic/state; the
`.vue` SFC becomes a thin shell. Components keep their exact public API — this is
an internal re-architecture that additively exposes the logic as a new public API.

## The contract

Each rendered part returns a **`PartSurface`**:

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

## Collection / per-item families (from Tabs)

The Switch archetype has one attr-bearing root. Collection families (Tabs,
RadioGroup, Accordion, ToggleGroup) differ — the attr-bearing logic is **per item**,
computed from `(context, itemValue)`:

- **Per-item surfaces are GETTERS, not fixed properties:**
  `getTriggerSurface(value, disabled?)` / `getContentSurface(value)` returning a
  `PartSurface`. (`TabsTrigger` computes `makeTriggerId(baseId, value)`,
  `aria-controls`, `aria-selected`, `data-state` from `(rootContext, props.value)`.)
- **Registration methods stay in context** (`registerContent`/`unregisterContent`,
  the `contentIds` Set). The composable exposes them; the context shape stays frozen.
- **Component-wrapper behaviors stay wrappers in v1.** `TabsTrigger` wraps
  `<RovingFocusItem as-child>` for arrow-key nav. A pure `useTabs()` **cannot**
  absorb `RovingFocus`/`Collection`/`Presence`/`Popper` (they are component
  families). So a standalone `useTabs()` consumer gets ids/aria/selection but NOT
  roving-focus keyboard nav unless they also compose `RovingFocus`. **State this
  limit in the docs** — "headless" is bounded in v1.

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
