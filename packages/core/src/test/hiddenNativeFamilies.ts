import { h } from 'vue'
import { CheckboxRoot } from '@/Checkbox'
import { DateFieldInput, DateFieldRoot } from '@/DateField'
import { DateRangeFieldInput, DateRangeFieldRoot } from '@/DateRangeField'
import { PinInputInput, PinInputRoot } from '@/PinInput'
import { SelectContent, SelectItem, SelectItemText, SelectRoot, SelectTrigger, SelectValue } from '@/Select'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from '@/Slider'
import { SwitchRoot, SwitchThumb } from '@/Switch'
import { TimeFieldInput, TimeFieldRoot } from '@/TimeField'
import { TimeRangeFieldInput, TimeRangeFieldRoot } from '@/TimeRangeField'

interface Segment { part: string, value: string }

function segmentsOf(Input: any, segments: Segment[], type?: 'start' | 'end') {
  return segments.map((segment, index) => h(Input, { key: `${type}-${index}`, part: segment.part, type }, () => segment.value))
}

function rangeSegmentsOf(Input: any, segments: { start: Segment[], end: Segment[] }) {
  return [...segmentsOf(Input, segments.start, 'start'), ...segmentsOf(Input, segments.end, 'end')]
}

/** The form field name of every hidden twin in `hiddenNativeFamilies`, in document order. */
export const twinNames = ['field-otp', 'field-birthday', 'field-alarm', 'field-stay', 'field-shift', 'field-agree', 'field-topic', 'field-notify', 'field-price[0]', 'field-price[1]']

export type RequiredFamily = 'otp' | 'birthday' | 'alarm' | 'agree'

/**
 * A form with one of each family that renders a hidden native twin: the ones
 * hidden with an explicit `aria-hidden` (PinInput and the date and time fields),
 * plus a checkbox, select, switch and two-thumb slider.
 *
 * @param required The single family that is required and empty, to fail native validation.
 * @returns A render function for the form.
 */
export function hiddenNativeFamilies(required?: RequiredFamily) {
  return () => h('form', { onSubmit: (event: Event) => event.preventDefault() }, [
    h(PinInputRoot, { name: 'field-otp', required: required === 'otp' }, () => [0, 1].map(index => h(PinInputInput, { key: index, index }))),
    h(DateFieldRoot, { name: 'field-birthday', required: required === 'birthday' }, { default: ({ segments }: any) => segmentsOf(DateFieldInput, segments) }),
    h(TimeFieldRoot, { name: 'field-alarm', required: required === 'alarm' }, { default: ({ segments }: any) => segmentsOf(TimeFieldInput, segments) }),
    h(DateRangeFieldRoot, { name: 'field-stay' }, { default: ({ segments }: any) => rangeSegmentsOf(DateRangeFieldInput, segments) }),
    h(TimeRangeFieldRoot, { name: 'field-shift' }, { default: ({ segments }: any) => rangeSegmentsOf(TimeRangeFieldInput, segments) }),
    h(CheckboxRoot, { 'name': 'field-agree', 'required': required === 'agree', 'aria-label': 'Accept terms' }),
    h(SelectRoot, { name: 'field-topic', defaultValue: 'news' }, () => [
      h(SelectTrigger, { 'aria-label': 'Topic' }, () => h(SelectValue)),
      h(SelectContent, null, () => h(SelectItem, { value: 'news' }, () => h(SelectItemText, null, () => 'News'))),
    ]),
    h(SwitchRoot, { 'name': 'field-notify', 'aria-label': 'Notifications' }, () => h(SwitchThumb)),
    h(SliderRoot, { name: 'field-price', defaultValue: [20, 80] }, () => [
      h(SliderTrack, null, () => h(SliderRange)),
      h(SliderThumb, { 'aria-label': 'Minimum price' }),
      h(SliderThumb, { 'aria-label': 'Maximum price' }),
    ]),
    h('button', { type: 'submit' }, 'Send'),
  ])
}

export function twinsOf(form: HTMLFormElement) {
  return [...form.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input[aria-hidden="true"], select[aria-hidden="true"]')]
}
