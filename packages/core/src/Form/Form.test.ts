import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { nextTick } from 'vue'
import { FieldControl, FieldError, FieldLabel, FieldRoot } from '@/Field'
import { FormRoot } from '.'

const components = { FormRoot, FieldRoot, FieldControl, FieldError, FieldLabel }

beforeEach(() => {
  document.body.innerHTML = ''
})

// Our own submit handling (running every field's validation, some of which
// may be async) takes more microtask turns to settle than a single
// `nextTick()` guarantees. A zero-length macrotask wait drains the whole
// microtask queue first, so this reliably waits for it without depending on
// exact tick counts.
function flushAsync() {
  return new Promise(resolve => setTimeout(resolve, 0))
}

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
})

describe('given a Form submission', () => {
  it('prevents submission and focuses the first invalid control when a required field is empty', async () => {
    const onSubmit = vi.fn()
    const wrapper = mount({
      components,
      template: `
        <FormRoot @submit="onSubmit">
          <FieldRoot name="email" required>
            <FieldControl type="email" required />
          </FieldRoot>
        </FormRoot>
      `,
      methods: { onSubmit },
    }, { attachTo: document.body })

    await wrapper.find('form').trigger('submit')
    await flushAsync()
    await nextTick()

    expect(onSubmit).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(wrapper.find('input').element)
  })

  it('lets the submission through once every field is valid', async () => {
    const onSubmit = vi.fn()
    const wrapper = mount({
      components,
      template: `
        <FormRoot @submit="onSubmit">
          <FieldRoot name="email" required>
            <FieldControl type="email" required />
          </FieldRoot>
        </FormRoot>
      `,
      methods: { onSubmit },
    }, { attachTo: document.body })

    await wrapper.find('input').setValue('jane@example.com')
    await wrapper.find('form').trigger('submit')
    await flushAsync()
    await nextTick()

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('awaits async validate before deciding whether to block submission', async () => {
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
    await wrapper.find('form').trigger('submit')
    await new Promise(resolve => setTimeout(resolve, 20))
    await nextTick()

    expect(onSubmit).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Already taken')
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
