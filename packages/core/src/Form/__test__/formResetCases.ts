import type { VNode } from 'vue'
import { expect } from 'vitest'
import { userEvent } from 'vitest/browser'
import { h } from 'vue'
import { AutocompleteAnchor, AutocompleteInput, AutocompleteRoot } from '@/Autocomplete'
import { CheckboxGroupRoot, CheckboxRoot } from '@/Checkbox'
import { ColorAreaArea, ColorAreaRoot, ColorAreaThumb } from '@/ColorArea'
import { ColorFieldInput, ColorFieldRoot } from '@/ColorField'
import { ColorSliderRoot, ColorSliderThumb, ColorSliderTrack } from '@/ColorSlider'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxTrigger, ComboboxViewport } from '@/Combobox'
import { DateFieldInput, DateFieldRoot } from '@/DateField'
import { DatePickerField, DatePickerInput, DatePickerRoot } from '@/DatePicker'
import { DateRangeFieldInput, DateRangeFieldRoot } from '@/DateRangeField'
import { DateRangePickerField, DateRangePickerInput, DateRangePickerRoot } from '@/DateRangePicker'
import { EditableArea, EditableInput, EditablePreview, EditableRoot } from '@/Editable'
import { ListboxContent, ListboxItem, ListboxRoot } from '@/Listbox'
import { NumberFieldInput, NumberFieldRoot } from '@/NumberField'
import { PinInputInput, PinInputRoot } from '@/PinInput'
import { RadioGroupItem, RadioGroupRoot } from '@/RadioGroup'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '@/Select'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from '@/Slider'
import { SwitchRoot, SwitchThumb } from '@/Switch'
import { TagsInputInput, TagsInputItem, TagsInputItemText, TagsInputRoot } from '@/TagsInput'
import { TimeFieldInput, TimeFieldRoot } from '@/TimeField'
import { TimeRangeFieldInput, TimeRangeFieldRoot } from '@/TimeRangeField'
import { Toggle } from '@/Toggle'
import { ToggleGroupItem, ToggleGroupRoot } from '@/ToggleGroup'

/** One Reka form control, with a default value and a way to change it as a user does. */
export interface FormResetCase {
  name: string
  /** The control with `props` on its root (`name`, `defaultValue`, `modelValue`, listeners). */
  render: (props: Record<string, unknown>) => VNode
  defaultValue: unknown
  /** What `display` reads while the control shows `defaultValue`. */
  defaultDisplay: string
  /** What the form submits for `name="field"` while the control holds `defaultValue`. */
  defaultData: [string, string][]
  /** Changes the value through the UI. */
  change: (root: HTMLElement) => Promise<void>
  /** What the control shows, read from the DOM (the page, for portalled parts). */
  display: (root: HTMLElement) => string
}

const all = (root: ParentNode, selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector))
const attrs = (root: ParentNode, selector: string, name: string) => all(root, selector).map(el => el.getAttribute(name)).join(',')
const values = (root: ParentNode, selector: string) => all(root, selector).map(el => (el as HTMLInputElement).value).join(',')
const text = (root: ParentNode, selector: string) => all(root, selector).map(el => el.textContent?.trim()).join(',')

async function press(root: HTMLElement, selector: string, key: string) {
  root.querySelector<HTMLElement>(selector)!.focus()
  await userEvent.keyboard(key)
}

async function clickOption(label: string) {
  const option = () => all(document, '[role="option"]').find(el => el.textContent?.trim() === label)
  await expect.poll(option).toBeTruthy()
  await userEvent.click(option()!)
}

const SEGMENT = '[role="spinbutton"]'
const segments = (root: HTMLElement) => text(root, '[data-testid="segment"]').replaceAll(',', '')

const date = new Temporal.PlainDate(2024, 1, 15)
const range = { start: new Temporal.PlainDate(2024, 1, 15), end: new Temporal.PlainDate(2024, 1, 20) }
const time = new Temporal.PlainTime(10, 30)
const timeRange = { start: new Temporal.PlainTime(10, 30), end: new Temporal.PlainTime(11, 45) }

type Segments = { part: string, value: string }[]

export const formResetCases: FormResetCase[] = [
  {
    name: 'Checkbox',
    render: props => h(CheckboxRoot, props),
    defaultValue: true,
    defaultDisplay: 'true',
    defaultData: [['field', 'on']],
    change: root => userEvent.click(root.querySelector('[role="checkbox"]')!),
    display: root => attrs(root, '[role="checkbox"]', 'aria-checked'),
  },
  {
    name: 'CheckboxGroup',
    render: props => h(CheckboxGroupRoot, props, () => ['a', 'b'].map(value => h(CheckboxRoot, { key: value, value }))),
    defaultValue: ['a'],
    defaultDisplay: 'true,false',
    defaultData: [['field[0]', 'a']],
    change: root => userEvent.click(all(root, '[role="checkbox"]')[1]),
    display: root => attrs(root, '[role="checkbox"]', 'aria-checked'),
  },
  {
    name: 'Switch',
    render: props => h(SwitchRoot, props, () => h(SwitchThumb)),
    defaultValue: true,
    defaultDisplay: 'true',
    defaultData: [['field', 'on']],
    change: root => userEvent.click(root.querySelector('[role="switch"]')!),
    display: root => attrs(root, '[role="switch"]', 'aria-checked'),
  },
  {
    name: 'RadioGroup',
    render: props => h(RadioGroupRoot, props, () => ['a', 'b'].map(value => h(RadioGroupItem, { key: value, value }))),
    defaultValue: 'a',
    defaultDisplay: 'true,false',
    defaultData: [['field', 'a']],
    change: root => userEvent.click(all(root, '[role="radio"]')[1]),
    display: root => attrs(root, '[role="radio"]', 'aria-checked'),
  },
  {
    name: 'Toggle',
    render: props => h(Toggle, props, () => 'Bold'),
    defaultValue: true,
    defaultDisplay: 'true',
    defaultData: [['field', 'true']],
    change: root => userEvent.click(root.querySelector('[aria-pressed]')!),
    display: root => attrs(root, '[aria-pressed]', 'aria-pressed'),
  },
  {
    name: 'ToggleGroup',
    render: props => h(ToggleGroupRoot, { type: 'multiple', ...props }, () => ['a', 'b'].map(value => h(ToggleGroupItem, { key: value, value }, () => value))),
    defaultValue: ['a'],
    defaultDisplay: 'true,false',
    defaultData: [['field[0]', 'a']],
    change: root => userEvent.click(all(root, '[aria-pressed]')[1]),
    display: root => attrs(root, '[aria-pressed]', 'aria-pressed'),
  },
  {
    name: 'Slider',
    render: props => h(SliderRoot, props, () => [h(SliderTrack, () => h(SliderRange)), h(SliderThumb)]),
    defaultValue: [50],
    defaultDisplay: '50',
    defaultData: [['field[0]', '50']],
    change: root => press(root, '[role="slider"]', '{ArrowRight}'),
    display: root => attrs(root, '[role="slider"]', 'aria-valuenow'),
  },
  {
    name: 'NumberField',
    render: props => h(NumberFieldRoot, props, () => h(NumberFieldInput)),
    defaultValue: 5,
    defaultDisplay: '5',
    defaultData: [['field', '5']],
    change: root => press(root, 'input:not([aria-hidden])', '{ArrowUp}'),
    display: root => values(root, 'input:not([aria-hidden])'),
  },
  {
    name: 'PinInput',
    render: props => h(PinInputRoot, props, () => [0, 1, 2].map(index => h(PinInputInput, { key: index, index }))),
    defaultValue: ['1', '2', '3'],
    defaultDisplay: '1,2,3',
    defaultData: [['field', '123']],
    change: root => press(root, 'input:not([aria-hidden])', '9'),
    display: root => values(root, 'input:not([aria-hidden])'),
  },
  {
    name: 'TagsInput',
    render: props => h(TagsInputRoot, props, {
      default: ({ modelValue }: { modelValue: string[] }) => [
        ...modelValue.map(tag => h(TagsInputItem, { 'key': tag, 'value': tag, 'data-testid': 'tag' }, () => h(TagsInputItemText))),
        h(TagsInputInput),
      ],
    }),
    defaultValue: ['a'],
    defaultDisplay: 'a',
    defaultData: [['field[0]', 'a']],
    change: async (root) => {
      root.querySelector<HTMLElement>('input:not([aria-hidden])')!.focus()
      await userEvent.keyboard('b{Enter}')
    },
    display: root => text(root, '[data-testid="tag"]'),
  },
  {
    name: 'Select',
    render: props => h(SelectRoot, props, () => [
      h(SelectTrigger, { 'data-testid': 'trigger' }, () => h(SelectValue, { placeholder: 'none' })),
      h(SelectPortal, () => h(SelectContent, () => h(SelectViewport, () =>
        ['a', 'b'].map(value => h(SelectItem, { key: value, value }, () => h(SelectItemText, () => value)))))),
    ]),
    defaultValue: 'a',
    defaultDisplay: 'a',
    defaultData: [['field', 'a']],
    change: async (root) => {
      await userEvent.click(root.querySelector('[data-testid="trigger"]')!)
      await clickOption('b')
    },
    display: root => text(root, '[data-testid="trigger"]'),
  },
  {
    name: 'Combobox',
    render: props => h(ComboboxRoot, props, () => [
      h(ComboboxAnchor, () => [h(ComboboxInput, { displayValue: (value: string) => value ?? '' }), h(ComboboxTrigger, { 'data-testid': 'trigger' }, () => 'Open')]),
      h(ComboboxPortal, () => h(ComboboxContent, () => h(ComboboxViewport, () =>
        ['a', 'b'].map(value => h(ComboboxItem, { key: value, value }, () => value))))),
    ]),
    defaultValue: 'a',
    defaultDisplay: 'a',
    defaultData: [['field', 'a']],
    change: async (root) => {
      await userEvent.click(root.querySelector('[data-testid="trigger"]')!)
      await clickOption('b')
    },
    display: root => values(root, 'input:not([aria-hidden])'),
  },
  {
    name: 'Autocomplete',
    render: props => h(AutocompleteRoot, props, () => h(AutocompleteAnchor, () => h(AutocompleteInput))),
    defaultValue: 'apple',
    defaultDisplay: 'apple',
    defaultData: [['field', 'apple']],
    change: root => userEvent.fill(root.querySelector('input:not([aria-hidden])')!, 'pear'),
    display: root => values(root, 'input:not([aria-hidden])'),
  },
  {
    name: 'Listbox',
    render: props => h(ListboxRoot, props, () => h(ListboxContent, () => ['a', 'b'].map(value => h(ListboxItem, { key: value, value }, () => value)))),
    defaultValue: 'a',
    defaultDisplay: 'true,false',
    defaultData: [['field', 'a']],
    change: root => userEvent.click(all(root, '[role="option"]')[1]),
    display: root => attrs(root, '[role="option"]', 'aria-selected'),
  },
  {
    name: 'Editable',
    render: props => h(EditableRoot, { submitMode: 'enter', placeholder: 'empty', ...props }, () => h(EditableArea, () => [h(EditablePreview, { 'data-testid': 'preview' }), h(EditableInput)])),
    defaultValue: 'hello',
    defaultDisplay: 'hello',
    defaultData: [['field', 'hello']],
    change: async (root) => {
      root.querySelector<HTMLElement>('[data-testid="preview"]')!.focus()
      const input = () => root.querySelector<HTMLInputElement>('input:not([aria-hidden])')
      await expect.poll(() => document.activeElement === input()).toBe(true)
      await userEvent.fill(input()!, 'changed')
      await userEvent.keyboard('{Enter}')
    },
    display: root => text(root, '[data-testid="preview"]'),
  },
  {
    name: 'DateField',
    render: props => h(DateFieldRoot, { locale: 'en-US', ...props }, {
      default: ({ segments }: { segments: Segments }) => segments.map(item => h(DateFieldInput, { 'key': item.part, 'part': item.part as 'day', 'data-testid': 'segment' }, () => item.value)),
    }),
    defaultValue: date,
    defaultDisplay: '1/15/2024',
    defaultData: [['field', '2024-01-15']],
    change: root => press(root, SEGMENT, '{ArrowUp}'),
    display: segments,
  },
  {
    name: 'TimeField',
    render: props => h(TimeFieldRoot, { locale: 'en-US', hourCycle: 24, ...props }, {
      default: ({ segments }: { segments: Segments }) => segments.map(item => h(TimeFieldInput, { 'key': item.part, 'part': item.part as 'hour', 'data-testid': 'segment' }, () => item.value)),
    }),
    defaultValue: time,
    defaultDisplay: '10:30',
    defaultData: [['field', '10:30:00']],
    change: root => press(root, SEGMENT, '{ArrowUp}'),
    display: segments,
  },
  {
    name: 'DateRangeField',
    render: props => h(DateRangeFieldRoot, { locale: 'en-US', ...props }, {
      default: ({ segments }: { segments: { start: Segments, end: Segments } }) => (['start', 'end'] as const).flatMap(type =>
        segments[type].map(item => h(DateRangeFieldInput, { 'key': type + item.part, 'part': item.part as 'day', type, 'data-testid': 'segment' }, () => item.value))),
    }),
    defaultValue: range,
    defaultDisplay: '1/15/20241/20/2024',
    defaultData: [['field', '2024-01-15 - 2024-01-20']],
    change: root => press(root, SEGMENT, '{ArrowUp}'),
    display: segments,
  },
  {
    name: 'TimeRangeField',
    render: props => h(TimeRangeFieldRoot, { locale: 'en-US', hourCycle: 24, ...props }, {
      default: ({ segments }: { segments: { start: Segments, end: Segments } }) => (['start', 'end'] as const).flatMap(type =>
        segments[type].map(item => h(TimeRangeFieldInput, { 'key': type + item.part, 'part': item.part as 'hour', type, 'data-testid': 'segment' }, () => item.value))),
    }),
    defaultValue: timeRange,
    defaultDisplay: '10:3011:45',
    defaultData: [['field', '10:30:00 - 11:45:00']],
    change: root => press(root, SEGMENT, '{ArrowUp}'),
    display: segments,
  },
  {
    name: 'DatePicker',
    render: props => h(DatePickerRoot, { locale: 'en-US', ...props }, () => h(DatePickerField, null, {
      default: ({ segments }: { segments: Segments }) => segments.map(item => h(DatePickerInput, { 'key': item.part, 'part': item.part as 'day', 'data-testid': 'segment' }, () => item.value)),
    })),
    defaultValue: date,
    defaultDisplay: '1/15/2024',
    defaultData: [['field', '2024-01-15']],
    change: root => press(root, SEGMENT, '{ArrowUp}'),
    display: segments,
  },
  {
    name: 'DateRangePicker',
    render: props => h(DateRangePickerRoot, { locale: 'en-US', ...props }, () => h(DateRangePickerField, null, {
      default: ({ segments }: { segments: { start: Segments, end: Segments } }) => (['start', 'end'] as const).flatMap(type =>
        segments[type].map(item => h(DateRangePickerInput, { 'key': type + item.part, 'part': item.part as 'day', type, 'data-testid': 'segment' }, () => item.value))),
    })),
    defaultValue: range,
    defaultDisplay: '1/15/20241/20/2024',
    defaultData: [['field', '2024-01-15 - 2024-01-20']],
    change: root => press(root, SEGMENT, '{ArrowUp}'),
    display: segments,
  },
  {
    name: 'ColorField',
    render: props => h(ColorFieldRoot, props, () => h(ColorFieldInput)),
    defaultValue: '#ff0000',
    defaultDisplay: '#ff0000',
    defaultData: [['field', '#ff0000']],
    change: async (root) => {
      await userEvent.fill(root.querySelector('input:not([aria-hidden])')!, '#00ff00')
      await userEvent.keyboard('{Enter}')
    },
    display: root => values(root, 'input:not([aria-hidden])'),
  },
  {
    name: 'ColorArea',
    render: props => h(ColorAreaRoot, { colorSpace: 'hsl', xChannel: 'saturation', yChannel: 'lightness', ...props }, {
      default: ({ style }: { style: Record<string, string> }) => h(ColorAreaArea, { style: { ...style, position: 'relative', width: '200px', height: '200px' } }, () => h(ColorAreaThumb, { style: { display: 'block', width: '16px', height: '16px' } })),
    }),
    defaultValue: '#ff0000',
    defaultDisplay: '100,50',
    defaultData: [['field', '#ff0000']],
    change: root => press(root, 'input[type="range"]', '{ArrowLeft}'),
    display: root => values(root, 'input[type="range"]'),
  },
  {
    name: 'ColorSlider',
    render: props => h(ColorSliderRoot, { channel: 'hue', ...props }, () => [h(ColorSliderTrack), h(ColorSliderThumb)]),
    defaultValue: '#ff0000',
    defaultDisplay: '0',
    defaultData: [['field', '#ff0000']],
    change: root => press(root, '[role="slider"]', '{ArrowRight}'),
    display: root => attrs(root, '[role="slider"]', 'aria-valuenow'),
  },
]
