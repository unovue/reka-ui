import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, Transition } from 'vue'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '.'

const ITEMS = ['apple', 'banana', 'cherry']
const PLACEHOLDER = 'Pick a fruit'
const DURATION = 400

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const listbox = () => document.querySelector<HTMLElement>('[role="listbox"]')
// The Transition also sees the empty element that stands in for the content while closed.
const isContent = (el: Element) => el.matches('[role="listbox"]') || !!el.querySelector('[role="listbox"]')
const trigger = () => document.querySelector<HTMLElement>('[data-testid="trigger"]')!

// jsdom runs no CSS transitions or animations, so how long the closing content stays can only be checked here.
describe.each(['item-aligned', 'popper'] as const)('given a Select with position=%s whose content leaves with an animation, in a real browser', (position) => {
  const style = document.createElement('style')
  let wrapper: VueWrapper | undefined

  beforeAll(() => {
    style.textContent = `
      .select-fade-leave-active { transition: opacity ${DURATION}ms linear; }
      .select-fade-leave-to { opacity: 0; }
      @keyframes selectTransitionExitOut { from { opacity: 1; } to { opacity: 0; } }
      .select-keyframes[data-state="closed"] { animation: selectTransitionExitOut ${DURATION}ms linear; }
    `
    document.head.appendChild(style)
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })
  afterAll(() => style.remove())

  function mountSelect(animation: 'transition' | 'keyframes') {
    const events: string[] = []
    const content = () => h(SelectContent, {
      position,
      class: animation === 'keyframes' ? 'select-keyframes' : undefined,
      style: 'width: 200px; background: white;',
    }, () => h(SelectViewport, () => ITEMS.map(value =>
      h(SelectItem, { value, 'data-testid': value }, () => h(SelectItemText, () => value)),
    )))
    wrapper = mount(defineComponent({
      setup() {
        return () => h('div', { style: 'padding: 200px 40px' }, [
          h(SelectRoot, { defaultValue: 'apple' }, () => [
            h(SelectTrigger, { 'data-testid': 'trigger' }, () => h(SelectValue, { placeholder: PLACEHOLDER })),
            h(SelectPortal, () => animation === 'transition'
              ? h(Transition, {
                  name: 'select-fade',
                  onBeforeLeave: (el: Element) => isContent(el) && events.push('before-leave'),
                  onAfterLeave: (el: Element) => isContent(el) && events.push('after-leave'),
                }, content)
              : content()),
          ]),
        ])
      },
    }), {
      attachTo: document.body,
      // Test utils replace `<Transition>` with a stub that runs no leave.
      global: { stubs: { transition: false } },
    })
    return events
  }

  async function open() {
    await userEvent.click(trigger())
    await expect.poll(() => listbox()).not.toBeNull()
    return listbox()!
  }

  it('keeps the content for the leave of a Vue Transition around it', async () => {
    const events = mountSelect('transition')
    const content = await open()

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => events).toEqual(['before-leave'])

    // Part of the way through the leave: still in the document, still leaving.
    await wait(DURATION / 4)
    expect(content.isConnected).toBe(true)
    expect(events).toEqual(['before-leave'])
    expect(document.querySelector('.select-fade-leave-active')?.contains(content)).toBe(true)

    await expect.poll(() => content.isConnected).toBe(false)
    expect(events).toEqual(['before-leave', 'after-leave'])
  })

  it('keeps the label of the trigger while the content leaves in a Vue Transition', async () => {
    mountSelect('transition')
    await open()
    const seen = new Set<string>()
    const observer = new MutationObserver(() => seen.add(trigger().textContent?.trim() ?? ''))
    observer.observe(trigger(), { childList: true, subtree: true, characterData: true })

    await userEvent.click(document.querySelector<HTMLElement>('[data-testid="banana"]')!)
    await expect.poll(() => listbox()).toBeNull()
    observer.disconnect()

    expect(trigger().textContent?.trim()).toBe('banana')
    expect(seen.has(PLACEHOLDER)).toBe(false)
    expect(seen.has('')).toBe(false)
  })

  it('keeps the content for a keyframe exit on its closed state', async () => {
    mountSelect('keyframes')
    const content = await open()

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => content.getAttribute('data-state')).toBe('closed')

    await wait(DURATION / 4)
    expect(content.isConnected).toBe(true)
    expect(content.getAnimations().map(animation => (animation as CSSAnimation).animationName)).toEqual(['selectTransitionExitOut'])

    await expect.poll(() => content.isConnected).toBe(false)
  })
})
