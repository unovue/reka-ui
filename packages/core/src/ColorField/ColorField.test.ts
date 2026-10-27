import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import ColorField from './story/_ColorField.vue'

describe('given default ColorField (hex mode)', () => {
  let wrapper: VueWrapper<InstanceType<typeof ColorField>>

  beforeEach(() => {
    wrapper = mount(ColorField, {
      props: {
        defaultValue: '#ff0000',
      },
    })
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element, {
      rules: {
        label: { enabled: false },
      },
    })).toHaveNoViolations()
  })

  it('should render input with hex value', () => {
    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    expect(input.element.value).toBe('#ff0000')
  })

  it('should update value on input', async () => {
    const input = wrapper.find('input')
    await input.setValue('#00ff00')
    await input.trigger('blur')
    // Value should be updated after blur
    expect(wrapper.emitted()).toBeDefined()
  })

  it('should accept valid hex colors', async () => {
    const input = wrapper.find('input')
    await input.setValue('#00ff00')
    await input.trigger('blur')
    // Valid color should be accepted
    expect(wrapper.emitted()).toBeDefined()
  })

  describe('when disabled', () => {
    beforeEach(async () => {
      await wrapper.setProps({ disabled: true })
    })

    it('should have disabled attribute', () => {
      const input = wrapper.find('input')
      expect(input.attributes('disabled')).toBeDefined()
    })

    it('should have data-disabled attribute', () => {
      const input = wrapper.find('input')
      expect(input.attributes('data-disabled')).toBe('')
    })
  })

  describe('when readonly', () => {
    beforeEach(async () => {
      await wrapper.setProps({ readonly: true })
    })

    it('should have readonly attribute', () => {
      const input = wrapper.find('input')
      expect(input.attributes('readonly')).toBeDefined()
    })
  })
})

describe('given ColorField in channel mode', () => {
  it('should render hue value', () => {
    const wrapper = mount(ColorField, {
      props: {
        defaultValue: '#ff0000',
        channel: 'hue',
        colorSpace: 'hsl',
      },
    })
    const input = wrapper.find('input')
    expect(input.element.value).toBe('0')
  })

  it('should render saturation value', () => {
    const wrapper = mount(ColorField, {
      props: {
        defaultValue: '#7f007f',
        channel: 'saturation',
        colorSpace: 'hsl',
      },
    })
    const input = wrapper.find('input')
    expect(input.element.value).toBe('100')
  })

  it('should render lightness value', () => {
    const wrapper = mount(ColorField, {
      props: {
        defaultValue: '#bf40bf',
        channel: 'lightness',
        colorSpace: 'hsl',
      },
    })
    const input = wrapper.find('input')
    expect(input.element.value).toBe('50')
  })

  it('should render alpha value', () => {
    const wrapper = mount(ColorField, {
      props: {
        defaultValue: 'rgba(255, 0, 0, 0.5)',
        channel: 'alpha',
        colorSpace: 'hsl',
      },
    })
    const input = wrapper.find('input')
    expect(input.element.value).toBe('50')
  })

  it('should have numeric inputmode', () => {
    const wrapper = mount(ColorField, {
      props: {
        defaultValue: '#ff0000',
        channel: 'hue',
        colorSpace: 'hsl',
      },
    })
    const input = wrapper.find('input')
    expect(input.attributes('inputmode')).toBe('numeric')
  })
})

describe('given ColorField with placeholder', () => {
  it('should show placeholder when empty', () => {
    const wrapper = mount(ColorField, {
      props: {
        placeholder: 'Enter color',
      },
    })
    const input = wrapper.find('input')
    expect(input.attributes('placeholder')).toBe('Enter color')
  })
})

describe('keyboard interactions', () => {
  describe('channel mode', () => {
    it('should increment on ArrowUp', async () => {
      const wrapper = mount(ColorField, {
        props: {
          defaultValue: '#ff0000',
          channel: 'hue',
          colorSpace: 'hsl',
        },
      })
      const input = wrapper.find('input')
      expect(input.element.value).toBe('0')
      await input.trigger('keydown', { key: 'ArrowUp' })
      expect(input.element.value).toBe('1')
    })

    it('should decrement on ArrowDown', async () => {
      const wrapper = mount(ColorField, {
        props: {
          defaultValue: '#bf40bf',
          channel: 'lightness',
          colorSpace: 'hsl',
        },
      })
      const input = wrapper.find('input')
      expect(input.element.value).toBe('50')
      await input.trigger('keydown', { key: 'ArrowDown' })
      expect(input.element.value).toBe('49')
    })

    it('should jump to max on End key', async () => {
      const wrapper = mount(ColorField, {
        props: {
          defaultValue: '#ff0000',
          channel: 'red',
          colorSpace: 'rgb',
        },
      })
      const input = wrapper.find('input')
      await input.trigger('keydown', { key: 'End' })
      expect(input.element.value).toBe('255')
    })

    it('should jump to min on Home key', async () => {
      const wrapper = mount(ColorField, {
        props: {
          defaultValue: '#ff0000',
          channel: 'red',
          colorSpace: 'rgb',
        },
      })
      const input = wrapper.find('input')
      await input.trigger('keydown', { key: 'Home' })
      expect(input.element.value).toBe('0')
    })

    it('should step by page amount on PageUp/PageDown', async () => {
      const wrapper = mount(ColorField, {
        props: {
          defaultValue: '#bf40bf',
          channel: 'lightness',
          colorSpace: 'hsl',
        },
      })
      const input = wrapper.find('input')
      expect(input.element.value).toBe('50')
      await input.trigger('keydown', { key: 'PageUp' })
      expect(input.element.value).toBe('60')
      await input.trigger('keydown', { key: 'PageDown' })
      expect(input.element.value).toBe('50')
    })

    it('should respect custom step prop', async () => {
      const wrapper = mount(ColorField, {
        props: {
          defaultValue: '#ff0000',
          channel: 'hue',
          colorSpace: 'hsl',
          step: 10,
        },
      })
      const input = wrapper.find('input')
      expect(input.element.value).toBe('0')
      await input.trigger('keydown', { key: 'ArrowUp' })
      expect(input.element.value).toBe('10')
    })

    it('should clamp at channel boundaries', async () => {
      const wrapper = mount(ColorField, {
        props: {
          defaultValue: '#ff0000',
          channel: 'hue',
          colorSpace: 'hsl',
        },
      })
      const input = wrapper.find('input')
      expect(input.element.value).toBe('0')
      await input.trigger('keydown', { key: 'ArrowDown' })
      // Should clamp to 0
      expect(input.element.value).toBe('0')
    })
  })

  describe('hex mode', () => {
    it('should increment hex value on ArrowUp', async () => {
      const wrapper = mount(ColorField, {
        props: {
          defaultValue: '#000000',
        },
      })
      const input = wrapper.find('input')
      expect(input.element.value).toBe('#000000')
      await input.trigger('keydown', { key: 'ArrowUp' })
      expect(input.element.value).toBe('#000001')
    })

    it('should decrement hex value on ArrowDown', async () => {
      const wrapper = mount(ColorField, {
        props: {
          defaultValue: '#000002',
        },
      })
      const input = wrapper.find('input')
      await input.trigger('keydown', { key: 'ArrowDown' })
      expect(input.element.value).toBe('#000001')
    })

    it('should jump to #ffffff on End', async () => {
      const wrapper = mount(ColorField, {
        props: {
          defaultValue: '#000000',
        },
      })
      const input = wrapper.find('input')
      await input.trigger('keydown', { key: 'End' })
      expect(input.element.value).toBe('#ffffff')
    })

    it('should jump to #000000 on Home', async () => {
      const wrapper = mount(ColorField, {
        props: {
          defaultValue: '#ff0000',
        },
      })
      const input = wrapper.find('input')
      await input.trigger('keydown', { key: 'Home' })
      expect(input.element.value).toBe('#000000')
    })
  })

  it('should commit on Enter key', async () => {
    const wrapper = mount(ColorField, {
      props: {
        defaultValue: '#ff0000',
      },
    })
    const input = wrapper.find('input')
    await input.setValue('#00ff00')
    await input.trigger('keydown', { key: 'Enter' })
    expect(input.element.value).toBe('#00ff00')
  })

  it('should not increment when disabled', async () => {
    const wrapper = mount(ColorField, {
      props: {
        defaultValue: '#ff0000',
        channel: 'hue',
        colorSpace: 'hsl',
        disabled: true,
      },
    })
    const input = wrapper.find('input')
    expect(input.element.value).toBe('0')
    await input.trigger('keydown', { key: 'ArrowUp' })
    expect(input.element.value).toBe('0')
  })

  it('should not increment when readonly', async () => {
    const wrapper = mount(ColorField, {
      props: {
        defaultValue: '#ff0000',
        channel: 'hue',
        colorSpace: 'hsl',
        readonly: true,
      },
    })
    const input = wrapper.find('input')
    expect(input.element.value).toBe('0')
    await input.trigger('keydown', { key: 'ArrowUp' })
    expect(input.element.value).toBe('0')
  })

  it('should not block beforeinput during IME composition', async () => {
    const wrapper = mount(ColorField, {
      props: {
        defaultValue: '#ff0000',
        channel: 'hue',
        colorSpace: 'hsl',
      },
    })
    const input = wrapper.find('input')
    const event = new InputEvent('beforeinput', {
      data: 'あ',
      cancelable: true,
    })
    Object.defineProperty(event, 'isComposing', { value: true })
    input.element.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })

  it('should not step the value during composition (arrow keys are IME candidate navigation)', async () => {
    const wrapper = mount(ColorField, {
      props: {
        defaultValue: '#ff0000',
        channel: 'hue',
        colorSpace: 'hsl',
      },
    })
    const input = wrapper.find('input')
    expect(input.element.value).toBe('0')

    // Arrow keys mid-composition navigate IME candidates, they must not step the value
    await input.trigger('keydown', { key: 'ArrowUp', isComposing: true })
    expect(input.element.value).toBe('0')

    // Once composition ends, stepping works again
    await input.trigger('keydown', { key: 'ArrowUp' })
    expect(input.element.value).toBe('1')
  })
})

describe('invalid input (validated on commit)', () => {
  it('does not flag partial input while typing', async () => {
    const wrapper = mount(ColorField, { props: { defaultValue: '#ff0000' } })
    const input = wrapper.find('input')
    for (const text of ['', '#', '#3b', '#3b82', '#3b82f', '#3b82f6']) {
      await input.setValue(text)
      expect(input.attributes('aria-invalid')).toBeUndefined()
      expect(input.attributes('data-invalid')).toBeUndefined()
    }
  })

  it('marks text a blur rejects as aria-invalid and reverts it', async () => {
    const wrapper = mount(ColorField, { props: { defaultValue: '#ff0000' } })
    const input = wrapper.find('input')
    const root = wrapper.find('[role="group"]')
    await input.setValue('#ff00')
    await input.trigger('blur')
    expect(input.element.value).toBe('#ff0000')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('data-invalid')).toBe('')
    expect(root.attributes('data-invalid')).toBe('')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('marks text Enter rejects as aria-invalid and keeps the color', async () => {
    const wrapper = mount(ColorField, { props: { defaultValue: '#ff0000' } })
    const input = wrapper.find('input')
    await input.setValue('#zzzzzz')
    await input.trigger('keydown', { key: 'Enter' })
    expect(input.element.value).toBe('#ff0000')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('keeps the flag through partial edits and clears it on the next edit that parses', async () => {
    const wrapper = mount(ColorField, { props: { defaultValue: '#ff0000' } })
    const input = wrapper.find('input')
    await input.setValue('nope')
    await input.trigger('blur')
    expect(input.attributes('aria-invalid')).toBe('true')
    await input.setValue('#3b')
    expect(input.attributes('aria-invalid')).toBe('true')
    await input.setValue('hsl(120, 100%, 50%)')
    expect(input.attributes('aria-invalid')).toBeUndefined()
  })

  it('clears the flag on the next committed change', async () => {
    const wrapper = mount(ColorField, { props: { defaultValue: '#ff0000' } })
    const input = wrapper.find('input')
    await input.setValue('nope')
    await input.trigger('blur')
    expect(input.attributes('aria-invalid')).toBe('true')
    await input.trigger('keydown', { key: 'ArrowUp' })
    expect(input.attributes('aria-invalid')).toBeUndefined()
    expect(wrapper.find('[role="group"]').attributes('data-invalid')).toBeUndefined()
  })

  it('marks a channel value that is not a number on commit, and reverts it', async () => {
    const wrapper = mount(ColorField, { props: { defaultValue: '#ff0000', channel: 'hue', colorSpace: 'hsl' } })
    const input = wrapper.find('input')
    await input.setValue('-')
    expect(input.attributes('aria-invalid')).toBeUndefined()
    await input.setValue('')
    expect(input.attributes('aria-invalid')).toBeUndefined()
    await input.trigger('blur')
    expect(input.element.value).toBe('0')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await input.setValue('12')
    expect(input.attributes('aria-invalid')).toBeUndefined()
  })

  it('does not mark an out-of-range channel number as invalid; it is clamped on commit', async () => {
    const wrapper = mount(ColorField, { props: { defaultValue: '#ff0000', channel: 'saturation', colorSpace: 'hsl' } })
    const input = wrapper.find('input')
    await input.setValue('250')
    await input.trigger('blur')
    expect(input.attributes('aria-invalid')).toBeUndefined()
    expect(input.element.value).toBe('100')
  })

  it('passes axe while invalid', async () => {
    const wrapper = mount(ColorField, { props: { defaultValue: '#ff0000' } })
    const input = wrapper.find('input')
    await input.setValue('#ff00')
    await input.trigger('blur')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(await axe(wrapper.element, { rules: { label: { enabled: false } } })).toHaveNoViolations()
  })
})
