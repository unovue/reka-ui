import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
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
