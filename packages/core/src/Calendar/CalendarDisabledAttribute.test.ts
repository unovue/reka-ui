import type { VueWrapper } from '@vue/test-utils'
import type { Component, VNode } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { DatePickerRoot, DatePickerTrigger } from '@/DatePicker'
import { DateRangePickerRoot, DateRangePickerTrigger } from '@/DateRangePicker'
import { RangeCalendarNext, RangeCalendarPrev, RangeCalendarRoot, RangeCalendarViewTrigger } from '@/RangeCalendar'
import { CalendarNext, CalendarPrev, CalendarRoot, CalendarViewTrigger } from '.'

// The date parts that render a `<button>` by default bind `disabled`. Rendered as an element without a
// `disabled` DOM property, an enabled part must not get `disabled="false"`, which `[disabled]` matches (#3327).

const target = { 'data-testid': 'target' }

// A component whose own `disabled` defaults to `true`: it must receive `false` from an enabled part
const DisabledByDefault = defineComponent({
  props: { disabled: { type: Boolean, default: true } },
  setup(props, { slots }) {
    return () => h('div', { 'data-component-disabled': String(props.disabled) }, slots.default?.())
  },
})

interface Case {
  name: string
  render: (disabled: boolean, as: string | Component) => VNode
}

function fromRoot(name: string, root: Component, component: Component, rootProps: Record<string, unknown> = {}): Case {
  return { name, render: (disabled, as) => h(root as any, { ...rootProps, disabled }, () => h(component as any, { ...target, as }, () => 'part')) }
}

// The view trigger is enabled below `maxView`: a day-granularity calendar can drill up.
const cases: Case[] = [
  fromRoot('CalendarPrev', CalendarRoot, CalendarPrev),
  fromRoot('CalendarNext', CalendarRoot, CalendarNext),
  fromRoot('CalendarViewTrigger', CalendarRoot, CalendarViewTrigger),
  fromRoot('RangeCalendarPrev', RangeCalendarRoot, RangeCalendarPrev),
  fromRoot('RangeCalendarNext', RangeCalendarRoot, RangeCalendarNext),
  fromRoot('RangeCalendarViewTrigger', RangeCalendarRoot, RangeCalendarViewTrigger),
  fromRoot('DatePickerTrigger', DatePickerRoot, DatePickerTrigger),
  fromRoot('DateRangePickerTrigger', DateRangePickerRoot, DateRangePickerTrigger),
]

const mounted: VueWrapper[] = []

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
})

function render(c: Case, disabled: boolean, as: string | Component) {
  const wrapper = mount({ render: () => c.render(disabled, as) }, { attachTo: document.body })
  mounted.push(wrapper)
  return document.querySelector('[data-testid="target"]')!
}

describe.each(cases)('$name', (c) => {
  it.each(['div', 'span', 'a'])('omits the disabled attribute when enabled and rendered as %s', (as) => {
    const el = render(c, false, as)
    expect(el.tagName).toBe(as.toUpperCase())
    expect(el.hasAttribute('disabled')).toBe(false)
    expect(el.matches('[disabled]')).toBe(false)
  })

  it('keeps disabled="true" when disabled and rendered as a div', () => {
    expect(render(c, true, 'div').getAttribute('disabled')).toBe('true')
  })

  it('keeps the native disabled state when rendered as a button', () => {
    expect((render(c, false, 'button') as HTMLButtonElement).disabled).toBe(false)
    mounted.splice(0).forEach(wrapper => wrapper.unmount())
    expect((render(c, true, 'button') as HTMLButtonElement).disabled).toBe(true)
  })

  it('passes false to a component given as `as` when enabled', () => {
    expect(render(c, false, DisabledByDefault).getAttribute('data-component-disabled')).toBe('false')
  })
})
