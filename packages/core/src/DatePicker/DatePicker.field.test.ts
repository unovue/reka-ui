import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { FieldLabel, FieldRoot } from '@/Field'
import { FormRoot } from '@/Form'
import {
  DatePickerCalendar,
  DatePickerCell,
  DatePickerCellTrigger,
  DatePickerContent,
  DatePickerField,
  DatePickerGrid,
  DatePickerGridBody,
  DatePickerGridRow,
  DatePickerInput,
  DatePickerRoot,
  DatePickerTrigger,
} from '.'

const Harness = defineComponent({
  components: { FormRoot, FieldRoot, FieldLabel, DatePickerRoot, DatePickerField, DatePickerInput, DatePickerTrigger, DatePickerContent, DatePickerCalendar, DatePickerGrid, DatePickerGridBody, DatePickerGridRow, DatePickerCell, DatePickerCellTrigger },
  props: { onFormSubmit: Function, fieldProps: Object, closeOnSelect: Boolean },
  setup: () => ({ placeholder: Temporal.PlainDate.from('2024-01-10') }),
  template: `
    <FormRoot @form-submit="(values) => onFormSubmit?.(values)">
      <FieldRoot name="date" data-testid="field" v-bind="fieldProps">
        <FieldLabel>Date</FieldLabel>
        <DatePickerRoot :default-placeholder="placeholder" locale="en-US" :close-on-select="closeOnSelect">
          <DatePickerField v-slot="{ segments }">
            <DatePickerInput v-for="item in segments" :key="item.part" :part="item.part" :data-segment="item.part">{{ item.value }}</DatePickerInput>
            <DatePickerTrigger data-testid="trigger">Open</DatePickerTrigger>
          </DatePickerField>
          <DatePickerContent>
            <DatePickerCalendar v-slot="{ grid }">
              <DatePickerGrid v-for="month in grid" :key="month.value.toString()" :value="month.value">
                <DatePickerGridBody>
                  <DatePickerGridRow v-for="(week, index) in month.rows" :key="index">
                    <DatePickerCell v-for="day in week" :key="day.toString()" :value="day">
                      <DatePickerCellTrigger :value="day" :data-testid="'day-' + day.toString()" />
                    </DatePickerCell>
                  </DatePickerGridRow>
                </DatePickerGridBody>
              </DatePickerGrid>
            </DatePickerCalendar>
          </DatePickerContent>
        </DatePickerRoot>
      </FieldRoot>
      <button type="submit">Submit</button>
    </FormRoot>
  `,
})

describe('given a Field-wrapped DatePicker', () => {
  it('treats typing in the segments as user input, reported once', async () => {
    const user = userEvent.setup()
    const validate = vi.fn()
    const { getByTestId, container } = render(Harness, { props: { fieldProps: { validate, validationMode: 'onChange' } } })
    await nextTick()
    await user.click(container.querySelector('[data-segment="month"]')!)
    await user.keyboard('01152024')
    await flushPromises()
    expect(getByTestId('field').getAttribute('data-dirty')).toBe('')
    // Once per change (each year digit is one), never twice for the same one.
    const values = validate.mock.calls.map(call => String(call[0]))
    expect(values.at(-1)).toBe('2024-01-15')
    expect(new Set(values).size).toBe(values.length)
  })

  it('labels the field\'s date group and points the label at its hidden input', async () => {
    const { container, getByText } = render(Harness)
    await nextTick()
    const label = getByText('Date')
    const group = container.querySelector('[role="group"]')!
    expect(group.getAttribute('aria-labelledby')).toContain(label.id)
    const target = container.querySelector(`#${label.getAttribute('for')}`)!
    expect(target.tagName).toBe('INPUT')
    expect(target.getAttribute('name')).toBe('date')
    ;(target as HTMLElement).focus()
    expect(document.activeElement).toBe(container.querySelector('[data-segment="month"]'))
  })

  it.each([false, true])('collects the value once, and treats a calendar pick as user input (closeOnSelect: %s)', async (closeOnSelect) => {
    const onFormSubmit = vi.fn()
    const user = userEvent.setup()
    const validate = vi.fn()
    const { getByTestId, getByText } = render(Harness, { props: { onFormSubmit, closeOnSelect, fieldProps: { validate, validationMode: 'onChange' } } })
    await nextTick()
    await user.click(getByTestId('trigger'))
    await user.click(getByTestId('day-2024-01-15'))
    await flushPromises()
    expect(getByTestId('field').getAttribute('data-dirty')).toBe('')
    expect(getByTestId('field').getAttribute('data-filled')).toBe('')
    expect(validate).toHaveBeenCalledTimes(1)
    await user.click(getByText('Submit'))
    expect(onFormSubmit).toHaveBeenCalledTimes(1)
    const values = onFormSubmit.mock.calls[0][0]
    expect(Object.keys(values)).toEqual(['date'])
    expect(String(values.date)).toBe('2024-01-15')
  })

  it('stays untouched while focus moves into the calendar, and is touched once it leaves both', async () => {
    const user = userEvent.setup()
    const validate = vi.fn()
    const { getByTestId, container } = render(Harness, { props: { fieldProps: { validate, validationMode: 'onBlur' } } })
    await nextTick()
    const field = getByTestId('field')
    await user.click(container.querySelector('[data-segment="month"]')!)
    await user.click(getByTestId('trigger'))
    await flushPromises()
    const content = document.querySelector('[role="dialog"]')!
    expect(content.contains(document.activeElement)).toBe(true)
    expect(field.getAttribute('data-focused')).toBe('')
    expect(field.getAttribute('data-touched')).toBeNull()
    expect(validate).not.toHaveBeenCalled()

    // Back to the segments, then into the calendar again: still one focus.
    await user.click(container.querySelector('[data-segment="day"]')!)
    await flushPromises()
    expect(field.getAttribute('data-touched')).toBeNull()

    await user.click(getByTestId('trigger'))
    await flushPromises()
    await user.click(getByTestId('day-2024-01-15'))
    await flushPromises()
    expect(field.getAttribute('data-touched')).toBeNull()
    expect(validate).not.toHaveBeenCalled()

    await user.click(document.body)
    await flushPromises()
    expect(field.getAttribute('data-focused')).toBeNull()
    expect(field.getAttribute('data-touched')).toBe('')
    expect(validate).toHaveBeenCalledTimes(1)
  })

  it('is touched when focus leaves the open calendar for outside the picker', async () => {
    const user = userEvent.setup()
    const { getByTestId } = render(Harness)
    await nextTick()
    const field = getByTestId('field')
    await user.click(getByTestId('trigger'))
    await flushPromises()
    const content = document.querySelector('[role="dialog"]')!
    expect(content.contains(document.activeElement)).toBe(true)
    expect(field.getAttribute('data-touched')).toBeNull()

    await user.click(document.body)
    await flushPromises()
    expect(field.getAttribute('data-focused')).toBeNull()
    expect(field.getAttribute('data-touched')).toBe('')
  })
})

describe('given a Field-wrapped DatePicker whose trigger is outside the date field', () => {
  const SiblingTrigger = defineComponent({
    components: { FieldRoot, DatePickerRoot, DatePickerField, DatePickerInput, DatePickerTrigger, DatePickerContent, DatePickerCalendar, DatePickerGrid, DatePickerGridBody, DatePickerGridRow, DatePickerCell, DatePickerCellTrigger },
    props: { fieldProps: Object },
    setup: () => ({ placeholder: Temporal.PlainDate.from('2024-01-10') }),
    template: `
      <div>
        <FieldRoot name="date" data-testid="field" v-bind="fieldProps">
          <DatePickerRoot :default-placeholder="placeholder" locale="en-US" close-on-select>
            <DatePickerField v-slot="{ segments }">
              <DatePickerInput v-for="item in segments" :key="item.part" :part="item.part" :data-segment="item.part">{{ item.value }}</DatePickerInput>
            </DatePickerField>
            <DatePickerTrigger data-testid="trigger">Open</DatePickerTrigger>
            <DatePickerContent>
              <DatePickerCalendar v-slot="{ grid }">
                <DatePickerGrid v-for="month in grid" :key="month.value.toString()" :value="month.value">
                  <DatePickerGridBody>
                    <DatePickerGridRow v-for="(week, index) in month.rows" :key="index">
                      <DatePickerCell v-for="day in week" :key="day.toString()" :value="day">
                        <DatePickerCellTrigger :value="day" :data-testid="'day-' + day.toString()" />
                      </DatePickerCell>
                    </DatePickerGridRow>
                  </DatePickerGridBody>
                </DatePickerGrid>
              </DatePickerCalendar>
            </DatePickerContent>
          </DatePickerRoot>
        </FieldRoot>
        <button data-testid="outside">Outside</button>
      </div>
    `,
  })

  it('is focused from the trigger, and touched once focus leaves the trigger and calendar', async () => {
    const user = userEvent.setup()
    const validate = vi.fn()
    const { getByTestId } = render(SiblingTrigger, { props: { fieldProps: { validate, validationMode: 'onBlur' } } })
    await nextTick()
    const field = getByTestId('field')
    await user.click(getByTestId('trigger'))
    await flushPromises()
    expect(field.getAttribute('data-focused')).toBe('')
    await user.click(getByTestId('day-2024-01-15'))
    await flushPromises()
    expect(field.getAttribute('data-touched')).toBeNull()
    expect(validate).not.toHaveBeenCalled()

    await user.click(getByTestId('outside'))
    await flushPromises()
    expect(field.getAttribute('data-focused')).toBeNull()
    expect(field.getAttribute('data-touched')).toBe('')
    expect(validate).toHaveBeenCalledTimes(1)
    expect(String(validate.mock.calls[0][0])).toBe('2024-01-15')
  })
})
