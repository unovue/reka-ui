import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, onMounted, ref } from 'vue'
import { Presence } from '.'

const CONTENT = 'Content'

describe('given a default Presence', () => {
  const wrapper = mount(defineComponent({
    components: { Presence },
    setup: () => {
      return { open: ref(false) }
    },
    template: `<div>
    <button @click="open = !open">
      toggle
    </button>
  </div>
  <Presence :present="open">
    <div>${CONTENT}</div>
  </Presence>`,
  }))

  it('should not show content', () => {
    expect(wrapper.html()).not.toContain(CONTENT)
  })

  describe('after clicking trigger', () => {
    beforeEach(async () => {
      await wrapper.find('button').trigger('click')
    })

    it('should show content', () => {
      expect(wrapper.html()).toContain(CONTENT)
    })

    describe('after clicking trigger again', () => {
      it('should not show content', () => {
        expect(wrapper.html()).not.toContain(CONTENT)
      })
    })
  })
})

describe('given a forceMounted Presence', () => {
  const wrapper = mount(defineComponent({
    components: { Presence },
    setup: () => {
      return { open: ref(false) }
    },
    template: `<section>
    <button @click="open = !open">
      toggle
    </button>
  </section>
  <Presence forceMount :present="open" v-slot="{ present }">
    <div :data-present="present">${CONTENT}</div>
  </Presence>`,
  }))

  it('should show content', () => {
    expect(wrapper.html()).toContain(CONTENT)
    expect(wrapper.find('div').attributes('data-present')).toBe('false')
  })

  describe('after clicking trigger', () => {
    beforeEach(async () => {
      await wrapper.find('button').trigger('click')
    })

    it('should show content', () => {
      expect(wrapper.html()).toContain(CONTENT)
      expect(wrapper.find('div').attributes('data-present')).toBe('true')
    })

    describe('after clicking trigger again', () => {
      it('should always show content', () => {
        expect(wrapper.html()).toContain(CONTENT)
        expect(wrapper.find('div').attributes('data-present')).toBe('false')
      })
    })
  })
})

const styles = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

.animate[data-state=open]{
  animation: fadeIn 2s;
}
.animate[data-state=closed]{
  animation: fadeOut 2s;
}`

describe('given a Presence with animated content', () => {
  const wrapper = mount(defineComponent({
    components: { Presence },
    setup: (_props) => {
      const el = ref()

      onMounted(() => {
        const css = document.createElement('style')
        css.appendChild(document.createTextNode(styles))
        el.value.appendChild(css)
      })

      return { open: ref(false), el }
    },
    template: `<div ref="el">
    <button @click="open = !open">
      toggle
    </button>
    <Presence :present="open">
    <div class="animate" :data-state="open ? 'open' : 'closed'">${CONTENT}</div>
  </Presence>
  </div>`,
  }))

  it('should not show content', () => {
    expect(wrapper.html()).not.toContain(CONTENT)
  })

  describe('after clicking trigger', () => {
    beforeEach(async () => {
      await wrapper.find('button').trigger('click')
    })

    it('should show content', () => {
      expect(wrapper.html()).toContain(CONTENT)
    })

    describe('after clicking trigger again', () => {
      it('should not show content', () => {
        expect(wrapper.html()).not.toContain(CONTENT)
      })
    })
  })
})

describe('given an environment without Web Animations (jsdom)', () => {
  it('stamps no lifecycle attributes and settles in the same tick', async () => {
    expect(typeof Element.prototype.getAnimations).toBe('undefined')
    const open = ref(false)
    const onComplete = vi.fn()
    const wrapper = mount(defineComponent({
      components: { Presence },
      setup: () => ({ open, onComplete }),
      template: `<Presence :present="open" @complete="onComplete"><div data-testid="box">${CONTENT}</div></Presence>`,
    }))

    open.value = true
    await nextTick()
    const box = wrapper.find('[data-testid="box"]')
    expect(box.attributes()).not.toHaveProperty('data-starting-style')
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledWith(true))

    open.value = false
    await vi.waitFor(() => expect(wrapper.find('[data-testid="box"]').exists()).toBe(false))
    expect(onComplete).toHaveBeenLastCalledWith(false)
    expect(onComplete).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })
})

/**
 * A stand-in for a running CSS transition: `finish()` / `cancel()` settle its
 * `finished` promise the way the browser does.
 */
function createFakeAnimation() {
  let resolve!: (value: unknown) => void
  let reject!: (error: Error) => void
  const animation = {
    playState: 'running' as AnimationPlayState,
    effect: { getComputedTiming: () => ({ endTime: 200 }) },
    // Like the browser's, `finished` resolves with the animation itself.
    finished: new Promise<unknown>((res, rej) => {
      resolve = res
      reject = rej
    }),
    finish() {
      animation.playState = 'finished'
      resolve(animation)
    },
    cancel() {
      animation.playState = 'idle'
      reject(new DOMException('The user aborted a request.', 'AbortError'))
    },
  }
  animation.finished.catch(() => {})
  return animation
}

describe('given a Presence in an environment with Web Animations', () => {
  // jsdom has no `getAnimations`; stub it so the lifecycle logic runs. The real
  // timing (styles, transitions starting from the starting style) is covered by
  // `Presence.browser.test.ts`.
  let animations = new Map<Element, ReturnType<typeof createFakeAnimation>[]>()

  beforeEach(() => {
    animations = new Map()
    Element.prototype.getAnimations = function (this: Element) {
      return (animations.get(this) ?? []).filter(animation => animation.playState === 'running') as unknown as Animation[]
    }
  })
  afterEach(() => {
    // @ts-expect-error restoring jsdom's missing implementation
    delete Element.prototype.getAnimations
  })

  function mountAnimated() {
    const open = ref(false)
    const onComplete = vi.fn()
    const wrapper = mount(defineComponent({
      components: { Presence },
      setup: () => ({ open, onComplete }),
      template: `<Presence :present="open" @complete="onComplete">
        <div data-testid="box" :data-state="open ? 'open' : 'closed'"><span data-testid="child">${CONTENT}</span></div>
      </Presence>`,
    }))
    const box = () => wrapper.find('[data-testid="box"]')
    return { open, onComplete, wrapper, box }
  }

  it('renders data-starting-style for one frame after opening', async () => {
    const { open, onComplete, box, wrapper } = mountAnimated()

    open.value = true
    await nextTick()
    expect(box().attributes('data-starting-style')).toBe('')

    await vi.waitFor(() => expect(box().attributes()).not.toHaveProperty('data-starting-style'))
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledWith(true))
    wrapper.unmount()
  })

  it('keeps the node with data-ending-style until its animations finish', async () => {
    const { open, onComplete, box, wrapper } = mountAnimated()
    open.value = true
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledWith(true))

    const exit = createFakeAnimation()
    open.value = false
    await nextTick()
    expect(box().attributes('data-ending-style')).toBe('')
    animations.set(box().element, [exit])

    await nextTick()
    await nextTick()
    expect(box().exists()).toBe(true)
    expect(onComplete).toHaveBeenCalledTimes(1)

    exit.finish()
    await vi.waitFor(() => expect(box().exists()).toBe(false))
    expect(onComplete).toHaveBeenLastCalledWith(false)
    wrapper.unmount()
  })

  it('waits for a replacement when an exit animation is cancelled', async () => {
    const { open, onComplete, box, wrapper } = mountAnimated()
    open.value = true
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledWith(true))

    const first = createFakeAnimation()
    const replacement = createFakeAnimation()
    open.value = false
    await nextTick()
    animations.set(box().element, [first])
    await nextTick()
    await nextTick()

    animations.set(box().element, [first, replacement])
    first.cancel()
    await nextTick()
    await nextTick()
    expect(box().exists()).toBe(true)

    replacement.finish()
    await vi.waitFor(() => expect(box().exists()).toBe(false))
    expect(onComplete).toHaveBeenLastCalledWith(false)
    wrapper.unmount()
  })

  it('ignores animations running on descendants', async () => {
    const { open, onComplete, box, wrapper } = mountAnimated()
    open.value = true
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledWith(true))
    animations.set(wrapper.find('[data-testid="child"]').element, [createFakeAnimation()])

    open.value = false
    await vi.waitFor(() => expect(box().exists()).toBe(false))
    expect(onComplete).toHaveBeenLastCalledWith(false)
    wrapper.unmount()
  })

  it('does not report an exit that a reopen interrupted', async () => {
    const { open, onComplete, box, wrapper } = mountAnimated()
    open.value = true
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledWith(true))
    onComplete.mockClear()

    const exit = createFakeAnimation()
    open.value = false
    await nextTick()
    animations.set(box().element, [exit])
    await nextTick()
    await nextTick()

    open.value = true
    await nextTick()
    expect(box().attributes()).not.toHaveProperty('data-ending-style')
    expect(box().attributes()).not.toHaveProperty('data-starting-style')
    exit.finish()
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledWith(true))
    expect(onComplete).not.toHaveBeenCalledWith(false)
    expect(box().exists()).toBe(true)
    wrapper.unmount()
  })

  it('does not retain finished animations in the promise it waits on', async () => {
    const { open, onComplete, box, wrapper } = mountAnimated()
    open.value = true
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledWith(true))

    const all = vi.spyOn(Promise, 'all')
    const exit = createFakeAnimation()
    open.value = false
    await nextTick()
    animations.set(box().element, [exit])
    await nextTick()
    await nextTick()
    exit.finish()
    await vi.waitFor(() => expect(box().exists()).toBe(false))

    const joined = await Promise.allSettled(all.mock.results.map(result => result.value))
    all.mockRestore()
    expect(joined.length).toBeGreaterThan(0)
    for (const settled of joined)
      expect(settled.status === 'fulfilled' ? settled.value : []).not.toContain(exit)
    wrapper.unmount()
  })
})
