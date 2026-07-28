import type { ComponentOptions } from 'vue'
import { describe, expect, it } from 'vitest'

const sources = import.meta.glob<string>('../**/*.vue', { eager: true, query: '?raw', import: 'default' })
const loaders = import.meta.glob<ComponentOptions>('../**/*.vue', { import: 'default' })

/**
 * Every `key: UNDEFINED_DEFAULT` entry found in a `withDefaults()` call, as
 * `[file, propName]` pairs.
 */
const entries = Object.entries(sources).flatMap(([file, source]) =>
  Array.from(source.matchAll(/(\w+): UNDEFINED_DEFAULT\b/g), match => [file, match[1]] as const),
)

describe('undefined prop defaults', () => {
  // Pinned so that dropping an entry — which would silently let Vue cast the
  // prop to `false` when it is absent — has to be an explicit, reviewed change
  // rather than a passing "cleanup".
  it('is used by exactly these props', () => {
    expect(entries.map(([file, prop]) => `${file.replace('../', '')} ${prop}`).sort()).toMatchInlineSnapshot(`
      [
        "Accordion/AccordionItem.vue unmountOnHide",
        "AlertDialog/AlertDialogContent.vue disableOutsidePointerEvents",
        "Autocomplete/AutocompleteRoot.vue open",
        "Collapsible/CollapsibleRoot.vue open",
        "Combobox/ComboboxRoot.vue open",
        "ConfigProvider/_ConfigProvider.vue scrollBody",
        "ContextMenu/ContextMenuSub.vue open",
        "DatePicker/DatePickerRoot.vue open",
        "DateRangePicker/DateRangePickerRoot.vue open",
        "Dialog/DialogContent.vue disableOutsidePointerEvents",
        "Dialog/DialogRoot.vue open",
        "Drawer/DrawerRoot.vue open",
        "DropdownMenu/DropdownMenuRoot.vue open",
        "DropdownMenu/DropdownMenuSub.vue open",
        "HoverCard/HoverCardRoot.vue open",
        "Menu/MenuSub.vue open",
        "Menubar/MenubarSub.vue open",
        "Popover/PopoverRoot.vue open",
        "RadioGroup/Radio.vue checked",
        "Select/SelectRoot.vue open",
        "Toast/ToastRoot.vue open",
        "Toggle/Toggle.vue modelValue",
        "Tooltip/TooltipContentImpl.vue asChild",
        "Tooltip/TooltipContentImpl.vue avoidCollisions",
        "Tooltip/TooltipContentImpl.vue hideWhenDetached",
        "Tooltip/TooltipRoot.vue disableClosingTrigger",
        "Tooltip/TooltipRoot.vue disableHoverableContent",
        "Tooltip/TooltipRoot.vue disabled",
        "Tooltip/TooltipRoot.vue ignoreNonKeyboardFocus",
        "Tooltip/TooltipRoot.vue open",
        "VisuallyHidden/VisuallyHiddenInput.vue checked",
        "VisuallyHidden/VisuallyHiddenInputBubble.vue checked",
      ]
    `)
  })

  // Vue casts an absent `Boolean` prop to `false` unless the prop declaration
  // owns a `default` key (`resolvePropValue`: `isAbsent && !hasDefault`).
  // Components using UNDEFINED_DEFAULT rely on the prop staying `undefined`, so
  // the compiled declaration must keep that key and resolve it to `undefined`.
  it.each(entries)('%s keeps %s absent instead of casting it to false', async (file, propName) => {
    const component = await loaders[file]!()
    const declaration = (component.props as Record<string, object>)[propName]

    expect(declaration, `${propName} is not a declared prop`).toBeDefined()
    expect(Object.hasOwn(declaration, 'default')).toBe(true)
    expect((declaration as { default: unknown }).default).toBeUndefined()
  })
})
