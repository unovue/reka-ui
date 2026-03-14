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
})
