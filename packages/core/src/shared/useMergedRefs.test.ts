import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, Fragment, h, nextTick, ref } from 'vue'
import { resolveRefTarget, useMergedRefs } from './useMergedRefs'

describe('useMergedRefs', () => {
  it('returns undefined when every ref is nullish', () => {
    expect(useMergedRefs()).toBeUndefined()
    expect(useMergedRefs(null, undefined)).toBeUndefined()
  })

  it('writes the element to object refs and callback refs', async () => {
    const objectRef = ref<HTMLElement | null>(null)
    const callback = vi.fn()
    const wrapper = mount(defineComponent(() => {
      const merged = useMergedRefs(objectRef, callback)
      return () => h('div', [h('span', { ref: merged })])
    }))
    await nextTick()

    const span = wrapper.find('span').element
    expect(objectRef.value).toBe(span)
    expect(callback).toHaveBeenCalledWith(span)

    wrapper.unmount()
    expect(objectRef.value).toBeNull()
    expect(callback).toHaveBeenLastCalledWith(null)
  })

  it('resolves a component ref to its element (never the instance)', async () => {
    const Child = defineComponent(() => () => h('button'))
    const objectRef = ref<HTMLElement | null>(null)
    const wrapper = mount(defineComponent(() => {
      const merged = useMergedRefs(objectRef)
      return () => h(Child, { ref: merged })
    }))
    await nextTick()
    expect(objectRef.value).toBe(wrapper.find('button').element)
  })

  it('calls a returned cleanup on detach instead of calling the callback with null', async () => {
    const cleanup = vi.fn()
    const callback = vi.fn(() => cleanup)
    const show = ref(true)
    const wrapper = mount(defineComponent(() => {
      const merged = useMergedRefs(callback)
      return () => show.value ? h('span', { ref: merged }) : null
    }))
    await nextTick()
    expect(callback).toHaveBeenCalledTimes(1)

    show.value = false
    await nextTick()
    expect(cleanup).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledTimes(1) // never called with null
    wrapper.unmount()
  })

  it('disposes the previous registration when the element swaps', async () => {
    const cleanups: HTMLElement[] = []
    const callback = vi.fn((el: HTMLElement | null) => () => {
      cleanups.push(el!)
    })
    const asButton = ref(true)
    const wrapper = mount(defineComponent(() => {
      const merged = useMergedRefs(callback)
      return () => h(asButton.value ? 'button' : 'a', { ref: merged, key: String(asButton.value) })
    }))
    await nextTick()
    const button = wrapper.find('button').element

    asButton.value = false
    await nextTick()
    expect(cleanups).toEqual([button])
    expect(callback).toHaveBeenLastCalledWith(wrapper.find('a').element)
  })

  it('does not re-invoke the inputs when the owner re-renders with the same element', async () => {
    const callback = vi.fn()
    const count = ref(0)
    mount(defineComponent(() => {
      const merged = useMergedRefs(callback)
      return () => h('span', { 'ref': merged, 'data-count': count.value })
    }))
    await nextTick()
    count.value++
    await nextTick()
    count.value++
    await nextTick()
    expect(callback).toHaveBeenCalledTimes(1)
  })
})

describe('resolveRefTarget', () => {
  it('returns null for nullish and non-object values', () => {
    expect(resolveRefTarget(null)).toBeNull()
    expect(resolveRefTarget(undefined)).toBeNull()
    expect(resolveRefTarget('div')).toBeNull()
  })

  it('returns a raw element as is', () => {
    const el = document.createElement('div')
    expect(resolveRefTarget(el)).toBe(el)
  })

  it('prefers an exposed `element` over `$el`', () => {
    const element = document.createElement('button')
    const $el = document.createElement('div')
    expect(resolveRefTarget({ element, $el })).toBe(element)
    expect(resolveRefTarget({ element: ref(element), $el })).toBe(element)
  })

  it('falls back to `$el` when `element` is absent or empty', () => {
    const $el = document.createElement('div')
    expect(resolveRefTarget({ $el })).toBe($el)
    expect(resolveRefTarget({ element: null, $el })).toBe($el)
  })

  it('resolves a #text / #comment `$el` anchor to the next element sibling', () => {
    const parent = document.createElement('div')
    const text = document.createTextNode('')
    const comment = document.createComment('')
    const span = document.createElement('span')
    parent.append(text, span)
    expect(resolveRefTarget({ $el: text })).toBe(span)
    parent.prepend(comment)
    expect(resolveRefTarget({ $el: comment })).toBe(comment.nextElementSibling)
  })

  it('resolves a mounted multi-root component through its fragment anchor', async () => {
    const MultiRoot = defineComponent(() => () => h(Fragment, [h('span', 'first'), h('div', 'second')]))
    const childRef = ref()
    const wrapper = mount(defineComponent(() => () => h('div', [h(MultiRoot, { ref: childRef })])))
    await nextTick()
    const resolved = computed(() => resolveRefTarget(childRef.value))
    expect(resolved.value).toBe(wrapper.find('span').element)
  })
})
