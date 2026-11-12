import type { Component } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineAsyncComponent, defineComponent, h, nextTick, onMounted, ref } from 'vue'
import { Presence } from '.'

const CONTENT = 'Content'

describe('given a Presence that stays mounted after closing', () => {
  it('should remove animation listeners from each unmounted child', async () => {
    const present = ref(true)
    const wrapper = mount(defineComponent({
      setup: () => () => h(Presence, { present: present.value }, () => h('div', CONTENT)),
    }))
    await flushPromises()

    for (let cycle = 0; cycle < 2; cycle++) {
      const element = wrapper.get('div').element
      const removeEventListener = vi.spyOn(element, 'removeEventListener')
      present.value = false
      await flushPromises()

      expect(wrapper.find('div').exists()).toBe(false)
      for (const event of ['animationstart', 'animationcancel', 'animationend'])
        expect(removeEventListener).toHaveBeenCalledWith(event, expect.any(Function))

      removeEventListener.mockRestore()
      present.value = true
      await flushPromises()
      expect(wrapper.get('div').element).not.toBe(element)
    }

    wrapper.unmount()
  })

  it('should clean up listeners when the child element is replaced', async () => {
    const tag = ref('div')
    const wrapper = mount(defineComponent({
      setup: () => () => h(Presence, { present: true }, () => h(tag.value, CONTENT)),
    }))
    await nextTick()
    const element = wrapper.get('div').element
    const removeEventListener = vi.spyOn(element, 'removeEventListener')

    tag.value = 'span'
    await nextTick()
    expect(wrapper.get('span').text()).toBe(CONTENT)
    for (const event of ['animationstart', 'animationcancel', 'animationend'])
      expect(removeEventListener).toHaveBeenCalledWith(event, expect.any(Function))

    removeEventListener.mockRestore()
    const removeReplacementListener = vi.spyOn(wrapper.get('span').element, 'removeEventListener')
    wrapper.unmount()
    for (const event of ['animationstart', 'animationcancel', 'animationend'])
      expect(removeReplacementListener).toHaveBeenCalledWith(event, expect.any(Function))
    removeReplacementListener.mockRestore()
  })
})

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

describe('given a Presence with an animated descendant', () => {
  it('should ignore bubbled animation events before reading styles', async () => {
    const getComputedStyleSpy = vi.spyOn(globalThis, 'getComputedStyle')
    const createAnimationEndEvent = () => {
      const event = new Event('animationend', { bubbles: true })
      Object.defineProperty(event, 'animationName', { value: 'child-animation' })
      return event
    }
    let wrapper: ReturnType<typeof mount> | undefined

    try {
      wrapper = mount(defineComponent({
        components: { Presence },
        template: `<Presence :present="true">
          <div data-testid="presence">
            <span data-testid="animated-child">Child</span>
          </div>
        </Presence>`,
      }))

      await nextTick()
      const presenceElement = wrapper.find('[data-testid="presence"]').element
      const animatedChild = wrapper.find('[data-testid="animated-child"]').element
      getComputedStyleSpy.mockClear()

      presenceElement.dispatchEvent(createAnimationEndEvent())
      expect(getComputedStyleSpy).toHaveBeenCalledWith(presenceElement)
      getComputedStyleSpy.mockClear()

      animatedChild.dispatchEvent(createAnimationEndEvent())
      expect(getComputedStyleSpy).not.toHaveBeenCalledWith(presenceElement)
    }
    finally {
      wrapper?.unmount()
      getComputedStyleSpy.mockRestore()
    }
  })
})

describe('given a Presence with an async child', () => {
  async function openWithAsyncChild(template: string) {
    let resolveChild!: (component: Component) => void
    const AsyncChild = defineAsyncComponent(() => new Promise<Component>((resolve) => {
      resolveChild = resolve
    }))
    const onEnter = vi.fn()
    const onAfterEnter = vi.fn()
    const open = ref(false)

    const wrapper = mount(defineComponent({
      setup: () => () => h(Presence, { present: open.value }, () => h(AsyncChild, { onEnter, onAfterEnter })),
    }))

    open.value = true
    await flushPromises()
    resolveChild(defineComponent({ template }))
    await flushPromises()

    return { wrapper, onEnter, onAfterEnter }
  }

  it('should dispatch enter events once the child element mounts', async () => {
    const { wrapper, onEnter, onAfterEnter } = await openWithAsyncChild(`<div>${CONTENT}</div>`)

    expect(wrapper.html()).toContain(CONTENT)
    expect(onEnter).toHaveBeenCalledOnce()
    expect(onAfterEnter).toHaveBeenCalledOnce()

    wrapper.unmount()
  })

  it('should wait for the enter animation before dispatching after-enter', async () => {
    const { wrapper, onEnter, onAfterEnter } = await openWithAsyncChild(`<div style="animation-name: fadeIn">${CONTENT}</div>`)

    expect(onEnter).toHaveBeenCalledOnce()
    expect(onAfterEnter).not.toHaveBeenCalled()

    const animationEnd = new Event('animationend')
    Object.defineProperty(animationEnd, 'animationName', { value: 'fadeIn' })
    wrapper.find('div').element.dispatchEvent(animationEnd)

    expect(onAfterEnter).toHaveBeenCalledOnce()

    wrapper.unmount()
  })
})

describe('given a Presence whose exit animation races with rendering', () => {
  const template = (key = '') => `<Presence :present="open">
    <div
      ${key}
      data-testid="animated"
      :data-state="open ? 'open' : 'closed'"
      @leave="events.push('leave')"
      @after-leave="events.push('after-leave')"
    />
  </Presence>`

  // Render flush, the present watcher's nextTick, then the state watcher.
  async function flushPresence() {
    await nextTick()
    await nextTick()
    await nextTick()
  }

  function mockLiveAnimationStyles() {
    const styles = new WeakMap<Element, CSSStyleDeclaration>()
    return vi.spyOn(globalThis, 'getComputedStyle').mockImplementation((element) => {
      let style = styles.get(element)
      if (!style) {
        style = {
          get animationName() {
            return (element as HTMLElement).dataset.state === 'closed' ? 'fadeOut' : 'fadeIn'
          },
          get display() {
            return 'block'
          },
        } as CSSStyleDeclaration
        styles.set(element, style)
      }
      return style
    })
  }

  async function expectExitAnimationToComplete(wrapper: ReturnType<typeof mount>, events: string[]) {
    const element = wrapper.find('[data-testid="animated"]')
    expect(element.exists()).toBe(true)
    expect(events).toEqual(['leave'])

    const animationEnd = new Event('animationend')
    Object.defineProperty(animationEnd, 'animationName', { value: 'fadeOut' })
    element.element.dispatchEvent(animationEnd)
    await flushPresence()

    expect(wrapper.find('[data-testid="animated"]').exists()).toBe(false)
    expect(events).toEqual(['leave', 'after-leave'])
  }

  it('should keep the exit animation when present becomes false before the mount flush', async () => {
    const open = ref(true)
    const events: string[] = []
    const getComputedStyleSpy = mockLiveAnimationStyles()
    const wrapper = mount(defineComponent({
      components: { Presence },
      setup: () => ({ events, open }),
      template: template(),
    }))

    try {
      open.value = false
      await flushPresence()
      await expectExitAnimationToComplete(wrapper, events)
    }
    finally {
      wrapper.unmount()
      getComputedStyleSpy.mockRestore()
    }
  })

  it('should keep the exit animation when the child root is replaced while closing', async () => {
    const open = ref(true)
    const events: string[] = []
    const getComputedStyleSpy = mockLiveAnimationStyles()
    const wrapper = mount(defineComponent({
      components: { Presence },
      setup: () => ({ events, open }),
      template: template(`:key="open ? 'open' : 'closed'"`),
    }))

    try {
      await flushPresence()
      events.length = 0

      open.value = false
      await flushPresence()
      await expectExitAnimationToComplete(wrapper, events)
    }
    finally {
      wrapper.unmount()
      getComputedStyleSpy.mockRestore()
    }
  })
})
