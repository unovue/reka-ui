// One entry per fixture in ./fixtures/<Family>.vue.
//   n:      instances mounted in a measured run
//   act:    the representative update, performed on one instance
//   done:   end-state predicate for the update (default: the instance's HTML changed)
//   reset:  undo the update after it was timed (untimed), e.g. close an overlay
//   ref:    reference row (the cost of the wrapper layers, not a component family)
import { nextTick } from 'vue'

export const raf = () => new Promise(r => requestAnimationFrame(() => r()))
export async function doubleRaf() {
  await raf()
  await raf()
}
export const $ = (sel, root = document) => root.querySelector(sel)
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)]

export async function waitFor(cond, what, timeout = 5000) {
  await nextTick()
  const start = performance.now()
  while (!cond()) {
    if (performance.now() - start > timeout)
      throw new Error(`timeout waiting for: ${what}`)
    await raf()
  }
}

// Events are dispatched in the page, so timings don't include Playwright's IPC round trip.
function press(el) {
  const r = el.getBoundingClientRect()
  const base = { bubbles: true, cancelable: true, composed: true, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2, button: 0, view: window }
  const ptr = { ...base, pointerId: 1, pointerType: 'mouse', isPrimary: true }
  el.dispatchEvent(new PointerEvent('pointerdown', { ...ptr, buttons: 1 }))
  el.dispatchEvent(new MouseEvent('mousedown', { ...base, buttons: 1 }))
  el.dispatchEvent(new PointerEvent('pointerup', { ...ptr, buttons: 0 }))
  el.dispatchEvent(new MouseEvent('mouseup', { ...base, buttons: 0 }))
  el.dispatchEvent(new MouseEvent('click', { ...base, buttons: 0, detail: 1 }))
}
function key(el, k) {
  const o = { key: k, code: k.length === 1 ? `Key${k.toUpperCase()}` : k, bubbles: true, cancelable: true, composed: true }
  el.dispatchEvent(new KeyboardEvent('keydown', o))
  el.dispatchEvent(new KeyboardEvent('keyup', o))
}
function hover(el, type) {
  const r = el.getBoundingClientRect()
  el.dispatchEvent(new PointerEvent(type, { bubbles: type !== 'pointerleave' && type !== 'pointerenter', cancelable: true, composed: true, pointerId: 1, pointerType: 'mouse', isPrimary: true, clientX: r.x + 2, clientY: r.y + 2 }))
}
function contextmenu(el) {
  const r = el.getBoundingClientRect()
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, composed: true, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 2, buttons: 2, clientX: r.x + 2, clientY: r.y + 2 }))
  el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, composed: true, button: 2, clientX: r.x + 2, clientY: r.y + 2 }))
}
function typeInto(input, text) {
  input.focus()
  input.value = text
  input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }))
}
function focusKey(el, k) {
  el.focus()
  key(el, k)
}
async function escape() {
  key(document.activeElement ?? document.body, 'Escape')
}

// Overlay: open with `open(inst)`, done when `sel` is in the document; closed (untimed) by Escape.
function overlay(open, sel, close = escape) {
  return {
    act: open,
    done: () => !!$(sel),
    reset: async () => {
      await close()
      await waitFor(() => !$(sel), `${sel} closed`)
    },
  }
}
function hoverOpen(i) {
  const t = $('.trg', i)
  hover(t, 'pointerenter')
  hover(t, 'pointermove')
}
async function hoverClose() {
  hover($('.trg', document), 'pointerleave')
  await escape()
}

export const FAMILIES = {
  Accordion: { n: 300, act: i => press($('button', i)) },
  AlertDialog: { n: 500, ...overlay(i => press($('.trg', i)), '[role="alertdialog"]') },
  AspectRatio: { n: 1000 },
  Autocomplete: { n: 300, ...overlay(i => press($('.trg', i)), '[role="listbox"]') },
  Avatar: { n: 1000 },
  Calendar: { n: 30, act: i => press($('.cal-next', i)) },
  Checkbox: { n: 1000, act: i => press($('button', i)) },
  CheckboxGroup: { n: 300, act: i => press($('button', i)) },
  Collapsible: { n: 1000, act: i => press($('button', i)) },
  ColorArea: { n: 300, act: i => key($('[role="slider"]', i) ?? $('input', i), 'ArrowRight') },
  ColorField: { n: 500, act: i => focusKey($('input', i), 'ArrowUp') },
  ColorSlider: { n: 500, act: i => key($('[role="slider"]', i), 'ArrowRight') },
  ColorSwatch: { n: 1000 },
  ColorSwatchPicker: { n: 200, act: i => press($$('[role="option"], [role="radio"]', i)[1]) },
  Combobox: { n: 300, ...overlay(i => press($('.trg', i)), '[role="listbox"]') },
  ContextMenu: { n: 500, ...overlay(i => contextmenu($('.trg', i)), '[role="menu"]') },
  DateField: { n: 200, act: i => focusKey($('[data-reka-date-field-segment="day"], [data-reka-date-field-segment]:not([data-reka-date-field-segment="literal"])', i), 'ArrowUp') },
  DatePicker: { n: 150, ...overlay(i => press($('.trg', i)), '[role="dialog"]') },
  DateRangeField: { n: 100, act: i => focusKey($('[data-reka-date-field-segment="day"]', i), 'ArrowUp') },
  DateRangePicker: { n: 100, ...overlay(i => press($('.trg', i)), '[role="dialog"]') },
  Dialog: { n: 500, ...overlay(i => press($('.trg', i)), '[role="dialog"]') },
  Drawer: { n: 300, ...overlay(i => press($('.trg', i)), '[role="dialog"]') },
  DropdownMenu: { n: 500, ...overlay(i => press($('.trg', i)), '[role="menu"]') },
  Editable: { n: 500, act: i => press($('.edit', i)) },
  Field: { n: 500, act: i => typeInto($('input', i), 'hello'), done: i => $('input', i).value === 'hello' },
  Form: { n: 200, act: i => typeInto($('input', i), 'hello'), done: i => $('input', i).value === 'hello' },
  HoverCard: { n: 500, ...overlay(hoverOpen, '.hc-content', hoverClose) },
  Label: { n: 1000 },
  Listbox: { n: 300, act: i => press($$('[role="option"]', i)[2]) },
  Menubar: { n: 200, ...overlay(i => press($('.trg', i)), '[role="menu"]') },
  // Scoped to this instance's trigger: content from a previous instance may still be closing.
  NavigationMenu: {
    n: 200,
    act: i => press($('.trg', i)),
    done: i => $('.trg', i).getAttribute('aria-expanded') === 'true',
    reset: async (i) => {
      press($('.trg', i))
      await waitFor(() => $('.trg', i).getAttribute('aria-expanded') === 'false', 'NavigationMenu closed')
    },
  },
  NumberField: { n: 500, act: i => press($('.inc', i)) },
  Pagination: { n: 300, act: i => press($('.next', i)) },
  PinInput: { n: 300, act: i => typeInto($('input', i), '1'), done: i => $('input', i).value === '1' },
  Popover: { n: 500, ...overlay(i => press($('.trg', i)), '.pop-content') },
  Progress: { n: 1000 },
  RadioGroup: { n: 300, act: i => press($$('[role="radio"]', i)[1]) },
  RangeCalendar: { n: 30, act: i => press($('.cal-next', i)) },
  Rating: { n: 300, act: i => press($$('[role="radio"]', i)[3]) },
  ScrollArea: { n: 300 },
  Select: { n: 500, ...overlay(i => press($('.trg', i)), '[role="listbox"]') },
  Separator: { n: 1000 },
  Slider: { n: 500, act: i => key($('[role="slider"]', i), 'ArrowRight') },
  Splitter: { n: 300, act: i => key($('[role="separator"]', i), 'ArrowRight') },
  Stepper: { n: 300, act: i => press($$('button', i)[1]) },
  Switch: { n: 1000, act: i => press($('button', i)) },
  Tabs: { n: 300, act: i => press($$('[role="tab"]', i)[1]) },
  TagGroup: { n: 300, act: i => press($$('[role="row"], [role="option"]', i)[1]) },
  TagsInput: { n: 300, act: i => press($('.del', i)) },
  TimeField: { n: 300, act: i => focusKey($('[data-reka-time-field-segment="hour"], [data-reka-date-field-segment="hour"]', i), 'ArrowUp') },
  // ToastRoot teleports into the shared viewport, so the .ci wrapper is empty: close the first remaining toast.
  Toast: {
    n: 200,
    act: () => {
      window.__toasts = $$('.close').length
      press($('.close'))
    },
    done: () => $$('.close').length < window.__toasts,
  },
  Toggle: { n: 1000, act: i => press($('button', i)) },
  ToggleGroup: { n: 500, act: i => press($$('button', i)[1]) },
  Toolbar: { n: 300, act: i => press($('.tt', i)) },
  Tooltip: { n: 500, ...overlay(hoverOpen, '.tt-content', hoverClose) },
  Tree: { n: 200, act: i => press($$('[role="treeitem"]', i)[0]) },
  Baseline: { n: 1000, ref: true },
  VueComponent: { n: 1000, ref: true },
  Primitive: { n: 1000, ref: true },
  PrimitiveAsChild: { n: 1000, ref: true },
}
