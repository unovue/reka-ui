import type { ComponentPublicInstance } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import ComboboxLong from './story/_ComboboxLong.vue'

// How many components re-render for one interaction on a long list of options.
const ITEMS = 300
const options = Array.from({ length: ITEMS }, (_, index) => `Option ${index}`)
const MATCHING_9 = options.filter(option => option.includes('9')).length

function countUpdates() {
  const counts = new Map<string, number>()
  const mixin = {
    beforeUpdate(this: ComponentPublicInstance) {
      const name = this.$options.name ?? this.$options.__name ?? 'Anonymous'
      counts.set(name, (counts.get(name) ?? 0) + 1)
    },
  }
  return {
    mixin,
    reset: () => counts.clear(),
    of: (name: string) => counts.get(name) ?? 0,
    all: () => Object.fromEntries(counts),
  }
}

let mounted: { unmount: () => void } | undefined

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function setup(position: 'inline' | 'popper') {
  const updates = countUpdates()
  const wrapper = mount(ComboboxLong, {
    props: { options, position },
    attachTo: document.body,
    global: { mixins: [updates.mixin] },
  })
  mounted = wrapper
  await wrapper.find('button').trigger('click')
  // The content mounts, the items register and the popper positions itself.
  for (let i = 0; i < 5; i++) {
    await nextTick()
    await sleep(5)
  }
  const input = wrapper.find('input')
  const items = () => Array.from(document.querySelectorAll<HTMLElement>('[role=option]:not([aria-disabled])'))
  return { wrapper, updates, input, items }
}

describe.each(['inline', 'popper'] as const)('given a Combobox with many items (%s)', (position) => {
  beforeEach(() => {
    document.body.innerHTML = ''
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  })

  afterEach(() => {
    mounted?.unmount()
    mounted = undefined
  })

  // TODO(v3-port): #3402 per-item re-render counts (Combobox/Listbox source resolved to v3)
  it.skip('re-renders only the two items a key press moves the highlight between', async () => {
    const { updates, input, items } = await setup(position)
    expect(items()).toHaveLength(ITEMS)
    await input.trigger('keydown', { key: 'ArrowDown' })

    updates.reset()
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(document.querySelector('[data-highlighted]')?.textContent?.trim()).toBe('Option 2')
    expect(updates.of('ComboboxItem')).toBe(0)
    expect(updates.of('ListboxItem')).toBe(0)
    expect(updates.of('Primitive')).toBeLessThan(10)
  })

  // TODO(v3-port): #3402 per-item re-render counts (Combobox/Listbox source resolved to v3)
  it.skip('re-renders only the items a typed character hides', async () => {
    const { updates, input, items } = await setup(position)

    updates.reset()
    await input.setValue('9')
    await nextTick()
    expect(items()).toHaveLength(MATCHING_9)
    // The items that stay are not touched, and no item renders twice.
    expect(updates.of('ComboboxItem')).toBe(ITEMS - MATCHING_9)
    expect(updates.of('ListboxItem')).toBe(0)
    expect(updates.of('CollectionItem')).toBe(0)
  })

  // TODO(v3-port): #3402 per-item re-render counts (Combobox/Listbox source resolved to v3)
  it.skip('re-renders only the items clearing the filter brings back', async () => {
    const { updates, input, items } = await setup(position)
    await input.setValue('9')
    await nextTick()

    updates.reset()
    await input.setValue('')
    await nextTick()
    expect(items()).toHaveLength(ITEMS)
    expect(updates.of('ComboboxItem')).toBe(ITEMS - MATCHING_9)
    expect(updates.of('ListboxItem')).toBe(0)
  })
})
