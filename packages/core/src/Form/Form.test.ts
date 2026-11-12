import { mount } from '@vue/test-utils'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { nextTick } from 'vue'
import { CheckboxRoot } from '@/Checkbox'
import { DateFieldRoot } from '@/DateField'
import { FieldControl, FieldError, FieldLabel, FieldRoot } from '@/Field'
import { SelectRoot, SelectTrigger } from '@/Select'
import { FormRoot } from '.'

const components = { FormRoot, FieldRoot, FieldControl, FieldError, FieldLabel }

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('given a Form with server errors', () => {
  it('passes axe accessibility tests', async () => {
    const wrapper = mount({
      components,
      template: `
        <FormRoot :errors="{ email: 'Taken' }">
          <FieldRoot name="email">
            <FieldLabel>Email</FieldLabel>
            <FieldControl type="email" />
            <FieldError>{{ 'error' }}</FieldError>
          </FieldRoot>
        </FormRoot>
      `,
    }, { attachTo: document.body })
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('surfaces the error for the matching field name', async () => {
    const wrapper = mount({
      components,
      template: `
        <FormRoot :errors="{ email: 'Taken' }">
          <FieldRoot name="email">
            <FieldControl type="email" />
            <FieldError v-slot="{ errors }">{{ errors[0] }}</FieldError>
          </FieldRoot>
        </FormRoot>
      `,
    })
    expect(wrapper.text()).toContain('Taken')
  })

  it('clears the server error once the user edits that field', async () => {
    const wrapper = mount({
      components,
      template: `
        <FormRoot :errors="{ email: 'Taken' }">
          <FieldRoot name="email">
            <FieldControl type="email" />
            <FieldError v-slot="{ errors }">{{ errors[0] }}</FieldError>
          </FieldRoot>
        </FormRoot>
      `,
    })
    expect(wrapper.text()).toContain('Taken')

    const input = wrapper.find('input')
    await input.setValue('new-email@example.com')

    expect(wrapper.text()).not.toContain('Taken')
  })

  it('re-shows a repeat server error (same message, new errors object) after being cleared by an edit', async () => {
    const wrapper = mount({
      components,
      props: ['errors'],
      template: `
        <FormRoot :errors="errors">
          <FieldRoot name="email">
            <FieldControl type="email" />
            <FieldError v-slot="{ errors }">{{ errors[0] }}</FieldError>
          </FieldRoot>
        </FormRoot>
      `,
    }, { props: { errors: { email: 'Taken' } } })

    expect(wrapper.text()).toContain('Taken')

    const input = wrapper.find('input')
    await input.setValue('new-email@example.com')
    expect(wrapper.text()).not.toContain('Taken')

    // A fresh submit producing the *same* message is a brand-new `errors`
    // object with an identical value for this field — watching only the
    // extracted string (unchanged) would never re-fire.
    await wrapper.setProps({ errors: { email: 'Taken' } })
    expect(wrapper.text()).toContain('Taken')
  })
})

// Dispatches a cancelable submit event directly, so a test can tell whether
// the native submission would have gone ahead (`defaultPrevented`). Drains
// the task queue afterwards, so a "not submitted" assertion can't pass just
// because an emit hadn't happened yet.
async function submit(wrapper: ReturnType<typeof mount>) {
  const event = new Event('submit', { cancelable: true })
  wrapper.find('form').element.dispatchEvent(event)
  await new Promise(resolve => setTimeout(resolve, 0))
  await nextTick()
  return event
}

describe('given a Form submission', () => {
  it('turns off native validation UI, so its own submit handling always runs', () => {
    const wrapper = mount({ components, template: '<FormRoot />' })
    expect(wrapper.find('form').attributes('novalidate')).toBe('')
  })

  it('prevents submission and focuses the first invalid control when a required field is empty', async () => {
    const onSubmit = vi.fn()
    const wrapper = mount({
      components,
      template: `
        <FormRoot @submit="onSubmit">
          <FieldRoot name="email" required>
            <FieldControl type="email" />
          </FieldRoot>
        </FormRoot>
      `,
      methods: { onSubmit },
    }, { attachTo: document.body })

    const event = await submit(wrapper)

    expect(event.defaultPrevented).toBe(true)
    expect(onSubmit).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(wrapper.find('input').element)
  })

  it('emits submit and leaves the native submission alone once every field is valid', async () => {
    const onSubmit = vi.fn()
    const wrapper = mount({
      components,
      template: `
        <FormRoot @submit="onSubmit">
          <FieldRoot name="email" required>
            <FieldControl type="email" />
          </FieldRoot>
        </FormRoot>
      `,
      methods: { onSubmit },
    }, { attachTo: document.body })

    await wrapper.find('input').setValue('jane@example.com')
    const event = await submit(wrapper)

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith(event)
    expect(event.defaultPrevented).toBe(false)
  })

  it('emits formSubmit with the named field values and prevents the native submission', async () => {
    const onFormSubmit = vi.fn()
    const wrapper = mount({
      components,
      template: `
        <FormRoot @form-submit="onFormSubmit">
          <FieldRoot name="email">
            <FieldControl />
          </FieldRoot>
          <FieldRoot name="username">
            <FieldControl />
          </FieldRoot>
        </FormRoot>
      `,
      methods: { onFormSubmit },
    }, { attachTo: document.body })

    const [email, username] = wrapper.findAll('input')
    await email.setValue('jane@example.com')
    await username.setValue('jane')
    const event = await submit(wrapper)

    expect(event.defaultPrevented).toBe(true)
    expect(onFormSubmit).toHaveBeenCalledWith({ email: 'jane@example.com', username: 'jane' }, event)
  })

  it('focuses the first invalid control in document order, not registration order', async () => {
    const wrapper = mount({
      components,
      data: () => ({ showFirst: false }),
      template: `
        <FormRoot>
          <FieldRoot v-if="showFirst" name="first" required>
            <FieldControl data-testid="first" />
          </FieldRoot>
          <FieldRoot name="second" required>
            <FieldControl data-testid="second" />
          </FieldRoot>
        </FormRoot>
      `,
    }, { attachTo: document.body })

    // Mounted after "second", so it registers last despite coming first.
    await wrapper.setData({ showFirst: true })
    await submit(wrapper)

    expect(document.activeElement).toBe(wrapper.find('[data-testid="first"]').element)
  })

  it('does not wait for an async validate in onSubmit mode, but shows its error once resolved', async () => {
    const onSubmit = vi.fn()
    const validate = (value: unknown) =>
      new Promise<string | null>(resolve => setTimeout(resolve, 10, value === 'taken' ? 'Already taken' : null))

    const wrapper = mount({
      components,
      props: ['validate'],
      template: `
        <FormRoot @submit="onSubmit">
          <FieldRoot name="username" :validate="validate">
            <FieldControl />
            <FieldError v-slot="{ errors }">{{ errors[0] }}</FieldError>
          </FieldRoot>
        </FormRoot>
      `,
      methods: { onSubmit },
    }, { props: { validate }, attachTo: document.body })

    await wrapper.find('input').setValue('taken')
    await submit(wrapper)
    expect(onSubmit).toHaveBeenCalledTimes(1)

    await new Promise(resolve => setTimeout(resolve, 20))
    await nextTick()
    expect(wrapper.text()).toContain('Already taken')
  })

  it('keeps blocking on a previous async error while revalidation is pending outside onSubmit mode', async () => {
    const onSubmit = vi.fn()
    const validate = (value: unknown) =>
      new Promise<string | null>(resolve => setTimeout(resolve, 10, value === 'taken' ? 'Already taken' : null))

    const wrapper = mount({
      components,
      props: ['validate'],
      template: `
        <FormRoot @submit="onSubmit">
          <FieldRoot name="username" :validate="validate" validation-mode="onBlur">
            <FieldControl />
          </FieldRoot>
        </FormRoot>
      `,
      methods: { onSubmit },
    }, { props: { validate }, attachTo: document.body })

    const input = wrapper.find('input')
    await input.setValue('taken')
    await input.trigger('blur')
    await new Promise(resolve => setTimeout(resolve, 20))

    await submit(wrapper)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('re-validates on change after a failed submit in onSubmit mode', async () => {
    const wrapper = mount({
      components,
      template: `
        <FormRoot>
          <FieldRoot name="email" required>
            <FieldControl />
            <FieldError match="valueMissing">Required</FieldError>
          </FieldRoot>
        </FormRoot>
      `,
    }, { attachTo: document.body })

    // Before any submit, onSubmit mode doesn't validate on change.
    await wrapper.find('input').setValue('')
    expect(wrapper.text()).not.toContain('Required')

    await submit(wrapper)
    expect(wrapper.text()).toContain('Required')

    await wrapper.find('input').setValue('jane@example.com')
    expect(wrapper.text()).not.toContain('Required')
  })

  it('inherits validationMode from the form', async () => {
    const wrapper = mount({
      components,
      template: `
        <FormRoot validation-mode="onBlur">
          <FieldRoot name="email" required>
            <FieldControl />
            <FieldError match="valueMissing">Required</FieldError>
          </FieldRoot>
        </FormRoot>
      `,
    }, { attachTo: document.body })

    const input = wrapper.find('input')
    await input.setValue('j')
    await input.setValue('')
    await input.trigger('blur')
    expect(wrapper.text()).toContain('Required')
  })

  it('an invalid prop of false does not let a failing field submit', async () => {
    const onSubmit = vi.fn()
    const wrapper = mount({
      components,
      template: `
        <FormRoot @submit="onSubmit">
          <FieldRoot name="email" required :invalid="false">
            <FieldControl />
          </FieldRoot>
        </FormRoot>
      `,
      methods: { onSubmit },
    }, { attachTo: document.body })

    await submit(wrapper)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('skips validation for a disabled field', async () => {
    const onSubmit = vi.fn()
    const validate = vi.fn(() => 'Invalid')
    const wrapper = mount({
      components,
      props: ['validate'],
      template: `
        <FormRoot @submit="onSubmit">
          <FieldRoot name="email" disabled :validate="validate" data-testid="field">
            <FieldControl />
          </FieldRoot>
        </FormRoot>
      `,
      methods: { onSubmit },
    }, { props: { validate }, attachTo: document.body })

    await submit(wrapper)
    expect(validate).not.toHaveBeenCalled()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[data-testid="field"]').attributes('data-invalid')).toBeUndefined()
  })

  it('focuses the first field invalidated by server errors that arrive after a submit', async () => {
    const wrapper = mount({
      components,
      props: ['errors'],
      template: `
        <FormRoot :errors="errors">
          <FieldRoot name="email">
            <FieldControl data-testid="email" />
          </FieldRoot>
          <FieldRoot name="username">
            <FieldControl data-testid="username" />
          </FieldRoot>
        </FormRoot>
      `,
    }, { props: { errors: {} }, attachTo: document.body })

    await submit(wrapper)
    await wrapper.setProps({ errors: { username: 'Taken' } })
    await nextTick()

    expect(document.activeElement).toBe(wrapper.find('[data-testid="username"]').element)
  })

  it('exposes validate(), optionally for a single field', async () => {
    const wrapper = mount({
      components,
      template: `
        <FormRoot ref="form">
          <FieldRoot name="email" required data-testid="email">
            <FieldControl />
          </FieldRoot>
          <FieldRoot name="username" required data-testid="username">
            <FieldControl />
          </FieldRoot>
        </FormRoot>
      `,
    }, { attachTo: document.body })

    const form = wrapper.vm.$refs.form as { validate: (name?: string) => boolean }

    expect(form.validate('email')).toBe(false)
    await nextTick()
    expect(wrapper.find('[data-testid="email"]').attributes('data-invalid')).toBe('')
    expect(wrapper.find('[data-testid="username"]').attributes('data-invalid')).toBeUndefined()

    expect(form.validate()).toBe(false)
    await nextTick()
    expect(wrapper.find('[data-testid="username"]').attributes('data-invalid')).toBe('')
  })

  it('a throwing validate is reported and leaves the field error-free', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onSubmit = vi.fn()
    const validate = () => {
      throw new Error('boom')
    }

    const wrapper = mount({
      components,
      props: ['validate'],
      template: `
        <FormRoot @submit="onSubmit">
          <FieldRoot name="username" :validate="validate">
            <FieldControl />
          </FieldRoot>
        </FormRoot>
      `,
      methods: { onSubmit },
    }, { props: { validate }, attachTo: document.body })

    await submit(wrapper)

    expect(consoleErrorSpy).toHaveBeenCalled()
    expect(onSubmit).toHaveBeenCalledTimes(1)

    consoleErrorSpy.mockRestore()
  })
})

describe('given required non-native controls in a Form', () => {
  beforeAll(() => {
    // SelectTrigger's Popper machinery expects this during mount.
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  })

  it('blocks submission while a required Select has no value', async () => {
    const onSubmit = vi.fn()
    const wrapper = mount({
      components: { ...components, SelectRoot, SelectTrigger },
      template: `
        <FormRoot @submit="onSubmit">
          <FieldRoot name="fruit" required data-testid="field">
            <SelectRoot>
              <SelectTrigger>Choose a fruit</SelectTrigger>
            </SelectRoot>
          </FieldRoot>
        </FormRoot>
      `,
      methods: { onSubmit },
    }, { attachTo: document.body })

    await submit(wrapper)

    expect(onSubmit).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="field"]').attributes('data-invalid')).toBe('')
    expect(document.activeElement).toBe(wrapper.find('[role="combobox"]').element)
  })

  it('submits once a required Select has a value', async () => {
    const onSubmit = vi.fn()
    const wrapper = mount({
      components: { ...components, SelectRoot, SelectTrigger },
      template: `
        <FormRoot @submit="onSubmit">
          <FieldRoot name="fruit" required>
            <SelectRoot default-value="apple">
              <SelectTrigger>Choose a fruit</SelectTrigger>
            </SelectRoot>
          </FieldRoot>
        </FormRoot>
      `,
      methods: { onSubmit },
    }, { attachTo: document.body })

    await submit(wrapper)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('blocks submission until a required Checkbox is checked', async () => {
    const onSubmit = vi.fn()
    const wrapper = mount({
      components: { ...components, CheckboxRoot },
      template: `
        <FormRoot @submit="onSubmit">
          <FieldRoot name="terms">
            <CheckboxRoot required />
          </FieldRoot>
        </FormRoot>
      `,
      methods: { onSubmit },
    }, { attachTo: document.body })

    await submit(wrapper)
    expect(onSubmit).not.toHaveBeenCalled()

    await wrapper.find('[role="checkbox"]').trigger('click')
    await submit(wrapper)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('blocks submission while a required DateField is empty', async () => {
    const onSubmit = vi.fn()
    const wrapper = mount({
      components: { ...components, DateFieldRoot },
      template: `
        <FormRoot @submit="onSubmit">
          <FieldRoot name="dob" required data-testid="field">
            <DateFieldRoot />
          </FieldRoot>
        </FormRoot>
      `,
      methods: { onSubmit },
    }, { attachTo: document.body })

    await submit(wrapper)
    expect(onSubmit).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="field"]').attributes('data-invalid')).toBe('')
  })
})

describe('given a native form reset', () => {
  it('clears touched/dirty state and errors', async () => {
    const wrapper = mount({
      components,
      template: `
        <FormRoot :errors="{ email: 'Taken' }">
          <FieldRoot name="email" required validation-mode="onBlur">
            <FieldControl type="email" required />
            <FieldError v-slot="{ errors }">{{ errors[0] }}</FieldError>
          </FieldRoot>
        </FormRoot>
      `,
    }, { attachTo: document.body })

    const input = wrapper.find('input')
    await input.trigger('blur')

    const fieldRootEl = wrapper.find('[data-touched]')
    expect(fieldRootEl.exists()).toBe(true)
    expect(wrapper.text()).toContain('Taken')

    await wrapper.find('form').trigger('reset')

    expect(wrapper.find('[data-touched]').exists()).toBe(false)
    expect(wrapper.find('[data-dirty]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Taken')
  })
})
