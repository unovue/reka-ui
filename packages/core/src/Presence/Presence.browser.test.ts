import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { cdp, userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
import { Presence } from '.'

describe('given a Presence with an exit animation', () => {
  it.each([false, true])('should wait for animationend before cleaning up with forceMount=%s', async (forceMount) => {
    const style = document.createElement('style')
    style.textContent = '@keyframes presenceExit { from { opacity: 1; } to { opacity: 0; } }'
    document.head.appendChild(style)
    const afterLeave = vi.fn()
    const wrapper = mount(defineComponent({
      setup() {
        const present = ref(true)
        return () => {
          const open = present.value
          return h('div', [
            h('button', { onClick: () => present.value = !present.value }, 'Toggle'),
            h(Presence, { present: open, forceMount }, ({ present: isPresent }) => h('span', {
              'data-testid': 'content',
              'data-present': isPresent,
              'style': {
                animationName: open ? 'none' : 'presenceExit',
                animationDuration: '1s',
                animationPlayState: 'paused',
              },
              'onAfterLeave': afterLeave,
            }, 'Content')),
          ])
        }
      },
    }), { attachTo: document.body })

    try {
      const content = wrapper.get('[data-testid="content"]').element
      await userEvent.click(wrapper.get('button').element)

      expect(content.isConnected).toBe(true)
      expect(content.getAttribute('data-present')).toBe('true')
      expect(afterLeave).not.toHaveBeenCalled()
      const animations = content.getAnimations()
      expect(animations).toHaveLength(1)
      animations[0].finish()

      await expect.poll(() => afterLeave.mock.calls.length).toBe(1)
      await expect.poll(() => wrapper.find('[data-testid="content"]').exists()).toBe(forceMount)
      if (forceMount)
        expect(content.getAttribute('data-present')).toBe('false')

      await userEvent.click(wrapper.get('button').element)
      await expect.poll(() => wrapper.get('[data-testid="content"]').attributes('data-present')).toBe('true')
    }
    finally {
      wrapper.unmount()
      style.remove()
    }
  })
})

describe('given many Presences closing together', () => {
  const COUNT = 100

  it('should read each animation name once and not recalculate styles per element', async () => {
    const style = document.createElement('style')
    // Removing an element invalidates styles through `:has()`, so each style read
    // between two removals costs one recalculation.
    style.textContent = 'label:has(.presence-item) { outline: 1px solid red; }'
    document.head.appendChild(style)

    const present = ref(true)
    const wrapper = mount(defineComponent({
      setup: () => () => h('div', Array.from({ length: COUNT }, (_, index) =>
        h('label', { key: index }, [
          h(Presence, { present: present.value }, () => h('span', { class: 'presence-item' }, 'x')),
        ]))),
    }), { attachTo: document.body })

    let nameReads = 0
    const originalGetComputedStyle = window.getComputedStyle.bind(window)
    const getComputedStyleSpy = vi.spyOn(window, 'getComputedStyle').mockImplementation((...args) => {
      return new Proxy(originalGetComputedStyle(...args), {
        get(target, property) {
          if (property === 'animationName')
            nameReads++
          const value = Reflect.get(target, property, target)
          return typeof value === 'function' ? value.bind(target) : value
        },
      })
    })

    const session = cdp() as unknown as { send: (method: string) => Promise<any> }
    const recalcCount = async () => {
      const { metrics } = await session.send('Performance.getMetrics')
      return metrics.find((metric: { name: string }) => metric.name === 'RecalcStyleCount').value as number
    }

    try {
      await nextTick()
      expect(document.querySelectorAll('.presence-item')).toHaveLength(COUNT)
      await session.send('Performance.enable')
      nameReads = 0
      const recalcsBefore = await recalcCount()

      present.value = false
      await expect.poll(() => document.querySelectorAll('.presence-item').length).toBe(0)
      const recalcs = await recalcCount() - recalcsBefore

      // One read per element decides whether an exit animation runs. A second
      // read after the state left `mounted` would be discarded.
      expect.soft(nameReads).toBe(COUNT)
      // The bound leaves room for unrelated frames: without the fix every
      // element adds a recalculation of its own.
      expect(recalcs).toBeLessThan(COUNT / 2)
    }
    finally {
      getComputedStyleSpy.mockRestore()
      wrapper.unmount()
      style.remove()
    }
  })
})
