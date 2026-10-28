import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxRoot } from '@/Combobox'

async function flush() {
  for (let i = 0; i < 4; i++) {
    await nextTick()
    await new Promise(r => setTimeout(r, 0))
  }
}

function mountCombobox(attrs: Record<string, unknown>) {
  return mount(defineComponent({
    setup: () => () => h(ComboboxRoot, { defaultOpen: true }, () => [
      h(ComboboxAnchor, () => h(ComboboxInput)),
      h(ComboboxContent, attrs, () => [h(ComboboxItem, { value: 'a' }, () => 'a'), h(ComboboxItem, { value: 'b' }, () => 'b')]),
    ]),
  }), { attachTo: document.body })
}

describe('comboboxContent tabindex', () => {
  it('follows the highlight by default', async () => {
    const wrapper = mountCombobox({})
    await flush()
    const content = document.querySelector('[role="listbox"]')!
    expect(document.querySelector('[data-highlighted]')).not.toBeNull()
    expect(content.getAttribute('tabindex')).toBe('-1')
    wrapper.unmount()
  })

  it('keeps a consumer tabindex, which is bound over the roving one', async () => {
    const wrapper = mountCombobox({ tabindex: '0' })
    await flush()
    const content = document.querySelector('[role="listbox"]')!
    expect(document.querySelector('[data-highlighted]')).not.toBeNull()
    expect(content.getAttribute('tabindex')).toBe('0')
    wrapper.unmount()
  })
})
