import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { usePresence } from './usePresence'

function animation(endTime = 100) {
  let finish!: () => void
  let cancel!: () => void
  const finished = new Promise<void>((resolve, reject) => {
    finish = resolve
    cancel = () => reject(new Error('Canceled'))
  })
  return {
    value: { playState: 'running', pending: false, finished, effect: { getComputedTiming: () => ({ endTime }) } } as unknown as Animation,
    finish,
    cancel,
  }
}

function setup() {
  const present = ref(true)
  const node = ref<HTMLElement>()
  let state!: ReturnType<typeof usePresence>
  const wrapper = mount(defineComponent({
    setup() {
      state = usePresence(present, node)
      return () => h('div', { ref: node })
    },
  }))
  const getAnimations = vi.fn<() => Animation[]>(() => [])
  node.value!.getAnimations = getAnimations
  async function setPresent(value: boolean) {
    present.value = value
    await nextTick()
    await nextTick()
  }
  return { wrapper, state, getAnimations, setPresent }
}

describe('presence Web Animations lifecycle', () => {
  it('waits for every running exit to finish or cancel', async () => {
    const fixture = setup()
    const first = animation()
    const second = animation()
    fixture.getAnimations.mockReturnValue([first.value, second.value])
    await fixture.setPresent(false)
    expect(fixture.state.isPresent.value).toBe(true)
    first.finish()
    await flushPromises()
    expect(fixture.state.isPresent.value).toBe(true)
    second.cancel()
    await flushPromises()
    expect(fixture.state.isPresent.value).toBe(false)
    fixture.wrapper.unmount()
  })

  it('does not let an earlier exit finish a newer close', async () => {
    const fixture = setup()
    const first = animation()
    const second = animation()
    fixture.getAnimations.mockReturnValue([first.value])
    await fixture.setPresent(false)
    await fixture.setPresent(true)
    fixture.getAnimations.mockReturnValue([second.value])
    await fixture.setPresent(false)
    first.cancel()
    await flushPromises()
    expect(fixture.state.isPresent.value).toBe(true)
    second.finish()
    await flushPromises()
    expect(fixture.state.isPresent.value).toBe(false)
    fixture.wrapper.unmount()
  })

  it('ignores infinite and already finished animations', async () => {
    const fixture = setup()
    const infinite = animation(Infinity)
    const completed = animation()
    completed.value.playState = 'finished'
    fixture.getAnimations.mockReturnValue([infinite.value, completed.value])
    await fixture.setPresent(false)
    expect(fixture.state.isPresent.value).toBe(false)
    fixture.wrapper.unmount()
  })

  it('waits for a pending delayed exit', async () => {
    const fixture = setup()
    const delayed = animation()
    delayed.value.playState = 'idle'
    delayed.value.pending = true
    fixture.getAnimations.mockReturnValue([delayed.value])
    await fixture.setPresent(false)
    expect(fixture.state.isPresent.value).toBe(true)
    delayed.finish()
    await flushPromises()
    expect(fixture.state.isPresent.value).toBe(false)
    fixture.wrapper.unmount()
  })
})
