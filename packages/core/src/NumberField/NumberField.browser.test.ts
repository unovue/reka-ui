import type { NumberFieldRootProps } from '.'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
import { NumberFieldIncrement, NumberFieldInput, NumberFieldRoot } from '.'

let unmount: (() => void) | undefined

afterEach(() => {
  unmount?.()
  unmount = undefined
})

function mountNumberField(props: NumberFieldRootProps = {}, initial: number | null = 5) {
  const model = ref<number | undefined>(initial ?? undefined)
  const max = ref<number | undefined>(100)
  const emitted: (number | undefined)[] = []
  const wrapper = mount(defineComponent({
    setup: () => () => h('div', [
      h(NumberFieldRoot, {
        ...props,
        'max': max.value,
        'modelValue': model.value,
        'onUpdate:modelValue': (value: number | undefined) => {
          emitted.push(value)
          model.value = value
        },
      }, () => [
        h(NumberFieldInput, { 'data-testid': 'input' }),
        h(NumberFieldIncrement, { 'data-testid': 'increment' }, () => '+'),
      ]),
      h('button', { 'type': 'button', 'data-testid': 'outside' }, 'Outside'),
    ]),
  }), { attachTo: document.body })
  unmount = () => wrapper.unmount()

  const input = wrapper.get('[data-testid="input"]').element as HTMLInputElement
  const increment = wrapper.get('[data-testid="increment"]').element as HTMLElement
  const outside = wrapper.get('[data-testid="outside"]').element as HTMLElement
  // Changing a prop the input renders (`aria-valuemax`) forces it to patch its bound value again.
  const rerender = async () => {
    max.value = 1000
    await nextTick()
    await new Promise(resolve => requestAnimationFrame(resolve))
  }
  const type = async (text: string) => {
    await userEvent.clear(input)
    if (text)
      await userEvent.fill(input, text)
  }
  return { input, increment, outside, model, emitted, rerender, type }
}

describe('numberField committed text in a real browser', () => {
  describe('with keepValueOnUnparsableInput', () => {
    const keep = { keepValueOnUnparsableInput: true }

    it.each(['.', '-'])('keeps the restored text after Enter on "%s" and a re-render', async (text) => {
      const { input, increment, model, emitted, rerender, type } = mountNumberField(keep)
      await type(text)
      await userEvent.keyboard('{Enter}')
      expect(input.value).toBe('5')

      await rerender()
      expect(input.value).toBe('5')
      expect(emitted).toEqual([])

      await userEvent.click(increment)
      expect(model.value).toBe(6)
      expect(input.value).toBe('6')
    })

    it('keeps the restored text after blur and a re-render', async () => {
      const { input, increment, outside, model, emitted, rerender, type } = mountNumberField(keep)
      await type('.')
      await userEvent.click(outside)
      expect(input.value).toBe('5')

      await rerender()
      expect(input.value).toBe('5')
      expect(emitted).toEqual([])

      await userEvent.click(increment)
      expect(model.value).toBe(6)
    })

    it('still lets a currency field be cleared by deleting everything', async () => {
      const { input, model, emitted, rerender, type } = mountNumberField({ ...keep, formatOptions: { style: 'currency', currency: 'USD' } })
      expect(input.value).toBe('$5.00')
      await type('')
      await userEvent.keyboard('{Enter}')
      expect(model.value).toBeUndefined()
      expect(emitted).toEqual([undefined])

      await rerender()
      expect(input.value).toBe('')
    })
  })

  describe('by default', () => {
    it('does not bring back rejected text on an empty field after Enter and a re-render', async () => {
      const { input, emitted, rerender, type } = mountNumberField({}, null)
      await type('.')
      await userEvent.keyboard('{Enter}')
      expect(input.value).toBe('')

      await rerender()
      expect(input.value).toBe('')
      expect(emitted).toEqual([])
    })

    it('does not bring back the typed text when Enter reformats to the same value', async () => {
      const { input, increment, model, rerender, type } = mountNumberField()
      await type('5.0')
      await userEvent.keyboard('{Enter}')
      expect(input.value).toBe('5')

      await rerender()
      expect(input.value).toBe('5')

      await userEvent.click(increment)
      expect(model.value).toBe(6)
    })

    it('clears the value when the committed text cannot be parsed', async () => {
      const { input, model, emitted, rerender, type } = mountNumberField()
      await type('.')
      await userEvent.keyboard('{Enter}')
      expect(model.value).toBeUndefined()
      expect(emitted).toEqual([undefined])

      await rerender()
      expect(input.value).toBe('')
    })
  })

  describe('with percent formatting', () => {
    const percent = { formatOptions: { style: 'percent' } } as const

    it.each([
      ['by default', 'Enter', percent],
      ['by default', 'blur', percent],
      ['with keepValueOnUnparsableInput', 'Enter', { ...percent, keepValueOnUnparsableInput: true }],
      ['with keepValueOnUnparsableInput', 'blur', { ...percent, keepValueOnUnparsableInput: true }],
    ] as const)('clears the value %s when the emptied input is committed with %s', async (_mode, how, props) => {
      const { input, outside, model, emitted, rerender, type } = mountNumberField(props, 0.5)
      expect(input.value).toBe('50%')
      await type('')
      if (how === 'Enter')
        await userEvent.keyboard('{Enter}')
      else
        await userEvent.click(outside)
      expect(model.value).toBeUndefined()
      expect(emitted).toEqual([undefined])

      await rerender()
      expect(input.value).toBe('')
    })

    it.each(['Enter', 'blur'] as const)('keeps the value with keepValueOnUnparsableInput when a lone percent sign is committed with %s', async (how) => {
      const { input, outside, model, emitted, rerender, type } = mountNumberField({ ...percent, keepValueOnUnparsableInput: true }, 0.5)
      await type('%')
      if (how === 'Enter')
        await userEvent.keyboard('{Enter}')
      else
        await userEvent.click(outside)
      expect(model.value).toBe(0.5)
      expect(emitted).toEqual([])

      await rerender()
      expect(input.value).toBe('50%')
    })
  })
})
