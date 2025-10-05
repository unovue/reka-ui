import type { TimeRangeFieldRootProps } from './TimeRangeFieldRoot.vue'
import type { TimeValue } from '@/shared/date'
import { CalendarDateTime, Time, toZoned } from '@internationalized/date'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { useTestKbd } from '@/shared'
import TimeField from './story/_TimeRangeField.vue'

const time = { start: new Time(9, 15, 29), end: new Time(17, 45, 0) }
const calendarDateTime = {
  start: new CalendarDateTime(2022, 1, 1, 9, 15),
  end: new CalendarDateTime(2022, 1, 1, 17, 45),
}
const zonedDateTime = {
  start: toZoned(calendarDateTime.start, 'America/New_York'),
  end: toZoned(calendarDateTime.end, 'America/New_York'),
}

const kbd = useTestKbd()

function setup(props: { timeRangeFieldProps?: TimeRangeFieldRootProps, emits?: { 'onUpdate:modelValue'?: (data: TimeValue) => void } } = {}) {
  const user = userEvent.setup()
  const returned = render(TimeField, { props })
  const value = returned.getByTestId('value')

  const start = {
    hour: returned.getByTestId('start-hour'),
    minute: returned.getByTestId('start-minute'),
  }

  const end = {
    hour: returned.getByTestId('end-hour'),
    minute: returned.getByTestId('end-minute'),
  }

  const input = returned.getByTestId('input')
  const label = returned.getByTestId('label')

  return { ...returned, user, input, start, end, label, value }
}

it('should pass axe accessibility tests', async () => {
  const { container } = setup()
  expect(await axe(container)).toHaveNoViolations()
})

describe('timeField', async () => {
  it('populates segment with value - `Time`', async () => {
    const { start, end } = setup({
      timeRangeFieldProps: { modelValue: time, locale: 'en-GB' },
    })

    expect(start.hour).toHaveTextContent(String(time.start.hour).padStart(2, '0'))
    expect(end.hour).toHaveTextContent(String(time.end.hour).padStart(2, '0'))
  })

  it('populates segment with value - `CalendarDateTime`', async () => {
    const { start, end } = setup({
      timeRangeFieldProps: { modelValue: calendarDateTime, locale: 'en-GB' },
    })

    expect(start.hour).toHaveTextContent(String(calendarDateTime.start.hour))
    expect(start.minute).toHaveTextContent(String(calendarDateTime.start.minute))
    expect(end.hour).toHaveTextContent(String(calendarDateTime.end.hour).padStart(2, '0'))
    expect(end.minute).toHaveTextContent(String(calendarDateTime.end.minute))
  })

  it('populates segment with value - `ZonedDateTime`', async () => {
    const { start, end, getByTestId } = setup({
      timeRangeFieldProps: { modelValue: zonedDateTime },
    })

    expect(start.hour).toHaveTextContent(String(zonedDateTime.start.hour))
    expect(start.minute).toHaveTextContent(String(zonedDateTime.start.minute))
    expect(end.hour).toHaveTextContent(String(zonedDateTime.end.hour - 12))
    expect(end.minute).toHaveTextContent(String(zonedDateTime.end.minute))
    expect(getByTestId('start-dayPeriod')).toHaveTextContent('AM')
    expect(getByTestId('start-timeZoneName')).toHaveTextContent('EST')
    expect(getByTestId('end-dayPeriod')).toHaveTextContent('PM')
    expect(getByTestId('end-timeZoneName')).toHaveTextContent('EST')
  })
  it('navigates between the fields', async () => {
    const { getByTestId, user } = setup({
      timeRangeFieldProps: { modelValue: time, locale: 'en-GB' },
    })

    const fields = ['start', 'end'] as const
    const segments = ['hour', 'minute'] as const

    await user.click(getByTestId('start-hour'))

    for (const field of fields) {
      for (const segment of segments) {
        if (field === 'start' && segment === 'hour')
          continue
        const seg = getByTestId(`${field}-${segment}`)
        await user.keyboard(kbd.ARROW_RIGHT)
        expect(seg).toHaveFocus()
      }
    }

    await user.click(getByTestId('start-hour'))

    for (const field of fields) {
      for (const segment of segments) {
        if (field === 'start' && segment === 'hour')
          continue
        const seg = getByTestId(`${field}-${segment}`)
        await user.keyboard(kbd.TAB)
        expect(seg).toHaveFocus()
      }
    }
  })

  it('navigates between the fields - right to left', async () => {
    const { getByTestId, user } = setup({
      timeRangeFieldProps: { modelValue: time, locale: 'en-GB' },
    })

    const fields = ['end', 'start'] as const
    const segments = ['minute', 'hour'] as const

    await user.click(getByTestId('end-minute'))

    for (const field of fields) {
      for (const segment of segments) {
        if (field === 'end' && segment === 'minute')
          continue
        const seg = getByTestId(`${field}-${segment}`)
        await user.keyboard(kbd.ARROW_LEFT)
        expect(seg).toHaveFocus()
      }
    }

    await user.click(getByTestId('end-minute'))

    for (const field of fields) {
      for (const segment of segments) {
        if (field === 'end' && segment === 'minute')
          continue
        const seg = getByTestId(`${field}-${segment}`)
        await user.keyboard(kbd.SHIFT_TAB)
        expect(seg).toHaveFocus()
      }
    }
  })

  it('binds to the value', async () => {
    const { start, end, user } = setup({
      timeRangeFieldProps: { modelValue: time, locale: 'en-GB' },
    })
    expect(start.hour).toHaveTextContent(String(time.start.hour))
    expect(end.hour).toHaveTextContent(String(time.end.hour))

    await user.click(start.minute)
    await user.keyboard('2')
    expect(start.minute).toHaveTextContent('2')
    expect(end.minute).toHaveTextContent(String(time.end.minute))
  })
})
