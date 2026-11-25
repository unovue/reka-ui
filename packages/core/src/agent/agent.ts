// The agent bridge: every live component on the page, read and driven through
// its own state, so an AI agent operates the UI without a screenshot or a click.
// The tool shapes follow the UI SDK agent bridge, so agents written for it work here.
import type { Item, Part } from './adapters'
import type { Entry } from './registry'
import type { Agent, AgentAction, AgentActResult, AgentAllow, AgentChange, AgentComponent, AgentOptions, AgentQuery, AgentStep } from './types'
import { isEqual } from 'ohash'
import { nextTick } from 'vue'
import { hiddenItem } from './adapters'
import { buttonsIn, byPosition, confirmOf, fold, isDisabledElement, isOffLimits, isShown, textOf, textOrName, wordsOf } from './dom'
import { agentWindow, anchorOf, asAgent, entries, install, listen, offPage, partsOf, placeOf, remember, scanNative, stateKeys, uninstall } from './registry'
import { agentTools } from './tools'

interface Found { entry: Entry, parts: Part[] }

// The most components one `snapshot` or `query` returns.
const LIMIT = 100
// The waits, of two frames each, a held change gets before it counts as refused: about a second.
const PATIENCE = 30
// The most closed places one step opens to look for its component.
const REACH = 24

const SYNONYMS: Record<string, string[]> = {
  open: ['setOpen'],
  close: ['setOpen'],
  toggle: ['setOpen', 'setChecked', 'setPressed'],
  select: ['setValue'],
}

/** Two frames, so Vue has rendered what a call changed. A hidden tab runs no frames, so a timer stands in. */
async function frames() {
  await nextTick()
  await new Promise<void>((resolve) => {
    let done = false
    const finish = () => {
      if (!done) {
        done = true
        resolve()
      }
    }
    if (typeof requestAnimationFrame === 'function' && !document.hidden)
      requestAnimationFrame(() => requestAnimationFrame(finish))
    setTimeout(finish, 40)
  })
  await nextTick()
}

const keyOf = (value: unknown) => (value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value))
const differs = (was: unknown, now: unknown) => !Object.is(was, now) && JSON.stringify(was) !== JSON.stringify(now)
const isEmpty = (value: unknown) => value == null || value === '' || (Array.isArray(value) && !value.length)
function sameValue(now: unknown, asked: unknown) {
  const held = Array.isArray(now) && !Array.isArray(asked) && now.length === 1 ? now[0] : now
  if (isEmpty(held) && isEmpty(asked))
    return true
  if (typeof held === 'object' || typeof asked === 'object')
    return isEqual(held as any, asked as any) || !differs(held, asked)
  return fold(String(held)) === fold(String(asked))
}
const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error))
function quoted(value: unknown) {
  const text = JSON.stringify(value) ?? 'nothing'
  return text.length > 60 ? `${text.slice(0, 60)}…` : text
}
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const moreOf = (more: number): AgentComponent => ({ ref: 'more', component: 'more', more, use: 'query', actions: [] })
const fieldKey = (keys: string[]) => (keys.includes('checked') ? 'checked' : keys.includes('pressed') ? 'pressed' : keys.includes('value') ? 'value' : undefined)
const nameFor = (entry: Entry) => `${entry.label ?? entry.adapter.component(entry.source)} (${entry.ref})`
const described = (entry: Entry) => [entry.ref, entry.label, entry.row && `(${entry.row})`].filter(Boolean).join(' ')

// The errors that say a name is nowhere on the page, which closed places are then looked through for.
const unfound = new WeakMap<Error, string>()
// The errors of a step that named something the page doesn't have.
const guessed = new WeakSet<Error>()
function wrongGuess(message: string) {
  const error = new Error(message)
  guessed.add(error)
  return error
}
function notFound(message: string, looked = message) {
  const error = wrongGuess(message)
  unfound.set(error, looked)
  return error
}

const SETTER = /^set[A-Z]/
const BOOLEAN_SETTER = /^set(?:Checked|Open|Pressed)$/
const STEP_SHAPE = '{ "ref": "…", "action": "…", "args": […] }'
/** The most steps one `act` runs, so one call can't hold the page for long. */
const MAX_STEPS = 100

// What is wrong with the shape of an `act` call, checked on every step before the first runs.
function malformed(input: unknown) {
  const fail = (step: number, message: string) => ({ step, message: `${message} No step ran.` })
  if (!isRecord(input) || !Array.isArray(input.steps) || !input.steps.length) {
    const given = Array.isArray(input) ? 'a list on its own' : isRecord(input) && ('ref' in input || 'action' in input) ? 'a step on its own' : quoted(input)
    return fail(0, `act takes { "steps": [${STEP_SHAPE}] }, not ${given}.`)
  }
  const extra = Object.keys(input).find(key => key !== 'steps')
  if (extra)
    return fail(0, `act takes "steps" and nothing else, not "${extra}".`)
  if (input.steps.length > MAX_STEPS)
    return fail(0, `act takes at most ${MAX_STEPS} steps in one call, not ${input.steps.length}. Split the task into calls.`)
  for (const [index, step] of (input.steps as unknown[]).entries()) {
    const at = `steps[${index}]`
    if (!isRecord(step))
      return fail(index, `${at} is ${quoted(step)}, not ${STEP_SHAPE}.`)
    const { ref, action, args } = step
    const unknown = Object.keys(step).find(key => key !== 'ref' && key !== 'action' && key !== 'args')
    if (unknown) {
      const given = step[unknown]
      return fail(index, `${at} has "${unknown}", which a step doesn't take: a step is ${STEP_SHAPE}.${args === undefined ? ` A value goes in "args", like "args": ${quoted(Array.isArray(given) ? given : [given])}.` : ''}`)
    }
    if (typeof ref !== 'string' || !ref.trim())
      return fail(index, `${at} needs a ref: a component's ref from snapshot, or its label.`)
    if (typeof action !== 'string' || !action)
      return fail(index, `${at}, on "${ref}", needs an action, like "press".`)
    if (args !== undefined && !Array.isArray(args))
      return fail(index, `${at} takes "args" as a list, like "args": ${quoted([args])}, not ${quoted(args)}.`)
    if ((SETTER.test(action) || action === 'expect') && args?.[0] === undefined)
      return fail(index, `${action} on "${ref}" needs ${action === 'expect' ? 'what to check' : 'its value'}, as "args": [value].`)
  }
  return undefined
}

function redact(entry: Entry, value: unknown, key = 'value') {
  return entry.secret && key !== 'open' && value !== '' && value != null && value !== false ? '[redacted]' : value
}

/** Every distinct `data-agent-confirm` sentence over the elements, so a person answers all that a change touches. */
const marksOf = (elements: (Element | undefined | null)[]) => [...new Set(elements.map(el => confirmOf([el])).filter((mark): mark is string => !!mark))]
const confirmsOf = (elements: (Element | undefined | null)[]) => marksOf(elements).join(' ') || undefined

const wire = (items: Item[]) => items.map(item => ({ value: keyOf(item.value), label: item.label }))

// A private list's items read without their labels on every path, and text never matches them.
const shownItems = (entry: Entry, items: Item[]) => (entry.secret ? wire(items).map(item => ({ ...item, label: '[redacted]' })) : wire(items))

// Each agent's `act` and `query` with a second `allow` beside its own, for `registerTools`.
export const allowing = new WeakMap<Agent, {
  act: (input: { steps: AgentStep[] }, allow: AgentAllow, signal?: AbortSignal) => Promise<AgentActResult>
  query: (input: AgentQuery, allow: AgentAllow, signal?: AbortSignal) => Promise<AgentComponent[] | { error: string }>
}>()

/**
 * The page's components for an AI agent, as three methods that are also its
 * tools, with the same names, input and output as `agentTools`: `snapshot`
 * lists what's there with its state, `query` finds components and list items,
 * and `act` runs steps through each component's own state, many in one go.
 *
 * Create it before `app.mount()`: it hears components as they're set up.
 * A step on an element inside `data-agent-confirm` needs a person: without
 * `allow` it fails, with `allow` it waits for the answer. Agents never see what
 * is inside `data-agent-hidden`, and values inside `data-agent-secret` (and
 * password fields) read `"[redacted]"`.
 *
 * @example
 * const agent = createAgent({ allow: step => (step.confirm ? window.confirm(step.confirm) : true) })
 * agent.snapshot() // [{ ref: "c1", component: "select", label: "Region", value: null, actions: ["setValue", "setOpen"] }]
 * await agent.act({ steps: [{ ref: "Region", action: "setValue", args: ["Frankfurt"] }, { ref: "Create", action: "press" }] })
 */
export function createAgent(options: AgentOptions = {}): Agent {
  install()

  // The refs an `act` call has had on the page, which its values may list.
  const shownInCall = new Set<string>()

  const scan = (): Found[] => {
    scanNative([...entries.values()].filter(entry => entry.alive))
    const found: Found[] = []
    for (const entry of [...entries.values()]) {
      if (!entry.alive)
        continue
      const parts = partsOf(entry)
      if (!parts.length)
        continue
      remember(entry, parts)
      if (entry.offLimits || !parts.some(part => isShown(part.el)))
        continue
      found.push({ entry, parts })
      entry.shown = true
      shownInCall.add(entry.ref)
    }
    return found.sort((a, b) => byPosition(anchorOf(a.parts), anchorOf(b.parts)))
  }

  // The components on the page, read once until the code next waits: names and rows walk the page.
  let scanned: Found[] | undefined
  let destroyed = false
  const live = () => {
    if (!scanned) {
      scanned = scan()
      queueMicrotask(() => (scanned = undefined))
    }
    return scanned
  }
  const fresh = <T>(call: () => T) => {
    try {
      return asAgent(call)
    }
    finally {
      scanned = undefined
    }
  }

  const stateOf = (entry: Entry) => {
    try {
      return entry.adapter.state(entry.source)
    }
    catch {
      return {}
    }
  }
  const isOpen = (entry: Entry) => stateOf(entry).open === true

  // Open popups, in the order they stack, and the modal ones among them: what a modal covers takes nothing from a person.
  const layers = () => {
    const open = live()
      .map(({ entry }) => ({ entry, content: isOpen(entry) ? entry.adapter.content?.(entry.source) : undefined }))
      .filter((layer): layer is { entry: Entry, content: HTMLElement } => !!layer.content)
      .sort((a, b) => byPosition(a.content, b.content))
    return open.map(layer => ({ ...layer, modal: !!layer.entry.adapter.modal?.(layer.entry.source) }))
  }
  const covered = (el: HTMLElement, stack: ReturnType<typeof layers>) =>
    !!el.closest('[inert], [data-aria-hidden]')
    || stack.some((layer, index) => layer.modal && !layer.content.contains(el) && !stack.slice(index + 1).some(above => above.content.contains(el)))
  const isInert = (parts: Part[], stack = layers()) => {
    const shown = parts.filter(part => isShown(part.el))
    return shown.length > 0 && shown.every(part => covered(part.el, stack))
  }
  const above = () => layers().filter(layer => layer.modal).at(-1)

  const own = (parts: Part[]) => parts.filter(part => part.slot !== 'item' && part.slot !== 'content').map(part => part.el)
  const buttonsOf = (entry: Entry, parts: Part[]) => {
    const content = parts.find(part => part.slot === 'content')?.el
    return content && isOpen(entry) ? buttonsIn([content]) : []
  }
  const itemsOf = (entry: Entry): Item[] | undefined => {
    const { adapter, source } = entry
    if (!adapter.items)
      return undefined
    try {
      return adapter.items(source)
    }
    catch {
      return []
    }
  }

  // A component whose own controls are all disabled on the page, like a switch inside a disabled fieldset.
  const controlsOff = (parts: Part[]) => {
    const controls = parts.filter(part => part.slot === 'root' || part.slot === 'control' || part.slot === 'input')
    return controls.length > 0 && controls.every(part => isDisabledElement(part.el))
  }

  function describe({ entry, parts }: Found, stack = layers()): AgentComponent {
    const { adapter, source } = entry
    const state = stateOf(entry)
    const out = { ref: entry.ref, component: adapter.component(source) } as AgentComponent
    if (entry.label)
      out.label = entry.label
    if (entry.row)
      out.row = entry.row
    for (const [key, value] of Object.entries(state))
      out[key] = redact(entry, value, key)
    const items = itemsOf(entry)
    if (items?.length) {
      if (items.length <= 10)
        out.items = shownItems(entry, items)
      else
        out.more = items.length
    }
    const text = parts.filter(part => part.slot === 'title' || part.slot === 'description').map(part => textOf(part.el)).filter(Boolean)
    if (text.length)
      out.text = text
    const confirm = confirmOf(own(parts))
    if (confirm)
      out.confirm = confirm
    const buttons = buttonsOf(entry, parts).map(textOrName).filter(Boolean)
    if (buttons.length)
      out.buttons = buttons
    let disabled = false
    try {
      disabled = adapter.disabled(source)
    }
    catch {}
    if (disabled || isInert(parts, stack) || controlsOff(parts))
      out.disabled = true
    out.actions = out.disabled ? [] : adapter.actions(source)
    return out
  }

  // Whether a step's action works on a component: one it lists, or a synonym of one.
  const can = (entry: Entry, action: string) => {
    const actions = entry.adapter.actions(entry.source)
    return actions.includes(action) || (Object.hasOwn(SYNONYMS, action) && SYNONYMS[action]!.some(of => actions.includes(of)))
  }

  const placed = ({ entry }: Found) => {
    const section = entry.sections?.at(-1)
    return section ? `${described(entry)} (in ${section})` : described(entry)
  }

  // A component by its ref, or by its label or row text, then an item it offers, then its kind.
  function find(ref: string, action?: string, where?: (found: Found) => boolean): Found {
    const shown = where ? live().filter(where) : live()
    const byRef = shown.find(({ entry }) => entry.ref === ref)
    if (byRef)
      return byRef
    const needle = fold(ref)
    const words = wordsOf(ref)
    const tiers = [
      shown.filter(({ entry }) => (entry.label && fold(entry.label) === needle) || (words.trim() && wordsOf(`${entry.label ?? ''} ${entry.row ?? ''}`).includes(words))),
      // A private list's item labels never name it: whether one matched would say what it holds.
      shown.filter(({ entry }) => !entry.secret && itemsOf(entry)?.some(item => fold(item.label) === needle)),
      shown.filter(({ entry }) => {
        const kind = fold(entry.adapter.component(entry.source))
        return kind === needle || kind.endsWith(`-${needle}`)
      }),
    ]
    for (const near of tiers) {
      if (near.length === 1)
        return near[0]!
      const able = action ? near.filter(({ entry }) => action === 'press' || action === 'expect' || can(entry, action)) : []
      const meant = able.length ? able : near
      if (meant.length === 1)
        return meant[0]!
      // An open popup is what the agent means while it's open, among labels that match alike.
      const exact = meant.filter(({ entry }) => entry.label && fold(entry.label) === needle)
      const open = meant.filter(({ entry }) => isOpen(entry))
      if (open.length === 1 && (!exact.length || exact.length === meant.length))
        return open[0]!
      // A label that matches exactly doesn't beat another component whose label or row holds the same words:
      // labels and rows are page text, which people other than the user can write.
      if (near.length > 1) {
        const section = near.map(({ entry }) => entry.sections?.at(-1)).find(Boolean)
        throw new Error(`"${ref}" names ${near.length} components: ${near.map(placed).join(', ')}. Use a ref${section ? `, or put its section first, like "${section} > ${ref}"` : ''}. A page tells them apart with a word in one label the other lacks, like a verb or the row's name.`)
      }
    }
    // What is off-limits is never matched, so naming it reads the same as a name that isn't on the page.
    const labels = [...new Set(shown.map(({ entry }) => entry.label).filter(Boolean))]
    const closed = shown.flatMap(({ entry }) => {
      if (!entry.adapter.reveals || entry.secret)
        return []
      const state = stateOf(entry)
      if (entry.source.kind === 'collapsible')
        return state.open ? [] : [`${entry.label ?? 'collapsible'} (${entry.ref})`]
      const held = Array.isArray(state.value) ? state.value : [state.value]
      const shut = (itemsOf(entry) ?? []).filter(item => !held.some(value => isEqual(value as any, item.value as any))).map(item => item.label)
      return shut.length ? [`${entry.label ?? entry.adapter.component(entry.source)} (${entry.ref}): ${shut.join(', ')}`] : []
    })
    const over = shown.some(({ parts }) => isInert(parts)) ? above() : undefined
    const buttons = over ? buttonsIn([over.content]).map(textOrName) : []
    const none = `No component "${ref}" on the page. Its labels: ${labels.slice(0, 30).join(', ') || 'none'}.`
    const cover = over ? ` ${nameFor(over.entry)} is open over the rest of the page${buttons.length ? `, with the buttons ${buttons.join(', ')}` : ''}: finish it or close it before a step on what it covers.` : ''
    throw notFound(`${none}${closed.length ? ` It may be behind one of these, which a step can open first: ${closed.join('; ')}.` : ''}${cover}`, `${none}${cover}`)
  }

  const shows = (ref: string, action?: string, where?: (found: Found) => boolean) => {
    try {
      find(ref, action, where)
      return true
    }
    catch {
      return false
    }
  }

  // `registerTools`' own `allow`, and the signal of the running call.
  let callerAllow: AgentAllow | undefined
  let callerSignal: AbortSignal | undefined
  let refusedBy: AgentAllow | undefined

  async function allowed(step: AgentAction) {
    const checks = [options.allow, callerAllow].filter((check): check is AgentAllow => !!check)
    if (!checks.length)
      return true
    const controller = new AbortController()
    const wait = options.timeout ?? 300_000
    let timer: ReturnType<typeof setTimeout> | undefined
    const late = new Promise<'late'>(resolve => (timer = setTimeout(resolve, wait, 'late')))
    const cancelled = new Promise<'cancelled'>((resolve) => {
      if (callerSignal?.aborted)
        resolve('cancelled')
      callerSignal?.addEventListener('abort', () => resolve('cancelled'), { once: true })
    })
    const answer = async () => {
      for (const check of checks) {
        if (controller.signal.aborted)
          return false
        if (!(await check(step, { signal: controller.signal }))) {
          refusedBy = check
          return false
        }
      }
      return true
    }
    try {
      const ok = await Promise.race([answer(), late, cancelled])
      if (typeof ok === 'boolean')
        return ok
      controller.abort()
      throw new Error(ok === 'cancelled' ? `${step.action} on ${step.ref} was cancelled.` : `No answer to ${step.action} on ${step.ref} in ${Math.round(wait / 1000)} seconds.`)
    }
    finally {
      clearTimeout(timer)
    }
  }

  // Closed places a component can be behind: a tab list's other tabs, an accordion's closed sections, a closed collapsible.
  interface Place { ref: string, item: { value: unknown, label: string }, swaps: boolean }
  const places = (known?: Set<string>): Place[] =>
    live().flatMap(({ entry, parts }) => {
      if (!entry.adapter.reveals || known?.has(entry.ref) || entry.adapter.disabled(entry.source) || controlsOff(parts) || isInert(parts))
        return []
      const state = stateOf(entry)
      if (entry.source.kind === 'collapsible')
        return state.open ? [] : [{ ref: entry.ref, item: { value: true, label: entry.label ?? 'collapsible' }, swaps: false }]
      const held = Array.isArray(state.value) ? state.value : [state.value]
      const swaps = !Array.isArray(state.value)
      return (itemsOf(entry) ?? [])
        .filter(item => !item.disabled && !held.some(value => isEqual(value as any, item.value as any)))
        .map(item => ({ ref: entry.ref, item: { value: item.value, label: item.label }, swaps }))
    })

  // Opens a place once `allow` lets it, and returns how it goes back.
  async function enter({ ref, item, swaps }: Place) {
    const holder = live().find(({ entry }) => entry.ref === ref)
    if (!holder)
      return undefined
    const { entry } = holder
    const { adapter, source } = entry
    const before = stateOf(entry)
    const itemEl = itemsOf(entry)?.find(other => isEqual(other.value as any, item.value as any))?.el
    // A swap also closes the tab it leaves.
    const leaving = swaps ? itemsOf(entry)?.find(other => isEqual(other.value as any, before.value as any))?.el : undefined
    // Looking opens nothing a person must approve: a marked place, or a marked tab it would leave, takes a step of its own.
    if (confirmOf([...own(holder.parts), itemEl, leaving]))
      return undefined
    const collapsible = source.kind === 'collapsible'
    const action = collapsible ? 'setOpen' : swaps ? 'setValue' : 'open'
    const step: AgentAction = { ref, component: adapter.component(source), label: entry.label, action, args: [item.value] }
    if (!(await allowed(step)) || !entry.alive)
      return undefined
    const go = () => adapter.run(source, action, [item.value])
    const back = () => (collapsible ? adapter.run(source, 'setOpen', [false]) : swaps ? adapter.run(source, 'setValue', [before.value]) : adapter.run(source, 'close', [item.value]))
    const shut = () => {
      const now = stateOf(entry)
      return collapsible ? now.open !== true : !differs(before.value, now.value)
    }
    await fresh(go)
    await frames()
    for (let tries = 0; tries < PATIENCE && shut() && !callerSignal?.aborted; tries++)
      await frames()
    scanned = undefined
    if (shut())
      return undefined
    return async () => {
      await fresh(back)
      await frames()
      // The same wait going back, or the next place would go back to this one.
      for (let tries = 0; tries < PATIENCE && !shut() && !callerSignal?.aborted; tries++)
        await frames()
      scanned = undefined
      if (!shut())
        throw new Error(`${nameFor(entry)} didn't go back to how it was after a look behind it: it is ${JSON.stringify(redact(entry, collapsible ? stateOf(entry).open : stateOf(entry).value) ?? null)} now. Nothing else was opened.`)
    }
  }

  // What each closed place a call looked behind holds, by its path, like "Notifications > Email".
  const held = new Map<string, string[]>()
  let surveyed = false
  let partial = false
  let noted: AgentComponent[] | undefined

  // Every way to what `look` finds through closed places. Tabs only when no section has it.
  async function behind(look: () => boolean, known?: Set<string>, left = { tries: REACH }, trail: string[] = []): Promise<Place[][]> {
    const ways: Place[][] = []
    const before = new Set(live().map(({ entry }) => entry.ref))
    const closed = places(known)
    for (const swaps of [false, true]) {
      for (const place of closed.filter(place => place.swaps === swaps)) {
        if (left.tries-- <= 0 || callerSignal?.aborted) {
          partial = true
          break
        }
        const back = await enter(place)
        if (!back) {
          partial = true
          continue
        }
        try {
          const path = [...trail, place.item.label]
          const brought = live().filter(({ entry, parts }) => !before.has(entry.ref) && !isInert(parts))
          partial ||= !brought.length
          held.set(path.join(' > '), brought.flatMap(({ entry }) => entry.label ?? []))
          noted?.push(...brought.map(found => ({
            ...describe(found),
            offPage: true,
            section: (found.entry.sections?.length ? found.entry.sections : path).join(' > '),
          })))
          if (look()) {
            ways.push([place])
          }
          else if (!known) {
            const inner = await behind(look, before, left, path)
            ways.push(...inner.map(way => [place, ...way]))
          }
        }
        finally {
          await back()
        }
      }
      if (ways.length)
        break
    }
    surveyed ||= !known && !ways.length
    return ways
  }

  async function outline() {
    if (!surveyed)
      await behind(() => false)
    const lines = [...held]
      .filter(([, labels]) => labels.length)
      .map(([place, labels]) => `${place}: ${labels.slice(0, 8).join(', ')}${labels.length > 8 ? ` and ${labels.length - 8} more` : ''}`)
    return lines.length ? ` Behind what is closed: ${lines.join('. ')}.` : ''
  }

  // A name with where it is before it, like "Email > Deploy failures".
  const scoped = (ref: string) => {
    const names = ref.split('>').map(name => name.trim())
    const name = names.pop()!
    const words = wordsOf(names.join(' ')).trim().split(' ')
    if (!name || !words[0])
      return undefined
    return {
      name,
      place: names.join(' > '),
      within: (found: Found) => {
        const around = wordsOf((found.entry.sections ?? []).join(' '))
        if (words.every(word => around.includes(` ${word} `)))
          return true
        const kind = fold(names.join(' '))
        return live().some(({ entry, parts }) =>
          entry !== found.entry
          && (fold(entry.adapter.component(entry.source)) === kind || fold(entry.adapter.component(entry.source)).endsWith(`-${kind}`) || words.every(word => wordsOf(entry.label ?? '').includes(` ${word} `)))
          && parts.some(({ el }) => found.parts.some(part => el !== part.el && el.contains(part.el))),
        )
      },
    }
  }

  // `find`, then behind closed places, where the one way to the component opens again.
  async function reveal(ref: string, action?: string) {
    const scope = scoped(ref)
    const whole = scope && ((found: Found) => fold(found.entry.label ?? '') === fold(ref))
    try {
      return find(ref, action, whole)
    }
    catch (missing) {
      if (!unfound.has(missing as Error))
        throw missing
      const name = scope?.name ?? ref
      if (scope) {
        try {
          return find(name, action, scope.within)
        }
        catch (outside) {
          if (!unfound.has(outside as Error))
            throw outside
        }
      }
      const usable = (found: Found) => !isInert(found.parts) && (scope?.within(found) ?? true)
      const [way, ...others] = await behind(() => shows(name, action, usable))
      const named = (way: Place[]) => way.map(place => place.item.label).join(' > ')
      if (way && others.length)
        throw new Error(`"${name}" is in ${others.length + 1} closed sections: ${[way, ...others].map(named).join(', ')}. Put the one you mean first, like "${way.at(-1)!.item.label} > ${name}".`)
      if (!way) {
        if (scope)
          throw wrongGuess(`No "${name}" in a section or tab named like "${scope.place}".`)
        throw partial ? missing : notFound(unfound.get(missing as Error)!)
      }
      const backs: (() => Promise<void>)[] = []
      const restore = async () => {
        for (const back of backs)
          await back()
      }
      let found: Found & { restore?: () => Promise<void> }
      try {
        for (const place of way) {
          const back = await enter(place)
          if (back)
            backs.unshift(back)
        }
        found = find(name, action, usable)
      }
      catch (gone) {
        // What it opened goes back when what it came for is gone.
        await restore()
        throw gone
      }
      // A check changes nothing, so what it opened to look closes again.
      if (action === 'expect')
        found.restore = restore
      return found
    }
  }

  // A list's items: from its data, or, for one whose items show only while it's open, by opening it for a moment.
  async function listItems(entry: Entry, beforeOpen?: () => Promise<unknown>) {
    const { adapter, source } = entry
    let items = itemsOf(entry) ?? []
    if (adapter.itemsWhileOpen && !items.length && beforeOpen && !isOpen(entry)) {
      await beforeOpen()
      fresh(() => adapter.run(source, 'setOpen', [true]))
      items = itemsOf(entry) ?? []
      for (let tries = 0; tries < 30 && !items.length; tries++) {
        await frames()
        items = itemsOf(entry) ?? []
      }
      fresh(() => adapter.run(source, 'setOpen', [false]))
      await frames()
    }
    return items
  }

  // A press: the button by its text inside the component, or the component's own button or trigger.
  async function pressing(found: Found, text: string | undefined, beforeOpen: () => Promise<unknown>) {
    const { entry } = found
    const { adapter, source } = entry
    const opens = adapter.keys.includes('open')
    const match = () => {
      const parts = partsOf(entry)
      const buttons = buttonsOf(entry, parts)
      const self = source.native ?? (opens ? parts.find(part => part.slot === 'trigger')?.el : undefined)
      if (text === undefined)
        return { buttons, button: self }
      const all = self && source.native ? [self, ...buttons] : buttons
      const needle = fold(text)
      const words = wordsOf(text)
      const exact = all.filter(el => fold(textOrName(el)) === needle)
      const near = all.filter(el => words.trim() && wordsOf(textOrName(el)).includes(words))
      const matches = exact.length ? exact : near
      if (matches.length > 1)
        throw new Error(`"${text}" names ${matches.length} buttons in ${entry.ref}. Use the whole text of one.`)
      return { buttons: all, button: matches[0] }
    }
    let result = match()
    let opened = false
    const close = async () => {
      fresh(() => adapter.run(source, 'setOpen', [false]))
      await frames()
    }
    if (!result.button && text !== undefined && opens && !isOpen(entry)) {
      await beforeOpen()
      opened = true
      fresh(() => adapter.run(source, 'setOpen', [true]))
      result = match()
      for (let tries = 0; tries < 60 && !result.button; tries++) {
        await frames()
        result = match()
      }
      if (!result.button)
        await close()
    }
    const { buttons, button } = result
    if (!button)
      throw wrongGuess(`No button "${text}" in ${entry.ref}. Buttons: ${buttons.map(textOrName).join(', ') || 'none'}.`)
    if (button.matches(':disabled') || button.getAttribute('aria-disabled') === 'true' || button.hasAttribute('data-disabled')) {
      if (opened)
        await close()
      throw new Error(`"${textOrName(button)}" in ${entry.ref} is disabled now.`)
    }
    return { button, opened, close, pressed: `Pressed "${textOrName(button)}"` }
  }

  // Just before a step commits, after any wait on `allow`: the same target is still there, still the agent's,
  // not behind what opened meanwhile, and the answer was about what it does now.
  function stillThere(entry: Entry, elements: (Element | undefined | null)[], approved: string | undefined, shown: Element[]) {
    const els = elements.filter((el): el is Element => !!el)
    if (!entry.alive || shown.some(el => !el.isConnected))
      throw new Error(`${nameFor(entry)} left the page while the step waited for an answer.`)
    const now = partsOf(entry)
    if (isOffLimits([...els, ...now.map(part => part.el)]))
      throw new Error(`${entry.ref} isn't available to agents now.`)
    if (isInert(now))
      throw new Error(`${nameFor(entry)} is behind what opened while the step waited. Finish that or close it first.`)
    if (confirmsOf(els) !== approved)
      throw new Error(`What ${nameFor(entry)} does changed while the step waited for an answer. Run the step again.`)
  }

  // The items an action puts in or takes out of a list's value, like the sections `openAll` opens or `closeAll` shuts.
  // The all-at-once actions leave disabled items as they are, as the component does.
  function changedBy(value: unknown, action: string, arg: unknown, items: Item[]): Item[] {
    const list = (v: unknown) => (Array.isArray(v) ? v : v == null || v === '' ? [] : [v])
    const has = (values: unknown[], v: unknown) => values.some(other => isEqual(other as any, v as any))
    const held = list(value)
    const all = action === 'openAll' || action === 'closeAll'
    const next = action === 'setValue'
      ? list(arg)
      : action === 'open' || (action === 'toggle' && !has(held, arg))
        ? [...held, arg]
        : action === 'close' || action === 'toggle'
          ? held.filter(v => !isEqual(v as any, arg as any))
          : action === 'openAll'
            ? [...held, ...items.filter(item => !item.disabled).map(item => item.value)]
            : action === 'closeAll' || action === 'clear' ? [] : held
    return items.filter(item => has(held, item.value) !== has(next, item.value) && !(all && item.disabled))
  }

  // An `expect`: the component's value, that value's label or its row text is what the step says.
  function check({ entry }: Found, args: unknown[]) {
    const state = stateOf(entry)
    const key = fieldKey(stateKeys(entry, state))
    const value = key ? state[key] : undefined
    if (redact(entry, value) !== value)
      throw new Error(`${nameFor(entry)} is private, so expect can't check it.`)
    const shown = itemsOf(entry)?.find(item => isEqual(item.value as any, value as any))?.label
    const words = typeof args[0] === 'string' ? wordsOf(args[0]) : ''
    const onRow = !!words.trim() && wordsOf(`${entry.label ?? ''} ${entry.row ?? ''}`).includes(words)
    const fits = !!key && (sameValue(value, args[0]) || (shown !== undefined && sameValue(shown, args[0])))
    if (!fits && !onRow) {
      const now = words && entry.row ? entry.row : key ? value : entry.row
      throw new Error(`${nameFor(entry)} is ${JSON.stringify(now ?? null)}, not ${JSON.stringify(args[0])}.`)
    }
    return { ref: entry.ref, result: null }
  }

  // Runs one step as the agent, once `allow` lets it, and waits for the page to render it.
  async function perform(ref: string, action: string, args: unknown[], onFound?: () => void) {
    const found = await reveal(ref, action)
    onFound?.()
    const { entry, parts } = found
    const { adapter, source } = entry
    if (action === 'expect') {
      try {
        return check(found, args)
      }
      finally {
        await (found as { restore?: () => Promise<void> }).restore?.()
      }
    }
    if (isInert(parts)) {
      const over = above()?.entry
      throw new Error(`${nameFor(entry)} is behind ${over ? `${nameFor(over)}, which is open` : 'what is open'}. Finish that or close it first.`)
    }
    const component = describe(found)
    const { actions, disabled } = component
    // A step that names a section or tab with no value means that one, like { ref: "Email", action: "open" }.
    if (adapter.reveals && source.kind !== 'collapsible') {
      const label = action === 'press' && typeof args[0] === 'string' ? args[0] : !args.length && fold(entry.label ?? '') !== fold(ref) ? (scoped(ref)?.name ?? ref) : undefined
      const named = (itemsOf(entry) ?? []).filter(item => label !== undefined && fold(item.label) === fold(label))
      if (named.length === 1) {
        args = [named[0]!.value]
        if (action === 'press' || !can(entry, action))
          action = Array.isArray(stateOf(entry).value) ? 'open' : 'setValue'
      }
    }
    if (action === 'click' || (action === 'setValue' && typeof args[0] === 'string' && actions.includes('press') && !can(entry, action)))
      action = 'press'
    if (action === 'select')
      action = 'setValue'
    // Every step asks once, with what it changes and the mark on it, if any.
    const asked = new Set<string>()
    const ask = async (stepArgs: unknown[], targets: (Element | undefined)[], what: string) => {
      const confirm = confirmsOf(targets)
      const key = JSON.stringify([stepArgs, confirm ?? null])
      if (asked.has(key))
        return
      const step: AgentAction = { ref: entry.ref, component: component.component, label: entry.label, action, args: stepArgs }
      if (confirm)
        step.confirm = confirm
      if (confirm && !options.allow && !callerAllow)
        throw new Error(`Needs a person: "${confirm}". Ask them to ${what} themselves.`)
      if (!(await allowed(step)))
        throw new Error(confirm && refusedBy === options.allow ? `The person said no to "${confirm}".` : `The app refused ${action} on ${entry.ref}.`)
      asked.add(key)
    }
    if (action === 'press') {
      if (!actions.includes('press'))
        throw new Error(`${component.component} ${entry.ref} has nothing to press now.${disabled ? ' It is disabled.' : ''}`)
      const text = typeof args[0] === 'string' ? args[0] : undefined
      const press = await pressing(found, text, () => ask(args, own(parts), `press "${text}"`))
      try {
        const targets = [press.button, ...own(parts)]
        const approved = confirmsOf(targets)
        const shown = targets.filter(el => el.isConnected)
        await ask(args, targets, `press "${textOrName(press.button)}"`)
        stillThere(entry, targets, approved, shown)
        if (isDisabledElement(press.button))
          throw new Error(`"${textOrName(press.button)}" in ${entry.ref} is disabled now.`)
      }
      catch (refused) {
        if (press.opened)
          await press.close()
        throw refused
      }
      agentWindow.open = true
      agentWindow.action = 'press'
      try {
        fresh(() => press.button.click())
        await frames()
        await frames()
      }
      finally {
        agentWindow.open = false
      }
      const pressed = press.opened ? `${press.pressed}, after opening ${entry.ref}` : press.pressed
      const closed = adapter.keys.includes('open') && entry.alive && !isOpen(entry)
      return { ref: entry.ref, result: `${pressed}${closed && press.opened ? `. ${entry.ref} is closed now.` : '.'}` }
    }
    if (disabled || !can(entry, action)) {
      throw new Error(`${component.component} ${entry.ref} takes no ${action} now. It takes: ${actions.join(', ') || 'nothing'}.${actions.includes('press') ? ' press takes the text of a button inside it, and opens it first to find the button.' : ''}`)
    }
    const state = stateOf(entry)
    // Only a choice needs a closed list's items, so nothing else opens it to look.
    const items = adapter.items ? await listItems(entry, action === 'setValue' ? () => ask(args, own(parts), 'make this change') : undefined) : undefined
    // A private list's items are never listed in an error: its snapshot gives their values.
    const noItem = (value: unknown, list: Item[]) => entry.secret
      ? `No item ${JSON.stringify(value)} in ${nameFor(entry)}. Its items are private: use a value from its snapshot.`
      : `No item ${JSON.stringify(value)} in ${nameFor(entry)}. Its items: ${list.slice(0, 20).map(item => item.label).join(', ') || 'none'}${list.length > 20 ? ', …' : ''}.`
    const itemFor = (value: unknown) => {
      if (!items)
        return { value }
      const byValue = items.find(item => isEqual(item.value as any, value as any) || keyOf(item.value) === keyOf(value))
      if (byValue)
        return byValue
      if (typeof value === 'string' && !entry.secret) {
        const byLabel = items.filter(item => fold(item.label) === fold(value))
        if (byLabel.length > 1)
          throw new Error(`"${value}" names ${byLabel.length} items in ${nameFor(entry)}: ${byLabel.map(item => keyOf(item.value)).join(', ')}. Use a value.`)
        if (byLabel.length === 1)
          return byLabel[0]!
      }
      if (adapter.closed && (items.length || adapter.itemsWhileOpen))
        throw wrongGuess(noItem(value, items))
      return { value }
    }
    const takesItem = ['setValue', 'open', 'close', 'toggle'].includes(action) && !!items && !adapter.keys.includes('checked') && !adapter.keys.includes('pressed')
    let chosen: (Item | { value: unknown })[] = []
    if (takesItem && !(source.kind === 'collapsible' || ((action === 'open' || action === 'close' || action === 'toggle') && adapter.keys.includes('open') && !adapter.reveals))) {
      if (action !== 'setValue' && args[0] === undefined && Array.isArray(state.value))
        throw new Error(`${action} on ${nameFor(entry)} takes one of its items${entry.secret ? ', by value' : `: ${items!.map(item => item.label).join(', ') || 'none'}`}.`)
      const values = Array.isArray(args[0]) ? args[0] : [args[0]]
      // A hidden item reads as no item at all, so a guess can't learn it's there.
      const hidden = values.find(value => hiddenItem(source, value))
      if (hidden !== undefined)
        throw wrongGuess(noItem(hidden, items ?? []))
      chosen = args[0] == null || args[0] === '' ? [] : values.map(itemFor)
      const blocked = chosen.find(item => 'disabled' in item && item.disabled && !(Array.isArray(state.value) ? state.value : [state.value]).some(v => isEqual(v as any, item.value as any)))
      if (blocked)
        throw new Error(`"${(blocked as Item).label}" in ${nameFor(entry)} is disabled now.`)
      const picked = chosen.map(item => item.value)
      args = [Array.isArray(args[0]) || (action === 'setValue' && Array.isArray(state.value) && args[0] != null) ? picked : picked[0] ?? args[0], ...args.slice(1)]
    }
    // Numbers, for a slider or a number field, from text like "90"; never past their range.
    const numeric = source.kind === 'number-field' || typeof state.min === 'number' || typeof state.max === 'number' || typeof state.value === 'number' || (Array.isArray(state.value) && source.kind === 'slider')
    if (action === 'setValue' && numeric) {
      const toNumber = (value: unknown) => {
        const number = typeof value === 'string' && value.trim() ? Number(value) : value
        if (typeof number !== 'number' || Number.isNaN(number))
          throw new Error(`${component.component} ${entry.ref} takes a number, not ${quoted(value)}.`)
        return number
      }
      // A field with one number takes one, even from a list of one, like [30].
      const scalar = source.kind !== 'slider'
      if (scalar && Array.isArray(args[0]) && args[0].length !== 1)
        throw new Error(`setValue on ${nameFor(entry)} takes one number, not ${quoted(args[0])}.`)
      const numbers = (Array.isArray(args[0]) ? args[0] : [args[0]]).map(toNumber)
      const { min, max } = state as { min?: number, max?: number }
      const low = typeof min === 'number' && Number.isFinite(min)
      const high = typeof max === 'number' && Number.isFinite(max)
      const outside = numbers.find(value => (low && value < min!) || (high && value > max!))
      if (outside !== undefined)
        throw new Error(`setValue on ${nameFor(entry)} takes a number ${low && high ? `from ${min} to ${max}` : low ? `of ${min} or more` : `of ${max} or less`}, not ${outside}.`)
      args = [Array.isArray(args[0]) && !scalar ? numbers : numbers[0], ...args.slice(1)]
    }
    if (BOOLEAN_SETTER.test(action) && typeof args[0] !== 'boolean')
      throw new Error(`${action} on ${nameFor(entry)} takes true or false, not ${quoted(args[0])}.`)
    // Replacing a value also asks about the items it takes out or closes, so dropping a marked choice needs a person too.
    const affects = items && (takesItem || action === 'openAll' || action === 'closeAll' || action === 'clear')
    const removing = (value: unknown, list: Item[]) => (affects ? changedBy(value, action, args[0], list).map(item => keyOf(item.value)).sort() : [])
    const removed = affects ? changedBy(state.value, action, args[0], items!) : []
    const stuck = removed.find(item => item.disabled)
    if (stuck)
      throw new Error(`"${stuck.label}" in ${nameFor(entry)} is disabled now.`)
    // Closing a popup any other way skips what pressing a marked button in it would ask.
    const closing = adapter.keys.includes('open') && !!adapter.content && isOpen(entry)
      && ((action === 'setOpen' && args[0] === false) || action === 'close' || action === 'toggle')
    const inside = closing ? buttonsIn([adapter.content!(source)].filter((el): el is HTMLElement => !!el)) : []
    const targets = [...own(parts), ...chosen.map(item => ('el' in item ? item.el : undefined)), ...removed.map(item => item.el), ...inside]
    const approved = confirmsOf(targets)
    // Only the marks the person was shown are approved: an item that gains another stops the change.
    const marks = new Set(marksOf(targets))
    // A closed list's items aren't on the page; what was is checked again after the answer.
    const shown = targets.filter((el): el is HTMLElement => !!el?.isConnected)
    await ask(args, targets, 'make this change')
    stillThere(entry, targets, approved, shown)
    // What the change takes out is worked out again from the value now: one that grew while it waited wasn't asked about.
    const current = itemsOf(entry)
    if (affects && JSON.stringify(removing(stateOf(entry).value, current?.length ? current : items!)) !== JSON.stringify(removing(state.value, items!)))
      throw new Error(`${nameFor(entry)} changed while the step waited for an answer, so this change would take out more than was asked. Run the step again.`)
    // Each later toggle of one change checks its item's mark, which an earlier toggle can add.
    const guard = (value: unknown) => {
      const el = (itemsOf(entry) ?? []).find(item => isEqual(item.value as any, value as any))?.el
      const mark = confirmOf([el])
      // An item an earlier toggle hid stops the change, the way one hidden from the start never starts it.
      if ((el && isOffLimits([el])) || hiddenItem(source, value))
        throw new Error(`An item of ${nameFor(entry)} isn't available to agents now. The change stopped there.`)
      if (mark && !marks.has(mark))
        throw new Error(`An item of ${nameFor(entry)} needs a person now: "${mark}". The change stopped there. Run the step again to ask.`)
    }
    const setKey = SETTER.test(action) ? action[3]!.toLowerCase() + action.slice(4) : undefined
    const was = setKey ? state[setKey] : undefined
    agentWindow.open = true
    agentWindow.action = action
    try {
      try {
        await fresh(() => adapter.run(source, action, args, guard))
      }
      catch (error) {
        throw entry.secret ? new Error(`${action} on ${nameFor(entry)} failed: [redacted]`) : error
      }
      await frames()
      // A parent can take a controlled value after work of its own, so one that stays gets about a second.
      const stays = () => {
        if (entry.secret || !setKey)
          return false
        const now = stateOf(entry)[setKey]
        // A number the component moves to its step is told below; anything else must end at what was asked.
        return numeric ? !differs(was, now) && !sameValue(now, args[0]) : !sameValue(now, args[0])
      }
      for (let tries = 0; tries < PATIENCE && stays() && !callerSignal?.aborted; tries++)
        await frames()
      if (stays())
        throw new Error(`${action} on ${nameFor(entry)} didn't take: it is still ${JSON.stringify(redact(entry, stateOf(entry)[setKey!]) ?? null)}.`)
    }
    finally {
      agentWindow.open = false
    }
    // A number the component moved, like a slider's to its nearest step, isn't the one asked for.
    if (setKey && numeric && !entry.secret) {
      const now = stateOf(entry)[setKey]
      const asked = [args[0]].flat() as number[]
      const took = [now].flat() as number[]
      if (took.length === asked.length && asked.some((value, at) => Math.abs(took[at]! - value) > 1e-9 * Math.max(1, Math.abs(value)))) {
        const step = stateOf(entry).step
        throw new Error(`${action} on ${nameFor(entry)} took ${JSON.stringify(now)}, not ${JSON.stringify(args[0])}${typeof step === 'number' ? `: it moves in steps of ${step}` : ''}. It is ${JSON.stringify(now)} now.`)
      }
    }
    return { ref: entry.ref, result: null }
  }

  // Every instance's state, so what a call changed can be told.
  const capture = () => {
    const found = live()
    const shown = new Set(found.map(({ entry }) => entry.ref))
    const names = new Map(found.map(({ entry }) => [entry.ref, { component: entry.adapter.component(entry.source), label: entry.label, row: entry.row }]))
    const states = new Map<string, Record<string, unknown>>()
    for (const entry of entries.values()) {
      if (entry.alive)
        states.set(entry.ref, { ...stateOf(entry) })
    }
    return { shown, states, names }
  }
  type Captured = ReturnType<typeof capture>

  const named = (before: Captured, refs: string[]) =>
    refs.length > 10
      ? refs
      : refs.map((ref) => {
          const name = before.names.get(ref)
          const label = [name?.label, name?.row].filter(Boolean).join(', ')
          return label ? `${ref} ${label}` : ref
        })

  // Components with one name, like a switch under Email and one under Slack, each with where it is.
  const apart = (components: AgentComponent[]) => {
    const name = (component: AgentComponent) => `${component.component}|${component.label}|${component.row}`
    const names = components.map(name)
    return components.map((component) => {
      const sections = (component.section as string | undefined)?.split(' > ') ?? entries.get(component.ref)?.sections ?? placeOf.get(component)
      return sections?.length && (component.offPage || names.indexOf(name(component)) !== names.lastIndexOf(name(component)))
        ? { ...component, section: sections.join(' > ') }
        : component
    })
  }

  // Each field's value, on the page or remembered, so an agent checks its work without calling `snapshot`.
  const values = (before: Captured, touched: Set<string>) => {
    const fields: { ref: string, label: string, section?: string, value: unknown, first: boolean }[] = []
    const listed = new Set<string>()
    for (const { entry } of live()) {
      const state = stateOf(entry)
      const key = fieldKey(stateKeys(entry, state))
      if (!key || state.open)
        continue
      const was = before.states.get(entry.ref)
      listed.add(entry.ref)
      fields.push({ ref: entry.ref, label: entry.label ?? entry.adapter.component(entry.source), section: entry.sections?.at(-1), value: redact(entry, state[key] ?? null), first: touched.has(entry.ref) || !was || differs(was[key], state[key]) })
    }
    for (const component of offPage.values()) {
      const key = fieldKey(Object.keys(component))
      if (key && !listed.has(component.ref)) {
        listed.add(component.ref)
        fields.push({ ref: component.ref, label: component.label ?? component.component, section: placeOf.get(component)?.at(-1), value: component[key], first: touched.has(component.ref) })
      }
    }
    const kept = new Set(fields.filter(field => field.first))
    for (const field of fields) {
      if (kept.size < LIMIT)
        kept.add(field)
    }
    const out: Record<string, unknown> = {}
    for (const field of fields) {
      if (!kept.has(field))
        continue
      const alike = fields.some(other => other !== field && other.label === field.label)
      out[`${field.ref} ${alike && field.section ? `${field.section} > ${field.label}` : field.label}`] = field.value
    }
    if (fields.length > kept.size)
      out.more = fields.length - kept.size
    return out
  }

  // What changed since `before`: values, the components that came onto the page and the refs that left it.
  function since(before: Captured, skip?: string, listAppeared = true, found?: Captured) {
    const changes: AgentChange[] = []
    const after = live()
    for (const { entry } of after) {
      const was = before.states.get(entry.ref) ?? found?.states.get(entry.ref)
      if (!was)
        continue
      const state = stateOf(entry)
      for (const key of stateKeys(entry, state)) {
        if (differs(was[key], state[key]))
          changes.push({ component: entry.adapter.component(entry.source), label: entry.label, key, value: redact(entry, state[key], key) })
      }
      const name = before.names.get(entry.ref) ?? found?.names.get(entry.ref)
      if (name && entry.row !== name.row)
        changes.push({ component: entry.adapter.component(entry.source), label: entry.label, key: 'row', value: entry.row })
    }
    const shownAfter = new Set(after.map(({ entry }) => entry.ref))
    for (const ref of before.shown) {
      if (shownAfter.has(ref))
        continue
      const was = before.states.get(ref)
      const name = before.names.get(ref)
      if (was?.open === true && name)
        changes.push({ component: name.component, label: name.label, key: 'open', value: false })
      const last = offPage.get(ref)
      if (!last || !was || (skip && ref !== skip))
        continue
      for (const key of Object.keys(was)) {
        if (key in last && differs(was[key], last[key]))
          changes.push({ component: last.component, label: last.label, key, value: last[key] })
      }
    }
    const stack = layers()
    return {
      after,
      changes,
      appeared: listAppeared ? apart(after.filter(item => item.entry.ref !== skip && !before.shown.has(item.entry.ref)).map(item => describe(item, stack))) : [],
      gone: named(before, [...before.shown].filter(ref => !shownAfter.has(ref))),
    }
  }

  async function act(input: unknown): Promise<AgentActResult> {
    const invalid = malformed(input)
    const steps = invalid ? [] : (input as { steps: AgentStep[] }).steps
    scanned = undefined
    shownInCall.clear()
    const before = capture()
    const log: AgentActResult['steps'] = []
    const touched = new Set<string>()
    let error: AgentActResult['error'] = invalid
    for (const [index, step] of steps.entries()) {
      if (callerSignal?.aborted || destroyed) {
        error = { step: index, message: destroyed ? `This agent was destroyed before ${step.action} on ${step.ref}.` : `${step.action} on ${step.ref} was cancelled.` }
        break
      }
      held.clear()
      surveyed = false
      partial = false
      try {
        const prior = capture()
        // What the step brought onto the page to act on, like a switch in a section it opened, from when it found it.
        let found: Captured | undefined
        const { ref, result } = await perform(step.ref, step.action, step.args ?? [], () => (found = capture()))
        scanned = undefined
        touched.add(ref)
        const { changes, gone } = since(prior, ref, false, found)
        log.push({
          step: index,
          ref,
          ...(result !== null && result !== undefined && { result }),
          ...(changes.length && { changes }),
          ...(gone.length && { gone }),
        })
      }
      catch (thrown) {
        const rest = steps.length - index - 1
        let closed = ''
        try {
          closed = guessed.has(thrown as Error) ? await outline() : ''
        }
        catch {}
        error = {
          step: index,
          message: `${messageOf(thrown)}${closed}${index ? ' The steps before this one stay done.' : ''}${rest && !callerSignal?.aborted ? ` Send it again with the ${rest === 1 ? 'step' : `${rest} steps`} after it, ${rest + 1} steps in one call.` : ''}`,
        }
        break
      }
    }
    scanned = undefined
    const { after, appeared } = since(before)
    const stack = layers()
    const open = after.filter(({ entry }) => touched.has(entry.ref) && isOpen(entry)).map(item => describe(item, stack))
    return {
      ok: !error,
      ...(error && { error }),
      steps: log,
      ...(open.length ? { open } : {}),
      appeared,
      values: values(before, touched),
    }
  }

  const capped = (found: AgentComponent[]) => (found.length > LIMIT ? [...found.slice(0, LIMIT), moreOf(found.length - LIMIT)] : found)
  const matching = (items: { value: string, label: string }[], text?: string) => {
    const needle = text && fold(text)
    return needle ? items.filter(item => fold(item.label).includes(needle) || fold(item.value).includes(needle)) : items
  }
  const withItems = (component: AgentComponent, items: { value: string, label: string }[], from = 0): AgentComponent => {
    const { more: _, items: __, ...rest } = component
    const left = items.length - from - 50
    return { ...rest, items: items.slice(from, from + 50), ...(left > 0 && { more: left }) }
  }

  async function query({ text, within, kind, closed, from }: AgentQuery): Promise<AgentComponent[] | { error: string }> {
    scanned = undefined
    // A tool call's input is the model's, so its shape is checked before anything reads it.
    for (const [key, value] of Object.entries({ text, within, kind }) as [string, unknown][]) {
      if (value !== undefined && typeof value !== 'string')
        return { error: `query takes ${key} as text, not ${quoted(value)}.` }
    }
    if (closed !== undefined && typeof closed !== 'boolean')
      return { error: `query takes closed as true or false, not ${quoted(closed)}.` }
    if (!text && !within && !kind && !closed)
      return { error: 'query takes text, within, kind or closed. snapshot lists what is on the page.' }
    if (from !== undefined && (!within || !Number.isInteger(from) || from < 0))
      return { error: 'from goes with within and counts the items to skip, like { "within": "Country", "from": 50 }.' }
    // One list's items, even while it's closed when the component knows them. A query never opens a list.
    if (within) {
      try {
        const found = find(within)
        const items = shownItems(found.entry, itemsOf(found.entry) ?? [])
        const component = withItems(describe(found), found.entry.secret && text ? [] : matching(items, text), from)
        if (!items.length && found.entry.adapter.itemsWhileOpen && !isOpen(found.entry))
          component.note = `Its items show while it's open. act's setValue takes an item's label and opens ${found.entry.ref} to find it.`
        return [component]
      }
      catch (missing) {
        return { error: messageOf(missing) }
      }
    }
    const words = text ? wordsOf(text) : undefined
    const ofKind = (component: AgentComponent) => !kind || component.component === kind || component.component.endsWith(`-${kind}`)
    const isNamed = (component: AgentComponent) => !words || (!!words.trim() && wordsOf(`${component.label ?? ''} ${component.row ?? ''}`).includes(words))
    const behindClosed: AgentComponent[] = []
    if (closed) {
      noted = behindClosed
      held.clear()
      try {
        await behind(() => false)
      }
      catch (stuck) {
        return { error: messageOf(stuck) }
      }
      finally {
        noted = undefined
      }
      scanned = undefined
    }
    const found: AgentComponent[] = []
    const stack = layers()
    for (const item of live()) {
      const component = describe(item, stack)
      if (!ofKind(component))
        continue
      if (isNamed(component)) {
        found.push(component)
      }
      else if (text && !item.entry.secret) {
        const items = matching(wire(itemsOf(item.entry) ?? []), text)
        if (items.length)
          found.push(withItems(component, items))
      }
    }
    const read = new Set(behindClosed.map(component => component.ref))
    const shown = new Set(found.map(component => component.ref))
    for (const component of [...behindClosed, ...[...offPage.values()].filter(component => !read.has(component.ref))]) {
      if (!shown.has(component.ref) && ofKind(component) && isNamed(component)) {
        shown.add(component.ref)
        found.push(component)
      }
    }
    return capped(apart(found))
  }

  // One `act` or `query` at a time, in the order they were called, so an agent can't press a confirm while it waits.
  let queue: Promise<unknown> = Promise.resolve()
  // A call still waiting when the bridge is destroyed never runs.
  const inTurn = <T>(run: () => Promise<T>) => {
    const next = queue.then(() => (destroyed ? Promise.reject(new Error('This agent was destroyed.')) : run()))
    queue = next.catch(() => {})
    return next
  }
  const askingToo = <T>(allow: AgentAllow | undefined, signal: AbortSignal | undefined, run: () => Promise<T>) =>
    inTurn(async () => {
      callerAllow = allow
      callerSignal = signal
      try {
        return await run()
      }
      finally {
        callerAllow = undefined
        callerSignal = undefined
        scanned = undefined
      }
    })

  const subscriptions = new Set<() => void>()
  const agent: Agent = {
    snapshot: () => {
      scanned = undefined
      const found = live()
      const stack = layers()
      const all = apart([...found.map(item => describe(item, stack)), ...offPage.values()])
      if (all.length <= LIMIT)
        return all
      const open = new Set(all.filter(component => component.open === true))
      const rest = all.filter(component => !open.has(component)).slice(0, LIMIT - open.size)
      const kept = new Set([...open, ...rest])
      return [...all.filter(component => kept.has(component)), moreOf(all.length - kept.size)]
    },
    act: (input, actOptions) => askingToo(undefined, actOptions?.signal, () => act(input)),
    query: input => inTurn(() => query(isRecord(input) ? input : {})),
    subscribe: (listener) => {
      if (destroyed)
        return () => {}
      // Its own listener in the registry, so the same callback on two bridges is two subscriptions.
      const stop = listen(change => listener(change))
      const unsubscribe = () => {
        subscriptions.delete(unsubscribe)
        stop()
      }
      subscriptions.add(unsubscribe)
      return unsubscribe
    },
    tools: agentTools,
    destroy: () => {
      if (!destroyed) {
        destroyed = true
        // Only this bridge's listeners go: another bridge on the page keeps its own.
        subscriptions.forEach(unsubscribe => unsubscribe())
        uninstall()
      }
    },
  }
  allowing.set(agent, {
    act: (input, allow, signal) => askingToo(allow, signal, () => act(input)),
    query: (input, allow, signal) => askingToo(allow, signal, () => query(isRecord(input) ? input : {})),
  })
  return agent
}
