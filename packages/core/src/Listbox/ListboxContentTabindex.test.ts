import { mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { ListboxContent, ListboxItem, ListboxRoot } from '.'

// The content's roving tabindex is applied outside the render. An as-child
// element that binds its own `tabindex` won the slot merge before, so the
// content leaves it alone, whatever its value.

function mountAsChild(tabindex: string | undefined, spelling: 'tabindex' | 'tabIndex' = 'tabindex') {
  const bound = ref<string | undefined>(tabindex)
  const wrapper = mount(defineComponent({
    components: { ListboxRoot, ListboxContent, ListboxItem },
    setup: () => ({ bound, attrs: () => bound.value === undefined ? {} : { [spelling]: bound.value } }),
    template: `<ListboxRoot highlight-on-hover>
      <ListboxContent as-child>
        <section v-bind="attrs()">
          <ListboxItem v-for="i in 5" :key="i" :value="'item-' + i">Item {{ i }}</ListboxItem>
        </section>
      </ListboxContent>
    </ListboxRoot>`,
  }), { attachTo: document.body })
  const content = () => wrapper.find('[role=listbox]')
  return { wrapper, bound, content }
}

async function settle() {
  await new Promise(resolve => setTimeout(resolve))
  await nextTick()
}

describe('listboxContent tabindex', () => {
  beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  it('follows the highlight on a plain as-child element', async () => {
    const { wrapper, content } = mountAsChild(undefined)
    await settle()
    expect(wrapper.find('[data-highlighted]').exists()).toBe(true)
    expect(content().attributes('tabindex')).toBe('-1')
    content().element.parentElement!.dispatchEvent(new PointerEvent('pointerleave'))
    await nextTick()
    expect(wrapper.find('[data-highlighted]').exists()).toBe(false)
    expect(content().attributes('tabindex')).toBe('0')
    wrapper.unmount()
  })

  it.each([['-1'], ['0']])('keeps tabindex="%s" bound on the as-child element', async (value) => {
    const { wrapper, content } = mountAsChild(value)
    await settle()
    expect(wrapper.find('[data-highlighted]').exists()).toBe(true)
    expect(content().attributes('tabindex')).toBe(value)
    // The highlight clears: the roving value would be '0'.
    content().element.parentElement!.dispatchEvent(new PointerEvent('pointerleave'))
    await nextTick()
    expect(wrapper.find('[data-highlighted]').exists()).toBe(false)
    expect(content().attributes('tabindex')).toBe(value)
    wrapper.unmount()
  })

  it('keeps a camel-cased tabIndex bound on the as-child element', async () => {
    const { wrapper, content } = mountAsChild('0', 'tabIndex')
    await settle()
    expect(wrapper.find('[data-highlighted]').exists()).toBe(true)
    expect(content().element.getAttribute('tabindex')).toBe('0')
    wrapper.unmount()
  })

  it('takes the attribute back when the element drops its binding', async () => {
    const { wrapper, bound, content } = mountAsChild('0')
    await settle()
    expect(content().attributes('tabindex')).toBe('0')
    bound.value = undefined
    await nextTick()
    await nextTick()
    expect(wrapper.find('[data-highlighted]').exists()).toBe(true)
    expect(content().attributes('tabindex')).toBe('-1')
    wrapper.unmount()
  })
})
