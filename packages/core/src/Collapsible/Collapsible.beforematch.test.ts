import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import CollapsibleContent from './CollapsibleContent.vue'
import CollapsibleRoot from './CollapsibleRoot.vue'
import CollapsibleTrigger from './CollapsibleTrigger.vue'

// Synthetic events validate handler semantics only; Chrome Find is a separate gate.
let rafQueue: { id: number, callback: FrameRequestCallback }[]
let sequence: number
let wrappers: VueWrapper[]
beforeEach(() => {
  rafQueue = []
  sequence = 0
  wrappers = []
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = ++sequence
    rafQueue.push({ id, callback })
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    rafQueue = rafQueue.filter(frame => frame.id !== id)
  })
})
afterEach(() => {
  wrappers.forEach(wrapper => wrapper.unmount())
  vi.unstubAllGlobals()
})
async function flushFrames() {
  let iterations = 0
  while (rafQueue.length) {
    if (++iterations > 100)
      throw new Error('RAF did not settle')
    rafQueue.shift()!.callback(performance.now())
    // Browser callbacks can expose Vue patches before the following callback.
    // Flushing separately prevents synchronous batching from hiding toggle bugs.
    await nextTick()
    await nextTick()
  }
}
async function mountCollapsibles(initial: boolean[], controlled: boolean, disabled = false, acceptUpdates = true) {
  const updates = initial.map(() => [] as boolean[])
  const found = initial.map(() => [] as void[])
  const state = ref([...initial])
  const wrapper = mount(defineComponent({
    setup() {
      const level = (index: number): ReturnType<typeof h> => h(CollapsibleRoot, {
        'data-test': `root-${index}`,
        ...(controlled ? { open: state.value[index] } : { defaultOpen: initial[index] }),
        'unmountOnHide': false,
        disabled,
        'onUpdate:open': (value: boolean) => {
          updates[index]!.push(value)
          if (controlled && acceptUpdates)
            state.value[index] = value
        },
      }, {
        default: () => [
          h(CollapsibleTrigger, { 'data-test': `trigger-${index}` }, () => `Toggle ${index}`),
          h(CollapsibleContent, {
            'data-test': `content-${index}`,
            'onContentFound': () => found[index]!.push(undefined),
          }, () => index + 1 < initial.length ? level(index + 1) : h('span', 'Needle')),
        ],
      })
      return () => level(0)
    },
  }), { attachTo: document.body })
  wrappers.push(wrapper)
  await nextTick()
  await flushFrames()
  const beforematch = (index: number) => wrapper.get(`[data-test="content-${index}"]`).element.dispatchEvent(new Event('beforematch', { bubbles: true }))
  const expectStates = (states: boolean[]) => states.forEach((open, index) => {
    expect(wrapper.get(`[data-test="root-${index}"]`).attributes('data-state')).toBe(open ? 'open' : 'closed')
    expect(wrapper.get(`[data-test="trigger-${index}"]`).attributes('aria-expanded')).toBe(String(open))
    // jsdom normalizes hidden to boolean; native Find is tested separately in a browser.
    expect(wrapper.get(`[data-test="content-${index}"]`).element.hasAttribute('hidden')).toBe(!open)
  })
  return {
    wrapper,
    updates,
    found,
    beforematch,
    expectStates,
    acceptPendingUpdates: async () => {
      updates.forEach((events, index) => {
        if (events.length)
          state.value[index] = events.at(-1)!
      })
      await nextTick()
      await flushFrames()
    },
  }
}

for (const controlled of [false, true]) {
  describe(controlled ? 'controlled with parent accepting updates' : 'uncontrolled', () => {
    for (const depth of [2, 3]) {
      it(`reveals ${depth} closed layers for inner-to-outer bubbling beforematch`, async () => {
        const collapsible = await mountCollapsibles(Array.from({ length: depth }).fill(false), controlled)
        collapsible.expectStates(Array.from({ length: depth }).fill(false))
        for (let index = depth - 1; index >= 0; index--)
          collapsible.beforematch(index)
        await flushFrames()
        collapsible.expectStates(Array.from({ length: depth }).fill(true))
        collapsible.updates.forEach(events => expect(events).toEqual([true]))
        collapsible.found.forEach(events => expect(events).toHaveLength(1))
      })
    }
    it('ignores a descendant event on closed ancestors until their own events arrive', async () => {
      const collapsible = await mountCollapsibles([false, false, false], controlled)
      collapsible.beforematch(2)
      await flushFrames()
      collapsible.expectStates([false, false, true])
      expect(collapsible.updates).toEqual([[], [], [true]])
      expect(collapsible.found.map(events => events.length)).toEqual([0, 0, 1])
      collapsible.beforematch(1)
      await flushFrames()
      collapsible.expectStates([false, true, true])
      collapsible.beforematch(0)
      await flushFrames()
      collapsible.expectStates([true, true, true])
      expect(collapsible.updates).toEqual([[true], [true], [true]])
      expect(collapsible.found.map(events => events.length)).toEqual([1, 1, 1])
    })
    it('keeps an open parent open when only closed child receives beforematch', async () => {
      const collapsible = await mountCollapsibles([true, false], controlled)
      collapsible.beforematch(1)
      await flushFrames()
      collapsible.expectStates([true, true])
      expect(collapsible.updates).toEqual([[], [true]])
      expect(collapsible.found.map(events => events.length)).toEqual([0, 1])
    })
    for (const separateFrames of [false, true]) {
      it(`keeps repeated self events open ${separateFrames ? 'across frames' : 'within one frame'}`, async () => {
        const collapsible = await mountCollapsibles([false], controlled)
        collapsible.beforematch(0)
        if (separateFrames)
          await flushFrames()
        collapsible.beforematch(0)
        await flushFrames()
        collapsible.expectStates([true])
        expect(collapsible.updates[0]).toEqual([true])
        expect(collapsible.found[0]).toHaveLength(2)
      })
    }
    it('does not emit redundant updates when already open content is found again', async () => {
      const collapsible = await mountCollapsibles([true], controlled)
      collapsible.beforematch(0)
      collapsible.beforematch(0)
      await flushFrames()
      collapsible.beforematch(0)
      await flushFrames()
      collapsible.expectStates([true])
      expect(collapsible.updates).toEqual([[]])
      expect(collapsible.found[0]).toHaveLength(3)
    })
    it('preserves disabled guard and contentFound notification', async () => {
      const collapsible = await mountCollapsibles([false], controlled, true)
      collapsible.beforematch(0)
      await flushFrames()
      collapsible.expectStates([false])
      expect(collapsible.updates).toEqual([[]])
      expect(collapsible.found[0]).toHaveLength(1)
      await collapsible.wrapper.get('[data-test="trigger-0"]').trigger('click')
      await flushFrames()
      collapsible.expectStates([false])
      expect(collapsible.updates).toEqual([[]])
    })
    it('preserves ordinary trigger opening and closing', async () => {
      const collapsible = await mountCollapsibles([false], controlled)
      await collapsible.wrapper.get('[data-test="trigger-0"]').trigger('click')
      await flushFrames()
      collapsible.expectStates([true])
      await collapsible.wrapper.get('[data-test="trigger-0"]').trigger('click')
      await flushFrames()
      collapsible.expectStates([false])
      expect(collapsible.updates).toEqual([[true, false]])
      expect(collapsible.found).toEqual([[]])
    })
  })
}
it('only requests opening when a controlled parent declines repeated requests', async () => {
  const collapsible = await mountCollapsibles([false], true, false, false)
  collapsible.beforematch(0)
  collapsible.beforematch(0)
  await flushFrames()
  collapsible.beforematch(0)
  await flushFrames()
  collapsible.expectStates([false])
  expect(collapsible.updates).toEqual([[true, true, true]])
  expect(collapsible.found[0]).toHaveLength(3)
})

it('stops requesting updates after a controlled parent accepts a delayed request', async () => {
  const collapsible = await mountCollapsibles([false], true, false, false)
  collapsible.beforematch(0)
  collapsible.beforematch(0)
  await flushFrames()
  collapsible.expectStates([false])
  expect(collapsible.updates).toEqual([[true, true]])

  await collapsible.acceptPendingUpdates()
  collapsible.expectStates([true])
  collapsible.beforematch(0)
  await flushFrames()
  collapsible.expectStates([true])
  expect(collapsible.updates).toEqual([[true, true]])
  expect(collapsible.found[0]).toHaveLength(3)
})
