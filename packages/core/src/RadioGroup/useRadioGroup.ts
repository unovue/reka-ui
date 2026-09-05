import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { RadioGroupItemContext } from './RadioGroupItem.vue'
import type { RadioGroupRootContext } from './RadioGroupRoot.vue'
import type { SelectEvent } from './utils'
import type { BaseChangeReason, ChangeEventDetails, PartSurface, SelectionState } from '@/shared'
import type { AcceptableValue, DataOrientation, Direction } from '@/shared/types'
import { isEqual } from 'ohash'
import { computed, toValue } from 'vue'
import { createPartSurface, selectionState, useControllableState } from '@/shared'
import { handleSelect } from './utils'

/**
 * Why the checked radio changed; carried as `details.reason` on every change (#2828).
 *
 * Only `'item-press'` exists: a radio is checked by clicking it. Arrow-key
 * navigation (`RovingFocusGroup` moving focus) does NOT produce its own reason —
 * `RadioGroupItem.handleFocus` synthesizes a `.click()` on the newly focused item
 * so that the native change event fires, so that path also arrives as
 * `'item-press'` with the synthesized `MouseEvent` as `details.event`.
 */
export type RadioGroupChangeReason = 'item-press'

/** Semantic state of one radio (`data-state` / `data-disabled`). */
export type RadioGroupItemState = { state: SelectionState, disabled: boolean }
/** Semantic state of the group root (`data-disabled`). */
export type RadioGroupState = { disabled: boolean }

/**
 * Inputs of the leaf radio surface. `Radio.vue` feeds its own props in; the
 * group item builder feeds the context-derived values in. Either way the
 * role/aria/`disabled`/`value`/`required`/`name` bindings and the click
 * protocol come from ONE derivation.
 */
export interface RadioSurfaceOptions {
  checked: MaybeRefOrGetter<boolean | undefined>
  disabled?: MaybeRefOrGetter<boolean | undefined>
  required?: MaybeRefOrGetter<boolean | undefined>
  /** The value given as data when submitted with a `name`. */
  value?: MaybeRefOrGetter<AcceptableValue | undefined>
  name?: MaybeRefOrGetter<string | undefined>
  /**
   * The cancellable `radio.select` custom event — a callback channel, never a
   * merged DOM listener. The SFC passes `e => emits('select', e)`; calling
   * `event.preventDefault()` inside blocks the check.
   */
  onSelect?: (event: SelectEvent) => void
  /**
   * DOM-bound (`useFormControl`) — injected as a getter. When the radio sits in
   * a form the click's propagation is stopped so only the hidden input's click
   * propagates (native form validation / form events reflect the update).
   */
  isFormControl?: MaybeRefOrGetter<boolean | undefined>
  /** Fires once a click passed the disabled guard and the select event was not prevented. */
  onCheckedChange?: (checked: true, event: MouseEvent) => void
}

/**
 * Per-item options the group item builder accepts beyond `(context, value,
 * disabled, required)` — the item's own `name` and the DOM-bound seams.
 */
export interface RadioGroupItemSurfaceOptions extends Pick<RadioSurfaceOptions, 'name' | 'onSelect' | 'isFormControl'> {}

/**
 * The leaf radio surface — `role="radio"`, `aria-checked`, `disabled`, `value`,
 * `required`, `name` + the click protocol ported verbatim from `Radio.vue`.
 * Pure: derives everything from its options, safe to call any number of times.
 */
export function getRadioSurface(options: RadioSurfaceOptions): PartSurface<RadioGroupItemState> {
  const checked = computed(() => toValue(options.checked) ?? false)
  const disabled = computed(() => toValue(options.disabled) ?? false)

  function onClick(event: MouseEvent) {
    // `@click.stop` — propagation is stopped BEFORE the disabled guard.
    event.stopPropagation()
    if (disabled.value)
      return

    handleSelect(event, toValue(options.value), (ev) => {
      options.onSelect?.(ev)
      if (ev?.defaultPrevented)
        return

      options.onCheckedChange?.(true, event)
      if (toValue(options.isFormControl)) {
        // if radio is in a form, stop propagation from the button so that we only propagate
        // one click event (from the input). We propagate changes from an input so that native
        // form validation works and form events reflect radio updates.
        ev.stopPropagation()
      }
    })
  }

  return createPartSurface<RadioGroupItemState>(
    () => ({
      'role': 'radio',
      'aria-checked': checked.value,
      // `''` (not `true`) — Radio.vue binds `:disabled="disabled ? '' : undefined"`.
      'disabled': disabled.value ? '' : undefined,
      'value': toValue(options.value),
      'required': toValue(options.required),
      'name': toValue(options.name),
      'onClick': onClick,
    }),
    () => ({ state: selectionState(checked.value), disabled: disabled.value }),
  )
}

/**
 * The per-item surface, derived purely from `(context, value)`: `checked` is
 * `isEqual(context.modelValue, value)` (ohash, so object values match
 * structurally), `disabled`/`required` inherit from the group. Composes
 * `getRadioSurface` so `RadioGroupItem.vue` (state) and `Radio.vue` (attrs)
 * share the derivation with a standalone `useRadioGroup().getItemSurface()`.
 * Adds the `Enter` `preventDefault` of `RadioGroupItem`'s `@keydown.enter.prevent`.
 */
export function getRadioGroupItemSurface(
  context: RadioGroupRootContext,
  value: MaybeRefOrGetter<AcceptableValue | undefined>,
  disabled?: MaybeRefOrGetter<boolean | undefined>,
  required?: MaybeRefOrGetter<boolean | undefined>,
  options: RadioGroupItemSurfaceOptions = {},
): PartSurface<RadioGroupItemState> {
  const checked = computed(() => isEqual(context.modelValue?.value, toValue(value)))
  const isDisabled = computed(() => context.disabled.value || (toValue(disabled) ?? false))
  const isRequired = computed(() => context.required.value || (toValue(required) ?? false))

  const radio = getRadioSurface({
    checked,
    disabled: isDisabled,
    required: isRequired,
    value,
    name: options.name,
    onSelect: options.onSelect,
    isFormControl: options.isFormControl,
    onCheckedChange: (_checked, event) => context.changeModelValue(toValue(value), 'item-press', event),
  })

  return createPartSurface<RadioGroupItemState>(
    () => ({
      ...radio.props.value,
      // `@keydown.enter.prevent` — no modifier guard today; do not add one.
      onKeydown: (event: KeyboardEvent) => {
        if (event.key === 'Enter')
          event.preventDefault()
      },
    }),
    radio.state,
  )
}

/**
 * Indicator surface derived from the item context — the single derivation
 * shared by `RadioGroupIndicator.vue` and standalone consumers (`data-state` /
 * `data-disabled` only; no props).
 */
export function getRadioGroupIndicatorSurface(itemContext: Pick<RadioGroupItemContext, 'checked' | 'disabled'>): PartSurface<RadioGroupItemState> {
  return createPartSurface<RadioGroupItemState>(
    () => ({}),
    () => ({ state: selectionState(itemContext.checked.value), disabled: itemContext.disabled.value }),
  )
}

export interface UseRadioGroupProps {
  /**
   * Controlled checked value. A getter/ref resolving to `undefined` is
   * uncontrolled; a writable `Ref` (with no `emit`/`onUpdate`) is written back
   * ("ref-owned").
   */
  modelValue?: MaybeRefOrGetter<AcceptableValue | undefined>
  /** Initial value when uncontrolled. */
  defaultValue?: AcceptableValue
  /** When `true`, prevents the user from interacting with radio items. */
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** When `true`, a value must be set before the owning form can be submitted. */
  required?: MaybeRefOrGetter<boolean | undefined>
  /** The orientation of the group (`aria-orientation`). */
  orientation?: MaybeRefOrGetter<DataOrientation | undefined>
  /** When `true`, keyboard navigation loops from last item to first, and vice versa. @defaultValue `true` */
  loop?: MaybeRefOrGetter<boolean | undefined>
  /** Resolved reading direction (the SFC hands its `useDirection` ref). @defaultValue `'ltr'` */
  dir?: MaybeRefOrGetter<Direction | undefined>
  /** Form field name. Snapshotted into `context.name` at call time (as `RadioGroupRoot` always did). */
  name?: MaybeRefOrGetter<string | undefined>
  /** Component `emit`; receives `beforeUpdate:modelValue` then `update:modelValue`. */
  emit?: (event: any, ...args: any[]) => void
  /** Called before a change commits; `details.cancel()` vetoes it. */
  onBeforeUpdate?: (value: AcceptableValue | undefined, details: ChangeEventDetails<RadioGroupChangeReason>) => void
  /** Called after a change commits. */
  onUpdate?: (value: AcceptableValue | undefined, details: ChangeEventDetails<RadioGroupChangeReason>) => void
}

export interface UseRadioGroupReturn {
  modelValue: ComputedRef<AcceptableValue | undefined>
  disabled: ComputedRef<boolean>
  required: ComputedRef<boolean>
  orientation: ComputedRef<DataOrientation | undefined>
  /**
   * Check a radio by value; returns `false` when unchanged or cancelled. The
   * caller gates disabled concerns (the item surface's `onClick` does).
   */
  selectValue: (value: AcceptableValue | undefined, reason?: RadioGroupChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Details of the last change attempt; initially `{ reason: 'none' }`. */
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<RadioGroupChangeReason>>>
  isControlled: ComputedRef<boolean>
  /** `role="radiogroup"` + `aria-orientation` / `aria-required` / `dir`; `data-disabled` from state. */
  root: PartSurface<RadioGroupState>
  /** Per-item radio surface built from `(context, value)`. */
  getItemSurface: (
    value: MaybeRefOrGetter<AcceptableValue | undefined>,
    disabled?: MaybeRefOrGetter<boolean | undefined>,
    required?: MaybeRefOrGetter<boolean | undefined>,
  ) => PartSurface<RadioGroupItemState>
  context: RadioGroupRootContext
}

/**
 * Headless RadioGroup logic. The `.vue` shells compose this; a standalone
 * consumer gets role/aria/selection and the click protocol, but must still wrap
 * items in `RovingFocusGroup`/`RovingFocusItem` for arrow-key navigation (and
 * the focus → click synthesis that checks the focused radio) and the indicator
 * in `Presence` — component families a pure composable cannot absorb.
 *
 * SSR-safe (no `document`/`window` at call scope) and callable outside
 * `setup()` — computed-only.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useRadioGroup(props: UseRadioGroupProps = {}): UseRadioGroupReturn {
  const { state: modelValue, setState, lastChangeDetails, isControlled } = useControllableState<AcceptableValue | undefined, RadioGroupChangeReason>({
    prop: props.modelValue,
    defaultValue: props.defaultValue,
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
  })
  const disabled = computed(() => toValue(props.disabled) ?? false)
  const required = computed(() => toValue(props.required) ?? false)
  const orientation = computed(() => toValue(props.orientation))
  const loop = computed(() => toValue(props.loop) ?? true)
  const dir = computed<Direction>(() => toValue(props.dir) ?? 'ltr')

  function selectValue(value: AcceptableValue | undefined, reason: RadioGroupChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setState(value, reason, event)
  }

  const context: RadioGroupRootContext = {
    modelValue,
    changeModelValue: selectValue,
    disabled: disabled as unknown as Ref<boolean>,
    loop: loop as unknown as Ref<boolean>,
    orientation: orientation as unknown as Ref<DataOrientation | undefined>,
    // Snapshot, not a getter — `RadioGroupRoot` always provided `name?.value`.
    name: toValue(props.name),
    required: required as unknown as Ref<boolean>,
  }

  const root = createPartSurface<RadioGroupState>(
    () => ({
      'role': 'radiogroup',
      'aria-orientation': orientation.value,
      // Pass-through (not `|| undefined`) to match RadioGroupRoot's `:aria-required`
      // exactly: undefined omits, `false` renders "false".
      'aria-required': toValue(props.required),
      'dir': dir.value,
    }),
    () => ({ disabled: disabled.value }),
  )

  return {
    modelValue,
    disabled,
    required,
    orientation,
    selectValue,
    lastChangeDetails,
    isControlled,
    root,
    getItemSurface: (value, itemDisabled, itemRequired) => getRadioGroupItemSurface(context, value, itemDisabled, itemRequired),
    context,
  }
}
