import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '.'

describe('given a closed Select with many items', () => {
  let updates: Record<string, number>

  function mountSelect(setup: () => Record<string, unknown>) {
    updates = {}
    return mount(defineComponent({
      components: { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport },
      setup,
      template: `
        <SelectRoot v-model="model">
          <SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>
          <SelectPortal>
            <SelectContent>
              <SelectViewport>
                <SelectItem v-for="option in options" :key="option.key" :value="option.value"><SelectItemText>{{ option.label }}</SelectItemText></SelectItem>
              </SelectViewport>
            </SelectContent>
          </SelectPortal>
        </SelectRoot>`,
    }), {
      attachTo: document.body,
      global: {
        mixins: [{
          beforeUpdate() {
            const name = (this as any).$options.__name ?? (this as any).$options.name
            updates[name] = (updates[name] ?? 0) + 1
          },
        }],
      },
    })
  }

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('should render each item once when it mounts', async () => {
    const options = Array.from({ length: 100 }, (_, index) => ({ key: index, value: `value-${index}`, label: `Option ${index + 1}` }))
    mountSelect(() => ({ options, model: ref() }))
    await nextTick()
    await nextTick()
    await nextTick()

    // Reading its text used to render every item a second time
    expect(updates.SelectItem ?? 0).toBe(0)
    expect(updates.SelectItemText ?? 0).toBe(0)
  })

  it('should still match the text of its items when typing on the trigger', async () => {
    const model = ref<string>()
    const options = ref([
      { key: 0, value: 'apple', label: 'Apple' },
      { key: 1, value: 'banana', label: 'Banana' },
      { key: 2, value: 'cherry', label: 'Cherry' },
    ])
    const wrapper = mountSelect(() => ({ options, model }))
    await nextTick()
    await nextTick()

    // The same item, with another value: the typeahead selects the value it has now
    options.value = [options.value[0], options.value[1], { key: 2, value: 'cranberry', label: 'Cherry' }]
    await nextTick()
    await nextTick()

    const trigger = wrapper.find('[role=combobox]').element as HTMLElement
    trigger.focus()
    await fireEvent.keyDown(trigger, { key: 'c' })
    await nextTick()
    expect(model.value).toBe('cranberry')
  })
})
