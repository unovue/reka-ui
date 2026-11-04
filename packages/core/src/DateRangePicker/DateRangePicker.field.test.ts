import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { FieldLabel, FieldRoot } from '@/Field'
import { FormRoot } from '@/Form'
import {
  DateRangePickerCalendar,
  DateRangePickerCell,
  DateRangePickerCellTrigger,
  DateRangePickerContent,
  DateRangePickerField,
  DateRangePickerGrid,
  DateRangePickerGridBody,
  DateRangePickerGridRow,
  DateRangePickerInput,
  DateRangePickerRoot,
  DateRangePickerTrigger,
} from '.'

const Harness = defineComponent({
  components: { FormRoot, FieldRoot, FieldLabel, DateRangePickerRoot, DateRangePickerField, DateRangePickerInput, DateRangePickerTrigger, DateRangePickerContent, DateRangePickerCalendar, DateRangePickerGrid, DateRangePickerGridBody, DateRangePickerGridRow, DateRangePickerCell, DateRangePickerCellTrigger },
  props: { onFormSubmit: Function, fieldProps: Object },
  setup: () => ({ placeholder: Temporal.PlainDate.from('2024-01-10') }),
  template: `
    <FormRoot @form-submit="(values) => onFormSubmit?.(values)">
      <FieldRoot name="stay" data-testid="field" v-bind="fieldProps">
        <FieldLabel>Stay</FieldLabel>
        <DateRangePickerRoot :default-placeholder="placeholder" locale="en-US">
          <DateRangePickerField v-slot="{ segments }">
            <template v-for="type in ['start', 'end']" :key="type">
              <DateRangePickerInput v-for="item in segments[type]" :key="type + item.part" :type="type" :part="item.part" :data-segment="type + '-' + item.part">{{ item.value }}</DateRangePickerInput>
            </template>
            <DateRangePickerTrigger data-testid="trigger">Open</DateRangePickerTrigger>
          </DateRangePickerField>
          <DateRangePickerContent>
            <DateRangePickerCalendar v-slot="{ grid }">
              <DateRangePickerGrid v-for="month in grid" :key="month.value.toString()" :value="month.value">
                <DateRangePickerGridBody>
                  <DateRangePickerGridRow v-for="(week, index) in month.rows" :key="index">
                    <DateRangePickerCell v-for="day in week" :key="day.toString()" :value="day">
                      <DateRangePickerCellTrigger :value="day" :data-testid="'day-' + day.toString()" />
                    </DateRangePickerCell>
                  </DateRangePickerGridRow>
                </DateRangePickerGridBody>
              </DateRangePickerGrid>
            </DateRangePickerCalendar>
          </DateRangePickerContent>
        </DateRangePickerRoot>
      </FieldRoot>
      <button type="submit">Submit</button>
    </FormRoot>
  `,
})

const RejectingHarness = defineComponent({
  components: { FormRoot, FieldRoot, FieldLabel, DateRangePickerRoot, DateRangePickerField, DateRangePickerInput, DateRangePickerTrigger, DateRangePickerContent, DateRangePickerCalendar, DateRangePickerGrid, DateRangePickerGridBody, DateRangePickerGridRow, DateRangePickerCell, DateRangePickerCellTrigger },
  props: { model: null, onFormSubmit: Function, fieldProps: Object },
  setup: () => ({ placeholder: Temporal.PlainDate.from('2024-01-10') }),
  template: `
    <FormRoot @form-submit="(values) => onFormSubmit?.(values)">
      <FieldRoot name="stay" data-testid="field" v-bind="fieldProps">
        <FieldLabel>Stay</FieldLabel>
        <DateRangePickerRoot :model-value="model" @update:model-value="() => {}" :default-placeholder="placeholder" locale="en-US">
          <DateRangePickerField v-slot="{ segments }">
            <template v-for="type in ['start', 'end']" :key="type">
              <DateRangePickerInput v-for="item in segments[type]" :key="type + item.part" :type="type" :part="item.part" :data-segment="type + '-' + item.part">{{ item.value }}</DateRangePickerInput>
            </template>
            <DateRangePickerTrigger data-testid="trigger">Open</DateRangePickerTrigger>
          </DateRangePickerField>
          <DateRangePickerContent>
            <DateRangePickerCalendar v-slot="{ grid }">
              <DateRangePickerGrid v-for="month in grid" :key="month.value.toString()" :value="month.value">
                <DateRangePickerGridBody>
                  <DateRangePickerGridRow v-for="(week, index) in month.rows" :key="index">
                    <DateRangePickerCell v-for="day in week" :key="day.toString()" :value="day">
                      <DateRangePickerCellTrigger :value="day" :data-testid="'day-' + day.toString()" />
                    </DateRangePickerCell>
                  </DateRangePickerGridRow>
                </DateRangePickerGridBody>
              </DateRangePickerGrid>
            </DateRangePickerCalendar>
          </DateRangePickerContent>
        </DateRangePickerRoot>
      </FieldRoot>
      <button type="submit">Submit</button>
    </FormRoot>
  `,
})

describe('given a Field-wrapped DateRangePicker', () => {
  it('labels the field\'s range group and points the label at its hidden input', async () => {
    const { container, getByText } = render(Harness)
    await nextTick()
    const label = getByText('Stay')
    const group = container.querySelector('[role="group"]')!
    expect(group.getAttribute('aria-labelledby')).toContain(label.id)
    const target = container.querySelector(`#${label.getAttribute('for')}`)!
    expect(target.tagName).toBe('INPUT')
    expect(target.getAttribute('name')).toBe('stay')
    ;(target as HTMLElement).focus()
    expect(document.activeElement).toBe(container.querySelector('[data-segment="start-month"]'))
  })

  it('collects the range once, and treats a calendar pick as user input', async () => {
    const onFormSubmit = vi.fn()
    const validate = vi.fn()
    const user = userEvent.setup()
    const { getByTestId, getByText } = render(Harness, { props: { onFormSubmit, fieldProps: { validate, validationMode: 'onChange' } } })
    await nextTick()
    await user.click(getByTestId('trigger'))
    await user.click(getByTestId('day-2024-01-15'))
    await user.click(getByTestId('day-2024-01-18'))
    await flushPromises()
    expect(getByTestId('field').getAttribute('data-dirty')).toBe('')
    expect(getByTestId('field').getAttribute('data-filled')).toBe('')
    const validated = validate.mock.calls.map(call => `${call[0].start} - ${call[0].end}`)
    expect(validated.at(-1)).toBe('2024-01-15 - 2024-01-18')
    expect(new Set(validated).size).toBe(validated.length)
    await user.click(getByText('Submit'))
    expect(onFormSubmit).toHaveBeenCalledTimes(1)
    const values = onFormSubmit.mock.calls[0][0]
    expect(Object.keys(values)).toEqual(['stay'])
    expect(`${values.stay.start} - ${values.stay.end}`).toBe('2024-01-15 - 2024-01-18')
  })

  it('stays untouched while focus moves into the calendar, and is touched once it leaves both', async () => {
    const validate = vi.fn()
    const user = userEvent.setup()
    const { getByTestId, container } = render(Harness, { props: { fieldProps: { validate, validationMode: 'onBlur' } } })
    await nextTick()
    const field = getByTestId('field')
    await user.click(container.querySelector('[data-segment="start-month"]')!)
    await user.click(getByTestId('trigger'))
    await flushPromises()
    expect(document.querySelector('[role="dialog"]')!.contains(document.activeElement)).toBe(true)
    expect(field.getAttribute('data-focused')).toBe('')
    expect(field.getAttribute('data-touched')).toBeNull()

    await user.click(getByTestId('day-2024-01-15'))
    await user.click(getByTestId('day-2024-01-18'))
    await flushPromises()
    expect(field.getAttribute('data-touched')).toBeNull()
    expect(validate).not.toHaveBeenCalled()

    // Escape closes the calendar and returns focus to the trigger.
    await user.keyboard('{Escape}')
    await flushPromises()
    expect(document.activeElement).toBe(getByTestId('trigger'))
    expect(field.getAttribute('data-touched')).toBeNull()

    await user.click(document.body)
    await flushPromises()
    expect(field.getAttribute('data-focused')).toBeNull()
    expect(field.getAttribute('data-touched')).toBe('')
    expect(validate).toHaveBeenCalledTimes(1)
  })
})

describe('given a Field-wrapped DateRangePicker whose parent rejects a change', () => {
  it('doesn\'t count a later parent-driven change to that value as user input', async () => {
    const user = userEvent.setup()
    const { getByTestId, rerender } = render(RejectingHarness, { props: { model: null } })
    await nextTick()
    await user.click(getByTestId('trigger'))
    await user.click(getByTestId('day-2024-01-15'))
    await user.click(getByTestId('day-2024-01-18'))
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve))
    await rerender({ model: { start: Temporal.PlainDate.from('2024-01-15'), end: Temporal.PlainDate.from('2024-01-18') } })
    await flushPromises()
    expect(getByTestId('field').getAttribute('data-filled')).toBe('')
    expect(getByTestId('field').getAttribute('data-dirty')).toBeNull()
  })
})
