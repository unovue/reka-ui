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
  /**
   * The interactive parts a disabled field must disable, for a control that
   * disables its parts rather than itself (e.g. a group's items). Defaults to
   * `control`.
   */
  disabledParts?: (wrapper: VueWrapper) => HTMLElement[]
  /** Skips the `name` precedence checks, for a control without a `name` prop. */
  noName?: boolean
  /**
   * Changes the value to `value` through the control's own imperative API
   * (e.g. its root context's `setModelValue`, as a consumer's custom part
   * would call it), whose change reports `'imperative-action'`. Omitted for a
   * control that exposes none (every change it commits is the user's). See
   * `providedContext`.
   */
  setProgrammatically?: (wrapper: VueWrapper, value: unknown) => void | Promise<void>
}

/**
 * Test-only: the context `component` provides itself (not one it inherits)
 * whose `method` is a function, for driving a control's imperative API.
 */
export function providedContext<T = Record<string, (...args: any[]) => any>>(wrapper: VueWrapper, component: Component, method: string): T {
  const provides = (wrapper.findComponent(component).vm.$ as unknown as { provides: Record<symbol, unknown> }).provides
  const context = Object.getOwnPropertySymbols(provides)
    .map(key => provides[key] as Record<string, unknown> | null)
    .find(value => typeof value?.[method] === 'function')
  if (!context)
    throw new Error(`no context with \`${method}\` provided by the component`)
  return context as T
}

export function describeFieldControlContract(spec: FieldControlContractSpec) {
  function mountInField(options: { fieldProps?: Record<string, unknown>, controlProps?: Record<string, unknown>, form?: boolean, onFormSubmit?: (values: Record<string, unknown>) => void, model?: unknown, onUpdate?: () => void } = {}) {
    const model = ref(options.model ?? spec.emptyValue)
    const Harness = defineComponent({
      setup() {
        return () => {
          const field = h(FieldRoot, { 'name': 'field', 'data-testid': 'field', ...options.fieldProps }, () => [
            h(FieldLabel, () => 'Label'),
            spec.render({ ...options.controlProps, 'modelValue': model.value, 'onUpdate:modelValue': (value: unknown) => {
              model.value = value
              options.onUpdate?.()
            } }),
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

    if (spec.parts) {
      it('only marks the field filled when the parent changes the value while focus is inside', async () => {
        const { wrapper, model } = mountInField()
        await nextTick()
        const field = () => wrapper.find('[data-testid="field"]')
        spec.parts!(wrapper)[0].focus()
        await nextTick()
        expect(field().attributes('data-focused')).toBe('')

        model.value = spec.filledValue
        await flushPromises()
        expect(field().attributes('data-filled')).toBe('')
        expect(field().attributes('data-dirty')).toBeUndefined()
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

    if (spec.setProgrammatically) {
      it('only marks the field filled when changed through its own imperative API', async () => {
        const validate = vi.fn(() => null)
        const { wrapper, model } = mountInField({ fieldProps: { validate, validationMode: 'onChange' } })
        await flushPromises()
        validate.mockClear()
        const field = () => wrapper.find('[data-testid="field"]')

        await spec.setProgrammatically!(wrapper, spec.filledValue)
        await flushPromises()
        const serialize = spec.serialize ?? ((value: unknown) => value)
        expect(serialize(model.value)).toEqual(serialize(spec.filledValue))
        expect(field().attributes('data-filled')).toBe('')
        expect(field().attributes('data-dirty')).toBeUndefined()
        expect(validate).not.toHaveBeenCalled()
        wrapper.unmount()
      })
    }

    it('marks the field dirty on user input whose update handler moves focus out of the control', async () => {
      const outside = document.body.appendChild(document.createElement('button'))
      const { wrapper } = mountInField({ onUpdate: () => outside.focus() })
      await nextTick()
      await spec.interact(wrapper)
      await flushPromises()
      expect(wrapper.find('[data-testid="field"]').attributes('data-dirty')).toBe('')
      wrapper.unmount()
      outside.remove()
    })

    it('is disabled by a disabled field', async () => {
      const { wrapper } = mountInField({ fieldProps: { disabled: true } })
      await nextTick()
      const parts = spec.disabledParts?.(wrapper) ?? [spec.control(wrapper)]
      expect(parts.length).toBeGreaterThan(0)
      // Natively disabled, or `aria-disabled`. Not `data-disabled`: the field's
      // own state attributes are merged onto the control, so that would pass
      // for a control that ignores the field.
      for (const part of parts)
        expect(part.matches(':disabled') || part.getAttribute('aria-disabled') === 'true', part.outerHTML).toBe(true)
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
