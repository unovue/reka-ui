import type { InjectionKey, ObjectDirective } from 'vue'
import { inject, provide } from 'vue'

/** Called with the native `reset` event of the form the element is associated with. */
export type FormResetHandler = (event: Event) => void

// One entry per mounted control (or `FieldRoot`), keyed by its element, so
// nothing is unregistered: the entry goes with the element.
const controls = new WeakMap<Element, FormResetHandler>()
const fields = new WeakMap<Element, FormResetHandler>()
const listening = new WeakSet<EventTarget>()
const handled = new WeakSet<Event>()

/**
 * Whether `element` is reset with `form`: a descendant belongs to it unless
 * its own `form` attribute points elsewhere, as for a native control.
 */
function isResetWith(element: Element, form: HTMLFormElement) {
  return !element.hasAttribute('form') || (element as HTMLButtonElement).form === form
}

function collect(parent: Element, form: HTMLFormElement, handlers: FormResetHandler[]) {
  for (let element = parent.firstElementChild; element; element = element.nextElementSibling) {
    const field = fields.get(element)
    if (field)
      handlers.push(field)
    const control = controls.get(element)
    if (!control) {
      collect(element, form, handlers)
    }
    // A control owns what is composed inside it (the checkboxes of a group,
    // the field of a picker), so its subtree is not searched.
    else if (isResetWith(element, form)) {
      handlers.push(control)
    }
  }
}

/**
 * The one `reset` listener of a document (or shadow root). It runs where the
 * event stops bubbling, so a `preventDefault()` anywhere on the way is seen,
 * and before the browser resets the native controls.
 */
function handleFormReset(event: Event) {
  const form = event.target as HTMLFormElement | null
  if (event.defaultPrevented || handled.has(event) || form?.localName !== 'form')
    return
  handled.add(event)

  // Collected first: a handler may emit to code that changes the tree.
  const handlers: FormResetHandler[] = []
  collect(form, form, handlers)
  // Controls associated by `form="id"` from outside the form.
  for (const element of Array.from(form.elements)) {
    const control = !form.contains(element) && controls.get(element)
    if (control)
      handlers.push(control)
  }
  for (const handler of handlers)
    handler(event)
}

function listen(target: EventTarget | null | undefined) {
  if (!target || listening.has(target))
    return
  listening.add(target)
  target.addEventListener('reset', handleFormReset)
}

function bind(element: Element, { value, arg }: { value: FormResetHandler | null | undefined, arg?: string }) {
  if (element.nodeType !== 1)
    return
  const registry = arg === 'field' ? fields : controls
  if (registry.get(element) === value)
    return
  if (!value) {
    registry.delete(element)
    return
  }
  registry.set(element, value)
  // `reset` does not cross a shadow root, and never reaches the window from a
  // tree that is not in the document.
  listen(element.ownerDocument.defaultView)
  const root = element.getRootNode()
  if (root !== element.ownerDocument)
    listen(root)
}

/**
 * Binds an element to the native reset of the form it belongs to: the handler
 * runs when that form is reset and the `reset` event was not prevented. One
 * delegated listener per document serves every bound element, and nothing
 * runs on the server.
 *
 * - `v-form-reset="handler"`: a form control. Controls rendered inside its
 *   element are left to it.
 * - `v-form-reset:field="handler"`: a wrapper whose own state resets with the
 *   form (`FieldRoot`); the controls inside it are still reset.
 *
 * A falsy handler binds nothing.
 * @internal
 */
export const vFormReset: ObjectDirective<Element, FormResetHandler | null | undefined> = {
  mounted: bind,
  updated: bind,
}

const FORM_RESET_OWNER: InjectionKey<FormResetHandler> = Symbol('FormResetOwner')

/**
 * Makes this component's handler the one a control it renders as its own
 * element binds (the date field of a picker, the slider of a color slider):
 * that control is driven by this component, which holds the default value.
 * @internal
 */
export function provideFormResetOwner(handler: FormResetHandler) {
  provide(FORM_RESET_OWNER, handler)
}

/** The handler of the component this control is the element of, if any. @internal */
export function injectFormResetOwner(): FormResetHandler | undefined {
  return inject(FORM_RESET_OWNER, undefined)
}
