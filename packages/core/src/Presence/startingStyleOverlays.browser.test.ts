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
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '@/Select'
import { TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from '@/Tooltip'

// `Presence` passes `data-starting-style` to the content for the first frame
// only. When it was the content's only fallthrough attr and the content's
// root was a component (the FocusScope / DismissableLayer as-child chain),
// Vue's optimised props update kept it on that root once it went away, so the
// attribute stayed on the element. The content parts now bind their attrs on
// their own element. DropdownMenu's root was never stuck: it stays as a control.
// The contents get no consumer attrs: any other one hid the bug.
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
  ...Object.fromEntries((['item-aligned', 'popper'] as const).map(position => [`Select ${position}`, [() => h(SelectRoot, () => [
    h(SelectTrigger, { class: 'trg' }, () => h(SelectValue, { placeholder: 'Pick' })),
    h(SelectPortal, () => h(SelectContent, { position }, () => h(SelectViewport, () => h(SelectItem, { value: 'a' }, () => h(SelectItemText, () => 'A'))))),
  ]), '[role="listbox"]'] as [() => VNodeChild, string]])),
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
      // Every content the attribute was seen on, so a row where it was never
      // set can't pass as one where it went away.
      const seen = new Set<Element>()
      const observer = new MutationObserver(() => document.querySelectorAll('[data-starting-style]').forEach(el => seen.add(el)))
      observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-starting-style'] })
      const app = createApp(defineComponent({ setup: () => render }))
      app.mount(host)
      try {
        // A click on a tooltip's trigger closes it again.
        const open = name === 'Tooltip' ? userEvent.hover : userEvent.click
        await open(document.querySelector('.trg')!)
        await expect.poll(() => document.querySelector(selector)).not.toBeNull()
        const content = document.querySelector(selector)!
        expect(seen.has(content)).toBe(true)
        await expect.poll(() => content.hasAttribute('data-starting-style')).toBe(false)
        // And it stays off.
        await new Promise(resolve => setTimeout(resolve, 100))
        expect(content.hasAttribute('data-starting-style')).toBe(false)
      }
      finally {
        observer.disconnect()
        app.unmount()
        host.remove()
      }
    })
  }
})
