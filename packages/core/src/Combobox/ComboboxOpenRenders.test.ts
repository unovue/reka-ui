import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { ComboboxAnchor, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxTrigger, ComboboxViewport } from '.'

afterEach(() => {
  document.body.innerHTML = ''
})

const options = Array.from({ length: 20 }, (_, i) => `Option ${i + 1}`)

describe('opening a Combobox', () => {
  // The popper content re-renders a few times while it opens and positions
  // itself. Each re-render used to re-render every item.
  it('renders each item once', async () => {
    let renders = 0
    const Counted = defineComponent({
      setup: (_, { slots }) => () => {
        renders++
        return h('span', slots.default?.())
      },
    })
    const wrapper = mount(defineComponent({
      components: { Counted, ComboboxAnchor, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxTrigger, ComboboxViewport },
      setup: () => ({ options }),
      template: `<ComboboxRoot>
        <ComboboxAnchor>
          <ComboboxInput />
          <ComboboxTrigger>Open</ComboboxTrigger>
        </ComboboxAnchor>
        <ComboboxPortal>
          <ComboboxContent position="popper">
            <ComboboxViewport>
              <ComboboxEmpty>No results</ComboboxEmpty>
              <ComboboxItem v-for="option in options" :key="option" :value="option">
                <Counted>{{ option }}</Counted>
              </ComboboxItem>
            </ComboboxViewport>
          </ComboboxContent>
        </ComboboxPortal>
      </ComboboxRoot>`,
    }), { attachTo: document.body })
    await nextTick()
    renders = 0
    const input = wrapper.find('input').element
    input.focus()
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }))
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
