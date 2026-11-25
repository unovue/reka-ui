// How the bridge reads and drives each component family: through the root
// context the component already provides, calling the same functions a
// person's click or keypress calls, so `update:*` emits fire as usual.
import { isEqual } from 'ohash'
import { unref } from 'vue'
import { isDisabledElement, nameOf, textOf, textOrName } from './dom'

/** An item of a list-like component, with its own value. */
export interface Item {
  value: unknown
  label: string
  disabled?: boolean
  el?: HTMLElement
}

export interface Part {
  /** What the element is to the component: `root`, `trigger`, `control`, `content`, `title`, `item`… */
  slot: string
  el: HTMLElement
}

/** What a component registered with: the references it already held. */
export interface Source {
  kind: string
  ctx: any
  props: any
  element?: any
  extra?: any
  /** Items that registered against this component's context. */
  items: Set<{ props: any, element: any }>
  /** A listbox a combobox renders, whose items are the combobox's. */
  inner?: Source
  /** The name of the component that rendered this one, like `AlertDialogRoot`. */
  parentName?: string
  /** The component instance, for the element it rendered when it holds no element ref. */
  instance?: { vnode: { el: unknown } }
  /** A native element, or a native radio group's radios. */
  native?: HTMLElement
  radios?: HTMLInputElement[]
}

export interface Adapter {
  component: (s: Source) => string
  parts: (s: Source) => Part[]
  /** Elements whose insides are the component's own, so the native scan leaves them out. */
  owns: (s: Source) => HTMLElement[]
  /** Popup content: its buttons are the component's, its fields are the page's. */
  content?: (s: Source) => HTMLElement | undefined
  /** The keys a person changes, like `value` or `checked`. */
  keys: string[]
  state: (s: Source) => Record<string, unknown>
  items?: (s: Source) => Item[]
  /** Items exist only while the popup is open, like a combobox's. */
  itemsWhileOpen?: boolean
  /** Text that names no item is refused. */
  closed?: boolean
  disabled: (s: Source) => boolean
  actions: (s: Source) => string[]
  run: (s: Source, action: string, args: unknown[]) => unknown
  /** What it hides while closed: a tab list's other tabs, an accordion's sections, a collapsible. */
  reveals?: boolean
  modal?: (s: Source) => boolean
}

function el(ref: unknown): HTMLElement | undefined {
  const value = unref(ref as any) as any
  if (!value)
    return undefined
  // A component instance forwards its element as `$el`.
  const node = value instanceof Element ? value : value.$el
  return node instanceof HTMLElement ? node : undefined
}
const byId = (id: unknown) => (typeof id === 'string' && id ? document.getElementById(id) ?? undefined : undefined)
function parts(...list: [string, HTMLElement | undefined | null][]) {
  return list.filter((entry): entry is [string, HTMLElement] => !!entry[1]).map(([slot, el]) => ({ slot, el }))
}
function fail(message: string): never {
  throw new Error(message)
}
const same = (a: unknown, b: unknown) => a === b || isEqual(a as any, b as any)
const has = (list: unknown[], value: unknown) => list.some(item => same(item, value))
const toList = (value: unknown) => (Array.isArray(value) ? value : value == null || value === '' ? [] : [value])

function registered(s: Source): Item[] {
  return Array.from(s.items, ({ props, element }) => {
    const node = el(element)
    const trigger = node?.matches('[role=tab], [role=option], [role=radio], button, [aria-controls]') ? node : node?.querySelector<HTMLElement>('[aria-controls], button') ?? node
    return {
      value: props.value,
      label: trigger ? textOrName(trigger) : String(props.value),
      disabled: !!props.disabled || (!!trigger && isDisabledElement(trigger)),
      // The element a person presses for it, like an accordion section's trigger.
      el: trigger,
    }
  })
    .filter(item => item.el?.isConnected)
    .sort((a, b) => (a.el!.compareDocumentPosition(b.el!) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
}

// A list's value by toggling, the way a person picks and unpicks items: `toggle` adds or takes out one.
function toggleTo(current: unknown, target: unknown, multiple: boolean, toggle: (value: unknown) => unknown) {
  if (!multiple) {
    if (target == null || target === '') {
      if (current != null && current !== '')
        toggle(current)
    }
    else if (!same(current, target)) {
      toggle(target)
    }
    return
  }
  const now = toList(current)
  const want = toList(target)
  for (const value of now.filter(value => !has(want, value)))
    toggle(value)
  for (const value of want.filter(value => !has(now, value)))
    toggle(value)
}

const field = (keys: string[], adapter: Omit<Adapter, 'keys'>): Adapter => ({ keys, ...adapter })

// Checkbox, Switch and Toggle: one button that holds a boolean.
function checkable(component: string, key: 'checked' | 'pressed', read: (s: Source) => unknown, flip: (s: Source) => void, disabled: (s: Source) => boolean): Adapter {
  const setter = key === 'checked' ? 'setChecked' : 'setPressed'
  return field([key], {
    component: () => component,
    parts: s => parts(['root', el(s.element)]),
    owns: s => parts(['root', el(s.element)]).map(p => p.el),
    state: s => ({ [key]: read(s) }),
    disabled,
    actions: () => [setter, 'toggle'],
    run: (s, action, [value]) => {
      if (action === 'toggle')
        return flip(s)
      if (action !== setter)
        return fail(`${component} takes ${setter} or toggle, not ${action}.`)
      if (read(s) !== value)
        flip(s)
    },
  })
}

function popup(component: (s: Source) => string, trigger: (s: Source) => HTMLElement | undefined, content: (s: Source) => HTMLElement | undefined, extra: Partial<Adapter> = {}): Adapter {
  return {
    component,
    keys: ['open'],
    parts: s => parts(['trigger', trigger(s)], ['content', content(s)]),
    owns: s => parts(['trigger', trigger(s)]).map(p => p.el),
    content,
    state: s => ({ open: !!unref(s.ctx.open) }),
    disabled: () => false,
    actions: () => ['setOpen', 'press'],
    run: (s, action, [value]) => {
      const open = action === 'open' ? true : action === 'close' ? false : action === 'toggle' ? !unref(s.ctx.open) : value
      if (!['setOpen', 'open', 'close', 'toggle'].includes(action))
        return fail(`takes setOpen, not ${action}.`)
      if (!!unref(s.ctx.open) !== open)
        s.ctx.onOpenChange(open)
    },
    modal: s => !!unref(s.ctx.modal),
    ...extra,
  }
}

const rootOf = (s: Source) => el(s.element) ?? el(s.instance?.vnode.el)

const menuContent = (s: Source) => (unref(s.ctx.open) ? byId(s.ctx.contentId) : undefined)

export const adapters: Record<string, Adapter> = {
  'checkbox': checkable('checkbox', 'checked', s => unref(s.ctx.state), s => s.extra(), s => !!unref(s.ctx.disabled)),
  'switch': checkable('switch', 'checked', s => !!unref(s.ctx.checked), s => s.ctx.toggleCheck(), s => !!unref(s.ctx.disabled)),
  'toggle': checkable('toggle', 'pressed', s => !!unref(s.ctx), (s) => { s.ctx.value = !s.ctx.value }, s => !!s.props.disabled),

  'radio-group': field(['value'], {
    component: () => 'radio-group',
    parts: s => [...parts(['root', el(s.element)]), ...registered(s).map(item => ({ slot: 'item', el: item.el! }))],
    owns: s => parts(['root', el(s.element)]).map(p => p.el),
    state: s => ({ value: unref(s.ctx.modelValue) ?? null, ...(unref(s.ctx.required) && { required: true }) }),
    items: registered,
    closed: true,
    disabled: s => !!unref(s.ctx.disabled),
    actions: () => ['setValue'],
    run: (s, action, [value]) => {
      if (action !== 'setValue')
        return fail(`radio-group takes setValue, not ${action}.`)
      if (!same(unref(s.ctx.modelValue), value))
        s.ctx.changeModelValue(value)
    },
  }),

  'select': field(['value', 'open'], {
    component: () => 'select',
    parts: s => parts(['trigger', el(s.ctx.triggerElement)], ['content', unref(s.ctx.open) ? byId(s.ctx.contentId) : undefined]),
    owns: s => parts(['trigger', el(s.ctx.triggerElement)], ['content', byId(s.ctx.contentId)]).map(p => p.el),
    state: s => ({
      value: unref(s.ctx.modelValue) ?? null,
      open: !!unref(s.ctx.open),
      ...(unref(s.ctx.multiple) && { multiple: true }),
      ...(unref(s.ctx.required) && { required: true }),
    }),
    items: s => Array.from(unref(s.ctx.optionsSet) as Set<{ value: unknown, textContent: string, disabled?: boolean }>, option => ({
      value: option.value,
      label: option.textContent.trim(),
      disabled: !!option.disabled,
    })),
    closed: true,
    disabled: s => !!unref(s.ctx.disabled),
    actions: () => ['setValue', 'setOpen'],
    run: (s, action, [value]) => {
      if (action === 'setValue')
        return toggleTo(unref(s.ctx.modelValue), value, !!unref(s.ctx.multiple), v => s.ctx.onValueChange(v))
      return adapters.popover.run(s, action, [value])
    },
  }),

  'combobox': field(['value', 'open'], {
    component: () => 'combobox',
    parts: s => parts(['root', el(s.element)], ['input', el(s.ctx.inputElement)], ['trigger', el(s.ctx.triggerElement)], ['content', unref(s.ctx.open) ? byId(s.ctx.contentId) : undefined]),
    owns: s => parts(['root', el(s.element)], ['content', byId(s.ctx.contentId)]).map(p => p.el),
    state: s => ({
      value: unref(s.ctx.modelValue) ?? null,
      open: !!unref(s.ctx.open),
      ...(unref(s.ctx.filterSearch) && { query: unref(s.ctx.filterSearch) }),
      ...(unref(s.ctx.multiple) && { multiple: true }),
    }),
    items: s => (s.inner ? registered(s.inner) : []),
    itemsWhileOpen: true,
    closed: true,
    disabled: s => !!unref(s.ctx.disabled),
    actions: () => ['setValue', 'setOpen', 'setQuery', 'clear'],
    run: (s, action, [value]) => {
      if (action === 'setValue') {
        const listbox = s.inner?.ctx
        const pick = (v: unknown) => (listbox ? listbox.onValueChange(v) : (s.ctx.modelValue.value = v))
        return toggleTo(unref(s.ctx.modelValue), value, !!unref(s.ctx.multiple), pick)
      }
      if (action === 'clear') {
        s.ctx.modelValue.value = s.ctx.getClearValue?.() ?? (unref(s.ctx.multiple) ? [] : undefined)
        return
      }
      if (action === 'setQuery') {
        // As typing does: the input's own handler opens the list and filters it.
        const input = el(s.ctx.inputElement) as HTMLInputElement | undefined
        if (!input)
          return fail('combobox has no input to type in.')
        setNativeValue(input, String(value ?? ''))
        return
      }
      return adapters.popover.run(s, action, [value])
    },
  }),

  'listbox': field(['value'], {
    component: () => 'listbox',
    parts: s => [...parts(['root', el(s.element)])],
    owns: s => parts(['root', el(s.element)]).map(p => p.el),
    state: s => ({ value: unref(s.ctx.modelValue) ?? null, ...(unref(s.ctx.multiple) && { multiple: true }) }),
    items: registered,
    closed: true,
    disabled: s => !!unref(s.ctx.disabled),
    actions: s => (unref(s.ctx.multiple) ? ['setValue', 'clear'] : ['setValue']),
    run: (s, action, [value]) => {
      const multiple = !!unref(s.ctx.multiple)
      if (action === 'clear')
        return toggleTo(unref(s.ctx.modelValue), multiple ? [] : undefined, multiple, v => s.ctx.onValueChange(v))
      if (action !== 'setValue')
        return fail(`listbox takes setValue, not ${action}.`)
      return toggleTo(unref(s.ctx.modelValue), value, multiple, v => s.ctx.onValueChange(v))
    },
  }),

  'tabs': field(['value'], {
    component: () => 'tabs',
    parts: s => [...parts(['list', el(s.ctx.tabsList)]), ...registered(s).map(item => ({ slot: 'item', el: item.el! }))],
    owns: s => parts(['list', el(s.ctx.tabsList)]).map(p => p.el),
    state: s => ({ value: unref(s.ctx.modelValue) ?? null }),
    items: registered,
    closed: true,
    reveals: true,
    disabled: () => false,
    actions: () => ['setValue'],
    run: (s, action, [value]) => {
      if (action !== 'setValue' && action !== 'open')
        return fail(`tabs takes setValue, not ${action}.`)
      if (!same(unref(s.ctx.modelValue), value))
        s.ctx.changeModelValue(value)
    },
  }),

  'accordion': field(['value'], {
    component: () => 'accordion',
    parts: s => [...parts(['root', el(s.ctx.parentElement)]), ...registered(s).map(item => ({ slot: 'item', el: item.el! }))],
    owns: s => registered(s).map(item => item.el!),
    state: s => ({ value: unref(s.ctx.modelValue) ?? (unref(s.ctx.isSingle) ? null : []) }),
    items: registered,
    closed: true,
    reveals: true,
    disabled: s => !!unref(s.ctx.disabled),
    actions: s => (unref(s.ctx.isSingle) ? ['setValue', 'open', 'close', 'toggle'] : ['setValue', 'open', 'close', 'toggle', 'openAll', 'closeAll']),
    run: (s, action, [value]) => {
      const single = !!unref(s.ctx.isSingle)
      const current = unref(s.ctx.modelValue)
      const open = toList(current)
      const change = (v: unknown) => s.ctx.changeModelValue(v)
      const all = registered(s).filter(item => !item.disabled).map(item => item.value)
      const closing = (target: unknown) => {
        if (single && !s.ctx.collapsible && has(open, target))
          fail('This accordion keeps one section open: open another instead.')
      }
      switch (action) {
        case 'setValue':
          if (single && (value == null || value === ''))
            closing(current)
          return toggleTo(current, value, !single, change)
        case 'open':
          return has(open, value) ? undefined : change(value)
        case 'close':
          closing(value)
          return has(open, value) ? change(value) : undefined
        case 'toggle':
          if (has(open, value))
            closing(value)
          return change(value)
        case 'openAll':
          return toggleTo(current, all, true, change)
        case 'closeAll':
          return toggleTo(current, [], true, change)
      }
      return fail(`accordion takes setValue, open, close or toggle, not ${action}.`)
    },
  }),

  'collapsible': field(['open'], {
    component: () => 'collapsible',
    parts: s => parts(['root', rootOf(s)], ['trigger', collapsibleTrigger(s)]),
    owns: s => parts(['trigger', collapsibleTrigger(s)]).map(p => p.el),
    state: s => ({ open: !!unref(s.ctx.open) }),
    reveals: true,
    disabled: s => !!unref(s.ctx.disabled),
    actions: () => ['setOpen'],
    run: (s, action, [value]) => {
      const open = action === 'open' ? true : action === 'close' ? false : action === 'toggle' ? !unref(s.ctx.open) : value
      if (!['setOpen', 'open', 'close', 'toggle'].includes(action))
        return fail(`collapsible takes setOpen, not ${action}.`)
      if (!!unref(s.ctx.open) !== open)
        s.ctx.onOpenToggle()
    },
  }),

  'slider': field(['value'], {
    component: () => 'slider',
    parts: s => [...parts(['root', el(s.element)]), ...((unref(s.ctx.thumbElements) ?? []) as HTMLElement[]).map(thumb => ({ slot: 'thumb', el: thumb }))],
    owns: s => parts(['root', el(s.element)]).map(p => p.el),
    state: (s) => {
      const value = [...(unref(s.ctx.currentModelValue) ?? [])] as number[]
      return { value: value.length === 1 ? value[0] : value, min: unref(s.ctx.min), max: unref(s.ctx.max), step: s.props.step ?? 1 }
    },
    disabled: s => !!unref(s.ctx.disabled),
    actions: () => ['setValue', 'increment', 'decrement'],
    run: (s, action, [value]) => {
      const now = [...(unref(s.ctx.currentModelValue) ?? [])] as number[]
      const step = Number(s.props.step ?? 1)
      if (action === 'increment' || action === 'decrement') {
        if (now.length !== 1)
          fail('increment and decrement move a slider with one thumb: use setValue with every thumb\'s value.')
        const next = Math.min(Math.max(now[0] + (action === 'increment' ? step : -step), unref(s.ctx.min)), unref(s.ctx.max))
        return s.extra(next, 0, { commit: true })
      }
      if (action !== 'setValue')
        return fail(`slider takes setValue, not ${action}.`)
      const want = (Array.isArray(value) ? [...value] : [value]) as number[]
      if (want.length !== now.length)
        fail(`slider has ${now.length} thumb${now.length === 1 ? '' : 's'}: give ${now.length === 1 ? 'one number' : `${now.length} numbers`}.`)
      want.sort((a, b) => a - b)
      // Thumbs can't pass each other, so moving every one may take a pass per thumb.
      for (let pass = 0; pass < want.length; pass++) {
        want.forEach((target, index) => s.extra(target, index, { commit: true }))
        if (String(unref(s.ctx.currentModelValue)) === String(want))
          break
      }
    },
  }),

  'number-field': field(['value'], {
    component: () => 'number-field',
    parts: s => parts(['root', el(s.element)], ['input', el(s.ctx.inputEl)]),
    owns: s => parts(['root', el(s.element)]).map(p => p.el),
    state: s => ({
      value: unref(s.ctx.modelValue) ?? null,
      ...(unref(s.ctx.min) != null && { min: unref(s.ctx.min) }),
      ...(unref(s.ctx.max) != null && { max: unref(s.ctx.max) }),
      step: s.props.step ?? 1,
    }),
    disabled: s => !!unref(s.ctx.disabled) || !!unref(s.ctx.readonly),
    actions: () => ['setValue', 'increment', 'decrement', 'clear'],
    run: (s, action, [value]) => {
      if (action === 'increment')
        return s.ctx.handleIncrease()
      if (action === 'decrement')
        return s.ctx.handleDecrease()
      if (action === 'clear')
        return s.ctx.applyInputValue('')
      if (action !== 'setValue')
        return fail(`number-field takes setValue, not ${action}.`)
      s.ctx.modelValue.value = value
    },
  }),

  'toggle-group': field(['value'], {
    component: () => 'toggle-group',
    parts: s => [...parts(['root', el(s.element)]), ...registered(s).map(item => ({ slot: 'item', el: item.el! }))],
    owns: s => parts(['root', el(s.element)]).map(p => p.el),
    state: s => ({ value: unref(s.ctx.modelValue) ?? (unref(s.ctx.isSingle) ? null : []) }),
    items: registered,
    closed: true,
    disabled: s => !!unref(s.ctx.disabled),
    actions: () => ['setValue', 'toggle'],
    run: (s, action, [value]) => {
      if (action === 'toggle')
        return s.ctx.changeModelValue(value)
      if (action !== 'setValue')
        return fail(`toggle-group takes setValue or toggle, not ${action}.`)
      return toggleTo(unref(s.ctx.modelValue), value, !unref(s.ctx.isSingle), v => s.ctx.changeModelValue(v))
    },
  }),

  'tags-input': field(['value'], {
    component: () => 'tags-input',
    parts: s => parts(['root', el(s.element)], ['input', el(s.element)?.querySelector('input')]),
    owns: s => parts(['root', el(s.element)]).map(p => p.el),
    state: s => ({ value: [...(unref(s.ctx.modelValue) ?? [])], ...(unref(s.ctx.max) && { max: unref(s.ctx.max) }) }),
    disabled: s => !!unref(s.ctx.disabled),
    actions: () => ['setValue', 'add', 'remove', 'clear'],
    run: (s, action, [value]) => {
      const tags = () => [...(unref(s.ctx.modelValue) ?? [])] as unknown[]
      const add = (tag: unknown) => {
        if (s.ctx.onAddValue(tag) === false)
          fail(`tags-input refused ${JSON.stringify(tag)}.`)
      }
      const remove = (tag: unknown) => {
        const index = tags().findIndex(other => same(other, tag))
        if (index === -1)
          fail(`tags-input has no tag ${JSON.stringify(tag)}.`)
        s.ctx.onRemoveValue(index)
      }
      switch (action) {
        case 'add':
          return add(value)
        case 'remove':
          return remove(value)
        case 'clear':
          return tags().reverse().forEach(remove)
        case 'setValue': {
          const want = toList(value)
          tags().filter(tag => !has(want, tag)).reverse().forEach(remove)
          want.filter(tag => !has(tags(), tag)).forEach(add)
          return
        }
      }
      return fail(`tags-input takes setValue, add, remove or clear, not ${action}.`)
    },
  }),

  'dialog': popup(
    s => (s.parentName === 'AlertDialogRoot' || el(s.ctx.contentElement)?.getAttribute('role') === 'alertdialog' ? 'alert-dialog' : 'dialog'),
    s => el(s.ctx.triggerElement),
    s => (unref(s.ctx.open) ? el(s.ctx.contentElement) : undefined),
    {
      parts: s => parts(
        ['trigger', el(s.ctx.triggerElement)],
        ['content', unref(s.ctx.open) ? el(s.ctx.contentElement) : undefined],
        ['title', unref(s.ctx.open) ? byId(s.ctx.titleId) : undefined],
        ['description', unref(s.ctx.open) ? byId(s.ctx.descriptionId) : undefined],
      ),
    },
  ),
  'menu': popup(() => 'menu', s => el(s.ctx.triggerElement), menuContent, {
    owns: s => parts(['trigger', el(s.ctx.triggerElement)], ['content', menuContent(s)]).map(p => p.el),
  }),
  'popover': popup(() => 'popover', s => el(s.ctx.triggerElement), menuContent),
}

function collapsibleTrigger(s: Source) {
  const root = rootOf(s)
  const id = s.ctx.contentId
  return (id && root?.querySelector<HTMLElement>(`[aria-controls="${id}"]`)) || root?.querySelector<HTMLElement>('button') || undefined
}

/** Sets a native field's value the way typing does, so `v-model` and listeners hear it. */
export function setNativeValue(input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  const proto = Object.getPrototypeOf(input)
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
  if (setter)
    setter.call(input, value)
  else
    input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

// Native fields and buttons on the page that no component owns.
export const native: Record<string, Adapter> = {
  input: field(['value'], {
    component: s => (s.native!.localName === 'textarea' ? 'textarea' : 'input'),
    parts: s => parts(['control', s.native]),
    owns: () => [],
    state: (s) => {
      const input = s.native as HTMLInputElement
      const out: Record<string, unknown> = { value: input.type === 'number' ? (input.value === '' ? null : input.valueAsNumber) : input.value }
      if (input.type === 'number' && input.min !== '')
        out.min = Number(input.min)
      if (input.type === 'number' && input.max !== '')
        out.max = Number(input.max)
      if (input.placeholder)
        out.placeholder = input.placeholder
      if (input.required)
        out.required = true
      return out
    },
    disabled: s => (s.native as HTMLInputElement).disabled || (s.native as HTMLInputElement).readOnly,
    actions: () => ['setValue', 'clear'],
    run: (s, action, [value]) => {
      if (action === 'clear')
        return setNativeValue(s.native as HTMLInputElement, '')
      if (action !== 'setValue')
        return fail(`input takes setValue or clear, not ${action}.`)
      setNativeValue(s.native as HTMLInputElement, value == null ? '' : String(value))
    },
  }),
  checkbox: field(['checked'], {
    component: () => 'checkbox',
    parts: s => parts(['control', s.native]),
    owns: () => [],
    state: s => ({ checked: (s.native as HTMLInputElement).indeterminate ? 'indeterminate' : (s.native as HTMLInputElement).checked }),
    disabled: s => (s.native as HTMLInputElement).disabled,
    actions: () => ['setChecked', 'toggle'],
    run: (s, action, [value]) => {
      const box = s.native as HTMLInputElement
      if (action === 'toggle' || (action === 'setChecked' && box.checked !== value))
        box.click()
      else if (action !== 'setChecked')
        fail(`checkbox takes setChecked or toggle, not ${action}.`)
    },
  }),
  select: field(['value'], {
    component: () => 'select',
    parts: s => parts(['control', s.native]),
    owns: () => [],
    state: (s) => {
      const select = s.native as HTMLSelectElement
      return select.multiple
        ? { value: Array.from(select.selectedOptions, option => option.value), multiple: true }
        : { value: select.value === '' ? null : select.value }
    },
    items: s => Array.from((s.native as HTMLSelectElement).options, option => ({ value: option.value, label: textOf(option) || option.value, disabled: option.disabled })),
    closed: true,
    disabled: s => (s.native as HTMLSelectElement).disabled,
    actions: () => ['setValue'],
    run: (s, action, [value]) => {
      const select = s.native as HTMLSelectElement
      if (action !== 'setValue')
        return fail(`select takes setValue, not ${action}.`)
      if (select.multiple) {
        const want = toList(value).map(String)
        for (const option of select.options)
          option.selected = want.includes(option.value)
        select.dispatchEvent(new Event('input', { bubbles: true }))
        select.dispatchEvent(new Event('change', { bubbles: true }))
        return
      }
      setNativeValue(select, value == null ? '' : String(value))
    },
  }),
  radio: field(['value'], {
    component: () => 'radio-group',
    parts: s => (s.radios ?? []).map(radio => ({ slot: 'item', el: radio })),
    owns: () => [],
    state: s => ({ value: s.radios?.find(radio => radio.checked)?.value ?? null }),
    items: s => (s.radios ?? []).map(radio => ({ value: radio.value, label: nameOf(radio) || radio.value, disabled: radio.disabled, el: radio })),
    closed: true,
    disabled: s => !!s.radios?.every(radio => radio.disabled),
    actions: () => ['setValue'],
    run: (s, action, [value]) => {
      if (action !== 'setValue')
        return fail(`radio-group takes setValue, not ${action}.`)
      s.radios?.find(radio => radio.value === String(value))?.click()
    },
  }),
  button: field([], {
    component: () => 'button',
    parts: s => parts(['root', s.native]),
    owns: () => [],
    state: () => ({}),
    disabled: s => isDisabledElement(s.native!),
    actions: () => ['press'],
    run: () => fail('A button takes press.'),
  }),
}
