# Headless Composable Migration Recipe (`useX()`)

> Status: **validated on Switch (form-control archetype) + Tabs (collection /
> per-item / roving-focus archetype) + Menu (overlay archetype).** The pilots have
> shipped; the recipe is ready to batch-apply to the tiers below, still one family
> per PR with its own characterization gate. Updated for the accepted foundation
> decisions of #2823 (`data-state` axes), #2828 (`beforeUpdate` + details) and the
> #2723 export policy — the pilots are retrofitted in the same PR.

Every component family gains a `useX()` composable holding its logic/state; the
`.vue` SFC becomes a thin shell. Components keep their exact public API — this is
an internal re-architecture that additively exposes the logic as a new public API.

## The contract

Each rendered part returns a **`PartSurface`**, the shared contract homed in
`@/shared` (`shared/partSurface.ts`), imported as `import type { PartSurface } from '@/shared'`:

```ts
export interface PartSurface<S extends PartState = PartState> {
  props: ComputedRef<Record<string, any>> // aria/role/value/id?/handlers — NO data-*
  state: ComputedRef<S> // semantic state ({ state: 'checked', disabled })
  attrs: ComputedRef<Record<string, any>> // mergeProps(stateToDataAttrs(state), props) — bind THIS
}
```

Build one with `createPartSurface(props, state, mapping?)` (internal, from
`@/shared`): it wraps getters in `computed` and derives `attrs` through the shared
`stateToDataAttrs` — the SAME function `useRender` (#2722) uses, so a part that
renders through `useRender` passes `state` straight in and gets identical `data-*`.
Nobody hand-builds `{ props, state }` and nobody calls `stateToDataAttrs` from an
SFC or a consumer any more: **bind `surface.attrs.value` and never touch the
vocabulary.** `stateToDataAttrs` and `createPartSurface` stay internal (not on the
package root).

`useX()` returns `{ ...topLevelState, ...methods, <part>: PartSurface, context }`.

### The model: `useControllableState`

Every root composable owns its model through the shared `useControllableState`
(#2828) — the shell no longer calls `useVModel`:

```ts
const { state: checked, setState: setChecked } = useControllableState<boolean, SwitchChangeReason>({
  prop: () => toValue(props.modelValue), // getter → undefined = uncontrolled
  defaultValue: () => toValue(props.defaultValue) ?? false,
  name: 'modelValue',
  emit: props.emit, // the shell hands `defineEmits`' emit …
  onBeforeUpdate: props.onBeforeUpdate, // … a standalone consumer hands callbacks
  onUpdate: props.onUpdate,
})
```

- `setState(value, reason, event)` runs `onBeforeUpdate` + the cancellable
  `beforeUpdate:<name>` emit, then (unless `details.cancel()` was called) writes
  and fires `onUpdate` + `update:<name>`. It returns `false` when unchanged or
  cancelled. Details are the **second emit arg** — the shell declares both:
  `'beforeUpdate:<name>': [value, details]` and `'update:<name>': [value, details]`,
  typed with `ChangeEventDetails<<Family>ChangeReason>`.
- Every internal change site passes a **reason** (`'click'`, `'escape-key'`, …) and
  the native event; `reason` defaults to `'imperative-action'` for bare
  `setState(v)` calls. Name the union `<Family>ChangeReason` and export it.
- In controlled mode with `emit`/`onUpdate` **nothing is written** — the owning
  parent's `update:` handler does. A writable `Ref` with neither is "ref-owned" and
  is written back (the standalone-consumer convenience).
- `lastChangeDetails` is a read-only ref of the most recent details (initially
  `{ reason: 'none' }`); pass it to `Presence`-style consumers that need the reason
  after the fact.

### `data-state` is two axes

`state.state` must be typed with the shared axes from `shared/dataState`, never a
per-family string literal: `DisclosureState` (`'open' | 'closed'`) for anything that
shows/hides, `SelectionState` (`'checked' | 'unchecked'`) or `TriSelectionState`
(+ `'indeterminate'`) for anything selected. Derive with `disclosureState(open)` /
`selectionState(checked)`. Families whose literal values differ today
(`'active' | 'inactive'`, `'on' | 'off'`, …) keep them until the #2823 rename PR
lands — that PR only changes the values, not the shape.

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
   verbatim (incl. load-bearing factory-default hacks), `defineEmits` (declaring
   `beforeUpdate:<name>` + `update:<name>`, handed to the composable as `emit` —
   no `useVModel`), `useForwardExpose`/`useForwardScopeId`, `useFormControl` +
   DOM-bound computeds
   (e.g. the `[for]` label lookup, SSR-guarded by `currentElement`), `id`/`type`/
   tag-dependent bindings, `defineExpose` parity, the hidden-input `v-if` gate, and
   Presence/Teleport/Popper wrappers. The SFC builds the context via the composable
   then calls `provideX(context)` — never `provide` inside the composable.
4. **Bind `attrs` with `mergeProps`, NEVER object spread:**
   `v-bind="mergeProps(part.attrs.value, scopeIdAttrs, $attrs)"` (drop `$attrs` when
   the SFC keeps `inheritAttrs: true`). Object spread makes a consumer's `onClick` in
   `$attrs` clobber the part's handler. Never call `stateToDataAttrs` in an SFC.
5. **Export policy.** The family `index.ts` keeps exporting its components exactly
   as before; the composable-specific additions are limited to `useX` +
   `UseXProps` / `UseXReturn` / `<Family><Part>State` / `<Family>ChangeReason`.
   Builders (`get<...>Surface`, `create<...>Surface`) are internal: importable by
   the family's own SFCs, not re-exported. Overlay composables export from the family index only
   — that index is reachable via `reka-ui/internal`, not the package root. Do the
   **collision audit** against `vue` (`useId`), `@vueuse/core` (`useToggle`!), and
   common Nuxt auto-imports first; rename on a clash (`useTogglePressed`).
   Every composable carries `@experimental` plus a `@lifecycle pure|setup` JSDoc tag
   (`pure` = no hooks, callable outside `setup()`; `setup` = mount-bound).
6. **Verify:** characterization + existing `*.test.ts` untouched + new
   `useX.test.ts` (effectScope/mount harness for families with watchers) + axe +
   `type-check` + family-scoped `docs:gen` (real diff must be empty — build first;
   generic SFCs may show tool noise, re-diff on a clean checkout).

## Collection / per-item families (validated on Tabs)

The Switch archetype has one attr-bearing root. Collection families (Tabs,
RadioGroup, Accordion, ToggleGroup) differ — the attr-bearing logic is **per item**,
computed from `(context, itemValue)`. What converting Tabs settled:

- **Per-item surfaces are context-PURE builders — not just getters and not methods
  on the return.** Define free functions `get<Family><Part>Surface(context, value,
  disabled?)` returning a `PartSurface` (via `createPartSurface`) — naming: `get<...>`
  = pure `(context, value)` derivation, safe to call any number of times;
  `create<...>` = once-per-instance factory (see overlays). Both stay internal —
  deriving everything from the **context** (`makeTriggerId(context.baseId, value)`,
  `aria-controls` from `context.contentIds`, `aria-selected`/`data-state` from
  `context.modelValue`), imported by the SFC but not exported from the family
  index. This is the crux: the **descendant part SFC injects the
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
  and `v-bind="part.attrs.value"` needs **no explicit `$attrs`** (nor `mergeProps`). Only add `$attrs` to `mergeProps` when the SFC
  sets `inheritAttrs: false`.
- **Component-wrapper behaviors stay wrappers in v1.** `TabsTrigger` wraps
  `<RovingFocusItem as-child>` for arrow-key nav; `TabsContent` wraps `<Presence>`.
  A pure `useTabs()` **cannot** absorb `RovingFocus`/`Collection`/`Presence`/`Popper`
  (they are component families). So a standalone `useTabs()` consumer gets
  ids/aria/selection but NOT roving-focus keyboard nav or presence mount/unmount
  unless they also compose those components. **State this limit in the docs** —
  "headless" is bounded in v1.
- **`useId`/SSR-ids stay in the shell.** The root SFC passes
  `baseId: useId(undefined, 'reka-<family>')` in. The composable's standalone
  default must be **unique per call** — a module-level counter
  (`` `reka-<family>-${++count}` ``), never a shared literal: two standalone
  instances on one page would otherwise collide on every trigger/content id.
  That counter is **NOT SSR-stable**: server and client count independently, so
  a standalone consumer that renders on the server MUST pass an explicit
  `baseId` (the SFCs do, via `useId`) or hydration ids mismatch. It stays
  callable outside `setup()` (Tabs is computed-only — no watchers/lifecycle in
  the composable). Never call `useId` inside the composable.

### Disclosure refinement (validated on Accordion)

Accordion confirms the collection contract but adds a nested disclosure wrapper and
one stateful factory boundary:

- **The root is state/context-only; parts start at the item.** `AccordionRoot`
  renders no Accordion-specific attrs, so `useAccordion()` returns model state,
  `changeModelValue`, the frozen-shape root context, and `getItemSurface(value)`.
  There is no empty root `PartSurface` merely to satisfy a shape.
- **The item surface is a once-per-item factory.** `getAccordionItemSurface()` owns
  the item's `open`/`disabled` computeds plus the root-element-backed arrow-key
  handler. It returns the item/header/trigger/content surfaces for standalone use.
  The descendant SFCs inject the existing item context and call the same exported
  header/trigger/content builders, so aria/handlers/state do not fork into an SFC-
  only implementation.
- **Component wrappers stay wrappers, but can consume surfaces.** `AccordionItem`,
  `AccordionTrigger`, and `AccordionContent` keep `CollapsibleRoot`/
  `CollapsibleTrigger`/`CollapsibleContent`; their surfaces carry the wrapper inputs
  (`open`, `disabled`, `unmountOnHide`) and Accordion attrs/handlers. Collapsible's
  Presence, measurement, animation suppression, and `beforematch` listener remain
  inside Collapsible.
- **Functional selectors still live in `props`.** The trigger's
  `data-reka-collection-item` is queried by arrow navigation, so it is the same
  functional-data exemption established by Menu, not semantic state.
- **Per-trigger SSR ids stay in the Trigger shell.** Existing Accordion ids are
  allocation-order-based rather than `(baseId, value)`-derived. `AccordionTrigger`
  therefore keeps `useId` and writes the id into the existing item context before
  building trigger/content surfaces. Standalone `getItemSurface` calls derive a
  reactive trigger id from `(baseId, value)`, with a literal `reka-accordion`
  default; callers can still override `triggerId` explicitly.

## Overlay families (validated on Menu)

Overlays (Menu/DropdownMenu, Dialog, Popover, Select, Combobox) differ again: the
ROOT renders no attrs, and the behavior lives in a Content part wrapped by component
families (FocusScope/DismissableLayer/Presence/Popper/RovingFocus). Converting the
core Menu parts settled the overlay contract:

- **The root is state-only: `{ state, context }`, no `PartSurface`.** `useMenuRoot()`
  returns `open`/`onOpenChange`/`onClose` + the context object(s) the SFC provides.
  The family is not surface-free — surfaces begin at Trigger/Content. Positioning
  (`PopperRoot`) and portal stay wrappers.
- **Per-item overlay builders are context-SCOPED FACTORIES, not pure builders.**
  Unlike Tabs' idempotent `(context, value)` derivations, `createMenuItemSurface`
  creates per-instance state (`isFocused`) and closes over the item's `currentElement`
  — call it EXACTLY ONCE per instance, and name it `create<...>Surface` so the
  once-only contract is visible at the call site (`get<...>` is reserved for pure
  derivations). `state`/`props` computeds stay pure; the factory instantiates.
  **This is the Tabs axiom that does NOT survive overlays.**
- **Only true functional selectors are exempt from the no-`data-*` rule.**
  `data-reka-menu-content` (submenu `closest()` scoping) and
  `data-reka-collection-item` are selectors, not semantic state — they live in
  `props`. `data-disabled` is NOT one of them: it is semantic state, derived from
  `state.disabled` through `stateToDataAttrs` (that is what `useMenu.ts` and its
  test do), and `useArrowNavigation`'s `[data-reka-collection-item]:not([data-disabled])`
  selector reads the derived attribute. Dropping a selector degrades UX with no
  test failure — keep the pair in `props`; keep everything else in `state`.
- **Close-on-select is a callback channel, not a merged listener.** The item's
  `CustomEvent(ITEM_SELECT, { cancelable })` is a token: emit it, `await nextTick()`,
  close unless `defaultPrevented`. Expose it as an `onSelect(event)` option; the SFC
  passes `e => emits('select', e)`. Never bind it as a DOM listener.
- **The Content "brain" extracts; the wrappers are the shell.** Typeahead, arrow-nav,
  the pointer-grace machine, and `highlightedElement` ownership are wrapper-independent
  — `useMenuContent()` took `MenuContentImpl` from 405→191 lines, returning the
  `role=menu` surface + the content context; FocusScope/DismissableLayer/
  RovingFocusGroup/PopperContent + `useFocusGuards`/`useBodyScrollLock` stay in the
  SFC. The one seam that can't move is `RovingFocusGroup.getItems()` (a template-
  instance ref) — inject it as a `getItems` option.
- **Overlay composables are mount-lifecycle-bound** (`useIsUsingKeyboard`, the content
  watchers/`onUnmounted`) — NOT callable outside `setup()`; test in a mount harness.
- **Overlay part ids derive from the root's `baseId` in the composable** (Dialog:
  `contentId`/`titleId`/`descriptionId` = `` `${baseId}-content` `` …), NOT back-filled
  onto the context by descendant SFCs via `rootContext.x ||= useId(...)`. The context
  shape stays a plain `string` but is populated up-front, so a standalone consumer —
  and a trigger-less dialog — get real ids, and every part reads the same value
  from the context. The one `useId` call still lives in the root SFC.
- **Provider-coupled families keep the coupling in the shell** (validated on
  Tooltip). `useTooltip()` takes every provider-influenced input as a getter
  (`delayDuration`, `isOpenDelayed`, `isPointerInTransit`, …); `TooltipRoot.vue`
  resolves `props.x ?? providerContext.x.value` into those getters and keeps the
  `watch(open)` that notifies the provider / dispatches `TOOLTIP_OPEN`. Read a
  provider ref through its property on every access (`() => provider.ref.value`),
  never snapshot it — `TooltipContentHoverable` REASSIGNS the transit ref. A part
  with per-instance state (the tooltip trigger's `isPointerDown` /
  `hasPointerMoveOpened`) is a `create<...>Surface` factory even when the family
  is otherwise pure.

## Dependency- and structure-ordered migration (not size)

- **Overlays: contract validated on Menu (see above).** The remaining overlays
  (Dialog/Popover/Tooltip/HoverCard/Select/Combobox) render **no root attrs**
  (`PopoverRoot` is `<PopperRoot><slot/></PopperRoot>`) and share Menu's shape. Convert
  them **jointly with #2724** (which rewrites overlay internals) so the state-only-root
  + brain-composable + wrappers-stay-wrappers contract lands once, not twice.
- **Convert dependencies first.** Families that snapshot a child's `exposed`
  (`ComboboxRoot` reads `ListboxRoot`'s exposed methods) require the dependency
  converted first: **Listbox → Combobox → Select**.
- **Tiers:** (1) form/toggle: Checkbox, RadioGroup, ToggleGroup, Toggle; (2)
  collection/disclosure: Tabs ✓(gate), Accordion ✓, Collapsible; (3) delegation
  chains: Listbox → Combobox → Select; (4) overlays — Menu ✓(contract), rest joint
  with #2724; (5) date/calendar family last (heavy generics; `useDateField` is
  already composable-shaped — the house prior art for this whole effort).

## Footguns

- Getters/`toValue`, never raw `props.x` snapshots (freezes reactivity).
- Never write the model directly (`modelValue.value = x`) — every change goes
  through `setState(value, reason, event)` so `beforeUpdate` can cancel it and the
  details reach the consumer.
- `details.cancel()` is synchronous: an `await` before it turns it into a warned
  no-op.
- No `document` at call scope (SSR).
- Port handler bodies verbatim — do NOT add guards the SFC lacks (Switch has no
  modifier guard on `@keydown.enter.prevent`).
- `export *` publishes `UseXProps`/`UseXReturn` instantly — name deliberately.
- `<part>.state` and the part SFC must not become two sources of truth that drift;
  share the derivation (both read the same `checked`/`disabled` refs).
- `defineExpose` is component-bound — re-expose the same refs from composable state.
