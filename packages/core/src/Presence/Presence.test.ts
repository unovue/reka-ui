import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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

describe('given a Presence with an animated descendant', () => {
  it('should handle animation events from cached styles and ignore bubbled events', async () => {
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
      expect(getComputedStyleSpy).not.toHaveBeenCalled()

      animatedChild.dispatchEvent(createAnimationEndEvent())
      expect(getComputedStyleSpy).not.toHaveBeenCalled()
    }
    finally {
      wrapper?.unmount()
      getComputedStyleSpy.mockRestore()
    }
  })
})

describe('given batched Presence updates', () => {
  it('waits for the batch to mount before reading initial animation names', async () => {
    const present = ref(false)
    const animationReadNodeCounts: number[] = []
    const deferredAnimationReads: boolean[] = []
    const styles = new WeakMap<Element, CSSStyleDeclaration>()
    const getComputedStyleSpy = vi.spyOn(globalThis, 'getComputedStyle').mockImplementation((element) => {
      let style = styles.get(element)
      if (!style) {
        let canReadAnimation = false
        queueMicrotask(() => canReadAnimation = true)
        style = {
          get animationName() {
            animationReadNodeCounts.push(document.querySelectorAll('[data-batch-presence]').length)
            deferredAnimationReads.push(canReadAnimation)
            return 'none'
          },
          get display() {
            return 'block'
          },
        } as CSSStyleDeclaration
        styles.set(element, style)
      }
      return style
    })
    const host = document.createElement('div')
    document.body.append(host)
    const wrapper = mount(defineComponent({
      components: { Presence },
      setup: () => ({ present }),
      template: `<div>
        <Presence v-for="index in 6" :key="index" :present="present">
          <span data-batch-presence />
        </Presence>
      </div>`,
    }), { attachTo: host })

    try {
      await flushPresence()
      animationReadNodeCounts.length = 0
      deferredAnimationReads.length = 0

      present.value = true
      await flushPresence()

      expect(wrapper.findAll('[data-batch-presence]')).toHaveLength(6)
      expect(animationReadNodeCounts.length).toBeGreaterThan(0)
      expect(animationReadNodeCounts.every(count => count === 6)).toBe(true)
      expect(deferredAnimationReads.every(Boolean)).toBe(true)
    }
    finally {
      wrapper.unmount()
      host.remove()
      getComputedStyleSpy.mockRestore()
    }
  })

  it('does not read computed styles while unmounting non-animated nodes', async () => {
    const present = ref(true)
    const getComputedStyleSpy = vi.spyOn(globalThis, 'getComputedStyle')
    const wrapper = mount(defineComponent({
      components: { Presence },
      setup: () => ({ present }),
      template: `<div>
        <Presence v-for="index in 6" :key="index" :present="present">
          <span :data-index="index" />
        </Presence>
      </div>`,
    }))

    try {
      await flushPresence()
      getComputedStyleSpy.mockClear()

      present.value = false
      await flushPresence()

      expect(wrapper.findAll('span')).toHaveLength(0)
      expect(getComputedStyleSpy).not.toHaveBeenCalled()
    }
    finally {
      wrapper.unmount()
      getComputedStyleSpy.mockRestore()
    }
  })

  it('keeps animated content mounted until its exit animation ends', async () => {
    const open = ref(true)
    const events: string[] = []
    const getComputedStyleSpy = mockLiveAnimationStyles()
    const wrapper = mount(defineComponent({
      components: { Presence },
      setup: () => ({ events, open }),
      template: `<Presence :present="open">
        <div
          data-testid="animated"
          :data-state="open ? 'open' : 'closed'"
          @leave="events.push('leave')"
          @after-leave="events.push('after-leave')"
        />
      </Presence>`,
    }))

    try {
      await flushPresence()
      events.length = 0

      open.value = false
      await flushPresence()

      const element = wrapper.find('[data-testid="animated"]')
      expect(element.exists()).toBe(true)
      expect(events).toEqual(['leave'])

      element.element.dispatchEvent(createAnimationEvent('animationend', 'fadeOut'))
      await flushPresence()

      expect(wrapper.find('[data-testid="animated"]').exists()).toBe(false)
      expect(events).toEqual(['leave', 'after-leave'])
    }
    finally {
      wrapper.unmount()
      getComputedStyleSpy.mockRestore()
    }
  })

  it('does not let a stale exit animation unmount a quickly remounted node', async () => {
    const open = ref(true)
    const getComputedStyleSpy = mockLiveAnimationStyles()
    const wrapper = mount(defineComponent({
      components: { Presence },
      setup: () => ({ open }),
      template: `<Presence :present="open">
        <div data-testid="animated" :data-state="open ? 'open' : 'closed'" />
      </Presence>`,
    }))

    try {
      await flushPresence()

      open.value = false
      await flushPresence()
      const element = wrapper.find('[data-testid="animated"]')

      open.value = true
      await flushPresence()
      element.element.dispatchEvent(createAnimationEvent('animationend', 'fadeOut'))
      await flushPresence()

      expect(wrapper.find('[data-testid="animated"]').exists()).toBe(true)
    }
    finally {
      wrapper.unmount()
      getComputedStyleSpy.mockRestore()
    }
  })

  it('caches the initial animation name when the node mounts', async () => {
    const open = ref(true)
    const getComputedStyleSpy = mockLiveAnimationStyles(() => 'stableAnimation')
    const wrapper = mount(defineComponent({
      components: { Presence },
      setup: () => ({ open }),
      template: `<Presence :present="open">
        <div data-testid="animated" />
      </Presence>`,
    }))

    try {
      await flushPresence()
      expect(getComputedStyleSpy).toHaveBeenCalledTimes(1)

      open.value = false
      await flushPresence()

      expect(wrapper.find('[data-testid="animated"]').exists()).toBe(false)
    }
    finally {
      wrapper.unmount()
      getComputedStyleSpy.mockRestore()
    }
  })

  it('preserves enter and leave event order without animations', async () => {
    const open = ref(false)
    const events: string[] = []
    const wrapper = mount(defineComponent({
      components: { Presence },
      setup: () => ({ events, open }),
      template: `<Presence :present="open">
        <div
          @enter="events.push('enter')"
          @after-enter="events.push('after-enter')"
          @leave="events.push('leave')"
          @after-leave="events.push('after-leave')"
        />
      </Presence>`,
    }))

    try {
      open.value = true
      await flushPresence()
      open.value = false
      await flushPresence()

      expect(events).toEqual(['enter', 'after-enter', 'leave', 'after-leave'])
    }
    finally {
      wrapper.unmount()
    }
  })
})

async function flushPresence() {
  await nextTick()
  await nextTick()
  await nextTick()
}

function mockLiveAnimationStyles(
  getAnimationName: (element: HTMLElement) => string = element =>
    element.dataset.state === 'closed' ? 'fadeOut' : 'fadeIn',
) {
  const styles = new WeakMap<Element, CSSStyleDeclaration>()
  return vi.spyOn(globalThis, 'getComputedStyle').mockImplementation((element) => {
    let style = styles.get(element)
    if (!style) {
      style = {
        get animationName() {
          return getAnimationName(element as HTMLElement)
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

function createAnimationEvent(type: 'animationend' | 'animationcancel', animationName: string) {
  const event = new Event(type)
  Object.defineProperty(event, 'animationName', { value: animationName })
  return event
}
