import type { Ref } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { CheckboxIndicator, CheckboxRoot } from '@/Checkbox'
import { DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItemIndicator, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { ListboxContent, ListboxItem, ListboxItemIndicator, ListboxRoot } from '@/Listbox'
import { RadioGroupIndicator, RadioGroupItem, RadioGroupRoot } from '@/RadioGroup'
import { SelectContent, SelectItem, SelectItemIndicator, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectViewport } from '@/Select'

// `useLingeringPresence`, through every gated indicator: an exit that finishes
// after the part was selected again (here from an `after-leave` handler)
// emits `complete(false)` while the part is shown (or about to be, for a
// `v-model` whose prop updates on the next render). Dropping the retained
// `Presence` then would let the next deselection unmount it at once: no
// `data-ending-style`, no exit transition.

const DURATION = 150
let style: HTMLStyleElement
let wrappers: { unmount: () => void }[] = []
beforeEach(() => {
  style = document.createElement('style')
  style.textContent = `.fade { opacity: 1; transition: opacity ${DURATION}ms linear; }
    .fade[data-starting-style], .fade[data-ending-style] { opacity: 0; }`
  document.head.appendChild(style)
})
afterEach(() => {
  style.remove()
  wrappers.forEach(w => w.unmount())
  wrappers = []
})

const wait = (ms: number) => new Promise(r => setTimeout(r, ms))
/** A setter for `ref`, for the deselect / select callbacks. */
function assign<T>(ref: Ref<T>, value: T) {
  return () => {
    ref.value = value
  }
}

/** Deselect, re-select from that exit's after-leave, then deselect again. */
async function reselectInAfterLeave(deselect: () => void, select: () => void, query: () => Element | null) {
  await expect.poll(() => query()).not.toBeNull()
  await wait(DURATION + 50)
  let armed = true
  const onAfterLeave = () => {
    if (armed) {
      armed = false
      select()
    }
  }
  document.addEventListener('after-leave', onAfterLeave, true)
  deselect()
  await expect.poll(() => armed).toBe(false)
  document.removeEventListener('after-leave', onAfterLeave, true)
  await nextTick()
  await wait(DURATION + 50)
  expect(query()).not.toBeNull()
  deselect()
  await nextTick()
  await nextTick()
  const el = query()
  return { stillMounted: !!el, ending: el?.hasAttribute('data-ending-style') ?? false }
}

const EXPECTED = { stillMounted: true, ending: true }

describe('indicator re-selected from after-leave', () => {
  it('control: a plain uncheck keeps the indicator for its exit', async () => {
    const checked = ref(true)
    wrappers.push(mount(defineComponent({
      setup: () => () => h(CheckboxRoot, { 'modelValue': checked.value, 'onUpdate:modelValue': (v: any) => { checked.value = v } }, () =>
        h(CheckboxIndicator, { 'class': 'fade', 'data-testid': 'ctl' }, () => 'x')),
    }), { attachTo: document.body }))
    await expect.poll(() => document.querySelector('[data-testid=ctl]')).not.toBeNull()
    await wait(DURATION + 50)
    checked.value = false
    await nextTick()
    await nextTick()
    const el = document.querySelector('[data-testid=ctl]')
    expect({ stillMounted: !!el, ending: el?.hasAttribute('data-ending-style') ?? false }).toEqual(EXPECTED)
  })

  // Re-selected through the component (uncontrolled, a click).
  it('listboxItemIndicator, uncontrolled, re-selected by a click', async () => {
    wrappers.push(mount(defineComponent({
      setup: () => () => h(ListboxRoot, { multiple: true, defaultValue: ['a'] }, () =>
        h(ListboxContent, null, () => h(ListboxItem, { 'value': 'a', 'data-testid': 'li' }, () => ['A', h(ListboxItemIndicator, { 'class': 'fade', 'data-testid': 'lind' }, () => 'x')]))),
    }), { attachTo: document.body }))
    const click = () => (document.querySelector('[data-testid=li]') as HTMLElement).click()
    expect(await reselectInAfterLeave(click, click, () => document.querySelector('[data-testid=lind]'))).toEqual(EXPECTED)
  })

  // Re-selected through v-model (controlled; the prop updates on the next
  // render, after `complete(false)`).
  it('listboxItemIndicator, controlled v-model', async () => {
    const model = ref<string[]>(['a'])
    wrappers.push(mount(defineComponent({
      setup: () => () => h(ListboxRoot, { 'multiple': true, 'modelValue': model.value, 'onUpdate:modelValue': (v: any) => { model.value = v } }, () =>
        h(ListboxContent, null, () => h(ListboxItem, { value: 'a' }, () => ['A', h(ListboxItemIndicator, { 'class': 'fade', 'data-testid': 'lcind' }, () => 'x')]))),
    }), { attachTo: document.body }))
    expect(await reselectInAfterLeave(assign(model, []), assign(model, ['a']), () => document.querySelector('[data-testid=lcind]'))).toEqual(EXPECTED)
  })

  // Control: re-selected mid-exit (controlled) cancels the exit; fine.
  it('listboxItemIndicator, controlled, re-selected mid-exit', async () => {
    const model = ref<string[]>(['a'])
    wrappers.push(mount(defineComponent({
      setup: () => () => h(ListboxRoot, { 'multiple': true, 'modelValue': model.value, 'onUpdate:modelValue': (v: any) => { model.value = v } }, () =>
        h(ListboxContent, null, () => h(ListboxItem, { value: 'a' }, () => ['A', h(ListboxItemIndicator, { 'class': 'fade', 'data-testid': 'lmid' }, () => 'x')]))),
    }), { attachTo: document.body }))
    const q = () => document.querySelector('[data-testid=lmid]')
    await expect.poll(() => q()).not.toBeNull()
    await wait(DURATION + 50)
    model.value = []
    await wait(DURATION / 2)
    model.value = ['a']
    await wait(DURATION + 50)
    model.value = []
    await nextTick()
    await nextTick()
    expect({ stillMounted: !!q(), ending: q()?.hasAttribute('data-ending-style') ?? false }).toEqual(EXPECTED)
  })

  it('checkboxIndicator, uncontrolled, re-checked by a click', async () => {
    wrappers.push(mount(defineComponent({
      setup: () => () => h(CheckboxRoot, { 'defaultValue': true, 'data-testid': 'cb' }, () =>
        h(CheckboxIndicator, { 'class': 'fade', 'data-testid': 'cind' }, () => 'x')),
    }), { attachTo: document.body }))
    const click = () => (document.querySelector('[data-testid=cb]') as HTMLElement).click()
    expect(await reselectInAfterLeave(click, click, () => document.querySelector('[data-testid=cind]'))).toEqual(EXPECTED)
  })

  it('radioGroupIndicator, uncontrolled, re-checked by a click', async () => {
    wrappers.push(mount(defineComponent({
      setup: () => () => h(RadioGroupRoot, { defaultValue: 'a' }, () => [
        h(RadioGroupItem, { 'value': 'a', 'data-testid': 'ra' }, () => h(RadioGroupIndicator, { 'class': 'fade', 'data-testid': 'rind' }, () => 'x')),
        h(RadioGroupItem, { 'value': 'b', 'data-testid': 'rb' }, () => 'b'),
      ]),
    }), { attachTo: document.body }))
    const clickA = () => (document.querySelector('[data-testid=ra]') as HTMLElement).click()
    const clickB = () => (document.querySelector('[data-testid=rb]') as HTMLElement).click()
    expect(await reselectInAfterLeave(clickB, clickA, () => document.querySelector('[data-testid=rind]'))).toEqual(EXPECTED)
  })

  it('checkboxIndicator, controlled v-model', async () => {
    const checked = ref<boolean | 'indeterminate'>(true)
    wrappers.push(mount(defineComponent({
      setup: () => () => h(CheckboxRoot, { 'modelValue': checked.value, 'onUpdate:modelValue': (v: any) => { checked.value = v } }, () =>
        h(CheckboxIndicator, { 'class': 'fade', 'data-testid': 'ccind' }, () => 'x')),
    }), { attachTo: document.body }))
    expect(await reselectInAfterLeave(assign(checked, false), assign(checked, true), () => document.querySelector('[data-testid=ccind]'))).toEqual(EXPECTED)
  })

  it('radioGroupIndicator, controlled v-model', async () => {
    const model = ref('a')
    wrappers.push(mount(defineComponent({
      setup: () => () => h(RadioGroupRoot, { 'modelValue': model.value, 'onUpdate:modelValue': (v: any) => { model.value = v } }, () => [
        h(RadioGroupItem, { value: 'a' }, () => h(RadioGroupIndicator, { 'class': 'fade', 'data-testid': 'rcind' }, () => 'x')),
        h(RadioGroupItem, { value: 'b' }, () => 'b'),
      ]),
    }), { attachTo: document.body }))
    expect(await reselectInAfterLeave(assign(model, 'b'), assign(model, 'a'), () => document.querySelector('[data-testid=rcind]'))).toEqual(EXPECTED)
  })

  it('selectItemIndicator, controlled v-model', async () => {
    const model = ref<string[]>(['a'])
    wrappers.push(mount(defineComponent({
      setup: () => () => h(SelectRoot, { 'open': true, 'multiple': true, 'modelValue': model.value, 'onUpdate:modelValue': (v: any) => { model.value = v } }, () => [
        h(SelectTrigger, () => 'Open'),
        h(SelectPortal, () => h(SelectContent, { position: 'popper' }, () =>
          h(SelectViewport, () => h(SelectItem, { value: 'a' }, () => [
            h(SelectItemText, () => 'A'),
            h(SelectItemIndicator, { 'class': 'fade', 'data-testid': 'sind' }, () => 'x'),
          ])))),
      ]),
    }), { attachTo: document.body }))
    expect(await reselectInAfterLeave(assign(model, []), assign(model, ['a']), () => document.querySelector('[data-testid=sind]'))).toEqual(EXPECTED)
  })

  it('selectItemIndicator, controlled, re-selected mid-exit', async () => {
    const model = ref<string[]>(['a'])
    wrappers.push(mount(defineComponent({
      setup: () => () => h(SelectRoot, { 'open': true, 'multiple': true, 'modelValue': model.value, 'onUpdate:modelValue': (v: any) => { model.value = v } }, () => [
        h(SelectTrigger, () => 'Open'),
        h(SelectPortal, () => h(SelectContent, { position: 'popper' }, () =>
          h(SelectViewport, () => h(SelectItem, { value: 'a' }, () => [
            h(SelectItemText, () => 'A'),
            h(SelectItemIndicator, { 'class': 'fade', 'data-testid': 'smid' }, () => 'x'),
          ])))),
      ]),
    }), { attachTo: document.body }))
    const q = () => document.querySelector('[data-testid=smid]')
    await expect.poll(() => q()).not.toBeNull()
    await wait(DURATION + 50)
    model.value = []
    await wait(DURATION / 2)
    model.value = ['a']
    await wait(DURATION + 50)
    model.value = []
    await nextTick()
    await nextTick()
    expect({ stillMounted: !!q(), ending: q()?.hasAttribute('data-ending-style') ?? false }).toEqual(EXPECTED)
  })

  it('dropdownMenuItemIndicator, controlled v-model', async () => {
    const checked = ref(true)
    wrappers.push(mount(defineComponent({
      setup: () => () => h(DropdownMenuRoot, { open: true, modal: false }, () => [
        h(DropdownMenuTrigger, () => 'Open'),
        h(DropdownMenuPortal, () => h(DropdownMenuContent, null, () =>
          h(DropdownMenuCheckboxItem, { 'modelValue': checked.value, 'onUpdate:modelValue': (v: any) => { checked.value = v } }, () => [
            'A',
            h(DropdownMenuItemIndicator, { 'class': 'fade', 'data-testid': 'mind' }, () => 'x'),
          ]))),
      ]),
    }), { attachTo: document.body }))
    expect(await reselectInAfterLeave(assign(checked, false), assign(checked, true), () => document.querySelector('[data-testid=mind]'))).toEqual(EXPECTED)
  })

  it('a deselection that stays deselected still unmounts after its exit', async () => {
    const model = ref<string[]>(['a'])
    wrappers.push(mount(defineComponent({
      setup: () => () => h(ListboxRoot, { 'multiple': true, 'modelValue': model.value, 'onUpdate:modelValue': (v: any) => { model.value = v } }, () =>
        h(ListboxContent, null, () => h(ListboxItem, { value: 'a' }, () => ['A', h(ListboxItemIndicator, { 'class': 'fade', 'data-testid': 'lgone' }, () => 'x')]))),
    }), { attachTo: document.body }))
    const q = () => document.querySelector('[data-testid=lgone]')
    await expect.poll(() => q()).not.toBeNull()
    await wait(DURATION + 50)
    model.value = []
    await nextTick()
    await nextTick()
    expect(q()?.hasAttribute('data-ending-style')).toBe(true)
    await expect.poll(() => q()).toBeNull()
  })
})
