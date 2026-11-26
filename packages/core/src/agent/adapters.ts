// How the bridge reads and drives each component family: through the root
// context the component already provides, calling the same functions a
// person's click or keypress calls, so `update:*` emits fire as usual.
import { isEqual } from 'ohash'
import { nextTick, unref } from 'vue'
import { clamp, snapValueToStep } from '@/shared/clamp'
import { confirmOf, fold, hiddenFromAll, isDisabledElement, isOffLimits, nameOf, textOf, textOrName } from './dom'

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
  /** Items that registered against this component's context, and with `part`, the controls its actions stand for. */
  items: Set<{ props: any, element: any, part?: string, instance?: { vnode: { el: unknown } } }>
  /** A listbox a combobox renders, whose items are the combobox's. */
  inner?: Source
  /** The name of the component that rendered this one, like `AlertDialogRoot`. */
  parentName?: string
  /** The component instance, for the element it rendered when it holds no element ref. */
  instance?: { vnode: { el: unknown }, type?: unknown }
  /** Values of items seen inside `data-agent-hidden`, kept for a list whose items show only while it's open. */
  hiddenSeen?: unknown[]
  /** The `data-agent-confirm` sentence each item had when last seen, by its value, for items not on the page now. */
  marksSeen?: Map<string, string>
  /** Every item value seen rendered, so an item off the page now is known to have had no mark then. */
  valuesSeen?: Set<string>
  /** A native element, or a native radio group's radios. */
  native?: HTMLElement
  radios?: HTMLInputElement[]
}

export interface Adapter {
  /** Always private, like a PIN's boxes, whatever marks are around it. */
  secret?: true
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
  /** `guard` runs before each later toggle of one change, and throws to stop it, like a mark that needs a person. */
  run: (s: Source, action: string, args: unknown[], guard?: (value: unknown) => void) => unknown
  /**
   * The controls an action does the work of, like a number field's increment button for `increment`:
   * the action is held to their marks, so a marked, hidden or disabled button can't be gone around.
   */
  actionParts?: (s: Source, action: string, args: unknown[]) => HTMLElement[]
  /** What it hides while closed: a tab list's other tabs, an accordion's sections, a collapsible. */
  reveals?: boolean
  /** Runs once the component registers, like a closed select asked to keep its items rendered. */
  prepare?: (s: Source) => void
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
interface VNodeLike { el?: unknown, component?: { subTree?: VNodeLike } | null, children?: unknown, suspense?: { activeBranch?: VNodeLike } | null }

// Whether Vue rendered `target` as part of the component, through child components, slots and portals.
function renders(node: VNodeLike | null | undefined, target: Element, depth = 0): boolean {
  if (!node || depth > 500)
    return false
  if (node.el === target)
    return true
  if (node.component)
    return renders(node.component.subTree, target, depth + 1)
  if (node.suspense)
    return renders(node.suspense.activeBranch, target, depth + 1)
  return Array.isArray(node.children) && node.children.some(child => typeof child === 'object' && renders(child as VNodeLike, target, depth + 1))
}

/**
 * The element with a component's id, only when the component rendered it: page content can carry any id,
 * like HTML a user wrote, and an element that only shares the id is never taken for the component's part.
 */
function byId(s: Source, id: unknown) {
  if (typeof id !== 'string' || !id)
    return undefined
  const tree = (s.instance as { subTree?: VNodeLike } | undefined)?.subTree
  // Compared, not put in a selector: an id can hold any character, a newline included.
  for (const node of document.querySelectorAll<HTMLElement>('[id]')) {
    if (node.id === id && renders(tree, node))
      return node
  }
  return undefined
}
function parts(...list: [string, HTMLElement | undefined | null][]) {
  return list.filter((entry): entry is [string, HTMLElement] => !!entry[1]).map(([slot, el]) => ({ slot, el }))
}
function fail(message: string): never {
  throw new Error(message)
}
const same = (a: unknown, b: unknown) => a === b || isEqual(a as any, b as any)
const has = (list: unknown[], value: unknown) => list.some(item => same(item, value))
const toList = (value: unknown) => (Array.isArray(value) ? value : value == null || value === '' ? [] : [value])

/** Whether a value names an item of the list that is off-limits, like one inside `data-agent-hidden`. */
export function hiddenItem(s: Source, value: unknown) {
  for (const { props, element, part } of [...s.items, ...(s.inner?.items ?? [])]) {
    const node = el(element)
    if (!part && node && itemOff(node, s) && (same(unref(props.value), value) || (typeof value === 'string' && fold(node.textContent ?? '') === fold(value))))
      return true
  }
  return false
}

/**
 * Whether an item is one an agent mustn't see: inside `data-agent-hidden`, hidden from everyone with `hidden`
 * or `aria-hidden`, the same rule a component is held to, or in a list content the app marked hidden.
 */
export function itemOff(el: Element, s?: Source) {
  return isOffLimits([el]) || hiddenFromAll(el) || (!!s && !!contentMarks(s).hidden)
}

const keyOfValue = (value: unknown) => (value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value))

/** The marks an app wrote on a list's content part, known while it's closed and its items render elsewhere. */
export function contentMarks(s: Source) {
  const marks: { hidden?: boolean, secret?: boolean, confirm?: string } = {}
  for (const { props, part } of [...s.items, ...(s.inner?.items ?? [])]) {
    if (part !== 'content' || !props)
      continue
    if (props['data-agent-hidden'] !== undefined && props['data-agent-hidden'] !== false)
      marks.hidden = true
    if (props['data-agent-secret'] !== undefined && props['data-agent-secret'] !== false)
      marks.secret = true
    if (typeof props['data-agent-confirm'] === 'string')
      marks.confirm = props['data-agent-confirm'].trim() || 'Confirm this change.'
  }
  return marks
}

/** The confirm sentence of the item with this value when it was last seen. */
export function markSeen(s: Source, value: unknown) {
  const key = keyOfValue(value)
  return s.marksSeen?.get(key) ?? s.inner?.marksSeen?.get(key)
}

/** Whether an item with this value was ever seen rendered, so its marks then are known. */
export function seenBefore(s: Source, value: unknown) {
  const key = keyOfValue(value)
  return !!(s.valuesSeen?.has(key) || s.inner?.valuesSeen?.has(key))
}

/** Whether a value is one of a list's items that is off-limits now or was when last seen. */
function isHiddenValue(s: Source, value: unknown) {
  if (s.native?.localName === 'select')
    return Array.from((s.native as HTMLSelectElement).options).some(option => option.value === value && itemOff(option))
  if (s.radios)
    return s.radios.some(radio => radio.value === value && itemOff(radio))
  if (contentMarks(s).hidden)
    return true
  registered(s, true)
  if (s.inner)
    registered(s.inner, true)
  return [...(s.hiddenSeen ?? []), ...(s.inner?.hiddenSeen ?? [])].some(seen => same(seen, value))
}

/**
 * A list's value without the items an agent mustn't see: a hidden item that is chosen is reported as not chosen,
 * on every path, so its value is never shown or used to name the list.
 */
export function withoutHidden(s: Source, value: unknown) {
  if (Array.isArray(value))
    return value.some(v => isHiddenValue(s, v)) ? value.filter(v => !isHiddenValue(s, v)) : value
  return value != null && value !== '' && isHiddenValue(s, value) ? null : value
}

/** The elements of the component's registered `part` controls, like its increment buttons, for `value` when given. */
export function partsNamed(s: Source, name: string, value?: { of: unknown }) {
  return Array.from(s.items).flatMap(({ props, element, part, instance }) => {
    const node = el(element) ?? el(instance?.vnode.el)
    return part === name && node && (!value || same(unref(props?.value), value.of)) ? [node] : []
  })
}

// The items that registered against the list, each with its element: an item the list only knows by value
// isn't one an agent can see or pick. `detached` keeps items rendered off the page, like a closed select's.
function registered(s: Source, detached = false): Item[] {
  const all = Array.from(s.items).filter(item => !item.part).map(({ props, element }) => {
    const node = el(element)
    const trigger = node?.matches('[role=tab], [role=option], [role=radio], button, [aria-controls]') ? node : node?.querySelector<HTMLElement>('[aria-controls], button') ?? node
    return {
      value: unref(props.value),
      label: trigger ? textOrName(trigger) : '',
      disabled: !!props.disabled || (!!trigger && isDisabledElement(trigger)),
      // The element a person presses for it, like an accordion section's trigger.
      el: trigger,
    }
  })
  // A hidden item's value is remembered, so it stays out of what the list reports after its items leave.
  for (const item of all) {
    if (!item.el)
      continue
    const off = itemOff(item.el, s)
    const seen = (s.hiddenSeen ??= []).findIndex(value => same(value, item.value))
    if (off && seen === -1)
      s.hiddenSeen.push(item.value)
    else if (!off && seen !== -1)
      s.hiddenSeen.splice(seen, 1)
    // Its mark is remembered by value, for when a filter or a closed list takes it off the page.
    s.valuesSeen ??= new Set()
    s.valuesSeen.add(keyOfValue(item.value))
    const mark = confirmOf([item.el]) ?? contentMarks(s).confirm
    if (mark)
      (s.marksSeen ??= new Map()).set(keyOfValue(item.value), mark)
    else
      s.marksSeen?.delete(keyOfValue(item.value))
  }
  return all.filter(item => !!item.el && (detached || item.el.isConnected) && !itemOff(item.el, s)).filter((item, _, all) => item.el!.isConnected || !all.some(other => other.el!.isConnected)).sort((a, b) => (a.el!.compareDocumentPosition(b.el!) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
}

// A list's value by toggling, the way a person picks and unpicks items: `toggle` adds or takes out one.
function toggleTo(current: unknown, target: unknown, multiple: boolean, pick: (value: unknown) => unknown, guard?: (value: unknown) => void) {
  // Every choice is checked just before it's made, the first one too: what the page did since can mark it.
  const toggle = (value: unknown) => {
    guard?.(value)
    return pick(value)
  }
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
  const changes = [...now.filter(value => !has(want, value)), ...want.filter(value => !has(now, value))]
  if (changes.length <= 1) {
    changes.forEach(toggle)
    return
  }
  // Each toggle builds on the one before, so a controlled model gets its render in between, as clicks would.
  return (async () => {
    for (const [index, value] of changes.entries()) {
      if (index)
        await nextTick()
      toggle(value)
    }
  })()
}

// Picks an item the way a click on it does, so its `select` event fires and `preventDefault` there stops it.
// An item that isn't there to click, or that the agent mustn't see, isn't picked any other way.
function clickItem(list: Source, value: unknown) {
  const item = registered(list).find(item => same(item.value, value))
  if (!item?.el)
    return fail(`No item ${JSON.stringify(value)} to pick in this list now.`)
  if (item.disabled)
    return fail(`"${item.label}" is disabled now.`)
  item.el.click()
  return true
}

const DIGIT = /^\d$/

const pause = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

const field = (keys: string[], adapter: Omit<Adapter, 'keys'>): Adapter => ({ keys, ...adapter })

// Checkbox, Switch and Toggle: one button that holds a boolean.
function checkable(component: string, key: 'checked' | 'pressed', read: (s: Source) => unknown, flip: (s: Source) => void, disabled: (s: Source) => boolean, set: (s: Source, value: unknown) => void = flip): Adapter {
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
        set(s, value)
    },
  })
}

// The checkbox's own `setChecked` sets the asked state, so a group, an indeterminate state and its Field all follow a click's path.
function checkTo(s: Source, value: unknown) {
  s.extra(value, 'trigger-press')
}

function popup(component: (s: Source) => string, trigger: (s: Source) => HTMLElement | undefined, content: (s: Source) => HTMLElement | undefined, extra: Partial<Adapter> = {}): Adapter {
  return {
    component,
    keys: ['open'],
    parts: s => parts(['trigger', trigger(s)], ['content', content(s)]),
    owns: s => parts(['trigger', trigger(s)]).map(p => p.el),
    content,
    state: s => ({ open: !!unref(s.ctx.open) }),
    // A closed popup whose trigger is disabled can't be opened, so nothing inside it can be pressed.
    disabled: (s) => {
      const opener = trigger(s)
      return !unref(s.ctx.open) && !!opener && isDisabledElement(opener)
    },
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

// A number the way the field takes typed text: kept in range and on its step, unless the field allows any value.
function numberTo(s: Source, value: number) {
  const min = unref(s.ctx.min) as number | undefined
  const max = unref(s.ctx.max) as number | undefined
  if (s.props.allowInvalid)
    return value
  const step = s.props.step
  if (step === undefined || Number.isNaN(step) || s.props.stepSnapping === false)
    return clamp(value, min, max)
  return snapValueToStep(value, min, max, step)
}

// A combobox's items show while it's open, so it opens to click them, as a person does, then closes if it was closed.
async function comboboxTo(s: Source, value: unknown, guard?: (value: unknown) => void) {
  const multiple = !!unref(s.ctx.multiple)
  const current = unref(s.ctx.modelValue)
  const wanted = toList(value)
  const was = !!unref(s.ctx.open)
  try {
    if (!was && (wanted.length || multiple || current != null)) {
      s.ctx.onOpenChange(true)
      // A timer, not frames: a hidden page renders no frames, and a wait on one would hold every later call.
      const deadline = Date.now() + 1000
      while (!registered(s.inner ?? s).length && Date.now() < deadline)
        await pause(16)
    }
    const listbox = s.inner ?? s
    // The guard runs after the wait, on what the list shows then.
    await toggleTo(current, value, multiple, v => clickItem(listbox, v), guard)
  }
  finally {
    if (!was && unref(s.ctx.open))
      s.ctx.onOpenChange(false)
  }
}

// A closed select renders its items only while something needs them, like its typeahead: the bridge needs them
// too, so it asks for them the way the typeahead does, and they're known from the next render.
function keepItems(s: Source) {
  const closed = s.ctx.closedItems as { hasRendered: () => boolean, renderThen: (callback: () => void) => void } | undefined
  if (closed && !unref(s.ctx.open) && !closed.hasRendered())
    closed.renderThen(() => {})
}

const rootOf = (s: Source) => el(s.element) ?? el(s.instance?.vnode.el)

const menuContent = (s: Source) => (unref(s.ctx.open) ? byId(s, s.ctx.contentId) : undefined)

export const adapters: Record<string, Adapter> = {
  'checkbox': checkable('checkbox', 'checked', s => unref(s.ctx.state), s => checkTo(s, unref(s.ctx.state) !== true), s => !!unref(s.ctx.disabled), checkTo),
  'switch': checkable('switch', 'checked', s => !!unref(s.ctx.checked), s => s.ctx.toggleCheck(), s => !!unref(s.ctx.disabled)),
  // A standalone toggle registers its `pressed` state, with its `setPressed`.
  'toggle': checkable('toggle', 'pressed', s => !!unref(s.ctx), s => s.extra(!unref(s.ctx), 'trigger-press'), s => !!s.props.disabled, (s, value) => s.extra(value, 'trigger-press')),

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
    parts: s => parts(['trigger', el(s.ctx.triggerElement)], ['content', unref(s.ctx.open) ? byId(s, s.ctx.contentId) : undefined]),
    owns: s => parts(['trigger', el(s.ctx.triggerElement)], ['content', byId(s, s.ctx.contentId)]).map(p => p.el),
    state: s => ({
      value: unref(s.ctx.modelValue) ?? null,
      open: !!unref(s.ctx.open),
      ...(unref(s.ctx.multiple) && { multiple: true }),
      ...(unref(s.ctx.required) && { required: true }),
    }),
    // Its items render while it's closed too, off the page, so their elements and marks are known.
    items: (s) => {
      keepItems(s)
      return registered(s, true)
    },
    prepare: keepItems,
    closed: true,
    disabled: s => !!unref(s.ctx.disabled),
    actions: () => ['setValue', 'setOpen'],
    run: (s, action, [value], guard) => {
      if (action === 'setValue') {
        // A person can't empty a single select, only pick another item.
        if (!unref(s.ctx.multiple) && (value == null || value === ''))
          return fail('select can\'t be emptied. Pick one of its items.')
        const pick = (v: unknown) => {
          const item = registered(s, true).find(item => same(item.value, v))
          if (!item)
            return fail(`No item ${JSON.stringify(v)} to pick in this list now.`)
          if (item.disabled)
            return fail(`"${item.label}" is disabled now.`)
          return s.ctx.onValueChange(v)
        }
        return toggleTo(unref(s.ctx.modelValue), value, !!unref(s.ctx.multiple), pick, guard)
      }
      return adapters.popover.run(s, action, [value])
    },
  }),

  'combobox': field(['value', 'open'], {
    component: () => 'combobox',
    parts: s => parts(['root', el(s.element)], ['input', el(s.ctx.inputElement)], ['trigger', el(s.ctx.triggerElement)], ['content', unref(s.ctx.open) ? byId(s, s.ctx.contentId) : undefined]),
    owns: s => parts(['root', el(s.element)], ['content', byId(s, s.ctx.contentId)]).map(p => p.el),
    state: s => ({
      value: unref(s.ctx.modelValue) ?? null,
      open: !!unref(s.ctx.open),
      ...(unref(s.ctx.filterSearch) && { query: unref(s.ctx.filterSearch) }),
      ...(unref(s.ctx.multiple) && { multiple: true }),
    }),
    // Its items register against its own context, or against a listbox it renders.
    items: s => registered(s.inner ?? s),
    itemsWhileOpen: true,
    closed: true,
    disabled: s => !!unref(s.ctx.disabled),
    actions: () => ['setValue', 'setOpen', 'setQuery', 'clear'],
    actionParts: (s, action) => (action === 'clear' ? partsNamed(s, 'clear') : []),
    run: (s, action, [value], guard) => {
      if (action === 'setValue') {
        return comboboxTo(s, value, guard)
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
    run: (s, action, [value], guard) => {
      const multiple = !!unref(s.ctx.multiple)
      if (action === 'clear')
        return toggleTo(unref(s.ctx.modelValue), multiple ? [] : undefined, multiple, v => clickItem(s, v), guard)
      if (action !== 'setValue')
        return fail(`listbox takes setValue, not ${action}.`)
      return toggleTo(unref(s.ctx.modelValue), value, multiple, v => clickItem(s, v), guard)
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
    run: (s, action, [value], guard) => {
      const single = !!unref(s.ctx.isSingle)
      const current = unref(s.ctx.modelValue)
      const open = toList(current)
      const change = (v: unknown) => {
        guard?.(v)
        return s.ctx.changeModelValue(v)
      }
      const all = registered(s).filter(item => !item.disabled).map(item => item.value)
      const closing = (target: unknown) => {
        if (single && !s.ctx.collapsible && has(open, target))
          fail('This accordion keeps one section open: open another instead.')
      }
      if ((action === 'open' || action === 'close' || action === 'toggle') && (value == null || value === ''))
        fail(`${action} on an accordion takes one of its sections.`)
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
          return toggleTo(current, [...open, ...all.filter(v => !has(open, v))], true, change)
        case 'closeAll':
          // A disabled section stays open, as `close` leaves it.
          return toggleTo(current, registered(s).filter(item => item.disabled && has(open, item.value)).map(item => item.value), true, change)
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
    actionParts: (s, action) => (action === 'increment' || action === 'decrement' ? partsNamed(s, action) : []),
    run: (s, action, [value]) => {
      if (action === 'increment')
        return s.ctx.handleIncrease()
      if (action === 'decrement')
        return s.ctx.handleDecrease()
      if (action === 'clear')
        return s.ctx.applyInputValue('')
      if (action !== 'setValue')
        return fail(`number-field takes setValue, not ${action}.`)
      s.ctx.modelValue.value = numberTo(s, value as number)
    },
  }),

  'pin-input': field(['value'], {
    component: () => 'pin-input',
    secret: true,
    parts: s => parts(['root', rootOf(s)]),
    owns: s => parts(['root', rootOf(s)]).map(p => p.el),
    state: s => ({ value: (unref(s.ctx.modelValue) ?? []).join('') }),
    disabled: s => !!unref(s.ctx.disabled),
    actions: () => ['setValue', 'clear'],
    run: (s, action, [value]) => {
      if (action !== 'setValue' && action !== 'clear')
        return fail(`pin-input takes setValue or clear, not ${action}.`)
      const chars = action === 'clear' || value == null ? [] : [...String(value)]
      const boxes = (unref(s.ctx.inputElements) as Set<HTMLElement> | undefined)?.size ?? rootOf(s)?.querySelectorAll('input').length ?? 0
      if (boxes && chars.length > boxes)
        fail(`pin-input takes at most ${boxes} characters.`)
      const numeric = !!unref(s.ctx.isNumericMode)
      if (numeric && chars.some(char => !DIGIT.test(char)))
        fail('pin-input takes digits only.')
      s.ctx.setModelValue(numeric ? chars.map(Number) : chars)
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
    run: (s, action, [value], guard) => {
      if (action === 'toggle')
        return s.ctx.changeModelValue(value)
      if (action !== 'setValue')
        return fail(`toggle-group takes setValue or toggle, not ${action}.`)
      return toggleTo(unref(s.ctx.modelValue), value, !unref(s.ctx.isSingle), v => s.ctx.changeModelValue(v), guard)
    },
  }),

  'tags-input': field(['value'], {
    component: () => 'tags-input',
    parts: s => parts(['root', el(s.element)], ['input', el(s.element)?.querySelector('input')]),
    owns: s => parts(['root', el(s.element)]).map(p => p.el),
    state: s => ({ value: [...(unref(s.ctx.modelValue) ?? [])], ...(unref(s.ctx.max) && { max: unref(s.ctx.max) }) }),
    disabled: s => !!unref(s.ctx.disabled),
    actions: () => ['setValue', 'add', 'remove', 'clear'],
    // Taking a tag out does what its tag's delete button does, and clearing what the clear button does.
    actionParts: (s, action, [value]) => {
      const now = [...(unref(s.ctx.modelValue) ?? [])] as unknown[]
      const out = action === 'remove' ? [value] : action === 'clear' ? now : action === 'setValue' ? now.filter(tag => !has(toList(value), tag)) : []
      const items = Array.from(s.items).filter(item => !item.part && out.some(tag => same(unref(item.props.value), tag))).flatMap(item => el(item.element) ?? [])
      return [...items, ...out.flatMap(tag => partsNamed(s, 'delete', { of: tag })), ...(action === 'clear' ? partsNamed(s, 'clear') : [])]
    },
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
    s => (s.parentName === 'AlertDialogRoot' || (s.instance?.type as { __name?: string } | undefined)?.__name === 'AlertDialogRoot' || el(s.ctx.contentElement)?.getAttribute('role') === 'alertdialog' ? 'alert-dialog' : 'dialog'),
    s => el(s.ctx.triggerElement),
    s => (unref(s.ctx.open) ? el(s.ctx.contentElement) : undefined),
    {
      parts: s => parts(
        ['trigger', el(s.ctx.triggerElement)],
        ['content', unref(s.ctx.open) ? el(s.ctx.contentElement) : undefined],
        ['title', unref(s.ctx.open) ? byId(s, s.ctx.titleId) : undefined],
        ['description', unref(s.ctx.open) ? byId(s, s.ctx.descriptionId) : undefined],
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
  return (id && [...(root?.querySelectorAll<HTMLElement>('[aria-controls]') ?? [])].find(el => el.getAttribute('aria-controls') === id)) || root?.querySelector<HTMLElement>('button') || undefined
}

// Fields whose value the browser cleans, so what they hold can differ from what was set.
const CLEANED = ['date', 'time', 'datetime-local', 'month', 'week', 'color', 'range', 'number']

function setValue(input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  const proto = Object.getPrototypeOf(input)
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
  if (setter)
    setter.call(input, value)
  else
    input.value = value
}
function announce(input: Element) {
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

/** Sets a native field's value the way typing does, so `v-model` and listeners hear it. */
export function setNativeValue(input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  setValue(input, value)
  announce(input)
}

const optionText = (option: HTMLOptionElement) => textOf(option) || (option.closest('[data-agent-secret]') ? '' : option.value)
const shownOptions = (select: HTMLSelectElement) => Array.from(select.options).filter(option => !itemOff(option))
const radiosOf = (s: Source) => (s.radios ?? []).filter(radio => !itemOff(radio))

// Native fields and buttons on the page that no component owns.
export const native: Record<string, Adapter> = {
  input: field(['value'], {
    component: s => (s.native!.localName === 'textarea' ? 'textarea' : 'input'),
    parts: s => parts(['control', s.native]),
    owns: () => [],
    state: (s) => {
      const input = s.native as HTMLInputElement
      const range = input.type === 'range'
      const out: Record<string, unknown> = { value: input.type === 'number' || range ? (input.value === '' ? null : input.valueAsNumber) : input.value }
      if ((input.type === 'number' || range) && (input.min !== '' || range))
        out.min = input.min === '' ? 0 : Number(input.min)
      if ((input.type === 'number' || range) && (input.max !== '' || range))
        out.max = input.max === '' ? 100 : Number(input.max)
      if (input.placeholder)
        out.placeholder = input.placeholder
      if (input.required)
        out.required = true
      return out
    },
    disabled: s => isDisabledElement(s.native!) || (s.native as HTMLInputElement).readOnly,
    actions: () => ['setValue', 'clear'],
    run: (s, action, [value]) => {
      if (action === 'clear')
        return setNativeValue(s.native as HTMLInputElement, '')
      if (action !== 'setValue')
        return fail(`input takes setValue or clear, not ${action}.`)
      const input = s.native as HTMLInputElement
      const text = value == null ? '' : String(value)
      // As typing would: no more than its maxlength allows.
      if (input.maxLength >= 0 && text.length > input.maxLength)
        return fail(`${input.localName} takes at most ${input.maxLength} characters.`)
      // A date, color or range field cleans what it's given, like "tomorrow" in a date field to "". What it
      // wouldn't take leaves the value it had, with nothing heard by the app.
      const was = input.value
      setValue(input, text)
      if (CLEANED.includes(input.type) && input.value !== text && !(input.type === 'range' && Number(input.value) === Number(text)) && !(input.type === 'color' && input.value === text.toLowerCase())) {
        setValue(input, was)
        return fail(`${input.type} input doesn't take ${JSON.stringify(text)}.`)
      }
      announce(input)
    },
  }),
  checkbox: field(['checked'], {
    component: () => 'checkbox',
    parts: s => parts(['control', s.native]),
    owns: () => [],
    state: s => ({ checked: (s.native as HTMLInputElement).indeterminate ? 'indeterminate' : (s.native as HTMLInputElement).checked }),
    disabled: s => isDisabledElement(s.native!),
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
    // An option inside `data-agent-hidden` isn't one an agent sees or picks.
    items: s => shownOptions(s.native as HTMLSelectElement).map(option => ({ value: option.value, label: optionText(option), disabled: option.disabled || (option.parentElement?.localName === 'optgroup' && (option.parentElement as HTMLOptGroupElement).disabled), el: option })),
    closed: true,
    disabled: s => isDisabledElement(s.native!),
    actions: () => ['setValue'],
    run: (s, action, [value]) => {
      const select = s.native as HTMLSelectElement
      if (action !== 'setValue')
        return fail(`select takes setValue, not ${action}.`)
      if (select.multiple) {
        const want = toList(value).map(String)
        for (const option of shownOptions(select))
          option.selected = want.includes(option.value)
        select.dispatchEvent(new Event('input', { bubbles: true }))
        select.dispatchEvent(new Event('change', { bubbles: true }))
        return
      }
      if (value != null && value !== '' && !shownOptions(select).some(option => option.value === String(value)))
        return fail(`No item ${JSON.stringify(value)} to pick in this list now.`)
      setNativeValue(select, value == null ? '' : String(value))
    },
  }),
  radio: field(['value'], {
    component: () => 'radio-group',
    // A radio inside `data-agent-hidden` isn't one of the group's for an agent; the others still are.
    parts: s => radiosOf(s).map(radio => ({ slot: 'item', el: radio })),
    owns: () => [],
    state: s => ({ value: s.radios?.find(radio => radio.checked)?.value ?? null }),
    items: s => radiosOf(s).map(radio => ({ value: radio.value, label: nameOf(radio) || radio.value, disabled: isDisabledElement(radio), el: radio })),
    closed: true,
    disabled: s => radiosOf(s).every(radio => isDisabledElement(radio)),
    actions: () => ['setValue'],
    run: (s, action, [value]) => {
      if (action !== 'setValue')
        return fail(`radio-group takes setValue, not ${action}.`)
      const radio = radiosOf(s).find(radio => radio.value === String(value))
      if (!radio)
        return fail(`No item ${JSON.stringify(value)} to pick in this list now.`)
      radio.click()
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
