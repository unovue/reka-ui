---
title: Migration - v2 to v3 with an AI agent
description: The v2 to v3 migration guide rewritten as instructions for an AI coding agent. Point your agent at this page and review the diff.
---

# Migration - v2 to v3 with an AI agent

<Description>
The v2 to v3 migration guide rewritten as instructions for an AI coding agent. Point your agent at this page and review the diff.
</Description>

<llm-exclude>

## How to use this page

Everything below the line is written for an AI coding agent (Claude Code, Cursor, Copilot, Codex, …), not for you. Hand it to the agent as the raw markdown of this page, which the site serves at the same path with a `.md` extension, and ask it to migrate your project:

```sh
claude "Read https://reka-ui.com/docs/guides/migration-v3-agent.md and migrate this project from Reka UI v2 to v3."
```

The agent applies the mechanical rewrites, asks you about the few cases that need a decision, and finishes with a report of what it changed. Review that diff the way you would review a pull request; the human-readable version of the same changes is the [Migration to v3](./migration-v3) guide.

Reka UI v3 is still in progress, so this page grows as breaking changes land on the `v3` branch. Re-run the migration against the latest version of this page when you upgrade to a newer v3 pre-release.

---

</llm-exclude>

## Instructions for the agent

You are migrating a Vue project from Reka UI v2 to Reka UI v3. Work through the sections below in order. Each one says what changed, how to find the affected code, the rules for rewriting it, and how to verify the result. Apply the mechanical rewrites yourself. Where a rule says *ask*, stop and ask the developer instead of guessing. Do not change anything this page does not ask you to change: component names, props, slots and `v-model` bindings are unchanged in v3.

### Before you start

1. Record a baseline: run the project's type-check, lint and test commands and note what already fails, so you can tell your changes apart from pre-existing failures.
2. Upgrade the dependency to the v3 line (`reka-ui@^3`, or the exact pre-release the developer asked for) with the project's package manager, and check that any Nuxt module or resolver usage (`reka-ui/nuxt`, `reka-ui/resolver`) resolves after the upgrade.
3. Decide the search scope: every `.vue`, `.ts`, `.tsx`, `.js`, `.jsx`, `.css`, `.scss`, `.html` and `.md` file in the project's own source, plus shared styling files such as `cva` / `tailwind-variants` / `class-variance-authority` definitions, UnoCSS shortcuts and design-token files. Skip `node_modules`, build output and lockfiles.

### 1. `data-state` vocabulary

**What changed.** `data-state` now answers exactly one of two questions. Disclosure ("is this surface revealed?") is `open` or `closed`. Selection ("is this control in its affirmative state?") is `checked` or `unchecked`, with `indeterminate` only on tri-state controls. Both values are always emitted, so `data-state` is never absent, and qualifiers such as *how* a surface opened live in their own attribute. Three multi-value machines are exempt: Progress (`indeterminate` / `loading` / `complete`) and the Splitter resize handle (`drag` / `hover` / `inactive`) are unchanged, and Stepper keeps `completed` but renames `active` / `inactive` to `current` / `upcoming`.

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
| `TooltipTrigger`, `TooltipContent` | `closed` / `delayed-open` / `instant-open` | `open` / `closed`, plus a boolean `data-delayed` attribute while open when the open was delayed |
| Everything already on `open` / `closed` or `checked` / `unchecked` / `indeterminate` | unchanged | unchanged |

**How to find it.** Search the scope for these patterns (case-sensitive, all of them):

- Tailwind variants: `data-[state=`, `group-data-[state=`, `peer-data-[state=`, including quoted values such as `data-[state='on']` and named groups such as `group-data-[state=open]/item`.
- CSS attribute selectors: `[data-state=`, `[data-state =`, with single, double or no quotes.
- Presence-only selectors: `[data-state]` and `:not([data-state])`.
- JavaScript reads: `dataset.state`, `getAttribute('data-state')`, `data-state` inside test assertions and snapshot files.

**Rewrite rules.**

- Only rewrite a selector or read that targets a Reka UI part: the element is a Reka component, the class or variant is applied to one, or the shared style is consumed by one. `data-state` is a common convention, so custom components and other libraries in the project may emit the same words (`open`, `expanded`, `active`, …); those are out of scope and must stay as they are. When a selector's target is unclear, leave it unchanged and *ask*, listing the file and line.
- For a Reka UI part, the following values map the same way whichever part it is: `on` → `checked`, `off` → `unchecked`, `visible` → `open`, `hidden` → `closed`, `expanded` → `open`, `collapsed` → `closed`, `instant-open` → `open`.
- `delayed-open` → `open` **and** `data-delayed`. In Tailwind: `data-[state=delayed-open]:` → `data-[state=open]:data-[delayed]:` (keep any `group-` / `peer-` prefix and `/name` suffix on both variants; on Tailwind 3 the bare `data-delayed:` form does not exist, so always use `data-[delayed]:`). In CSS: `[data-state='delayed-open']` → `[data-state='open'][data-delayed]`. If a rule targeted `instant-open` specifically, use `[data-state='open']:not([data-delayed])` in CSS.
- `active` / `inactive` depend on the component the selector styles, so decide **per selector**, not per file:
  - Tabs, TagsInput or Rating → `checked` / `unchecked`.
  - Stepper → `current` / `upcoming` (`completed` is unchanged).
  - The Splitter resize handle → keep `inactive` as it is.
  - Work out the component from the element the class or selector applies to: the Reka component it is rendered on, the component name in a `cva` / variants object or its consumer, a class name such as `.TabsTrigger` or `.StepperItem`, or the surrounding markup. A shared variants file that serves both Tabs and Stepper must be split so each gets its own value. If you cannot tell which component a selector styles, leave it unchanged and *ask*, listing the file and line.
- Presence-only selectors on a Reka UI part: because both values are now always present, `[data-state]` matches every part and `:not([data-state])` matches nothing. Rewrite them to the explicit value they were standing in for: an unlit `RatingItemIndicator` is `unchecked`, a non-collapsible `SplitterPanel` is `open`, a `CollapsibleContent` on its first mount is `open` or `closed` like any other.
- JavaScript reads of a Reka UI part follow the same mapping as the selectors (`el.dataset.state === 'active'` on a tab becomes `'checked'`). Update test assertions and re-record snapshots that contain the old values.
- Leave alone: `data-orientation`, `data-side`, `data-align`, `data-disabled`, `data-highlighted`, `data-selected`, `data-active` (that one is the roving-focus tab stop, unrelated to `data-state`), and every value that is already `open` / `closed` / `checked` / `unchecked` / `indeterminate`.

**Verify.** After the rewrite, a search for `data-[state=` and `[data-state` must show no `on`, `off`, `visible`, `hidden`, `expanded`, `collapsed`, `delayed-open` or `instant-open`, and `active` / `inactive` only on Splitter resize-handle selectors (`inactive`) or on selectors you deliberately left for the developer to decide. Presence-only `[data-state]` selectors must be gone.

### 2. Change events carry details

**What changed.** `update:*` events on stateful roots now receive a second argument, a `ChangeEventDetails` object with `reason`, `event`, `isCanceled` and `cancel()`, and a cancellable `beforeUpdate:*` event fires before every change. `v-model` keeps working unchanged. Uncontrolled components emit synchronously from the interaction instead of from a watcher on the next tick, and a component that mounts uncontrolled and later receives a defined model value becomes controlled from then on, even if the model is later cleared to `undefined`.

Converted so far: `SwitchRoot`, `TabsRoot` (`modelValue`), `DropdownMenuRoot`, `DropdownMenuSub`, `ContextMenuRoot`, `ContextMenuSub`, `MenubarSub`, `DialogRoot`, `AlertDialogRoot`, `PopoverRoot`, `TooltipRoot`, `HoverCardRoot`, `DatePickerRoot` and `DateRangePickerRoot` (`open`). Treat every other family as still on the v2 single-argument shape; the [Migration to v3](./migration-v3) guide lists the families as they convert.

**How to find it.** Search for listeners and emit declarations on those roots: `@update:open`, `@update:model-value`, `@update:modelValue`, `'update:open'`, `'update:modelValue'`, `onUpdate:open`, `onUpdate:modelValue`, `defineEmits` in components that wrap one of the roots, `useForwardPropsEmits`, `emitted('update:open')` and `toHaveBeenCalledWith` in tests, and `watch(` calls that react to these models.

**Rewrite rules.**

- A listener that only reads the first argument keeps working. Leave it unchanged.
- A wrapper component that re-declares the emit type needs the new tuple shape, importing the details type and the family's reason union from `reka-ui`:

  ```ts
  'update:open': [value: boolean] // [!code --]
  'update:open': [value: boolean, details: ChangeEventDetails<DialogOpenChangeReason>] // [!code ++]
  ```

  The reason unions, all exported from `reka-ui`, are `DialogOpenChangeReason`, `PopoverOpenChangeReason`, `TooltipOpenChangeReason`, `HoverCardOpenChangeReason`, `MenuOpenChangeReason` (shared by the DropdownMenu, ContextMenu and Menubar parts), `SwitchChangeReason`, `TabsChangeReason`, `DatePickerOpenChangeReason` and `DateRangePickerOpenChangeReason`. `details.reason` is the family union plus the shared `BaseChangeReason` (`'imperative-action'` for programmatic changes such as a slot's `close()`), so a `switch` over the family union alone is incomplete.
- Wrappers that forward with `useForwardPropsEmits` need no change.
- Tests: an assertion such as `expect(emit).toHaveBeenCalledWith(true)` or `expect(wrapper.emitted('update:open')[0]).toEqual([true])` now fails because of the extra argument. Assert on the first element (`[0][0]`) or use `expect.objectContaining({ reason: '…' })` for the details. Tests that awaited a tick for an uncontrolled emit may now see it synchronously; remove waits only if the test's intent is unchanged.
- A `watch` on the model that relied on the old next-tick emit ordering may observe the change one tick earlier. Only change such code if a test or the developer confirms the ordering mattered.
- Do not add `beforeUpdate:*` handlers on your own; they are an opportunity (cancel a close while a form is dirty, for example), not a migration requirement.

**Verify.** The project's type-check must pass. Every test that asserts on an `update:*` payload of a converted family must pass.

### 3. ESM only

**What changed.** v3 ships ES modules only. The CommonJS build and the `require` export conditions are gone, for `reka-ui` and for its `reka-ui/nuxt`, `reka-ui/resolver`, `reka-ui/namespaced`, `reka-ui/date`, `reka-ui/constant` and `reka-ui/internal` entries.

**How to find it.** Search for `require('reka-ui` and `require("reka-ui`, and check the test runner and any Node scripts that load the package.

**Rewrite rules.** Replace `require()` with `import` (or dynamic `import()` inside CommonJS files). Vite, Nuxt and Vitest need nothing else. Jest projects need ESM support for the package: either run Jest in ESM mode or add `reka-ui` to `transformIgnorePatterns` exceptions so it is transformed. If the project's own package is CommonJS and cannot move to ESM, *ask* before restructuring it.

**Verify.** The build and the test runner start without a "Cannot use import statement" or "require() of ES Module" error.

### 4. Generated ids

**What changed.** The ids Reka UI generates for overlay parts (Dialog content, title and description; Popover trigger and content; the Tooltip label the trigger's `aria-describedby` points at) are now derived from the root, so their shape differs from v2 (for example `reka-tooltip-<n>-content` instead of `reka-tooltip-content-<n>`).

**How to find it.** Search for `reka-dialog-`, `reka-popover-`, `reka-tooltip-` and for `aria-describedby` / `aria-labelledby` / `aria-controls` values in tests and selectors.

**Rewrite rules.** Never depend on the shape of a generated id. In tests, select by role, label or text (`getByRole('dialog')`, `getByRole('tooltip')`) or compare the attribute to the id read from the other element. In CSS, style by data attribute or class, not by generated id. Code that passes its own `id` to a part is unaffected.

### Report

When you are done, give the developer:

1. The list of files you changed, grouped by the section above that required the change.
2. Every `active` / `inactive` selector and every `require()` you left unchanged because the rule said to ask, with file and line.
3. The result of the type-check, lint and test commands, compared with the baseline you recorded at the start.
