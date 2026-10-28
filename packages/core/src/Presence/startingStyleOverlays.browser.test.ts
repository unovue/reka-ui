import type { VNodeChild } from 'vue'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { createApp, defineComponent, h } from 'vue'
import { AutocompleteAnchor, AutocompleteContent, AutocompleteInput, AutocompleteItem, AutocompletePortal, AutocompleteRoot, AutocompleteTrigger, AutocompleteViewport } from '@/Autocomplete'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxTrigger, ComboboxViewport } from '@/Combobox'
import { DatePickerContent, DatePickerField, DatePickerRoot, DatePickerTrigger } from '@/DatePicker'
import { DateRangePickerContent, DateRangePickerField, DateRangePickerRoot, DateRangePickerTrigger } from '@/DateRangePicker'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'
import { TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from '@/Tooltip'

// `Presence` passes `data-starting-style` to the content for the first frame
// only. When it was the content's only fallthrough attr and the content's
// root was a component (the FocusScope / DismissableLayer as-child chain),
// Vue's optimised props update kept it on that root once it went away, so the
// attribute stayed on the element. The content parts now bind their attrs on
// their own element. DropdownMenu's root was never stuck: it stays as a control.
const overlays: Record<string, [() => VNodeChild, string]> = {
  Combobox: [() => h(ComboboxRoot, () => [
    h(ComboboxAnchor, () => [h(ComboboxInput, { 'aria-label': 'Fruit' }), h(ComboboxTrigger, { class: 'trg' }, () => 'v')]),
    h(ComboboxPortal, () => h(ComboboxContent, () => h(ComboboxViewport, () => ['A', 'B'].map(o => h(ComboboxItem, { key: o, value: o }, () => o))))),
  ]), '[role="listbox"]'],
  Autocomplete: [() => h(AutocompleteRoot, () => [
    h(AutocompleteAnchor, () => [h(AutocompleteInput, { 'aria-label': 'Fruit' }), h(AutocompleteTrigger, { class: 'trg' }, () => 'v')]),
    h(AutocompletePortal, () => h(AutocompleteContent, () => h(AutocompleteViewport, () => ['A', 'B'].map(o => h(AutocompleteItem, { key: o, value: o }, () => o))))),
  ]), '[role="listbox"]'],
  DatePicker: [() => h(DatePickerRoot, { locale: 'en-US' }, () => [
    h(DatePickerField, () => h(DatePickerTrigger, { class: 'trg' }, () => 'Open')),
    h(DatePickerContent, () => 'Calendar'),
  ]), '[role="dialog"]'],
  DateRangePicker: [() => h(DateRangePickerRoot, { locale: 'en-US' }, () => [
    h(DateRangePickerField, () => h(DateRangePickerTrigger, { class: 'trg' }, () => 'Open')),
    h(DateRangePickerContent, () => 'Calendar'),
  ]), '[role="dialog"]'],
  Tooltip: [() => h(TooltipProvider, { delayDuration: 0 }, () => h(TooltipRoot, () => [
    h(TooltipTrigger, { class: 'trg' }, () => 'Open'),
    h(TooltipPortal, () => h(TooltipContent, () => 'Content')),
  ])), '[data-side]'],
  Popover: [() => h(PopoverRoot, () => [
    h(PopoverTrigger, { class: 'trg' }, () => 'Open'),
    h(PopoverPortal, () => h(PopoverContent, () => 'Content')),
  ]), '[role="dialog"]'],
  DropdownMenu: [() => h(DropdownMenuRoot, () => [
    h(DropdownMenuTrigger, { class: 'trg' }, () => 'Open'),
    h(DropdownMenuPortal, () => h(DropdownMenuContent, () => h(DropdownMenuItem, () => 'Item'))),
  ]), '[role="menu"]'],
}

describe('overlay contents drop data-starting-style after the first frame', () => {
  for (const [name, [render, selector]] of Object.entries(overlays)) {
    it(name, async () => {
      const host = document.createElement('div')
      document.body.append(host)
      const app = createApp(defineComponent({ setup: () => render }))
      app.mount(host)
      try {
        // A click on a tooltip's trigger closes it again.
        const open = name === 'Tooltip' ? userEvent.hover : userEvent.click
        await open(document.querySelector('.trg')!)
        await expect.poll(() => document.querySelector(selector)).not.toBeNull()
        const content = document.querySelector(selector)!
        await expect.poll(() => content.hasAttribute('data-starting-style')).toBe(false)
        // And it stays off.
        await new Promise(resolve => setTimeout(resolve, 100))
        expect(content.hasAttribute('data-starting-style')).toBe(false)
      }
      finally {
        app.unmount()
        host.remove()
      }
    })
  }
})
