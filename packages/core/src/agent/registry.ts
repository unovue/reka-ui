// The components the bridge knows: reka-ui roots that registered through the
// shared hook while a bridge exists, and the native fields and buttons it finds
// on the page. Each has a ref that stays while it's on the page and comes back
// when the same component returns, like a closed tab's fields.
import type { Adapter, Part, Source } from './adapters'
import type { AgentComponent, ChangeSource, ObservedChange } from './types'
import { effectScope, getCurrentInstance, onBeforeUnmount, watch } from 'vue'
import { agentRegistrar } from '@/shared/useAgentRegistration'
import { adapters, native } from './adapters'
import { isOffLimits, isSecret, isShown, nameOf, rowOf, sectionsOf, textOf } from './dom'

export interface Entry {
  ref: string
  id: string
  source: Source
  adapter: Adapter
  /** What named it when last seen, `component|label|row|sections`, so a component that comes back keeps its ref. */
  key?: string
  label?: string
  row?: string
  sections?: string[]
  /** Whether an agent has had it on the page. */
  shown?: boolean
  secret?: boolean
  offLimits?: boolean
  alive: boolean
  stop?: () => void
}

type Listener = (change: ObservedChange) => void
const listeners = new Set<Listener>()
let acting = 0
let lastInput: { source: ChangeSource, at: number } | undefined
let stopInput: (() => void) | undefined

export const entries = new Map<string, Entry>()
const bySource = new WeakMap<object, Entry>()
const sources = new WeakMap<object, Source>()
const itemSets = new WeakMap<object, Source['items']>()
const radioGroups = new Map<string, Entry>()
let count = 0
let ids = 0

// Refs of components that left, by key, for the same components when they come back.
const retired = new Map<string, string[]>()
/** What components showed when they left, so an agent can check a closed tab without opening it. */
export const offPage = new Map<string, AgentComponent>()
/** The regions each of those was in. */
export const placeOf = new WeakMap<AgentComponent, string[]>()

// Roots another reka-ui component renders for itself, like a combobox's listbox or an accordion item's
// collapsible: they belong to that component, and aren't components of the page.
const HOSTED: Record<string, RegExp> = {
  listbox: /^(?:Combobox|Autocomplete|ColorSwatchPicker)Root$/,
  collapsible: /^AccordionItem$/,
}

function add(source: Source, adapter: Adapter, key: object) {
  const entry: Entry = { ref: `c${++count}`, id: `agent-${++ids}`, source, adapter, alive: true }
  entries.set(entry.ref, entry)
  bySource.set(key, entry)
  if (listeners.size)
    observe(entry)
  return entry
}

export function stateKeys(entry: Entry, state: Record<string, unknown>) {
  return entry.adapter.keys.filter(key => key in state)
}

export function retire(entry: Entry) {
  if (!entry.alive)
    return
  entry.alive = false
  entry.stop?.()
  if (entries.get(entry.ref) === entry)
    entries.delete(entry.ref)
  // Marks the app wrote since the last scan count too, so nothing private is kept.
  const elements = markedBy(entry)
  if (isOffLimits(elements))
    entry.offLimits = true
  entry.secret ||= isSecret(elements)
  if (!entry.key || !entry.shown || entry.secret || entry.offLimits)
    return
  const queue = retired.get(entry.key) ?? []
  queue.push(entry.ref)
  retired.delete(entry.key)
  retired.set(entry.key, queue)
  if (retired.size > 500)
    retired.delete(retired.keys().next().value!)
  // Values and checks are worth keeping. A closed menu's `open: false` isn't.
  let state: Record<string, unknown>
  try {
    state = entry.adapter.state(entry.source)
  }
  catch {
    return
  }
  const keys = stateKeys(entry, state).filter(key => key !== 'open')
  if (!keys.length)
    return
  const last: AgentComponent = { ref: entry.ref, component: entry.adapter.component(entry.source), offPage: true, actions: [] }
  if (entry.label)
    last.label = entry.label
  if (entry.row)
    last.row = entry.row
  for (const key of keys)
    last[key] = state[key] ?? null
  if (entry.sections?.length)
    placeOf.set(last, entry.sections)
  offPage.delete(entry.ref)
  offPage.set(entry.ref, last)
  if (offPage.size > 50)
    offPage.delete(offPage.keys().next().value!)
}

/** The component's parts on the page now. */
export function partsOf(entry: Entry): Part[] {
  try {
    return entry.adapter.parts(entry.source).filter(part => part.el.isConnected)
  }
  catch {
    return []
  }
}

export function anchorOf(parts: Part[]) {
  return (parts.find(part => part.slot === 'trigger' || part.slot === 'root' || part.slot === 'control' || part.slot === 'input' || part.slot === 'list') ?? parts[0])?.el
}

/** An accessible name for the component, from its label, its own element, a title or its trigger. */
export function labelOf(entry: Entry, parts: Part[]) {
  const find = (slot: string) => parts.find(part => part.slot === slot)?.el
  const name = (el: Element | undefined) => (el ? nameOf(el).slice(0, 80) : '')
  const kind = entry.source.kind
  if (entry.source.radios)
    return name(entry.source.radios[0]?.closest('fieldset, [role=radiogroup]') ?? undefined) || undefined
  if (kind === 'dialog')
    return textOf(find('title')).slice(0, 80) || name(find('trigger')) || name(find('content')) || undefined
  if (kind === 'menu' || kind === 'popover')
    return name(find('trigger')) || name(find('content')) || undefined
  return name(find('input')) || name(find('control')) || name(find('root')) || name(find('list')) || name(find('trigger')) || undefined
}

/** Keeps the component's names current, and the first time it's named gives it the ref it had before it left. */
export function remember(entry: Entry, parts: Part[]) {
  const first = !entry.key
  const elements = parts.map(part => part.el)
  entry.offLimits = isOffLimits(elements)
  // Off-limits components are never shown, but a step that names one is told it's off-limits, so it stops looking.
  entry.label = entry.offLimits
    ? (anchorOf(parts)?.getAttribute('aria-label') ?? anchorOf(parts)?.textContent ?? '').trim().slice(0, 80) || undefined
    : labelOf(entry, parts)
  const anchor = anchorOf(parts)
  entry.row = rowOf(anchor, elements)
  entry.sections = sectionsOf(anchor, elements)
  entry.secret ||= isSecret(elements)
  entry.key = `${entry.adapter.component(entry.source)}|${entry.label}|${entry.row}|${entry.sections.join('>')}`
  if (!first)
    return
  const queue = retired.get(entry.key)
  if (!queue?.length)
    return
  retired.delete(entry.key)
  // Two that left with the same name can't be told apart when one comes back, so neither ref is reused.
  if (queue.length > 1) {
    queue.forEach(ref => offPage.delete(ref))
    return
  }
  const ref = queue[0]!
  offPage.delete(ref)
  if (entries.has(ref))
    return
  entries.delete(entry.ref)
  entry.ref = ref
  entries.set(ref, entry)
}

const nameOfType = (type: unknown) => (type as { __name?: string, name?: string } | undefined)?.__name ?? (type as { name?: string } | undefined)?.name

function onRoot(kind: string, ctx: unknown, props: unknown, element?: unknown, extra?: unknown) {
  const adapter = adapters[kind]
  const instance = getCurrentInstance()
  if (!adapter || !instance || typeof document === 'undefined' || !ctx)
    return
  const parent = instance.parent
  const parentName = nameOfType(parent?.type)
  const source: Source = { kind, ctx, props, element, extra, items: new Set(), parentName, instance }
  itemSets.set(ctx as object, source.items)
  // A root another component renders, a few components up, like a combobox's listbox inside its popper root.
  const hosted = HOSTED[kind]
  if (hosted) {
    for (let up = parent, depth = 0; up && depth < 4; up = up.parent, depth++) {
      if (hosted.test(nameOfType(up.type) ?? '')) {
        const host = sources.get(up)
        if (host)
          host.inner = source
        return
      }
    }
  }
  sources.set(instance, source)
  const entry = add(source, adapter, ctx as object)
  onBeforeUnmount(() => retire(entry))
}

function onItem(rootContext: unknown, props: unknown, element: unknown) {
  const set = rootContext ? itemSets.get(rootContext as object) : undefined
  if (!set || !getCurrentInstance())
    return
  const item = { props, element }
  set.add(item)
  onBeforeUnmount(() => set.delete(item))
}

let installs = 0

/** Starts hearing components as they're made. */
export function install() {
  if (typeof document === 'undefined')
    return
  installs++
  agentRegistrar.root = onRoot
  agentRegistrar.item = onItem
}

/** Stops hearing components once every bridge is gone, and forgets them. */
export function uninstall() {
  if (installs === 0 || --installs > 0)
    return
  agentRegistrar.root = undefined
  agentRegistrar.item = undefined
  // A component still on the page retires into nothing once the bridge is gone.
  for (const entry of [...entries.values()]) {
    entry.alive = false
    entry.stop?.()
  }
  entries.clear()
  radioGroups.clear()
  retired.clear()
  offPage.clear()
  listeners.clear()
  stopInput?.()
}

// Native fields and buttons on the page that no registered component owns.
const NATIVE = 'input, textarea, select, button'

function nativeKind(el: HTMLElement) {
  if (el.localName === 'button')
    return 'button'
  if (el.localName === 'select')
    return 'select'
  if (el.localName === 'textarea')
    return 'input'
  const type = (el as HTMLInputElement).type
  if (type === 'hidden' || type === 'file' || type === 'image')
    return undefined
  if (type === 'checkbox')
    return 'checkbox'
  if (type === 'radio')
    return 'radio'
  if (type === 'submit' || type === 'button' || type === 'reset')
    return 'button'
  return 'input'
}

// Radios group by their form element and name, as browsers group them, so each form gets its own key.
const formKeys = new WeakMap<object, number>()
let formCount = 0
function formKey(owner: object | null) {
  if (!owner)
    return 'page'
  let key = formKeys.get(owner)
  if (key === undefined)
    formKeys.set(owner, key = ++formCount)
  return String(key)
}

/** Brings the native entries up to date with the page and retires the ones that left. */
export function scanNative(live: Entry[]) {
  const owned: HTMLElement[] = []
  const popups: HTMLElement[] = []
  for (const entry of live) {
    if (entry.source.native || entry.source.radios)
      continue
    try {
      owned.push(...entry.adapter.owns(entry.source))
      const content = entry.adapter.content?.(entry.source)
      if (content)
        popups.push(content)
    }
    catch {}
  }
  const found = new Set<Entry>()
  const groups = new Map<string, HTMLInputElement[]>()
  for (const el of document.querySelectorAll<HTMLElement>(NATIVE)) {
    // A widget role says it's a component's part, like a switch or a tab, which no native action drives.
    const role = el.getAttribute('role')
    if (el.getAttribute('aria-hidden') === 'true' || (role && role !== 'button') || owned.some(own => own.contains(el)))
      continue
    const kind = nativeKind(el)
    if (!kind || (kind === 'button' && popups.some(popup => popup.contains(el))))
      continue
    if (kind === 'radio') {
      const radio = el as HTMLInputElement
      const name = radio.name ? `${formKey(radio.form)}|${radio.name}` : `radio:${formKey(radio)}`
      groups.set(name, [...(groups.get(name) ?? []), radio])
      continue
    }
    const known = bySource.get(el)
    const entry = known?.alive ? known : add({ kind, ctx: el, props: {}, items: new Set(), native: el }, native[kind]!, el)
    found.add(entry)
  }
  for (const [name, radios] of groups) {
    let entry = radioGroups.get(name)
    if (!entry || !entry.alive) {
      entry = add({ kind: 'radio', ctx: radios[0], props: {}, items: new Set(), radios }, native.radio, radios[0])
      radioGroups.set(name, entry)
    }
    entry.source.radios = radios
    found.add(entry)
  }
  for (const entry of entries.values()) {
    if ((entry.source.native || entry.source.radios) && !found.has(entry)) {
      retire(entry)
      if (entry.source.radios)
        radioGroups.forEach((group, name) => group === entry && radioGroups.delete(name))
    }
  }
}

export { isShown }

// Changes, for `subscribe`: watchers on each registered component's state,
// made only while something listens.

/** Runs `call` as the agent, so the changes it makes report the source `"agent"`. */
export function asAgent<T>(call: () => T): T {
  acting++
  try {
    return call()
  }
  finally {
    acting--
  }
}

/** Marks the time while an agent's step waits on what it changed, so a parent's late update is still the agent's. */
export const agentWindow = { open: false, action: '' }

function sourceNow(): { source: ChangeSource, reason: string } {
  if (acting > 0 || agentWindow.open)
    return { source: 'agent', reason: agentWindow.action || 'agent' }
  if (lastInput && performance.now() - lastInput.at < 1000)
    return { source: lastInput.source, reason: 'interaction' }
  return { source: 'programmatic', reason: 'programmatic' }
}

/** The component's elements now, and the element around it, for the marks that decide what an agent may hear. */
function markedBy(entry: Entry) {
  const elements: Element[] = partsOf(entry).map(part => part.el)
  const anchor = entry.source.instance?.vnode.el as Node | null | undefined
  const around = anchor && (anchor.nodeType === 1 ? anchor as Element : anchor.parentElement)
  if (around)
    elements.push(around)
  return elements
}

function emit(entry: Entry, key: string, value: unknown, previous: unknown) {
  // Marks are read as the change happens: a component can change before any snapshot has named it.
  const elements = markedBy(entry)
  if (!elements.length || entry.offLimits || isOffLimits(elements))
    return
  const secret = (entry.secret ||= isSecret(elements))
  const { source, reason } = sourceNow()
  const change: ObservedChange = {
    ref: entry.ref,
    component: entry.adapter.component(entry.source),
    id: entry.id,
    key,
    value: secret ? '[redacted]' : value,
    previous: secret ? '[redacted]' : previous,
    reason,
    source,
  }
  if (entry.label)
    change.label = entry.label
  if (entry.row)
    change.row = entry.row
  listeners.forEach(listener => listener(change))
}

function observe(entry: Entry) {
  if (entry.stop || entry.source.native || entry.source.radios)
    return
  const scope = effectScope(true)
  scope.run(() => {
    for (const key of entry.adapter.keys) {
      watch(() => {
        try {
          return entry.adapter.state(entry.source)[key]
        }
        catch {
          return undefined
        }
      }, (value, previous) => emit(entry, key, value, previous), { flush: 'sync', deep: true })
    }
  })
  entry.stop = () => scope.stop()
}

// What each native field held before its next change, so the first change it reports has its `previous`.
const baselines = new WeakMap<Element, unknown>()

function baseline(el: Element) {
  const kind = nativeKind(el as HTMLElement)
  if (!kind || kind === 'button')
    return
  if (kind === 'radio') {
    baselines.set(el, (el as HTMLInputElement).checked)
    return
  }
  try {
    const adapter = native[kind]!
    baselines.set(el, adapter.state({ kind, ctx: el, props: {}, items: new Set(), native: el as HTMLElement })[adapter.keys[0]!])
  }
  catch {}
}

function baselineAll(root: Node) {
  if (!(root instanceof Element))
    return
  if (root.matches(NATIVE))
    baseline(root)
  root.querySelectorAll(NATIVE).forEach(baseline)
}

function observeNative() {
  const read = (entry: Entry) => {
    const state = entry.adapter.state(entry.source)
    const key = entry.adapter.keys[0]
    return key ? { key, value: state[key] } : undefined
  }
  const lookup = (target: HTMLElement) => bySource.get(target) ?? [...radioGroups.values()].find(group => group.source.radios?.includes(target as HTMLInputElement))
  const onInput = (event: Event) => {
    const target = event.target as HTMLElement
    let entry = lookup(target)
    // A field the bridge hasn't scanned yet is found now, so its first change is heard.
    if (!entry?.alive && target.matches?.(NATIVE)) {
      scanNative([...entries.values()].filter(entry => entry.alive))
      entry = lookup(target)
    }
    if (!entry?.alive)
      return
    const now = read(entry)
    if (!now)
      return
    const radios = entry.source.radios
    const before = radios
      ? radios.find(radio => baselines.get(radio) === true)?.value ?? null
      : baselines.has(target) ? baselines.get(target) : null
    if (JSON.stringify(now.value) !== JSON.stringify(before)) {
      if (radios)
        radios.forEach(radio => baselines.set(radio, radio.checked))
      else
        baselines.set(target, now.value)
      emit(entry, now.key, now.value, before ?? null)
    }
  }
  const onPointer = (event: PointerEvent) => {
    lastInput = { source: (event.pointerType || 'mouse') as ChangeSource, at: performance.now() }
  }
  const onKey = () => {
    lastInput = { source: 'keyboard', at: performance.now() }
  }
  const remembering = (event: Event) => {
    const target = event.target as Element
    if (target.matches?.(NATIVE) && !baselines.has(target))
      baseline(target)
  }
  // Fields on the page now and the ones added later start from what they hold.
  baselineAll(document.documentElement)
  const added = typeof MutationObserver === 'undefined'
    ? undefined
    : new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(baselineAll)))
  added?.observe(document.documentElement, { childList: true, subtree: true })
  document.addEventListener('focusin', remembering, true)
  document.addEventListener('input', onInput, true)
  document.addEventListener('change', onInput, true)
  document.addEventListener('pointerdown', onPointer, true)
  document.addEventListener('keydown', onKey, true)
  stopInput = () => {
    added?.disconnect()
    document.removeEventListener('focusin', remembering, true)
    document.removeEventListener('input', onInput, true)
    document.removeEventListener('change', onInput, true)
    document.removeEventListener('pointerdown', onPointer, true)
    document.removeEventListener('keydown', onKey, true)
    stopInput = undefined
  }
}

/** Calls `listener` with every change until the returned function runs. */
export function listen(listener: Listener) {
  listeners.add(listener)
  if (listeners.size === 1) {
    entries.forEach(observe)
    if (typeof document !== 'undefined' && !stopInput)
      observeNative()
  }
  return () => {
    listeners.delete(listener)
    if (!listeners.size) {
      entries.forEach((entry) => {
        entry.stop?.()
        entry.stop = undefined
      })
      stopInput?.()
    }
  }
}
