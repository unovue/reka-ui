import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { cdp, userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '.'

// jsdom has no touch input and never follows a tap with a `click`, so which element a tap's
// events land on can only be checked with real (CDP) pointer input.
describe('given a Select used with a real pointer, in a real browser', () => {
  const ITEMS = ['apple', 'banana', 'cherry', 'grape', 'melon']
  let wrapper: VueWrapper | undefined

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    document.body.innerHTML = ''
  })

  function mountSelect(options: {
    rootProps?: Record<string, unknown>
    position?: 'item-aligned' | 'popper'
    modelValue?: string | string[]
    itemAs?: string
    behind?: boolean
  } = {}) {
    const modelValue = ref<string | string[] | undefined>(options.modelValue)
    const selects: string[] = []
    const itemClicks: string[] = []
    let behindClicks = 0

    wrapper = mount(defineComponent({
      setup() {
        return () => h('div', { style: 'padding: 160px 40px' }, [
          // Sits under the open menu, the way page content does.
          options.behind
            ? h('button', {
                'data-testid': 'behind',
                'style': 'position: fixed; inset: 0; width: 100%; height: 100%',
                'onClick': () => behindClicks++,
              }, 'behind')
            : null,
          h(SelectRoot, {
            'modelValue': modelValue.value,
            'onUpdate:modelValue': (value: string | string[]) => modelValue.value = value,
            ...options.rootProps,
          }, () => [
            h(SelectTrigger, { 'data-testid': 'trigger', 'style': 'position: relative; width: 200px; height: 36px' }, () => h(SelectValue, { placeholder: 'Pick a fruit' })),
            h(SelectPortal, () => h(SelectContent, { position: options.position, style: 'width: 200px; background: white' }, () =>
              h(SelectViewport, () => ITEMS.map(value =>
                h(SelectItem, {
                  value,
                  'as': options.itemAs,
                  'data-testid': value,
                  'style': 'display: block; width: 100%; height: 36px',
                  'onSelect': () => selects.push(value),
                  'onClick': () => itemClicks.push(value),
                }, () => h(SelectItemText, () => value)),
              )))),
          ]),
        ])
      },
    }), { attachTo: document.body })

    return { modelValue, selects, itemClicks, getBehindClicks: () => behindClicks }
  }

  const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
  const isOpen = () => !!document.querySelector('[role=listbox]')

  // The menu focuses its selected (or first) item once positioned; interacting earlier races that.
  async function opened() {
    await expect.poll(() => document.activeElement?.closest('[role=listbox]')).toBeTruthy()
    await settle()
  }

  // Long enough for a selection (one tick) and the menu teardown (one macrotask) to have happened.
  async function settle() {
    await nextTick()
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  }

  // CDP input uses top-level viewport coordinates; the test runs inside an iframe.
  function centerOf(element: Element) {
    const rect = element.getBoundingClientRect()
    const frame = window.frameElement as HTMLElement
    const frameRect = frame.getBoundingClientRect()
    const scale = frameRect.width / frame.offsetWidth
    return {
      x: Math.round(frameRect.left + (rect.left + rect.width / 2) * scale),
      y: Math.round(frameRect.top + (rect.top + rect.height / 2) * scale),
    }
  }

  const send = (method: string, params: Record<string, unknown>) => (cdp() as any).send(method, params)

  async function tap(element: Element) {
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [centerOf(element)] })
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  }

  describe('when tapping the trigger of an item-aligned Select', () => {
    // The menu opens on the tap's `pointerup` and lays an item over the trigger, so the
    // tap's trailing `click` lands on that item.
    it.each([
      ['without a value', undefined],
      ['with a value', 'cherry'],
    ])('opens and stays open without selecting, %s', async (_label, initial) => {
      const { modelValue, selects, itemClicks } = mountSelect({ modelValue: initial })

      await tap(get('trigger')!)
      await expect.poll(() => itemClicks.length).toBe(1)
      await settle()

      expect(selects).toEqual([])
      expect(modelValue.value).toBe(initial)
      expect(isOpen()).toBe(true)
    })
  })

  describe('when tapping an item', () => {
    it('selects it once and closes', async () => {
      const { modelValue, selects } = mountSelect({ position: 'popper', rootProps: { defaultOpen: true } })
      await opened()

      await tap(get('banana')!)

      await expect.poll(() => modelValue.value).toBe('banana')
      await expect.poll(isOpen).toBe(false)
      expect(selects).toEqual(['banana'])
    })

    it('toggles it once when `multiple`', async () => {
      const { modelValue, selects, itemClicks } = mountSelect({ position: 'popper', modelValue: [], rootProps: { defaultOpen: true, multiple: true } })
      await opened()

      await tap(get('banana')!)

      await expect.poll(() => itemClicks).toEqual(['banana'])
      await settle()
      expect(modelValue.value).toEqual(['banana'])
      expect(selects).toEqual(['banana'])
      expect(isOpen()).toBe(true)
    })

    // https://github.com/unovue/reka-ui/issues/578
    it('does not click the element behind the menu once it closes', async () => {
      const { modelValue, getBehindClicks } = mountSelect({ position: 'popper', behind: true, rootProps: { defaultOpen: true } })
      await opened()
      const point = centerOf(get('banana')!)

      await tap(get('banana')!)
      await expect.poll(() => modelValue.value).toBe('banana')
      await expect.poll(isOpen).toBe(false)
      await settle()

      const frameRect = (window.frameElement as HTMLElement).getBoundingClientRect()
      expect(document.elementFromPoint(point.x - frameRect.left, point.y - frameRect.top)).toBe(get('behind'))
      expect(getBehindClicks()).toBe(0)
    })
  })

  describe('when pressing the trigger, dragging onto an item and releasing', () => {
    it.each(['mouse', 'pen'])('selects the item with a %s', async (pointerType) => {
      const { modelValue, selects } = mountSelect({ position: 'popper' })
      const press = centerOf(get('trigger')!)

      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...press, pointerType })
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...press, button: 'left', buttons: 1, clickCount: 1, pointerType })
      await expect.poll(() => get('banana')).not.toBeNull()

      const release = centerOf(get('banana')!)
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: release.x, y: release.y - 4, button: 'left', buttons: 1, pointerType })
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...release, button: 'left', buttons: 1, pointerType })
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...release, button: 'left', clickCount: 1, pointerType })

      await expect.poll(() => modelValue.value).toBe('banana')
      await expect.poll(isOpen).toBe(false)
      expect(selects).toEqual(['banana'])
    })
  })

  describe('when clicking an item with a mouse', () => {
    it('toggles it once when `multiple`', async () => {
      const { modelValue, selects, itemClicks } = mountSelect({ position: 'popper', modelValue: [], rootProps: { defaultOpen: true, multiple: true } })
      await opened()

      await userEvent.click(get('banana')!)

      await expect.poll(() => itemClicks).toEqual(['banana'])
      await settle()
      expect(modelValue.value).toEqual(['banana'])
      expect(selects).toEqual(['banana'])
    })
  })

  describe('when an item is rendered as a button', () => {
    // A native button turns Enter and Space into a `click` of its own.
    it.each(['{Enter}', ' '])('toggles it once with the key "%s" when `multiple`', async (key) => {
      const { modelValue, selects } = mountSelect({ position: 'popper', itemAs: 'button', modelValue: [], rootProps: { defaultOpen: true, multiple: true } })
      await opened()
      get('banana')!.focus()

      await userEvent.keyboard(key)

      await expect.poll(() => selects.length).toBeGreaterThan(0)
      await settle()
      expect(modelValue.value).toEqual(['banana'])
      expect(selects).toEqual(['banana'])
    })
  })
})
