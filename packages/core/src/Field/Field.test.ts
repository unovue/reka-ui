import { fireEvent, render, screen } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { nextTick } from 'vue'
import { CheckboxRoot } from '@/Checkbox'
import { DateFieldRoot } from '@/DateField'
import { FormRoot } from '@/Form'
import { SelectContent, SelectItem, SelectPortal, SelectRoot, SelectTrigger, SelectViewport } from '@/Select'
import { FieldControl, FieldDescription, FieldError, FieldLabel, FieldRoot } from '.'

const components = { FieldRoot, FieldLabel, FieldControl, FieldDescription, FieldError }

beforeAll(() => {
  // SelectTrigger's Popper machinery expects these during mount.
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn()
})

beforeEach(() => {
  document.body.innerHTML = ''
})

// Opens a mounted Select and picks its (only/first) option — mirrors the
// interaction sequence already exercised in Select.test.ts. `SelectContent`
// teleports to `document.body` by default (outside the wrapper's own mounted
// subtree), so — unlike `Select.test.ts`'s fixture, which teleports to an
// in-subtree `#here` target — the option must be looked up on `document`
// rather than through `wrapper.find`.
async function selectFirstOption(wrapper: ReturnType<typeof mount>) {
  const trigger = wrapper.find('[role="combobox"]')
  await trigger.trigger('pointerdown', { button: 0, ctrlKey: false })
  await nextTick()
  await nextTick()
  const option = document.querySelector('[role="option"]') as HTMLElement
  option.focus()
  // Needs 2 pointerup events because SelectContentImpl ignores accidental first pointerups.
  await fireEvent.pointerUp(option)
  await fireEvent.pointerUp(option)
  await nextTick()
}

describe('given a default Field', () => {
  const template = `
    <FieldRoot name="email">
      <FieldLabel>Email</FieldLabel>
      <FieldControl type="email" />
      <FieldDescription>We never share it.</FieldDescription>
    </FieldRoot>
  `

  it('should pass axe accessibility tests', async () => {
    const wrapper = mount({ components, template }, { attachTo: document.body })
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('associates the label with the control via matching for/id', () => {
    const wrapper = mount({ components, template })
    const label = wrapper.find('label')
    const input = wrapper.find('input')

    expect(label.attributes('for')).toBeTruthy()
    expect(label.attributes('for')).toBe(input.attributes('id'))
  })

  it('accumulates the description id into aria-describedby', async () => {
    const wrapper = mount({ components, template })
    // The description registers its id in `onMounted`, one tick after the
    // control's own initial render — this is a reactive update, not part of
    // the synchronous initial mount.
    await nextTick()
    const input = wrapper.find('input')
    const description = wrapper.find('p')

    expect(description.attributes('id')).toBeTruthy()
    expect(input.attributes('aria-describedby')).toContain(description.attributes('id'))
  })

  it('binds name/disabled/required from the field onto the control', () => {
    const wrapper = mount({
      components,
      template: `
        <FieldRoot name="email" required disabled>
          <FieldControl />
        </FieldRoot>
      `,
    })
    const input = wrapper.find('input')
    expect(input.attributes('name')).toBe('email')
    expect(input.attributes('required')).toBeDefined()
    expect(input.attributes('disabled')).toBeDefined()
  })

  it('unregisters a description on unmount so it stops describing the control', async () => {
    const wrapper = mount({
      components,
      template: `
        <FieldRoot name="email">
          <FieldControl />
          <FieldDescription v-if="show">We never share it.</FieldDescription>
        </FieldRoot>
      `,
      data() {
        return { show: true }
      },
    })
    await nextTick()
    const input = wrapper.find('input')
    expect(input.attributes('aria-describedby')).toBeTruthy()

    await wrapper.setData({ show: false })
    expect(input.attributes('aria-describedby')).toBeFalsy()
  })

  it('merges a consumer-provided aria-describedby with the field-generated one', async () => {
    const wrapper = mount({
      components,
      template: `
        <FieldRoot name="email">
          <FieldControl aria-describedby="external-hint" />
          <FieldDescription>We never share it.</FieldDescription>
        </FieldRoot>
      `,
    })
    await nextTick()
    const input = wrapper.find('input')
    const description = wrapper.find('p')
    const describedBy = input.attributes('aria-describedby')

    expect(describedBy).toContain('external-hint')
    expect(describedBy).toContain(description.attributes('id') as string)
  })
})

describe('given a Field with native constraint validation', () => {
  it('shows a matching FieldError on blur when validationMode is onBlur, and clears once valid', async () => {
    const wrapper = mount({
      components,
      template: `
        <FieldRoot name="email" required validation-mode="onBlur">
          <FieldLabel>Email</FieldLabel>
          <FieldControl type="email" required />
          <FieldError match="valueMissing">Email is required</FieldError>
        </FieldRoot>
      `,
    }, { attachTo: document.body })

    const input = wrapper.find('input')

    // Before any interaction: no valid/invalid state yet.
    expect(wrapper.text()).not.toContain('Email is required')
    expect(wrapper.element.hasAttribute('data-invalid')).toBe(false)
    expect(wrapper.element.hasAttribute('data-valid')).toBe(false)

    await input.trigger('blur')
    expect(wrapper.text()).toContain('Email is required')
    expect(wrapper.element.getAttribute('data-invalid')).toBe('')
    expect(wrapper.element.hasAttribute('data-valid')).toBe(false)

    await input.setValue('jane@example.com')
    await input.trigger('blur')
    expect(wrapper.text()).not.toContain('Email is required')
    expect(wrapper.element.hasAttribute('data-invalid')).toBe(false)
    expect(wrapper.element.getAttribute('data-valid')).toBe('')
  })

  it('does not validate on blur when validationMode is onSubmit (the default)', async () => {
    const wrapper = mount({
      components,
      template: `
        <FieldRoot name="email" required>
          <FieldControl type="email" required />
          <FieldError match="valueMissing">Email is required</FieldError>
        </FieldRoot>
      `,
    })
    const input = wrapper.find('input')
    await input.trigger('blur')
    expect(wrapper.text()).not.toContain('Email is required')
  })
})

describe('given a Field with a custom validate function', () => {
  it('renders the sync validation message through the default slot', async () => {
    const validate = vi.fn((value: unknown) => (value === 'taken' ? 'Already taken' : null))

    const wrapper = mount({
      components,
      props: ['validate'],
      template: `
        <FieldRoot name="username" :validate="validate" validation-mode="onBlur">
          <FieldControl />
          <FieldError v-slot="{ errors }">{{ errors[0] }}</FieldError>
        </FieldRoot>
      `,
    }, { props: { validate } })

    const input = wrapper.find('input')
    await input.setValue('taken')
    await input.trigger('blur')

    expect(wrapper.text()).toContain('Already taken')
  })

  it('renders an async validation message once it resolves', async () => {
    const validate = (value: unknown) =>
      new Promise<string | null>(resolve => setTimeout(resolve, 10, value ? 'Server says no' : null))

    const wrapper = mount({
      components,
      props: ['validate'],
      template: `
        <FieldRoot name="username" :validate="validate" validation-mode="onBlur">
          <FieldControl />
          <FieldError v-slot="{ errors }">{{ errors[0] }}</FieldError>
        </FieldRoot>
      `,
    }, { props: { validate } })

    const input = wrapper.find('input')
    await input.setValue('anything')
    await input.trigger('blur')

    expect(wrapper.text()).not.toContain('Server says no')

    await new Promise(resolve => setTimeout(resolve, 20))
    await nextTick()

    expect(wrapper.text()).toContain('Server says no')
  })
})

describe('given a Field with a controlled invalid prop', () => {
  it('reflects the controlled value regardless of validation state', () => {
    const wrapper = mount({
      components,
      template: `
        <FieldRoot name="email" invalid>
          <FieldControl />
        </FieldRoot>
      `,
    })
    expect(wrapper.element.getAttribute('data-invalid')).toBe('')
    expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
  })
})

describe('a control outside any FieldRoot', () => {
  it('renders unaffected (Field participation is optional/inert)', () => {
    render({
      components: { FieldLabel },
      template: `<label for="standalone">Standalone</label><input id="standalone" />`,
    })
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.getAttribute('aria-describedby')).toBeNull()
    expect(input.getAttribute('aria-invalid')).toBeNull()
  })
})

describe('given pilot controls participating in a Field', () => {
  it('checkbox inside a Field gets the label association + describedby', async () => {
    const wrapper = mount({
      components: { ...components, CheckboxRoot },
      template: `
        <FieldRoot name="terms">
          <FieldLabel>Accept terms</FieldLabel>
          <CheckboxRoot />
          <FieldDescription>Required to continue</FieldDescription>
        </FieldRoot>
      `,
    })
    await nextTick()
    const label = wrapper.find('label')
    const checkbox = wrapper.find('[role="checkbox"]')
    const description = wrapper.find('p')

    expect(label.attributes('for')).toBe(checkbox.attributes('id'))
    expect(checkbox.attributes('aria-describedby')).toContain(description.attributes('id'))
  })

  it('a standalone Checkbox (outside a Field) renders no aria-describedby', () => {
    const wrapper = mount({ components: { CheckboxRoot }, template: '<CheckboxRoot />' })
    expect(wrapper.find('[role="checkbox"]').attributes('aria-describedby')).toBeUndefined()
  })

  it('a standalone Checkbox preserves a consumer-provided aria-invalid', () => {
    const wrapper = mount({
      components: { CheckboxRoot },
      template: '<CheckboxRoot aria-invalid="true" />',
    })
    expect(wrapper.find('[role="checkbox"]').attributes('aria-invalid')).toBe('true')
  })

  it('select trigger inside a Field gets the label association + describedby', async () => {
    const wrapper = mount({
      components: { ...components, SelectRoot, SelectTrigger },
      template: `
        <FieldRoot name="fruit">
          <FieldLabel>Fruit</FieldLabel>
          <SelectRoot>
            <SelectTrigger>Choose a fruit</SelectTrigger>
          </SelectRoot>
          <FieldDescription>Pick your favorite</FieldDescription>
        </FieldRoot>
      `,
    })
    await nextTick()
    const label = wrapper.find('label')
    const trigger = wrapper.find('[role="combobox"]')
    const description = wrapper.find('p')

    expect(label.attributes('for')).toBe(trigger.attributes('id'))
    expect(trigger.attributes('aria-describedby')).toContain(description.attributes('id'))
  })

  it('a standalone Select trigger (outside a Field) renders no aria-describedby', () => {
    const wrapper = mount({
      components: { SelectRoot, SelectTrigger },
      template: `<SelectRoot><SelectTrigger>Choose</SelectTrigger></SelectRoot>`,
    })
    expect(wrapper.find('[role="combobox"]').attributes('aria-describedby')).toBeUndefined()
  })

  it('a standalone Select trigger preserves a consumer-provided aria-invalid', () => {
    const wrapper = mount({
      components: { SelectRoot, SelectTrigger },
      template: `<SelectRoot><SelectTrigger aria-invalid="true">Choose</SelectTrigger></SelectRoot>`,
    })
    expect(wrapper.find('[role="combobox"]').attributes('aria-invalid')).toBe('true')
  })

  it('dateField inside a Field gets aria-labelledby + aria-describedby on the group', async () => {
    const wrapper = mount({
      components: { ...components, DateFieldRoot },
      template: `
        <FieldRoot name="dob">
          <FieldLabel>Date of birth</FieldLabel>
          <DateFieldRoot />
          <FieldDescription>MM/DD/YYYY</FieldDescription>
        </FieldRoot>
      `,
    })
    await nextTick()
    const label = wrapper.find('label')
    const group = wrapper.find('[role="group"]')
    const description = wrapper.find('p')

    expect(group.attributes('aria-labelledby')).toContain(label.attributes('id'))
    expect(group.attributes('aria-describedby')).toContain(description.attributes('id'))
  })

  it('a standalone DateField (outside a Field) renders no aria-labelledby/describedby', () => {
    const wrapper = mount({ components: { DateFieldRoot }, template: '<DateFieldRoot />' })
    const group = wrapper.find('[role="group"]')
    expect(group.attributes('aria-labelledby')).toBeUndefined()
    expect(group.attributes('aria-describedby')).toBeUndefined()
  })

  it('a standalone DateField preserves a consumer-provided aria-invalid', () => {
    const wrapper = mount({
      components: { DateFieldRoot },
      template: '<DateFieldRoot aria-invalid="true" />',
    })
    expect(wrapper.find('[role="group"]').attributes('aria-invalid')).toBe('true')
  })
})

describe('given a Field-wrapped Select', () => {
  const selectComponents = { ...components, FormRoot, SelectRoot, SelectTrigger, SelectPortal, SelectContent, SelectViewport, SelectItem }

  it('a programmatic modelValue change reports filled but not dirty', async () => {
    const wrapper = mount({
      components: selectComponents,
      props: ['modelValue'],
      template: `
        <FieldRoot name="fruit" data-testid="field">
          <SelectRoot :model-value="modelValue">
            <SelectTrigger>Choose a fruit</SelectTrigger>
          </SelectRoot>
        </FieldRoot>
      `,
    }, { props: { modelValue: undefined } })

    const field = wrapper.find('[data-testid="field"]')
    expect(field.attributes('data-dirty')).toBeUndefined()
    expect(field.attributes('data-filled')).toBeUndefined()

    await wrapper.setProps({ modelValue: 'apple' })

    expect(field.attributes('data-filled')).toBe('')
    expect(field.attributes('data-dirty')).toBeUndefined()
  })

  it('selecting an option via the trigger reports dirty (and filled)', async () => {
    const wrapper = mount({
      components: selectComponents,
      template: `
        <FieldRoot name="fruit" data-testid="field">
          <SelectRoot>
            <SelectTrigger>Choose a fruit</SelectTrigger>
            <SelectPortal>
              <SelectContent>
                <SelectViewport>
                  <SelectItem value="apple">Apple</SelectItem>
                </SelectViewport>
              </SelectContent>
            </SelectPortal>
          </SelectRoot>
        </FieldRoot>
      `,
    }, { attachTo: document.body })

    const field = wrapper.find('[data-testid="field"]')
    expect(field.attributes('data-dirty')).toBeUndefined()

    await selectFirstOption(wrapper)

    expect(field.attributes('data-dirty')).toBe('')
    expect(field.attributes('data-filled')).toBe('')

    // The open dropdown teleports to `document.body`, outside the wrapper's
    // own subtree — unmount explicitly so no reactive effect is left running
    // against it once the next test's `beforeEach` clears the DOM out from
    // under it.
    wrapper.unmount()
  })

  it('runs a custom validate with the Select\'s actual selected value on trigger blur', async () => {
    const validate = vi.fn((value: unknown) => (value ? null : 'Required'))

    const wrapper = mount({
      components: selectComponents,
      props: ['validate'],
      template: `
        <FieldRoot name="fruit" :validate="validate" validation-mode="onBlur">
          <FieldLabel>Fruit</FieldLabel>
          <SelectRoot>
            <SelectTrigger>Choose a fruit</SelectTrigger>
            <SelectPortal>
              <SelectContent>
                <SelectViewport>
                  <SelectItem value="apple">Apple</SelectItem>
                </SelectViewport>
              </SelectContent>
            </SelectPortal>
          </SelectRoot>
        </FieldRoot>
      `,
    }, { props: { validate }, attachTo: document.body })

    await selectFirstOption(wrapper)

    const trigger = wrapper.find('[role="combobox"]')
    await trigger.trigger('blur')

    expect(validate).toHaveBeenCalledWith('apple')

    wrapper.unmount()
  })

  it('an empty required Select does not render data-valid after a Form submit', async () => {
    const validate = vi.fn((value: unknown) => (value ? null : 'Required'))

    const wrapper = mount({
      components: selectComponents,
      props: ['validate'],
      template: `
        <FormRoot>
          <FieldRoot name="fruit" required :validate="validate" data-testid="field">
            <FieldLabel>Fruit</FieldLabel>
            <SelectRoot>
              <SelectTrigger>Choose a fruit</SelectTrigger>
            </SelectRoot>
          </FieldRoot>
        </FormRoot>
      `,
    }, { props: { validate }, attachTo: document.body })

    await wrapper.find('form').trigger('submit')
    // Draining the whole microtask queue (not just one `nextTick`) is
    // required here: our own submit handling awaits each field's async
    // `validateNow`, which takes more microtask turns to settle than a
    // single `nextTick()` guarantees.
    await new Promise(resolve => setTimeout(resolve, 0))
    await nextTick()

    const field = wrapper.find('[data-testid="field"]')
    expect(field.attributes('data-valid')).toBeUndefined()
    expect(field.attributes('data-invalid')).toBe('')
  })
})
