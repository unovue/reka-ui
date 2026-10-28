import { ensureContextRoot } from './context'
import { fieldEntries } from './host'

/**
 * Set on an element while its part is not rendered (closed content, inactive tab,
 * …). Its value lists the attributes the element added for that state (`inert`,
 * `hidden`), so a `cloneNode()` copy can drop them.
 */
export const UNMOUNTED_ATTR = 'data-reka-unmounted'

const BASE_CSS = `[${UNMOUNTED_ATTR}]{display:none!important}`

const sheets = new WeakMap<Document, CSSStyleSheet>()
const prepared = new WeakSet<Document | ShadowRoot>()

function supportsAdoptedSheets(root: Document | ShadowRoot) {
  return 'adoptedStyleSheets' in root && typeof CSSStyleSheet === 'function' && 'replaceSync' in CSSStyleSheet.prototype
}

function removeEntries(data: FormData, name: string, dropped: (string | File)[]) {
  const kept = data.getAll(name)
  for (const value of dropped) {
    const index = kept.findIndex(entry => typeof value === 'string'
      ? entry === value
      : entry instanceof File && entry.name === value.name && entry.size === value.size)
    if (index !== -1)
      kept.splice(index, 1)
  }
  data.delete(name)
  for (const value of kept)
    data.append(name, value)
}

/**
 * A part that is not rendered keeps its light-DOM children (the consumer owns
 * them), where the Vue component would not render them at all. Fields inside one
 * are left out of the form's data, as if they were not there.
 */
function onFormData(event: Event) {
  const { formData } = event as FormDataEvent
  const form = event.target as HTMLFormElement
  const dropped = new Map<string, (string | File)[]>()
  for (const field of form.elements) {
    if (!field.closest(`[${UNMOUNTED_ATTR}]`))
      continue
    for (const [name, value] of fieldEntries(field)) {
      const values = dropped.get(name)
      if (values)
        values.push(value)
      else
        dropped.set(name, [value])
    }
  }
  for (const [name, values] of dropped)
    removeEntries(formData, name, values)
}

/**
 * Prepares the document or shadow root an element lives in, once:
 *
 * - the one rule elements need, hiding a part that is not rendered. `!important`
 *   wins over a consumer's `display` on the element, which `hidden` alone would not;
 * - leaving fields inside unrendered parts out of form data;
 * - (document) handing orphan elements to a provider defined later.
 */
export function ensureRootSetup(node: Node) {
  const root = node.getRootNode()
  if (!(root instanceof Document) && !(root instanceof ShadowRoot))
    return
  if (prepared.has(root))
    return
  prepared.add(root)
  const doc = root instanceof Document ? root : root.ownerDocument
  ensureContextRoot(doc)
  root.addEventListener('formdata', onFormData, true)
  if (supportsAdoptedSheets(root)) {
    let sheet = sheets.get(doc)
    if (!sheet) {
      sheet = new CSSStyleSheet()
      sheet.replaceSync(BASE_CSS)
      sheets.set(doc, sheet)
    }
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet]
    return
  }
  const style = doc.createElement('style')
  style.textContent = BASE_CSS
  if (root instanceof Document)
    root.head.append(style)
  else
    root.append(style)
}
