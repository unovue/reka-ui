import type { VueWrapper } from '@vue/test-utils'
import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { h, nextTick } from 'vue'
import { ConfigProvider } from '@/ConfigProvider'
import { ColorAreaArea, ColorAreaRoot, ColorAreaThumb } from '.'
import ColorArea from './story/_ColorArea.vue'

// jsdom doesn't support pointer capture methods
window.HTMLElement.prototype.setPointerCapture = vi.fn()
window.HTMLElement.prototype.releasePointerCapture = vi.fn()
window.HTMLElement.prototype.hasPointerCapture = vi.fn()

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** The visually hidden range input of the x channel. */
function xInput(wrapper: VueWrapper) {
  return wrapper.find<HTMLInputElement>('input[type="range"][aria-orientation="horizontal"]')
}

/** The visually hidden range input of the y channel. */
function yInput(wrapper: VueWrapper) {
  return wrapper.find<HTMLInputElement>('input[type="range"][aria-orientation="vertical"]')
}

/** The x-channel value, read from its range input. */
function getXValue(wrapper: VueWrapper): number {
  return Number(xInput(wrapper).element.value)
}

/** The y-channel value, read from its range input. */
function getYValue(wrapper: VueWrapper): number {
  return Number(yInput(wrapper).element.value)
}

/** The color area: the inputs live in the thumb, which lives in the area. */
function area(wrapper: VueWrapper): HTMLElement {
  return xInput(wrapper).element.parentElement!.parentElement!
}

/** Presses a key on the focused x input; it bubbles to the area's handler. */
async function keydown(wrapper: VueWrapper, key: string, opts: Record<string, unknown> = {}) {
  await xInput(wrapper).trigger('keydown', { key, ...opts })
}

// ─── Accessibility ────────────────────────────────────────────────────────────

describe('colorArea accessibility', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    wrapper = mount(ColorArea, {
      props: {
        defaultValue: '#bf40bf', // hsl(300, ~50%, 50%)
        colorSpace: 'hsl',
        xChannel: 'saturation',
        yChannel: 'lightness',
      },
    })
  })

  it('passes axe accessibility tests', async () => {
    expect(
      await axe(wrapper.element, { rules: { label: { enabled: false } } }),
    ).toHaveNoViolations()
  })

  it('root has role="group"', () => {
    expect(wrapper.find('[role="group"]').exists()).toBe(true)
  })

  it('has no role="application" and no ARIA slider on the thumb', () => {
    expect(wrapper.find('[role="application"]').exists()).toBe(false)
    expect(wrapper.find('[role="slider"]').exists()).toBe(false)
    expect(wrapper.find('[aria-roledescription="Color picker"]').exists()).toBe(false)
  })

  it('renders one range input per channel', () => {
    expect(wrapper.findAll('input[type="range"]')).toHaveLength(2)
  })

  it('names each channel input after its channel', () => {
    expect(xInput(wrapper).attributes('aria-label')).toBe('Saturation')
    expect(yInput(wrapper).attributes('aria-label')).toBe('Lightness')
  })

  it('describes each input as a 2D slider with its own orientation', () => {
    expect(xInput(wrapper).attributes('aria-roledescription')).toBe('2D slider')
    expect(yInput(wrapper).attributes('aria-roledescription')).toBe('2D slider')
    expect(xInput(wrapper).attributes('aria-orientation')).toBe('horizontal')
    expect(yInput(wrapper).attributes('aria-orientation')).toBe('vertical')
  })

  it('reports each channel\'s own value, then the other channel', () => {
    expect(xInput(wrapper).element.value).toBe('50')
    expect(yInput(wrapper).element.value).toBe('50')
    expect(xInput(wrapper).attributes('aria-valuetext')).toBe('50, Lightness 50')
    expect(yInput(wrapper).attributes('aria-valuetext')).toBe('50, Saturation 50')
  })

  it('keeps one tab stop: the x input until the y input takes focus', async () => {
    expect(xInput(wrapper).attributes('tabindex')).toBe('0')
    expect(yInput(wrapper).attributes('tabindex')).toBe('-1')
    await yInput(wrapper).trigger('focus')
    expect(xInput(wrapper).attributes('tabindex')).toBe('-1')
    expect(yInput(wrapper).attributes('tabindex')).toBe('0')
  })

  it('updates the accessible value of each channel after a change', async () => {
    await keydown(wrapper, 'ArrowRight')
    await keydown(wrapper, 'ArrowUp', { shiftKey: true })
    expect(xInput(wrapper).element.value).toBe('51')
    expect(xInput(wrapper).attributes('aria-valuetext')).toBe('51, Lightness 60')
    expect(yInput(wrapper).element.value).toBe('60')
    expect(yInput(wrapper).attributes('aria-valuetext')).toBe('60, Saturation 51')
  })
})

// ─── Pointer interaction ─────────────────────────────────────────────────────

describe('colorArea pointer interaction', () => {
  it('the x input gains focus when dragging starts', async () => {
    const wrapper = mount(ColorArea, {
      props: {
        defaultValue: '#bf40bf',
        colorSpace: 'hsl',
        xChannel: 'saturation',
        yChannel: 'lightness',
      },
      attachTo: document.body,
    })

    const input = xInput(wrapper)

    expect(document.activeElement).not.toBe(input.element)

    await fireEvent.pointerDown(area(wrapper), {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    })

    expect(document.activeElement).toBe(input.element)

    wrapper.unmount()
  })

  it('no input gains focus when disabled', async () => {
    const wrapper = mount(ColorArea, {
      props: {
        defaultValue: '#bf40bf',
        colorSpace: 'hsl',
        xChannel: 'saturation',
        yChannel: 'lightness',
        disabled: true,
      },
      attachTo: document.body,
    })

    await fireEvent.pointerDown(area(wrapper), {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    })

    expect(document.activeElement).not.toBe(xInput(wrapper).element)
    expect(document.activeElement).not.toBe(yInput(wrapper).element)

    wrapper.unmount()
  })
})

// ─── HSL Saturation(x) / Lightness(y) ────────────────────────────────────────

describe('colorArea HSL Saturation(x) / Lightness(y)', () => {
  // #bf40bf ≈ hsl(300, 50%, 50%) — saturation=50, lightness=50
  let wrapper: VueWrapper

  beforeEach(() => {
    wrapper = mount(ColorArea, {
      props: {
        defaultValue: '#bf40bf',
        colorSpace: 'hsl',
        xChannel: 'saturation',
        yChannel: 'lightness',
      },
    })
  })

  describe('initial ARIA values', () => {
    it('aria-valuenow = 50 (saturation)', () => {
      expect(getXValue(wrapper)).toBe(50)
    })

    it('min = 0, max = 100 on both inputs', () => {
      for (const input of [xInput(wrapper), yInput(wrapper)]) {
        expect(input.attributes('min')).toBe('0')
        expect(input.attributes('max')).toBe('100')
      }
    })

    it('aria-valuetext reports both channels', () => {
      expect(xInput(wrapper).attributes('aria-valuetext')).toBe('50, Lightness 50')
      expect(yInput(wrapper).attributes('aria-valuetext')).toBe('50, Saturation 50')
    })

    it('the x input is focusable (tabindex=0)', () => {
      expect(xInput(wrapper).attributes('tabindex')).toBe('0')
    })
  })

  describe('arrowRight / ArrowLeft — x-axis (saturation ±1)', () => {
    it('arrowRight increments saturation by 1, lightness unchanged', async () => {
      await keydown(wrapper, 'ArrowRight')
      expect(getXValue(wrapper)).toBe(51)
      expect(getYValue(wrapper)).toBe(50)
    })

    it('arrowLeft decrements saturation by 1, lightness unchanged', async () => {
      await keydown(wrapper, 'ArrowLeft')
      expect(getXValue(wrapper)).toBe(49)
      expect(getYValue(wrapper)).toBe(50)
    })

    it('shift+ArrowRight increments saturation by 10', async () => {
      await keydown(wrapper, 'ArrowRight', { shiftKey: true })
      expect(getXValue(wrapper)).toBe(60)
      expect(getYValue(wrapper)).toBe(50)
    })

    it('shift+ArrowLeft decrements saturation by 10', async () => {
      await keydown(wrapper, 'ArrowLeft', { shiftKey: true })
      expect(getXValue(wrapper)).toBe(40)
      expect(getYValue(wrapper)).toBe(50)
    })
  })

  describe('arrowUp / ArrowDown — y-axis (lightness ±1)', () => {
    it('arrowUp increments lightness by 1, saturation unchanged', async () => {
      await keydown(wrapper, 'ArrowUp')
      expect(getXValue(wrapper)).toBe(50)
      expect(getYValue(wrapper)).toBe(51)
    })

    it('arrowDown decrements lightness by 1, saturation unchanged', async () => {
      await keydown(wrapper, 'ArrowDown')
      expect(getXValue(wrapper)).toBe(50)
      expect(getYValue(wrapper)).toBe(49)
    })

    it('shift+ArrowUp increments lightness by 10', async () => {
      await keydown(wrapper, 'ArrowUp', { shiftKey: true })
      expect(getXValue(wrapper)).toBe(50)
      expect(getYValue(wrapper)).toBe(60)
    })

    it('shift+ArrowDown decrements lightness by 10', async () => {
      await keydown(wrapper, 'ArrowDown', { shiftKey: true })
      expect(getXValue(wrapper)).toBe(50)
      expect(getYValue(wrapper)).toBe(40)
    })
  })

  describe('pageUp / PageDown — large y-axis jump (±10)', () => {
    it('pageUp increments lightness by 10, saturation unchanged', async () => {
      await keydown(wrapper, 'PageUp')
      expect(getYValue(wrapper)).toBe(60)
      expect(getXValue(wrapper)).toBe(50)
    })

    it('pageDown decrements lightness by 10, saturation unchanged', async () => {
      await keydown(wrapper, 'PageDown')
      expect(getYValue(wrapper)).toBe(40)
      expect(getXValue(wrapper)).toBe(50)
    })
  })

  describe('home / End — large x-axis jump (±10)', () => {
    it('home decrements saturation by 10, lightness unchanged', async () => {
      await keydown(wrapper, 'Home')
      expect(getXValue(wrapper)).toBe(40)
      expect(getYValue(wrapper)).toBe(50)
    })

    it('end increments saturation by 10, lightness unchanged', async () => {
      await keydown(wrapper, 'End')
      expect(getXValue(wrapper)).toBe(60)
      expect(getYValue(wrapper)).toBe(50)
    })
  })

  describe('boundary clamping', () => {
    it('saturation cannot exceed 100', async () => {
      // #ff0000 = hsl(0, 100%, 50%) — saturation is at max
      const w = mount(ColorArea, {
        props: { defaultValue: '#ff0000', colorSpace: 'hsl', xChannel: 'saturation', yChannel: 'lightness' },
      })
      await keydown(w, 'ArrowRight')
      expect(getXValue(w)).toBe(100)
    })

    it('saturation cannot go below 0', async () => {
      // #808080 = hsl(0, 0%, 50%) — saturation is at min
      const w = mount(ColorArea, {
        props: { defaultValue: '#808080', colorSpace: 'hsl', xChannel: 'saturation', yChannel: 'lightness' },
      })
      await keydown(w, 'ArrowLeft')
      expect(getXValue(w)).toBe(0)
    })

    it('lightness cannot exceed 100', async () => {
      // #ffffff = hsl(*, 0%, 100%) — lightness is at max
      const w = mount(ColorArea, {
        props: { defaultValue: '#ffffff', colorSpace: 'hsl', xChannel: 'saturation', yChannel: 'lightness' },
      })
      await keydown(w, 'ArrowUp')
      expect(getYValue(w)).toBe(100)
    })

    it('lightness cannot go below 0', async () => {
      // #000000 = hsl(*, 0%, 0%) — lightness is at min
      const w = mount(ColorArea, {
        props: { defaultValue: '#000000', colorSpace: 'hsl', xChannel: 'saturation', yChannel: 'lightness' },
      })
      await keydown(w, 'ArrowDown')
      expect(getYValue(w)).toBe(0)
    })

    it('home at saturation=0 clamps to 0 (no underflow)', async () => {
      const w = mount(ColorArea, {
        props: { defaultValue: '#808080', colorSpace: 'hsl', xChannel: 'saturation', yChannel: 'lightness' },
      })
      await keydown(w, 'Home')
      expect(getXValue(w)).toBe(0)
    })

    it('end at saturation=100 clamps to 100 (no overflow)', async () => {
      const w = mount(ColorArea, {
        props: { defaultValue: '#ff0000', colorSpace: 'hsl', xChannel: 'saturation', yChannel: 'lightness' },
      })
      await keydown(w, 'End')
      expect(getXValue(w)).toBe(100)
    })
  })

  describe('disabled state', () => {
    let w: VueWrapper

    beforeEach(() => {
      w = mount(ColorArea, {
        props: {
          defaultValue: '#bf40bf',
          colorSpace: 'hsl',
          xChannel: 'saturation',
          yChannel: 'lightness',
          disabled: true,
        },
      })
    })

    it('area has data-disabled=""', () => {
      expect(area(w).getAttribute('data-disabled')).toBe('')
    })

    it('root has aria-disabled="true"', () => {
      expect(w.find('[role="group"]').attributes('aria-disabled')).toBe('true')
    })

    it('both inputs are disabled', () => {
      expect(xInput(w).element.disabled).toBe(true)
      expect(yInput(w).element.disabled).toBe(true)
    })

    it('passes axe accessibility tests', async () => {
      expect(await axe(w.element, { rules: { label: { enabled: false } } })).toHaveNoViolations()
    })

    it('arrowRight does not change saturation', async () => {
      const before = getXValue(w)
      await keydown(w, 'ArrowRight')
      expect(getXValue(w)).toBe(before)
    })

    it('arrowUp does not change lightness', async () => {
      const before = getYValue(w)
      await keydown(w, 'ArrowUp')
      expect(getYValue(w)).toBe(before)
    })
  })
})

// ─── HSL Hue(x) / Saturation(y) — default channels ───────────────────────────

describe('colorArea HSL Hue(x) / Saturation(y) — default channels', () => {
  // No colorSpace/xChannel/yChannel passed → defaults: hsl / hue / saturation
  let wrapper: VueWrapper

  beforeEach(() => {
    // #ff0000 = hsl(0, 100%, 50%) — hue=0, saturation=100
    wrapper = mount(ColorArea, {
      props: { defaultValue: '#ff0000' },
    })
  })

  it('names the inputs hue and saturation', () => {
    expect(xInput(wrapper).attributes('aria-label')).toBe('Hue')
    expect(yInput(wrapper).attributes('aria-label')).toBe('Saturation')
  })

  it('aria-valuenow = 0 (hue)', () => {
    expect(getXValue(wrapper)).toBe(0)
  })

  it('min = 0, max = 360 on the hue input; 0 to 100 on the saturation input', () => {
    expect(xInput(wrapper).attributes('min')).toBe('0')
    expect(xInput(wrapper).attributes('max')).toBe('360')
    expect(yInput(wrapper).attributes('min')).toBe('0')
    expect(yInput(wrapper).attributes('max')).toBe('100')
  })

  it('aria-valuetext reports hue and saturation', () => {
    expect(xInput(wrapper).attributes('aria-valuetext')).toBe('0, Saturation 100')
    expect(yInput(wrapper).attributes('aria-valuetext')).toBe('100, Hue 0')
  })

  it('passes axe accessibility tests', async () => {
    expect(await axe(wrapper.element, { rules: { label: { enabled: false } } })).toHaveNoViolations()
  })

  it('arrowRight increments hue by 1', async () => {
    await keydown(wrapper, 'ArrowRight')
    expect(getXValue(wrapper)).toBe(1)
    expect(getYValue(wrapper)).toBe(100)
  })

  it('hue cannot go below 0 (clamped at min)', async () => {
    await keydown(wrapper, 'ArrowLeft') // hue=0, ArrowLeft tries -1 → clamped to 0
    expect(getXValue(wrapper)).toBe(0)
  })

  it('arrowUp increments saturation by 1, hue unchanged', async () => {
    // saturation already at 100; test with a lower saturation color
    const w = mount(ColorArea, { props: { defaultValue: '#804040' } }) // hsl(0, ~33%, 38%) approx
    const initHue = getXValue(w)
    await keydown(w, 'ArrowUp')
    expect(getXValue(w)).toBe(initHue) // hue unchanged
  })
})

// ─── HSB Saturation(x) / Brightness(y) ───────────────────────────────────────

describe('colorArea HSB Saturation(x) / Brightness(y)', () => {
  // #800080 ≈ hsb(300, 100%, 50%)
  let wrapper: VueWrapper

  beforeEach(() => {
    wrapper = mount(ColorArea, {
      props: {
        defaultValue: '#800080',
        colorSpace: 'hsb',
        xChannel: 'saturation',
        yChannel: 'brightness',
      },
    })
  })

  it('names the inputs saturation and brightness', () => {
    expect(xInput(wrapper).attributes('aria-label')).toBe('Saturation')
    expect(yInput(wrapper).attributes('aria-label')).toBe('Brightness')
  })

  it('initial saturation = 100', () => {
    expect(getXValue(wrapper)).toBe(100)
  })

  it('initial brightness = 50', () => {
    expect(getYValue(wrapper)).toBe(50)
  })

  it('min = 0, max = 100 on both inputs', () => {
    for (const input of [xInput(wrapper), yInput(wrapper)]) {
      expect(input.attributes('min')).toBe('0')
      expect(input.attributes('max')).toBe('100')
    }
  })

  it('arrowLeft decrements saturation by 1', async () => {
    await keydown(wrapper, 'ArrowLeft')
    expect(getXValue(wrapper)).toBe(99)
    expect(getYValue(wrapper)).toBe(50)
  })

  it('arrowLeft 5× decrements saturation by 5', async () => {
    for (let i = 0; i < 5; i++) await keydown(wrapper, 'ArrowLeft')
    expect(getXValue(wrapper)).toBe(95)
    expect(getYValue(wrapper)).toBe(50)
  })

  it('arrowDown decrements brightness by 1', async () => {
    await keydown(wrapper, 'ArrowDown')
    expect(getXValue(wrapper)).toBe(100)
    expect(getYValue(wrapper)).toBe(49)
  })

  it('arrowUp increments brightness by 1', async () => {
    await keydown(wrapper, 'ArrowUp')
    expect(getXValue(wrapper)).toBe(100)
    expect(getYValue(wrapper)).toBe(51)
  })

  it('saturation cannot exceed 100 (already at max)', async () => {
    await keydown(wrapper, 'ArrowRight')
    expect(getXValue(wrapper)).toBe(100)
  })

  it('brightness cannot exceed 100', async () => {
    // Start at full brightness
    const w = mount(ColorArea, {
      props: { defaultValue: '#ff00ff', colorSpace: 'hsb', xChannel: 'saturation', yChannel: 'brightness' },
    })
    // #ff00ff = hsb(300, 100%, 100%)
    await keydown(w, 'ArrowUp')
    expect(getYValue(w)).toBe(100)
  })
})

// ─── RGB Red(x) / Green(y) ────────────────────────────────────────────────────

describe('colorArea RGB Red(x) / Green(y)', () => {
  // #7f007f = rgb(127, 0, 127)
  let wrapper: VueWrapper

  beforeEach(() => {
    wrapper = mount(ColorArea, {
      props: {
        defaultValue: '#7f007f',
        colorSpace: 'rgb',
        xChannel: 'red',
        yChannel: 'green',
      },
    })
  })

  it('names the inputs red and green', () => {
    expect(xInput(wrapper).attributes('aria-label')).toBe('Red')
    expect(yInput(wrapper).attributes('aria-label')).toBe('Green')
  })

  it('aria-valuenow = 127 (red)', () => {
    expect(getXValue(wrapper)).toBe(127)
  })

  it('min = 0, max = 255 on both inputs (RGB range)', () => {
    for (const input of [xInput(wrapper), yInput(wrapper)]) {
      expect(input.attributes('min')).toBe('0')
      expect(input.attributes('max')).toBe('255')
    }
  })

  it('initial green = 0', () => {
    expect(getYValue(wrapper)).toBe(0)
  })

  it('aria-valuetext reports red and green', () => {
    expect(xInput(wrapper).attributes('aria-valuetext')).toBe('127, Green 0')
    expect(yInput(wrapper).attributes('aria-valuetext')).toBe('0, Red 127')
  })

  it('arrowRight increments red by 1, green unchanged', async () => {
    await keydown(wrapper, 'ArrowRight')
    expect(getXValue(wrapper)).toBe(128)
    expect(getYValue(wrapper)).toBe(0)
  })

  it('arrowLeft decrements red by 1', async () => {
    await keydown(wrapper, 'ArrowLeft')
    expect(getXValue(wrapper)).toBe(126)
  })

  it('arrowUp increments green by 1, red unchanged', async () => {
    await keydown(wrapper, 'ArrowUp')
    expect(getXValue(wrapper)).toBe(127)
    expect(getYValue(wrapper)).toBe(1)
  })

  it('arrowDown at green=0 stays at 0 (clamp)', async () => {
    await keydown(wrapper, 'ArrowDown')
    expect(getYValue(wrapper)).toBe(0)
  })

  it('shift+ArrowRight increments red by 10', async () => {
    await keydown(wrapper, 'ArrowRight', { shiftKey: true })
    expect(getXValue(wrapper)).toBe(137)
  })

  it('shift+ArrowUp increments green by 10', async () => {
    await keydown(wrapper, 'ArrowUp', { shiftKey: true })
    expect(getYValue(wrapper)).toBe(10)
  })

  it('red cannot exceed 255', async () => {
    // #ff00ff = rgb(255, 0, 255) — red at max
    const w = mount(ColorArea, {
      props: { defaultValue: '#ff00ff', colorSpace: 'rgb', xChannel: 'red', yChannel: 'green' },
    })
    await keydown(w, 'ArrowRight')
    expect(getXValue(w)).toBe(255)
  })

  it('red cannot go below 0', async () => {
    // #0000ff = rgb(0, 0, 255) — red at min
    const w = mount(ColorArea, {
      props: { defaultValue: '#0000ff', colorSpace: 'rgb', xChannel: 'red', yChannel: 'green' },
    })
    await keydown(w, 'ArrowLeft')
    expect(getXValue(w)).toBe(0)
  })
})

// ─── Channel inputs ──────────────────────────────────────────────────────────

describe('colorArea channel inputs', () => {
  const props = { defaultValue: '#bf40bf', colorSpace: 'hsl', xChannel: 'saturation', yChannel: 'lightness' } as const

  it('moves focus to the y input on ArrowUp/ArrowDown/PageUp/PageDown and back on ArrowLeft/ArrowRight/Home/End', async () => {
    const wrapper = mount(ColorArea, { props, attachTo: document.body })
    xInput(wrapper).element.focus()
    for (const key of ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown']) {
      xInput(wrapper).element.focus()
      await keydown(wrapper, key)
      expect(document.activeElement).toBe(yInput(wrapper).element)
    }
    for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End']) {
      yInput(wrapper).element.focus()
      await yInput(wrapper).trigger('keydown', { key })
      expect(document.activeElement).toBe(xInput(wrapper).element)
    }
    wrapper.unmount()
  })

  it('prevents the native range step so arrow keys keep the area\'s rules', async () => {
    const wrapper = mount(ColorArea, { props })
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
    xInput(wrapper).element.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('writes the y channel when assistive technology sets the y input', async () => {
    const wrapper = mount(ColorArea, { props })
    await yInput(wrapper).setValue('70')
    expect(getXValue(wrapper)).toBe(50)
    expect(getYValue(wrapper)).toBe(70)
    expect(yInput(wrapper).attributes('aria-valuetext')).toBe('70, Saturation 50')
  })

  it('keeps the inputs on the model when a controlled parent rejects the update', async () => {
    const wrapper = mount(() => h(ColorAreaRoot, {
      'modelValue': { space: 'hsl', h: 100, s: 50, l: 50, alpha: 1 },
      'onUpdate:modelValue': () => {},
    }, () => h(ColorAreaArea, {}, () => h(ColorAreaThumb))))
    await xInput(wrapper).setValue('200')
    await nextTick()
    expect(getXValue(wrapper)).toBe(100)
  })

  it('keeps arrow keys and the exposed value mirrored in RTL', async () => {
    const wrapper = mount(ColorArea, { props: { ...props, dir: 'rtl' } })
    expect(xInput(wrapper).attributes('aria-orientation')).toBe('horizontal')
    await keydown(wrapper, 'ArrowLeft')
    expect(getXValue(wrapper)).toBe(51)
    await keydown(wrapper, 'ArrowRight')
    await keydown(wrapper, 'ArrowRight')
    expect(getXValue(wrapper)).toBe(49)
  })

  it('passes axe with an inherited RTL direction', async () => {
    const wrapper = mount(() => h(ConfigProvider, { dir: 'rtl' }, () => h(ColorAreaRoot, { defaultValue: '#bf40bf' }, () => h(ColorAreaArea, {}, () => h(ColorAreaThumb)))))
    // The `label` rule stays on: every input is named by its channel.
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('centers the inputs in the thumb that holds them', () => {
    const wrapper = mount(ColorArea, { props })
    for (const input of [xInput(wrapper), yInput(wrapper)]) {
      expect(input.element.parentElement!.style.position).toBe('absolute')
      expect(input.element.style.left).toBe('50%')
      expect(input.element.style.top).toBe('50%')
    }
  })

  it.each(['ltr', 'rtl'] as const)('places the inputs at an asChild thumb\'s position in the area (%s)', async (dir) => {
    const wrapper = mount(() => h(ColorAreaRoot, { defaultValue: { space: 'hsl', h: 300, s: 50, l: 50, alpha: 1 }, colorSpace: 'hsl', xChannel: 'saturation', yChannel: 'lightness', dir }, () =>
      h(ColorAreaArea, { 'data-testid': 'area' }, () => h(ColorAreaThumb, { asChild: true }, () => h('div', { class: 'my-thumb' })))))
    const thumb = wrapper.find<HTMLElement>('.my-thumb').element
    const inputs = wrapper.findAll<HTMLInputElement>('input[type="range"]')
    expect(thumb.style.position).toBe('absolute')
    expect(inputs).toHaveLength(2)
    expect(thumb.style.left).toBe('50%')
    await keydown(wrapper, 'ArrowRight', { shiftKey: true })
    await keydown(wrapper, 'ArrowUp', { shiftKey: true })
    // The inputs are siblings of the thumb, so they follow its left/top within the area.
    // ArrowRight moves the thumb right in both directions (in RTL it lowers x).
    expect(thumb.style.left).toBe('60%')
    expect(getXValue(wrapper)).toBe(dir === 'rtl' ? 40 : 60)
    expect(thumb.style.top).toBe('40%')
    for (const input of inputs) {
      expect(input.element.parentElement).toBe(wrapper.find('[data-testid=area]').element)
      expect(input.element.style.left).toBe(thumb.style.left)
      expect(input.element.style.top).toBe(thumb.style.top)
    }
  })
})

// ─── Enter in a form ─────────────────────────────────────────────────────────

describe('colorArea inside a form', () => {
  it('prevents Enter on a channel input, so it does not submit the form', async () => {
    const wrapper = mount(ColorArea, { props: { defaultValue: '#bf40bf' } })
    for (const input of [xInput(wrapper), yInput(wrapper)]) {
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
      input.element.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(true)
    }
  })
})
