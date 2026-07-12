import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { usePrimitiveElement } from './usePrimitiveElement'

describe('usePrimitiveElement', () => {
  it('resolves currentElement when the ref is a raw Element (component :is path)', () => {
    const Harness = defineComponent({
      setup() {
        const { primitiveElement, currentElement } = usePrimitiveElement()
        return { primitiveElement, currentElement }
      },
      // A raw element ref (as delivered by `<component :is="'div'">`) — no `$el`.
      template: `<div :ref="(el) => primitiveElement = el" />`,
    })
    const wrapper = mount(Harness)
    expect(wrapper.vm.currentElement).toBeInstanceOf(HTMLElement)
  })

  it('resolves currentElement when the ref is a component instance ($el path)', () => {
    const Child = defineComponent({ template: `<span />` })
    const Harness = defineComponent({
      components: { Child },
      setup() {
        const { primitiveElement, currentElement } = usePrimitiveElement()
        return { primitiveElement, currentElement }
      },
      template: `<Child :ref="(vm) => primitiveElement = vm" />`,
    })
    const wrapper = mount(Harness)
    expect(wrapper.vm.currentElement).toBeInstanceOf(HTMLElement)
  })
})
