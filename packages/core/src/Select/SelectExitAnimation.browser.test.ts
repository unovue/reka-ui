import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '.'

// jsdom runs no CSS animations, so whether the content waits for its exit animation can only be checked here.
describe('given a Select whose content animates with CSS, in a real browser', () => {
  const ITEMS = ['apple', 'banana', 'cherry', 'grape', 'melon']
  const DURATION = 200
  const positions = ['item-aligned', 'popper'] as const
  const style = document.createElement('style')
  let wrapper: VueWrapper | undefined

  beforeAll(() => {
    style.textContent = `
      @keyframes selectIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes selectOut { from { opacity: 1; } to { opacity: 0; } }
      .animated[data-state="open"] { animation: selectIn ${DURATION}ms linear; }
      .animated[data-state="closed"] { animation: selectOut ${DURATION}ms linear; }
    `
    document.head.appendChild(style)
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })
  afterAll(() => style.remove())

  function mountSelect(options: {
    position: 'item-aligned' | 'popper'
    animated?: boolean
    forceMount?: boolean
  }) {
    const modelValue = ref('cherry')
    const open = ref(false)
    const events: string[] = []
    wrapper = mount(defineComponent({
      setup() {
        return () => h('div', { style: 'padding: 200px 40px' }, [
          h(SelectRoot, {
            'modelValue': modelValue.value,
            'onUpdate:modelValue': (value: string) => modelValue.value = value,
            'open': open.value,
            'onUpdate:open': (value: boolean) => open.value = value,
          }, () => [
            h(SelectTrigger, { 'data-testid': 'trigger', 'style': 'width: 200px; height: 36px; padding: 0 12px; text-align: left' }, () => h(SelectValue, { 'data-testid': 'value' })),
            h(SelectPortal, () => h(SelectContent, {
              position: options.position,
              forceMount: options.forceMount,
              class: options.animated === false ? 'content' : 'content animated',
              style: 'width: 200px; background: white; border: 1px solid black',
              onAfterLeave: () => events.push('after-leave'),
            }, () =>
              h(SelectViewport, () => ITEMS.map(value =>
                h(SelectItem, { value, 'data-testid': value, 'style': 'display: block; height: 36px; padding: 0 12px; line-height: 36px' }, () =>
                  h(SelectItemText, { 'data-testid': `${value}-text` }, () => value)),
              )))),
          ]),
          h('button', { 'data-testid': 'outside', 'style': 'position: fixed; right: 0; bottom: 0' }, 'outside'),
        ])
      },
    }), { attachTo: document.body })
    return { modelValue, open, events }
  }

  const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
  const content = () => document.querySelector<HTMLElement>('.content')
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  async function openSelect() {
    await userEvent.click(get('trigger')!)
    // The content focuses its selected item once it is positioned.
    await expect.poll(() => document.activeElement).toBe(get('cherry'))
  }

  const closers = {
    'picking an item': () => userEvent.click(get('banana')!),
    'pressing Escape': () => userEvent.keyboard('{Escape}'),
    // The open content disables pointer events on the body, hence `force`.
    'clicking outside': () => userEvent.click(get('outside')!, { force: true }),
  }

  describe.each(positions)('with position="%s"', (position) => {
    it.each(Object.keys(closers) as (keyof typeof closers)[])('keeps the content mounted through its exit animation when closed by %s', async (closer) => {
      const { open, events } = mountSelect({ position })
      await openSelect()
      const element = content()!
      expect(getComputedStyle(element).animationName).toBe('selectIn')
      // Let the open animation finish, so the exit starts from rest.
      await wait(DURATION + 50)

      // Taken before closing: the exit animation cannot have started any earlier than this.
      const closedAt = performance.now()
      await closers[closer]()
      await expect.poll(() => open.value).toBe(false)

      await expect.poll(() => element.getAttribute('data-state')).toBe('closed')
      await wait(DURATION / 4)
      expect(element.isConnected).toBe(true)
      expect(element.getAttribute('data-state')).toBe('closed')
      expect(element.getAnimations().map(animation => (animation as CSSAnimation).animationName)).toEqual(['selectOut'])
      // The scroll lock and the trigger's focus are both given back when the content goes.
      expect(document.body.style.overflow).toBe('hidden')
      expect(events).toEqual([])

      await expect.poll(() => content()).toBeNull()
      expect(performance.now() - closedAt).toBeGreaterThanOrEqual(DURATION - 20)
      expect(events).toEqual(['after-leave'])
      await expect.poll(() => document.body.style.overflow).toBe('')
      await expect.poll(() => document.activeElement).toBe(get('trigger'))
    })

    it('removes the content right away when it has no exit animation', async () => {
      const { open } = mountSelect({ position, animated: false })
      await openSelect()

      await userEvent.keyboard('{Escape}')
      await expect.poll(() => open.value).toBe(false)
      const closedAt = performance.now()

      await expect.poll(() => content(), { interval: 5 }).toBeNull()
      expect(performance.now() - closedAt).toBeLessThan(DURATION / 2)
      await expect.poll(() => document.body.style.overflow).toBe('')
      await expect.poll(() => document.activeElement).toBe(get('trigger'))
    })

    it('keeps the content mounted after its exit animation with `forceMount`', async () => {
      const { open } = mountSelect({ position, forceMount: true })
      await expect.poll(() => content()).not.toBeNull()
      // The force-mounted content lies over the trigger, so this opens and closes through the model.
      open.value = true
      await expect.poll(() => content()?.getAttribute('data-state')).toBe('open')
      await wait(DURATION + 50)

      open.value = false
      await expect.poll(() => content()?.getAttribute('data-state')).toBe('closed')
      await wait(DURATION + 100)

      expect(content()?.isConnected).toBe(true)
      expect(content()?.getAttribute('data-state')).toBe('closed')
    })

    it('reopens while the exit animation is still running', async () => {
      const { open } = mountSelect({ position })
      await openSelect()
      await wait(DURATION + 50)

      await userEvent.keyboard('{Escape}')
      await expect.poll(() => content()?.getAttribute('data-state')).toBe('closed')
      open.value = true

      await expect.poll(() => content()?.getAttribute('data-state')).toBe('open')
      await wait(DURATION + 100)
      expect(content()?.isConnected).toBe(true)
      expect(open.value).toBe(true)
    })
  })

  describe('with position="item-aligned"', () => {
    it.each([true, false])('lays the selected item over the trigger value, animated=%s', async (animated) => {
      mountSelect({ position: 'item-aligned', animated })
      await openSelect()

      const value = get('value')!.getBoundingClientRect()
      const text = get('cherry-text')!.getBoundingClientRect()
      expect(Math.abs(text.left - value.left)).toBeLessThanOrEqual(2)
      expect(Math.abs((text.top + text.height / 2) - (value.top + value.height / 2))).toBeLessThanOrEqual(2)
    })

    it('keeps the consumer attributes on the content and not on its wrapper', async () => {
      mountSelect({ position: 'item-aligned' })
      await openSelect()

      const element = content()!
      expect(element.getAttribute('role')).toBe('listbox')
      expect(element.parentElement?.className).toBe('')
      expect(element.parentElement?.style.position).toBe('fixed')
    })
  })
})
