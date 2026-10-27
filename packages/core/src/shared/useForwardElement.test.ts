import type { ComponentPublicInstance } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { unrefElement } from '@vueuse/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, Fragment, h, isRef, markRaw, nextTick, ref, watchPostEffect } from 'vue'
import { Primitive } from '../Primitive'
import { SwitchRoot } from '../Switch'
import { mergeExpose, useForwardElement } from './useForwardElement'

/** A part built on the contract: `defineExpose(expose)` via the options-API `expose`. */
function definePart(template: string, extra: Record<string, unknown> = {}) {
  return defineComponent({
    props: { label: { type: String, default: 'part' } },
    setup(_, { expose }) {
      const api = useForwardElement()
      expose(mergeExpose(api.expose, extra))
      return { forwardRef: api.forwardRef }
    },
    template,
  })
}

/** Mounts `comp` under a parent that reads `$el` off its ref inside a computed. */
function mountReadingEl(comp: ReturnType<typeof defineComponent>) {
  return mount(defineComponent(() => {
    const el = ref()
    const forwardedRef = computed(() => el.value?.$el)
    return () => h('div', { test: forwardedRef.value }, [h(comp, { ref: el })])
  }))
}

afterEach(() => {
  vi.restoreAllMocks()
})

// The fragment cases of `useForwardExpose.test.ts` are the frozen spec (#2808):
// the same templates must resolve the same element through the new contract.
describe('useForwardElement — frozen spec from useForwardExpose', () => {
  it('should forward plain DOM element ref', async () => {
    const wrapper = mountReadingEl(definePart(`
      <div>
        <span :ref="forwardRef"> inner element </span>
      </div>
    `))
    await flushPromises()
    expect(wrapper.attributes('test')).toBe('[object HTMLSpanElement]')
  })

  it('should forward plain DOM element ref - 2', async () => {
    const wrapper = mountReadingEl(definePart(`
      <div>
        <span :ref="_=>forwardRef({$el: _})"> inner element </span>
      </div>
    `))
    await flushPromises()
    expect(wrapper.attributes('test')).toBe('[object HTMLSpanElement]')
  })

  it('should forward plain DOM element ref - fragment', async () => {
    const wrapper = mountReadingEl(definePart(`
      <div>multiple node root</div>
      <div>
        <span :ref="forwardRef"> inner element </span>
      </div>
    `))
    await flushPromises()
    expect(wrapper.attributes('test')).toBe('[object HTMLSpanElement]')
  })

  it('should forward plain DOM element ref - fragment - 2', async () => {
    const Frag = defineComponent((_, { slots }) => () => h(Fragment, {}, [slots.default?.()]))
    const comp = definePart(`
      <Frag>
        <Frag>
          <div>
            <span :ref="forwardRef"> inner element </span>
          </div>
        </Frag>
      </Frag>
    `)
    comp.components = { Frag }
    const wrapper = mountReadingEl(comp)
    await flushPromises()
    expect(wrapper.attributes('test')).toBe('[object HTMLSpanElement]')
  })

  it('should forward plain DOM element ref - fragment - 3', async () => {
    const wrapper = mountReadingEl(definePart(`
      <div>
        <template>
          <div>
            <span :ref="forwardRef"> inner element </span>
          </div>
        </template>
      </div>
    `))
    await flushPromises()
    expect(wrapper.attributes('test')).toBe('[object HTMLSpanElement]')
  })

  it('should forward component instance for component', async () => {
    const InnerComp = defineComponent(() => () => h('span', {}, 'inner component'))
    const comp = definePart(`
      <div>
        <InnerComp :ref="forwardRef" />
      </div>
    `)
    comp.components = { InnerComp }
    const wrapper = mountReadingEl(comp)
    await flushPromises()
    expect(wrapper.attributes('test')).toBe('[object HTMLSpanElement]')
  })

  it('resolves a multi-root (fragment) child through its anchor', async () => {
    const MultiRoot = defineComponent(() => () => [h('span', 'first'), h('div', 'second')])
    const comp = definePart(`<div><MultiRoot :ref="forwardRef" /></div>`)
    comp.components = { MultiRoot }
    const wrapper = mountReadingEl(comp)
    await flushPromises()
    expect(wrapper.attributes('test')).toBe('[object HTMLSpanElement]')
  })

  it('should update currentElement when as-child conditional child swaps', async () => {
    const toggle = ref(true)
    let renderNode: string | undefined

    mount(defineComponent({
      setup() {
        const { forwardRef, currentElement } = useForwardElement()
        watchPostEffect(() => {
          renderNode = currentElement.value?.nodeName.toLowerCase()
        })
        return () => {
          const showButton = toggle.value
          return h(Primitive, { ref: forwardRef, asChild: true }, {
            default: () => [showButton ? h('button') : h('span')],
          })
        }
      },
    }))

    await flushPromises()
    expect(renderNode).toBe('button')

    toggle.value = !toggle.value
    await flushPromises()
    expect(renderNode).toBe('span')
  })
})

describe('useForwardElement — dual-key expose (`element` + `$el`)', () => {
  const MultiRootPart = definePart(`
    <i>anchor sibling</i>
    <span :ref="forwardRef">target</span>
  `)

  it('the exposed `$el` shadows the builtin (even for multi-root parts)', async () => {
    const partRef = ref<any>()
    const wrapper = mount(defineComponent(() => () => h('div', [h(MultiRootPart, { ref: partRef })])))
    await nextTick()

    const span = wrapper.find('span').element
    // The builtin `$el` of a fragment-root component is its anchor text node.
    expect(partRef.value.$.vnode.el.nodeName).toBe('#text')
    expect(partRef.value.$el).toBe(span)
    expect(partRef.value.element).toBe(span)
  })

  it('both keys are unwrapped by the expose proxy (`proxyRefs`)', async () => {
    const partRef = ref<any>()
    mount(defineComponent(() => () => h(MultiRootPart, { ref: partRef })))
    await nextTick()

    expect(isRef(partRef.value.element)).toBe(false)
    expect(isRef(partRef.value.$el)).toBe(false)
    expect(partRef.value.element).toBeInstanceOf(HTMLSpanElement)
    expect(partRef.value.$el).toBe(partRef.value.element)
  })

  it('stays reactive across a `v-if` root swap', async () => {
    const asButton = ref(true)
    const SwappingPart = defineComponent({
      setup(_, { expose }) {
        const { forwardRef, expose: elementExpose } = useForwardElement()
        expose(elementExpose)
        return () => asButton.value ? h('button', { ref: forwardRef }) : h('a', { ref: forwardRef })
      },
    })

    const partRef = ref<any>()
    const seen: string[] = []
    mount(defineComponent(() => {
      const $el = computed(() => partRef.value?.$el?.nodeName)
      const element = computed(() => partRef.value?.element?.nodeName)
      watchPostEffect(() => {
        if ($el.value)
          seen.push(`${$el.value}/${element.value}`)
      })
      return () => h(SwappingPart, { ref: partRef })
    }))
    await flushPromises()

    asButton.value = false
    await flushPromises()
    asButton.value = true
    await flushPromises()

    expect(seen).toEqual(['BUTTON/BUTTON', 'A/A', 'BUTTON/BUTTON'])
  })

  it('follows a root swap through a chain of conforming parts', async () => {
    const asButton = ref(true)
    const Inner = defineComponent({
      setup(_, { expose }) {
        const { forwardRef, expose: elementExpose } = useForwardElement()
        expose(elementExpose)
        return () => h(asButton.value ? 'button' : 'a', { ref: forwardRef, key: String(asButton.value) })
      },
    })
    // Outer wraps Inner through Primitive `as-child` — Inner is never re-bound,
    // so only reactivity can carry the swap up.
    const Outer = definePart(`<Primitive as-child :ref="forwardRef"><Inner /></Primitive>`)
    Outer.components = { Primitive, Inner }

    const partRef = ref<any>()
    mount(defineComponent(() => () => h(Outer, { ref: partRef })))
    await flushPromises()
    const nodeName = computed(() => partRef.value?.$el?.nodeName)
    expect(nodeName.value).toBe('BUTTON')

    asButton.value = false
    await flushPromises()
    expect(nodeName.value).toBe('A')
  })

  it('interops with VueUse `unrefElement`', async () => {
    const partRef = ref<any>()
    const wrapper = mount(defineComponent(() => () => h('div', [h(MultiRootPart, { ref: partRef })])))
    await nextTick()
    expect(unrefElement(partRef)).toBe(wrapper.find('span').element)
  })

  it('keeps documented exposed methods next to the element keys', async () => {
    const focus = vi.fn()
    const Part = definePart(`<button :ref="forwardRef" />`, { focus })
    const partRef = ref<any>()
    mount(defineComponent(() => () => h(Part, { ref: partRef })))
    await nextTick()

    partRef.value.focus()
    expect(focus).toHaveBeenCalledOnce()
    expect(partRef.value.element).toBeInstanceOf(HTMLButtonElement)
  })
})

describe('useForwardElement — removed accidental surface', () => {
  it('prop reads off a part ref return undefined and warn once in dev', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const Part = definePart(`<button :ref="forwardRef" />`)
    Part.name = 'WarnPart'
    const partRef = ref<any>()
    mount(defineComponent(() => () => h(Part, { ref: partRef, label: 'hello' })))
    await nextTick()

    expect(partRef.value.label).toBeUndefined()
    expect(partRef.value.label).toBeUndefined()
    const warnings = warn.mock.calls.flat().filter(m => String(m).includes('reading the prop'))
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('<WarnPart>: reading the prop `label`')

    // Non-prop keys do not warn.
    void partRef.value.element
    void partRef.value.notAProp
    expect(warn.mock.calls.flat().filter(m => String(m).includes('reading the prop'))).toHaveLength(1)
  })

  it('does not implicitly forward the exposed methods of an `as` component', async () => {
    const AsComp = markRaw(defineComponent({
      setup(_, { expose }) {
        expose({ innerMethod: () => 'inner' })
        return () => h('span')
      },
    }))
    const partRef = ref<any>()
    mount(defineComponent(() => () => h(Primitive, { ref: partRef, as: AsComp })))
    await nextTick()

    expect(partRef.value.innerMethod).toBeUndefined()
    expect(partRef.value.element).toBeInstanceOf(HTMLSpanElement)
  })

  it('a real part (SwitchRoot) exposes element + reactive $el only', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const partRef = ref<ComponentPublicInstance & Record<string, any>>()
    const wrapper = mount(defineComponent(() => () => h(SwitchRoot, { ref: partRef, disabled: true })))
    await nextTick()

    const button = wrapper.find('button').element
    expect(partRef.value!.element).toBe(button)
    expect(partRef.value!.$el).toBe(button)
    expect(partRef.value!.disabled).toBeUndefined()
    expect(warn.mock.calls.flat().join('\n')).toContain('<SwitchRoot>: reading the prop `disabled`')
  })
})
