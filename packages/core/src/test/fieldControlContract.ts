import type { VueWrapper } from '@vue/test-utils'
import type { Component } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { FieldDescription, FieldLabel, FieldRoot } from '@/Field'
import { FormRoot } from '@/Form'

/**
 * Test-only: the behaviour every Reka control shares when placed in a
 * `FieldRoot`. Each participating family runs it from its own test file.
 */
export interface FieldControlContractSpec {
  name: string
  /**
   * Renders the control. Receives the props to forward to it (`v-model`
   * state through `modelValue`/`onUpdate:modelValue`, and `disabled`/`required`
   * when the contract sets them on the control itself).
   */
  render: (props: Record<string, unknown>) => ReturnType<typeof h>
  /** Components the render function needs registered (none, when it uses `h`). */
  components?: Record<string, Component>
  /** The element that should carry the field's id, label and aria wiring. */
  control: (wrapper: VueWrapper) => HTMLElement
  /** The element focused on an invalid submit. Defaults to `control`. */
  focusTarget?: (wrapper: VueWrapper) => HTMLElement
  /** Performs a user interaction that changes the value. */
  interact: (wrapper: VueWrapper) => Promise<void>
  /** The model value the interaction produces, as collected by `formSubmit`. */
  interactedValue: unknown
  /** An empty model value (fails `required`). */
  emptyValue: unknown
  /** A filled model value, set programmatically. */
  filledValue: unknown
  /**
   * Whether the field's id goes on `control` (default) — false for a
   * control that points the label elsewhere (e.g. a hidden native input).
   */
  idOnControl?: boolean
  /** Skips the `required` checks, for a control that can't be empty. */
  noRequired?: boolean
  /**
   * With `idOnControl: false`, the element `FieldLabel`'s `for` must point at
   * (e.g. a hidden native input that forwards focus into the control).
   */
  labelTarget?: (wrapper: VueWrapper) => HTMLElement
  /**
   * Maps a collected value before it's compared with `interactedValue`. Needed
   * for values `toEqual` can't tell apart (e.g. Temporal objects, which have
   * no enumerable own properties).
   */
  serialize?: (value: unknown) => unknown
  /**
   * The focusable parts of a control made of several (segments, slots), at
   * least two. When given, the contract checks the field stays focused and
   * untouched while focus moves between them, and is touched once it leaves.
   */
  parts?: (wrapper: VueWrapper) => HTMLElement[]
  /** Skips the `name` precedence checks, for a control without a `name` prop. */
  noName?: boolean
}

export function describeFieldControlContract(spec: FieldControlContractSpec) {
  function mountInField(options: { fieldProps?: Record<string, unknown>, controlProps?: Record<string, unknown>, form?: boolean, onFormSubmit?: (values: Record<string, unknown>) => void, model?: unknown } = {}) {
    const model = ref(options.model ?? spec.emptyValue)
    const Harness = defineComponent({
      setup() {
        return () => {
          const field = h(FieldRoot, { 'name': 'field', 'data-testid': 'field', ...options.fieldProps }, () => [
            h(FieldLabel, () => 'Label'),
            spec.render({ ...options.controlProps, 'modelValue': model.value, 'onUpdate:modelValue': (value: unknown) => { model.value = value } }),
            h(FieldDescription, () => 'Description'),
          ])
          if (!options.form)
            return field
          return h(FormRoot, { onFormSubmit: options.onFormSubmit }, () => [field, h('button', { type: 'submit' }, 'Submit')])
        }
      },
    })
    const wrapper = mount(Harness, { attachTo: document.body, global: { components: spec.components } })
    return { wrapper, model }
  }

  describe(`given a Field-wrapped ${spec.name}`, () => {
    it('is labelled and described by the field', async () => {
      const { wrapper } = mountInField()
      await nextTick()
      const control = spec.control(wrapper)
      const label = wrapper.find('label').element
      if (spec.idOnControl !== false)
        expect(label.getAttribute('for')).toBe(control.id)
      else if (spec.labelTarget)
        expect(label.getAttribute('for')).toBe(spec.labelTarget(wrapper).id)
      expect(label.getAttribute('for')).toBeTruthy()
      expect(control.getAttribute('aria-labelledby')).toContain(label.id)
      const description = wrapper.findAll('p').at(-1)!.element
      expect(control.getAttribute('aria-describedby')).toContain(description.id)
      wrapper.unmount()
    })

    it('submits its value under the field name', async () => {
      const onFormSubmit = vi.fn()
      const { wrapper } = mountInField({ form: true, onFormSubmit })
      await nextTick()
      await spec.interact(wrapper)
      await flushPromises()
      await wrapper.find('button[type="submit"]').trigger('submit')
      expect(onFormSubmit).toHaveBeenCalledTimes(1)
      const serialize = spec.serialize ?? ((value: unknown) => value)
      const values = onFormSubmit.mock.calls[0][0] as Record<string, unknown>
      expect(Object.keys(values)).toEqual(['field'])
      expect(serialize(values.field)).toEqual(serialize(spec.interactedValue))
      wrapper.unmount()
    })

    if (!spec.noName) {
      // The native inputs a control renders for form submission (some name
      // theirs after the field's, e.g. `field[0]`).
      const namedInputs = (wrapper: VueWrapper) => Array.from((wrapper.element as HTMLElement).ownerDocument.querySelectorAll('[data-testid="field"] [name]'))
        .map(element => element.getAttribute('name'))

      it('submits natively under the field name, which takes precedence over its own', async () => {
        const { wrapper } = mountInField({ form: true, controlProps: { name: 'own' }, model: spec.filledValue })
        await flushPromises()
        const names = namedInputs(wrapper)
        expect(names.length).toBeGreaterThan(0)
        expect(names.every(name => name!.startsWith('field'))).toBe(true)
        wrapper.unmount()
      })

      it('submits natively under its own name when the field has none', async () => {
        const { wrapper } = mountInField({ form: true, fieldProps: { name: undefined }, controlProps: { name: 'own' }, model: spec.filledValue })
        await flushPromises()
        const names = namedInputs(wrapper)
        expect(names.length).toBeGreaterThan(0)
        expect(names.every(name => name!.startsWith('own'))).toBe(true)
        wrapper.unmount()
      })
    }

    if (spec.parts) {
      it('is touched only once focus leaves the whole control', async () => {
        const { wrapper } = mountInField()
        await nextTick()
        const field = () => wrapper.find('[data-testid="field"]')
        const parts = spec.parts!(wrapper)
        expect(parts.length).toBeGreaterThan(1)

        parts[0].focus()
        await nextTick()
        expect(field().attributes('data-focused')).toBe('')
        parts[1].focus()
        await nextTick()
        expect(field().attributes('data-focused')).toBe('')
        expect(field().attributes('data-touched')).toBeUndefined()

        parts[1].blur()
        await nextTick()
        expect(field().attributes('data-focused')).toBeUndefined()
        expect(field().attributes('data-touched')).toBe('')
        wrapper.unmount()
      })
    }

    it('marks the field dirty on user input, but only filled on a programmatic change', async () => {
      const { wrapper, model } = mountInField()
      await nextTick()
      const field = () => wrapper.find('[data-testid="field"]')

      model.value = spec.filledValue
      await flushPromises()
      expect(field().attributes('data-filled')).toBe('')
      expect(field().attributes('data-dirty')).toBeUndefined()

      model.value = spec.emptyValue
      await flushPromises()
      await spec.interact(wrapper)
      await flushPromises()
      expect(field().attributes('data-dirty')).toBe('')
      wrapper.unmount()
    })

    it('is disabled by a disabled field', async () => {
      const { wrapper } = mountInField({ fieldProps: { disabled: true } })
      await nextTick()
      const control = spec.control(wrapper)
      const disabled = control.hasAttribute('disabled')
        || control.getAttribute('aria-disabled') === 'true'
        || control.hasAttribute('data-disabled')
      expect(disabled).toBe(true)
      wrapper.unmount()
    })

    if (!spec.noRequired) {
      it('blocks submission when required and empty, and focuses the control', async () => {
        const onFormSubmit = vi.fn()
        const { wrapper } = mountInField({ form: true, onFormSubmit, fieldProps: { required: true } })
        await nextTick()
        await wrapper.find('button[type="submit"]').trigger('submit')
        await nextTick()
        expect(onFormSubmit).not.toHaveBeenCalled()
        expect(wrapper.find('[data-testid="field"]').attributes('data-invalid')).toBe('')
        expect(spec.control(wrapper).getAttribute('aria-invalid')).toBe('true')
        expect(spec.control(wrapper).hasAttribute('data-invalid')).toBe(true)
        expect(document.activeElement).toBe((spec.focusTarget ?? spec.control)(wrapper))
        wrapper.unmount()
      })

      it('passes required validation once filled', async () => {
        const onFormSubmit = vi.fn()
        const { wrapper } = mountInField({ form: true, onFormSubmit, fieldProps: { required: true } })
        await nextTick()
        await spec.interact(wrapper)
        await flushPromises()
        await wrapper.find('button[type="submit"]').trigger('submit')
        expect(onFormSubmit).toHaveBeenCalledTimes(1)
        wrapper.unmount()
      })
    }
  })

  describe(`given a standalone ${spec.name}`, () => {
    it('renders no field wiring', async () => {
      const Harness = defineComponent({ setup: () => () => spec.render({}) })
      const wrapper = mount(Harness, { attachTo: document.body, global: { components: spec.components } })
      await nextTick()
      const control = spec.control(wrapper)
      expect(control.getAttribute('aria-describedby')).toBeNull()
      expect(control.getAttribute('aria-labelledby')).toBeNull()
      expect(control.hasAttribute('data-filled')).toBe(false)
      wrapper.unmount()
    })
  })
}
