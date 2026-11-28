import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { ColorSwatchPickerItem, ColorSwatchPickerRoot } from '.'

function setup(attrs: string, model?: ReturnType<typeof ref>) {
  const updates: unknown[] = []
  const wrapper = mount(defineComponent({
    components: { ColorSwatchPickerRoot, ColorSwatchPickerItem },
    setup: () => ({ model, updates }),
    template: `
      <form>
        <ColorSwatchPickerRoot ${attrs} @update:model-value="(v, d) => updates.push([v, d.reason])">
          <ColorSwatchPickerItem value="#ff0000">Red</ColorSwatchPickerItem>
          <ColorSwatchPickerItem value="#00ff00">Green</ColorSwatchPickerItem>
        </ColorSwatchPickerRoot>
      </form>`,
  }), { attachTo: document.body })
  const selected = () => wrapper.findAll('[role=option]').filter(item => item.attributes('aria-selected') === 'true').map(item => item.text())
  return { wrapper, updates, selected, form: wrapper.find('form').element as HTMLFormElement, items: wrapper.findAll('[role=option]') }
}

describe('colorSwatchPicker form reset', () => {
  it('puts an uncontrolled picker back to its defaultValue', async () => {
    const { wrapper, selected, form, items, updates } = setup('default-value="#ff0000"')
    await items[1].trigger('click')
    expect(selected()).toEqual(['Green'])
    form.reset()
    await nextTick()
    expect(selected()).toEqual(['Red'])
    expect(updates.at(-1)).toEqual(['#ff0000', 'none'])
    wrapper.unmount()
  })

  it('clears an uncontrolled picker without a defaultValue', async () => {
    const { wrapper, selected, form, items } = setup('')
    await items[1].trigger('click')
    expect(selected()).toEqual(['Green'])
    form.reset()
    await nextTick()
    expect(selected()).toEqual([])
    wrapper.unmount()
  })

  it('emits the defaultValue for a controlled picker', async () => {
    const model = ref('#00ff00')
    const { wrapper, form, updates } = setup('v-model="model" default-value="#ff0000"', model)
    form.reset()
    await nextTick()
    expect(model.value).toBe('#ff0000')
    expect(updates).toEqual([['#ff0000', 'none']])
    wrapper.unmount()
  })

  it('resets every value of a multiple picker', async () => {
    const { wrapper, selected, form, items } = setup('multiple :default-value="[\'#ff0000\']"')
    await items[1].trigger('click')
    expect(selected()).toEqual(['Red', 'Green'])
    form.reset()
    await nextTick()
    expect(selected()).toEqual(['Red'])
    wrapper.unmount()
  })
})
