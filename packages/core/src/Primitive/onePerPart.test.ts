import type { VNodeChild } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from '@/Accordion'
import { AspectRatio } from '@/AspectRatio'
import { AvatarFallback, AvatarImage, AvatarRoot } from '@/Avatar'
import { CheckboxGroupRoot, CheckboxIndicator, CheckboxRoot } from '@/Checkbox'
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from '@/Collapsible'
import { FieldControl, FieldDescription, FieldError, FieldRoot } from '@/Field'
import { FormRoot } from '@/Form'
import { Label } from '@/Label'
import { ListboxContent, ListboxFilter, ListboxGroup, ListboxGroupLabel, ListboxItem, ListboxItemIndicator, ListboxRoot } from '@/Listbox'
import { ProgressIndicator, ProgressRoot } from '@/Progress'
import { RadioGroupIndicator, RadioGroupItem, RadioGroupRoot } from '@/RadioGroup'
import { Separator } from '@/Separator'
import { SwitchRoot, SwitchThumb } from '@/Switch'
import { TabsContent, TabsIndicator, TabsList, TabsRoot, TabsTrigger } from '@/Tabs'
import { TagGroupItem, TagGroupItemDelete, TagGroupItemText, TagGroupRoot } from '@/TagGroup'
import { TagsInputClear, TagsInputInput, TagsInputItem, TagsInputItemDelete, TagsInputItemText, TagsInputRoot } from '@/TagsInput'
import { componentNames } from '@/test'
import { Toggle } from '@/Toggle'
import { ToggleGroupItem, ToggleGroupRoot } from '@/ToggleGroup'
import { ToolbarButton, ToolbarLink, ToolbarRoot, ToolbarSeparator } from '@/Toolbar'
import { TreeItem, TreeRoot } from '@/Tree'

// One component per part: every part of these compositions renders its own
// element, so the tree holds no `Primitive` (nor a `Slot`, as nothing here uses
// `asChild`) and no wrapper (`RovingFocusGroup`, `RovingFocusItem`,
// `CollectionSlot`, `CollectionItem`). A part built on another part
// (AccordionTrigger on CollapsibleTrigger) is two parts, each one instance.
const WRAPPERS = new Set(['Primitive', 'PrimitiveSlot', 'RovingFocusGroup', 'RovingFocusItem', 'CollectionSlot', 'CollectionItem'])

/** Names of the wrapper instances in the tree. */
function wrapperNames(names: string[]) {
  return names.filter(name => WRAPPERS.has(name))
}
const compositions: Record<string, () => VNodeChild> = {
  Separator: () => h(Separator),
  Label: () => h(Label, { for: 'x' }, () => 'Name'),
  Avatar: () => h(AvatarRoot, () => [h(AvatarImage, { src: 'data:,' }), h(AvatarFallback, () => 'CT')]),
  AspectRatio: () => h(AspectRatio, { ratio: 2 }, () => h('span')),
  Checkbox: () => h(CheckboxRoot, { defaultValue: true }, () => h(CheckboxIndicator)),
  CheckboxGroup: () => h(CheckboxGroupRoot, { rovingFocus: false, defaultValue: ['a'] }, () => [
    h(CheckboxRoot, { value: 'a' }, () => h(CheckboxIndicator)),
    h(CheckboxRoot, { value: 'b' }),
  ]),
  Switch: () => h(SwitchRoot, { defaultValue: true }, () => h(SwitchThumb)),
  Toggle: () => h(Toggle, { defaultValue: true }, () => 'B'),
  Progress: () => h(ProgressRoot, { modelValue: 40 }, () => h(ProgressIndicator)),
  Collapsible: () => h(CollapsibleRoot, { defaultOpen: true }, () => [
    h(CollapsibleTrigger, () => 'Toggle'),
    h(CollapsibleContent, () => 'Content'),
  ]),
  Accordion: () => h(AccordionRoot, { type: 'single', defaultValue: 'a' }, () => h(AccordionItem, { value: 'a' }, () => [
    h(AccordionHeader, () => h(AccordionTrigger, () => 'A')),
    h(AccordionContent, () => 'Content'),
  ])),
  Tabs: () => h(TabsRoot, { defaultValue: 'a' }, () => [
    h(TabsList, () => [h(TabsTrigger, { value: 'a' }, () => 'A'), h(TabsTrigger, { value: 'b' }, () => 'B'), h(TabsIndicator)]),
    h(TabsContent, { value: 'a' }, () => 'A content'),
    h(TabsContent, { value: 'b' }, () => 'B content'),
  ]),
  RadioGroup: () => h(RadioGroupRoot, { defaultValue: 'a' }, () => [
    h(RadioGroupItem, { value: 'a' }, () => h(RadioGroupIndicator)),
    h(RadioGroupItem, { value: 'b' }),
  ]),
  Field: () => h(FieldRoot, { name: 'f' }, () => [
    h(FieldControl),
    h(FieldDescription, () => 'Help'),
    h(FieldError, { forceMount: true }, () => 'Error'),
  ]),
  Form: () => h(FormRoot, () => h('button', 'Submit')),
  Listbox: () => h(ListboxRoot, { defaultValue: 'a' }, () => [
    h(ListboxFilter),
    h(ListboxContent, () => h(ListboxGroup, () => [
      h(ListboxGroupLabel, () => 'Fruits'),
      h(ListboxItem, { value: 'a' }, () => ['Apple', h(ListboxItemIndicator, () => '✓')]),
      h(ListboxItem, { value: 'b' }, () => 'Banana'),
    ])),
  ]),
  Toolbar: () => h(ToolbarRoot, () => [
    h(ToolbarButton, () => 'Bold'),
    h(ToolbarSeparator),
    h(ToolbarLink, { href: '#' }, () => 'Link'),
  ]),
  TagGroup: () => h(TagGroupRoot, { onRemove: () => {} }, () => [
    h(TagGroupItem, { value: 'a' }, () => [h(TagGroupItemText, () => 'A'), h(TagGroupItemDelete)]),
    h(TagGroupItem, { value: 'b' }, () => h(TagGroupItemText, () => 'B')),
  ]),
  TagsInput: () => h(TagsInputRoot, { defaultValue: ['a'] }, () => [
    h(TagsInputItem, { value: 'a' }, () => [h(TagsInputItemText), h(TagsInputItemDelete)]),
    h(TagsInputInput),
    h(TagsInputClear),
  ]),
  Tree: () => h(TreeRoot, { items: [{ id: 'a' }, { id: 'b' }], getKey: (item: Record<string, any>) => item.id }, {
    default: ({ flattenItems }: { flattenItems: { _id: string, value: Record<string, any>, level: number }[] }) =>
      flattenItems.map(item => h(TreeItem, { key: item._id, value: item.value, level: item.level }, () => item._id)),
  }),
}

describe('one component per part', () => {
  it.each(Object.entries(compositions))('%s renders no wrapper', async (_, render) => {
    const wrapper = mount(defineComponent({ setup: () => render }), { attachTo: document.body })
    await nextTick()
    const names = componentNames(wrapper.vm.$)
    expect(wrapperNames(names)).toEqual([])
    wrapper.unmount()
  })

  it('a roving CheckboxGroup renders its element through RovingFocusGroup alone', () => {
    const wrapper = mount(defineComponent({
      setup: () => () => h(CheckboxGroupRoot, { defaultValue: ['a'] }, () => h(CheckboxRoot, { value: 'a' })),
    }))
    // `rovingFocus` can be switched, which swaps the group in or out (and so
    // re-mounts the items): the group stays a component, one instance.
    expect(wrapperNames(componentNames(wrapper.vm.$))).toEqual(['RovingFocusGroup'])
  })

  it('a ToggleGroup keeps one swappable wrapper around its element', () => {
    const wrapper = mount(defineComponent({
      props: { rovingFocus: Boolean },
      setup: props => () => h(ToggleGroupRoot, { type: 'single', rovingFocus: props.rovingFocus }, () => [
        h(ToggleGroupItem, { value: 'a' }, () => 'A'),
        h(ToggleGroupItem, { value: 'b' }, () => 'B'),
      ]),
    }), { props: { rovingFocus: true } })
    // `RovingFocusGroup as-child` (or a `Slot` without roving focus) around
    // the root's own element; no `Primitive`.
    expect(wrapperNames(componentNames(wrapper.vm.$))).toEqual(['RovingFocusGroup', 'PrimitiveSlot'])
    return wrapper.setProps({ rovingFocus: false }).then(() => {
      expect(wrapperNames(componentNames(wrapper.vm.$))).toEqual(['PrimitiveSlot'])
    })
  })

  it('a roving group binds its attrs between the consumer\'s and the part\'s own', async () => {
    const wrapper = mount(defineComponent({
      setup: () => () => h(TabsRoot, { defaultValue: 'a' }, () => h(TabsList, {
        'class': 'list',
        'style': { outline: '1px solid red', color: 'red' },
        'tabindex': 5,
        'role': 'menu',
        'data-orientation': 'vertical',
      }, () => h(TabsTrigger, { value: 'a' }, () => 'A'))),
    }))
    await nextTick()
    const list = wrapper.find('.list')
    // The group's bindings win over the consumer's ...
    expect(list.attributes('tabindex')).toBe('0')
    expect(list.attributes('data-orientation')).toBe('horizontal')
    expect((list.element as HTMLElement).style.outline).toBe('none')
    expect((list.element as HTMLElement).style.color).toBe('red')
    // ... and the part's own win over both.
    expect(list.attributes('role')).toBe('tablist')
  })

  it('a checkbox in a roving group is a roving item without a wrapper', () => {
    const wrapper = mount(defineComponent({
      setup: () => () => h(CheckboxGroupRoot, { defaultValue: ['a'] }, () => [
        h(CheckboxRoot, { value: 'a' }),
        h(CheckboxRoot, { value: 'b', disabled: true }),
      ]),
    }))
    const names = componentNames(wrapper.vm.$)
    expect(names).not.toContain('RovingFocusItem')
    const [a, b] = wrapper.findAll('button')
    // The roving bindings land on the checkbox's own button.
    expect(a.attributes('tabindex')).toBe('-1')
    expect(a.attributes('data-reka-collection-item')).toBe('')
    expect(b.attributes('data-disabled')).toBe('')
  })
})
