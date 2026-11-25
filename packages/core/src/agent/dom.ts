// What an agent reads from the page: text, accessible names, rows, sections,
// visibility and the `data-agent-*` marks an app writes on its elements.

/** Text that never reaches an agent: marked off-limits, hidden by the app, or not content. */
const UNREAD = '[data-agent-hidden], [aria-hidden="true"]:not([data-aria-hidden]), script, style, template, [hidden]'

/** Folds text for comparison: case, accents and `ß`, so "lodz" finds "Łódź". */
export function fold(text: string) {
  return text
    .replace(/[ßẞ]/g, 'ss')
    .replace(/ł/gi, 'l')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

/** Folded text as its words between single spaces, with one at each end, so a match lands on whole words. */
export function wordsOf(text: string) {
  return ` ${fold(text)} `.replace(/[^\p{L}\p{N}]+/gu, ' ')
}

const WHITESPACE = /\s+/
const squash = (text: string) => text.replace(/\s+/g, ' ').trim()

/** Visible text inside `el`, leaving out what is inside `skip` and anything an agent mustn't read. */
export function textOf(el: Element | null | undefined, skip: Element[] = []): string {
  if (!el || el.closest('[data-agent-hidden]'))
    return ''
  const words: string[] = []
  const walker = el.ownerDocument.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement
    if (!parent || (parent !== el && parent.closest(UNREAD) && el.contains(parent.closest(UNREAD))))
      continue
    if (skip.some(other => other !== el && other.contains(node)))
      continue
    if (node.textContent?.trim())
      words.push(node.textContent)
  }
  return squash(words.join(' '))
}

const NAMED_BY_CONTENT = 'button, a[href], summary, legend, h1, h2, h3, h4, h5, h6, [role=button], [role=tab], [role^=menuitem], [role=option], [role=radio], [role=switch], [role=checkbox], [role=link], [role=heading], [role=treeitem]'

function escapeAttr(value: string) {
  return value.replace(/["\\]/g, '\\$&')
}

/** The labels that name a field: its `labels`, a `label[for]` for a custom control, or the label around it. */
export function labelsOf(el: Element): Element[] {
  const own = (el as HTMLInputElement).labels
  if (own && own.length)
    return [...own]
  const found: Element[] = []
  if (el.id)
    found.push(...el.ownerDocument.querySelectorAll(`label[for="${escapeAttr(el.id)}"]`))
  if (!found.length) {
    const around = el.parentElement?.closest('label')
    if (around)
      found.push(around)
  }
  return found
}

/** An element's accessible name, the way a screen reader reads it, near enough for an agent to name it. */
export function nameOf(el: Element | null | undefined): string {
  if (!el || el.closest('[data-agent-hidden]'))
    return ''
  const doc = el.ownerDocument
  const labelledBy = el.getAttribute('aria-labelledby')
  if (labelledBy) {
    const text = squash(labelledBy.split(WHITESPACE).map(id => textOf(doc.getElementById(id))).join(' '))
    if (text)
      return text
  }
  const label = el.getAttribute('aria-label')?.trim()
  if (label)
    return label
  if (el.localName !== 'label') {
    const fromLabels = squash(labelsOf(el).map(label => textOf(label, [el])).join(' '))
    if (fromLabels)
      return fromLabels
  }
  if (el.localName === 'fieldset') {
    const legend = el.querySelector(':scope > legend')
    if (legend)
      return textOf(legend)
  }
  if (el.matches(NAMED_BY_CONTENT)) {
    const text = textOf(el)
    if (text)
      return text
  }
  return squash(el.getAttribute('title') ?? el.getAttribute('placeholder') ?? el.getAttribute('alt') ?? '')
}

/** A button's text, else its accessible name, like "Close" for an icon-only ×. */
export const textOrName = (el: Element) => textOf(el) || nameOf(el)

/** Whether an element shows, as far as the page can tell: connected, not hidden and not hidden from screen readers by the app. */
export function isShown(el: HTMLElement | undefined | null): el is HTMLElement {
  if (!el || !el.isConnected)
    return false
  if (el.closest('[hidden], [aria-hidden="true"]:not([data-aria-hidden])'))
    return false
  const check = (el as HTMLElement & { checkVisibility?: (options: object) => boolean }).checkVisibility
  if (typeof check === 'function' && !el.closest('[data-aria-hidden], [inert]'))
    return check.call(el, { visibilityProperty: true, checkVisibilityCSS: true })
  return true
}

/** Off-limits to agents: inside `data-agent-hidden`. */
export const isOffLimits = (elements: Element[]) => elements.some(el => !!el.closest('[data-agent-hidden]'))

const SECRET_FIELD = /\b(?:password|current-password|new-password|one-time-code|cc-[a-z-]+)\b/i

/** A password, card or one-time code, or a field inside `data-agent-secret`, which shows only whether it's filled. */
export function isSecret(elements: Element[]) {
  return elements.some(el =>
    !!el.closest('[data-agent-secret]')
    || SECRET_FIELD.test(`${el.getAttribute('type') ?? ''} ${el.getAttribute('autocomplete') ?? ''}`),
  )
}

/** What `data-agent-confirm` says a change does, from the nearest mark around any of the elements. */
export function confirmOf(elements: (Element | undefined | null)[]) {
  for (const el of elements) {
    const marked = el?.closest('[data-agent-confirm]')
    if (marked)
      return marked.getAttribute('data-agent-confirm')?.trim() || 'Confirm this change.'
  }
  return undefined
}

const ROW = 'li, tr, [role=row], [role=listitem]'

// A table's header row holds column titles, not a record.
function headerRow(row: Element) {
  return !!row.closest('thead')
    || (row.children.length > 0 && [...row.children].every(cell => cell.localName === 'th' || cell.getAttribute('role') === 'columnheader'))
}

/** Text on the component's row that isn't its own, like the name beside a member's menu. */
export function rowOf(anchor: HTMLElement | undefined, own: Element[]) {
  const row = anchor?.closest(ROW)
  if (!row || headerRow(row) || own.some(el => el.contains(row)))
    return undefined
  const mine = own.flatMap(el => [el, ...labelsOf(el)])
  const words: string[] = []
  const walker = row.ownerDocument.createTreeWalker(row, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement
    if (!parent || mine.some(el => el.contains(node)) || parent.closest(UNREAD))
      continue
    if (node.textContent?.trim())
      words.push(node.textContent.trim())
  }
  return squash(words.join(' ')).slice(0, 80) || undefined
}

const REGIONS = '[role=tabpanel], [role=region], [role=group], fieldset'

/** The names of the labelled regions around a component, outermost first, like `["Notifications", "Email"]`. */
export function sectionsOf(anchor: HTMLElement | undefined, own: Element[]) {
  const names: string[] = []
  let region = anchor?.parentElement?.closest(REGIONS)
  while (region) {
    const name = !own.includes(region) && nameOf(region).slice(0, 80)
    if (name)
      names.unshift(name)
    region = region.parentElement?.closest(REGIONS)
  }
  return names
}

/** Buttons and menu items inside elements, visible and not inside `data-agent-hidden`. */
export function buttonsIn(elements: HTMLElement[]) {
  const found = elements.flatMap(el => [...el.querySelectorAll<HTMLElement>('button, [role=button], [role^=menuitem], a[href]')])
  return [...new Set(found)].filter(el => isShown(el) && !el.closest('[data-agent-hidden]'))
}

export function isDisabledElement(el: Element) {
  return el.matches(':disabled') || el.getAttribute('aria-disabled') === 'true' || el.hasAttribute('data-disabled')
}

/** Document order, for listing components the way the page shows them. */
export function byPosition(a: Element | undefined, b: Element | undefined) {
  if (!a || !b || a === b)
    return 0
  return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
}
