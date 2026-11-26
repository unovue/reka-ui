import type { VueWrapper } from '@vue/test-utils'
import type { Component, VNode } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { CalendarNext, CalendarRoot } from '@/Calendar'
import { CarouselAutoplayToggle, CarouselContent, CarouselItem, CarouselRoot, CarouselViewport } from '@/Carousel'
import { CollapsibleRoot, CollapsibleTrigger } from '@/Collapsible'
import { DatePickerRoot, DatePickerTrigger } from '@/DatePicker'
import { DateRangePickerRoot, DateRangePickerTrigger } from '@/DateRangePicker'
import { DialogClose, DialogRoot, DialogTrigger } from '@/Dialog'
import { DrawerClose, DrawerRoot, DrawerSwipeArea, DrawerTrigger } from '@/Drawer'
import { DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { EditableEditTrigger, EditableRoot } from '@/Editable'
import { MenubarMenu, MenubarRoot, MenubarTrigger } from '@/Menubar'
import { NavigationMenuItem, NavigationMenuList, NavigationMenuRoot, NavigationMenuTrigger } from '@/NavigationMenu'
import { NumberFieldDecrement, NumberFieldIncrement, NumberFieldRoot } from '@/NumberField'
import { PaginationFirst, PaginationLast, PaginationList, PaginationListItem, PaginationNext, PaginationPrev, PaginationRoot } from '@/Pagination'
import { PopoverClose, PopoverRoot, PopoverTrigger } from '@/Popover'
import { Primitive } from '@/Primitive'
import { RadioGroupItem, RadioGroupRoot } from '@/RadioGroup'
import { SelectRoot, SelectTrigger } from '@/Select'
import { StepperItem, StepperRoot, StepperTrigger } from '@/Stepper'
import { SwitchRoot } from '@/Switch'
import { TabsList, TabsRoot, TabsTrigger } from '@/Tabs'
import { TagGroupItem, TagGroupItemDelete, TagGroupRoot } from '@/TagGroup'
import { Toggle } from '@/Toggle'
import { ToggleGroupItem, ToggleGroupRoot } from '@/ToggleGroup'
import { ToolbarButton, ToolbarRoot, ToolbarToggleGroup, ToolbarToggleItem } from '@/Toolbar'
import { TooltipProvider, TooltipRoot, TooltipTrigger } from '@/Tooltip'
import { ariaDisabledAttr } from './disabledAttr'

// The native `disabled` attribute only works on form controls. A part rendered as anything else must
// expose its disabled state with `aria-disabled`, and a part rendered as a `<button>` must not change.

type As = string | Component | { asChild: () => VNode }

const target = { 'data-testid': 'target' }

function part(component: Component, as: As, props: Record<string, unknown> = {}) {
  if (typeof as === 'object' && 'asChild' in as)
    return h(component as any, { ...target, ...props, asChild: true }, as.asChild)
  return h(component as any, { ...target, as, ...props }, () => 'part')
}

interface Case {
  name: string
  render: (disabled: boolean, as: As) => VNode
}

function own(name: string, component: Component, props: Record<string, unknown> = {}, wrap: (child: VNode) => VNode = child => child): Case {
  return { name, render: (disabled, as) => wrap(part(component, as, { ...props, disabled })) }
}

function fromRoot(name: string, root: Component, component: Component, rootProps: Record<string, unknown> = {}, wrap: (child: VNode) => VNode = child => child): Case {
  return { name, render: (disabled, as) => h(root as any, { ...rootProps, disabled }, () => wrap(part(component, as))) }
}

const page = { total: 30, itemsPerPage: 10, defaultPage: 2 }

const cases: Case[] = [
  {
    name: 'CarouselAutoplayToggle',
    render: (disabled, as) => h(CarouselRoot, { 'aria-label': 'Slides', 'autoplay': !disabled }, () => [
      h(CarouselViewport, () => h(CarouselContent, () => h(CarouselItem, () => 'One'))),
      part(CarouselAutoplayToggle, as),
    ]),
  },
  fromRoot('CollapsibleTrigger', CollapsibleRoot, CollapsibleTrigger),
  fromRoot('DatePickerTrigger', DatePickerRoot, DatePickerTrigger),
  fromRoot('DateRangePickerTrigger', DateRangePickerRoot, DateRangePickerTrigger),
  { name: 'DropdownMenuTrigger', render: (disabled, as) => h(DropdownMenuRoot, () => part(DropdownMenuTrigger, as, { disabled })) },
  { name: 'MenubarTrigger', render: (disabled, as) => h(MenubarRoot, () => h(MenubarMenu, () => part(MenubarTrigger, as, { disabled }))) },
  {
    name: 'NavigationMenuTrigger',
    render: (disabled, as) => h(NavigationMenuRoot, () => h(NavigationMenuList, () => h(NavigationMenuItem, () => part(NavigationMenuTrigger, as, { disabled })))),
  },
  fromRoot('NumberFieldIncrement', NumberFieldRoot, NumberFieldIncrement),
  fromRoot('NumberFieldDecrement', NumberFieldRoot, NumberFieldDecrement),
  fromRoot('PaginationFirst', PaginationRoot, PaginationFirst, page),
  fromRoot('PaginationPrev', PaginationRoot, PaginationPrev, page),
  fromRoot('PaginationNext', PaginationRoot, PaginationNext, page),
  fromRoot('PaginationLast', PaginationRoot, PaginationLast, page),
  fromRoot('PaginationListItem', PaginationRoot, PaginationListItem, page, child => h(PaginationList, () => h(child, { value: 1 }))),
  own('RadioGroupItem', RadioGroupItem, { value: 'a' }, child => h(RadioGroupRoot, () => child)),
  fromRoot('RadioGroupItem (disabled group)', RadioGroupRoot, RadioGroupItem, {}, child => h(child, { value: 'a' })),
  fromRoot('SelectTrigger', SelectRoot, SelectTrigger),
  {
    name: 'StepperTrigger',
    render: (disabled, as) => h(StepperRoot, () => h(StepperItem, { step: 1, disabled }, () => part(StepperTrigger, as))),
  },
  own('SwitchRoot', SwitchRoot),
  { name: 'TabsTrigger', render: (disabled, as) => h(TabsRoot, () => h(TabsList, () => part(TabsTrigger, as, { disabled, value: 'a' }))) },
  {
    name: 'TagGroupItemDelete',
    render: (disabled, as) => h(TagGroupRoot, { 'aria-label': 'Tags' }, () => h(TagGroupItem, { value: 'a', disabled }, () => part(TagGroupItemDelete, as))),
  },
  own('Toggle', Toggle),
  own('ToggleGroupItem', ToggleGroupItem, { value: 'a' }, child => h(ToggleGroupRoot, { type: 'single' }, () => child)),
  { name: 'ToolbarButton', render: (disabled, as) => h(ToolbarRoot, () => part(ToolbarButton, as, { disabled })) },
  {
    name: 'ToolbarToggleItem',
    render: (disabled, as) => h(ToolbarRoot, () => h(ToolbarToggleGroup, { type: 'single' }, () => part(ToolbarToggleItem, as, { disabled, value: 'a' }))),
  },
]

// Parts without a `disabled` prop of their own: a consumer sets `disabled` on them as an attribute
function attr(name: string, component: Component, wrap: (child: VNode) => VNode): Case {
  return { name, render: (disabled, as) => wrap(part(component, as, { disabled: disabled || undefined })) }
}

cases.push(
  attr('DialogTrigger', DialogTrigger, child => h(DialogRoot, () => child)),
  attr('DialogClose', DialogClose, child => h(DialogRoot, () => child)),
  attr('DrawerTrigger', DrawerTrigger, child => h(DrawerRoot, () => child)),
  attr('DrawerClose', DrawerClose, child => h(DrawerRoot, () => child)),
  attr('PopoverTrigger', PopoverTrigger, child => h(PopoverRoot, () => child)),
  attr('PopoverClose', PopoverClose, child => h(PopoverRoot, () => child)),
  attr('TooltipTrigger', TooltipTrigger, child => h(TooltipProvider, () => h(TooltipRoot, () => child))),
)

const mounted: VueWrapper[] = []

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
})

function render(vnode: () => VNode) {
  const wrapper = mount({ render: vnode }, { attachTo: document.body })
  mounted.push(wrapper)
  return document.querySelector('[data-testid="target"]')!
}

describe('ariaDisabledAttr', () => {
  it.each(['div', 'span', 'a', 'li'])('returns "true" for a disabled %s', (tag) => {
    expect(ariaDisabledAttr(tag, { disabled: true })).toBe('true')
    expect(ariaDisabledAttr(tag, { disabled: '' })).toBe('true')
  })

  it.each(['button', 'input', 'select', 'textarea', 'fieldset', 'option', 'optgroup'])('returns nothing for a native %s', (tag) => {
    expect(ariaDisabledAttr(tag, { disabled: true })).toBeUndefined()
  })

  it('returns nothing when enabled, for a component, a custom element, a template, or an existing aria-disabled', () => {
    expect(ariaDisabledAttr('div', {})).toBeUndefined()
    expect(ariaDisabledAttr('div', { disabled: false })).toBeUndefined()
    expect(ariaDisabledAttr('div', { disabled: undefined })).toBeUndefined()
    expect(ariaDisabledAttr(defineComponent({}), { disabled: true })).toBeUndefined()
    expect(ariaDisabledAttr('my-element', { disabled: true })).toBeUndefined()
    expect(ariaDisabledAttr('template', { disabled: true })).toBeUndefined()
    expect(ariaDisabledAttr('div', { 'disabled': true, 'aria-disabled': 'false' })).toBeUndefined()
    expect(ariaDisabledAttr('div', { 'disabled': true, 'aria-disabled': null })).toBeUndefined()
  })
})

describe('primitive', () => {
  const primitive = (props: Record<string, unknown>, child?: () => VNode) => render(() => h(Primitive, { ...target, ...props }, child ?? (() => 'part')))

  it.each(['div', 'span', 'a'])('adds aria-disabled="true" to a disabled %s', (as) => {
    const el = primitive({ as, disabled: '' })
    expect(el.getAttribute('aria-disabled')).toBe('true')
    expect(el.getAttribute('disabled')).toBe('')
  })

  it('adds nothing to an enabled div', () => {
    expect(primitive({ as: 'div' }).hasAttribute('aria-disabled')).toBe(false)
  })

  it('adds nothing to a disabled button', () => {
    const el = primitive({ as: 'button', disabled: '' })
    expect(el.outerHTML).toBe('<button data-testid="target" disabled="">part</button>')
  })

  it('keeps an aria-disabled already set', () => {
    expect(primitive({ 'as': 'div', 'disabled': '', 'aria-disabled': 'false' }).getAttribute('aria-disabled')).toBe('false')
  })

  it('adds nothing when aria-disabled is null', () => {
    expect(primitive({ 'as': 'div', 'disabled': '', 'aria-disabled': null }).hasAttribute('aria-disabled')).toBe(false)
  })

  it('adds aria-disabled="true" to a disabled div child with asChild', () => {
    const el = primitive({ asChild: true, disabled: '' }, () => h('div', 'part'))
    expect(el.tagName).toBe('DIV')
    expect(el.getAttribute('aria-disabled')).toBe('true')
  })

  it('adds nothing to a disabled button child with asChild', () => {
    const el = primitive({ asChild: true, disabled: '' }, () => h('button', 'part'))
    expect(el.outerHTML).toBe('<button data-testid="target" disabled="">part</button>')
  })

  it('keeps an aria-disabled set on the asChild child', () => {
    const el = primitive({ asChild: true, disabled: '' }, () => h('div', { 'aria-disabled': 'false' }, 'part'))
    expect(el.getAttribute('aria-disabled')).toBe('false')
  })

  it('passes nothing to a component', () => {
    const Child = defineComponent({ inheritAttrs: false, setup: (_, { attrs }) => () => h('div', { 'data-testid': 'target', 'data-attrs': Object.keys(attrs).join(',') }) })
    const el = render(() => h(Primitive, { as: Child, disabled: '' }))
    expect(el.getAttribute('data-attrs')).toBe('disabled')
  })

  it('updates when the disabled state changes', async () => {
    const wrapper = mount(defineComponent({
      props: { disabled: Boolean },
      setup: props => () => h(Primitive, { ...target, as: 'span', disabled: props.disabled ? '' : undefined }, () => 'part'),
    }), { props: { disabled: true }, attachTo: document.body })
    mounted.push(wrapper)
    const el = wrapper.get('[data-testid="target"]')
    expect(el.attributes('aria-disabled')).toBe('true')
    await wrapper.setProps({ disabled: false })
    expect(el.attributes('aria-disabled')).toBeUndefined()
  })
})

describe.each(cases)('$name', (c) => {
  it.each(['div', 'span', 'a'])('adds aria-disabled="true" when disabled and rendered as %s', (as) => {
    const el = render(() => c.render(true, as))
    expect(el.tagName).toBe(as.toUpperCase())
    expect(el.getAttribute('aria-disabled')).toBe('true')
  })

  it('adds no aria-disabled when enabled and rendered as a div', () => {
    expect(render(() => c.render(false, 'div')).hasAttribute('aria-disabled')).toBe(false)
  })

  it('relies on the native disabled when rendered as a button', () => {
    const el = render(() => c.render(true, 'button')) as HTMLButtonElement
    expect(el.disabled).toBe(true)
    expect(el.hasAttribute('aria-disabled')).toBe(false)
  })

  it('adds aria-disabled="true" to a div child with `asChild` when disabled', () => {
    const el = render(() => c.render(true, { asChild: () => h('div', 'part') }))
    expect(el.tagName).toBe('DIV')
    expect(el.getAttribute('aria-disabled')).toBe('true')
  })

  it('adds no aria-disabled to a button child with `asChild` when disabled', () => {
    const el = render(() => c.render(true, { asChild: () => h('button', 'part') })) as HTMLButtonElement
    expect(el.disabled).toBe(true)
    expect(el.hasAttribute('aria-disabled')).toBe(false)
  })
})

describe('parts with their own aria-disabled, and containers', () => {
  it('keeps the value EditableEditTrigger sets', () => {
    expect(render(() => h(EditableRoot, { disabled: true }, () => part(EditableEditTrigger, 'div'))).getAttribute('aria-disabled')).toBe('')
  })

  it('keeps the value CalendarNext sets on a button', () => {
    expect(render(() => h(CalendarRoot, { disabled: true }, () => part(CalendarNext, 'button'))).getAttribute('aria-disabled')).toBe('true')
  })

  it('adds nothing to DrawerSwipeArea', () => {
    expect(render(() => h(DrawerRoot, () => part(DrawerSwipeArea, 'div', { disabled: true }))).hasAttribute('aria-disabled')).toBe(false)
  })

  it('adds nothing to StepperItem', () => {
    expect(render(() => h(StepperRoot, () => part(StepperItem, 'div', { step: 1, disabled: true }))).hasAttribute('aria-disabled')).toBe(false)
  })
})
