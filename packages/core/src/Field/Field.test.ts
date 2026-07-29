import { render, screen } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { nextTick } from 'vue'
import { FieldControl, FieldDescription, FieldError, FieldLabel, FieldRoot } from '.'

const components = { FieldRoot, FieldLabel, FieldControl, FieldDescription, FieldError }

beforeEach(() => {
  document.body.innerHTML = ''
})

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
