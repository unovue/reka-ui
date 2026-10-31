import type { VNodeChild } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxRoot } from '@/Combobox'
import { ListboxContent, ListboxItem, ListboxRoot } from '@/Listbox'

// Native focus order through a listbox whose tabindex the consumer or the
// as-child element owns. jsdom has no Tab order to check this against.

async function settle() {
  for (let i = 0; i < 3; i++) {
    await new Promise(resolve => setTimeout(resolve, 20))
    await nextTick()
  }
}
const active = () => (document.activeElement as HTMLElement | null)?.dataset.name ?? document.activeElement?.tagName.toLowerCase()
const named = (name: string) => document.querySelector(`[data-name=${name}]`) as HTMLElement
const items = () => ['a', 'b'].map(value => h(ListboxItem, { 'value': value, 'data-name': `item-${value}` }, () => value))

let unmount: (() => void) | undefined
async function mountBetweenButtons(render: () => VNodeChild) {
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp(defineComponent({
    setup: () => () => h('div', [
      h('button', { 'data-name': 'before' }, 'before'),
      render(),
      h('button', { 'data-name': 'after' }, 'after'),
    ]),
  }))
  app.mount(host)
  unmount = () => {
    app.unmount()
    host.remove()
  }
  await settle()
}
async function tabFromBefore() {
  named('before').focus()
  await userEvent.keyboard('{Tab}')
  await settle()
  return active()
}

describe('listbox focus order', () => {
  afterEach(() => {
    unmount?.()
    unmount = undefined
  })

  it('tab enters a default listbox after the pointer leaves', async () => {
    await mountBetweenButtons(() => h(ListboxRoot, { highlightOnHover: true }, () => h(ListboxContent, null, items)))
    await userEvent.hover(named('item-b'))
    await userEvent.hover(named('after'))
    await settle()
    expect(await tabFromBefore()).toBe('item-b')
  })

  it('tab skips, then enters, an as-child element that drops tabindex="-1"', async () => {
    const bound = ref<string | undefined>('-1')
    await mountBetweenButtons(() => h(ListboxRoot, { highlightOnHover: true }, () =>
      h(ListboxContent, { asChild: true }, () => h('section', bound.value === undefined ? {} : { tabindex: bound.value }, items()))))
    await userEvent.hover(named('item-b'))
    await userEvent.hover(named('after'))
    await settle()
    expect(await tabFromBefore()).toBe('after')

    bound.value = undefined
    await settle()
    expect(await tabFromBefore()).toBe('item-b')
  })

  it('tab skips a tabindex="-1" bound below the as-child slot child', async () => {
    const Nested = defineComponent({
      inheritAttrs: false,
      setup: (_, { attrs, slots }) => () => h('section', { ...attrs, tabindex: '-1' }, slots.default?.()),
    })
    await mountBetweenButtons(() => h(ListboxRoot, { highlightOnHover: true }, () =>
      h(ListboxContent, { asChild: true }, () => h(Nested, null, items))))
    await userEvent.hover(named('item-b'))
    await userEvent.hover(named('after'))
    await settle()
    expect(await tabFromBefore()).toBe('after')
  })

  it('tab from the input reaches a combobox as-child element with tabindex="0"', async () => {
    await mountBetweenButtons(() => h(ComboboxRoot, { defaultOpen: true }, () => [
      h(ComboboxAnchor, () => h(ComboboxInput, { 'data-name': 'input' })),
      h(ComboboxContent, { asChild: true }, () => h('div', { 'tabindex': '0', 'data-name': 'content' }, ['a', 'b'].map(value => h(ComboboxItem, { value }, () => value)))),
    ]))
    named('input').focus()
    await settle()
    await userEvent.keyboard('{Tab}')
    await settle()
    expect(active()).toBe('content')
  })
})
