import { fireEvent, render, screen } from '@testing-library/vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, nextTick } from 'vue'
import { CheckboxGroupRoot, CheckboxRoot } from '@/Checkbox'
import { DateFieldInput, DateFieldRoot } from '@/DateField'
import { FormRoot } from '@/Form'
import { SelectContent, SelectItem, SelectPortal, SelectRoot, SelectTrigger, SelectViewport } from '@/Select'
import { FieldControl, FieldDescription, FieldError, FieldLabel, FieldRoot, FieldValidity, injectFieldRootContext } from '.'

// Reports arbitrary (non-string) values through the same side channel a
// non-native control uses, so `filled` can be exercised for values a native
// `input` could never produce.
const FieldProbe = defineComponent({
  name: 'FieldProbe',
  setup(_, { expose }) {
    const context = injectFieldRootContext()
    expose({ report: (value: unknown) => context.handleControlInput({ value }) })
    return () => null
  },
})

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
  await fireEvent.pointerDown(trigger.element, { button: 0, ctrlKey: false })
  await nextTick()
  await nextTick()
  const option = document.querySelector('[role="option"]') as HTMLElement
  option.focus()
  // Needs 2 pointerup events because SelectContentImpl ignores accidental first pointerups.
  await fireEvent.pointerUp(option)
  await fireEvent.pointerUp(option)
  await nextTick()
}

// Toggles the first option of an already-open Select (`multiple` mode keeps
// the content open after a selection). Unlike `selectFirstOption` this needs
// only one `pointerup`: `SelectContentImpl`'s open-from-pointerdown guard is
// registered `once`, so it has already been spent by the first selection.
async function toggleFirstOption() {
  const option = document.querySelector('[role="option"]') as HTMLElement
  option.focus()
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

    // Blurring an untouched field doesn't report `valueMissing` (noise reduction)...
    await input.trigger('blur')
    expect(wrapper.text()).not.toContain('Email is required')

    // ...but emptying it after an edit does.
    await input.setValue('j')
    await input.setValue('')
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

describe('given a pilot control with its own name inside a named Field', () => {
  const controls = {
    Checkbox: '<CheckboxRoot name="control-name" :model-value="true" />',
    Select: '<SelectRoot name="control-name" model-value="apple"><SelectTrigger>Fruit</SelectTrigger></SelectRoot>',
    DateField: '<DateFieldRoot name="control-name"><template #default="{ segments }"><DateFieldInput v-for="item in segments" :key="item.part" :part="item.part">{{ item.value }}</DateFieldInput></template></DateFieldRoot>',
  }

  for (const [family, control] of Object.entries(controls)) {
    it(`${family} submits natively under the field's name`, async () => {
      const wrapper = mount({
        components: { ...components, FormRoot, CheckboxRoot, SelectRoot, SelectTrigger, DateFieldRoot, DateFieldInput },
        template: `<FormRoot><FieldRoot name="field-name">${control}</FieldRoot></FormRoot>`,
      }, { attachTo: document.body })
      await flushPromises()
      const names = Array.from((wrapper.element as HTMLElement).querySelectorAll('[name]')).map(element => element.getAttribute('name'))
      expect(names).toEqual(['field-name'])
      wrapper.unmount()
    })

    it(`${family} keeps its own name when the field has none`, async () => {
      const wrapper = mount({
        components: { ...components, FormRoot, CheckboxRoot, SelectRoot, SelectTrigger, DateFieldRoot, DateFieldInput },
        template: `<FormRoot><FieldRoot>${control}</FieldRoot></FormRoot>`,
      }, { attachTo: document.body })
      await flushPromises()
      const names = Array.from((wrapper.element as HTMLElement).querySelectorAll('[name]')).map(element => element.getAttribute('name'))
      expect(names).toEqual(['control-name'])
      wrapper.unmount()
    })
  }
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

    expect(validate).toHaveBeenCalledWith('apple', expect.anything())

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

  it('a multiple Select reports the resulting selection, not the toggled option', async () => {
    const validate = vi.fn(() => null)

    const wrapper = mount({
      components: selectComponents,
      props: ['validate'],
      template: `
        <FieldRoot name="fruit" :validate="validate" validation-mode="onChange" data-testid="field">
          <SelectRoot multiple>
            <SelectTrigger>Choose fruits</SelectTrigger>
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

    const field = wrapper.find('[data-testid="field"]')

    await selectFirstOption(wrapper)
    expect(validate).toHaveBeenLastCalledWith(['apple'], expect.anything())
    expect(field.attributes('data-filled')).toBe('')

    // Deselecting must report the (now empty) selection — reporting the
    // toggled item would hand `validate` the item that was just removed and
    // leave the field looking filled.
    await toggleFirstOption()
    expect(validate).toHaveBeenLastCalledWith([], expect.anything())
    expect(field.attributes('data-filled')).toBeUndefined()

    wrapper.unmount()
  })
})

describe('given a Field control reporting non-string values', () => {
  it('treats 0 as filled and an empty array as empty', async () => {
    const wrapper = mount({
      components: { ...components, FieldProbe },
      template: `
        <FieldRoot name="quantity" data-testid="field">
          <FieldProbe ref="probe" />
        </FieldRoot>
      `,
    })

    const field = wrapper.find('[data-testid="field"]')
    const probe = wrapper.vm.$refs.probe as { report: (value: unknown) => void }

    // `Boolean(0)` is `false`, but a selected `0` is a real value.
    probe.report(0)
    await nextTick()
    expect(field.attributes('data-filled')).toBe('')

    // `Boolean([])` is `true`, but an empty multi-selection is not filled.
    probe.report([])
    await nextTick()
    expect(field.attributes('data-filled')).toBeUndefined()

    probe.report(['apple'])
    await nextTick()
    expect(field.attributes('data-filled')).toBe('')

    probe.report('')
    await nextTick()
    expect(field.attributes('data-filled')).toBeUndefined()
  })
})

describe('given a native control whose value changes without an input event', () => {
  it('validates against the live DOM value rather than a stale reported one', async () => {
    const validate = vi.fn(() => null)

    const wrapper = mount({
      components: { ...components, FormRoot },
      props: ['validate'],
      template: `
        <FormRoot>
          <FieldRoot name="email" :validate="validate">
            <FieldControl />
          </FieldRoot>
        </FormRoot>
      `,
    }, { props: { validate }, attachTo: document.body })

    const control = wrapper.find('input')
    await control.setValue('typed@example.com')

    // Programmatic writes (v-model, a direct `.value` assignment, autofill)
    // don't fire `input`, so the value last reported through the side channel
    // is now stale and must not win at submit time.
    ;(control.element as HTMLInputElement).value = 'autofilled@example.com'

    await wrapper.find('form').trigger('submit')
    await new Promise(resolve => setTimeout(resolve, 0))
    await nextTick()

    expect(validate).toHaveBeenLastCalledWith('autofilled@example.com', { email: 'autofilled@example.com' })
  })
})

describe('given attributes set on FieldControl itself', () => {
  it('keeps the control\'s own name/required/disabled/aria-invalid', () => {
    const wrapper = mount({
      components,
      template: `
        <FieldRoot>
          <FieldControl name="email" required disabled aria-invalid="true" />
        </FieldRoot>
      `,
    })
    const input = wrapper.find('input').element as HTMLInputElement

    expect(input.name).toBe('email')
    expect(input.required).toBe(true)
    expect(input.disabled).toBe(true)
    expect(input.getAttribute('aria-invalid')).toBe('true')
  })

  it('lets the field\'s name take precedence over the control\'s', () => {
    const wrapper = mount({
      components,
      template: `
        <FieldRoot name="field-name">
          <FieldControl name="control-name" />
        </FieldRoot>
      `,
    })
    expect((wrapper.find('input').element as HTMLInputElement).name).toBe('field-name')
  })

  it('marks a control mounted with a value as filled', async () => {
    const wrapper = mount({
      components,
      template: `
        <FieldRoot data-testid="field">
          <FieldControl value="prefilled" />
        </FieldRoot>
      `,
    })
    await nextTick()
    expect(wrapper.find('[data-testid="field"]').attributes('data-filled')).toBe('')
  })
})

describe('given a Field-wrapped Checkbox', () => {
  it('runs on-change validation with the new checked state', async () => {
    const validate = vi.fn(() => null)
    const wrapper = mount({
      components: { ...components, CheckboxRoot },
      props: ['validate'],
      template: `
        <FieldRoot name="terms" validation-mode="onChange" :validate="validate">
          <CheckboxRoot />
        </FieldRoot>
      `,
    }, { props: { validate } })

    await wrapper.find('[role="checkbox"]').trigger('click')
    expect(validate).toHaveBeenLastCalledWith(true, expect.anything())

    await wrapper.find('[role="checkbox"]').trigger('click')
    expect(validate).toHaveBeenLastCalledWith(false, expect.anything())
  })

  it('reports filled correctly when checked through v-model', async () => {
    const wrapper = mount({
      components: { ...components, CheckboxRoot },
      data: () => ({ checked: false }),
      template: `
        <FieldRoot name="terms" data-testid="field">
          <CheckboxRoot v-model="checked" />
        </FieldRoot>
      `,
    })
    const field = wrapper.find('[data-testid="field"]')

    await wrapper.find('[role="checkbox"]').trigger('click')
    expect(wrapper.find('[role="checkbox"]').attributes('aria-checked')).toBe('true')
    expect(field.attributes('data-filled')).toBe('')

    await wrapper.find('[role="checkbox"]').trigger('click')
    expect(field.attributes('data-filled')).toBeUndefined()
  })

  it('does not give the field id to every checkbox in a group', () => {
    const wrapper = mount({
      components: { ...components, CheckboxRoot, CheckboxGroupRoot },
      template: `
        <FieldRoot name="fruits">
          <CheckboxGroupRoot :default-value="[]">
            <CheckboxRoot value="apple" />
            <CheckboxRoot value="banana" />
          </CheckboxGroupRoot>
        </FieldRoot>
      `,
    })
    const ids = wrapper.findAll('[role="checkbox"]').map(checkbox => checkbox.attributes('id'))
    expect(ids).toEqual([undefined, undefined])
  })
})

describe('given a FieldRoot ref', () => {
  it('exposes validate(), which runs regardless of validationMode', async () => {
    const wrapper = mount({
      components,
      template: `
        <FieldRoot ref="field" required data-testid="field">
          <FieldControl />
          <FieldError match="valueMissing">Required</FieldError>
        </FieldRoot>
      `,
    })

    const field = wrapper.vm.$refs.field as { validate: () => boolean }
    expect(field.validate()).toBe(false)
    await nextTick()
    expect(wrapper.text()).toContain('Required')
    expect(wrapper.find('[data-testid="field"]').attributes('data-invalid')).toBe('')
  })
})

describe('given a FieldError', () => {
  it('shows the native validation message by default when a constraint fails', async () => {
    const wrapper = mount({
      components,
      template: `
        <FieldRoot ref="field" required>
          <FieldControl />
          <FieldError data-testid="error" />
        </FieldRoot>
      `,
    }, { attachTo: document.body })

    ;(wrapper.vm.$refs.field as { validate: () => boolean }).validate()
    await nextTick()

    const input = wrapper.find('input').element as HTMLInputElement
    expect(wrapper.find('[data-testid="error"]').text()).toBe(input.validationMessage)
    expect(input.validationMessage).not.toBe('')
  })

  it('renders several messages as a list', async () => {
    const wrapper = mount({
      components,
      props: ['validate'],
      template: `
        <FieldRoot ref="field" :validate="validate">
          <FieldControl />
          <FieldError data-testid="error" />
        </FieldRoot>
      `,
    }, { props: { validate: () => ['Too short', 'Needs a number'] }, attachTo: document.body })

    ;(wrapper.vm.$refs.field as { validate: () => boolean }).validate()
    await nextTick()

    expect(wrapper.findAll('[data-testid="error"] li').map(li => li.text())).toEqual(['Too short', 'Needs a number'])
  })

  it('installs custom errors on the native control, and removes them once valid', async () => {
    const wrapper = mount({
      components,
      props: ['validate'],
      template: `
        <FieldRoot ref="field" :validate="validate" validation-mode="onChange">
          <FieldControl />
        </FieldRoot>
      `,
    }, { props: { validate: (value: unknown) => (value === 'bad' ? 'Not allowed' : null) }, attachTo: document.body })

    const input = wrapper.find('input')
    const element = input.element as HTMLInputElement
    await input.setValue('bad')
    expect(element.validity.customError).toBe(true)
    expect(element.validationMessage).toBe('Not allowed')

    await input.setValue('good')
    expect(element.validity.customError).toBe(false)
  })

  it('always renders with match="true", and never while the field is disabled', async () => {
    const wrapper = mount({
      components,
      props: ['disabled'],
      template: `
        <FieldRoot :disabled="disabled" invalid>
          <FieldControl />
          <FieldError data-testid="always" match>Always</FieldError>
          <FieldError data-testid="default">Default</FieldError>
        </FieldRoot>
      `,
    }, { props: { disabled: false } })

    expect(wrapper.find('[data-testid="always"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="default"]').exists()).toBe(true)

    await wrapper.setProps({ disabled: true })
    // `Presence` unmounts once any exit animation is done.
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(wrapper.find('[data-testid="always"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="default"]').exists()).toBe(false)
  })

  it('shows server errors over validation messages unless matching a specific constraint', async () => {
    const wrapper = mount({
      components: { ...components, FormRoot },
      template: `
        <FormRoot ref="form" :errors="{ email: 'Taken on the server' }">
          <FieldRoot name="email" required>
            <FieldControl />
            <FieldError data-testid="any" />
            <FieldError data-testid="missing" match="valueMissing" />
          </FieldRoot>
        </FormRoot>
      `,
    }, { attachTo: document.body })

    ;(wrapper.vm.$refs.form as { validate: () => boolean }).validate()
    await nextTick()

    const input = wrapper.find('input').element as HTMLInputElement
    expect(wrapper.find('[data-testid="any"]').text()).toBe('Taken on the server')
    expect(wrapper.find('[data-testid="missing"]').text()).toBe(input.validationMessage)
  })
})

describe('given a Field\'s dirty and touched state', () => {
  it('is dirty only while the value differs from the initial one', async () => {
    const wrapper = mount({
      components,
      template: `
        <FieldRoot data-testid="field">
          <FieldControl default-value="start" />
        </FieldRoot>
      `,
    })
    const field = wrapper.find('[data-testid="field"]')
    const input = wrapper.find('input')

    await input.setValue('changed')
    expect(field.attributes('data-dirty')).toBe('')

    await input.setValue('start')
    expect(field.attributes('data-dirty')).toBeUndefined()
  })

  it('can be controlled through the dirty and touched props', async () => {
    const wrapper = mount({
      components,
      props: ['dirty', 'touched'],
      template: `
        <FieldRoot :dirty="dirty" :touched="touched" data-testid="field">
          <FieldControl />
        </FieldRoot>
      `,
    }, { props: { dirty: true, touched: false } })
    const field = wrapper.find('[data-testid="field"]')

    expect(field.attributes('data-dirty')).toBe('')
    await wrapper.find('input').trigger('blur')
    expect(field.attributes('data-touched')).toBeUndefined()

    await wrapper.setProps({ dirty: false, touched: true })
    expect(field.attributes('data-dirty')).toBeUndefined()
    expect(field.attributes('data-touched')).toBe('')
  })

  it('clears a resolved valueMissing while typing in onBlur mode', async () => {
    const wrapper = mount({
      components,
      template: `
        <FieldRoot ref="field" required validation-mode="onBlur">
          <FieldControl />
          <FieldError match="valueMissing">Required</FieldError>
        </FieldRoot>
      `,
    }, { attachTo: document.body })

    ;(wrapper.vm.$refs.field as { validate: () => boolean }).validate()
    await nextTick()
    expect(wrapper.text()).toContain('Required')

    await wrapper.find('input').setValue('j')
    expect(wrapper.text()).not.toContain('Required')
  })
})

describe('given the state data attributes on every part', () => {
  it('mirrors the field state on the label, control, description and error', async () => {
    const wrapper = mount({
      components,
      template: `
        <FieldRoot invalid>
          <FieldLabel>Email</FieldLabel>
          <FieldControl />
          <FieldDescription>Help</FieldDescription>
          <FieldError>Error</FieldError>
        </FieldRoot>
      `,
    })

    for (const selector of ['label', 'input', 'p', '[data-state]'])
      expect(wrapper.find(selector).attributes('data-invalid')).toBe('')
  })

  it('mirrors the field state on a participating Checkbox, but not a standalone one', () => {
    const wrapper = mount({
      components: { ...components, CheckboxRoot },
      template: `
        <div>
          <FieldRoot invalid><CheckboxRoot data-testid="inside" /></FieldRoot>
          <CheckboxRoot data-testid="outside" />
        </div>
      `,
    })
    expect(wrapper.find('[data-testid="inside"]').attributes('data-invalid')).toBe('')
    expect(wrapper.find('[data-testid="outside"]').attributes('data-invalid')).toBeUndefined()
  })
})

describe('given a FieldLabel', () => {
  it('labels the control through aria-labelledby only while mounted', async () => {
    const wrapper = mount({
      components,
      props: ['showLabel'],
      template: `
        <FieldRoot>
          <FieldLabel v-if="showLabel">Email</FieldLabel>
          <FieldControl />
        </FieldRoot>
      `,
    }, { props: { showLabel: true } })
    await nextTick()

    const labelId = wrapper.find('label').attributes('id')
    expect(labelId).toBeTruthy()
    expect(wrapper.find('input').attributes('aria-labelledby')).toBe(labelId)

    await wrapper.setProps({ showLabel: false })
    expect(wrapper.find('input').attributes('aria-labelledby')).toBeUndefined()
  })

  it('with nativeLabel=false, drops for and focuses the control on click', async () => {
    const wrapper = mount({
      components: { ...components, SelectRoot, SelectTrigger },
      template: `
        <FieldRoot>
          <FieldLabel as="div" :native-label="false" data-testid="label">Fruit</FieldLabel>
          <SelectRoot>
            <SelectTrigger>Choose</SelectTrigger>
          </SelectRoot>
        </FieldRoot>
      `,
    }, { attachTo: document.body })
    await nextTick()

    const label = wrapper.find('[data-testid="label"]')
    const trigger = wrapper.find('[role="combobox"]')
    expect(label.attributes('for')).toBeUndefined()
    expect(trigger.attributes('aria-labelledby')).toBe(label.attributes('id'))

    await label.trigger('click')
    expect(document.activeElement).toBe(trigger.element)
  })
})

describe('given a FieldControl with v-model', () => {
  it('emits the typed value and validates controlled changes on change', async () => {
    const validate = vi.fn(() => null)
    const wrapper = mount({
      components,
      props: ['validate'],
      data: () => ({ text: 'a' }),
      template: `
        <FieldRoot :validate="validate" validation-mode="onChange" data-testid="field">
          <FieldControl v-model="text" />
        </FieldRoot>
      `,
    }, { props: { validate } })

    const input = wrapper.find('input')
    expect((input.element as HTMLInputElement).value).toBe('a')

    await input.setValue('ab')
    await nextTick()
    expect((wrapper.vm as unknown as { text: string }).text).toBe('ab')
    expect(validate).toHaveBeenLastCalledWith('ab', expect.anything())
    expect(wrapper.find('[data-testid="field"]').attributes('data-dirty')).toBe('')
  })

  // #2828: Base UI's `FieldControl` reports `'none'` with the native event.
  it('passes change details with reason `none` and the input event', async () => {
    const onUpdate = vi.fn()
    const wrapper = mount({
      components,
      methods: { onUpdate },
      template: `
        <FieldRoot>
          <FieldControl @update:model-value="onUpdate" />
        </FieldRoot>
      `,
    })
    await wrapper.find('input').setValue('ab')
    expect(onUpdate).toHaveBeenCalledTimes(1)
    const [value, details] = onUpdate.mock.calls[0]
    expect(value).toBe('ab')
    expect(details.reason).toBe('none')
    expect(details.event).toBeInstanceOf(Event)
    expect(details.event.type).toBe('input')
  })
})

describe('given a FieldValidity', () => {
  it('exposes the validity, errors and value through its slot', async () => {
    const wrapper = mount({
      components: { ...components, FieldValidity },
      props: ['validate'],
      template: `
        <FieldRoot ref="field" :validate="validate">
          <FieldControl value="hello" />
          <FieldValidity v-slot="{ validity, error, value }">
            <span data-testid="out">{{ validity.valid }}|{{ validity.customError }}|{{ error }}|{{ value }}</span>
          </FieldValidity>
        </FieldRoot>
      `,
    }, { props: { validate: () => 'Nope' }, attachTo: document.body })

    // `valid` is `null` until the field has been validated.
    expect(wrapper.find('[data-testid="out"]').text()).toBe('|false||')

    ;(wrapper.vm.$refs.field as { validate: () => boolean }).validate()
    await nextTick()
    expect(wrapper.find('[data-testid="out"]').text()).toBe('false|true|Nope|hello')
  })
})

describe('given a required non-native control that the user has not changed', () => {
  it('does not report valueMissing on blur, but does once validation is forced', async () => {
    const wrapper = mount({
      components: { ...components, SelectRoot, SelectTrigger },
      template: `
        <FieldRoot ref="field" required validation-mode="onBlur" data-testid="field">
          <SelectRoot>
            <SelectTrigger>Choose</SelectTrigger>
          </SelectRoot>
        </FieldRoot>
      `,
    }, { attachTo: document.body })
    const field = wrapper.find('[data-testid="field"]')

    await wrapper.find('[role="combobox"]').trigger('blur')
    expect(field.attributes('data-invalid')).toBeUndefined()

    ;(wrapper.vm.$refs.field as { validate: () => boolean }).validate()
    await nextTick()
    expect(field.attributes('data-invalid')).toBe('')
  })
})

describe('given a control with its own id', () => {
  it('points the label at the FieldControl\'s id', async () => {
    const wrapper = mount({
      components,
      template: `<FieldRoot><FieldLabel>Email</FieldLabel><FieldControl id="custom" /></FieldRoot>`,
    })
    await nextTick()
    expect(wrapper.find('label').attributes('for')).toBe('custom')
  })

  it('points the label at a SelectTrigger\'s id', async () => {
    const wrapper = mount({
      components: { ...components, SelectRoot, SelectTrigger },
      template: `
        <FieldRoot>
          <FieldLabel>Fruit</FieldLabel>
          <SelectRoot><SelectTrigger id="fruit-trigger">Choose</SelectTrigger></SelectRoot>
        </FieldRoot>
      `,
    })
    await nextTick()
    expect(wrapper.find('[role="combobox"]').attributes('id')).toBe('fruit-trigger')
    expect(wrapper.find('label').attributes('for')).toBe('fruit-trigger')
  })

  it('points the label at a DateField\'s hidden input, which moves focus into the segments', async () => {
    const wrapper = mount({
      components: { ...components, DateFieldRoot },
      template: `<FieldRoot><FieldLabel>Date</FieldLabel><DateFieldRoot /></FieldRoot>`,
    })
    await nextTick()
    const target = wrapper.find(`#${wrapper.find('label').attributes('for')}`)
    expect(target.element.tagName).toBe('INPUT')
  })
})

describe('given consumer attributes that change without any field state change', () => {
  it('keeps FieldControl and pilot aria attributes in sync', async () => {
    const wrapper = mount({
      components: { ...components, CheckboxRoot, SelectRoot, SelectTrigger },
      props: ['describedBy'],
      template: `
        <div>
          <FieldRoot><FieldControl :aria-describedby="describedBy" /></FieldRoot>
          <FieldRoot><CheckboxRoot :aria-describedby="describedBy" /></FieldRoot>
          <FieldRoot><SelectRoot><SelectTrigger :aria-describedby="describedBy">Choose</SelectTrigger></SelectRoot></FieldRoot>
        </div>
      `,
    }, { props: { describedBy: 'first' } })

    await wrapper.setProps({ describedBy: 'second' })
    for (const selector of ['input', '[role="checkbox"]', '[role="combobox"]'])
      expect(wrapper.find(selector).attributes('aria-describedby')).toBe('second')
  })
})

// A control mounted with `initial`, then reporting edits, so `dirty` is measured
// against a baseline holding values ohash can't serialize.
const BaselineProbe = defineComponent({
  name: 'BaselineProbe',
  props: { initial: { type: null, default: undefined } },
  setup(props, { expose }) {
    const context = injectFieldRootContext()
    context.registerControl({
      id: () => 'baseline-probe',
      element: () => undefined,
      getValue: () => props.initial,
    })
    expose({ report: (value: unknown) => context.handleControlInput({ value }) })
    return () => null
  },
})

describe('fieldRoot dirty/filled with values ohash cannot serialize', () => {
  const d = (day: number) => Temporal.PlainDate.from({ year: 2024, month: 1, day })
  const file = new File(['x'], 'a.txt')

  // [initial, an edit, a fresh copy of the initial value]
  const cases: Array<[string, unknown, unknown, unknown]> = [
    ['PlainDate', d(1), d(2), d(1)],
    ['PlainDateTime', d(1).toPlainDateTime('10:30'), d(1).toPlainDateTime('10:31'), d(1).toPlainDateTime('10:30')],
    ['ZonedDateTime', d(1).toZonedDateTime('Asia/Tokyo'), d(1).toZonedDateTime('Asia/Seoul'), d(1).toZonedDateTime('Asia/Tokyo')],
    ['PlainTime', Temporal.PlainTime.from('10:30'), Temporal.PlainTime.from('10:31'), Temporal.PlainTime.from('10:30')],
    ['a different Temporal type', d(1), d(1).toPlainDateTime('00:00'), d(1)],
    ['a Temporal array', [d(1), d(2)], [d(1)], [d(1), d(2)]],
    ['a Temporal range', { start: d(1), end: d(2) }, { start: d(1), end: d(3) }, { start: d(1), end: d(2) }],
    ['an object holding Temporal', { meta: { at: d(1) } }, { meta: { at: d(2) } }, { meta: { at: d(1) } }],
    ['a File', file, new File(['x'], 'a.txt'), file],
    ['a File array', [file], [], [file]],
    ['a string, edited to a Temporal value', '2024-01-01', d(1), '2024-01-01'],
    ['a Temporal value, edited to a string', d(1), '2024-01-01', d(1)],
  ]

  it.each(cases)('tracks %s and clears dirty when edited back', async (_, initial, edit, back) => {
    const errors: unknown[] = []
    const wrapper = mount(defineComponent({
      components: { FieldRoot, BaselineProbe },
      setup: () => ({ initial }),
      template: `<FieldRoot data-testid="f"><BaselineProbe :initial="initial" /></FieldRoot>`,
    }), { global: { config: { errorHandler: error => errors.push(error) } } })
    const root = wrapper.find('[data-testid="f"]')
    const report = (wrapper.findComponent(BaselineProbe).vm as any).report

    expect(root.attributes('data-dirty')).toBeUndefined()
    report(edit)
    await nextTick()
    expect(root.attributes('data-dirty')).toBe('')
    report(back)
    await nextTick()
    expect(root.attributes('data-dirty')).toBeUndefined()
    expect(errors).toEqual([])
  })

  const cyclic: Record<string, unknown> = { date: d(1) }
  cyclic.self = cyclic
  let deep: unknown = d(1)
  for (let i = 0; i < 120; i++)
    deep = [deep]

  it.each([
    ['a cycle', cyclic],
    ['a deeply nested array', deep],
    ['an object holding a WeakMap', { map: new WeakMap() }],
  ])('stays clean when the control reports %s unchanged', async (_, value) => {
    const wrapper = mount(defineComponent({
      components: { FieldRoot, BaselineProbe },
      setup: () => ({ value }),
      template: `<FieldRoot data-testid="f"><BaselineProbe :initial="value" /></FieldRoot>`,
    }))
    ;(wrapper.findComponent(BaselineProbe).vm as any).report(value)
    await nextTick()
    expect(wrapper.find('[data-testid="f"]').attributes('data-dirty')).toBeUndefined()
  })

  it.each([[null], [undefined], ['']])('treats %s as the empty baseline of a Temporal edit', async (empty) => {
    const wrapper = mount(defineComponent({
      components: { FieldRoot, BaselineProbe },
      setup: () => ({ empty }),
      template: `<FieldRoot data-testid="f"><BaselineProbe :initial="empty" /></FieldRoot>`,
    }))
    const root = wrapper.find('[data-testid="f"]')
    const report = (wrapper.findComponent(BaselineProbe).vm as any).report

    report(d(1))
    await nextTick()
    expect(root.attributes('data-dirty')).toBe('')
    expect(root.attributes('data-filled')).toBe('')
    report(null)
    await nextTick()
    expect(root.attributes('data-dirty')).toBeUndefined()
    expect(root.attributes('data-filled')).toBeUndefined()
    report(undefined)
    await nextTick()
    expect(root.attributes('data-dirty')).toBeUndefined()
  })

  it.each([
    ['Temporal', d(1)],
    ['File', file],
  ])('a Checkbox with a %s trueValue reports its press', async (_, trueValue) => {
    const errors: unknown[] = []
    const wrapper = mount(defineComponent({
      components: { FieldRoot, CheckboxRoot },
      setup: () => ({ trueValue }),
      template: `<FieldRoot data-testid="f"><CheckboxRoot :true-value="trueValue" :false-value="null" :default-value="null" /></FieldRoot>`,
    }), { attachTo: document.body, global: { config: { errorHandler: error => errors.push(error) } } })
    const root = wrapper.find('[data-testid="f"]')

    await wrapper.find('[role="checkbox"]').trigger('click')
    await nextTick()
    expect(errors).toEqual([])
    expect(wrapper.find('[role="checkbox"]').attributes('data-state')).toBe('checked')
    expect(root.attributes('data-dirty')).toBe('')
    expect(root.attributes('data-filled')).toBe('')
    wrapper.unmount()
  })

  it('a Temporal edit still sets filled and reaches the validator', async () => {
    const validate = vi.fn(() => null)
    const wrapper = mount(defineComponent({
      components: { FieldRoot, BaselineProbe },
      setup: () => ({ validate }),
      template: `<FieldRoot data-testid="f" :validate="validate" validation-mode="onChange"><BaselineProbe /></FieldRoot>`,
    }))
    ;(wrapper.findComponent(BaselineProbe).vm as any).report(d(1))
    await nextTick()
    expect(wrapper.find('[data-testid="f"]').attributes('data-filled')).toBe('')
    expect(validate).toHaveBeenCalled()
  })

  it('a form reset clears dirty and a later edit compares against the same baseline', async () => {
    const wrapper = mount(defineComponent({
      components: { FormRoot, FieldRoot, BaselineProbe },
      setup: () => ({ initial: d(1) }),
      template: `<FormRoot><FieldRoot name="a" data-testid="f"><BaselineProbe :initial="initial" /></FieldRoot></FormRoot>`,
    }), { attachTo: document.body })
    const root = wrapper.find('[data-testid="f"]')
    const report = (wrapper.findComponent(BaselineProbe).vm as any).report

    report(d(2))
    await nextTick()
    expect(root.attributes('data-dirty')).toBe('')

    await fireEvent.reset(wrapper.find('form').element)
    await nextTick()
    expect(root.attributes('data-dirty')).toBeUndefined()

    report(d(3))
    await nextTick()
    expect(root.attributes('data-dirty')).toBe('')
    report(d(1))
    await nextTick()
    expect(root.attributes('data-dirty')).toBeUndefined()
    wrapper.unmount()
  })

  it('a DateField edit sets dirty and clears it when edited back', async () => {
    const errors: unknown[] = []
    const wrapper = mount(defineComponent({
      components: { FieldRoot, DateFieldRoot, DateFieldInput },
      setup: () => ({ value: d(15) }),
      template: `<FieldRoot data-testid="f">
        <DateFieldRoot v-slot="{ segments }" :default-value="value">
          <DateFieldInput v-for="s in segments.filter(s => s.part !== 'literal')" :key="s.part" :part="s.part" :data-segment="s.part">{{ s.value }}</DateFieldInput>
        </DateFieldRoot>
      </FieldRoot>`,
    }), { attachTo: document.body, global: { config: { errorHandler: error => errors.push(error) } } })
    const root = wrapper.find('[data-testid="f"]')
    const month = wrapper.find('[data-segment="month"]')

    await month.trigger('focusin')
    await month.trigger('keydown', { key: 'ArrowUp' })
    await nextTick()
    expect(errors).toEqual([])
    expect(root.attributes('data-dirty')).toBe('')
    expect(root.attributes('data-filled')).toBe('')

    await month.trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(root.attributes('data-dirty')).toBeUndefined()
    expect(root.attributes('data-filled')).toBe('')
    wrapper.unmount()
  })

  it('a multiple Select of Temporal values marks its selection and tracks dirty', async () => {
    const errors: unknown[] = []
    const wrapper = mount(defineComponent({
      components: { FieldRoot, SelectRoot, SelectTrigger, SelectPortal, SelectContent, SelectViewport, SelectItem },
      setup: () => ({ d, initial: [d(1)] }),
      template: `<FieldRoot data-testid="f">
        <SelectRoot multiple :default-value="initial" :default-open="true">
          <SelectTrigger />
          <SelectPortal><SelectContent><SelectViewport>
            <SelectItem :value="d(1)" data-item="1">One</SelectItem>
            <SelectItem :value="d(2)" data-item="2">Two</SelectItem>
          </SelectViewport></SelectContent></SelectPortal>
        </SelectRoot>
      </FieldRoot>`,
    }), { attachTo: document.body, global: { config: { errorHandler: error => errors.push(error) } } })
    await flushPromises()
    expect(errors).toEqual([])
    expect(wrapper.find('[data-testid="f"]').attributes('data-dirty')).toBeUndefined()
    expect(document.querySelector('[data-item="1"]')!.getAttribute('data-state')).toBe('checked')
    expect(document.querySelector('[data-item="2"]')!.getAttribute('data-state')).toBe('unchecked')

    const second = document.querySelector('[data-item="2"]') as HTMLElement
    const press = async () => {
      second.focus()
      await fireEvent.pointerUp(second)
      await nextTick()
    }
    // SelectContentImpl ignores the first, accidental pointerup.
    await fireEvent.pointerUp(second)
    await press()
    expect(wrapper.find('[data-testid="f"]').attributes('data-dirty')).toBe('')
    expect(second.getAttribute('data-state')).toBe('checked')
    await press()
    expect(wrapper.find('[data-testid="f"]').attributes('data-dirty')).toBeUndefined()
    expect(wrapper.find('[data-testid="f"]').attributes('data-filled')).toBe('')
    expect(errors).toEqual([])
    wrapper.unmount()
  })
})
