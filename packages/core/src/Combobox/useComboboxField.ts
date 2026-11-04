import type { ComboboxRootContext } from './ComboboxRoot.vue'
import type { FieldControlBinding } from '@/Field/useFieldControl'
import { mergeProps, nextTick, onBeforeUnmount, watch } from 'vue'
import { createContext, getActiveElement, getElementByIdFrom } from '@/shared'

/**
 * A combobox's participation in an ancestor `FieldRoot`: the root owns the
 * value and the registration, the input carries the field's id, label and
 * aria wiring. `null` outside a Field.
 * @internal
 */
export interface ComboboxFieldContext {
  field: FieldControlBinding
  /** The input's `focus`: focus entering the combobox. */
  onFocus: () => void
  /** The input's `blur`: the field is blurred only once focus leaves the combobox and its content. */
  onBlur: (event: FocusEvent) => void
}

export const [injectComboboxFieldContext, provideComboboxFieldContext]
  = createContext<ComboboxFieldContext | null>('ComboboxRoot', 'ComboboxFieldContext')

/**
 * Provides the Field wiring to the input (`null` without a Field). Focus that
 * moves from the input to another part of the combobox (its trigger, the
 * content or an item) keeps the field focused, so opening the list doesn't
 * mark it touched; it's blurred once focus leaves all of them.
 */
export function provideComboboxField(field: FieldControlBinding | null, context: ComboboxRootContext<any>) {
  if (!field) {
    provideComboboxFieldContext(null)
    return
  }

  function isInside(element: Element | null) {
    if (!element)
      return false
    const parent = context.parentElement.value
    return !!parent?.contains(element) || !!getElementByIdFrom(parent, context.contentId)?.contains(element)
  }

  let focusWithin = false
  function leave() {
    if (!focusWithin)
      return
    focusWithin = false
    field!.onBlur()
  }
  function onBlur(event: FocusEvent) {
    const next = event.relatedTarget as Element | null
    if (isInside(next)) {
      // Follow focus to that part, and decide again when it leaves.
      next!.addEventListener('focusout', onBlur as EventListener, { once: true })
      return
    }
    leave()
  }

  // A part holding focus can unmount with the content (an item, once
  // selected), and not every browser fires `blur` for a removed element.
  watch(context.open, (open) => {
    if (!open && focusWithin) {
      nextTick(() => {
        if (focusWithin && !isInside(getActiveElement(context.parentElement.value)))
          leave()
      })
    }
  })
  onBeforeUnmount(() => {
    focusWithin = false
  })

  provideComboboxFieldContext({
    field,
    onFocus: () => {
      if (focusWithin)
        return
      focusWithin = true
      field.onFocus()
    },
    onBlur,
  })
}

/**
 * The input's attributes inside a Field: the Field's state attributes first
 * (so the input's own `data-*` win), then the input's and the consumer's, then
 * the field's id (unless the consumer set one) and aria ids merged with the
 * consumer's.
 * @internal
 */
export function getComboboxInputFieldAttrs(fieldContext: ComboboxFieldContext, own: Record<string, unknown>, attrs: Record<string, unknown>) {
  const { field } = fieldContext
  return field.fillDataAttributes(mergeProps(
    own,
    attrs,
    {
      id: (attrs.id as string | undefined) ?? field.context.fieldId.value,
      ...field.ariaAttrs(attrs, own.disabled === '' || own.disabled === true),
      onFocus: fieldContext.onFocus,
      onBlur: fieldContext.onBlur,
    },
  ))
}
