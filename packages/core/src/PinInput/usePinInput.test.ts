import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, effectScope, h, nextTick, onMounted, ref } from 'vue'
import { PinInputInput, PinInputRoot } from '.'
import * as Reka from '../index'
import { usePinInput } from './usePinInput'

function scoped<T>(fn: () => T): T {
  return effectScope().run(fn)!
}

describe('usePinInput — model', () => {
  it('is uncontrolled with `[]` by default and writes through updateModelValueAt', () => {
    const p = scoped(() => usePinInput())
    expect(p.modelValue.value).toEqual([])
    expect(p.isControlled.value).toBe(false)
    expect(p.updateModelValueAt(1, 'a')).toBe(true)
    expect(p.modelValue.value).toEqual([undefined, 'a'])
    // Trailing empty strings are trimmed (v2 parity).
    p.updateModelValueAt(1, '')
    expect(p.modelValue.value).toEqual([undefined])
  })

  it('numeric mode stores numbers and `undefined` gaps', () => {
    const p = scoped(() => usePinInput({ type: 'number', defaultValue: [1, 2, 3] }))
    p.updateModelValueAt(1, '')
    expect(p.modelValue.value).toEqual([1, undefined, 3])
    p.updateModelValueAt(1, '7')
    expect(p.modelValue.value).toEqual([1, 7, 3])
  })

  it('does not emit when the value is unchanged (entry-by-entry comparison)', () => {
    const onUpdate = vi.fn()
    const p = scoped(() => usePinInput({ defaultValue: ['a', 'b'], onUpdate }))
    expect(p.setModelValue(['a', 'b'])).toBe(false)
    expect(p.updateModelValueAt(0, 'a')).toBe(false)
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('cancel() in onBeforeUpdate vetoes the change', () => {
    const onUpdate = vi.fn()
    const p = scoped(() => usePinInput({ onBeforeUpdate: (_v, details) => details.cancel(), onUpdate }))
    expect(p.updateModelValueAt(0, 'x', 'input')).toBe(false)
    expect(p.modelValue.value).toEqual([])
    expect(p.lastChangeDetails.value).toMatchObject({ reason: 'input', isCanceled: true })
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('controlled with onUpdate does not write, ref-owned writes the ref', () => {
    const controlled = ref<string[]>(['a'])
    const onUpdate = vi.fn()
    const c = scoped(() => usePinInput({ modelValue: controlled, onUpdate }))
    c.updateModelValueAt(1, 'b')
    expect(controlled.value).toEqual(['a'])
    expect(c.isControlled.value).toBe(true)
    expect(onUpdate).toHaveBeenCalledWith(['a', 'b'], expect.objectContaining({ reason: 'imperative-action' }))

    const owned = ref<string[]>(['a'])
    const o = scoped(() => usePinInput({ modelValue: owned }))
    o.updateModelValueAt(1, 'b')
    expect(owned.value).toEqual(['a', 'b'])
  })

  it('builds same-tick writes on each other while a controlled parent catches up', async () => {
    const onUpdate = vi.fn()
    const p = scoped(() => usePinInput({ modelValue: () => [] as string[], onUpdate }))
    p.updateModelValueAt(0, 'a')
    p.updateModelValueAt(1, 'b')
    expect(onUpdate.mock.calls.at(-1)![0]).toEqual(['a', 'b'])
    await nextTick()
    // The parent never applied them: the controlled value is authoritative again.
    expect(p.currentModelValue.value).toEqual([])
  })

  it('fires onComplete once every registered input is filled', async () => {
    const onComplete = vi.fn()
    const p = scoped(() => usePinInput({ onComplete }))
    p.registerInput(document.createElement('input'))
    p.registerInput(document.createElement('input'))
    p.updateModelValueAt(0, '1')
    await nextTick()
    expect(onComplete).not.toHaveBeenCalled()
    p.updateModelValueAt(1, '2')
    await nextTick()
    expect(p.isCompleted.value).toBe(true)
    expect(onComplete).toHaveBeenCalledWith(['1', '2'])
  })

  it('root surface carries dir and complete/disabled state as data-*', () => {
    const p = scoped(() => usePinInput({ disabled: true, dir: 'rtl' }))
    expect(p.root.props.value).toEqual({ dir: 'rtl' })
    expect(p.root.attrs.value).toMatchObject({ 'dir': 'rtl', 'data-disabled': '', 'data-complete': '' })
  })
})

const Standalone = defineComponent({
  props: { onUpdate: Function, onBeforeUpdate: Function },
  setup(props) {
    const pin = usePinInput({
      placeholder: '○',
      onUpdate: (...args) => (props.onUpdate as any)?.(...args),
      onBeforeUpdate: (...args) => (props.onBeforeUpdate as any)?.(...args),
    })
    const elements = [ref<HTMLInputElement>(), ref<HTMLInputElement>(), ref<HTMLInputElement>()]
    const inputs = elements.map((element, index) => pin.createInputSurface({ index, element }))
    onMounted(() => elements.forEach(el => pin.registerInput(el.value!)))
    return () => h('div', pin.root.attrs.value, inputs.map((input, index) =>
      h('input', { ...input.attrs.value, ref: elements[index] })))
  },
})

describe('usePinInput — standalone render', () => {
  it('binds onto plain inputs, passes axe and reports reasons', async () => {
    const onUpdate = vi.fn()
    const { container } = render(Standalone, { props: { onUpdate } })
    const inputs = [...container.querySelectorAll('input')]
    await nextTick()
    expect(inputs[0].getAttribute('aria-label')).toBe('pin input 1 of 3')
    expect(inputs[0].getAttribute('autocomplete')).toBe('false')
    expect(await axe(container)).toHaveNoViolations()

    inputs[0].focus()
    await userEvent.keyboard('ab')
    expect(onUpdate.mock.calls.map(c => c[1].reason)).toEqual(['input', 'input'])
    expect(document.activeElement).toBe(inputs[2])

    await userEvent.keyboard('{Backspace}')
    expect(onUpdate.mock.calls.at(-1)![1].reason).toBe('backspace-key')
    expect(onUpdate.mock.calls.at(-1)![0]).toEqual(['a'])

    inputs[0].focus()
    await userEvent.keyboard('{Delete}')
    expect(onUpdate.mock.calls.at(-1)![1].reason).toBe('delete-key')

    await userEvent.paste('xyz')
    expect(onUpdate.mock.calls.at(-1)).toEqual([['x', 'y', 'z'], expect.objectContaining({ reason: 'paste' })])
    await nextTick()
    expect(container.querySelector('div')!.hasAttribute('data-complete')).toBe(true)
  })

  it('a cancelled keystroke keeps the input empty and focus in place', async () => {
    const { container } = render(Standalone, { props: { onBeforeUpdate: (_v: unknown, d: { cancel: () => void }) => d.cancel() } })
    const inputs = [...container.querySelectorAll('input')]
    inputs[0].focus()
    await userEvent.keyboard('a')
    expect(inputs[0].value).toBe('')
    expect(document.activeElement).toBe(inputs[0])
  })
})

describe('pinInputRoot — change details', () => {
  const Fixture = defineComponent({
    props: { modelValue: Array, cancel: Boolean },
    emits: ['update:modelValue', 'beforeUpdate:modelValue'],
    setup(props, { emit }) {
      return () => h(PinInputRoot, {
        'modelValue': props.modelValue as string[] | undefined,
        'onBeforeUpdate:modelValue': (value: string[], details: any) => {
          if (props.cancel)
            details.cancel()
          emit('beforeUpdate:modelValue', value, details)
        },
        'onUpdate:modelValue': (value: string[], details: any) => emit('update:modelValue', value, details),
      }, () => [0, 1].map(index => h(PinInputInput, { index })))
    },
  })

  it('emits beforeUpdate then update with the reason and native event', async () => {
    const wrapper = mount(Fixture, { attachTo: document.body })
    const input = wrapper.findAll('input:not([aria-hidden])')[0]
    ;(input.element as HTMLInputElement).focus()
    await userEvent.keyboard('7')
    const [value, details] = wrapper.emitted('update:modelValue')![0] as [string[], any]
    expect(value).toEqual(['7'])
    expect(details.reason).toBe('input')
    expect(details.event).toBeInstanceOf(Event)
    expect(wrapper.emitted('beforeUpdate:modelValue')).toHaveLength(1)
    wrapper.unmount()
  })

  it('a cancelled change emits no update and leaves the input empty', async () => {
    const wrapper = mount(Fixture, { props: { cancel: true }, attachTo: document.body })
    const input = wrapper.findAll('input:not([aria-hidden])')[0]
    ;(input.element as HTMLInputElement).focus()
    await userEvent.keyboard('7')
    expect(wrapper.emitted('beforeUpdate:modelValue')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect((input.element as HTMLInputElement).value).toBe('')
    wrapper.unmount()
  })

  it('controlled: the input shows the parent value, not the keystroke the parent ignored', async () => {
    const wrapper = mount(Fixture, { props: { modelValue: ['1'] }, attachTo: document.body })
    const input = wrapper.findAll('input:not([aria-hidden])')[1]
    ;(input.element as HTMLInputElement).focus()
    await userEvent.keyboard('2')
    expect(wrapper.emitted('update:modelValue')![0][0]).toEqual(['1', '2'])
    await wrapper.setProps({ modelValue: ['1', '2'] })
    expect((input.element as HTMLInputElement).value).toBe('2')
    wrapper.unmount()
  })
})

describe('pinInputRoot — focus and completion follow the committed value', () => {
  // `writeBack: false` is a one-way `:model-value` whose parent ignores updates.
  const Controlled = defineComponent({
    props: { initial: { type: Array, default: () => [] }, writeBack: { type: Boolean, default: true } },
    setup(props) {
      const model = ref<string[]>([...props.initial as string[]])
      return () => h(PinInputRoot, {
        'modelValue': model.value,
        'onUpdate:modelValue': (value: string[]) => {
          if (props.writeBack)
            model.value = value
        },
      }, () => [0, 1, 2].map(index => h(PinInputInput, { index })))
    },
  })

  function inputsOf(container: Element) {
    return [...container.querySelectorAll<HTMLInputElement>('input:not([aria-hidden])')]
  }

  it('a controlled parent that applies the value: focus advances', async () => {
    const wrapper = mount(Controlled, { attachTo: document.body })
    const inputs = inputsOf(wrapper.element.parentElement!)
    inputs[0].focus()
    await userEvent.keyboard('a')
    await nextTick()
    expect(inputs[0].value).toBe('a')
    expect(document.activeElement).toBe(inputs[1])
    wrapper.unmount()
  })

  it('a controlled parent that rejects the value: focus stays and the text is restored', async () => {
    const wrapper = mount(Controlled, { props: { writeBack: false }, attachTo: document.body })
    const inputs = inputsOf(wrapper.element.parentElement!)
    inputs[0].focus()
    await userEvent.keyboard('a')
    await nextTick()
    expect(inputs[0].value).toBe('')
    expect(document.activeElement).toBe(inputs[0])
    wrapper.unmount()
  })

  it('a controlled parent that rejects a paste: focus stays', async () => {
    const wrapper = mount(Controlled, { props: { writeBack: false }, attachTo: document.body })
    const inputs = inputsOf(wrapper.element.parentElement!)
    inputs[0].focus()
    await userEvent.paste('xyz')
    await nextTick()
    expect(document.activeElement).toBe(inputs[0])
    wrapper.unmount()
  })

  it('retyping the same character still advances focus (v2 parity)', async () => {
    const wrapper = mount(Controlled, { props: { initial: ['a'] }, attachTo: document.body })
    const inputs = inputsOf(wrapper.element.parentElement!)
    inputs[0].focus()
    await userEvent.keyboard('a')
    expect(document.activeElement).toBe(inputs[1])
    wrapper.unmount()
  })

  it('a rejected last digit never flashes data-complete', async () => {
    const wrapper = mount(Controlled, { props: { initial: ['a', 'b'], writeBack: false }, attachTo: document.body })
    const root = wrapper.element as HTMLElement
    const seen: boolean[] = []
    const observer = new MutationObserver(() => seen.push(root.hasAttribute('data-complete')))
    observer.observe(root, { attributes: true, attributeFilter: ['data-complete'] })
    const inputs = inputsOf(root.parentElement!)
    inputs[2].focus()
    await userEvent.keyboard('c')
    await nextTick()
    await nextTick()
    observer.disconnect()
    expect(seen).not.toContain(true)
    expect(root.hasAttribute('data-complete')).toBe(false)
    wrapper.unmount()
  })
})

describe('usePinInput — cancelled multi-character input', () => {
  it('a cancelled paste leaves focus on the pasted-into input', async () => {
    const { container } = render(Standalone, { props: { onBeforeUpdate: (_v: unknown, d: { cancel: () => void }) => d.cancel() } })
    const inputs = [...container.querySelectorAll('input')]
    inputs[0].focus()
    await userEvent.paste('xyz')
    expect(inputs.map(i => i.value)).toEqual(['', '', ''])
    expect(document.activeElement).toBe(inputs[0])
  })
})

describe('usePinInput — public export', () => {
  it('is exported from the package barrel; the input factory is internal', () => {
    expect(typeof Reka.usePinInput).toBe('function')
    expect((Reka as Record<string, unknown>).createPinInputInputSurface).toBeUndefined()
  })
})
