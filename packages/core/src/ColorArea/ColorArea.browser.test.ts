import type { CSSProperties } from 'vue'
import type { Color } from '@/shared/color'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { ColorAreaArea, ColorAreaRoot, ColorAreaThumb } from '.'

function mountInForm() {
  const onSubmit = vi.fn((event: Event) => event.preventDefault())
  const color = ref<Color>({ space: 'hsl', h: 300, s: 50, l: 50, alpha: 1 })
  const Form = defineComponent({
    setup() {
      return () => h('form', { onSubmit }, [
        h(ColorAreaRoot, {
          'modelValue': color.value,
          'onUpdate:modelValue': (value: Color) => { color.value = value },
          'colorSpace': 'hsl',
          'xChannel': 'saturation',
          'yChannel': 'lightness',
          'xName': 'saturation',
          'yName': 'lightness',
        }, {
          default: ({ style }: { style: CSSProperties }) => h(ColorAreaArea, {
            style: { ...style, position: 'relative', width: '200px', height: '200px' },
          }, () => h(ColorAreaThumb, { style: { display: 'block', width: '16px', height: '16px' } })),
        }),
        h('button', { type: 'submit' }, 'Save'),
      ])
    },
  })
  const wrapper = mount(Form, { attachTo: document.body })
  const [x, y] = wrapper.findAll<HTMLInputElement>('input[type="range"]').map(w => w.element)
  return { wrapper, x, y, onSubmit, color }
}

describe('given a ColorArea inside a form, in a real browser', () => {
  it('does not submit the form on Enter in a channel input', async () => {
    const { wrapper, x, y, onSubmit } = mountInForm()

    x.focus()
    await userEvent.keyboard('{Enter}')
    y.focus()
    await userEvent.keyboard('{Enter}')

    // Give a native implicit submission the chance to happen.
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(onSubmit).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('keeps the arrow keys on the area rules and moves focus between the channel inputs', async () => {
    const { wrapper, x, y } = mountInForm()

    x.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect.poll(() => x.value).toBe('51')
    await userEvent.keyboard('{ArrowUp}')
    await expect.poll(() => document.activeElement).toBe(y)
    expect(y.value).toBe('51')
    wrapper.unmount()
  })
})
