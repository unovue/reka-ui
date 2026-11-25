import { mount } from '@vue/test-utils'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref, shallowRef } from 'vue'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '.'

const components = { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport }

beforeAll(() => {
  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn()
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

async function settle() {
  for (let i = 0; i < 5; i++)
    await nextTick()
}

function labels() {
  return Array.from(document.querySelectorAll('[role=option]')).map(option => option.textContent?.trim())
}

describe('given an open Select with many items', () => {
  let updates: Record<string, number>
  const global = {
    mixins: [{
      beforeUpdate() {
        const name = (this as any).$options.__name ?? (this as any).$options.name
        updates[name] = (updates[name] ?? 0) + 1
      },
    }],
  }

  beforeEach(() => {
    document.body.innerHTML = ''
    updates = {}
  })

  it('should not render its items again when the content renders', async () => {
    const contentClass = ref('one')
    const viewportClass = ref('list')
    const options = ref(Array.from({ length: 100 }, (_, index) => `Option ${index + 1}`))
    mount(defineComponent({
      components,
      setup: () => ({ contentClass, viewportClass, options }),
      template: `
        <SelectRoot :open="true">
          <SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>
          <SelectPortal>
            <SelectContent :class="contentClass">
              <SelectViewport :class="viewportClass">
                <SelectItem v-for="option in options" :key="option" :value="option"><SelectItemText>{{ option }}</SelectItemText></SelectItem>
              </SelectViewport>
            </SelectContent>
          </SelectPortal>
        </SelectRoot>`,
    }), { attachTo: document.body, global })
    await settle()
    expect(labels()).toHaveLength(100)

    updates = {}
    contentClass.value = 'two'
    await settle()
    expect(document.querySelector('[role=listbox]')!.classList.contains('two')).toBe(true)
    expect(updates.SelectViewport).toBeGreaterThan(0)
    // Each render of the content used to render all 100 items again
    expect(updates.SelectItem ?? 0).toBe(0)
    expect(updates.SelectItemText ?? 0).toBe(0)

    // The viewport's own attributes still reach its element
    viewportClass.value = 'grid'
    await settle()
    expect(document.querySelector('[data-reka-select-viewport]')!.className).toBe('grid')

    // And the list follows its data
    options.value = ['Only', ...options.value.slice(0, 2)]
    await settle()
    expect(labels()).toEqual(['Only', 'Option 1', 'Option 2'])
  })
})

describe('given a SelectViewport whose slot is not stable', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('should follow a slot that reads the scope of a `v-for`', async () => {
    // Plain objects: only a new render of the list can show them
    const groups = shallowRef([{ items: ['a', 'b'] }])
    mount(defineComponent({
      components,
      setup: () => ({ groups }),
      template: `
        <SelectRoot v-for="(group, index) in groups" :key="index" :open="true">
          <SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>
          <SelectPortal>
            <SelectContent>
              <SelectViewport>
                <SelectItem v-for="item in group.items" :key="item" :value="item"><SelectItemText>{{ item }}</SelectItemText></SelectItem>
              </SelectViewport>
            </SelectContent>
          </SelectPortal>
        </SelectRoot>`,
    }), { attachTo: document.body })
    await settle()
    expect(labels()).toEqual(['a', 'b'])

    groups.value = [{ items: ['c', 'd', 'e'] }]
    await settle()
    expect(labels()).toEqual(['c', 'd', 'e'])
  })

  it('should follow a slot written as a render function', async () => {
    let items = ['a', 'b']
    const version = ref(0)
    mount(defineComponent({
      setup: () => () => {
        void version.value
        return h(SelectRoot, { open: true }, () => [
          h(SelectTrigger, null, () => h(SelectValue, { placeholder: 'Pick' })),
          h(SelectPortal, null, () => h(SelectContent, null, () => h(SelectViewport, null, () => items.map(item =>
            h(SelectItem, { key: item, value: item }, () => h(SelectItemText, null, () => item)),
          )))),
        ])
      },
    }), { attachTo: document.body })
    await settle()
    expect(labels()).toEqual(['a', 'b'])

    items = ['c']
    version.value++
    await settle()
    expect(labels()).toEqual(['c'])
  })
})
