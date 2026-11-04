import type { InjectionKey, Ref } from 'vue'
import type { FieldRootContext } from './FieldRoot.vue'
import type { FieldControlBinding } from './useFieldControl'
import { inject, nextTick, provide, watch } from 'vue'
import { getActiveElement } from '@/shared'

export interface FieldFocusWithin {
  /** Whether focus is currently inside the control's own element (not an extension). */
  isFocusWithin: () => boolean
  /** Bind as the element's `@focusin`. */
  onFocusin: (event: FocusEvent) => void
  /** Bind as the element's `@focusout`. */
  onFocusout: (event: FocusEvent) => void
}

/** What `useFieldFocusWithin` reports to: a control's field binding, or an adapter with the same calls. */
export type FieldFocusTarget = Pick<FieldControlBinding, 'onFocus' | 'onBlur'> & {
  context: Pick<FieldRootContext, 'reportControlState'>
}

/**
 * Elements outside a control's own element that focus can move into without
 * leaving the control, provided by a component composing it (e.g. a picker's
 * trigger and portaled popover content around its date field).
 * @internal
 */
export interface FieldFocusExtension {
  /** The extension's elements, those that are mounted. */
  elements: () => Array<HTMLElement | null | undefined>
  /** Whether the extension is open. When it closes with focus inside, where focus went is re-checked. */
  open: () => boolean
}

const FIELD_FOCUS_EXTENSION: InjectionKey<FieldFocusExtension> = Symbol('FieldFocusExtension')

/**
 * Makes `extension`'s elements count as inside the field control a descendant
 * tracks with `useFieldFocusWithin`.
 * @internal
 */
export function provideFieldFocusExtension(extension: FieldFocusExtension) {
  provide(FIELD_FOCUS_EXTENSION, extension)
}

/**
 * Group-level focus reporting for a Field control made of several focusable
 * parts (segments, slots, a preview and an input): the field is focused while
 * focus is anywhere inside `element`, and touched (blurred) only once focus
 * leaves it. Moving between parts reports nothing. A provided
 * `FieldFocusExtension` (see `provideFieldFocusExtension`) counts as part of
 * the control: focus moving into it, or entering it directly, is followed
 * there, and the field is blurred once focus leaves both.
 *
 * Bind `onFocusin`/`onFocusout` on the element in the template, so they run in
 * order with a consumer's listeners and stay attached for the `focusout` an
 * element being removed fires. Native listeners are attached too, as soon as
 * the element exists: Vue skips an invoker attached in the millisecond of the
 * event's first invoker (here a part's), which would leave the state out of
 * step with the document. Each event is handled once.
 *
 * `extension` is for a control that owns its own popup (e.g. a Select's
 * trigger and its content); it defaults to the one a composing component
 * provides.
 *
 * Returns `null` without a binding (outside a Field), creating nothing.
 */
export function useFieldFocusWithin(field: FieldFocusTarget | null, element: Ref<HTMLElement | undefined>, ownExtension?: FieldFocusExtension): FieldFocusWithin | null {
  if (!field)
    return null

  const extension = ownExtension ?? inject(FIELD_FOCUS_EXTENSION, null)
  // Where focus is: outside the control, in its element, or in an extension.
  let focus: 'out' | 'element' | 'extension' = 'out'
  let followed: HTMLElement | undefined
  const handledEvents = new WeakSet<Event>()

  function extensionElementOf(node: Node | null) {
    if (!extension || !node)
      return undefined
    return extension.elements().find(el => el?.contains(node)) ?? undefined
  }

  // A focused part can be removed while the element stays (an item, a thumb),
  // and not every browser fires `focusout` for a removed element: while focus
  // is inside, a removal that takes focus with it leaves the field.
  let observer: MutationObserver | undefined
  function watchRemovals() {
    if (observer || !element.value || typeof MutationObserver === 'undefined')
      return
    observer = new MutationObserver(() => {
      if (focus === 'element' && !element.value?.contains(getActiveElement(element.value))) {
        unwatchRemovals()
        focus = 'out'
        field!.context.reportControlState({ focused: false })
      }
    })
    observer.observe(element.value, { childList: true, subtree: true })
  }
  function unwatchRemovals() {
    observer?.disconnect()
    observer = undefined
  }

  function stopFollowing() {
    followed?.removeEventListener('focusout', onExtensionFocusout)
    followed = undefined
  }

  // Follows focus into an extension element, to decide again when it leaves.
  function follow(el: HTMLElement) {
    if (followed === el)
      return
    stopFollowing()
    followed = el
    el.addEventListener('focusout', onExtensionFocusout)
  }

  // Not skipped when focus is already out: an element being removed fires its
  // `focusout` after the cleanup below has reset the state, and that's a blur.
  function leave() {
    stopFollowing()
    unwatchRemovals()
    focus = 'out'
    field!.onBlur()
  }

  function moveTo(next: Node | null) {
    if (element.value?.contains(next)) {
      // The element's `focusin` takes it from here.
      stopFollowing()
      return
    }
    const target = extensionElementOf(next)
    if (target) {
      unwatchRemovals()
      focus = 'extension'
      follow(target)
      return
    }
    leave()
  }

  function onFocusin(event: FocusEvent) {
    if (handledEvents.has(event))
      return
    handledEvents.add(event)
    if (focus === 'out')
      field!.onFocus()
    focus = 'element'
    stopFollowing()
    watchRemovals()
  }

  function onFocusout(event: FocusEvent) {
    if (handledEvents.has(event))
      return
    handledEvents.add(event)
    moveTo(event.relatedTarget as Node | null)
  }

  // Focus can also enter an extension element without passing through the
  // element (a trigger outside a picker's segments): that focuses the field too.
  function onDocumentFocusin(event: FocusEvent) {
    if (focus !== 'out')
      return
    const target = (event.composedPath()[0] ?? event.target) as Node | null
    if (element.value?.contains(target))
      return
    const extensionElement = extensionElementOf(target)
    if (!extensionElement)
      return
    field!.onFocus()
    focus = 'extension'
    follow(extensionElement)
  }

  function onExtensionFocusout(event: FocusEvent) {
    const next = event.relatedTarget as Node | null
    if (followed?.contains(next))
      return
    moveTo(next)
  }

  if (extension) {
    // An extension holding focus can close (an Escape, a pick that closes the
    // popover), and not every browser fires `focusout` for a removed element.
    watch(extension.open, (open) => {
      if (open || focus !== 'extension')
        return
      nextTick(() => {
        if (focus !== 'extension')
          return
        const active = getActiveElement(element.value)
        if (followed?.isConnected && followed.contains(active))
          return
        if (element.value?.contains(active)) {
          focus = 'element'
          stopFollowing()
          watchRemovals()
          return
        }
        moveTo(active)
      })
    })
  }

  watch(element, (el, _, onCleanup) => {
    if (!el)
      return
    el.addEventListener('focusin', onFocusin)
    el.addEventListener('focusout', onFocusout)
    const doc = el.ownerDocument
    if (extension)
      doc.addEventListener('focusin', onDocumentFocusin, true)
    onCleanup(() => {
      el.removeEventListener('focusin', onFocusin)
      el.removeEventListener('focusout', onFocusout)
      doc.removeEventListener('focusin', onDocumentFocusin, true)
      stopFollowing()
      unwatchRemovals()
      // The element is going away (an `as` or as-child change, or unmount), and not every
      // browser fires `focusout` for a removed element, so focus can't still be inside it.
      if (focus !== 'out') {
        focus = 'out'
        field!.context.reportControlState({ focused: false })
      }
    })
  }, { flush: 'sync', immediate: true })

  return {
    isFocusWithin: () => focus === 'element',
    onFocusin,
    onFocusout,
  }
}
