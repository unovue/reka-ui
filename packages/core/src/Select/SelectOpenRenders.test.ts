import { mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { Label } from '@/Label'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '.'

beforeAll(() => {
  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn()
})

afterEach(() => {
  document.body.innerHTML = ''
})

const options = Array.from({ length: 20 }, (_, i) => `Option ${i + 1}`)

describe('opening a Select', () => {
  // The content re-renders a few times while it opens and positions itself.
  // Each re-render used to re-render every item when the Select sat inside a
  // part such as `Label`.
  it('renders each item once, also inside a Label', async () => {
    let renders = 0
    const Counted = defineComponent({
      setup: (_, { slots }) => () => {
        renders++
        return h('span', slots.default?.())
      },
    })
    const wrapper = mount(defineComponent({
      components: { Counted, Label, SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport },
      setup: () => ({ options }),
      template: `<Label>
        <SelectRoot>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectPortal>
            <SelectContent>
              <SelectViewport>
                <SelectItem v-for="option in options" :key="option" :value="option">
                  <SelectItemText><Counted>{{ option }}</Counted></SelectItemText>
                </SelectItem>
              </SelectViewport>
            </SelectContent>
          </SelectPortal>
        </SelectRoot>
      </Label>`,
    }), { attachTo: document.body })
    await nextTick()
    renders = 0
    const trigger = wrapper.find('button').element
    trigger.focus()
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }))
    for (let i = 0; i < 5; i++) {
      await nextTick()
      await new Promise(resolve => setTimeout(resolve))
    }
    expect(document.querySelectorAll('[role="option"]')).toHaveLength(options.length)
    // Each item once, and the item that takes the highlight once more.
    expect(renders).toBe(options.length + 1)
    wrapper.unmount()
  })
})
