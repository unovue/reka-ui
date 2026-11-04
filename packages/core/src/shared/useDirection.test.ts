import type { Direction } from './types'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref, toValue } from 'vue'
import { useAccordion } from '@/Accordion/useAccordion'
import { useCalendar } from '@/Calendar/useCalendar'
import { useColorArea } from '@/ColorArea/useColorArea'
import { useColorSlider } from '@/ColorSlider/useColorSlider'
import { ConfigProvider } from '@/ConfigProvider'
import { useDateField } from '@/DateField/useDateField'
import { useDatePicker } from '@/DatePicker/useDatePicker'
import { useDateRangeField } from '@/DateRangeField/useDateRangeField'
import { useDateRangePicker } from '@/DateRangePicker/useDateRangePicker'
import { useEditable } from '@/Editable/useEditable'
import { useListboxRoot } from '@/Listbox/useListbox'
import { useMenuRoot } from '@/Menu/useMenu'
import { useMenubar } from '@/Menubar/useMenubar'
import { useNavigationMenu } from '@/NavigationMenu/useNavigationMenu'
import { usePinInput } from '@/PinInput/usePinInput'
import { useRadioGroup } from '@/RadioGroup/useRadioGroup'
import { useRangeCalendar } from '@/RangeCalendar/useRangeCalendar'
import { useScrollArea } from '@/ScrollArea/useScrollArea'
import { useSelectRoot } from '@/Select/useSelect'
import { useSlider } from '@/Slider/useSlider'
import { useStepper } from '@/Stepper/useStepper'
import { useTabs } from '@/Tabs/useTabs'
import { useTagGroup } from '@/TagGroup/useTagGroup'
import { useTagsInput } from '@/TagsInput/useTagsInput'
import { useTimeField } from '@/TimeField/useTimeField'
import { useTimeRangeField } from '@/TimeRangeField/useTimeRangeField'
import { useToggleGroup } from '@/ToggleGroup/useToggleGroup'
import { useToolbar } from '@/Toolbar/useToolbar'
import { useTree } from '@/Tree/useTree'
import { resolveDirection, useDirection } from './useDirection'

type DirOption = { dir?: Direction }

const sep5 = new Temporal.PlainDate(2026, 9, 5)

/**
 * Each headless composable, called with only its `dir` option, and how its
 * public return exposes the resolved direction.
 */
const composables: [name: string, read: (opts: DirOption) => () => unknown][] = [
  ['useAccordion', (o) => { const a = useAccordion(o); return () => a.context.direction.value }],
  ['useCalendar', (o) => { const a = useCalendar({ locale: 'en-US', weekStartsOn: 0, defaultPlaceholder: sep5, ...o }); return () => a.root.attrs.value.dir }],
  ['useColorArea', (o) => { const a = useColorArea(o); return () => a.root.attrs.value.dir }],
  ['useColorSlider', (o) => { const a = useColorSlider({ channel: 'red', ...o }); return () => a.context.dir.value }],
  ['useDateField', (o) => { const a = useDateField({ locale: 'en-US', ...o }); return () => a.root.attrs.value.dir }],
  ['useDatePicker', (o) => { const a = useDatePicker({ locale: 'en-US', ...o }); return () => toValue(a.getFieldProps().dir) }],
  ['useDateRangeField', (o) => { const a = useDateRangeField({ locale: 'en-US', ...o }); return () => a.root.attrs.value.dir }],
  ['useDateRangePicker', (o) => { const a = useDateRangePicker({ locale: 'en-US', ...o }); return () => toValue(a.getFieldProps().dir) }],
  ['useEditable', (o) => { const a = useEditable(o); return () => a.root.attrs.value.dir }],
  ['useListboxRoot', (o) => { const a = useListboxRoot(o); return () => a.context.dir.value }],
  ['useMenuRoot', (o) => { const a = useMenuRoot(o); return () => a.menuRootContext.dir.value }],
  ['useMenubar', (o) => { const a = useMenubar(o); return () => a.context.dir.value }],
  ['useNavigationMenu', (o) => { const a = useNavigationMenu(o); return () => a.context.dir.value }],
  ['usePinInput', (o) => { const a = usePinInput(o); return () => a.root.attrs.value.dir }],
  ['useRadioGroup', (o) => { const a = useRadioGroup(o); return () => a.root.attrs.value.dir }],
  ['useRangeCalendar', (o) => { const a = useRangeCalendar({ locale: 'en-US', weekStartsOn: 0, defaultPlaceholder: sep5, ...o }); return () => a.root.attrs.value.dir }],
  ['useScrollArea', (o) => { const a = useScrollArea(o); return () => a.context.dir.value }],
  ['useSelectRoot', (o) => { const a = useSelectRoot(o); return () => a.context.dir.value }],
  ['useSlider', (o) => { const a = useSlider(o); return () => a.root.attrs.value.dir }],
  ['useStepper', (o) => { const a = useStepper(o); return () => a.context.dir.value }],
  ['useTabs', (o) => { const a = useTabs(o); return () => a.context.dir.value }],
  ['useTagGroup', (o) => { const a = useTagGroup(o); return () => a.root.attrs.value.dir }],
  ['useTagsInput', (o) => { const a = useTagsInput(o); return () => a.root.attrs.value.dir }],
  ['useTimeField', (o) => { const a = useTimeField({ locale: 'en-US', ...o }); return () => a.root.attrs.value.dir }],
  ['useTimeRangeField', (o) => { const a = useTimeRangeField({ locale: 'en-US', ...o }); return () => a.root.attrs.value.dir }],
  ['useToggleGroup', (o) => { const a = useToggleGroup(o); return () => a.context.dir?.value }],
  ['useToolbar', (o) => { const a = useToolbar(o); return () => a.context.dir.value }],
  ['useTree', (o) => { const a = useTree({ getKey: (n: { id: string }) => n.id, ...o }); return () => a.context.dir?.value }],
]

function resolveIn(configDir: Direction | undefined, call: () => () => unknown) {
  let read!: () => unknown
  const Child = defineComponent({
    setup() {
      read = call()
      return () => h('div')
    },
  })
  const wrapper = mount(configDir ? h(ConfigProvider, { dir: configDir }, () => h(Child)) : Child)
  const value = read()
  wrapper.unmount()
  return value
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('headless composables read ConfigProvider dir', () => {
  it.each(composables)('%s: inherits rtl from ConfigProvider when dir is omitted', (_, read) => {
    expect(resolveIn('rtl', () => read({}))).toBe('rtl')
  })

  it.each(composables)('%s: its own dir option wins over ConfigProvider', (_, read) => {
    expect(resolveIn('rtl', () => read({ dir: 'ltr' }))).toBe('ltr')
    expect(resolveIn('ltr', () => read({ dir: 'rtl' }))).toBe('rtl')
  })

  it.each(composables)('%s: falls back to ltr without ConfigProvider', (_, read) => {
    expect(resolveIn(undefined, () => read({}))).toBe('ltr')
  })
})

describe('useDirection', () => {
  it('prefers its own value, then ConfigProvider, then ltr', () => {
    const read = (dir?: Direction) => () => {
      const d = useDirection(dir)
      return () => d.value
    }
    expect(resolveIn('rtl', read())).toBe('rtl')
    expect(resolveIn('rtl', read('ltr'))).toBe('ltr')
    expect(resolveIn(undefined, read())).toBe('ltr')
  })

  it('does not warn outside setup', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(useDirection().value).toBe('ltr')
    expect(resolveDirection(undefined).value).toBe('ltr')
    expect(warn).not.toHaveBeenCalled()
  })
})

describe('resolveDirection', () => {
  it('injects nothing when the option already resolves at setup', () => {
    const dir = ref<Direction | undefined>('ltr')
    const resolved = resolveIn('rtl', () => {
      const r = resolveDirection(dir)
      return () => r
    }) as { value: Direction }
    dir.value = undefined
    expect(resolved.value).toBe('ltr')
  })

  it('follows ConfigProvider reactively when the option is empty', async () => {
    const providerDir = ref<Direction>('rtl')
    let resolved!: { value: Direction }
    const Child = defineComponent({
      setup() {
        resolved = resolveDirection(() => undefined)
        return () => h('div', { dir: resolved.value })
      },
    })
    const wrapper = mount(defineComponent(() => () => h(ConfigProvider, { dir: providerDir.value }, () => h(Child))))
    expect(wrapper.find('div').attributes('dir')).toBe('rtl')
    providerDir.value = 'ltr'
    await nextTick()
    expect(resolved.value).toBe('ltr')
    expect(wrapper.find('div').attributes('dir')).toBe('ltr')
    wrapper.unmount()
  })
})
