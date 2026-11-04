import type { InjectionKey } from 'vue'
import type { FieldControlRegistration, FieldDataAttributes, FieldRootContext } from './FieldRoot.vue'
import { inject, onBeforeUnmount, onMounted, provide } from 'vue'
import { injectFieldRootContext } from './fieldRootContext'

export interface UseFieldControlOptions extends Omit<FieldControlRegistration, 'id'> {
  /** The control's own `id` prop. The field's generated id is used when it's unset. */
  id?: () => string | undefined
  /**
   * Whether this instance acts as the field's control. Read once at mount.
   * A part that shares a field with siblings (e.g. a checkbox in a group)
   * still reports focus, but doesn't register or take the field's id.
   * @defaultValue `() => true`
   */
  participates?: () => boolean
}

export interface FieldControlAriaAttrs {
  'aria-labelledby': string | undefined
  'aria-describedby': string | undefined
  'aria-invalid': unknown
}

export interface FieldControlBinding {
  context: FieldRootContext
  /** The control's own id, else the field's generated id (only while it participates). */
  id: () => string | undefined
  /** The field's `name`, which takes precedence; the control's own when the field has none. */
  name: (own: string | undefined) => string | undefined
  /** Set on either the field or the control. */
  disabled: (own: boolean | undefined) => boolean
  /** Set on either the field or the control. */
  required: (own: boolean | undefined) => boolean
  /** The field's state as data attributes. */
  dataAttributes: () => FieldDataAttributes
  /**
   * Adds the field's state attributes to a control's merged attributes,
   * filling only the keys left unset: a defined value from the control or
   * consumer wins, but an `undefined` one (e.g. the control's own
   * `data-invalid` while it's valid) doesn't erase the field's flag.
   * Keys in `except` are left alone.
   */
  fillDataAttributes: <T extends Record<string, unknown>>(merged: T, except?: string[]) => T
  /**
   * Field aria wiring merged with (never overwriting) the consumer's ids. A
   * consumer-provided `aria-invalid` wins, and a disabled control is never invalid.
   */
  ariaAttrs: (attrs: Record<string, unknown>, disabled?: boolean) => FieldControlAriaAttrs
  onFocus: () => void
  onBlur: () => void
  /** A user-driven value change: marks the field dirty and runs on-change validation. */
  input: (value: unknown) => void
  /** A programmatic/parent-driven value change: only updates `filled`. */
  sync: (value: unknown) => void
}

// The field whose control an ancestor component already is.
const FIELD_CONTROL_OWNER: InjectionKey<FieldRootContext> = Symbol('FieldControlOwner')

function mergeIds(consumerValue: unknown, fieldValue: string | undefined) {
  return [consumerValue as string | undefined, fieldValue].filter(Boolean).join(' ') || undefined
}

/**
 * The ancestor `FieldRoot` a control may bind to: `null` outside a Field, and
 * inside another control of the same field (which owns it). Doesn't claim the
 * field; see `claimFieldControl`.
 * @internal
 */
export function injectFieldForControl(): FieldRootContext | null {
  const context = injectFieldRootContext(null)
  return context && inject(FIELD_CONTROL_OWNER, null) !== context ? context : null
}

/**
 * Marks this component as `context`'s control for its descendants, so a
 * control composed inside it (e.g. a Checkbox in a Combobox item) leaves the
 * field alone. Does nothing for `null`.
 * @internal
 */
export function provideFieldControlOwner(context: FieldRootContext | null) {
  if (context)
    provide(FIELD_CONTROL_OWNER, context)
}

/**
 * The ancestor `FieldRoot` this component is the control of (see
 * `injectFieldForControl`), claimed for its descendants. For a control that
 * binds to the field itself rather than through `useFieldControl`.
 * @internal
 */
export function claimFieldControl(): FieldRootContext | null {
  const context = injectFieldForControl()
  provideFieldControlOwner(context)
  return context
}

/**
 * Optional participation of a Reka control in an ancestor `FieldRoot`.
 * Returns `null` outside a Field, creating no reactive state, so a standalone
 * control pays nothing for it. Also `null` inside another control of the
 * same field (e.g. a `TagsInput` composed into a `Combobox`): the outer
 * control owns the field.
 */
export function useFieldControl(options: UseFieldControlOptions): FieldControlBinding | null {
  const context = claimFieldControl()
  if (!context)
    return null

  const { id: ownId, participates = () => true, ...registration } = options
  const isFilled = (value: unknown) => registration.isFilled
    ? registration.isFilled(value)
    : Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== ''

  let isControl = false
  // Only a part that reports focus without registering clears it itself: a
  // registered control's focus is cleared on unregister.
  let hasFocus = false
  let unregister: (() => void) | undefined

  onMounted(() => {
    isControl = participates()
    if (isControl)
      unregister = context.registerControl({ ...registration, id: () => ownId?.() ?? context.fieldId.value })
  })
  onBeforeUnmount(() => {
    unregister?.()
    // Not every browser fires `blur` for a removed element.
    if (hasFocus && !isControl)
      context.reportControlState({ focused: false })
  })

  return {
    context,
    id: () => ownId?.() ?? (participates() ? context.fieldId.value : undefined),
    name: own => context.name.value ?? own,
    disabled: own => Boolean(own || context.disabled.value),
    required: own => Boolean(own || context.required.value),
    dataAttributes: () => context.dataAttributes.value,
    fillDataAttributes: (merged, except) => {
      const data = context.dataAttributes.value
      for (const key in data) {
        const value = data[key as keyof FieldDataAttributes]
        if (value !== undefined && merged[key] === undefined && !except?.includes(key))
          (merged as Record<string, unknown>)[key] = value
      }
      return merged
    },
    ariaAttrs: (attrs, disabled) => ({
      'aria-labelledby': mergeIds(attrs['aria-labelledby'], participates() ? context.labelId.value : undefined),
      'aria-describedby': mergeIds(attrs['aria-describedby'], context.describedBy.value),
      'aria-invalid': attrs['aria-invalid'] ?? ((context.invalid.value && !disabled) || undefined),
    }),
    onFocus: () => {
      hasFocus = true
      context.handleControlFocus()
    },
    onBlur: () => {
      hasFocus = false
      if (isControl)
        context.handleControlBlur()
      else
        context.reportControlState({ focused: false, touched: true })
    },
    input: (value) => {
      if (isControl)
        context.handleControlInput({ value })
    },
    sync: (value) => {
      if (isControl)
        context.reportControlState({ filled: isFilled(value) })
    },
  }
}
