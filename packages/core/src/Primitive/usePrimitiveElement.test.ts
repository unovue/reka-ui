import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { Primitive } from './Primitive'
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

describe('usePrimitiveElement with a text or comment root', () => {
  const COMMENT_ROOT = `<div v-if="false" />`
  const TEXT_ROOT = `just text`

  /** Point `primitiveElement` at `child` and render an unrelated element right after it, unless `alone`. */
  async function resolveCurrentElement(child: any, alone = false) {
    let primitive!: ReturnType<typeof usePrimitiveElement>
    const wrapper = mount(defineComponent({
      setup() {
        primitive = usePrimitiveElement()
        return () => [
          h(child, { ref: primitive.primitiveElement }),
          alone ? null : h('div', { id: 'outsider' }),
        ]
      },
    }))
    await flushPromises()
    if (!alone)
      expect(wrapper.find('#outsider').exists()).toBe(true)
    return primitive.currentElement.value
  }

  it('should resolve the root element of a Primitive', async () => {
    const element = await resolveCurrentElement(defineComponent({
      setup: () => () => h(Primitive, { as: 'button', id: 'own' }),
    }))
    expect(element).toBeInstanceOf(HTMLButtonElement)
    expect(element.id).toBe('own')
  })

  it.each([
    ['comment root', COMMENT_ROOT],
    ['text root', TEXT_ROOT],
    ['fragment of comments', `<!-- a --><!-- b -->`],
  ])('should not resolve to an element outside a %s', async (_, template) => {
    expect(await resolveCurrentElement(defineComponent({ template }))).toBeNull()
  })

  it.each([
    ['comment root', COMMENT_ROOT],
    ['text root', TEXT_ROOT],
  ])('should resolve null for a %s with no following element', async (_, template) => {
    expect(await resolveCurrentElement(defineComponent({ template }), true)).toBeNull()
  })

  it('should resolve the first element of a fragment that starts with text', async () => {
    const element = await resolveCurrentElement(defineComponent({ template: `leading text <button id="own">ok</button>` }))
    expect(element?.id).toBe('own')
  })

  it('should resolve Primitive as-child with a v-if comment before the element', async () => {
    const Inner = defineComponent({
      components: { Primitive },
      template: `<Primitive as-child><template v-if="false"><i /></template><button id="own">b</button></Primitive>`,
    })
    expect((await resolveCurrentElement(Inner))?.id).toBe('own')
  })

  it('should not resolve to an element outside a Primitive as-child that renders no element', async () => {
    const Inner = defineComponent({
      components: { Primitive },
      template: `<Primitive as-child><template v-if="false"><i /></template></Primitive>`,
    })
    expect(await resolveCurrentElement(Inner)).toBeNull()
  })
})
