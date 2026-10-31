import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { RovingFocusGroup, RovingFocusItem } from '@/RovingFocus'
import { ToolbarButton, ToolbarRoot } from '@/Toolbar'

// Whether the entry focus scrolls an off-screen first item into view, in real
// Chromium. A string "false" is truthy here: Vue only casts '' and the hyphenated
// name on a Boolean prop, and `focus({ preventScroll: 'false' })` converts it to
// true. Both as-child wrappers and the composable behave the same; pinned so a
// consumer's markup keeps its scrolling.

async function settle() {
  for (let i = 0; i < 3; i++) {
    await new Promise(resolve => setTimeout(resolve, 20))
    await nextTick()
  }
}

let unmount: (() => void) | undefined
afterEach(() => {
  unmount?.()
  unmount = undefined
})

async function entryFocusScrollTop(render: () => ReturnType<typeof h>, groupSelector: string) {
  const host = document.createElement('div')
  host.style.cssText = 'height:100px;overflow:auto'
  document.body.append(host)
  const app = createApp(defineComponent({ setup: () => render }))
  app.mount(host)
  unmount = () => {
    app.unmount()
    host.remove()
  }
  await settle()
  ;(host.querySelector(groupSelector) as HTMLElement).focus()
  await settle()
  expect((document.activeElement as HTMLElement).className).toBe('first')
  return host.scrollTop
}

const spacer = () => h('div', { style: 'height:600px' })
const parts = {
  RovingFocusGroup: (attrs: Record<string, unknown>) => () => h(RovingFocusGroup, { 'data-group': '', ...attrs }, () => [
    spacer(),
    h(RovingFocusItem, { asChild: true }, () => h('button', { class: 'first' }, 'x')),
  ]),
  ToolbarRoot: (attrs: Record<string, unknown>) => () => h(ToolbarRoot, { 'data-group': '', ...attrs }, () => [
    spacer(),
    h(ToolbarButton, { class: 'first' }, () => 'x'),
  ]),
}

describe.each(Object.entries(parts))('%s preventScrollOnEntryFocus', (_, part) => {
  it.each<[string, Record<string, unknown>, boolean]>([
    ['absent', {}, true],
    ['false', { preventScrollOnEntryFocus: false }, true],
    ['true', { preventScrollOnEntryFocus: true }, false],
    ['\'\'', { 'prevent-scroll-on-entry-focus': '' }, false],
    ['"false", camel-cased', { preventScrollOnEntryFocus: 'false' }, false],
    ['"false", hyphenated', { 'prevent-scroll-on-entry-focus': 'false' }, false],
  ])('%s', async (_name, attrs, scrolls) => {
    const scrollTop = await entryFocusScrollTop(part(attrs), '[data-group]')
    expect(scrollTop > 0).toBe(scrolls)
  })
})
