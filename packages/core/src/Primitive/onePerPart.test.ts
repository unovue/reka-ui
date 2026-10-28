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
import { ProgressIndicator, ProgressRoot } from '@/Progress'
import { RadioGroupIndicator, RadioGroupItem, RadioGroupRoot } from '@/RadioGroup'
import { Separator } from '@/Separator'
import { SwitchRoot, SwitchThumb } from '@/Switch'
import { TabsContent, TabsIndicator, TabsList, TabsRoot, TabsTrigger } from '@/Tabs'
import { componentNames } from '@/test'
import { Toggle } from '@/Toggle'

// One component per part: every part of these compositions renders its own
// element, so the tree holds no `Primitive` (nor a `Slot`, as nothing here uses
// `asChild`). A part built on another part (AccordionTrigger on
// CollapsibleTrigger) is two parts, each one instance.
//
// Not migrated yet (later PRs of the workstream): `RovingFocusGroup`, which
// Tabs and RadioGroup wrap around their own element (with `as-child`).
const PENDING = new Set(['RovingFocusGroup'])

/** Names of the `Primitive`/`Slot` instances, minus those under a pending wrapper. */
function primitiveNames(names: string[]) {
  const out: string[] = []
  let skip = 0
  for (const name of names) {
    if (PENDING.has(name)) {
      // A pending wrapper renders `Primitive` → `Slot` → the part's element.
      skip = 2
      continue
    }
    if (skip && (name === 'Primitive' || name === 'PrimitiveSlot')) {
      skip--
      continue
    }
    skip = 0
    if (name === 'Primitive' || name === 'PrimitiveSlot')
      out.push(name)
  }
  return out
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
}

describe('one component per part', () => {
  it.each(Object.entries(compositions))('%s renders no Primitive', async (_, render) => {
    const wrapper = mount(defineComponent({ setup: () => render }), { attachTo: document.body })
    await nextTick()
    const names = componentNames(wrapper.vm.$)
    expect(primitiveNames(names)).toEqual([])
    wrapper.unmount()
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
