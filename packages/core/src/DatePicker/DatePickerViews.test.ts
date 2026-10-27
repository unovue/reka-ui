import type { DateValue } from '@internationalized/date'
import { CalendarDate } from '@internationalized/date'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { useTestKbd } from '@/shared'
import DatePickerViews from './story/_DatePickerViews.vue'

const kbd = useTestKbd()
const jan20 = new CalendarDate(1980, 1, 20)

describe('datePicker — calendar views', () => {
  it('drills through the views without closing, then closes on a day when closeOnSelect is set', async () => {
    const user = userEvent.setup()
    const onModel = vi.fn()
    const onView = vi.fn()
    const { getByTestId, queryByTestId } = render(DatePickerViews, {
      props: { 'defaultValue': jan20, 'closeOnSelect': true, 'onUpdate:modelValue': onModel, 'onUpdate:view': onView } as any,
    })

    await user.click(getByTestId('trigger'))
    const popover = getByTestId('popover-content')
    expect(popover).toBeVisible()
    expect(getByTestId('view-trigger')).toHaveTextContent('January 1980')

    await user.click(getByTestId('view-trigger'))
    expect(getByTestId('view-month')).toBeInTheDocument()
    expect(onView).toHaveBeenLastCalledWith('month', expect.objectContaining({ reason: 'view-trigger' }))
    expect(popover).toBeVisible()

    await user.click(getByTestId('view-trigger'))
    expect(getByTestId('view-year')).toBeInTheDocument()

    await user.click(getByTestId('year-1985-01-01'))
    expect(getByTestId('view-month')).toBeInTheDocument()
    await user.click(getByTestId('month-1985-06-01'))
    expect(getByTestId('view-day')).toBeInTheDocument()
    expect(queryByTestId('view-month')).toBeNull()
    expect(getByTestId('view-trigger')).toHaveTextContent('June 1985')
    // Drilling is navigation: the model is untouched and the popover stays open.
    expect(onModel).not.toHaveBeenCalled()
    expect(popover).toBeVisible()

    await user.click(getByTestId('day-1985-06-10'))
    expect((onModel.mock.calls.at(-1)![0] as DateValue).toString()).toBe('1985-06-10')
    expect(popover).not.toBeVisible()
  })

  it('reopens on defaultView after the popover closed in another view', async () => {
    const user = userEvent.setup()
    const onView = vi.fn()
    const { getByTestId, findByTestId, queryByTestId } = render(DatePickerViews, {
      props: { 'defaultValue': jan20, 'onUpdate:view': onView } as any,
    })

    await user.click(getByTestId('trigger'))
    const popover = getByTestId('popover-content')
    await user.click(getByTestId('view-trigger'))
    expect(getByTestId('view-month')).toBeInTheDocument()
    await user.keyboard(kbd.ESCAPE)
    expect(popover).not.toBeVisible()

    await user.click(getByTestId('trigger'))
    expect(await findByTestId('view-day')).toBeInTheDocument()
    expect(queryByTestId('view-month')).toBeNull()
    expect(onView).toHaveBeenLastCalledWith('day', expect.objectContaining({ reason: 'imperative-action' }))
  })

  it('accepts a controlled view and maxView', async () => {
    const user = userEvent.setup()
    const { getByTestId, findByTestId, queryByTestId } = render(DatePickerViews, {
      props: { defaultValue: jan20, defaultOpen: true, view: 'month', maxView: 'month' } as any,
    })
    // The portalled content mounts on the next tick.
    expect(await findByTestId('view-month')).toBeInTheDocument()
    expect(await axe(getByTestId('popover-content'))).toHaveNoViolations()
    expect(getByTestId('view-trigger')).toHaveAttribute('disabled')
    await user.click(getByTestId('view-trigger'))
    expect(queryByTestId('view-year')).toBeNull()
  })

  it('emits beforeUpdate:view and honours cancel()', async () => {
    const user = userEvent.setup()
    const onView = vi.fn()
    const cancel = vi.fn((_view: unknown, details: { cancel: () => void }) => details.cancel())
    const { getByTestId, findByTestId, queryByTestId } = render(DatePickerViews, {
      props: { 'defaultValue': jan20, 'defaultOpen': true, 'onBeforeUpdate:view': cancel, 'onUpdate:view': onView } as any,
    })
    expect(await findByTestId('view-day')).toBeInTheDocument()

    await user.click(getByTestId('view-trigger'))
    expect(cancel).toHaveBeenCalledWith('month', expect.objectContaining({ reason: 'view-trigger' }))
    expect(onView).not.toHaveBeenCalled()
    expect(getByTestId('view-day')).toBeInTheDocument()
    expect(queryByTestId('view-month')).toBeNull()
  })
})
