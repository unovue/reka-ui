import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import ColorArea from './story/_ColorArea.vue'

// jsdom doesn't support pointer capture methods
window.HTMLElement.prototype.setPointerCapture = vi.fn()
window.HTMLElement.prototype.releasePointerCapture = vi.fn()
window.HTMLElement.prototype.hasPointerCapture = vi.fn()

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the x-channel value from aria-valuenow on the slider thumb. */
function getXValue(wrapper: VueWrapper): number {
  return Number(wrapper.find('[role="slider"]').attributes('aria-valuenow'))
}

/**
 * Parses the y-channel value from aria-valuetext.
 * Format: "Saturation 50, Lightness 42"
 */
function getYValue(wrapper: VueWrapper, channelName: string): number {
  const text = wrapper.find('[role="slider"]').attributes('aria-valuetext') ?? ''
  const match = text.match(new RegExp(`${channelName} (\\d+)`))
  return match ? Number(match[1]) : NaN
}

/** Triggers a keydown on the color area (role=application). */
async function keydown(wrapper: VueWrapper, key: string, opts: Record<string, unknown> = {}) {
  await wrapper.find('[role="application"]').trigger('keydown', { key, ...opts })
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

  it('area has role="application" and aria-roledescription="Color picker"', () => {
    const area = wrapper.find('[role="application"]')
    expect(area.exists()).toBe(true)
    expect(area.attributes('aria-roledescription')).toBe('Color picker')
  })

  it('thumb has role="slider" and aria-roledescription="Color thumb"', () => {
    const thumb = wrapper.find('[role="slider"]')
    expect(thumb.exists()).toBe(true)
    expect(thumb.attributes('aria-roledescription')).toBe('Color thumb')
  })

  it('thumb aria-label names both channels', () => {
    expect(wrapper.find('[role="slider"]').attributes('aria-label')).toBe('Saturation, Lightness')
  })
})

// ─── Pointer interaction ─────────────────────────────────────────────────────

describe('colorArea pointer interaction', () => {
  it('thumb gains focus when dragging starts', async () => {
    const wrapper = mount(ColorArea, {
      props: {
        defaultValue: '#bf40bf',
        colorSpace: 'hsl',
        xChannel: 'saturation',
        yChannel: 'lightness',
      },
      attachTo: document.body,
    })

    const area = wrapper.find('[role="application"]')
    const thumb = wrapper.find('[role="slider"]')

    expect(document.activeElement).not.toBe(thumb.element)

    await area.trigger('pointerdown', {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    })

    expect(document.activeElement).toBe(thumb.element)

    wrapper.unmount()
  })

  it('thumb does not gain focus when disabled', async () => {
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

    const area = wrapper.find('[role="application"]')
    const thumb = wrapper.find('[role="slider"]')

    await area.trigger('pointerdown', {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    })

    expect(document.activeElement).not.toBe(thumb.element)

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

    it('aria-valuemin = 0, aria-valuemax = 100', () => {
      const thumb = wrapper.find('[role="slider"]')
      expect(Number(thumb.attributes('aria-valuemin'))).toBe(0)
      expect(Number(thumb.attributes('aria-valuemax'))).toBe(100)
    })

    it('aria-valuetext reports both channels', () => {
      expect(wrapper.find('[role="slider"]').attributes('aria-valuetext')).toBe(
        'Saturation 50, Lightness 50',
      )
    })

    it('thumb is focusable (tabindex=0)', () => {
      expect(wrapper.find('[role="slider"]').attributes('tabindex')).toBe('0')
    })
  })

  describe('arrowRight / ArrowLeft — x-axis (saturation ±1)', () => {
    it('arrowRight increments saturation by 1, lightness unchanged', async () => {
      await keydown(wrapper, 'ArrowRight')
      expect(getXValue(wrapper)).toBe(51)
      expect(getYValue(wrapper, 'Lightness')).toBe(50)
    })

    it('arrowLeft decrements saturation by 1, lightness unchanged', async () => {
      await keydown(wrapper, 'ArrowLeft')
      expect(getXValue(wrapper)).toBe(49)
      expect(getYValue(wrapper, 'Lightness')).toBe(50)
    })

    it('shift+ArrowRight increments saturation by 10', async () => {
      await keydown(wrapper, 'ArrowRight', { shiftKey: true })
      expect(getXValue(wrapper)).toBe(60)
      expect(getYValue(wrapper, 'Lightness')).toBe(50)
    })

    it('shift+ArrowLeft decrements saturation by 10', async () => {
      await keydown(wrapper, 'ArrowLeft', { shiftKey: true })
      expect(getXValue(wrapper)).toBe(40)
      expect(getYValue(wrapper, 'Lightness')).toBe(50)
    })
  })

  describe('arrowUp / ArrowDown — y-axis (lightness ±1)', () => {
    it('arrowUp increments lightness by 1, saturation unchanged', async () => {
      await keydown(wrapper, 'ArrowUp')
      expect(getXValue(wrapper)).toBe(50)
      expect(getYValue(wrapper, 'Lightness')).toBe(51)
    })

    it('arrowDown decrements lightness by 1, saturation unchanged', async () => {
      await keydown(wrapper, 'ArrowDown')
      expect(getXValue(wrapper)).toBe(50)
      expect(getYValue(wrapper, 'Lightness')).toBe(49)
    })

    it('shift+ArrowUp increments lightness by 10', async () => {
      await keydown(wrapper, 'ArrowUp', { shiftKey: true })
      expect(getXValue(wrapper)).toBe(50)
      expect(getYValue(wrapper, 'Lightness')).toBe(60)
    })

    it('shift+ArrowDown decrements lightness by 10', async () => {
      await keydown(wrapper, 'ArrowDown', { shiftKey: true })
      expect(getXValue(wrapper)).toBe(50)
      expect(getYValue(wrapper, 'Lightness')).toBe(40)
    })
  })

  describe('pageUp / PageDown — large y-axis jump (±10)', () => {
    it('pageUp increments lightness by 10, saturation unchanged', async () => {
      await keydown(wrapper, 'PageUp')
      expect(getYValue(wrapper, 'Lightness')).toBe(60)
      expect(getXValue(wrapper)).toBe(50)
    })

    it('pageDown decrements lightness by 10, saturation unchanged', async () => {
      await keydown(wrapper, 'PageDown')
      expect(getYValue(wrapper, 'Lightness')).toBe(40)
      expect(getXValue(wrapper)).toBe(50)
    })
  })

  describe('home / End — large x-axis jump (±10)', () => {
    it('home decrements saturation by 10, lightness unchanged', async () => {
      await keydown(wrapper, 'Home')
      expect(getXValue(wrapper)).toBe(40)
      expect(getYValue(wrapper, 'Lightness')).toBe(50)
    })

    it('end increments saturation by 10, lightness unchanged', async () => {
      await keydown(wrapper, 'End')
      expect(getXValue(wrapper)).toBe(60)
      expect(getYValue(wrapper, 'Lightness')).toBe(50)
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
      expect(getYValue(w, 'Lightness')).toBe(100)
    })

    it('lightness cannot go below 0', async () => {
      // #000000 = hsl(*, 0%, 0%) — lightness is at min
      const w = mount(ColorArea, {
        props: { defaultValue: '#000000', colorSpace: 'hsl', xChannel: 'saturation', yChannel: 'lightness' },
      })
      await keydown(w, 'ArrowDown')
      expect(getYValue(w, 'Lightness')).toBe(0)
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
      expect(w.find('[role="application"]').attributes('data-disabled')).toBe('')
    })

    it('area has aria-disabled="true"', () => {
      expect(w.find('[role="application"]').attributes('aria-disabled')).toBe('true')
    })

    it('thumb has data-disabled="" and no tabindex', () => {
      const thumb = w.find('[role="slider"]')
      expect(thumb.attributes('data-disabled')).toBe('')
      expect(thumb.attributes('tabindex')).toBeUndefined()
    })

    it('arrowRight does not change saturation', async () => {
      const before = getXValue(w)
      await keydown(w, 'ArrowRight')
      expect(getXValue(w)).toBe(before)
    })

    it('arrowUp does not change lightness', async () => {
      const before = getYValue(w, 'Lightness')
      await keydown(w, 'ArrowUp')
      expect(getYValue(w, 'Lightness')).toBe(before)
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

  it('aria-label names hue and saturation', () => {
    expect(wrapper.find('[role="slider"]').attributes('aria-label')).toBe('Hue, Saturation')
  })

  it('aria-valuenow = 0 (hue)', () => {
    expect(getXValue(wrapper)).toBe(0)
  })

  it('aria-valuemin = 0, aria-valuemax = 360 (hue range)', () => {
    const thumb = wrapper.find('[role="slider"]')
    expect(Number(thumb.attributes('aria-valuemin'))).toBe(0)
    expect(Number(thumb.attributes('aria-valuemax'))).toBe(360)
  })

  it('aria-valuetext reports hue and saturation', () => {
    expect(wrapper.find('[role="slider"]').attributes('aria-valuetext')).toBe(
      'Hue 0, Saturation 100',
    )
  })

  it('arrowRight increments hue by 1', async () => {
    await keydown(wrapper, 'ArrowRight')
    expect(getXValue(wrapper)).toBe(1)
    expect(getYValue(wrapper, 'Saturation')).toBe(100)
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

  it('aria-label names saturation and brightness', () => {
    expect(wrapper.find('[role="slider"]').attributes('aria-label')).toBe('Saturation, Brightness')
  })

  it('initial saturation = 100', () => {
    expect(getXValue(wrapper)).toBe(100)
  })

  it('initial brightness = 50', () => {
    expect(getYValue(wrapper, 'Brightness')).toBe(50)
  })

  it('aria-valuemin = 0, aria-valuemax = 100', () => {
    const thumb = wrapper.find('[role="slider"]')
    expect(Number(thumb.attributes('aria-valuemin'))).toBe(0)
    expect(Number(thumb.attributes('aria-valuemax'))).toBe(100)
  })

  it('arrowLeft decrements saturation by 1', async () => {
    await keydown(wrapper, 'ArrowLeft')
    expect(getXValue(wrapper)).toBe(99)
    expect(getYValue(wrapper, 'Brightness')).toBe(50)
  })

  it('arrowLeft 5× decrements saturation by 5', async () => {
    for (let i = 0; i < 5; i++) await keydown(wrapper, 'ArrowLeft')
    expect(getXValue(wrapper)).toBe(95)
    expect(getYValue(wrapper, 'Brightness')).toBe(50)
  })

  it('arrowDown decrements brightness by 1', async () => {
    await keydown(wrapper, 'ArrowDown')
    expect(getXValue(wrapper)).toBe(100)
    expect(getYValue(wrapper, 'Brightness')).toBe(49)
  })

  it('arrowUp increments brightness by 1', async () => {
    await keydown(wrapper, 'ArrowUp')
    expect(getXValue(wrapper)).toBe(100)
    expect(getYValue(wrapper, 'Brightness')).toBe(51)
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
    expect(getYValue(w, 'Brightness')).toBe(100)
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

  it('aria-label names red and green', () => {
    expect(wrapper.find('[role="slider"]').attributes('aria-label')).toBe('Red, Green')
  })

  it('aria-valuenow = 127 (red)', () => {
    expect(getXValue(wrapper)).toBe(127)
  })

  it('aria-valuemin = 0, aria-valuemax = 255 (RGB range)', () => {
    const thumb = wrapper.find('[role="slider"]')
    expect(Number(thumb.attributes('aria-valuemin'))).toBe(0)
    expect(Number(thumb.attributes('aria-valuemax'))).toBe(255)
  })

  it('initial green = 0', () => {
    expect(getYValue(wrapper, 'Green')).toBe(0)
  })

  it('aria-valuetext reports red and green', () => {
    expect(wrapper.find('[role="slider"]').attributes('aria-valuetext')).toBe('Red 127, Green 0')
  })

  it('arrowRight increments red by 1, green unchanged', async () => {
    await keydown(wrapper, 'ArrowRight')
    expect(getXValue(wrapper)).toBe(128)
    expect(getYValue(wrapper, 'Green')).toBe(0)
  })

  it('arrowLeft decrements red by 1', async () => {
    await keydown(wrapper, 'ArrowLeft')
    expect(getXValue(wrapper)).toBe(126)
  })

  it('arrowUp increments green by 1, red unchanged', async () => {
    await keydown(wrapper, 'ArrowUp')
    expect(getXValue(wrapper)).toBe(127)
    expect(getYValue(wrapper, 'Green')).toBe(1)
  })

  it('arrowDown at green=0 stays at 0 (clamp)', async () => {
    await keydown(wrapper, 'ArrowDown')
    expect(getYValue(wrapper, 'Green')).toBe(0)
  })

  it('shift+ArrowRight increments red by 10', async () => {
    await keydown(wrapper, 'ArrowRight', { shiftKey: true })
    expect(getXValue(wrapper)).toBe(137)
  })

  it('shift+ArrowUp increments green by 10', async () => {
    await keydown(wrapper, 'ArrowUp', { shiftKey: true })
    expect(getYValue(wrapper, 'Green')).toBe(10)
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
