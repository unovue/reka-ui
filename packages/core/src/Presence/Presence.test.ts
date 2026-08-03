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
  it('should ignore bubbled animation events before reading styles', async () => {
    const getComputedStyleSpy = vi.spyOn(globalThis, 'getComputedStyle')
    const wrapper = mount(defineComponent({
      components: { Presence },
      template: `<Presence :present="true">
        <div data-testid="presence">
          <span data-testid="animated-child">Child</span>
        </div>
      </Presence>`,
    }))

    const createAnimationEndEvent = () => {
      const event = new Event('animationend', { bubbles: true })
      Object.defineProperty(event, 'animationName', { value: 'child-animation' })
      return event
    }

    try {
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
      wrapper.unmount()
      getComputedStyleSpy.mockRestore()
    }
  })
})
