import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { ComboboxAnchor, ComboboxInput, ComboboxRoot } from '@/Combobox'
import { ListboxContent, ListboxItem, ListboxRoot } from '.'

window.HTMLElement.prototype.scrollIntoView = vi.fn()
async function tick() {
  await nextTick()
  await nextTick()
  await nextTick()
}
const Child = defineComponent({
  props: ['modelValue', 'open'],
  setup: props => () => h('i', { class: 'child' }, `${String(props.modelValue)}|${String(props.open)}`),
})

describe('root slot props spread onto a child with v-bind', () => {
  it('listbox: <Child v-bind="slotProps"> inside a nested slot follows the model', async () => {
    const model = ref<any>('a')
    const Inner = defineComponent({ setup: (_, { slots }) => () => h('section', slots.default?.()) })
    const wrapper = mount(defineComponent({
      components: { ListboxRoot, ListboxContent, ListboxItem, Child, Inner },
      setup: () => ({ model }),
      template: `<ListboxRoot v-model="model" v-slot="slotProps">
        <Inner><Child v-bind="slotProps" /></Inner>
        <ListboxContent><ListboxItem v-for="v in ['a','b','c']" :key="v" :value="v">{{ v }}</ListboxItem></ListboxContent>
      </ListboxRoot>`,
    }), { attachTo: document.body })
    await tick()
    expect(wrapper.find('.child').text()).toBe('a|undefined')
    await wrapper.findAll('[role=option]')[1].trigger('click')
    await tick()
    expect(wrapper.find('.child').text()).toBe('b|undefined')
    await wrapper.findAll('[role=option]')[2].trigger('click')
    await tick()
    expect(wrapper.find('.child').text()).toBe('c|undefined')
    wrapper.unmount()
  })

  it('listbox: <Child v-bind="slotProps"> follows the model', async () => {
    const model = ref<any>('a')
    const wrapper = mount(defineComponent({
      components: { ListboxRoot, ListboxContent, ListboxItem, Child },
      setup: () => ({ model }),
      template: `<ListboxRoot v-model="model" v-slot="slotProps">
        <Child v-bind="slotProps" />
        <ListboxContent><ListboxItem v-for="v in ['a','b','c']" :key="v" :value="v">{{ v }}</ListboxItem></ListboxContent>
      </ListboxRoot>`,
    }), { attachTo: document.body })
    await tick()
    expect(wrapper.find('.child').text()).toBe('a|undefined')
    await wrapper.findAll('[role=option]')[1].trigger('click')
    await tick()
    expect(wrapper.find('.child').text()).toBe('b|undefined')
    wrapper.unmount()
  })

  it('listbox: <div v-bind="slotProps"> follows the model', async () => {
    const model = ref<any>('a')
    const wrapper = mount(defineComponent({
      components: { ListboxRoot, ListboxContent, ListboxItem },
      setup: () => ({ model }),
      template: `<ListboxRoot v-model="model" v-slot="slotProps">
        <output class="el" v-bind="slotProps" />
        <ListboxContent><ListboxItem v-for="v in ['a','b','c']" :key="v" :value="v">{{ v }}</ListboxItem></ListboxContent>
      </ListboxRoot>`,
    }), { attachTo: document.body })
    await tick()
    expect(wrapper.find('.el').attributes('modelvalue')).toBe('a')
    model.value = 'c'
    await tick()
    expect(wrapper.find('.el').attributes('modelvalue')).toBe('c')
    wrapper.unmount()
  })

  it('combobox: <Child v-bind="slotProps"> follows open and the model', async () => {
    const model = ref<any>('a')
    const open = ref(false)
    const wrapper = mount(defineComponent({
      components: { ComboboxRoot, ComboboxAnchor, ComboboxInput, Child },
      setup: () => ({ model, open }),
      template: `<ComboboxRoot v-model="model" v-model:open="open" v-slot="slotProps">
        <Child v-bind="slotProps" />
        <ComboboxAnchor><ComboboxInput /></ComboboxAnchor>
      </ComboboxRoot>`,
    }), { attachTo: document.body })
    await tick()
    expect(wrapper.find('.child').text()).toBe('a|false')
    open.value = true
    await tick()
    expect(wrapper.find('.child').text()).toBe('a|true')
    model.value = 'b'
    await tick()
    expect(wrapper.find('.child').text()).toBe('b|true')
    wrapper.unmount()
  })

  it('listbox: a render function passing the slot props to a child follows the model', async () => {
    const model = ref<any>('a')
    const wrapper = mount(defineComponent({
      setup: () => () => h(ListboxRoot, { 'modelValue': model.value, 'onUpdate:modelValue': (value: any) => model.value = value }, {
        default: (slotProps: any) => [h(Child, slotProps), h(ListboxContent)],
      }),
    }), { attachTo: document.body })
    await tick()
    expect(wrapper.find('.child').text()).toBe('a|undefined')
    model.value = 'b'
    await tick()
    expect(wrapper.find('.child').text()).toBe('b|undefined')
    wrapper.unmount()
  })

  it('listbox: slot props kept for an event handler read the current model', async () => {
    const seen: unknown[] = []
    const wrapper = mount(defineComponent({
      components: { ListboxRoot, ListboxContent, ListboxItem },
      setup: () => ({ seen }),
      template: `<ListboxRoot v-slot="slotProps">
        <button class="read" @click="seen.push(slotProps.modelValue)" />
        <ListboxContent><ListboxItem v-for="v in ['a','b','c']" :key="v" :value="v">{{ v }}</ListboxItem></ListboxContent>
      </ListboxRoot>`,
    }), { attachTo: document.body })
    await tick()
    await wrapper.findAll('[role=option]')[0].trigger('click')
    await tick()
    await wrapper.find('.read').trigger('click')
    await wrapper.findAll('[role=option]')[1].trigger('click')
    await tick()
    await wrapper.find('.read').trigger('click')
    expect(seen).toEqual(['a', 'b'])
    wrapper.unmount()
  })
})
