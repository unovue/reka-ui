import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { Presence } from '.'

function mountPresence(transition: string, extra = '') {
  const open = ref(true)
  const css = document.createElement('style')
  css.textContent = `
    .presence-exit { opacity: 1; transform: translateX(0); transition: ${transition}; }
    .presence-exit[data-state=closed] { opacity: 0; transform: translateX(50px); }
    @keyframes presence-fade { from { opacity: 1; } to { opacity: 0; } }
    ${extra}
  `
  document.head.append(css)
  const wrapper = mount(defineComponent({
    setup: () => () => h(Presence, { present: open.value }, () => h('div', {
      'class': 'presence-exit',
      'data-state': open.value ? 'open' : 'closed',
    }, 'Content')),
  }), { attachTo: document.body })
  const element = wrapper.get('div').element as HTMLElement
  // Establish the open style before changing transition endpoints.
  getComputedStyle(element).opacity
  const dispose = () => {
    wrapper.unmount()
    css.remove()
  }
  return { open, element, dispose }
}

async function close(open: { value: boolean }) {
  open.value = false
  await nextTick()
  await nextTick()
}

describe('presence CSS exits in a real browser', () => {
  it('does not wait for an unrelated declared transition', async () => {
    const { open, element, dispose } = mountPresence('color 5s')
    await close(open)
    expect(element.isConnected).toBe(false)
    dispose()
  })

  it.each(['opacity 100ms, transform 220ms', 'all 150ms'])('waits for actual transitions: %s', async (transition) => {
    const { open, element, dispose } = mountPresence(transition)
    await close(open)
    expect(element.isConnected).toBe(true)
    await Promise.allSettled(element.getAnimations().map(animation => animation.finished))
    await expect.poll(() => element.isConnected).toBe(false)
    dispose()
  })

  it('waits for both an exit animation and a longer transition', async () => {
    const { open, element, dispose } = mountPresence('transform 250ms', '.presence-exit[data-state=closed] { animation: presence-fade 80ms; }')
    await close(open)
    expect(element.isConnected).toBe(true)
    const animations = element.getAnimations()
    expect(animations.length).toBe(2)
    await Promise.allSettled(animations.map(animation => animation.finished))
    await expect.poll(() => element.isConnected).toBe(false)
    dispose()
  })

  it('ignores a superseded exit and the canceled reverse transition on reclose', async () => {
    const { open, element, dispose } = mountPresence('opacity 400ms')
    await close(open)
    await new Promise(resolve => setTimeout(resolve, 80))
    open.value = true
    await nextTick()
    await nextTick()
    getComputedStyle(element).opacity
    await new Promise(resolve => setTimeout(resolve, 30))
    await close(open)
    expect(element.isConnected).toBe(true)
    const exits = element.getAnimations()
    expect(exits.length).toBeGreaterThan(0)
    await Promise.allSettled(exits.map(animation => animation.finished))
    await expect.poll(() => element.isConnected).toBe(false)
    dispose()
  })

  it('keeps reopened content mounted when the previous exit settles', async () => {
    const { open, element, dispose } = mountPresence('opacity 100ms')
    await close(open)
    open.value = true
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 180))
    expect(element.isConnected).toBe(true)
    dispose()
  })
})
