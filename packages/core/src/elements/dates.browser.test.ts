import type { RekaElementEvent } from '.'
import type { CalendarGridData, DateValue } from '@/date'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  calendarElements,
  dateFieldElements,
  datePickerElements,
  dateRangeFieldElements,
  dateRangePickerElements,
  defineRekaElements,
  rangeCalendarElements,
  timeFieldElements,
  timeRangeFieldElements,
} from '.'
import { cleanup, query, render, settle } from './elements.test.helpers'

beforeAll(() => {
  defineRekaElements([
    calendarElements,
    rangeCalendarElements,
    dateFieldElements,
    dateRangeFieldElements,
    timeFieldElements,
    timeRangeFieldElements,
    datePickerElements,
    dateRangePickerElements,
  ])
})
afterEach(cleanup)

function track(el: Element, type = 'update-model-value') {
  const values: unknown[] = []
  el.addEventListener(type, event => values.push((event as RekaElementEvent).detail.value))
  return values
}

const iso = (value: unknown) => String(value)

type CalendarSlotProps = { grid: CalendarGridData[], weekDays: string[] }

/**
 * The calendar rendering pattern of the guide: the root's slot props hold the
 * grid, and every new grid (a new page) is rendered into `.grids`. Dates go in
 * as ISO attributes.
 */
function renderGrids(root: HTMLElement & { slotProps?: Record<string, unknown> }, part = 'calendar') {
  let rendered: unknown
  const update = () => {
    const { grid, weekDays } = root.slotProps as CalendarSlotProps
    if (grid === rendered)
      return
    rendered = grid
    root.querySelector('.grids')!.innerHTML = grid.map(month => `
      <reka-${part}-grid value="${month.value}">
        <reka-${part}-grid-head>
          <reka-${part}-grid-row>${weekDays.map(day => `<reka-${part}-head-cell>${day}</reka-${part}-head-cell>`).join('')}</reka-${part}-grid-row>
        </reka-${part}-grid-head>
        <reka-${part}-grid-body>${month.rows.map(row => `
          <reka-${part}-grid-row>${row.map((date: DateValue) => `
            <reka-${part}-cell value="${date}"><reka-${part}-cell-trigger value="${date}">${date.day}</reka-${part}-cell-trigger></reka-${part}-cell>`).join('')}
          </reka-${part}-grid-row>`).join('')}
        </reka-${part}-grid-body>
      </reka-${part}-grid>`).join('')
  }
  root.addEventListener('slot-props-change', update)
  if (root.slotProps)
    update()
}

function cell(date: string, part = 'calendar') {
  return query(`reka-${part}-cell-trigger[value="${date}"]`)
}

const CALENDAR = `
  <reka-calendar-root default-value="2026-10-14" locale="en-US">
    <reka-calendar-header>
      <reka-calendar-prev>‹</reka-calendar-prev>
      <reka-calendar-heading></reka-calendar-heading>
      <reka-calendar-next>›</reka-calendar-next>
    </reka-calendar-header>
    <div class="grids"></div>
  </reka-calendar-root>
`

describe('calendar elements', () => {
  it('exposes the grid as slot props, renders it from them, and wires the grid ARIA', async () => {
    render(CALENDAR)
    const root = query<HTMLElement & { slotProps?: CalendarSlotProps }>('reka-calendar-root')
    renderGrids(root)
    await vi.waitFor(() => expect(cell('2026-10-14').getAttribute('data-selected')).toBe(''))

    const { grid, weekDays } = root.slotProps!
    expect(grid).toHaveLength(1)
    // A month's `value` is the placeholder date within that month.
    expect(iso(grid[0].value)).toBe('2026-10-14')
    expect(weekDays).toEqual(['S', 'M', 'T', 'W', 'T', 'F', 'S'])
    // Read-only: a copy, not the reactive state.
    expect(Object.isFrozen(root.slotProps)).toBe(true)

    const gridEl = query('reka-calendar-grid')
    expect(gridEl.getAttribute('role')).toBe('application')
    // The visually hidden heading the grid is labelled by is inside the root.
    const heading = document.getElementById(gridEl.getAttribute('aria-labelledby')!)!
    expect(root.contains(heading)).toBe(true)
    expect(heading.textContent!.trim()).toBe('Event Date, October 2026')
    // Fallback content is not rendered; the heading text is in its slot props.
    const calendarHeading = query<HTMLElement & { slotProps?: Record<string, unknown> }>('reka-calendar-heading')
    expect(calendarHeading.textContent).toBe('')
    expect(calendarHeading.slotProps!.headingValue).toBe('October 2026')
    expect(query('reka-calendar-grid-row').getAttribute('role')).toBe('row')
    expect(query('reka-calendar-head-cell').getAttribute('role')).toBe('columnheader')
    expect(query('reka-calendar-cell[value="2026-10-14"]').getAttribute('role')).toBe('gridcell')
    expect(query('reka-calendar-cell[value="2026-10-14"]').getAttribute('aria-selected')).toBe('true')
    expect(cell('2026-10-14').getAttribute('aria-label')).toBe('Wednesday, October 14, 2026')
    expect(cell('2026-10-14').getAttribute('tabindex')).toBe('0')
    expect(query('reka-calendar-prev').getAttribute('role')).toBe('button')
  })

  it('selects with a click and the keyboard, and dispatches Temporal values', async () => {
    render(CALENDAR)
    const root = query('reka-calendar-root')
    renderGrids(root)
    await vi.waitFor(() => expect(cell('2026-10-14').getAttribute('tabindex')).toBe('0'))
    const values = track(root)

    await userEvent.click(cell('2026-10-20'))
    expect(cell('2026-10-20').getAttribute('data-selected')).toBe('')
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(cell('2026-10-21'))
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(cell('2026-10-28').getAttribute('data-selected')).toBe('')
    expect(values.map(iso)).toEqual(['2026-10-20', '2026-10-28'])
    expect(values[0]).toBeInstanceOf(Temporal.PlainDate)
  })

  it('pages with the buttons and moves focus into the next page with the keyboard', async () => {
    render(CALENDAR)
    const root = query('reka-calendar-root')
    renderGrids(root)
    await vi.waitFor(() => expect(cell('2026-10-14').getAttribute('tabindex')).toBe('0'))
    const placeholders = track(root, 'update-placeholder')

    await userEvent.click(query('reka-calendar-next'))
    await vi.waitFor(() => expect(query('reka-calendar-grid').getAttribute('value')).toBe('2026-11-14'))
    expect(placeholders.map(iso)).toEqual(['2026-11-01'])

    // Arrow keys past the edge of the page turn it, and focus follows into the
    // re-rendered grid.
    await userEvent.click(cell('2026-11-30'))
    await userEvent.keyboard('{ArrowDown}')
    await vi.waitFor(() => expect(document.activeElement).toBe(cell('2026-12-07')))
    expect(query('reka-calendar-grid').getAttribute('value')).toMatch(/^2026-12-/)
  })

  it('takes Temporal values as properties, and ignores an invalid ISO attribute', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(CALENDAR.replace('default-value="2026-10-14"', 'default-value="2026-13-45"'))
    const root = query<HTMLElement & { modelValue?: DateValue }>('reka-calendar-root')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('default-value="2026-13-45" is not a valid ISO 8601 date'))
    warn.mockRestore()
    root.modelValue = Temporal.PlainDate.from('2027-02-03')
    renderGrids(root)
    await vi.waitFor(() => expect(cell('2027-02-03').getAttribute('data-selected')).toBe(''))
  })
})

describe('range calendar elements', () => {
  it('selects a range, from an ISO interval attribute and by clicking', async () => {
    render(`
      <reka-range-calendar-root default-value="2026-10-05/2026-10-07" locale="en-US">
        <div class="grids"></div>
      </reka-range-calendar-root>
    `)
    const root = query('reka-range-calendar-root')
    renderGrids(root, 'range-calendar')
    await vi.waitFor(() => expect(cell('2026-10-06', 'range-calendar').getAttribute('data-selected')).toBe(''))
    expect(cell('2026-10-05', 'range-calendar').getAttribute('data-selection-start')).toBe('')
    expect(cell('2026-10-07', 'range-calendar').getAttribute('data-selection-end')).toBe('')
    const values = track(root)

    await userEvent.click(cell('2026-10-12', 'range-calendar'))
    await userEvent.click(cell('2026-10-15', 'range-calendar'))
    await vi.waitFor(() => expect(values.length).toBeGreaterThan(0))
    const last = values.at(-1) as { start: DateValue, end: DateValue }
    expect([iso(last.start), iso(last.end)]).toEqual(['2026-10-12', '2026-10-15'])
    expect(cell('2026-10-13', 'range-calendar').getAttribute('data-selected')).toBe('')
  })
})

/** The date field rendering pattern of the guide: one input element per segment of the slot props. */
function renderSegments(root: HTMLElement & { slotProps?: Record<string, unknown> }, part = 'date-field') {
  const update = () => {
    const segments = root.slotProps!.segments as { part: string, value: string }[]
    const inputs = root.querySelectorAll(`reka-${part}-input`)
    // Same segments: update their text only, so the focused one stays.
    if (inputs.length === segments.length && segments.every((segment, i) => inputs[i].getAttribute('part') === segment.part)) {
      segments.forEach((segment, i) => inputs[i].textContent = segment.value)
      return
    }
    root.replaceChildren(...segments.map((segment) => {
      const input = document.createElement(`reka-${part}-input`)
      input.setAttribute('part', segment.part)
      input.textContent = segment.value
      return input
    }))
  }
  root.addEventListener('slot-props-change', update)
  if (root.slotProps)
    update()
}

describe('date field elements', () => {
  const FIELD = `
    <form onsubmit="return false">
      <reka-date-field-root name="birthday" default-value="2026-10-14" locale="en-US" aria-label="Birthday"></reka-date-field-root>
    </form>
  `

  function segment(part: string, scope: ParentNode = document) {
    return scope.querySelector<HTMLElement>(`[data-reka-date-field-segment="${part}"]`)!
  }

  it('renders its segments from the slot props as a spinbutton group', async () => {
    render(FIELD)
    const root = query('reka-date-field-root')
    renderSegments(root)
    await vi.waitFor(() => expect(segment('month')?.getAttribute('aria-valuenow')).toBe('10'))
    expect(root.getAttribute('role')).toBe('group')
    expect(Array.from(root.children, child => child.textContent)).toEqual(['10', '/', '14', '/', '2026'])
    expect(segment('day').getAttribute('role')).toBe('spinbutton')
    expect(segment('day').getAttribute('contenteditable')).toBe('true')
  })

  it('edits segment by segment from the keyboard, dispatches the date and submits it', async () => {
    const container = render(FIELD)
    const root = query('reka-date-field-root')
    renderSegments(root)
    await vi.waitFor(() => expect(segment('month')?.getAttribute('aria-valuenow')).toBe('10'))
    const form = container.querySelector('form')!
    await vi.waitFor(() => expect(new FormData(form).get('birthday')).toBe('2026-10-14'))
    const values = track(root)

    await userEvent.click(segment('month'))
    await userEvent.keyboard('{ArrowUp}')
    expect(segment('month').getAttribute('aria-valuenow')).toBe('11')
    expect(segment('month').textContent).toBe('11')
    // Arrow keys move between segments; typing a full value moves on by itself.
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(segment('day'))
    await userEvent.keyboard('03')
    expect(segment('day').getAttribute('aria-valuenow')).toBe('3')
    expect(document.activeElement).toBe(segment('year'))
    await userEvent.keyboard('{ArrowLeft}{ArrowDown}')
    expect(segment('day').getAttribute('aria-valuenow')).toBe('2')
    expect(values.map(iso)).toEqual(['2026-11-14', '2026-11-03', '2026-11-02'])
    await vi.waitFor(() => expect(new FormData(form).get('birthday')).toBe('2026-11-02'))

    // Clearing a segment leaves the date incomplete: nothing to submit.
    await userEvent.keyboard('{Backspace}{Backspace}')
    await vi.waitFor(() => expect(new FormData(form).get('birthday')).toBe(''))
    form.reset()
    await vi.waitFor(() => expect(segment('day')?.textContent).toBe('14'))
  })

  it('is invalid while required and empty', async () => {
    const container = render(`<form><reka-date-field-root name="d" required locale="en-US" aria-label="Date"></reka-date-field-root></form>`)
    const root = query('reka-date-field-root')
    renderSegments(root)
    await vi.waitFor(() => expect(segment('month')).not.toBeNull())
    const form = container.querySelector('form')!
    await vi.waitFor(() => expect(form.checkValidity()).toBe(false))
    expect(root.matches(':invalid')).toBe(true)
  })

  it('works inside a shadow root', async () => {
    const host = render('<div></div>').firstElementChild!
    const shadow = host.attachShadow({ mode: 'open' })
    shadow.innerHTML = `<reka-date-field-root default-value="2026-10-14" locale="en-US" aria-label="Date"></reka-date-field-root>`
    const root = shadow.querySelector<HTMLElement>('reka-date-field-root')!
    renderSegments(root)
    await vi.waitFor(() => expect(segment('month', shadow)?.getAttribute('aria-valuenow')).toBe('10'))
    await userEvent.click(segment('month', shadow))
    await userEvent.keyboard('{ArrowRight}{ArrowUp}')
    expect(shadow.activeElement).toBe(segment('day', shadow))
    expect(segment('day', shadow).getAttribute('aria-valuenow')).toBe('15')
  })
})

describe('time field elements', () => {
  it('edits hours and minutes from the keyboard, from an ISO time attribute', async () => {
    const container = render(`
      <form><reka-time-field-root name="alarm" default-value="09:30" locale="en-US" aria-label="Alarm"></reka-time-field-root></form>
    `)
    const root = query('reka-time-field-root')
    renderSegments(root, 'time-field')
    const hour = () => query('[data-reka-time-field-segment="hour"]')
    await vi.waitFor(() => expect(hour().getAttribute('aria-valuenow')).toBe('9'))
    const values = track(root)

    await userEvent.click(hour())
    await userEvent.keyboard('{ArrowUp}{ArrowRight}{ArrowDown}')
    expect(query('[data-reka-time-field-segment="minute"]').getAttribute('aria-valuenow')).toBe('29')
    expect(values.map(iso)).toEqual(['10:30:00', '10:29:00'])
    expect(values[0]).toBeInstanceOf(Temporal.PlainTime)
    await vi.waitFor(() => expect(new FormData(container.querySelector('form')!).get('alarm')).toBe('10:29:00'))
  })
})

describe('range field elements', () => {
  it('a date range field renders `start` and `end` segments and edits them', async () => {
    const container = render(`<form><reka-date-range-field-root name="trip" default-value="2026-10-05/2026-10-07" locale="en-US" aria-label="Trip"></reka-date-range-field-root></form>`)
    const root = query<HTMLElement & { slotProps?: Record<string, unknown> }>('reka-date-range-field-root')
    const update = () => {
      const segments = root.slotProps!.segments as Record<'start' | 'end', { part: string, value: string }[]>
      root.innerHTML = (['start', 'end'] as const).map(type => segments[type].map(segment =>
        `<reka-date-range-field-input type="${type}" part="${segment.part}">${segment.value}</reka-date-range-field-input>`).join('')).join(' – ')
    }
    root.addEventListener('slot-props-change', () => {
      if (!root.querySelector('reka-date-range-field-input'))
        update()
    })
    if (root.slotProps)
      update()
    const day = (type: string) => query(`reka-date-range-field-input[type="${type}"][part="day"]`)
    await vi.waitFor(() => expect(day('end').getAttribute('aria-valuenow')).toBe('7'))
    const values = track(root)

    await userEvent.click(day('end'))
    await userEvent.keyboard('{ArrowUp}')
    const last = values.at(-1) as { start: DateValue, end: DateValue }
    expect([iso(last.start), iso(last.end)]).toEqual(['2026-10-05', '2026-10-08'])
    // One field, in the Vue component's format.
    await vi.waitFor(() => expect([...new FormData(container.querySelector('form')!)]).toEqual([['trip', '2026-10-05 - 2026-10-08']]))
  })

  it('a time range field reads an ISO interval of times', async () => {
    render(`<reka-time-range-field-root default-value="09:00/17:30" locale="en-US" aria-label="Hours"></reka-time-range-field-root>`)
    const root = query<HTMLElement & { slotProps?: Record<string, unknown> }>('reka-time-range-field-root')
    await vi.waitFor(() => expect(root.slotProps).toBeDefined())
    const segments = root.slotProps!.segments as Record<'start' | 'end', { part: string, value: string }[]>
    expect(segments.end.filter(segment => segment.part !== 'literal').map(segment => segment.value)).toEqual(['5', '30', 'PM'])
  })
})

describe('date picker elements', () => {
  const PICKER = `
    <form onsubmit="return false">
      <reka-date-picker-root name="due" default-value="2026-10-14" locale="en-US">
        <reka-date-picker-field aria-label="Due date">
          <span class="segments"></span>
          <reka-date-picker-trigger aria-label="Open calendar">📅</reka-date-picker-trigger>
        </reka-date-picker-field>
        <reka-date-picker-content style="display: block; width: 300px">
          <reka-date-picker-arrow></reka-date-picker-arrow>
          <reka-date-picker-calendar>
            <reka-date-picker-header>
              <reka-date-picker-prev>‹</reka-date-picker-prev>
              <reka-date-picker-heading></reka-date-picker-heading>
              <reka-date-picker-next>›</reka-date-picker-next>
            </reka-date-picker-header>
            <div class="grids"></div>
          </reka-date-picker-calendar>
        </reka-date-picker-content>
      </reka-date-picker-root>
    </form>
  `

  function renderPickerSegments(field: HTMLElement & { slotProps?: Record<string, unknown> }) {
    const update = () => {
      const segments = field.slotProps!.segments as { part: string, value: string }[]
      field.querySelector('.segments')!.innerHTML = segments
        .map(segment => `<reka-date-picker-input part="${segment.part}">${segment.value}</reka-date-picker-input>`)
        .join('')
    }
    field.addEventListener('slot-props-change', update)
    if (field.slotProps)
      update()
  }

  it('opens the calendar from the trigger, selects a date into the field, and submits it', async () => {
    const container = render(PICKER)
    const root = query('reka-date-picker-root')
    const field = query('reka-date-picker-field')
    const trigger = query('reka-date-picker-trigger')
    renderPickerSegments(field)
    await vi.waitFor(() => expect(query('[data-reka-date-field-segment="day"]').getAttribute('aria-valuenow')).toBe('14'))
    expect(trigger.getAttribute('role')).toBe('button')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    const form = container.querySelector('form')!
    await vi.waitFor(() => expect(new FormData(form).get('due')).toBe('2026-10-14'))
    const values = track(root)

    await userEvent.click(trigger)
    const content = query('reka-date-picker-content')
    await vi.waitFor(() => expect(content.getAttribute('data-state')).toBe('open'))
    expect(content.getAttribute('role')).toBe('dialog')
    expect(trigger.getAttribute('aria-controls')).toBe(content.id)
    // Portaled to the body, inside the popper wrapper.
    expect(content.parentElement!.parentElement).toBe(document.body)
    renderGrids(query('reka-date-picker-calendar'), 'date-picker')
    // The grid is rendered after the content opened, so focusing the selected
    // date is up to the page (see the guide).
    await vi.waitFor(() => expect(cell('2026-10-14', 'date-picker').getAttribute('data-selected')).toBe(''))
    cell('2026-10-14', 'date-picker').focus()
    expect(query('reka-date-picker-arrow svg')).toBeTruthy()

    await userEvent.keyboard('{ArrowRight}{Enter}')
    expect(values.map(iso)).toEqual(['2026-10-15'])
    await vi.waitFor(() => expect(query('[data-reka-date-field-segment="day"]').textContent).toBe('15'))
    await vi.waitFor(() => expect(new FormData(form).get('due')).toBe('2026-10-15'))

    await userEvent.keyboard('{Escape}')
    await vi.waitFor(() => expect(content.hasAttribute('data-reka-unmounted')).toBe(true))
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })
})

describe('date range picker elements', () => {
  it('selects a range in its calendar', async () => {
    render(`
      <reka-date-range-picker-root default-value="2026-10-05/2026-10-07" locale="en-US" default-open>
        <reka-date-range-picker-field aria-label="Trip"><reka-date-range-picker-trigger aria-label="Open">📅</reka-date-range-picker-trigger></reka-date-range-picker-field>
        <reka-date-range-picker-content style="display: block">
          <reka-date-range-picker-calendar><div class="grids"></div></reka-date-range-picker-calendar>
        </reka-date-range-picker-content>
      </reka-date-range-picker-root>
    `)
    const root = query('reka-date-range-picker-root')
    renderGrids(query('reka-date-range-picker-calendar'), 'date-range-picker')
    await vi.waitFor(() => expect(cell('2026-10-06', 'date-range-picker').getAttribute('data-selected')).toBe(''))
    const values = track(root)

    // From the keyboard: the popper sits wherever the floating layer puts it.
    cell('2026-10-20', 'date-range-picker').focus()
    await userEvent.keyboard('{Enter}{ArrowRight}{ArrowRight}{Enter}')
    await vi.waitFor(() => expect(values.length).toBeGreaterThan(0))
    const last = values.at(-1) as { start: DateValue, end: DateValue }
    expect([iso(last.start), iso(last.end)]).toEqual(['2026-10-20', '2026-10-22'])
  })
})

describe('calendar elements: calendars and pages', () => {
  it('renders cells of another calendar system from the values their dates print', async () => {
    const warn = vi.spyOn(console, 'warn')
    render(`<reka-calendar-root locale="ja-JP-u-ca-japanese"><div class="grids"></div></reka-calendar-root>`)
    const root = query<HTMLElement & { modelValue?: DateValue, slotProps?: Record<string, unknown> }>('reka-calendar-root')
    root.modelValue = Temporal.PlainDate.from('2026-10-14').withCalendar('japanese')
    renderGrids(root)
    const trigger = () => query('reka-calendar-cell-trigger[value="2026-10-14[u-ca=japanese]"]')
    await vi.waitFor(() => expect(trigger().hasAttribute('data-selected')).toBe(true))
    expect(warn.mock.calls.filter(call => String(call[0]).includes('not a valid ISO 8601'))).toEqual([])
    warn.mockRestore()
  })

  it('marks the days outside each month of a two-month page, with one tab stop', async () => {
    render(`<reka-calendar-root default-value="2026-10-31" number-of-months="2" locale="en-US"><div class="grids"></div></reka-calendar-root>`)
    renderGrids(query('reka-calendar-root'))
    await vi.waitFor(() => expect(document.querySelectorAll('reka-calendar-grid')).toHaveLength(2))
    await vi.waitFor(() => expect(cell('2026-09-27').hasAttribute('data-outside-view')).toBe(true))
    // Oct 31 is in both pages (October's last week, November's first).
    expect(document.querySelectorAll('reka-calendar-cell-trigger[tabindex="0"]')).toHaveLength(1)
  })
})

describe('date field elements: state', () => {
  it('restores its form state as a Temporal value', async () => {
    const errors: unknown[] = []
    const error = vi.spyOn(console, 'error').mockImplementation((...args) => errors.push(args))
    render(`<form><reka-date-field-root name="d" default-value="2026-10-14" locale="en-US" aria-label="Date"></reka-date-field-root></form>`)
    type Field = HTMLElement & { slotProps?: Record<string, any>, formStateRestoreCallback: (state: unknown, mode: string) => void }
    const root = query<Field>('reka-date-field-root')
    renderSegments(root)
    const month = () => query('[data-reka-date-field-segment="month"]')
    await vi.waitFor(() => expect(month().getAttribute('aria-valuenow')).toBe('10'))
    await userEvent.click(month())
    await userEvent.keyboard('{ArrowUp}')
    // The state the browser hands back on a restore (history navigation, autofill).
    const state = (root as unknown as { _binding: { lifecycle: { formState: () => string } } })._binding.lifecycle.formState()
    expect(state).toBe('"2026-11-14"')
    root.formStateRestoreCallback(state, 'restore')
    await settle()
    expect(errors).toEqual([])
    error.mockRestore()
    expect(root.slotProps!.modelValue).toBeInstanceOf(Temporal.PlainDate)
    expect(String(root.slotProps!.modelValue)).toBe('2026-11-14')
  })

  it('renders a field that already rendered, with the guide\'s snippet', async () => {
    render(`<reka-date-field-root default-value="2026-10-14" locale="en-US" aria-label="Date"></reka-date-field-root>`)
    // --- the guide's snippet ---
    const field = document.querySelector('reka-date-field-root') as HTMLElement & { slotProps?: Record<string, any> }

    function renderFieldSegments() {
      const { segments } = field.slotProps!
      const inputs = field.querySelectorAll('reka-date-field-input')
      if (inputs.length === segments.length && segments.every((s: any, i: number) => inputs[i].getAttribute('part') === s.part)) {
        segments.forEach((s: any, i: number) => (inputs[i].textContent = s.value))
        return
      }
      field.replaceChildren(...segments.map((s: any) => {
        const input = document.createElement('reka-date-field-input')
        input.setAttribute('part', s.part)
        input.textContent = s.value
        return input
      }))
    }

    field.addEventListener('slot-props-change', renderFieldSegments)
    if (field.slotProps)
      renderFieldSegments()
    // --- end ---
    await vi.waitFor(() => expect(query('[data-reka-date-field-segment="day"]').getAttribute('aria-valuenow')).toBe('14'))
  })
})

describe('date picker elements: reset and reopen', () => {
  const PICKER = `
    <form onsubmit="return false">
      <reka-date-picker-root name="due" default-value="2026-10-14" locale="en-US">
        <reka-date-picker-field aria-label="Due date">
          <span class="segments"></span>
          <reka-date-picker-trigger aria-label="Open calendar">T</reka-date-picker-trigger>
        </reka-date-picker-field>
        <reka-date-picker-content style="display: block; width: 300px">
          <reka-date-picker-calendar><div class="grids"></div></reka-date-picker-calendar>
        </reka-date-picker-content>
      </reka-date-picker-root>
    </form>`

  it('resets with its form', async () => {
    const container = render(PICKER)
    const form = container.querySelector('form')!
    const field = query<HTMLElement & { slotProps?: Record<string, any> }>('reka-date-picker-field')
    const update = () => {
      field.querySelector('.segments')!.innerHTML = field.slotProps!.segments
        .map((s: any) => `<reka-date-picker-input part="${s.part}">${s.value}</reka-date-picker-input>`)
        .join('')
    }
    field.addEventListener('slot-props-change', update)
    if (field.slotProps)
      update()
    const day = () => query('[data-reka-date-field-segment="day"]')
    await vi.waitFor(() => expect(day().getAttribute('aria-valuenow')).toBe('14'))
    await userEvent.click(day())
    await userEvent.keyboard('{ArrowUp}')
    await vi.waitFor(() => expect(new FormData(form).get('due')).toBe('2026-10-15'))
    form.reset()
    await vi.waitFor(() => expect(day().getAttribute('aria-valuenow')).toBe('14'))
    await vi.waitFor(() => expect(new FormData(form).get('due')).toBe('2026-10-14'))
  })

  it('has no slot props while closed, and renders its grid again when reopened', async () => {
    render(PICKER)
    const trigger = query('reka-date-picker-trigger')
    const calendar = query<HTMLElement & { slotProps?: Record<string, unknown> }>('reka-date-picker-calendar')
    renderGrids(calendar, 'date-picker')
    const selected = () => document.querySelector('reka-date-picker-cell-trigger[value="2026-10-14"]')
    await userEvent.click(trigger)
    await vi.waitFor(() => expect(selected()?.getAttribute('data-selected')).toBe(''))
    await userEvent.keyboard('{Escape}')
    await vi.waitFor(() => expect(query('reka-date-picker-content').hasAttribute('data-reka-unmounted')).toBe(true))
    expect(calendar.slotProps).toBeUndefined()
    await userEvent.click(trigger)
    await vi.waitFor(() => expect(selected()?.getAttribute('data-selected')).toBe(''))
    expect(calendar.slotProps).toBeDefined()
  })
})
