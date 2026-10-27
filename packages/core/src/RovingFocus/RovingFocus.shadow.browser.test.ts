import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { RadioGroupItem, RadioGroupRoot } from '@/RadioGroup'
import { mountInShadowRoot } from '@/shared/test/shadowDom'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/Tabs'

// Roving focus (Tabs, RadioGroup, Toolbar, …) moves focus by comparing the
// active element before and after `focus()`; that comparison must read the
// shadow root's active element, not `document.activeElement` (the host).
describe('given roving focus inside a shadow root, in a real browser', () => {
  it('moves between Tabs with the arrow keys, Home/End, and activates them', async () => {
    const tab = ref('one')
    const { get, activeElement } = mountInShadowRoot(defineComponent({
      setup: () => () => h('div', [
        h('button', { 'data-testid': 'before' }, 'Before'),
        h(TabsRoot, { 'modelValue': tab.value, 'onUpdate:modelValue': (v: string) => { tab.value = v } }, () => [
          h(TabsList, { 'aria-label': 'Tabs' }, () => ['one', 'two', 'three'].map(value =>
            h(TabsTrigger, { 'value': value, 'data-testid': `tab-${value}` }, () => value))),
          ...['one', 'two', 'three'].map(value => h(TabsContent, { 'value': value, 'data-testid': `panel-${value}` }, () => value)),
        ]),
      ]),
    }))

    get('before')!.focus()
    await userEvent.keyboard('{Tab}')
    expect(activeElement()).toBe(get('tab-one'))
    await userEvent.keyboard('{ArrowRight}')
    expect(activeElement()).toBe(get('tab-two'))
    await expect.poll(() => tab.value).toBe('two')
    await userEvent.keyboard('{End}')
    expect(activeElement()).toBe(get('tab-three'))
    await userEvent.keyboard('{ArrowRight}')
    expect(activeElement()).toBe(get('tab-one'))
    await userEvent.keyboard('{Home}')
    expect(activeElement()).toBe(get('tab-one'))
    // Tab leaves the list for the active panel.
    await userEvent.keyboard('{Tab}')
    expect(activeElement()).toBe(get('panel-one'))
    expect(get('tab-one')!.getAttribute('aria-controls')).toBe(get('panel-one')!.id)
  })

  it('moves and checks RadioGroup items with the arrow keys', async () => {
    const value = ref('a')
    const { get, activeElement } = mountInShadowRoot(defineComponent({
      setup: () => () => h('div', [
        h('button', { 'data-testid': 'before' }, 'Before'),
        h(RadioGroupRoot, { 'modelValue': value.value, 'onUpdate:modelValue': (v: string) => { value.value = v } }, () =>
          ['a', 'b', 'c'].map(item => h(RadioGroupItem, { 'value': item, 'data-testid': `radio-${item}`, 'aria-label': item }))),
        h('button', { 'data-testid': 'after' }, 'After'),
      ]),
    }))

    get('before')!.focus()
    await userEvent.keyboard('{Tab}')
    expect(activeElement()).toBe(get('radio-a'))
    // An arrow-key focus checks the radio while the key is still held.
    await userEvent.keyboard('{ArrowDown>}')
    expect(activeElement()).toBe(get('radio-b'))
    await expect.poll(() => value.value).toBe('b')
    await userEvent.keyboard('{/ArrowDown}')
    await userEvent.keyboard('{ArrowUp}{ArrowUp>}')
    expect(activeElement()).toBe(get('radio-c'))
    await expect.poll(() => value.value).toBe('c')
    await userEvent.keyboard('{/ArrowUp}')
    // A single tab stop for the group.
    await userEvent.keyboard('{Tab}')
    expect(activeElement()).toBe(get('after'))
  })
})
