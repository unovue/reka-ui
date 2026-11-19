import type { VueWrapper } from '@vue/test-utils'
import type { Component, VNode } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'
import { AccordionItem, AccordionRoot, AccordionTrigger } from '@/Accordion'
import { CalendarNext, CalendarPrev, CalendarRoot } from '@/Calendar'
import { CheckboxRoot } from '@/Checkbox'
import { CollapsibleRoot, CollapsibleTrigger } from '@/Collapsible'
import { ColorFieldInput, ColorFieldRoot } from '@/ColorField'
import { ComboboxAnchor, ComboboxRoot, ComboboxTrigger } from '@/Combobox'
import { DatePickerRoot, DatePickerTrigger } from '@/DatePicker'
import { DateRangePickerRoot, DateRangePickerTrigger } from '@/DateRangePicker'
import { DrawerRoot, DrawerSwipeArea } from '@/Drawer'
import { DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { EditableCancelTrigger, EditableEditTrigger, EditableInput, EditableRoot, EditableSubmitTrigger } from '@/Editable'
import { MenubarMenu, MenubarRoot, MenubarTrigger } from '@/Menubar'
import { MonthPickerNext, MonthPickerPrev, MonthPickerRoot } from '@/MonthPicker'
import { MonthRangePickerNext, MonthRangePickerPrev, MonthRangePickerRoot } from '@/MonthRangePicker'
import { NavigationMenuItem, NavigationMenuList, NavigationMenuRoot, NavigationMenuTrigger } from '@/NavigationMenu'
import { PaginationFirst, PaginationLast, PaginationList, PaginationListItem, PaginationNext, PaginationPrev, PaginationRoot } from '@/Pagination'
import { PinInputInput, PinInputRoot } from '@/PinInput'
import { RangeCalendarNext, RangeCalendarPrev, RangeCalendarRoot } from '@/RangeCalendar'
import { SelectRoot, SelectTrigger } from '@/Select'
import { SwitchRoot } from '@/Switch'
import { TabsList, TabsRoot, TabsTrigger } from '@/Tabs'
import { TagsInputInput, TagsInputRoot } from '@/TagsInput'
import { Toggle } from '@/Toggle'
import { ToolbarButton, ToolbarRoot } from '@/Toolbar'
import { YearPickerNext, YearPickerPrev, YearPickerRoot } from '@/YearPicker'
import { YearRangePickerNext, YearRangePickerPrev, YearRangePickerRoot } from '@/YearRangePicker'

// Parts that render a `<button>` by default bind `disabled`. Rendered as an element without a
// `disabled` DOM property, an enabled part used to get `disabled="false"`, which `[disabled]` matches.
interface Case {
  name: string
  render: (disabled: boolean, as: string) => VNode
}

const target = { 'data-testid': 'target' }

function part(component: Component, as: string, props: Record<string, unknown> = {}) {
  return h(component as any, { ...target, as, ...props }, () => 'part')
}

// The part takes `disabled` itself
function own(name: string, component: Component, wrap: (child: VNode) => VNode = child => child): Case {
  return { name, render: (disabled, as) => wrap(part(component, as, { disabled })) }
}

// The part reads `disabled` from its root
function fromRoot(name: string, root: Component, component: Component, rootProps: Record<string, unknown> = {}, wrap: (child: VNode) => VNode = child => child): Case {
  return { name, render: (disabled, as) => h(root as any, { ...rootProps, disabled }, () => wrap(part(component, as))) }
}

const page = { total: 30, itemsPerPage: 10, defaultPage: 2 }

const cases: Case[] = [
  fromRoot('AccordionTrigger', AccordionRoot, AccordionTrigger, { type: 'single' }, child => h(AccordionItem, { value: 'a' }, () => child)),
  fromRoot('CalendarPrev', CalendarRoot, CalendarPrev),
  fromRoot('CalendarNext', CalendarRoot, CalendarNext),
  own('CheckboxRoot', CheckboxRoot),
  fromRoot('CollapsibleTrigger', CollapsibleRoot, CollapsibleTrigger),
  fromRoot('ColorFieldInput', ColorFieldRoot, ColorFieldInput),
  fromRoot('ComboboxTrigger', ComboboxRoot, ComboboxTrigger, {}, child => h(ComboboxAnchor, () => child)),
  fromRoot('DatePickerTrigger', DatePickerRoot, DatePickerTrigger),
  fromRoot('DateRangePickerTrigger', DateRangePickerRoot, DateRangePickerTrigger),
  {
    name: 'DrawerSwipeArea',
    render: (disabled, as) => h(DrawerRoot, () => part(DrawerSwipeArea, as, { disabled })),
  },
  {
    name: 'DropdownMenuTrigger',
    render: (disabled, as) => h(DropdownMenuRoot, () => part(DropdownMenuTrigger, as, { disabled })),
  },
  fromRoot('EditableCancelTrigger', EditableRoot, EditableCancelTrigger),
  fromRoot('EditableEditTrigger', EditableRoot, EditableEditTrigger),
  fromRoot('EditableInput', EditableRoot, EditableInput, { startWithEditMode: true }),
  fromRoot('EditableSubmitTrigger', EditableRoot, EditableSubmitTrigger),
  {
    name: 'MenubarTrigger',
    render: (disabled, as) => h(MenubarRoot, () => h(MenubarMenu, () => part(MenubarTrigger, as, { disabled }))),
  },
  fromRoot('MonthPickerPrev', MonthPickerRoot, MonthPickerPrev),
  fromRoot('MonthPickerNext', MonthPickerRoot, MonthPickerNext),
  fromRoot('MonthRangePickerPrev', MonthRangePickerRoot, MonthRangePickerPrev),
  fromRoot('MonthRangePickerNext', MonthRangePickerRoot, MonthRangePickerNext),
  {
    name: 'NavigationMenuTrigger',
    render: (disabled, as) => h(NavigationMenuRoot, () => h(NavigationMenuList, () => h(NavigationMenuItem, () => part(NavigationMenuTrigger, as, { disabled })))),
  },
  fromRoot('PaginationFirst', PaginationRoot, PaginationFirst, page),
  fromRoot('PaginationPrev', PaginationRoot, PaginationPrev, page),
  fromRoot('PaginationNext', PaginationRoot, PaginationNext, page),
  fromRoot('PaginationLast', PaginationRoot, PaginationLast, page),
  fromRoot('PaginationListItem', PaginationRoot, PaginationListItem, page, child => h(PaginationList, () => h(child, { value: 1 }))),
  fromRoot('PinInputInput', PinInputRoot, PinInputInput, {}, child => h(child, { index: 0 })),
  fromRoot('RangeCalendarPrev', RangeCalendarRoot, RangeCalendarPrev),
  fromRoot('RangeCalendarNext', RangeCalendarRoot, RangeCalendarNext),
  fromRoot('SelectTrigger', SelectRoot, SelectTrigger),
  own('SwitchRoot', SwitchRoot),
  {
    name: 'TabsTrigger',
    render: (disabled, as) => h(TabsRoot, () => h(TabsList, () => part(TabsTrigger, as, { disabled, value: 'a' }))),
  },
  fromRoot('TagsInputInput', TagsInputRoot, TagsInputInput),
  own('Toggle', Toggle),
  {
    name: 'ToolbarButton',
    render: (disabled, as) => h(ToolbarRoot, () => part(ToolbarButton, as, { disabled })),
  },
  fromRoot('YearPickerPrev', YearPickerRoot, YearPickerPrev),
  fromRoot('YearPickerNext', YearPickerRoot, YearPickerNext),
  fromRoot('YearRangePickerPrev', YearRangePickerRoot, YearRangePickerPrev),
  fromRoot('YearRangePickerNext', YearRangePickerRoot, YearRangePickerNext),
]

const mounted: VueWrapper[] = []

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
})

function render(c: Case, disabled: boolean, as: string) {
  const wrapper = mount({ render: () => c.render(disabled, as) }, { attachTo: document.body })
  mounted.push(wrapper)
  const el = document.querySelector('[data-testid="target"]')!
  return { wrapper, el }
}

describe.each(cases)('$name', (c) => {
  it.each(['div', 'span', 'a'])('omits the disabled attribute when enabled and rendered as %s', (as) => {
    const { el } = render(c, false, as)
    expect(el.tagName).toBe(as.toUpperCase())
    expect(el.hasAttribute('disabled')).toBe(false)
    expect(el.matches('[disabled]')).toBe(false)
  })

  it('keeps disabled="true" when disabled and rendered as a div', () => {
    const { el } = render(c, true, 'div')
    expect(el.getAttribute('disabled')).toBe('true')
  })

  it('keeps the native disabled state when rendered as a button', () => {
    const enabled = render(c, false, 'button')
    expect((enabled.el as HTMLButtonElement).disabled).toBe(false)
    expect(enabled.el.hasAttribute('disabled')).toBe(false)
    enabled.wrapper.unmount()
    document.body.innerHTML = ''

    const disabled = render(c, true, 'button')
    expect((disabled.el as HTMLButtonElement).disabled).toBe(true)
    expect(disabled.el.getAttribute('disabled')).toBe('')
  })
})
