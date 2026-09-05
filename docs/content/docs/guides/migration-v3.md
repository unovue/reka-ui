---
title: Migration - v2 to v3
description: This guide collects the breaking changes between Reka UI v2 and v3, with search-and-replace instructions for each of them.
---

# Migration - v2 to v3

<Description>
This guide collects the breaking changes between Reka UI v2 and v3, with search-and-replace instructions for each of them.
</Description>

Reka UI v3 is still in progress. This page collects the breaking changes as they land on the `v3` branch, so it will keep growing until the release is finalized. Each section describes what changed and the mechanical rewrite needed to move an existing v2 codebase over.

Prefer to hand the mechanical work to an AI agent? [Migrating with an AI agent](./migration-v3-agent) is this guide rewritten as instructions for one: point your agent at it, let it apply the rewrites, and review the diff.

## `data-state` vocabulary

In v3, `data-state` answers exactly one of two questions: disclosure ("is this surface revealed?") is reported as `open` or `closed`, and selection ("is this control in its affirmative state?") is reported as `checked` or `unchecked`, with `indeterminate` reserved for tri-state controls that also emit `aria-checked="mixed"`. Both values are always emitted—`data-state` is never absent—and qualifiers such as *how* a surface came to be open live in their own `data-*` attribute rather than in `data-state`.

Parts that were already on `open` / `closed` or `checked` / `unchecked` / `indeterminate` are unchanged. Genuine multi-value machines keep a vocabulary of their own: [Progress](../components/progress) (`indeterminate` / `loading` / `complete`) and the [Splitter](../components/splitter) resize handle (`drag` / `hover` / `inactive`) are untouched, while [Stepper](../components/stepper) keeps `completed` but renames `active` / `inactive` to `current` / `upcoming`, so that its words are neither synonyms of the two axes nor the same as Tabs' old `active` / `inactive`.

| Part | v2 | v3 |
| --- | --- | --- |
| `Toggle`, `ToggleGroupItem`, `ToolbarToggleItem` | `on` / `off` | `checked` / `unchecked` |
| `TabsTrigger`, `TabsContent` | `active` / `inactive` | `checked` / `unchecked` |
| `TagsInputItem`, `TagsInputItemDelete` | `active` / `inactive` | `checked` / `unchecked` |
| `RatingItemIndicator` | `active` / (absent) | `checked` / `unchecked` |
| `StepperItem`, `StepperTrigger`, `StepperSeparator` | `completed` / `active` / `inactive` | `completed` / `current` / `upcoming` |
| `ScrollAreaScrollbar`, `ScrollAreaThumb`, `NavigationMenuIndicator` | `visible` / `hidden` | `open` / `closed` |
| `SplitterPanel` | `expanded` / `collapsed` / (absent when not collapsible) | `open` / `closed` (non-collapsible panels are always `open`) |
| `CollapsibleContent` | `open` / `closed` / (absent on the initial animated mount) | `open` / `closed` |
| `TooltipTrigger`, `TooltipContent` | `closed` / `delayed-open` / `instant-open` | `open` / `closed`, plus a boolean `data-delayed` attribute present while open when the open was delayed |
| Everything already on `open` / `closed` or `checked` / `unchecked` / `indeterminate` | unchanged | unchanged |

### Search and replace

The rewrites are mechanical. In Tailwind variants:

- `data-[state=on]:` → `data-[state=checked]:`, `data-[state=off]:` → `data-[state=unchecked]:`
- `data-[state=active]:` → `data-[state=checked]:`, `data-[state=inactive]:` → `data-[state=unchecked]:` — for **Tabs, TagsInput and Rating only**.
- `data-[state=active]:` → `data-[state=current]:`, `data-[state=inactive]:` → `data-[state=upcoming]:` — for **Stepper only** (`data-[state=completed]:` is unchanged). Only the Splitter resize handle still emits `inactive`, so leave selectors on `SplitterResizeHandle` alone.
- `data-[state=visible]:` → `data-[state=open]:`, `data-[state=hidden]:` → `data-[state=closed]:`
- `data-[state=expanded]:` → `data-[state=open]:`, `data-[state=collapsed]:` → `data-[state=closed]:`
- `data-[state=delayed-open]:` → `data-[state=open]:data-[delayed]:`
- `data-[state=instant-open]:` → `data-[state=open]:` (combine with `:not([data-delayed])` in plain CSS if you need to target instant opens specifically)

In plain CSS the same rewrites apply to attribute selectors:

- `[data-state='on']` → `[data-state='checked']`, `[data-state='off']` → `[data-state='unchecked']`
- `[data-state='active']` → `[data-state='checked']`, `[data-state='inactive']` → `[data-state='unchecked']` — Tabs, TagsInput and Rating only.
- `[data-state='active']` → `[data-state='current']`, `[data-state='inactive']` → `[data-state='upcoming']` — Stepper only; `[data-state='completed']` is unchanged and the Splitter resize handle keeps `inactive`.
- `[data-state='visible']` → `[data-state='open']`, `[data-state='hidden']` → `[data-state='closed']`
- `[data-state='expanded']` → `[data-state='open']`, `[data-state='collapsed']` → `[data-state='closed']`
- `[data-state='delayed-open']` → `[data-state='open'][data-delayed]`
- `[data-state='instant-open']` → `[data-state='open']:not([data-delayed])`

Because both values are now always emitted, any styles that relied on the attribute being *absent* (for example `.RatingItemIndicator:not([data-state])`, or a `SplitterPanel` without `data-state` because it is not collapsible) should target the explicit `unchecked` / `open` value instead.

```css
.Toggle[data-state='on'] { /* [!code --] */
.Toggle[data-state='checked'] { /* [!code ++] */
  background-color: var(--green-5);
}

.TabsTrigger[data-state='active'] { /* [!code --] */
.TabsTrigger[data-state='checked'] { /* [!code ++] */
  color: var(--grass-11);
}

.StepperItem[data-state='active'] .StepperIndicator { /* [!code --] */
.StepperItem[data-state='current'] .StepperIndicator { /* [!code ++] */
  background-color: var(--mauve-12);
}

.TooltipContent[data-state='delayed-open'][data-side='top'] { /* [!code --] */
.TooltipContent[data-state='open'][data-delayed][data-side='top'] { /* [!code ++] */
  animation-name: slideDownAndFade;
}
```

## Change events carry details

`update:*` events on stateful roots now receive a second argument, a `ChangeEventDetails` object, and a cancellable `beforeUpdate:*` event fires before every change. `v-model` keeps working unchanged. The details tell you *why* the state changed (`details.reason`) and which native event caused it (`details.event`), and `details.cancel()` inside `beforeUpdate:*` keeps the current state.

Converted so far: `SwitchRoot`, `TabsRoot`, `Toggle`, `ToggleGroupRoot`, `CheckboxRoot`, `CheckboxGroupRoot`, `RadioGroupRoot` (`modelValue`), `DropdownMenuRoot`, `DropdownMenuSub`, `ContextMenuRoot`, `ContextMenuSub`, `MenubarSub`, `DialogRoot`, `AlertDialogRoot`, `PopoverRoot`, `TooltipRoot`, `HoverCardRoot`, `DatePickerRoot` and `DateRangePickerRoot` (`open`). The remaining families follow as they move to their headless composables.

A change to a value that is already current no longer emits: `update:modelValue` fires only when the value actually changes, so re-pressing the checked radio or the selected single-mode toggle emits nothing (the `select` event on `RadioGroupItem` still fires).

Each family exports its reason union, for example `DialogOpenChangeReason` (`'trigger-press' | 'close-press' | 'escape-key' | 'outside-press' | 'focus-outside'`) or `TooltipOpenChangeReason` (`'trigger-hover' | 'trigger-leave' | 'trigger-focus' | 'trigger-blur' | 'trigger-press' | 'content-leave' | 'escape-key' | 'outside-press'`). Those unions only list the interaction reasons: `details.reason` is typed as the family union plus the shared `BaseChangeReason`, so every family also reports `'imperative-action'` for programmatic changes such as the slot's `close()`, and a `switch` written against the family union alone misses it. A delayed hover open on Tooltip and HoverCard reports `trigger-hover` with the pointer event that armed the timer.

What to check in your code:

- Explicit `@update:open` / `@update:model-value` listeners receive an extra argument. Handlers that only read the first argument keep working; handlers typed with a single-parameter signature still type-check.
- Wrappers that re-declare the emit types need the new tuple shape:

  ```ts
  'update:open': [value: boolean] // [!code --]
  'update:open': [value: boolean, details: ChangeEventDetails<DialogOpenChangeReason>] // [!code ++]
  ```

- Uncontrolled components emit synchronously from the interaction instead of from a watcher on the next tick. Code that relied on the old timing may observe the difference.
- A component that mounts uncontrolled and later receives a defined model value becomes controlled at that point and stays controlled, even if the model is later cleared to `undefined`.

```vue
<DialogRoot
  v-model:open="open"
  @before-update:open="(value, details) => {
    // keep the dialog open while the form is dirty, but let the close button through
    if (!value && isDirty && details.reason !== 'close-press')
      details.cancel()
  }"
/>
```
